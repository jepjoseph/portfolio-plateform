import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadEducationPdf } from "../../../../services/Education/educationApiService.js";
import "./EducationDocumentPreviewModal.css";

function EducationDocumentPreviewModal({ educationId, document: educationDocument, onClose }) {
  const titleId = useId();
  const closeRef = useRef(null);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setStatus("loading");
    setUrl("");
    setError("");
    async function load() {
      try {
        if (!educationId || !educationDocument?.id || educationDocument.storageProvider !== "education-api") {
          throw new Error("This viewer supports Education API documents only.");
        }
        const blob = await loadEducationPdf(educationId, educationDocument.id);
        objectUrl = URL.createObjectURL(blob);
        if (active) {
          setUrl(objectUrl);
          setStatus("ready");
        } else {
          URL.revokeObjectURL(objectUrl);
          objectUrl = "";
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.message || "Unable to load PDF.");
          setStatus("error");
        }
      }
    }
    load();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [educationId, educationDocument?.id, educationDocument?.storageProvider]);

  useEffect(() => {
    const previousFocus = window.document.activeElement;
    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    const onKeyDown = (event) => { if (event.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  const name = educationDocument?.name || educationDocument?.fileName || "Education PDF";
  const download = () => {
    if (!url) return;
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = educationDocument?.fileName || name;
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return createPortal(
    <div className="education-document-preview-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}>
      <section className="education-document-preview" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header>
          <div><span>Education Document</span><h2 id={titleId}>{name}</h2><p className="education-document-preview-description">Preview or download the stored PDF.</p></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close document viewer">
            {"\u00D7"}
          </button>
        </header>
        <div className="education-document-preview-content">
          {status === "loading" && <div className="education-document-preview-state" role="status"><span className="education-document-preview-loader" aria-hidden="true"/><strong>Loading PDF</strong></div>}
          {status === "error" && <div className="education-document-preview-state education-document-preview-state--error" role="alert"><strong>Unable to preview document</strong><p>{error}</p></div>}
          {status === "ready" && <iframe src={`${url}#toolbar=1&navpanes=1`} title={`${name} PDF preview`} />}
        </div>
        <footer><span title={name}>{name}</span><div><button type="button" onClick={onClose}>Close</button><button type="button" className="education-document-preview-download" disabled={!url} onClick={download}>Download</button></div></footer>
      </section>
    </div>, window.document.body
  );
}
export default EducationDocumentPreviewModal;