import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./TrainingPdfCard.css";
import { loadTrainingPdf } from "../../../../services/Training/trainingDocumentApiService.js";

function PdfViewer({ url, fileName, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = window.document.activeElement;
    dialog.current?.querySelector("button")?.focus();
    return () => previous?.isConnected && previous.focus?.();
  }, []);
  function handleKey(event) {
    if (event.key === "Escape") { event.stopPropagation(); onClose(); }
    if (event.key === "Tab") {
      const controls = dialog.current?.querySelectorAll('button,a[href],iframe');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && window.document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && window.document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  return createPortal(
    <div className="training-pdf-overlay" onKeyDown={handleKey}>
      <section ref={dialog} className="training-pdf-dialog" role="dialog" aria-modal="true" aria-label={`PDF: ${fileName}`}>
        <header><strong>{fileName}</strong><a href={url} download={fileName}>Download</a><button type="button" onClick={onClose}>Close</button></header>
        <iframe title={fileName} src={url} />
      </section>
    </div>, window.document.body,
  );
}

export default function TrainingPdfCard({ trainingId, document, disabled = false, onRemove }) {
  const [asset, setAsset] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [retry, setRetry] = useState(0);
  const [viewing, setViewing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const removeLock = useRef(false);
  const fileName = document.fileName || document.originalFileName || "Training document.pdf";
  const url = asset?.trainingId === trainingId && asset?.documentId === document.id ? asset.url : "";
  useEffect(() => {
    let active = true, created;
    const controller = new AbortController();
    loadTrainingPdf(trainingId, document.id, {signal:controller.signal}).then(blob => {
      if (!active) return;
      created = URL.createObjectURL(blob);
      setAsset({ trainingId, documentId: document.id, url: created });
    }).catch(error => {
      if (active && error.name !== "AbortError") setLoadError(error.publicMessage || error.message || "PDF could not be loaded.");
    });
    return () => { active = false; controller.abort(); if (created) URL.revokeObjectURL(created); };
  }, [trainingId, document.id, retry]);
  async function remove() {
    if (disabled || removeLock.current || typeof onRemove !== "function") return;
    if (!window.confirm(`Remove "${fileName}" from this Training? This deletes its Training-owned PDF. Certification files will not be changed.`)) return;
    removeLock.current = true; setRemoving(true); setActionError("");
    try { await onRemove(document); setViewing(false); }
    catch (error) { setActionError(error.publicMessage || error.message || "Document could not be removed."); }
    finally { removeLock.current = false; setRemoving(false); }
  }
  return <article className="training-pdf-card">
    <button type="button" className="training-pdf-thumb" disabled={!url} onClick={() => setViewing(true)} aria-label={`View ${fileName}`}>
      {url ? <object data={`${url}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" aria-label="PDF thumbnail">PDF</object> : <span>{loadError ? "Preview unavailable" : "Loading PDF…"}</span>}
      <span className="training-pdf-thumb-hit" aria-hidden="true" />
    </button>
    <div className="training-pdf-info"><small>Uploaded to Training · PDF · {document.visibility || "private"}</small><strong>{document.name || fileName}</strong><span>{fileName}</span>{document.description && <p>{document.description}</p>}</div>
    <div className="training-pdf-actions">
      <button type="button" disabled={!url || removing} onClick={() => setViewing(true)}>View document</button>
      {url ? <a href={url} download={fileName}>Download</a> : <span>Download unavailable</span>}
      {onRemove && <button type="button" disabled={disabled || removing} onClick={remove}>{removing ? "Removing…" : "Remove"}</button>}
    </div>
    {loadError && <p role="alert">{loadError} <button type="button" onClick={() => { setLoadError(""); setRetry(value => value + 1); }}>Retry preview</button></p>}
    {actionError && <p role="alert">{actionError}</p>}
    {viewing && url && <PdfViewer url={url} fileName={fileName} onClose={() => setViewing(false)} />}
  </article>;
}
