import { test, beforeEach, after, mock } from "node:test";
import assert from "node:assert/strict";
let calls, response, rejection;
class ApiError extends Error { constructor(options) { super(options.message); Object.assign(this, options); } }
async function call(method, endpoint, body, options) {calls.push({method,endpoint,body,options});if(rejection)throw rejection;return response;}
mock.module("../../src/services/apiClient.js", {exports:{
 apiGet:(endpoint,options)=>call("GET",endpoint,undefined,options),
 apiPost:(endpoint,body,options)=>call("POST",endpoint,body,options),
 apiDelete:(endpoint,options)=>call("DELETE",endpoint,options.body,options),
 API_BASE_URL:"http://example.invalid/api",ApiError,AUTH_SESSION_INVALID_EVENT:"session-invalid",
}});
const api=await import("../../src/services/Training/trainingDocumentApiService.js");
const originalFetch=globalThis.fetch;
const initial={id:"training-123",rowVersion:"AAAAAAAAAAE=",title:"Original",supportingDocuments:[{id:"old-doc",name:"Keep"}],certificationRelationships:[{id:"relationship"}]};
const saved={...initial,rowVersion:"AAAAAAAAAAI=",supportingDocuments:[...initial.supportingDocuments,{id:"new-doc"}]};
const pdf=()=>new File(["%PDF-1.7\n%%EOF"],"new.pdf",{type:"application/pdf"});
beforeEach(()=>{calls=[];response={data:{training:saved}};rejection=null;globalThis.fetch=originalFetch;});
after(()=>{globalThis.fetch=originalFetch;});
test("multipart upload uses installed PDF route and authoritative rowVersion",async()=>{
 const result=await api.uploadTrainingDocument(initial,pdf(),{name:"Evidence",documentType:"other",description:"A PDF",visibility:"private"});
 assert.equal(calls.length,1);assert.equal(calls[0].method,"POST");assert.equal(calls[0].endpoint,"/trainings/training-123/documents");
 assert.ok(calls[0].body instanceof FormData);assert.equal(calls[0].body.get("rowVersion"),initial.rowVersion);assert.equal(calls[0].body.get("file").name,"new.pdf");
 assert.equal(calls[0].body.get("name"),"Evidence");assert.equal(calls[0].body.get("visibility"),"private");assert.equal(calls[0].options.headers,undefined);assert.equal(result.training.rowVersion,saved.rowVersion);
});
test("delete sends rowVersion in the shared client's request body",async()=>{await api.deleteTrainingDocument(initial,"old-doc");assert.equal(calls[0].method,"DELETE");assert.equal(calls[0].endpoint,"/trainings/training-123/documents/old-doc");assert.deepEqual(calls[0].body,{rowVersion:initial.rowVersion});});
test("upload then delete uses the new SQL version",async()=>{const uploaded=await api.uploadTrainingDocument(initial,pdf());await api.deleteTrainingDocument(uploaded.training,"new-doc");assert.equal(calls[1].body.rowVersion,saved.rowVersion);});
test("document refresh retains unsaved title, notes and relationships",()=>{
 const draft={...initial,title:"Unsaved title",privateInformation:{notes:"Unsaved notes"}};
 const merged=api.mergeTrainingDocumentResult(draft,saved);assert.equal(merged.title,"Unsaved title");assert.deepEqual(merged.privateInformation,draft.privateInformation);assert.deepEqual(merged.certificationRelationships,draft.certificationRelationships);assert.deepEqual(merged.supportingDocuments,saved.supportingDocuments);assert.equal(merged.rowVersion,saved.rowVersion);assert.equal(draft.supportingDocuments.length,1);
});
test("failed request does not mutate the supplied Training",async()=>{const before=structuredClone(initial);rejection=Object.assign(new Error("Training changed"),{status:409});await assert.rejects(api.deleteTrainingDocument(initial,"old-doc"),e=>e.status===409);assert.deepEqual(initial,before);});
test("identity mismatch is rejected",()=>assert.throws(()=>api.mergeTrainingDocumentResult(initial,{...saved,id:"different"})));
test("missing version never issues an upload or deletion",async()=>{await assert.rejects(api.uploadTrainingDocument({...initial,rowVersion:""},pdf()));await assert.rejects(api.deleteTrainingDocument({...initial,rowVersion:""},"old-doc"));assert.equal(calls.length,0);});
for(const [label,file] of [["non-PDF",()=>new File(["text"],"a.txt",{type:"text/plain"})],["empty",()=>new File([],"empty.pdf",{type:"application/pdf"})],["oversized",()=>new File([new Uint8Array(15*1024*1024+1)],"large.pdf",{type:"application/pdf"})]])test(`rejects ${label} upload before sending`,async()=>{await assert.rejects(api.uploadTrainingDocument(initial,file()));assert.equal(calls.length,0);});
test("invalid mutation response requires reloading instead of accepting bad state",async()=>{response={data:{training:{...saved,id:"other"}}};await assert.rejects(api.uploadTrainingDocument(initial,pdf()),/Reopen Edit/);});
test("document listing unwraps only a document array",async()=>{response={data:{documents:[]}};assert.deepEqual(await api.fetchTrainingDocuments(initial.id),[]);response={data:{documents:{}}};await assert.rejects(api.fetchTrainingDocuments(initial.id));});
test("PDF preview requests use cookies, no-store, the installed download route and cancellation",async()=>{const controller=new AbortController();let request;globalThis.fetch=async(url,options)=>{request={url,options};return new Response(new Blob(["%PDF"],{type:"application/pdf"}),{status:200});};const blob=await api.loadTrainingPdf(initial.id,"doc",{signal:controller.signal});assert.equal(blob.type,"application/pdf");assert.equal(request.url,"http://example.invalid/api/trainings/training-123/documents/doc/download");assert.equal(request.options.credentials,"include");assert.equal(request.options.cache,"no-store");assert.equal(request.options.signal,controller.signal);});
test("JSON error responses cannot be used as PDF previews",async()=>{globalThis.fetch=async()=>new Response(JSON.stringify({message:"Document not found"}),{status:404,headers:{"Content-Type":"application/json"}});await assert.rejects(api.loadTrainingPdf(initial.id,"missing"),e=>e.status===404 && e.message==="Document not found");});
test("successful response with wrong content type is rejected",async()=>{globalThis.fetch=async()=>new Response("HTML",{status:200,headers:{"Content-Type":"text/html"}});await assert.rejects(api.loadTrainingPdf(initial.id,"doc"),/did not return a PDF/);});
test("cleanup-pending result remains a successful metadata deletion",async()=>{response={data:{training:{...saved,supportingDocuments:[]},cleanupPending:true}};const result=await api.deleteTrainingDocument(initial,"old-doc");assert.equal(result.cleanupPending,true);assert.deepEqual(result.training.supportingDocuments,[]);});
