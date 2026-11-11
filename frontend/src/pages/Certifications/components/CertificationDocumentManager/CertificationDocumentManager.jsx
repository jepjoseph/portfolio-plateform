import {useState} from 'react';
import './CertificationDocumentManager.css';
import {deleteCertificationDocumentApi,updateCertificationDocumentApi} from '../../../../services/Certification/certificationApiService.js';
import {useCertificationDocuments} from '../../../../services/Certification/useCertificationDocuments.js';
import CertificationDocumentPreview from '../CertificationDocumentPreview/CertificationDocumentPreview.jsx';
import CertificationDocumentViewer from '../CertificationDocumentViewer/CertificationDocumentViewer.jsx';
export default function CertificationDocumentManager({certificationId,uploads,setUploads,disabled=false}) {
  const {documents,status,error,refresh}=useCertificationDocuments(certificationId);
  const [documentType,setDocumentType]=useState('supporting'),[working,setWorking]=useState(false),[message,setMessage]=useState(''),[viewing,setViewing]=useState(null);
  const active=documents.filter(d=>d.status!=='archived');
  const official=active.some(d=>d.documentType==='certificate');
  const pendingOfficial=uploads.some(d=>d.documentType==='certificate');
  async function action(document,updates) {
    if(working||disabled)return;
    if(!updates&&!window.confirm(`Remove "${document.fileName}"? The Certification and its Training relationships will remain.`))return;
    if(updates?.documentType==='certificate'&&official&&!window.confirm('Make this the official certificate? Other existing certificate files will be retained as supporting documents.'))return;
    setWorking(true);setMessage('');
    try {
      if(updates)await updateCertificationDocumentApi(certificationId,document.id,updates);
      else await deleteCertificationDocumentApi(certificationId,document.id);
      setMessage(updates?'Document settings saved.':'Document removed.');refresh();
    }catch(failure){setMessage(failure.publicMessage||failure.message||'Document operation failed.');}
    finally{setWorking(false);}
  }
  function select(event) {
    const files=Array.from(event.target.files||[]);event.target.value='';setMessage('');
    const accepted=[];
    for(const file of files) {
      if(!/\.(pdf|doc|docx|jpe?g|png|webp)$/i.test(file.name)||file.size<1||file.size>10*1024*1024){setMessage('Use PDF, Word, JPG, PNG or WebP files up to 10 MB.');continue;}
      if(documentType==='certificate'&&(accepted.length||pendingOfficial)){setMessage('Stage one official certificate at a time.');break;}
      if(documentType!=='certificate'&&active.length+uploads.length+accepted.length>=20){setMessage('At most 20 active documents are allowed.');break;}
      if(uploads.concat(accepted).some(d=>d.file.name===file.name)){setMessage('That file is already selected.');continue;}
      accepted.push({file,name:file.name,documentType,isPrimary:documentType==='certificate'||(!official&&!active.length&&!uploads.length&&!accepted.length)});
    }
    setUploads(current=>[...current,...accepted]);
  }
  return (
    <section className="cdm" aria-label="Certificate Documents">
      <header className="cdm-header">
        <div>
          <span className="cdm-eyebrow">Documents</span>
          <h3>Certificate Documents</h3>
          <p>Keep your official certificate and supporting evidence together.</p>
        </div>
        {status==='success'&&<span className="cdm-count">{active.length} attached</span>}
      </header>

      <div className="cdm-composer">
        <label className="cdm-field cdm-upload-type">
          <span>Document type</span>
          <select aria-label="Document type" value={documentType} onChange={e=>setDocumentType(e.target.value)} disabled={disabled||working}>
            <option value="supporting">Supporting document / exam result</option>
            <option value="certificate">Official certificate</option>
          </select>
          <small>{documentType==='certificate' ? 'Replaces the current official certificate.' : 'Adds evidence without replacing other files.'}</small>
        </label>
        <label className="cdm-upload">
          <input aria-label="Select certificate documents" type="file" multiple={documentType==='supporting'} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={select} disabled={disabled||working||(Boolean(certificationId)&&status!=='success')}/>
          <span className="cdm-upload-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 16V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg></span>
          <span className="cdm-upload-copy"><strong>Choose files to upload</strong><small>PDF, Word or image · Up to 10 MB per file</small></span>
          <span className="cdm-browse" aria-hidden="true">Browse files</span>
        </label>
      </div>
      <p className="cdm-hint"><span aria-hidden="true">ⓘ</span> New files upload with Save Changes. Document settings and Remove save immediately.</p>
      {status==='loading'&&<p className="cdm-notice" role="status">Loading saved documents…</p>}
      {status==='error'&&<p className="cdm-notice cdm-notice--error" role="alert">{error} <button type="button" onClick={refresh}>Retry documents</button></p>}
      {message&&<p className="cdm-notice" role="status">{message}</p>}
      {status==='success'&&!documents.length&&<div className="cdm-empty"><strong>No documents attached yet</strong><p>Choose a file above to add your first certificate or exam result.</p></div>}

      {documents.length>0&&<div className="cdm-list-heading"><h4>Attached documents</h4><span>Official certificates take preview priority</span></div>}
      <div className="cdm-grid">
        {documents.map(document=>(
          <article className={`cdm-card${document.isPrimary?' cdm-card--primary':''}`} key={document.id}>
            <div className="cdm-preview"><CertificationDocumentPreview document={document} onView={setViewing}/></div>
            <div className="cdm-card-body">
              <div className="cdm-card-badges">
                <span className={`cdm-badge${document.documentType==='certificate'?' cdm-badge--official':''}`}>{document.documentType==='certificate'?'Official certificate':'Supporting document'}</span>
                {document.status==='archived'?<span className="cdm-badge cdm-badge--muted">Archived</span>:document.isPrimary&&<span className="cdm-badge cdm-badge--preview"><span aria-hidden="true">●</span> Current preview</span>}
              </div>
              <strong className="cdm-file-name" title={document.fileName}>{document.name||document.fileName}</strong>
              <p className="cdm-file-detail">{document.name&&document.name!==document.fileName&&<>{document.fileName} · </>}{document.fileName?.split('.').pop()?.toUpperCase()||'Document'}{document.fileSize?` · ${(document.fileSize/1024).toFixed(0)} KB`:''}</p>
              <label className="cdm-field cdm-card-type"><span>Document type</span><select aria-label={`Type: ${document.fileName}`} value={document.documentType==='certificate'?'certificate':'supporting'} disabled={disabled||working||document.status==='archived'} onChange={e=>action(document,{documentType:e.target.value})}><option value="supporting">Supporting document</option><option value="certificate">Official certificate</option></select></label>
              <div className="cdm-actions">
                <button className="cdm-button cdm-button--view" type="button" onClick={()=>setViewing(document)}>View / Download</button>
                <button className="cdm-button" type="button" disabled={disabled||working||document.status==='archived'||document.isPrimary||(official&&document.documentType!=='certificate')} onClick={()=>action(document,{isPrimary:true})}>Use for preview</button>
                <button className="cdm-button cdm-button--danger" type="button" disabled={disabled||working} onClick={()=>action(document)}>Remove</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {uploads.length>0&&<div className="cdm-pending">
        <div className="cdm-list-heading"><h4>Ready to upload</h4><span className="cdm-badge cdm-badge--pending">Pending Save Changes</span></div>
        {uploads.map((upload,index)=>(<div className="cdm-pending-row" key={`${upload.file.name}-${index}`}>
          <span className="cdm-pending-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Zm0 0v5h5M8 13h8M8 17h5"/></svg></span>
          <div className="cdm-pending-copy"><strong>{upload.file.name}</strong><small>{upload.documentType==='certificate'?'Official certificate replacement':'Supporting document'}{upload.isPrimary?' · Selected preview':''}</small></div>
          <div className="cdm-actions"><button className="cdm-button" type="button" disabled={disabled||working||pendingOfficial||official} onClick={()=>setUploads(current=>current.map((item,i)=>({...item,isPrimary:i===index})))}>Use for preview</button><button className="cdm-button cdm-button--danger" type="button" disabled={disabled||working} onClick={()=>setUploads(current=>current.filter((_,i)=>i!==index))}>Remove selected file</button></div>
        </div>))}
      </div>}
      {viewing&&<CertificationDocumentViewer document={viewing} onClose={()=>setViewing(null)}/>}
    </section>
  );
}
