import { useState } from "react";

import { getSkillCategoryLabel } from "../../../../config/skillConfig.js";

import {
  canPreviewDocument,
  formatFileSize,
  getDocumentFormatLabel,
} from "../../../../services/Documents/documentUtils.js";

import {
  createStoredDocumentUrl,
  revokeDocumentUrl,
} from "../../../../services/Documents/documentStorage.js";

import {
  getDocumentVisibilityLabel,
  getEducationDocumentTypeLabel,
} from "../../../../config/documentConfig.js";

import {
  formatEducationDateRange,
  formatEducationGpa,
  formatEducationLocation,
  getEducationCompleteness,
  getEducationCredentialName,
  getEducationCredentialTypeDisplay,
  getEducationInstitutionName,
  getEducationInstitutionTypeDisplay,
  getEducationSourceDisplay,
} from "../../../../services/Education/educationUtils.js";

import "./EducationItem.css";

/*
 * =========================================
 * Helpers
 * =========================================
 */

function getWebsiteUrl(value) {
  const website = typeof value === "string" ? value.trim() : "";

  if (!website) {
    return "";
  }

  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function getOrderedItems(values) {
  return Array.isArray(values)
    ? [...values].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      )
    : [];
}

/*
 * =========================================
 * Education Item
 * =========================================
 */

