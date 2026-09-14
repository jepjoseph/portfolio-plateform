import { useEffect, useMemo, useState } from "react";

import {
  CERTIFICATION_CREDENTIAL_STATE_OPTIONS,
  CERTIFICATION_DOCUMENT_ACCEPT,
  CERTIFICATION_FIELD_LIMITS,
  CERTIFICATION_ISSUER_TYPE_OPTIONS,
  CERTIFICATION_SOURCE_OPTIONS,
  CERTIFICATION_STATUS_OPTIONS,
  CERTIFICATION_TYPE_OPTIONS,
  isCertificationDocumentWithinSizeLimit,
  isSupportedCertificationDocument,
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

import "./CertificationForm.css";

function CertificationForm({
  initialCertification = null,
  existingCertifications = [],
  skills = [],
  trainingRecords = [],
  educationRecords = [],
  isSaving = false,
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

  const [fieldErrors, setFieldErrors] = useState({});

  const [warnings, setWarnings] = useState([]);

  const [submitError, setSubmitError] = useState("");

  const [documentError, setDocumentError] = useState("");

  const isEditing = Boolean(initialCertification?.id);

  useEffect(() => {
    setFormData(
      initialCertification
        ? normalizeCertification(initialCertification)
        : createEmptyCertification(),
    );

    setDocumentUploads([]);
    setFieldErrors({});
    setWarnings([]);
    setSubmitError("");
    setDocumentError("");
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

  const handleDocumentSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    const availableDocumentSlots =
      CERTIFICATION_FIELD_LIMITS.maximumSupportingDocuments -
      formData.supportingDocuments.length -
      documentUploads.length;

    setDocumentError("");

    if (availableDocumentSlots <= 0) {
      setDocumentError(
        `Add no more than ${CERTIFICATION_FIELD_LIMITS.maximumSupportingDocuments} documents.`,
      );

      event.target.value = "";

      return;
    }

    const acceptedUploads = [];

    let latestError = "";

    selectedFiles.slice(0, availableDocumentSlots).forEach((file) => {
      if (!isSupportedCertificationDocument(file)) {
        latestError = "Upload only PDF, Word, JPG, JPEG, PNG, or WebP files.";

        return;
      }

      if (!isCertificationDocumentWithinSizeLimit(file)) {
        latestError = "Each certificate document must be 10 MB or smaller.";

        return;
      }

      const duplicateDocument = [
        ...formData.supportingDocuments.map((document) => document.fileName),
        ...documentUploads.map((upload) => upload.file.name),
        ...acceptedUploads.map((upload) => upload.file.name),
      ].some(
        (fileName) =>
          fileName?.trim().toLocaleLowerCase() ===
          file.name.trim().toLocaleLowerCase(),
      );

      if (duplicateDocument) {
        latestError = `"${file.name}" has already been added.`;

        return;
      }

      const hasPrimaryDocument =
        formData.supportingDocuments.some(
          (document) => document.status !== "archived" && document.isPrimary,
        ) ||
        documentUploads.some((upload) => upload.isPrimary) ||
        acceptedUploads.some((upload) => upload.isPrimary);

      acceptedUploads.push({
        file,
        name: file.name,
        documentType: "certificate",
        description: "",
        isPrimary: !hasPrimaryDocument,
      });
    });

    if (selectedFiles.length > availableDocumentSlots) {
      latestError = `Only ${availableDocumentSlots} additional ${
        availableDocumentSlots === 1 ? "document" : "documents"
      } can be added.`;
    }

    if (latestError) {
      setDocumentError(latestError);
    }

    if (acceptedUploads.length > 0) {
      setDocumentUploads((currentUploads) => [
        ...currentUploads,
        ...acceptedUploads,
      ]);
    }

    event.target.value = "";
  };

  const removeStagedDocument = (selectedIndex) => {
    setDocumentUploads((currentUploads) => {
      const removedUpload = currentUploads[selectedIndex];

      const nextUploads = currentUploads.filter(
        (_, index) => index !== selectedIndex,
      );

      const existingPrimaryExists = formData.supportingDocuments.some(
        (document) => document.status !== "archived" && document.isPrimary,
      );

      if (
        removedUpload?.isPrimary &&
        !existingPrimaryExists &&
        nextUploads.length > 0
      ) {
        return nextUploads.map((upload, index) => ({
          ...upload,
          isPrimary: index === 0,
        }));
      }

      return nextUploads;
    });

    setDocumentError("");
  };

  const removeExistingDocument = (documentId) => {
    setFormData((currentData) =>
      normalizeCertification({
        ...currentData,

        supportingDocuments: currentData.supportingDocuments.filter(
          (document) => document.id !== documentId,
        ),
      }),
    );

    setDocumentError("");
  };

  const setExistingPrimaryDocument = (documentId) => {
    setFormData((currentData) => ({
      ...currentData,

      supportingDocuments: currentData.supportingDocuments.map((document) => ({
        ...document,

        isPrimary: document.id === documentId && document.status !== "archived",
      })),
    }));

    setDocumentUploads((currentUploads) =>
      currentUploads.map((upload) => ({
        ...upload,
        isPrimary: false,
      })),
    );
  };

  const setStagedPrimaryDocument = (selectedIndex) => {
    setDocumentUploads((currentUploads) =>
      currentUploads.map((upload, index) => ({
        ...upload,
        isPrimary: index === selectedIndex,
      })),
    );

    setFormData((currentData) => ({
      ...currentData,

      supportingDocuments: currentData.supportingDocuments.map((document) => ({
        ...document,
        isPrimary: false,
      })),
    }));
  };

  /*
   * =========================================
   * Submission
   * =========================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

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
        } be corrected before saving.`,
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
      await onSubmit?.(formData, documentUploads);
    } catch (error) {
      setFieldErrors(
        error?.fieldErrors || error?.validation?.fieldErrors || {},
      );

      setWarnings(error?.warnings || error?.validation?.warnings || []);

      setSubmitError(
        error?.publicMessage ||
          error?.message ||
          "The certification could not be saved.",
      );
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

      <FormSection
        label="Documents"
        title="Certificate Documents"
        description="Upload PDF, Word, JPG, JPEG, PNG, or WebP files. The primary document appears on the Certification item."
      >
        <label className="certification-form-upload">
          <input
            type="file"
            multiple
            accept={CERTIFICATION_DOCUMENT_ACCEPT}
            onChange={handleDocumentSelection}
            disabled={isSaving}
          />

          <span>
            <strong>Select certificate documents</strong>

            <small>
              Maximum 10 MB per file and{" "}
              {CERTIFICATION_FIELD_LIMITS.maximumSupportingDocuments} documents
              per Certification
            </small>
          </span>
        </label>

        {documentError && (
          <p className="certification-form-document-error" role="alert">
            {documentError}
          </p>
        )}

        {(formData.supportingDocuments.length > 0 ||
          documentUploads.length > 0) && (
          <div className="certification-form-document-list">
            {formData.supportingDocuments.map((certificationDocument) => (
              <div key={certificationDocument.id}>
                <label>
                  <input
                    type="radio"
                    name="primary-certificate-document"
                    checked={certificationDocument.isPrimary}
                    onChange={() =>
                      setExistingPrimaryDocument(certificationDocument.id)
                    }
                    disabled={
                      isSaving || certificationDocument.status === "archived"
                    }
                  />

                  <span>
                    <strong>
                      {certificationDocument.name ||
                        certificationDocument.fileName}
                    </strong>

                    <small>
                      Saved document · {certificationDocument.previewMode}
                    </small>
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() =>
                    removeExistingDocument(certificationDocument.id)
                  }
                  disabled={isSaving}
                >
                  Remove
                </button>
              </div>
            ))}

            {documentUploads.map((upload, index) => (
              <div
                key={`${upload.file.name}-${upload.file.lastModified}-${index}`}
              >
                <label>
                  <input
                    type="radio"
                    name="primary-certificate-document"
                    checked={upload.isPrimary}
                    onChange={() => setStagedPrimaryDocument(index)}
                    disabled={isSaving}
                  />

                  <span>
                    <strong>{upload.file.name}</strong>

                    <small>
                      Ready to upload ·{" "}
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </small>
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => removeStagedDocument(index)}
                  disabled={isSaving}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </FormSection>

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
            disabled={isSaving}
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
