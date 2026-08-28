import CertificateViewer from "../CertificateViewer/CertificateViewer";

import "./CertificationItem.css";

function formatMonth(value) {
  if (!value) {
    return "";
  }

  const [year, month] = value.slice(0, 7).split("-").map(Number);

  if (!year || !month) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1));
}

function CertificationItem({ certification, onEdit, onDelete }) {
  const organization =
    certification.issuingOrganization || certification.issuer || "";

  return (
    <article className="certification-item">
      {/* =========================================
          Certificate Preview
          ========================================= */}

      <div className="certification-item-preview">
        <CertificateViewer certificate={certification} isOwner />
      </div>

      {/* =========================================
          Certification Information
          ========================================= */}

      <div className="certification-information">
        <header className="certification-item-header">
          <div className="certification-item-heading">
            <span className="certification-item-eyebrow">Certification</span>

            <h4>{certification.name}</h4>

            {organization && (
              <span className="certification-item-issuer">{organization}</span>
            )}
          </div>

          <button
            type="button"
            className="certification-item-delete-button"
            onClick={() => onDelete(certification.id)}
            aria-label={`Delete ${certification.name}`}
            title="Delete certification"
          >
            ×
          </button>
        </header>

        {/* =========================================
            Metadata
            ========================================= */}

        {(certification.issueDate ||
          certification.expirationDate ||
          certification.credentialId) && (
          <dl className="certification-meta">
            {certification.issueDate && (
              <div>
                <dt>Issued</dt>

                <dd>{formatMonth(certification.issueDate)}</dd>
              </div>
            )}

            {certification.expirationDate && (
              <div>
                <dt>Expires</dt>

                <dd>{formatMonth(certification.expirationDate)}</dd>
              </div>
            )}

            {certification.credentialId && (
              <div>
                <dt>Credential ID</dt>

                <dd>{certification.credentialId}</dd>
              </div>
            )}
          </dl>
        )}

        {/* =========================================
            Description
            ========================================= */}

        {certification.description && (
          <p className="certification-description">
            {certification.description}
          </p>
        )}

        {/* =========================================
            Actions
            ========================================= */}

        <div className="certification-item-actions">
          <button
            type="button"
            className="certification-item-edit-button"
            onClick={() => onEdit(certification)}
          >
            Edit
          </button>

          {certification.credentialUrl && (
            <a
              href={certification.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="certification-item-credential-link"
            >
              View Credential
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default CertificationItem;
