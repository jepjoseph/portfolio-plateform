import { uploadTrainingDocument, deleteTrainingDocument, mergeTrainingDocumentResult } from "../../../../services/Training/trainingDocumentApiService.js";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  TRAINING_COMPLETION_STATUS_OPTIONS,
  TRAINING_DELIVERY_FORMAT_OPTIONS,
  TRAINING_FIELD_LIMITS,
  TRAINING_PROVIDER_TYPE_OPTIONS,
  TRAINING_SOURCE_OPTIONS,
  TRAINING_STATUS_OPTIONS,
  TRAINING_TYPE_OPTIONS,
} from "../../../../config/trainingConfig.js";

import {
  createEmptyTraining,
  createTrainingInstructor,
  createTrainingOutcome,
  createTrainingTopic,
  normalizeTraining,
} from "../../../../models/trainingModel.js";

import {
  getTrainingValidationSummary,
  validateTraining,
} from "../../../../services/Training/trainingValidation.js";

import TrainingDocumentEditor from "../TrainingDocumentEditor/TrainingDocumentEditor.jsx";

import TrainingOrderedItemEditor from "../TrainingOrderedItemEditor/TrainingOrderedItemEditor.jsx";
import TrainingSkillsEditor from "../TrainingSkillsEditor/TrainingSkillsEditor.jsx";

import "./TrainingForm.css";

/*
 * =========================================
 * Stable Ordered-Editor Configuration
 * =========================================
 */

const INSTRUCTOR_FIELDS = [
  {
    name: "name",
    label: "Instructor Name",
    placeholder: "Instructor or facilitator name",
    maximumLength: TRAINING_FIELD_LIMITS.instructorName,
    required: true,
  },
  {
    name: "title",
    label: "Professional Title",
    placeholder: "Senior Instructor",
    maximumLength: TRAINING_FIELD_LIMITS.instructorTitle,
  },
  {
    name: "organization",
    label: "Organization",
    placeholder: "Training provider or employer",
    maximumLength: TRAINING_FIELD_LIMITS.instructorOrganization,
  },
];

const TOPIC_FIELDS = [
  {
    name: "name",
    label: "Topic Name",
    placeholder: "Network Security Fundamentals",
    maximumLength: TRAINING_FIELD_LIMITS.topicName,
    required: true,
  },
  {
    name: "description",
    label: "Description",
    placeholder: "Describe the subjects covered under this topic.",
    maximumLength: TRAINING_FIELD_LIMITS.topicDescription,
    multiline: true,
    rows: 3,
    wide: true,
  },
];

const LEARNING_OUTCOME_FIELDS = [
  {
    name: "text",
    label: "Learning Outcome",
    placeholder:
      "Explain what you learned or became capable of doing after the training.",
    maximumLength: TRAINING_FIELD_LIMITS.outcomeText,
    required: true,
    multiline: true,
    rows: 3,
    wide: true,
  },
];

/*
 * =========================================
 * Training Form
 * =========================================
 */

