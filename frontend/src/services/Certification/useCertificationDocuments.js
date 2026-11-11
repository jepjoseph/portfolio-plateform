import {useCallback,useEffect,useState} from 'react';
import {fetchCertificationDocuments} from './certificationApiService.js';
export function normalizeBackendCertificationDocument(document) {
  const mime=document.mimeType||'';
  return {...document,fileName:document.originalFileName||document.fileName||document.name,
    previewMode:mime==='application/pdf'?'pdf':mime.startsWith('image/')?'image':/word|officedocument/.test(mime)?'word':'document'};
}
export function selectCertificationPreview(documents) {
  const active=documents.filter(d=>d.status!=='archived');
  return active.find(d=>d.documentType==='certificate'&&d.isPrimary)||active.find(d=>d.documentType==='certificate')||active.find(d=>d.isPrimary)||active[0]||null;
}
export function useCertificationDocuments(certificationId) {
  const [documents,setDocuments]=useState([]),[status,setStatus]=useState(certificationId?'loading':'success'),[error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  const refresh=useCallback(()=>setRevision(value=>value+1),[]);
  useEffect(()=>{
    const changed=event=>{if(event.detail?.certificationId===certificationId)refresh();};
    window.addEventListener('certification-documents-changed',changed);
    return ()=>window.removeEventListener('certification-documents-changed',changed);
  },[certificationId,refresh]);
  useEffect(()=>{
    let active=true;
    setDocuments([]);setError('');
    if(!certificationId){setStatus('success');return;}
    setStatus('loading');
    fetchCertificationDocuments(certificationId).then(rows=>{
      if(!Array.isArray(rows))throw new Error('Invalid Certification document list.');
      if(active){setDocuments(rows.map(normalizeBackendCertificationDocument));setStatus('success');}
    }).catch(failure=>{if(active){setError(failure.publicMessage||failure.message||'Documents could not be loaded.');setStatus('error');}});
    return ()=>{active=false;};
  },[certificationId,revision]);
  return {documents,status,error,refresh};
}
