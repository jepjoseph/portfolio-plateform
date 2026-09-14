import { useEffect, useId, useMemo, useState } from "react";

import {
  PROJECT_AWARD_PLACEMENT_OPTIONS,
  PROJECT_CATEGORY_OPTIONS,
  PROJECT_FIELD_LIMITS,
  PROJECT_LIFECYCLE_STATUS_OPTIONS,
  PROJECT_OWNERSHIP_OPTIONS,
  PROJECT_RECOGNITION_TYPE_OPTIONS,
  PROJECT_RECORD_STATUS_OPTIONS,
  PROJECT_SOURCE_OPTIONS,
  PROJECT_TECHNOLOGY_CATEGORY_OPTIONS,
} from "../../../../config/projectConfig.js";
import {
  createEmptyProject,
  createProjectId,
  normalizeProject,
} from "../../../../models/projectModel.js";
import {
  getProjectValidationSummary,
  validateProject,
} from "../../../../services/Project/projectValidation.js";

import ProjectRelationshipEditor from "../ProjectRelationshipEditor/ProjectRelationshipEditor.jsx";
import ProjectMediaEditor from "../ProjectMediaEditor/ProjectMediaEditor.jsx";
import ProjectDocumentEditor from "../ProjectDocumentEditor/ProjectDocumentEditor.jsx";

import "./ProjectForm.css";

const createFormData = (project) =>
  project ? normalizeProject(project) : createEmptyProject();

