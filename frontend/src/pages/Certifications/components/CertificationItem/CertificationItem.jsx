import { useState } from "react";

import {
  getCertificationCredentialState,
  getCertificationCredentialStateDisplay,
  getCertificationDateRange,
  getCertificationTrainingSummary,
  getCertificationTypeDisplay,
  getPrimaryCertificationDocumentInfo,
} from "../../../../services/Certification/certificationUtils.js";

import CertificationDocumentPreview from "../CertificationDocumentPreview/CertificationDocumentPreview.jsx";
import CertificationDocumentViewer from "../CertificationDocumentViewer/CertificationDocumentViewer.jsx";

import "./CertificationItem.css";

function CertificationItem({
  certification,
  operation = null,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const [viewingDocument, setViewingDocument] = useState(null);

  const isArchived = certification?.status === "archived";

  const isOperating = operation?.certificationId === certification?.id;

  const primaryDocument = getPrimaryCertificationDocumentInfo(certification);

  const credentialState = getCertificationCredentialState(certification);

  const credentialStateLabel =
    getCertificationCredentialStateDisplay(certification);

  const dateRange = getCertificationDateRange(certification);

  const activeDocuments = Array.isArray(certification?.supportingDocuments)
    ? certification.supportingDocuments.filter(
        (document) => document?.status !== "archived",
      )
    : [];

  return (
    <>
      <article
        className={`certification-item ${
          isArchived ? "certification-item--archived" : ""
        }`}
      >
        <CertificationDocumentPreview
          document={primaryDocument}
          onView={setViewingDocument}
        />

        <div className="certification-item-content">
          <header>
            <div>
              <div className="certification-item-labels">
                <span>{getCertificationTypeDisplay(certification)}</span>

                <span
                  className={`certification-item-state certification-item-state--${credentialState}`}
                >
                  {credentialStateLabel}
                </span>

                {isArchived && (
                  <span className="certification-item-archived-label">
                    Archived
                  </span>
                )}
              </div>

              <h3>{certification?.name || "Unnamed Certification"}</h3>

              <p>
                {certification?.issuingOrganization?.name ||
                  "Issuing organization not provided"}
              </p>
            </div>

            <div className="certification-item-actions">
              <button
                type="button"
                onClick={() => onEdit?.(certification)}
                disabled={isOperating}
              >
                Edit
              </button>

              {isArchived ? (
                <button
                  type="button"
                  onClick={() => onRestore?.(certification)}
                  disabled={isOperating}
                >
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onArchive?.(certification)}
                  disabled={isOperating}
                >
                  Archive
                </button>
              )}

              <button
                type="button"
                className="certification-item-delete"
                onClick={() => onDelete?.(certification)}
                disabled={isOperating}
              >
                Delete
              </button>
            </div>
          </header>

          <div className="certification-item-metadata">
            {dateRange && <span>{dateRange}</span>}

            {certification?.credential?.credentialId && (
              <span>
                Credential ID:{" "}
                <strong>{certification.credential.credentialId}</strong>
              </span>
            )}

            <span>{getCertificationTrainingSummary(certification)}</span>
          </div>

          {certification?.description && (
            <p className="certification-item-description">
              {certification.description}
            </p>
          )}

          <footer>
            <div>
              <span>
                {certification?.skillRelationships?.length || 0}{" "}
                {certification?.skillRelationships?.length === 1
                  ? "Skill"
                  : "Skills"}
              </span>

              <span>
                {activeDocuments.length}{" "}
                {activeDocuments.length === 1 ? "Document" : "Documents"}
              </span>
            </div>

            <div>
              {primaryDocument && (
                <button
                  type="button"
                  onClick={() => setViewingDocument(primaryDocument)}
                >
                  View Certificate
                </button>
              )}

              {certification?.credential?.verificationUrl && (
                <a
                  href={certification.credential.verificationUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify Credential
                </a>
              )}
            </div>
          </footer>
        </div>

        {isOperating && (
          <div
            className="certification-item-operation"
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true" />
            Updating certification…
          </div>
        )}
      </article>

      {viewingDocument && (
        <CertificationDocumentViewer
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </>
  );
}

export default CertificationItem;
