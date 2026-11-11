import { useEffect, useMemo, useRef, useState } from "react";

import {
  CERTIFICATION_CREDENTIAL_STATE_OPTIONS,
  CERTIFICATION_FIELD_LIMITS,
  CERTIFICATION_ISSUER_TYPE_OPTIONS,
  CERTIFICATION_SOURCE_OPTIONS,
  CERTIFICATION_STATUS_OPTIONS,
  CERTIFICATION_TYPE_OPTIONS,
} from "../../../../config/certificationConfig.js";

import {
  createCertificationSkillRelationship,
  createCertificationTrainingRelationship,
  createEmptyCertification,
  normalizeCertification,
} from "../../../../models/certificationModel.js";

import {
  getCertificationValidationSummary,
  validateCertification,
} from "../../../../services/Certification/certificationValidation.js";

import CertificationDocumentManager from "../CertificationDocumentManager/CertificationDocumentManager.jsx";

import "./CertificationForm.css";

function CertificationForm({
  initialCertification = null,
  existingCertifications = [],
  skills = [],
  trainingRecords = [],
  resolvedTrainingRelationships = null,
  trainingLinksStatus = "success",
  educationRecords = [],
  isSaving: isContextSaving = false,
  isRelationshipDataLoading = false,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState(() =>
    initialCertification
      ? normalizeCertification(initialCertification)
      : createEmptyCertification(),
  );

  const [documentUploads, setDocumentUploads] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [requiresDocumentReview, setRequiresDocumentReview] = useState(false);
  const initialRecord = useRef(null);
  const isSaving = isContextSaving || isSubmitting;


  const [fieldErrors, setFieldErrors] = useState({});

  const [warnings, setWarnings] = useState([]);

  const [submitError, setSubmitError] = useState("");


  const isEditing = Boolean(initialCertification?.id);

  useEffect(() => {
    const id = initialCertification?.id || "";
    if (initialRecord.current?.id === id) {
      // Refresh acknowledged metadata without clearing dirty fields or pending files.
      setFormData((draft) => ({ ...draft,
        rowVersion: initialCertification?.rowVersion,
        supportingDocuments: initialCertification ? normalizeCertification(initialCertification).supportingDocuments : [],
      }));
      return;
    }
    initialRecord.current = { id };
    setRequiresDocumentReview(false);
    setFormData(
      initialCertification
        ? normalizeCertification(initialCertification)
        : createEmptyCertification(),
    );

    setDocumentUploads([]);
    setFieldErrors({});
    setWarnings([]);
    setSubmitError("");
  }, [initialCertification]);

  const validationSummary = useMemo(
    () => getCertificationValidationSummary(formData),
    [formData],
  );

  /*
   * =========================================
   * Error Management
   * =========================================
   */

  const clearFieldError = (field) => {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = {
        ...currentErrors,
      };

      delete nextErrors[field];

      return nextErrors;
    });

    setSubmitError("");
  };

  /*
   * =========================================
   * Field Updates
   * =========================================
   */

  const updateTopLevel = (field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));

    clearFieldError(field);
  };

  const updateNested = (section, field, value) => {
    setFormData((currentData) => ({
      ...currentData,

      [section]: {
        ...currentData[section],
        [field]: value,
      },
    }));

    clearFieldError(`${section}.${field}`);
  };

  /*
   * =========================================
   * Expiration
   * =========================================
   */

  const handleDoesNotExpireChange = (checked) => {
    setFormData((currentData) => ({
      ...currentData,

      dates: {
        ...currentData.dates,
        doesNotExpire: checked,
        expirationDate: checked ? "" : currentData.dates.expirationDate,
        nextRenewalDate: checked ? "" : currentData.dates.nextRenewalDate,
      },
    }));

    clearFieldError("dates.doesNotExpire");
    clearFieldError("dates.expirationDate");
    clearFieldError("dates.nextRenewalDate");
  };

  /*
   * =========================================
   * Skill Relationships
   * =========================================
   */

  const handleSkillToggle = (skill, checked) => {
    setFormData((currentData) => ({
      ...currentData,

      skillRelationships: checked
        ? [
            ...currentData.skillRelationships,
            createCertificationSkillRelationship(
              skill,
              currentData.skillRelationships.length,
            ),
          ]
        : currentData.skillRelationships.filter(
            (relationship) => relationship.skillId !== skill.id,
          ),
    }));

    clearFieldError("skillRelationships");
  };

  /*
   * =========================================
   * Training Relationships
   * =========================================
   */

  const handleTrainingToggle = (training, checked) => {
    setFormData((currentData) => ({
      ...currentData,

      relatedRecords: {
        ...currentData.relatedRecords,

        trainingRelationships: checked
          ? [
              ...currentData.relatedRecords.trainingRelationships,
              createCertificationTrainingRelationship(
                training,
                currentData.relatedRecords.trainingRelationships.length,
              ),
            ]
          : currentData.relatedRecords.trainingRelationships.filter(
              (relationship) => relationship.trainingId !== training.id,
            ),
      },
    }));

    clearFieldError("relatedRecords.trainingRelationships");
  };

  /*
   * =========================================
   * Education Relationships
   * =========================================
   */

  const handleEducationToggle = (education, checked) => {
    setFormData((currentData) => ({
      ...currentData,

      relatedRecords: {
        ...currentData.relatedRecords,

        educationIds: checked
          ? [...currentData.relatedRecords.educationIds, education.id]
          : currentData.relatedRecords.educationIds.filter(
              (educationId) => educationId !== education.id,
            ),
      },
    }));

    clearFieldError("relatedRecords.educationIds");
  };

  /*
   * =========================================
   * Document Uploads
   * =========================================
   */

  /*
   * =========================================
   * Submission
   * =========================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLock.current || isSaving || requiresDocumentReview) return;

    setSubmitError("");

    const validation = validateCertification(formData, {
      skills,
      trainingRecords,
      educationRecords,
    });

    setFieldErrors(validation.fieldErrors || {});

    setWarnings(
      documentUploads.length > 0
        ? (validation.warnings || []).filter(
            (warning) => warning.code !== "CERTIFICATION_DOCUMENT_RECOMMENDED",
          )
        : validation.warnings || [],
    );

    if (!validation.isValid) {
      const errors = validation.errors || [];

      setSubmitError(
        `${errors.length} ${
          errors.length === 1 ? "problem must" : "problems must"
        } be corrected before saving. ${errors
          .map((error) => `${error.field || "General"}: ${error.message}`)
          .join("; ")}`,
      );

      const firstError = errors[0];

      if (firstError?.field) {
        window.document
          .querySelector(`[data-field="${firstError.field}"]`)
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }

      return;
    }

    const normalizedName = formData.name.trim().toLocaleLowerCase();

    const normalizedIssuer = formData.issuingOrganization.name
      .trim()
      .toLocaleLowerCase();

    const duplicateCertification = existingCertifications.find(
      (certification) => {
        const existingName =
          typeof certification?.name === "string"
            ? certification.name.trim().toLocaleLowerCase()
            : "";

        const existingIssuer =
          typeof certification?.issuingOrganization?.name === "string"
            ? certification.issuingOrganization.name.trim().toLocaleLowerCase()
            : "";

        return (
          certification?.id !== initialCertification?.id &&
          existingName === normalizedName &&
          existingIssuer === normalizedIssuer
        );
      },
    );

    if (duplicateCertification) {
      setFieldErrors({
        name: "A matching certification already exists.",
      });

      setSubmitError(
        "A Certification with this name and issuing organization already exists.",
      );

      return;
    }

    try {
      if (typeof onSubmit !== "function") throw new Error("Certification Save is unavailable. Refresh the page.");
      submitLock.current = true;
      setIsSubmitting(true);
      await onSubmit(formData, documentUploads);
    } catch (error) {
      if (Array.isArray(error?.completedUploads)) {
        setDocumentUploads((pending) => pending.filter((upload) => !error.completedUploads.includes(upload)));
      }
      setRequiresDocumentReview(error?.requiresDocumentReview === true);
      setFieldErrors(
        error?.fieldErrors || error?.validation?.fieldErrors || {},
      );

      setWarnings(error?.warnings || error?.validation?.warnings || []);

      setSubmitError(
        error?.publicMessage ||
          error?.message ||
          "The certification could not be saved.",
      );
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form className="certification-form" onSubmit={handleSubmit} noValidate>
      <FormSection
        label="Credential"
        title="Certification Information"
        description="Identify the credential and issuing organization."
      >
        <div className="certification-form-grid">
          <FormField
            label="Certification Name"
            field="name"
            error={fieldErrors.name}
            required
            wide
          >
            <input
              type="text"
              value={formData.name}
              onChange={(event) => updateTopLevel("name", event.target.value)}
              maxLength={CERTIFICATION_FIELD_LIMITS.name}
              placeholder="Example: CompTIA A+"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Certification Type"
            field="certificationType"
            error={fieldErrors.certificationType}
            required
          >
            <select
              value={formData.certificationType}
              onChange={(event) =>
                updateTopLevel("certificationType", event.target.value)
              }
              disabled={isSaving}
            >
              {CERTIFICATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Credential State"
            field="credential.state"
            error={fieldErrors["credential.state"]}
            required
          >
            <select
              value={formData.credential.state}
              onChange={(event) =>
                updateNested("credential", "state", event.target.value)
              }
              disabled={isSaving}
            >
              {CERTIFICATION_CREDENTIAL_STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Issuing Organization"
            field="issuingOrganization.name"
            error={fieldErrors["issuingOrganization.name"]}
            required
          >
            <input
              type="text"
              value={formData.issuingOrganization.name}
              onChange={(event) =>
                updateNested("issuingOrganization", "name", event.target.value)
              }
              maxLength={CERTIFICATION_FIELD_LIMITS.issuerName}
              placeholder="Example: CompTIA"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Issuer Type"
            field="issuingOrganization.type"
            error={fieldErrors["issuingOrganization.type"]}
          >
            <select
              value={formData.issuingOrganization.type}
              onChange={(event) =>
                updateNested("issuingOrganization", "type", event.target.value)
              }
              disabled={isSaving}
            >
              {CERTIFICATION_ISSUER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Issuer Website"
            field="issuingOrganization.website"
            error={fieldErrors["issuingOrganization.website"]}
            wide
          >
            <input
              type="url"
              value={formData.issuingOrganization.website}
              onChange={(event) =>
                updateNested(
                  "issuingOrganization",
                  "website",
                  event.target.value,
                )
              }
              maxLength={CERTIFICATION_FIELD_LIMITS.issuerWebsite}
              placeholder="https://www.example.com"
              disabled={isSaving}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        label="Timeline"
        title="Issue, Expiration, and Renewal"
        description="Record the credential lifecycle and renewal schedule."
      >
        <div className="certification-form-grid">
          <FormField
            label="Issue Date"
            field="dates.issueDate"
            error={fieldErrors["dates.issueDate"]}
          >
            <input
              type="month"
              value={formData.dates.issueDate}
              onChange={(event) =>
                updateNested("dates", "issueDate", event.target.value)
              }
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Expiration Date"
            field="dates.expirationDate"
            error={fieldErrors["dates.expirationDate"]}
          >
            <input
              type="month"
              value={formData.dates.expirationDate}
              onChange={(event) =>
                updateNested("dates", "expirationDate", event.target.value)
              }
              disabled={isSaving || formData.dates.doesNotExpire}
            />
          </FormField>

          <FormField
            label="Last Renewed"
            field="dates.lastRenewedDate"
            error={fieldErrors["dates.lastRenewedDate"]}
          >
            <input
              type="month"
              value={formData.dates.lastRenewedDate}
              onChange={(event) =>
                updateNested("dates", "lastRenewedDate", event.target.value)
              }
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Next Renewal"
            field="dates.nextRenewalDate"
            error={fieldErrors["dates.nextRenewalDate"]}
          >
            <input
              type="month"
              value={formData.dates.nextRenewalDate}
              onChange={(event) =>
                updateNested("dates", "nextRenewalDate", event.target.value)
              }
              disabled={isSaving || formData.dates.doesNotExpire}
            />
          </FormField>

          <label
            className="certification-form-checkbox certification-form-wide"
            data-field="dates.doesNotExpire"
          >
            <input
              type="checkbox"
              checked={formData.dates.doesNotExpire}
              onChange={(event) =>
                handleDoesNotExpireChange(event.target.checked)
              }
              disabled={isSaving}
            />

            <span>This Certification does not expire</span>
          </label>
        </div>
      </FormSection>

      <FormSection
        label="Verification"
        title="Credential Verification"
        description="Save the credential number and public verification address."
      >
        <div className="certification-form-grid">
          <FormField
            label="Credential ID"
            field="credential.credentialId"
            error={fieldErrors["credential.credentialId"]}
          >
            <input
              type="text"
              value={formData.credential.credentialId}
              onChange={(event) =>
                updateNested("credential", "credentialId", event.target.value)
              }
              maxLength={CERTIFICATION_FIELD_LIMITS.credentialId}
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Verification URL"
            field="credential.verificationUrl"
            error={fieldErrors["credential.verificationUrl"]}
          >
            <input
              type="url"
              value={formData.credential.verificationUrl}
              onChange={(event) =>
                updateNested(
                  "credential",
                  "verificationUrl",
                  event.target.value,
                )
              }
              maxLength={CERTIFICATION_FIELD_LIMITS.verificationUrl}
              placeholder="https://www.example.com/verify"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Description"
            field="description"
            error={fieldErrors.description}
            wide
          >
            <textarea
              rows={5}
              value={formData.description}
              onChange={(event) =>
                updateTopLevel("description", event.target.value)
              }
              maxLength={CERTIFICATION_FIELD_LIMITS.description}
              placeholder="Describe the credential and its professional relevance."
              disabled={isSaving}
            />
          </FormField>
        </div>
      </FormSection>

      {Array.isArray(resolvedTrainingRelationships) ? (
        <FormSection label="Training" title="Related Training"
          description="These connections are saved on the Training records. Link or unlink from Training Edit.">
          {trainingLinksStatus === "success" ? (
            resolvedTrainingRelationships.length > 0 ? (
              <ul aria-label="Linked Training records">
                {resolvedTrainingRelationships.map((relationship) => (
                  <li key={relationship.trainingId}>
                    <strong>{relationship.snapshot.title}</strong>
                    {relationship.snapshot.providerName && <span> — {relationship.snapshot.providerName}</span>}
                    {relationship.trainingStatus === "archived" && <span> (Archived)</span>}
                  </li>
                ))}
              </ul>
            ) : <p>No linked Training records.</p>
          ) : <p role="status">{trainingLinksStatus === "error"
            ? "Training links could not be loaded. Retry from the Certification Library."
            : "Loading Training links…"}</p>}
        </FormSection>
      ) : (
      <RelationshipSection
        label="Training"
        title="Related Training"
        description="Connect Training that prepared you for or awarded this Certification."
        loading={isRelationshipDataLoading}
        emptyMessage="No Training records are available."
      >
        {trainingRecords.map((training) => {
          const checked = formData.relatedRecords.trainingRelationships.some(
            (relationship) => relationship.trainingId === training.id,
          );

          return (
            <label key={training.id} className="certification-form-option">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  handleTrainingToggle(training, event.target.checked)
                }
                disabled={isSaving}
              />

              <span>
                <strong>{training.title || "Untitled Training"}</strong>

                <small>
                  {training.provider?.name || "Provider not specified"}
                </small>
              </span>
            </label>
          );
        })}
      </RelationshipSection>

      )}

      <RelationshipSection
        label="Skills"
        title="Related Skills"
        description="Connect skills demonstrated or validated by this Certification."
        loading={isRelationshipDataLoading}
        emptyMessage="No Skill Library records are available."
      >
        {skills.map((skill) => {
          const checked = formData.skillRelationships.some(
            (relationship) => relationship.skillId === skill.id,
          );

          return (
            <label key={skill.id} className="certification-form-option">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  handleSkillToggle(skill, event.target.checked)
                }
                disabled={isSaving}
              />

              <span>
                <strong>{skill.name || "Unnamed Skill"}</strong>

                <small>{skill.category || "Other"}</small>
              </span>
            </label>
          );
        })}
      </RelationshipSection>

      <RelationshipSection
        label="Education"
        title="Related Education"
        description="Connect Education records associated with this Certification."
        loading={isRelationshipDataLoading}
        emptyMessage="No Education records are available."
      >
        {educationRecords.map((education) => {
          const checked = formData.relatedRecords.educationIds.includes(
            education.id,
          );

          return (
            <label key={education.id} className="certification-form-option">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  handleEducationToggle(education, event.target.checked)
                }
                disabled={isSaving}
              />

              <span>
                <strong>
                  {education.credential?.name || "Unnamed Credential"}
                </strong>

                <small>
                  {education.institution?.name || "Institution not specified"}
                </small>
              </span>
            </label>
          );
        })}
      </RelationshipSection>

      <CertificationDocumentManager certificationId={initialCertification?.id} uploads={documentUploads} setUploads={setDocumentUploads} disabled={isSaving}/>

      <FormSection
        label="Management"
        title="Visibility and Record Settings"
        description="Control public output and private career-management information."
      >
        <div className="certification-form-visibility">
          {[
            ["showIssuingOrganization", "Show issuing organization"],
            ["showIssuerWebsite", "Show issuer website"],
            ["showDates", "Show issue and renewal dates"],
            ["showExpirationDate", "Show expiration date"],
            ["showCredentialId", "Show credential ID"],
            ["showVerificationUrl", "Show verification URL"],
            ["showDescription", "Show description"],
            ["showSkills", "Show related Skills"],
            ["showSupportingDocuments", "Show supporting documents"],
          ].map(([field, label]) => (
            <label key={field} className="certification-form-checkbox">
              <input
                type="checkbox"
                checked={Boolean(formData.visibility[field])}
                onChange={(event) =>
                  updateNested("visibility", field, event.target.checked)
                }
                disabled={isSaving}
              />

              <span>{label}</span>
            </label>
          ))}
        </div>

        <div className="certification-form-grid">
          <FormField label="Source" field="source" error={fieldErrors.source}>
            <select
              value={formData.source}
              onChange={(event) => updateTopLevel("source", event.target.value)}
              disabled={isSaving}
            >
              {CERTIFICATION_SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Record Status"
            field="status"
            error={fieldErrors.status}
          >
            <select
              value={formData.status}
              onChange={(event) => updateTopLevel("status", event.target.value)}
              disabled={isSaving}
            >
              {CERTIFICATION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Source Context"
            field="sourceContext"
            error={fieldErrors.sourceContext}
            wide
          >
            <input
              type="text"
              value={formData.sourceContext}
              onChange={(event) =>
                updateTopLevel("sourceContext", event.target.value)
              }
              maxLength={CERTIFICATION_FIELD_LIMITS.sourceContext}
              placeholder="Optional information about where this record originated"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Private Notes"
            field="privateInformation.notes"
            error={fieldErrors["privateInformation.notes"]}
            wide
          >
            <textarea
              rows={4}
              value={formData.privateInformation.notes}
              onChange={(event) =>
                updateNested("privateInformation", "notes", event.target.value)
              }
              maxLength={CERTIFICATION_FIELD_LIMITS.privateNotes}
              placeholder="Private notes are never included in public output."
              disabled={isSaving}
            />
          </FormField>
        </div>
      </FormSection>

      {warnings.length > 0 && (
        <div className="certification-form-warnings">
          <strong>Suggestions</strong>

          <ul>
            {warnings.map((warning, index) => (
              <li key={`${warning.code || "warning"}-${index}`}>
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isSubmitting && <p role="status" aria-live="polite">Saving Certification{documentUploads.length ? ` and uploading ${documentUploads.length} selected document(s)` : ""}…</p>}

      {submitError && (
        <p className="certification-form-submit-error" role="alert">
          {submitError}
        </p>
      )}

      <footer className="certification-form-footer">
        <div>
          <span>Record Status</span>

          <strong>{validationSummary}</strong>
        </div>

        <div>
          <button type="button" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>

          <button
            type="submit"
            className="certification-form-submit"
            disabled={isSaving || requiresDocumentReview}
          >
            {isSaving
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Certification"}
          </button>
        </div>
      </footer>
    </form>
  );
}

function FormSection({ label, title, description, children }) {
  return (
    <section className="certification-form-section">
      <header>
        <span aria-hidden="true" />

        <div>
          <small>{label}</small>

          <h3>{title}</h3>

          <p>{description}</p>
        </div>
      </header>

      {children}
    </section>
  );
}

function RelationshipSection({
  label,
  title,
  description,
  loading,
  emptyMessage,
  children,
}) {
  const items = Array.isArray(children) ? children : children ? [children] : [];

  return (
    <FormSection label={label} title={title} description={description}>
      {loading ? (
        <p className="certification-form-relationship-state">
          Loading available records…
        </p>
      ) : items.length === 0 ? (
        <p className="certification-form-relationship-state">{emptyMessage}</p>
      ) : (
        <div className="certification-form-options">{children}</div>
      )}
    </FormSection>
  );
}

function FormField({
  label,
  field,
  error,
  required = false,
  wide = false,
  children,
}) {
  return (
    <label
      className={`certification-form-field ${
        wide ? "certification-form-wide" : ""
      }`}
      data-field={field}
    >
      <span>
        {label}

        {required && <small> Required</small>}
      </span>

      {children}

      {error && <small role="alert">{error}</small>}
    </label>
  );
}

export default CertificationForm;