function ProjectForm({
  initialProject = null,
  relationshipCollections = {},
  isSaving = false,
  onSubmit,
  onCancel,
}) {
  const formId = useId();
  const [formData, setFormData] = useState(() =>
    createFormData(initialProject),
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [submitError, setSubmitError] = useState("");

  /*
   * Files selected in the editors but not yet
   * written to IndexedDB.
   */

  const [mediaUploads, setMediaUploads] = useState([]);
  const [documentUploads, setDocumentUploads] = useState([]);

  /*
   * Existing IndexedDB records removed while
   * editing. These are deleted only after the
   * Project record saves successfully.
   */

  const [removedAssetStorageKeys, setRemovedAssetStorageKeys] = useState([]);

  useEffect(() => {
    setFormData(createFormData(initialProject));

    setFieldErrors({});
    setWarnings([]);
    setSubmitError("");

    setMediaUploads([]);
    setDocumentUploads([]);
    setRemovedAssetStorageKeys([]);
  }, [initialProject]);

  const validationSummary = useMemo(
    () => getProjectValidationSummary(formData),
    [formData],
  );

  const isEditing = Boolean(initialProject?.id);

  const availableDocuments = Array.isArray(formData.supportingDocuments)
    ? formData.supportingDocuments
    : [];

  const clearFieldError = (field) => {
    setFieldErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) => key !== field && !key.startsWith(field + "."),
        ),
      ),
    );
    setSubmitError("");
  };

  const updateTopLevel = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  };

  const updateNested = (section, field, value) => {
    setFormData((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
    clearFieldError(section + "." + field);
  };

  const updateCollection = (section, field, values) => {
    updateNested(section, field, values);
  };

  const updateRelatedRecords = (relationshipKey, relationships) => {
    setFormData((currentData) => ({
      ...currentData,

      relatedRecords: {
        ...currentData.relatedRecords,
        [relationshipKey]: relationships,
      },
    }));

    clearFieldError(`relatedRecords.${relationshipKey}`);
  };

  const registerRemovedAsset = (storageKey) => {
    const normalizedStorageKey =
      typeof storageKey === "string" ? storageKey.trim() : "";

    if (!normalizedStorageKey) {
      return;
    }

    setRemovedAssetStorageKeys((currentKeys) => [
      ...new Set([...currentKeys, normalizedStorageKey]),
    ]);
  };

  const unregisterRemovedAssets = (records = []) => {
    const activeStorageKeys = new Set(
      (Array.isArray(records) ? records : [])
        .map((record) =>
          typeof record?.storageKey === "string"
            ? record.storageKey.trim()
            : "",
        )
        .filter(Boolean),
    );

    if (activeStorageKeys.size === 0) {
      return;
    }

    setRemovedAssetStorageKeys((currentKeys) =>
      currentKeys.filter((storageKey) => !activeStorageKeys.has(storageKey)),
    );
  };

  const handleMediaChange = (media) => {
    const nextMedia = Array.isArray(media) ? media : [];

    updateTopLevel("media", nextMedia);

    unregisterRemovedAssets(nextMedia);
  };

  const handleFeaturedMediaChange = (featuredMediaId) => {
    updateNested("presentation", "featuredMediaId", featuredMediaId || "");
  };

  const handleDocumentsChange = (documents) => {
    const nextDocuments = Array.isArray(documents) ? documents : [];

    const remainingDocumentIds = new Set(
      nextDocuments.map((document) => document?.id).filter(Boolean),
    );

    setFormData((currentData) => ({
      ...currentData,

      supportingDocuments: nextDocuments,

      awards: currentData.awards.map((award) => ({
        ...award,

        supportingDocumentIds: (award.supportingDocumentIds || []).filter(
          (documentId) => remainingDocumentIds.has(documentId),
        ),
      })),
    }));

    unregisterRemovedAssets(nextDocuments);
    clearFieldError("supportingDocuments");
    clearFieldError("awards");
  };

  const handleLifecycleChange = (lifecycleStatus) => {
    const isCurrent = ["in-progress", "maintained"].includes(lifecycleStatus);
    setFormData((current) => ({
      ...current,
      lifecycleStatus,
      dates: {
        ...current.dates,
        isCurrent: isCurrent
          ? true
          : lifecycleStatus === "completed"
            ? false
            : current.dates.isCurrent,
        endDate: isCurrent ? "" : current.dates.endDate,
      },
    }));
    clearFieldError("lifecycleStatus");
    clearFieldError("dates.endDate");
  };

  const handleCurrentChange = (isCurrent) => {
    setFormData((current) => ({
      ...current,
      lifecycleStatus:
        isCurrent &&
        !["in-progress", "maintained"].includes(current.lifecycleStatus)
          ? "in-progress"
          : current.lifecycleStatus,
      dates: {
        ...current.dates,
        isCurrent,
        endDate: isCurrent ? "" : current.dates.endDate,
      },
    }));
    clearFieldError("dates.endDate");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitError("");

    const validation = validateProject(formData, relationshipCollections);

    setFieldErrors(validation.fieldErrors || {});
    setWarnings(validation.warnings || []);

    if (!validation.isValid) {
      const errorCount = validation.errors?.length || 0;

      setSubmitError(
        `${errorCount} ${
          errorCount === 1 ? "problem must" : "problems must"
        } be corrected before saving.`,
      );

      const firstField = validation.errors?.[0]?.field;

      if (firstField) {
        document.querySelector(`[data-field="${firstField}"]`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      return;
    }

    try {
      await onSubmit?.(formData, {
        mediaUploads,
        documentUploads,
        removedAssetStorageKeys,
      });
    } catch (error) {
      setFieldErrors(
        error?.fieldErrors || error?.validation?.fieldErrors || {},
      );

      setWarnings(error?.warnings || error?.validation?.warnings || []);

      setSubmitError(
        error?.publicMessage ||
          error?.message ||
          "The project could not be saved.",
      );
    }
  };

  const fieldId = (name) => formId + "-" + name;

  return (
    <form className="project-form" onSubmit={handleSubmit} noValidate>
      <FormSection
        label="Project Identity"
        title="Project and Professional Role"
        description="Identify the project, its professional category, ownership, and your contribution role."
      >
        <div className="project-form-grid">
          <FormField
            field="title"
            label="Project Title"
            error={fieldErrors.title}
            required
            wide
            count={formData.title.length + "/" + PROJECT_FIELD_LIMITS.title}
          >
            <input
              id={fieldId("title")}
              type="text"
              value={formData.title}
              onChange={(event) => updateTopLevel("title", event.target.value)}
              maxLength={PROJECT_FIELD_LIMITS.title}
              placeholder="Example: Electrical Energy Management System"
              disabled={isSaving}
            />
          </FormField>

          <SelectField
            id={fieldId("category")}
            field="category"
            label="Project Category"
            value={formData.category}
            options={PROJECT_CATEGORY_OPTIONS}
            error={fieldErrors.category}
            required
            disabled={isSaving}
            onChange={(value) => updateTopLevel("category", value)}
          />

          <SelectField
            id={fieldId("lifecycle")}
            field="lifecycleStatus"
            label="Project Lifecycle"
            value={formData.lifecycleStatus}
            options={PROJECT_LIFECYCLE_STATUS_OPTIONS}
            error={fieldErrors.lifecycleStatus}
            required
            disabled={isSaving}
            onChange={handleLifecycleChange}
          />

          <FormField
            field="role"
            label="Your Role"
            error={fieldErrors.role}
            required
            count={formData.role.length + "/" + PROJECT_FIELD_LIMITS.role}
          >
            <input
              id={fieldId("role")}
              type="text"
              value={formData.role}
              onChange={(event) => updateTopLevel("role", event.target.value)}
              maxLength={PROJECT_FIELD_LIMITS.role}
              placeholder="Lead Engineer and Full-Stack Developer"
              disabled={isSaving}
            />
          </FormField>

          <SelectField
            id={fieldId("ownership")}
            field="ownership"
            label="Project Ownership"
            value={formData.ownership}
            options={PROJECT_OWNERSHIP_OPTIONS}
            error={fieldErrors.ownership}
            disabled={isSaving}
            onChange={(value) => updateTopLevel("ownership", value)}
          />

          {[
            ["name", "Organization", "Employer, university, or organization"],
            ["clientName", "Client Name", "Optional client or beneficiary"],
          ].map(([field, label, placeholder]) => (
            <FormField
              key={field}
              field={"organization." + field}
              label={label}
              error={fieldErrors["organization." + field]}
            >
              <input
                type="text"
                value={formData.organization[field]}
                onChange={(event) =>
                  updateNested("organization", field, event.target.value)
                }
                maxLength={
                  field === "name"
                    ? PROJECT_FIELD_LIMITS.organizationName
                    : PROJECT_FIELD_LIMITS.clientName
                }
                placeholder={placeholder}
                disabled={isSaving}
              />
            </FormField>
          ))}

          <FormField
            field="organization.website"
            label="Organization Website"
            error={fieldErrors["organization.website"]}
            wide
          >
            <input
              type="url"
              value={formData.organization.website}
              onChange={(event) =>
                updateNested("organization", "website", event.target.value)
              }
              maxLength={PROJECT_FIELD_LIMITS.website}
              placeholder="https://www.example.com"
              disabled={isSaving}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        label="Timeline and Links"
        title="Dates, Location, and Project Access"
        description="Record when the work occurred and where viewers can explore the project."
      >
        <div className="project-form-grid">
          <FormField
            field="dates.startDate"
            label="Start Date"
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
            field="dates.endDate"
            label="End Date"
            error={fieldErrors["dates.endDate"]}
            required={
              !formData.dates.isCurrent &&
              ["completed", "cancelled"].includes(formData.lifecycleStatus)
            }
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

          <label className="project-form-checkbox project-form-wide">
            <input
              type="checkbox"
              checked={formData.dates.isCurrent}
              onChange={(event) => handleCurrentChange(event.target.checked)}
              disabled={isSaving}
            />
            <span>
              <strong>This project is ongoing</strong>
              <small>The end date will be displayed as Present.</small>
            </span>
          </label>

          <FormField
            field="location.displayValue"
            label="Project Location"
            error={fieldErrors["location.displayValue"]}
            wide
          >
            <input
              type="text"
              value={formData.location.displayValue}
              onChange={(event) =>
                updateNested("location", "displayValue", event.target.value)
              }
              maxLength={PROJECT_FIELD_LIMITS.locationDisplayValue}
              placeholder="Boca Raton, Florida or Remote"
              disabled={isSaving}
            />
          </FormField>

          {[
            ["liveUrl", "Live Project URL"],
            ["repositoryUrl", "Repository URL"],
            ["documentationUrl", "Documentation URL"],
            ["caseStudyUrl", "External Case Study"],
            ["videoUrl", "External Demo Video"],
          ].map(([field, label]) => (
            <FormField
              key={field}
              field={"links." + field}
              label={label}
              error={fieldErrors["links." + field]}
              wide={field === "videoUrl"}
            >
              <input
                type="url"
                value={formData.links[field]}
                onChange={(event) =>
                  updateNested("links", field, event.target.value)
                }
                maxLength={PROJECT_FIELD_LIMITS.url}
                placeholder="https://"
                disabled={isSaving}
              />
            </FormField>
          ))}
        </div>
      </FormSection>

      <FormSection
        label="Problem and Purpose"
        title="Professional Context and Objectives"
        description="Explain the need, intended users, constraints, and goals that shaped the project."
      >
        <div className="project-form-grid">
          <TextAreaField
            field="problem.statement"
            label="Problem or Opportunity"
            value={formData.problem.statement}
            limit={PROJECT_FIELD_LIMITS.problemStatement}
            rows={5}
            error={fieldErrors["problem.statement"]}
            placeholder="What problem, unmet need, or opportunity led to this project?"
            disabled={isSaving}
            onChange={(value) => updateNested("problem", "statement", value)}
          />
          <TextAreaField
            field="problem.targetAudience"
            label="Target Users or Beneficiaries"
            value={formData.problem.targetAudience}
            limit={PROJECT_FIELD_LIMITS.targetAudience}
            rows={3}
            error={fieldErrors["problem.targetAudience"]}
            placeholder="Who benefits from the solution, and what do they need?"
            disabled={isSaving}
            onChange={(value) =>
              updateNested("problem", "targetAudience", value)
            }
          />
          <TextAreaField
            field="problem.context"
            label="Background and Context"
            value={formData.problem.context}
            limit={PROJECT_FIELD_LIMITS.context}
            rows={4}
            error={fieldErrors["problem.context"]}
            placeholder="Describe the business, academic, technical, or community context."
            disabled={isSaving}
            onChange={(value) => updateNested("problem", "context", value)}
          />
          <TextAreaField
            field="problem.importance"
            label="Why This Project Mattered"
            value={formData.problem.importance}
            limit={PROJECT_FIELD_LIMITS.importance}
            rows={4}
            error={fieldErrors["problem.importance"]}
            placeholder="Explain why solving this problem was professionally, technically, academically, or socially important."
            disabled={isSaving}
            onChange={(value) => updateNested("problem", "importance", value)}
          />
        </div>

        <div className="project-form-editor-grid">
          <OrderedTextEditor
            title="Project Objectives"
            itemLabel="Objective"
            values={formData.problem.objectives}
            maximumItems={PROJECT_FIELD_LIMITS.maximumObjectives}
            disabled={isSaving}
            onChange={(values) =>
              updateCollection("problem", "objectives", values)
            }
          />
          <OrderedTextEditor
            title="Constraints and Requirements"
            itemLabel="Constraint"
            values={formData.problem.constraints}
            maximumItems={PROJECT_FIELD_LIMITS.maximumConstraints}
            disabled={isSaving}
            onChange={(values) =>
              updateCollection("problem", "constraints", values)
            }
          />
        </div>
      </FormSection>

      <FormSection
        label="Solution"
        title="Approach, Architecture, and Contributions"
        description="Present what you built, how it works, and the work you personally completed."
      >
        <div className="project-form-grid">
          {[
            ["overview", "Solution Overview", PROJECT_FIELD_LIMITS.overview, 5],
            [
              "approach",
              "Implementation Approach",
              PROJECT_FIELD_LIMITS.approach,
              5,
            ],
            [
              "architecture",
              "Architecture or Technical Design",
              PROJECT_FIELD_LIMITS.architecture,
              5,
            ],
          ].map(([field, label, limit, rows]) => (
            <TextAreaField
              key={field}
              field={"solution." + field}
              label={label}
              value={formData.solution[field]}
              limit={limit}
              rows={rows}
              error={fieldErrors["solution." + field]}
              disabled={isSaving}
              onChange={(value) => updateNested("solution", field, value)}
            />
          ))}
        </div>

        <div className="project-form-editor-grid">
          <OrderedTextEditor
            title="Key Features"
            itemLabel="Feature"
            values={formData.solution.features}
            maximumItems={PROJECT_FIELD_LIMITS.maximumFeatures}
            disabled={isSaving}
            onChange={(values) =>
              updateCollection("solution", "features", values)
            }
          />
          <OrderedTextEditor
            title="My Contributions"
            itemLabel="Contribution"
            values={formData.solution.contributions}
            maximumItems={PROJECT_FIELD_LIMITS.maximumContributions}
            disabled={isSaving}
            onChange={(values) =>
              updateCollection("solution", "contributions", values)
            }
          />
        </div>
      </FormSection>

      <FormSection
        label="Results and Impact"
        title="Outcomes, Evidence, and Learning"
        description="Show what changed because of the project and support the story with measurable evidence."
      >
        <div className="project-form-grid">
          {[
            ["outcome", "Final Outcome", PROJECT_FIELD_LIMITS.outcome, 5],
            [
              "problemsSolved",
              "Problems Solved",
              PROJECT_FIELD_LIMITS.problemsSolved,
              4,
            ],
            [
              "impact",
              "Professional or User Impact",
              PROJECT_FIELD_LIMITS.impact,
              4,
            ],
            [
              "beneficiariesAffected",
              "People or Organizations Affected",
              PROJECT_FIELD_LIMITS.beneficiariesAffected,
              4,
            ],
          ].map(([field, label, limit, rows]) => (
            <TextAreaField
              key={field}
              field={"results." + field}
              label={label}
              value={formData.results[field]}
              limit={limit}
              rows={rows}
              error={fieldErrors["results." + field]}
              disabled={isSaving}
              onChange={(value) => updateNested("results", field, value)}
            />
          ))}
        </div>

        <MetricEditor
          values={formData.results.metrics}
          disabled={isSaving}
          onChange={(values) => updateCollection("results", "metrics", values)}
        />

        <div className="project-form-grid">
          {[
            [
              "lessonsLearned",
              "Lessons Learned",
              PROJECT_FIELD_LIMITS.lessonsLearned,
            ],
            [
              "futureImprovements",
              "Future Improvements",
              PROJECT_FIELD_LIMITS.futureImprovements,
            ],
          ].map(([field, label, limit]) => (
            <TextAreaField
              key={field}
              field={"results." + field}
              label={label}
              value={formData.results[field]}
              limit={limit}
              rows={4}
              error={fieldErrors["results." + field]}
              disabled={isSaving}
              onChange={(value) => updateNested("results", field, value)}
            />
          ))}
        </div>
      </FormSection>

      <FormSection
        label="Technology and Recognition"
        title="Technology Stack and Awards"
        description="Document the tools behind the work and any external recognition it received."
      >
        <TechnologyEditor
          values={formData.technologies}
          disabled={isSaving}
          onChange={(values) => updateTopLevel("technologies", values)}
        />
        <AwardEditor
          values={formData.awards}
          documents={availableDocuments}
          disabled={isSaving}
          onChange={(values) => updateTopLevel("awards", values)}
        />
      </FormSection>

      {/*
       * =========================================
       * Professional Relationships
       * =========================================
       */}

      <ProjectRelationshipEditor
        project={formData}
        collections={relationshipCollections}
        isLoading={Boolean(relationshipCollections.isLoading)}
        disabled={isSaving}
        fieldErrors={fieldErrors}
        onSkillRelationshipsChange={(relationships) =>
          updateTopLevel("skillRelationships", relationships)
        }
        onRelatedRecordsChange={updateRelatedRecords}
      />

      {/*
       * =========================================
       * Project Images and Videos
       * =========================================
       */}

      <ProjectMediaEditor
        media={formData.media || []}
        uploads={mediaUploads}
        featuredMediaId={formData.presentation.featuredMediaId}
        disabled={isSaving}
        error={fieldErrors.media}
        onChange={handleMediaChange}
        onUploadsChange={setMediaUploads}
        onFeaturedMediaChange={handleFeaturedMediaChange}
        onRemoveStoredAsset={registerRemovedAsset}
      />

      {/*
       * =========================================
       * Project Documents
       * =========================================
       */}

      <ProjectDocumentEditor
        documents={formData.supportingDocuments || []}
        uploads={documentUploads}
        disabled={isSaving}
        error={fieldErrors.supportingDocuments}
        onChange={handleDocumentsChange}
        onUploadsChange={setDocumentUploads}
        onRemoveStoredAsset={registerRemovedAsset}
      />

      <FormSection
        label="Portfolio Presentation"
        title="Public Project Story"
        description="Prepare the concise summary and detailed case study used by your professional portfolio."
      >
        <label className="project-form-featured-option">
          <input
            type="checkbox"
            checked={formData.presentation.isFeatured}
            onChange={(event) =>
              updateNested("presentation", "isFeatured", event.target.checked)
            }
            disabled={isSaving}
          />
          <span>
            <strong>Feature this project</strong>
            <small>
              Featured projects appear first in the portfolio library.
            </small>
          </span>
        </label>

        <div className="project-form-grid">
          <TextAreaField
            field="presentation.shortSummary"
            label="Portfolio Summary"
            value={formData.presentation.shortSummary}
            limit={PROJECT_FIELD_LIMITS.shortSummary}
            rows={4}
            error={fieldErrors["presentation.shortSummary"]}
            help="Write two or three strong sentences for the Project Item."
            disabled={isSaving}
            onChange={(value) =>
              updateNested("presentation", "shortSummary", value)
            }
          />
          <TextAreaField
            field="presentation.caseStudy"
            label="Detailed Case Study"
            value={formData.presentation.caseStudy}
            limit={PROJECT_FIELD_LIMITS.caseStudy}
            rows={10}
            error={fieldErrors["presentation.caseStudy"]}
            disabled={isSaving}
            onChange={(value) =>
              updateNested("presentation", "caseStudy", value)
            }
          />
        </div>
      </FormSection>

      <FormSection
        label="Management"
        title="Visibility and Record Settings"
        description="Control public presentation, private notes, record origin, and archive availability."
      >
        <div className="project-form-visibility">
          {[
            ["showOrganization", "Show organization"],
            ["showDates", "Show project dates"],
            ["showLocation", "Show project location"],
            ["showLinks", "Show project links"],
            ["showProblem", "Show problem and purpose"],
            ["showSolution", "Show solution"],
            ["showResults", "Show results and impact"],
            ["showSkills", "Show related skills"],
            ["showTechnologies", "Show technologies"],
            ["showRelatedRecords", "Show related professional records"],
            ["showAwards", "Show awards"],
            ["showMedia", "Show images and videos"],
            ["showSupportingDocuments", "Show public documents"],
          ].map(([field, label]) => (
            <label key={field} className="project-form-checkbox">
              <input
                type="checkbox"
                checked={Boolean(formData.visibility[field])}
                onChange={(event) =>
                  updateNested("visibility", field, event.target.checked)
                }
                disabled={isSaving}
              />
              <span>
                <strong>{label}</strong>
              </span>
            </label>
          ))}
        </div>

        <div className="project-form-grid">
          <SelectField
            id={fieldId("source")}
            field="source"
            label="Record Source"
            value={formData.source}
            options={PROJECT_SOURCE_OPTIONS}
            error={fieldErrors.source}
            disabled={isSaving}
            onChange={(value) => updateTopLevel("source", value)}
          />
          <SelectField
            id={fieldId("record-status")}
            field="recordStatus"
            label="Record Status"
            value={formData.recordStatus}
            options={PROJECT_RECORD_STATUS_OPTIONS}
            error={fieldErrors.recordStatus}
            disabled={isSaving}
            onChange={(value) => updateTopLevel("recordStatus", value)}
          />
          <FormField
            field="sourceContext"
            label="Source Context"
            error={fieldErrors.sourceContext}
            wide
            count={
              formData.sourceContext.length +
              "/" +
              PROJECT_FIELD_LIMITS.sourceContext
            }
          >
            <input
              type="text"
              value={formData.sourceContext}
              onChange={(event) =>
                updateTopLevel("sourceContext", event.target.value)
              }
              maxLength={PROJECT_FIELD_LIMITS.sourceContext}
              disabled={isSaving}
            />
          </FormField>
          <TextAreaField
            field="privateInformation.notes"
            label="Private Notes"
            value={formData.privateInformation.notes}
            limit={PROJECT_FIELD_LIMITS.privateNotes}
            rows={5}
            error={fieldErrors["privateInformation.notes"]}
            help="Private notes are excluded from public Project output."
            disabled={isSaving}
            onChange={(value) =>
              updateNested("privateInformation", "notes", value)
            }
          />
        </div>
      </FormSection>

      {warnings.length > 0 && (
        <section className="project-form-warnings">
          <strong>Suggestions for a stronger portfolio project</strong>
          <ul>
            {warnings.map((warning, index) => (
              <li key={(warning.code || warning.field) + "-" + index}>
                {warning.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {submitError && (
        <div className="project-form-submit-error" role="alert">
          <strong>Unable to save this project</strong>
          <p>{submitError}</p>
        </div>
      )}

      <footer className="project-form-footer">
        <div>
          <span>Project Profile</span>
          <strong>{validationSummary}</strong>
        </div>
        <div>
          <button type="button" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
          <button
            type="submit"
            className="project-form-submit"
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Project"}
          </button>
        </div>
      </footer>
    </form>
  );
}

function FormSection({ label, title, description, children }) {
  return (
    <section className="project-form-section">
      <header className="project-form-section-header">
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

function FormField({
  field,
  label,
  required = false,
  error = "",
  help = "",
  count = "",
  wide = false,
  children,
}) {
  return (
    <label
      className={
        "project-form-field " +
        (wide ? "project-form-wide " : "") +
        (error ? "project-form-field--error" : "")
      }
      data-field={field}
    >
      <span>
        <strong>
          {label}
          {required && <i aria-hidden="true"> *</i>}
        </strong>
        {count && <small>{count}</small>}
      </span>
      {children}
      {help && !error && <small className="project-form-help">{help}</small>}
      {error && (
        <small className="project-form-field-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}

function SelectField({ id, field, label, value, options, onChange, ...props }) {
  return (
    <FormField field={field} label={label} {...props}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={props.disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function TextAreaField({
  field,
  label,
  value,
  limit,
  rows,
  onChange,
  ...props
}) {
  return (
    <FormField
      field={field}
      label={label}
      count={value.length + "/" + limit}
      wide
      {...props}
    >
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={limit}
        placeholder={props.placeholder}
        disabled={props.disabled}
      />
    </FormField>
  );
}

function OrderedTextEditor({
  title,
  itemLabel,
  values = [],
  maximumItems,
  disabled,
  onChange,
}) {
  const add = () =>
    onChange([
      ...values,
      {
        id: createProjectId("project-" + itemLabel.toLowerCase()),
        text: "",
        order: values.length,
      },
    ]);
  const update = (index, value) =>
    onChange(
      values.map((item, itemIndex) =>
        itemIndex === index ? { ...item, text: value } : item,
      ),
    );
  const remove = (index) =>
    onChange(
      values
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, order) => ({ ...item, order })),
    );

  return (
    <div className="project-form-collection-editor">
      <header>
        <div>
          <h4>{title}</h4>
          <p>Add focused, outcome-oriented statements.</p>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={disabled || values.length >= maximumItems}
        >
          Add {itemLabel}
        </button>
      </header>
      {values.map((item, index) => (
        <div className="project-form-ordered-row" key={item.id}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <textarea
            rows={3}
            value={item.text}
            onChange={(event) => update(index, event.target.value)}
            maxLength={PROJECT_FIELD_LIMITS.orderedItemText}
            placeholder={itemLabel + " " + (index + 1)}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => remove(index)}
            disabled={disabled}
          >
            ×
          </button>
        </div>
      ))}
      {values.length === 0 && (
        <p className="project-form-empty">No entries added.</p>
      )}
    </div>
  );
}

function MetricEditor({ values = [], disabled, onChange }) {
  const add = () =>
    onChange([
      ...values,
      {
        id: createProjectId("project-metric"),
        label: "",
        value: "",
        description: "",
        order: values.length,
      },
    ]);
  return (
    <CollectionEditor
      title="Impact Metrics"
      description="Add measurable evidence such as users served, time saved, accuracy, reliability, or performance."
      buttonLabel="Add Metric"
      values={values}
      maximum={PROJECT_FIELD_LIMITS.maximumMetrics}
      disabled={disabled}
      onAdd={add}
      onChange={onChange}
      fields={[
        ["label", "Metric name", PROJECT_FIELD_LIMITS.metricLabel],
        ["value", "Value or result", PROJECT_FIELD_LIMITS.metricValue],
        [
          "description",
          "Supporting context",
          PROJECT_FIELD_LIMITS.metricDescription,
        ],
      ]}
    />
  );
}

function TechnologyEditor({ values = [], disabled, onChange }) {
  const addTechnology = () => {
    onChange([
      ...values,
      {
        id: createProjectId("project-technology"),
        name: "",
        category: "other",
        order: values.length,
      },
    ]);
  };

  const updateTechnology = (index, field, value) => {
    onChange(
      values.map((technology, technologyIndex) =>
        technologyIndex === index
          ? {
              ...technology,
              [field]: value,
            }
          : technology,
      ),
    );
  };

  const removeTechnology = (index) => {
    onChange(
      values
        .filter((_, technologyIndex) => technologyIndex !== index)
        .map((technology, order) => ({
          ...technology,
          order,
        })),
    );
  };

  return (
    <div className="project-form-collection-editor">
      <header>
        <div>
          <h4>Technologies and Tools</h4>

          <p>
            Add languages, frameworks, databases, cloud platforms, hardware, and
            professional tools.
          </p>
        </div>

        <button
          type="button"
          onClick={addTechnology}
          disabled={
            disabled ||
            values.length >= PROJECT_FIELD_LIMITS.maximumTechnologies
          }
        >
          Add Technology
        </button>
      </header>

      {values.map((technology, index) => (
        <div className="project-form-technology-row" key={technology.id}>
          <input
            type="text"
            value={technology.name}
            onChange={(event) =>
              updateTechnology(index, "name", event.target.value)
            }
            maxLength={PROJECT_FIELD_LIMITS.technologyName}
            placeholder="Example: React"
            aria-label={`Technology ${index + 1} name`}
            disabled={disabled}
          />

          <select
            value={technology.category}
            onChange={(event) =>
              updateTechnology(index, "category", event.target.value)
            }
            aria-label={`Technology ${index + 1} category`}
            disabled={disabled}
          >
            {PROJECT_TECHNOLOGY_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => removeTechnology(index)}
            disabled={disabled}
            aria-label={`Remove ${technology.name || "technology"}`}
          >
            Remove
          </button>
        </div>
      ))}

      {values.length === 0 && (
        <p className="project-form-empty">No technologies or tools added.</p>
      )}
    </div>
  );
}

function CollectionEditor({
  title,
  description,
  buttonLabel,
  values,
  maximum,
  disabled,
  onAdd,
  onChange,
  fields,
}) {
  const update = (index, field, value) =>
    onChange(
      values.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  const remove = (index) =>
    onChange(
      values
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, order) => ({ ...item, order })),
    );

  return (
    <div className="project-form-collection-editor">
      <header>
        <div>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled || values.length >= maximum}
        >
          {buttonLabel}
        </button>
      </header>
      {values.map((item, index) => (
        <div className="project-form-collection-row" key={item.id}>
          {fields.map(([field, placeholder, limit]) => (
            <input
              key={field}
              type="text"
              value={item[field]}
              onChange={(event) => update(index, field, event.target.value)}
              maxLength={limit}
              placeholder={placeholder}
              disabled={disabled}
            />
          ))}
          <button
            type="button"
            onClick={() => remove(index)}
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      ))}
      {values.length === 0 && (
        <p className="project-form-empty">No entries added.</p>
      )}
    </div>
  );
}

function AwardEditor({ values = [], documents = [], disabled, onChange }) {
  const updateAward = (index, field, value) => {
    onChange(
      values.map((award, awardIndex) =>
        awardIndex === index
          ? {
              ...award,
              [field]: value,
            }
          : award,
      ),
    );
  };

  const removeAward = (index) => {
    onChange(
      values
        .filter((_, awardIndex) => awardIndex !== index)
        .map((award, order) => ({
          ...award,
          order,
        })),
    );
  };

  const toggleSupportingDocument = (awardIndex, documentId, checked) => {
    const award = values[awardIndex];

    const currentDocumentIds = Array.isArray(award.supportingDocumentIds)
      ? award.supportingDocumentIds
      : [];

    const nextDocumentIds = checked
      ? [...new Set([...currentDocumentIds, documentId])]
      : currentDocumentIds.filter(
          (currentDocumentId) => currentDocumentId !== documentId,
        );

    updateAward(awardIndex, "supportingDocumentIds", nextDocumentIds);
  };

  const activeDocuments = documents.filter(
    (document) => document.status !== "archived",
  );

  return (
    <div className="project-form-collection-editor">
      <header>
        <div>
          <h4>Awards and Recognition</h4>

          <p>
            Record awards, placements, grants, showcases, nominations, or other
            professional recognition.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onChange([
              ...values,
              {
                id: createProjectId("project-award"),
                name: "",
                organization: "",
                recognitionType: "award",
                placement: "",
                date: "",
                url: "",
                description: "",
                supportingDocumentIds: [],
                order: values.length,
              },
            ])
          }
          disabled={
            disabled || values.length >= PROJECT_FIELD_LIMITS.maximumAwards
          }
        >
          Add Recognition
        </button>
      </header>

      {values.map((award, index) => (
        <article className="project-form-award" key={award.id}>
          <header>
            <span>Recognition {String(index + 1).padStart(2, "0")}</span>

            <button
              type="button"
              onClick={() => removeAward(index)}
              disabled={disabled}
              aria-label={`Remove ${award.name || "recognition"}`}
            >
              Remove
            </button>
          </header>

          <div className="project-form-award-grid">
            <input
              type="text"
              value={award.name}
              onChange={(event) =>
                updateAward(index, "name", event.target.value)
              }
              maxLength={PROJECT_FIELD_LIMITS.awardName}
              placeholder="Award or recognition name"
              aria-label={`Recognition ${index + 1} name`}
              disabled={disabled}
            />

            <input
              type="text"
              value={award.organization}
              onChange={(event) =>
                updateAward(index, "organization", event.target.value)
              }
              maxLength={PROJECT_FIELD_LIMITS.awardOrganization}
              placeholder="Awarding organization"
              aria-label={`Recognition ${index + 1} organization`}
              disabled={disabled}
            />

            <select
              value={award.recognitionType}
              onChange={(event) =>
                updateAward(index, "recognitionType", event.target.value)
              }
              aria-label={`Recognition ${index + 1} type`}
              disabled={disabled}
            >
              {PROJECT_RECOGNITION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={award.placement}
              onChange={(event) =>
                updateAward(index, "placement", event.target.value)
              }
              aria-label={`Recognition ${index + 1} placement`}
              disabled={disabled}
            >
              {PROJECT_AWARD_PLACEMENT_OPTIONS.map((option) => (
                <option
                  key={option.value || "not-specified"}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="month"
              value={award.date}
              onChange={(event) =>
                updateAward(index, "date", event.target.value)
              }
              aria-label={`Recognition ${index + 1} date`}
              disabled={disabled}
            />

            <input
              type="url"
              value={award.url}
              onChange={(event) =>
                updateAward(index, "url", event.target.value)
              }
              maxLength={PROJECT_FIELD_LIMITS.url}
              placeholder="https://example.com/recognition"
              aria-label={`Recognition ${index + 1} URL`}
              disabled={disabled}
            />
          </div>

          <textarea
            rows={3}
            value={award.description}
            onChange={(event) =>
              updateAward(index, "description", event.target.value)
            }
            maxLength={PROJECT_FIELD_LIMITS.awardDescription}
            placeholder="Describe the recognition and why it matters."
            aria-label={`Recognition ${index + 1} description`}
            disabled={disabled}
          />

          <fieldset className="project-form-award-documents">
            <legend>Supporting documents</legend>

            {activeDocuments.length > 0 ? (
              activeDocuments.map((document) => {
                const checked = (award.supportingDocumentIds || []).includes(
                  document.id,
                );

                return (
                  <label key={document.id}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        toggleSupportingDocument(
                          index,
                          document.id,
                          event.target.checked,
                        )
                      }
                      disabled={disabled}
                    />

                    <span>
                      {document.name || document.fileName || "Project document"}
                    </span>
                  </label>
                );
              })
            ) : (
              <p>
                Add the document in the Project Documents section, save the
                Project, and then connect it to this recognition.
              </p>
            )}
          </fieldset>
        </article>
      ))}

      {values.length === 0 && (
        <p className="project-form-empty">No awards or recognition added.</p>
      )}
    </div>
  );
}

export default ProjectForm;
