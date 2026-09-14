import { useMemo, useState } from "react";

import { getSkillCategoryLabel } from "../../../../config/skillConfig.js";
import { getDocumentVisibilityLabel } from "../../../../config/documentConfig.js";
import { getTrainingDocumentTypeLabel } from "../../../../config/trainingConfig.js";

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
  formatTrainingDateRange,
  getTrainingCompleteness,
  getTrainingCompletionStatusDisplay,
  getTrainingDeliveryFormatDisplay,
  getTrainingProviderName,
  getTrainingProviderTypeDisplay,
  getTrainingSourceDisplay,
  getTrainingTitle,
  getTrainingTypeDisplay,
} from "../../../../services/Training/trainingUtils.js";

import "./TrainingItem.css";

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getOrderedItems(values) {
  return Array.isArray(values)
    ? [...values].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      )
    : [];
}

function getWebsiteUrl(value) {
  const website = getText(value);

  if (!website) {
    return "";
  }

  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function formatTrainingLocation(training) {
  const location = training?.delivery?.location || {};

  return (
    getText(location.displayValue) ||
    [location.city, location.stateRegion, location.country]
      .map(getText)
      .filter(Boolean)
      .join(", ")
  );
}

function getCredentialStateLabel(state) {
  const normalizedState = getText(state);

  if (!normalizedState) {
    return "Unspecified";
  }

  return normalizedState
    .split("-")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toLocaleUpperCase() +
        word.slice(1).toLocaleLowerCase(),
    )
    .join(" ");
}

