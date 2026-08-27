import CertificateViewer from "../CertificateViewer/CertificateViewer";

import "./CertificationItem.css";

function CertificationItem({ certification, onDelete }) {
  const {
    name,
    issuer,
    issueDate,
    expirationDate,
    credentialId,
    credentialUrl,
    description,
    file,
  } = certification;

  return (
    <article className="certification-item">
      {/* =========================================
          Certificate Preview
          ========================================= */}

      <CertificateViewer file={file} certificateName={name} />

      {/* =========================================
          Certificate Information
          ========================================= */}

      <div className="certification-information">
        <div className="certification-item-header">
          <div>
            <span className="certification-item-eyebrow">Certification</span>

            <h4>{name}</h4>

            <span className="certification-issuer">{issuer}</span>
          </div>

          <button
            type="button"
            className="certification-delete-button"
            onClick={() => onDelete(certification.id)}
            aria-label={`Delete ${name}`}
          >
            ×
          </button>
        </div>

        <div className="certification-meta">
          {issueDate && (
            <div>
              <span>Issued</span>
              <strong>{issueDate}</strong>
            </div>
          )}

          {expirationDate && (
            <div>
              <span>Expires</span>
              <strong>{expirationDate}</strong>
            </div>
          )}

          {credentialId && (
            <div>
              <span>Credential ID</span>
              <strong>{credentialId}</strong>
            </div>
          )}
        </div>

        {description && (
          <p className="certification-description">{description}</p>
        )}

        {credentialUrl && (
          <a
            href={credentialUrl}
            target="_blank"
            rel="noreferrer"
            className="certification-credential-link"
          >
            View Credential
          </a>
        )}
      </div>
    </article>
  );
}

export default CertificationItem;