function TrainingForm({
  initialTraining = null,
  certifications = [],
  isCertificationDataLoading = false,
  isSaving: isTrainingSaving = false,
  onDocumentsSaved,
  onUnlinkCertification,
  onLinkCertification,
  onDocumentBusyChange,
  onSubmit,
  onCancel,
  onCreateCertification,
}) {
  const [formData, setFormData] = useState(() =>
    initialTraining
      ? normalizeTraining(initialTraining)
      : createEmptyTraining(),
  );

  const documentBaseline = useRef(initialTraining);
  const documentLock = useRef(false);
  const [documentWorking, setDocumentWorking] = useState(false);
  const [documentNotice, setDocumentNotice] = useState("");
  const isSaving = isTrainingSaving || documentWorking;
  async function persistDocument(operation, fileOrDocument, details) {
    if (documentLock.current || isTrainingSaving) throw new Error("Wait for the current save to finish.");
    documentLock.current = true;
    setDocumentWorking(true); onDocumentBusyChange?.(true);
    setDocumentNotice("");
    try {
      const result = operation === "upload"
        ? await uploadTrainingDocument(documentBaseline.current, fileOrDocument, details)
        : await deleteTrainingDocument(documentBaseline.current, fileOrDocument.id);
      documentBaseline.current = result.training;
      setFormData(current => mergeTrainingDocumentResult(current, result.training));
      onDocumentsSaved?.(result.training);
      setDocumentNotice(result.cleanupPending ? "Document removed from Training. Physical file cleanup is pending on the server." : operation === "upload" ? "PDF uploaded and saved." : "PDF removed from Training.");
      return result;
    } finally { documentLock.current = false; setDocumentWorking(false); onDocumentBusyChange?.(false); }
  }

  const [fieldErrors, setFieldErrors] = useState({});

  const [warnings, setWarnings] = useState([]);

  const [submitError, setSubmitError] = useState("");

  /*
   * =========================================
   * Reset When Record Changes
   * =========================================
   */

  useEffect(() => {
    documentBaseline.current = initialTraining;
    setDocumentNotice("");
    setFormData(
      initialTraining
        ? normalizeTraining(initialTraining)
        : createEmptyTraining(),
    );

    setFieldErrors({});
    setWarnings([]);
    setSubmitError("");
  }, [initialTraining]);

  const validationSummary = useMemo(
    () =>
      getTrainingValidationSummary(formData, {
        certifications,
      }),
    [formData, certifications],
  );

  /*
   * =========================================
   * Field Updates
   * =========================================
   */

  const clearFieldError = (field) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = {
        ...current,
      };

      delete nextErrors[field];

      return nextErrors;
    });

    setSubmitError("");
  };

  const updateTopLevel = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    clearFieldError(field);
  };

  const updateNested = (section, field, value) => {
    setFormData((current) => ({
      ...current,

      [section]: {
        ...current[section],
        [field]: value,
      },
    }));

    clearFieldError(`${section}.${field}`);
  };

  const updateDeepNested = (section, subsection, field, value) => {
    setFormData((current) => ({
      ...current,

      [section]: {
        ...current[section],

        [subsection]: {
          ...current[section]?.[subsection],
          [field]: value,
        },
      },
    }));

    clearFieldError(`${section}.${subsection}.${field}`);
  };

  /*
   * =========================================
   * Timeline
   * =========================================
   */

  const handleCurrentChange = (checked) => {
    setFormData((current) => ({
      ...current,

      dates: {
        ...current.dates,
        isCurrent: checked,
        endDate: checked ? "" : current.dates.endDate,
      },

      completion: {
        ...current.completion,
        status: checked ? "in-progress" : current.completion.status,
      },
    }));

    clearFieldError("dates.endDate");
    clearFieldError("completion.status");
  };

  /*
   * =========================================
   * Completion Status
   * =========================================
   */

  const handleCompletionStatusChange = (status) => {
    setFormData((current) => ({
      ...current,

      completion: {
        ...current.completion,
        status,
      },

      dates: {
        ...current.dates,
        isCurrent:
          status === "in-progress"
            ? true
            : status === "completed"
              ? false
              : current.dates.isCurrent,
      },
    }));

    clearFieldError("completion.status");
  };

  /*
   * =========================================
   * Certification Relationships
   * =========================================
   */


  const handlePersistedCertificationUnlink = async (certification) => {
    if (!initialTraining?.id || typeof onUnlinkCertification !== "function") {
      throw new Error("Saved Training Certification unlink is unavailable.");
    }
    if (documentLock.current || isTrainingSaving) {
      throw new Error("Wait for the current Training operation to finish.");
    }
    const certificationId = certification?.id;
    const baseline = documentBaseline.current;
    if (!baseline?.rowVersion || !certificationId) {
      throw new Error("The Training version or Certification ID is missing. Refresh the Training Library.");
    }
    documentLock.current = true;
    setDocumentWorking(true);
    onDocumentBusyChange?.(true);
    setDocumentNotice("");
    try {
      const saved = await onUnlinkCertification(baseline.id, certificationId, baseline.rowVersion);
      if (!saved?.rowVersion || !Array.isArray(saved.certificationRelationships) ||
          !Array.isArray(saved.relatedCertificationIds)) {
        throw new Error("The server returned an invalid Training unlink result.");
      }
      documentBaseline.current = saved;
      setFormData((draft) => ({
        ...draft,
        rowVersion: saved.rowVersion,
        certificationRelationships: saved.certificationRelationships,
        relatedCertificationIds: saved.relatedCertificationIds,
      }));
      setDocumentNotice("Certification relationship removed. The Certification and its files were preserved.");
      return saved;
    } finally {
      documentLock.current = false;
      setDocumentWorking(false);
      onDocumentBusyChange?.(false);
    }
  };
  const handleCertificationToggle = async (certification, shouldBeLinked) => {
    if (!shouldBeLinked) return handlePersistedCertificationUnlink(certification);
    const baseline = documentBaseline.current;
    if (!initialTraining?.id || !baseline?.rowVersion) {
      throw new Error("Save this Training first, then reopen Edit to link a Certification. The Certification remains available in your Library.");
    }
    if (typeof onLinkCertification !== "function") {
      throw new Error("Certification linking is unavailable. Refresh the Training Library.");
    }
    if (documentLock.current || isTrainingSaving) {
      throw new Error("Wait for the current Training operation to finish.");
    }
    const certificationId = certification?.id;
    if (typeof certificationId !== "string" || !certificationId.trim()) {
      throw new Error("The selected Certification could not be identified.");
    }
    documentLock.current = true;
    setDocumentWorking(true);
    onDocumentBusyChange?.(true);
    setDocumentNotice("");
    try {
      const saved = await onLinkCertification(baseline.id, certificationId, baseline.rowVersion);
      if (saved?.id !== baseline.id || !saved?.rowVersion ||
          !Array.isArray(saved.certificationRelationships) || !Array.isArray(saved.relatedCertificationIds)) {
        throw new Error("The server returned an invalid Training link result. Refresh before retrying.");
      }
      documentBaseline.current = saved;
      setFormData((draft) => ({
        ...draft,
        rowVersion: saved.rowVersion,
        certificationRelationships: saved.certificationRelationships,
        relatedCertificationIds: saved.relatedCertificationIds,
      }));
      setDocumentNotice("Certification linked and saved. Your other Training edits are retained.");
      setSubmitError("");
      return saved;
    } finally {
      documentLock.current = false;
      setDocumentWorking(false);
      onDocumentBusyChange?.(false);
    }
  };

  /*
   * =========================================
   * Submission
   * =========================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (documentLock.current || isSaving) return;

    const validation = validateTraining(formData, {
      certifications,
    });

    setFieldErrors(validation.fieldErrors || {});
    setWarnings(validation.warnings || []);

    if (!validation.isValid) {
      const errorCount = validation.errors?.length || 0;

      setSubmitError(
        `${errorCount} ${
          errorCount === 1 ? "problem must" : "problems must"
        } be corrected before saving.`,
      );

      const firstError = validation.errors?.[0];

      if (firstError?.field) {
        document
          .querySelector(`[data-field="${firstError.field}"]`)
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }

      return;
    }

    try {
      setSubmitError("");

      await onSubmit?.(formData, documentBaseline.current);
    } catch (error) {
      setFieldErrors(error?.fieldErrors || {});

      setSubmitError(
        error?.publicMessage ||
          error?.message ||
          "The training record could not be saved.",
      );
    }
  };

  return (
    <form className="training-form" onSubmit={handleSubmit} noValidate>
      {/* Training Program */}

      <section className="training-form-section">
        <SectionHeader
          label="Program"
          title="Training Program"
          description="Enter the training title, type, and provider."
        />

        <div className="training-form-grid">
          <FormField
            label="Training Title"
            field="title"
            error={fieldErrors.title}
            required
            wide
          >
            <input
              type="text"
              value={formData.title}
              onChange={(event) => updateTopLevel("title", event.target.value)}
              maxLength={TRAINING_FIELD_LIMITS.title}
              placeholder="CompTIA A+ Technical Training"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Training Type"
            field="trainingType"
            error={fieldErrors.trainingType}
            required
          >
            <select
              value={formData.trainingType}
              onChange={(event) =>
                updateTopLevel("trainingType", event.target.value)
              }
              disabled={isSaving}
            >
              {TRAINING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Provider Type"
            field="provider.type"
            error={fieldErrors["provider.type"]}
          >
            <select
              value={formData.provider.type}
              onChange={(event) =>
                updateNested("provider", "type", event.target.value)
              }
              disabled={isSaving}
            >
              {TRAINING_PROVIDER_TYPE_OPTIONS.map((option) => (
                <option
                  key={option.value || "unspecified"}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Provider Name"
            field="provider.name"
            error={fieldErrors["provider.name"]}
            required
          >
            <input
              type="text"
              value={formData.provider.name}
              onChange={(event) =>
                updateNested("provider", "name", event.target.value)
              }
              maxLength={TRAINING_FIELD_LIMITS.providerName}
              placeholder="CompTIA"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Provider Website"
            field="provider.website"
            error={fieldErrors["provider.website"]}
          >
            <input
              type="url"
              value={formData.provider.website}
              onChange={(event) =>
                updateNested("provider", "website", event.target.value)
              }
              maxLength={TRAINING_FIELD_LIMITS.providerWebsite}
              placeholder="https://www.example.com"
              disabled={isSaving}
            />
          </FormField>
        </div>
      </section>

      {/* Dates and Delivery */}

      <section className="training-form-section">
        <SectionHeader
          label="Timeline"
          title="Dates and Delivery"
          description="Describe when, where, and how the training was delivered."
        />

        <div className="training-form-grid">
          <FormField
            label="Start Date"
            field="dates.startDate"
            error={fieldErrors["dates.startDate"]}
            required
          >
            <input
              type="month"
              value={formData.dates.startDate}
              onChange={(event) =>
                updateNested("dates", "startDate", event.target.value)
              }
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="End Date"
            field="dates.endDate"
            error={fieldErrors["dates.endDate"]}
          >
            <input
              type="month"
              value={formData.dates.endDate}
              onChange={(event) =>
                updateNested("dates", "endDate", event.target.value)
              }
              disabled={isSaving || formData.dates.isCurrent}
            />
          </FormField>

          <label className="training-form-checkbox training-form-wide">
            <input
              type="checkbox"
              checked={formData.dates.isCurrent}
              onChange={(event) => handleCurrentChange(event.target.checked)}
              disabled={isSaving}
            />

            <span>I am currently completing this training</span>
          </label>

          <FormField
            label="Delivery Format"
            field="delivery.format"
            error={fieldErrors["delivery.format"]}
          >
            <select
              value={formData.delivery.format}
              onChange={(event) =>
                updateNested("delivery", "format", event.target.value)
              }
              disabled={isSaving}
            >
              {TRAINING_DELIVERY_FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Display Location"
            field="delivery.location.displayValue"
            error={fieldErrors["delivery.location.displayValue"]}
          >
            <input
              type="text"
              value={formData.delivery.location.displayValue}
              onChange={(event) =>
                updateDeepNested(
                  "delivery",
                  "location",
                  "displayValue",
                  event.target.value,
                )
              }
              maxLength={TRAINING_FIELD_LIMITS.locationDisplayValue}
              placeholder="Online or Boca Raton, Florida"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="City"
            field="delivery.location.city"
            error={fieldErrors["delivery.location.city"]}
          >
            <input
              type="text"
              value={formData.delivery.location.city}
              onChange={(event) =>
                updateDeepNested(
                  "delivery",
                  "location",
                  "city",
                  event.target.value,
                )
              }
              maxLength={TRAINING_FIELD_LIMITS.city}
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="State or Region"
            field="delivery.location.stateRegion"
            error={fieldErrors["delivery.location.stateRegion"]}
          >
            <input
              type="text"
              value={formData.delivery.location.stateRegion}
              onChange={(event) =>
                updateDeepNested(
                  "delivery",
                  "location",
                  "stateRegion",
                  event.target.value,
                )
              }
              maxLength={TRAINING_FIELD_LIMITS.stateRegion}
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Country"
            field="delivery.location.country"
            error={fieldErrors["delivery.location.country"]}
          >
            <input
              type="text"
              value={formData.delivery.location.country}
              onChange={(event) =>
                updateDeepNested(
                  "delivery",
                  "location",
                  "country",
                  event.target.value,
                )
              }
              maxLength={TRAINING_FIELD_LIMITS.country}
              disabled={isSaving}
            />
          </FormField>
        </div>
      </section>

      {/* Completion */}

      <section className="training-form-section">
        <SectionHeader
          label="Completion"
          title="Completion and Credential"
          description="Record completion status, duration, and credential information."
        />

        <div className="training-form-grid">
          <FormField
            label="Completion Status"
            field="completion.status"
            error={fieldErrors["completion.status"]}
            required
          >
            <select
              value={formData.completion.status}
              onChange={(event) =>
                handleCompletionStatusChange(event.target.value)
              }
              disabled={isSaving}
            >
              {TRAINING_COMPLETION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Duration in Hours"
            field="completion.durationHours"
            error={fieldErrors["completion.durationHours"]}
          >
            <input
              type="number"
              min="0"
              max={TRAINING_FIELD_LIMITS.maximumDurationHours}
              step="0.25"
              value={formData.completion.durationHours ?? ""}
              onChange={(event) =>
                updateNested("completion", "durationHours", event.target.value)
              }
              placeholder="40"
              disabled={isSaving}
            />
          </FormField>

          <label className="training-form-checkbox training-form-wide">
            <input
              type="checkbox"
              checked={formData.completion.certificateEarned}
              onChange={(event) =>
                updateNested(
                  "completion",
                  "certificateEarned",
                  event.target.checked,
                )
              }
              disabled={isSaving}
            />

            <span>A certificate or credential was earned</span>
          </label>

          <FormField
            label="Credential ID"
            field="completion.credentialId"
            error={fieldErrors["completion.credentialId"]}
          >
            <input
              type="text"
              value={formData.completion.credentialId}
              onChange={(event) =>
                updateNested("completion", "credentialId", event.target.value)
              }
              maxLength={TRAINING_FIELD_LIMITS.credentialId}
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Credential URL"
            field="completion.credentialUrl"
            error={fieldErrors["completion.credentialUrl"]}
          >
            <input
              type="url"
              value={formData.completion.credentialUrl}
              onChange={(event) =>
                updateNested("completion", "credentialUrl", event.target.value)
              }
              maxLength={TRAINING_FIELD_LIMITS.credentialUrl}
              placeholder="https://www.example.com/verify"
              disabled={isSaving}
            />
          </FormField>
        </div>
      </section>

      {/* Description */}

      <section className="training-form-section">
        <SectionHeader
          label="Overview"
          title="Training Description"
          description="Explain the purpose, scope, and professional relevance of the training."
        />

        <FormField
          label="Description"
          field="description"
          error={fieldErrors.description}
        >
          <textarea
            rows={5}
            value={formData.description}
            onChange={(event) =>
              updateTopLevel("description", event.target.value)
            }
            maxLength={TRAINING_FIELD_LIMITS.description}
            placeholder="Summarize the training program and its professional relevance."
            disabled={isSaving}
          />
        </FormField>
      </section>

      {/* Instructors */}

      <TrainingOrderedItemEditor
        values={formData.instructors}
        label="Training Leadership"
        title="Instructors and Facilitators"
        description="Add instructors, trainers, facilitators, or program leaders."
        itemLabel="Instructor"
        emptyTitle="No instructors added"
        emptyMessage="Training instructors and facilitators will appear here."
        fields={INSTRUCTOR_FIELDS}
        primaryField="name"
        maximumItems={TRAINING_FIELD_LIMITS.maximumInstructors}
        fieldPath="instructors"
        fieldErrors={fieldErrors}
        disabled={isSaving}
        createItem={createTrainingInstructor}
        onChange={(instructors) => updateTopLevel("instructors", instructors)}
      />

      {/* Topics */}

      <TrainingOrderedItemEditor
        values={formData.topics}
        label="Curriculum"
        title="Topics and Curriculum"
        description="Record the subjects, technologies, and concepts covered."
        itemLabel="Topic"
        emptyTitle="No topics added"
        emptyMessage="Training topics and curriculum will appear here."
        fields={TOPIC_FIELDS}
        primaryField="name"
        maximumItems={TRAINING_FIELD_LIMITS.maximumTopics}
        fieldPath="topics"
        fieldErrors={fieldErrors}
        disabled={isSaving}
        createItem={createTrainingTopic}
        onChange={(topics) => updateTopLevel("topics", topics)}
      />

      {/* Learning Outcomes */}

      <TrainingOrderedItemEditor
        values={formData.learningOutcomes}
        label="Outcomes"
        title="Learning Outcomes"
        description="Describe the knowledge, abilities, and professional capabilities developed."
        itemLabel="Outcome"
        emptyTitle="No learning outcomes added"
        emptyMessage="The results of this training will appear here."
        fields={LEARNING_OUTCOME_FIELDS}
        primaryField="text"
        maximumItems={TRAINING_FIELD_LIMITS.maximumLearningOutcomes}
        fieldPath="learningOutcomes"
        fieldErrors={fieldErrors}
        disabled={isSaving}
        createItem={createTrainingOutcome}
        onChange={(learningOutcomes) =>
          updateTopLevel("learningOutcomes", learningOutcomes)
        }
      />

      {/* Skills */}

      <TrainingSkillsEditor
        skillRelationships={formData.skillRelationships}
        fieldErrors={fieldErrors}
        disabled={true}
        onChange={(skillRelationships) =>
          updateTopLevel("skillRelationships", skillRelationships)
        }
      />

      {/* Documents */}

      {initialTraining?.id ? <p>PDF uploads, removals and Certification links/unlinks save immediately. Other Training edits use Save.</p> : <p>Save this Training first, then reopen Edit to upload a PDF or link a Certification.</p>}
      {documentNotice && <p role="status">{documentNotice}</p>}
      <TrainingDocumentEditor
        trainingId={formData.id}
        documents={formData.supportingDocuments}
        certifications={certifications}
        certificationRelationships={formData.certificationRelationships}
        isCertificationDataLoading={isCertificationDataLoading}
        fieldErrors={fieldErrors}
        disabled={isSaving}
            readOnly={false}
        onChange={(supportingDocuments) =>
          updateTopLevel("supportingDocuments", supportingDocuments)
        }
        onUploadDocument={initialTraining?.id ? (file, details) => persistDocument("upload", file, details) : undefined}
        onRemoveDocument={initialTraining?.id ? document => persistDocument("delete", document) : undefined}
        onCertificationChange={handleCertificationToggle}
        onUnlinkCertification={initialTraining?.id ? handlePersistedCertificationUnlink : undefined}
        onCreateCertification={onCreateCertification}
      />


      {/* Record Management */}

      <section className="training-form-section">
        <SectionHeader
          label="Management"
          title="Record Settings"
          description="Control visibility, source information, private notes, and archive status."
        />

        <div className="training-form-visibility">
          {[
            ["showProvider", "Show training provider"],
            ["showProviderWebsite", "Show provider website"],
            ["showDeliveryFormat", "Show delivery format"],
            ["showLocation", "Show training location"],
            ["showDates", "Show training dates"],
            ["showDuration", "Show training duration"],
            ["showDescription", "Show training description"],
            ["showInstructors", "Show instructors"],
            ["showTopics", "Show topics and curriculum"],
            ["showLearningOutcomes", "Show learning outcomes"],
            ["showSkills", "Show related skills"],
            ["showCredential", "Show credential information"],
            ["showCertifications", "Show linked Certifications"],
            ["showSupportingDocuments", "Show supporting documents"],
          ].map(([field, label]) => (
            <label key={field} className="training-form-checkbox">
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

        <div className="training-form-grid">
          <FormField label="Source" field="source" error={fieldErrors.source}>
            <select
              value={formData.source}
              onChange={(event) => updateTopLevel("source", event.target.value)}
              disabled={isSaving}
            >
              {TRAINING_SOURCE_OPTIONS.map((option) => (
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
              {TRAINING_STATUS_OPTIONS.map((option) => (
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
              maxLength={TRAINING_FIELD_LIMITS.sourceContext}
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
              maxLength={TRAINING_FIELD_LIMITS.privateNotes}
              placeholder="Private notes are never displayed publicly."
              disabled={isSaving}
            />
          </FormField>
        </div>
      </section>

      {/* Validation Messages */}

      {submitError && (
        <p className="training-form-submit-error" role="alert">
          {submitError}
        </p>
      )}

      {warnings.length > 0 && (
        <div className="training-form-warnings">
          <strong>Suggestions</strong>

          <ul>
            {warnings.map((warning, index) => (
              <li key={`${warning.field || "warning"}-${index}`}>
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Footer */}

      <footer className="training-form-footer">
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
            className="training-form-submit"
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : initialTraining
                ? "Save Changes"
                : "Create Training"}
          </button>
        </div>
      </footer>
    </form>
  );
}

/*
 * =========================================
 * Section Header
 * =========================================
 */

function SectionHeader({ label, title, description }) {
  return (
    <header className="training-form-section-header">
      <span aria-hidden="true" />

      <div>
        <small>{label}</small>

        <h3>{title}</h3>

        <p>{description}</p>
      </div>
    </header>
  );
}

/*
 * =========================================
 * Form Field
 * =========================================
 */

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
      className={`training-form-field ${wide ? "training-form-wide" : ""}`}
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

export default TrainingForm;