function EducationItem({
  education,
  skillsById = new Map(),
  isWorking = false,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const [workingDocumentId, setWorkingDocumentId] = useState("");

  const [documentError, setDocumentError] = useState("");

  if (!education) {
    return null;
  }

  const credentialName = getEducationCredentialName(education);

  const institutionName = getEducationInstitutionName(education);

  const credentialType = getEducationCredentialTypeDisplay(education);

  const institutionType = getEducationInstitutionTypeDisplay(education);

  const dateRange = formatEducationDateRange(education);

  const location = formatEducationLocation(education);

  const gpa = formatEducationGpa(education);

  const source = getEducationSourceDisplay(education);

  const completeness = getEducationCompleteness(education);

  const isArchived = education.status === "archived";

  const honors = getOrderedItems(education.academic?.honors);

  const coursework = getOrderedItems(education.coursework);

  const activities = getOrderedItems(education.activities);

  const skillRelationships = getOrderedItems(education.skillRelationships);

  const supportingDocuments = getOrderedItems(education.supportingDocuments);

  /*
   * =========================================
   * Document URL
   * =========================================
   */

  const getDocumentUrl = async (educationDocument) => {
    if (educationDocument.fileUrl) {
      return {
        url: educationDocument.fileUrl,
        temporary: false,
      };
    }

    if (!educationDocument.storageKey) {
      const error = new Error("The document does not have a storage location.");

      error.publicMessage = "The document file is unavailable.";

      throw error;
    }

    const url = await createStoredDocumentUrl(educationDocument.storageKey);

    return {
      url,
      temporary: true,
    };
  };

  /*
   * =========================================
   * Preview Document
   * =========================================
   */

  const handlePreviewDocument = async (educationDocument) => {
    try {
      setDocumentError("");

      setWorkingDocumentId(educationDocument.id);

      const { url, temporary } = await getDocumentUrl(educationDocument);

      const previewWindow = window.open(url, "_blank", "noopener,noreferrer");

      if (!previewWindow) {
        throw new Error("The browser blocked the document preview window.");
      }

      if (temporary) {
        window.setTimeout(() => {
          revokeDocumentUrl(url);
        }, 60000);
      }
    } catch (error) {
      setDocumentError(
        error?.publicMessage ||
          error?.message ||
          "The document could not be opened.",
      );
    } finally {
      setWorkingDocumentId("");
    }
  };

  /*
   * =========================================
   * Download Document
   * =========================================
   */

  const handleDownloadDocument = async (educationDocument) => {
    try {
      setDocumentError("");

      setWorkingDocumentId(educationDocument.id);

      const { url, temporary } = await getDocumentUrl(educationDocument);

      const link = window.document.createElement("a");

      link.href = url;

      link.download =
        educationDocument.fileName || educationDocument.name || "document";

      link.rel = "noopener";

      window.document.body.appendChild(link);

      link.click();
      link.remove();

      if (temporary) {
        window.setTimeout(() => {
          revokeDocumentUrl(url);
        }, 1000);
      }
    } catch (error) {
      setDocumentError(
        error?.publicMessage ||
          error?.message ||
          "The document could not be downloaded.",
      );
    } finally {
      setWorkingDocumentId("");
    }
  };

  return (
    <article
      className={`education-item ${
        isExpanded ? "education-item--expanded" : ""
      } ${isArchived ? "education-item--archived" : ""}`}
    >
      <header className="education-item-summary">
        <div className="education-item-icon" aria-hidden="true">
          {isArchived ? "□" : "◇"}
        </div>

        <div className="education-item-heading">
          <div className="education-item-labels">
            <span>{credentialType}</span>

            {education.dates?.isCurrent && (
              <span className="education-item-current-label">In Progress</span>
            )}

            {isArchived && (
              <span className="education-item-archived-label">Archived</span>
            )}
          </div>

          <h3>{credentialName}</h3>

          <p>{institutionName}</p>

          <div className="education-item-metadata">
            <span>{dateRange}</span>

            {education.credential?.fieldOfStudy && (
              <span>{education.credential.fieldOfStudy}</span>
            )}

            {location && <span>{location}</span>}

            <span>
              <strong>{completeness.percentage}%</strong> complete
            </span>
          </div>
        </div>

        <div className="education-item-actions">
          <button
            type="button"
            className="education-item-view-button"
            onClick={() => setIsExpanded((current) => !current)}
            disabled={isWorking}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Hide Details" : "View"}
          </button>

          {!isArchived && (
            <button
              type="button"
              onClick={() => onEdit?.(education)}
              disabled={isWorking}
            >
              Edit
            </button>
          )}

          {isArchived ? (
            <button
              type="button"
              onClick={() => onRestore?.(education)}
              disabled={isWorking}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onArchive?.(education)}
              disabled={isWorking}
            >
              Archive
            </button>
          )}

          <button
            type="button"
            className="education-item-delete-button"
            onClick={() => onDelete?.(education)}
            disabled={isWorking}
          >
            Delete
          </button>
        </div>
      </header>

      {isWorking && (
        <div
          className="education-item-operation"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" />

          <small>Updating education record...</small>
        </div>
      )}

      {isExpanded && (
        <div className="education-item-details">
          <section className="education-item-detail-section">
            <SectionTitle title="Education Information" count="" />

            <div className="education-item-detail-grid">
              <Detail label="Credential" value={credentialName} />

              <Detail label="Credential Type" value={credentialType} />

              <Detail label="Institution" value={institutionName} />

              <Detail label="Institution Type" value={institutionType} />

              <Detail
                label="Field of Study"
                value={education.credential?.fieldOfStudy}
              />

              <Detail label="Minor" value={education.credential?.minor} />

              <Detail label="Dates" value={dateRange} />

              <Detail label="Location" value={location} />

              {gpa && <Detail label="GPA" value={gpa} />}

              <Detail label="Source" value={source} />

              <Detail
                label="Status"
                value={isArchived ? "Archived" : "Active"}
              />
            </div>

            {education.institution?.website && (
              <a
                className="education-item-website"
                href={getWebsiteUrl(education.institution.website)}
                target="_blank"
                rel="noreferrer"
              >
                Visit Institution Website
              </a>
            )}
          </section>

          {education.description && (
            <section className="education-item-detail-section">
              <SectionTitle title="Education Description" />

              <p className="education-item-description">
                {education.description}
              </p>
            </section>
          )}

          {honors.length > 0 && (
            <OrderedDetails title="Honors and Awards" items={honors} />
          )}

          {coursework.length > 0 && (
            <OrderedDetails title="Relevant Coursework" items={coursework} />
          )}

          {activities.length > 0 && (
            <OrderedDetails
              title="Activities and Organizations"
              items={activities}
            />
          )}

          {skillRelationships.length > 0 && (
            <section className="education-item-detail-section">
              <SectionTitle
                title="Skills Developed"
                count={skillRelationships.length}
              />

              <div className="education-item-skills">
                {skillRelationships.map((relationship) => {
                  const librarySkill =
                    skillsById instanceof Map
                      ? skillsById.get(relationship.skillId)
                      : skillsById[relationship.skillId];

                  const skillName =
                    librarySkill?.name ||
                    relationship.nameSnapshot ||
                    "Unavailable Skill";

                  const category =
                    librarySkill?.category ||
                    relationship.categorySnapshot ||
                    "other";

                  return (
                    <article key={relationship.id}>
                      <span>{getSkillCategoryLabel(category)}</span>

                      <strong>{skillName}</strong>

                      {!librarySkill && relationship.skillId && (
                        <small>Library record unavailable</small>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="education-item-detail-section">
            <SectionTitle
              title="Supporting Documents"
              count={supportingDocuments.length}
            />

            {supportingDocuments.length > 0 ? (
              <div className="education-item-documents">
                {supportingDocuments.map((educationDocument) => {
                  const isDocumentWorking =
                    workingDocumentId === educationDocument.id;

                  return (
                    <article key={educationDocument.id}>
                      <div className="education-item-document-icon">◇</div>

                      <div className="education-item-document-content">
                        <div>
                          <span>
                            {getEducationDocumentTypeLabel(
                              educationDocument.documentType,
                            )}
                          </span>

                          <span>
                            {getDocumentFormatLabel(educationDocument)}
                          </span>

                          <span>
                            {getDocumentVisibilityLabel(
                              educationDocument.visibility,
                            )}
                          </span>
                        </div>

                        <strong>{educationDocument.name}</strong>

                        <small>
                          {educationDocument.fileName}
                          {" · "}
                          {formatFileSize(educationDocument.fileSize)}
                        </small>

                        {educationDocument.description && (
                          <p>{educationDocument.description}</p>
                        )}
                      </div>

                      <div className="education-item-document-actions">
                        {canPreviewDocument(educationDocument) && (
                          <button
                            type="button"
                            onClick={() =>
                              handlePreviewDocument(educationDocument)
                            }
                            disabled={isDocumentWorking}
                          >
                            Preview
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadDocument(educationDocument)
                          }
                          disabled={isDocumentWorking}
                        >
                          {isDocumentWorking ? "Opening..." : "Download"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="education-item-empty-detail">
                No supporting documents are attached.
              </p>
            )}

            {documentError && (
              <p className="education-item-document-error" role="alert">
                {documentError}
              </p>
            )}
          </section>

          {education.privateInformation?.notes && (
            <section className="education-item-private-notes">
              <header>
                <span>Private Notes</span>

                <small>Not public</small>
              </header>

              <p>{education.privateInformation.notes}</p>
            </section>
          )}

          <section className="education-item-completeness">
            <header>
              <div>
                <span>Record Quality</span>

                <strong>{completeness.label}</strong>
              </div>

              <strong>{completeness.percentage}%</strong>
            </header>

            <div className="education-item-completeness-progress">
              <span
                style={{
                  width: `${completeness.percentage}%`,
                }}
              />
            </div>

            {completeness.missingChecks.length > 0 && (
              <div className="education-item-missing">
                <span>Suggested improvements</span>

                <ul>
                  {completeness.missingChecks.map((check) => (
                    <li key={check.id}>Add {check.label.toLowerCase()}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <footer className="education-item-details-footer">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              disabled={isWorking}
            >
              Hide Details
            </button>

            {!isArchived && (
              <button
                type="button"
                className="education-item-details-edit"
                onClick={() => onEdit?.(education)}
                disabled={isWorking}
              >
                Edit Education
              </button>
            )}
          </footer>
        </div>
      )}
    </article>
  );
}

/*
 * =========================================
 * Supporting Components
 * =========================================
 */

function Detail({ label, value }) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div className="education-item-detail">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

function SectionTitle({ title, count }) {
  return (
    <header className="education-item-section-title">
      <h4>{title}</h4>

      {count !== undefined && count !== "" && <span>{count}</span>}
    </header>
  );
}

function OrderedDetails({ title, items }) {
  return (
    <section className="education-item-detail-section">
      <SectionTitle title={title} count={items.length} />

      <div className="education-item-ordered-list">
        {items.map((item, index) => (
          <article key={item.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>

            <div>
              <strong>{item.name}</strong>

              {item.description && <p>{item.description}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default EducationItem;