function TrainingItem({
  training,
  skillsById = new Map(),
  certificationsById = new Map(),
  isCertificationDataLoading = false,
  isWorking = false,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [workingDocumentId, setWorkingDocumentId] = useState("");
  const [documentError, setDocumentError] = useState("");

  const certificationRelationships = useMemo(() => {
    const relationships = getOrderedItems(
      training?.certificationRelationships,
    );

    return relationships
      .map((relationship, index) => {
        const certificationId = getText(
          relationship?.certificationId ||
            relationship?.certificationRecordId,
        );

        const libraryCertification =
          certificationsById instanceof Map
            ? certificationsById.get(certificationId)
            : certificationsById?.[certificationId];

        const snapshot =
          relationship?.snapshot &&
          typeof relationship.snapshot === "object" &&
          !Array.isArray(relationship.snapshot)
            ? relationship.snapshot
            : {};

        return {
          id:
            getText(relationship?.id) ||
            certificationId ||
            `certification-relationship-${index}`,

          certificationId,

          name:
            getText(libraryCertification?.name) ||
            getText(snapshot.name) ||
            getText(relationship?.nameSnapshot) ||
            "Unavailable Certification",

          issuerName:
            getText(libraryCertification?.issuingOrganization?.name) ||
            getText(snapshot.issuingOrganizationName) ||
            getText(snapshot.issuerName) ||
            getText(relationship?.issuerNameSnapshot) ||
            "Issuing organization unavailable",

          credentialState:
            getText(libraryCertification?.credential?.state) ||
            getText(snapshot.credentialState) ||
            getText(relationship?.credentialStateSnapshot),

          credentialId:
            getText(libraryCertification?.credential?.credentialId) ||
            getText(snapshot.credentialId) ||
            getText(relationship?.credentialIdSnapshot),

          verificationUrl:
            getText(libraryCertification?.credential?.verificationUrl) ||
            getText(snapshot.verificationUrl) ||
            getText(relationship?.verificationUrlSnapshot),

          issueDate:
            getText(libraryCertification?.dates?.issueDate) ||
            getText(snapshot.issueDate) ||
            getText(relationship?.issueDateSnapshot),

          expirationDate:
            getText(libraryCertification?.dates?.expirationDate) ||
            getText(snapshot.expirationDate) ||
            getText(relationship?.expirationDateSnapshot),

          doesNotExpire:
            libraryCertification?.dates?.doesNotExpire === true ||
            snapshot.doesNotExpire === true,

          isArchived: libraryCertification?.status === "archived",

          isMissing:
            Boolean(certificationId) &&
            !libraryCertification &&
            !isCertificationDataLoading,
        };
      })
      .filter(
        (relationship) =>
          relationship.certificationId ||
          relationship.name !== "Unavailable Certification",
      );
  }, [
    training?.certificationRelationships,
    certificationsById,
    isCertificationDataLoading,
  ]);

  if (!training) {
    return null;
  }

  const title = getTrainingTitle(training);
  const providerName = getTrainingProviderName(training);
  const trainingType = getTrainingTypeDisplay(training);
  const providerType = getTrainingProviderTypeDisplay(training);
  const completionStatus = getTrainingCompletionStatusDisplay(training);
  const deliveryFormat = getTrainingDeliveryFormatDisplay(training);
  const source = getTrainingSourceDisplay(training);
  const dateRange = formatTrainingDateRange(training);
  const location = formatTrainingLocation(training);
  const completeness = getTrainingCompleteness(training);
  const isArchived = training.status === "archived";

  const instructors = getOrderedItems(training.instructors);
  const topics = getOrderedItems(training.topics);
  const learningOutcomes = getOrderedItems(training.learningOutcomes);
  const skillRelationships = getOrderedItems(training.skillRelationships);
  const supportingDocuments = getOrderedItems(training.supportingDocuments);

  const getDocumentUrl = async (trainingDocument) => {
    if (trainingDocument.fileUrl) {
      return {
        url: trainingDocument.fileUrl,
        temporary: false,
      };
    }

    if (!trainingDocument.storageKey) {
      const error = new Error("The document does not have a storage location.");

      error.publicMessage = "The document file is unavailable.";

      throw error;
    }

    const url = await createStoredDocumentUrl(trainingDocument.storageKey);

    return {
      url,
      temporary: true,
    };
  };

  const handlePreviewDocument = async (trainingDocument) => {
    try {
      setDocumentError("");
      setWorkingDocumentId(trainingDocument.id);

      const { url, temporary } = await getDocumentUrl(trainingDocument);

      const previewWindow = window.open(url, "_blank", "noopener,noreferrer");

      if (!previewWindow) {
        if (temporary) {
          revokeDocumentUrl(url);
        }

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

  const handleDownloadDocument = async (trainingDocument) => {
    try {
      setDocumentError("");
      setWorkingDocumentId(trainingDocument.id);

      const { url, temporary } = await getDocumentUrl(trainingDocument);

      const link = window.document.createElement("a");

      link.href = url;
      link.download =
        trainingDocument.fileName || trainingDocument.name || "document";
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
      className={`training-item ${
        isExpanded ? "training-item--expanded" : ""
      } ${isArchived ? "training-item--archived" : ""}`}
    >
      <header className="training-item-summary">
        <div className="training-item-icon" aria-hidden="true">
          {isArchived ? "□" : "△"}
        </div>

        <div className="training-item-heading">
          <div className="training-item-labels">
            <span>{trainingType}</span>
            <span>{completionStatus}</span>

            {certificationRelationships.length > 0 && (
              <span className="training-item-certification-label">
                {certificationRelationships.length}{" "}
                {certificationRelationships.length === 1
                  ? "Certification"
                  : "Certifications"}
              </span>
            )}

            {training.dates?.isCurrent && (
              <span className="training-item-current-label">Current</span>
            )}

            {isArchived && (
              <span className="training-item-archived-label">Archived</span>
            )}
          </div>

          <h3>{title}</h3>
          <p>{providerName}</p>

          <div className="training-item-metadata">
            <span>{dateRange}</span>

            {deliveryFormat && <span>{deliveryFormat}</span>}

            {location && <span>{location}</span>}

            <span>
              <strong>{completeness.percentage}%</strong> complete
            </span>
          </div>
        </div>

        <div className="training-item-actions">
          <button
            type="button"
            className="training-item-view-button"
            onClick={() => setIsExpanded((current) => !current)}
            disabled={isWorking}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Hide Details" : "View"}
          </button>

          {!isArchived && (
            <button
              type="button"
              onClick={() => onEdit?.(training)}
              disabled={isWorking}
            >
              Edit
            </button>
          )}

          {isArchived ? (
            <button
              type="button"
              onClick={() => onRestore?.(training)}
              disabled={isWorking}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onArchive?.(training)}
              disabled={isWorking}
            >
              Archive
            </button>
          )}

          <button
            type="button"
            className="training-item-delete-button"
            onClick={() => onDelete?.(training)}
            disabled={isWorking}
          >
            {isWorking ? "Working..." : "Delete"}
          </button>
        </div>
      </header>

      {isWorking && (
        <div
          className="training-item-operation"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" />
          <small>Updating training record...</small>
        </div>
      )}

      {isExpanded && (
        <div className="training-item-details">
          <section className="training-item-detail-section">
            <SectionTitle title="Training Information" />

            <div className="training-item-detail-grid">
              <Detail label="Training Title" value={title} />
              <Detail label="Training Type" value={trainingType} />
              <Detail label="Provider" value={providerName} />
              <Detail label="Provider Type" value={providerType} />
              <Detail label="Completion Status" value={completionStatus} />
              <Detail label="Delivery Format" value={deliveryFormat} />
              <Detail label="Dates" value={dateRange} />
              <Detail label="Location" value={location} />

              <Detail
                label="Duration"
                value={
                  training.completion?.durationHours !== null &&
                  training.completion?.durationHours !== undefined
                    ? `${training.completion.durationHours} hours`
                    : ""
                }
              />

              <Detail
                label="Credential ID"
                value={training.completion?.credentialId}
              />

              <Detail label="Source" value={source} />

              <Detail
                label="Record Status"
                value={isArchived ? "Archived" : "Active"}
              />
            </div>

            {training.provider?.website && (
              <a
                className="training-item-link"
                href={getWebsiteUrl(training.provider.website)}
                target="_blank"
                rel="noreferrer"
              >
                Visit Training Provider
              </a>
            )}

            {training.completion?.credentialUrl && (
              <a
                className="training-item-link"
                href={getWebsiteUrl(training.completion.credentialUrl)}
                target="_blank"
                rel="noreferrer"
              >
                Verify Credential
              </a>
            )}
          </section>

          {training.description && (
            <section className="training-item-detail-section">
              <SectionTitle title="Training Description" />

              <p className="training-item-description">
                {training.description}
              </p>
            </section>
          )}

          {instructors.length > 0 && (
            <section className="training-item-detail-section">
              <SectionTitle
                title="Instructors and Facilitators"
                count={instructors.length}
              />

              <div className="training-item-instructors">
                {instructors.map((instructor) => (
                  <article key={instructor.id}>
                    <strong>{instructor.name}</strong>

                    {instructor.title && <span>{instructor.title}</span>}

                    {instructor.organization && (
                      <small>{instructor.organization}</small>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {topics.length > 0 && (
            <OrderedDetails
              title="Topics and Curriculum"
              items={topics}
              getTitle={(topic) => topic.name}
              getDescription={(topic) => topic.description}
            />
          )}

          {learningOutcomes.length > 0 && (
            <OrderedDetails
              title="Learning Outcomes"
              items={learningOutcomes}
              getTitle={(outcome) => outcome.text}
            />
          )}

          {skillRelationships.length > 0 && (
            <section className="training-item-detail-section">
              <SectionTitle
                title="Skills Developed"
                count={skillRelationships.length}
              />

              <div className="training-item-skills">
                {skillRelationships.map((relationship) => {
                  const librarySkill =
                    skillsById instanceof Map
                      ? skillsById.get(relationship.skillId)
                      : skillsById?.[relationship.skillId];

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

          <section className="training-item-detail-section">
            <SectionTitle
              title="Linked Certifications"
              count={certificationRelationships.length}
            />

            {isCertificationDataLoading ? (
              <p className="training-item-empty-detail">
                Loading Certification Library…
              </p>
            ) : certificationRelationships.length > 0 ? (
              <div className="training-item-certifications">
                {certificationRelationships.map((certification) => (
                  <article
                    key={certification.id}
                    className={`${certification.isArchived ? "training-item-certification--archived" : ""} ${
                      certification.isMissing
                        ? "training-item-certification--missing"
                        : ""
                    }`}
                  >
                    <div className="training-item-certification-icon">◇</div>

                    <div className="training-item-certification-content">
                      <div className="training-item-certification-labels">
                        <span>Certification</span>

                        {certification.credentialState && (
                          <span
                            className={`training-item-certification-state training-item-certification-state--${certification.credentialState}`}
                          >
                            {getCredentialStateLabel(
                              certification.credentialState,
                            )}
                          </span>
                        )}

                        {certification.isArchived && (
                          <span className="training-item-certification-warning">
                            Archived
                          </span>
                        )}

                        {certification.isMissing && (
                          <span className="training-item-certification-error">
                            Missing record
                          </span>
                        )}
                      </div>

                      <strong>{certification.name}</strong>
                      <small>{certification.issuerName}</small>

                      <div className="training-item-certification-metadata">
                        {certification.issueDate && (
                          <span>Issued {certification.issueDate}</span>
                        )}

                        {certification.doesNotExpire ? (
                          <span>Does not expire</span>
                        ) : (
                          certification.expirationDate && (
                            <span>
                              Expires {certification.expirationDate}
                            </span>
                          )
                        )}

                        {certification.credentialId && (
                          <span>
                            Credential ID: {certification.credentialId}
                          </span>
                        )}
                      </div>

                      {certification.isMissing && (
                        <p>
                          The Certification record is unavailable. The saved
                          Training relationship snapshot is being displayed.
                        </p>
                      )}
                    </div>

                    {certification.verificationUrl && (
                      <div className="training-item-certification-actions">
                        <a
                          className="training-item-link"
                          href={getWebsiteUrl(
                            certification.verificationUrl,
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Verify
                        </a>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="training-item-empty-detail">
                No Certifications are linked to this Training.
              </p>
            )}
          </section>

          <section className="training-item-detail-section">
            <SectionTitle
              title="Supporting Documents"
              count={supportingDocuments.length}
            />

            {supportingDocuments.length > 0 ? (
              <div className="training-item-documents">
                {supportingDocuments.map((trainingDocument) => {
                  const isDocumentWorking =
                    workingDocumentId === trainingDocument.id;

                  return (
                    <article key={trainingDocument.id}>
                      <div className="training-item-document-icon">◇</div>

                      <div className="training-item-document-content">
                        <div>
                          <span>
                            {getTrainingDocumentTypeLabel(
                              trainingDocument.documentType,
                            )}
                          </span>

                          <span>
                            {getDocumentFormatLabel(trainingDocument)}
                          </span>

                          <span>
                            {getDocumentVisibilityLabel(
                              trainingDocument.visibility,
                            )}
                          </span>
                        </div>

                        <strong>{trainingDocument.name}</strong>

                        <small>
                          {trainingDocument.fileName}
                          {" · "}
                          {formatFileSize(trainingDocument.fileSize)}
                        </small>

                        {trainingDocument.description && (
                          <p>{trainingDocument.description}</p>
                        )}
                      </div>

                      <div className="training-item-document-actions">
                        {canPreviewDocument(trainingDocument) && (
                          <button
                            type="button"
                            onClick={() =>
                              handlePreviewDocument(trainingDocument)
                            }
                            disabled={isDocumentWorking}
                          >
                            Preview
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadDocument(trainingDocument)
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
              <p className="training-item-empty-detail">
                No Training documents are attached.
              </p>
            )}

            {documentError && (
              <p className="training-item-document-error" role="alert">
                {documentError}
              </p>
            )}
          </section>

          {training.privateInformation?.notes && (
            <section className="training-item-private-notes">
              <header>
                <span>Private Notes</span>
                <small>Not public</small>
              </header>

              <p>{training.privateInformation.notes}</p>
            </section>
          )}

          <section className="training-item-completeness">
            <header>
              <div>
                <span>Record Quality</span>
                <strong>{completeness.label}</strong>
              </div>

              <strong>{completeness.percentage}%</strong>
            </header>

            <div className="training-item-progress">
              <span
                style={{
                  width: `${completeness.percentage}%`,
                }}
              />
            </div>

            {completeness.missingChecks?.length > 0 && (
              <div className="training-item-missing">
                <span>Suggested improvements</span>

                <ul>
                  {completeness.missingChecks.map((check) => (
                    <li key={check.id}>Add {check.label.toLowerCase()}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <footer className="training-item-details-footer">
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
                className="training-item-details-edit"
                onClick={() => onEdit?.(training)}
                disabled={isWorking}
              >
                Edit Training
              </button>
            )}
          </footer>
        </div>
      )}
    </article>
  );
}

function Detail({ label, value }) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div className="training-item-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionTitle({ title, count }) {
  return (
    <header className="training-item-section-title">
      <h4>{title}</h4>

      {count !== undefined && <span>{count}</span>}
    </header>
  );
}

function OrderedDetails({
  title,
  items,
  getTitle,
  getDescription = () => "",
}) {
  return (
    <section className="training-item-detail-section">
      <SectionTitle title={title} count={items.length} />

      <div className="training-item-ordered-list">
        {items.map((item, index) => (
          <article key={item.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>

            <div>
              <strong>{getTitle(item)}</strong>

              {getDescription(item) && <p>{getDescription(item)}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TrainingItem;