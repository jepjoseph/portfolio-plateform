import { useEffect, useMemo, useState } from "react";

import {
  EDUCATION_CREDENTIAL_TYPE_OPTIONS,
  EDUCATION_FIELD_LIMITS,
  EDUCATION_INSTITUTION_TYPE_OPTIONS,
  EDUCATION_SOURCE_OPTIONS,
  EDUCATION_STATUS_OPTIONS,
} from "../../../../config/educationConfig.js";

import {
  createEducationActivity,
  createEducationCoursework,
  createEducationHonor,
  createEmptyEducation,
  normalizeEducation,
} from "../../../../models/educationModel.js";

import {
  getEducationValidationSummary,
  validateEducation,
} from "../../../../services/Education/educationValidation.js";

import EducationOrderedItemEditor from "../EducationOrderedItemEditor/EducationOrderedItemEditor.jsx";
import EducationSkillsEditor from "../EducationSkillsEditor/EducationSkillsEditor.jsx";
import EducationDocumentEditor from "../EducationDocumentEditor/EducationDocumentEditor.jsx";

import "./EducationForm.css";

function EducationForm({
  initialEducation = null,
  isSaving = false,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState(() =>
    initialEducation
      ? normalizeEducation(initialEducation)
      : createEmptyEducation(),
  );

  const [fieldErrors, setFieldErrors] = useState({});

  const [warnings, setWarnings] = useState([]);

  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setFormData(
      initialEducation
        ? normalizeEducation(initialEducation)
        : createEmptyEducation(),
    );

    setFieldErrors({});
    setWarnings([]);
    setSubmitError("");
  }, [initialEducation]);

  const validationSummary = useMemo(
    () => getEducationValidationSummary(formData),
    [formData],
  );

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

  const clearFieldError = (field) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[field];

      return next;
    });

    setSubmitError("");
  };

  const handleCurrentChange = (checked) => {
    setFormData((current) => ({
      ...current,

      dates: {
        ...current.dates,
        isCurrent: checked,
        endDate: checked ? "" : current.dates.endDate,
      },
    }));

    clearFieldError("dates.endDate");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validation = validateEducation(formData);

    setFieldErrors(validation.fieldErrors);

    setWarnings(validation.warnings);

    if (!validation.isValid) {
      setSubmitError(
        `${validation.errors.length} ${
          validation.errors.length === 1 ? "problem must" : "problems must"
        } be corrected before saving.`,
      );

      const firstError = validation.errors[0];

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

      await onSubmit?.(formData);
    } catch (error) {
      setFieldErrors(error?.fieldErrors || {});

      setSubmitError(
        error?.publicMessage ||
          error?.message ||
          "The education record could not be saved.",
      );
    }
  };

  return (
    <form className="education-form" onSubmit={handleSubmit} noValidate>
      <section className="education-form-section">
        <SectionHeader
          label="Institution"
          title="Institution Information"
          description="Enter the school, university, college, or educational provider."
        />

        <div className="education-form-grid">
          <FormField
            label="Institution Name"
            field="institution.name"
            error={fieldErrors["institution.name"]}
            required
          >
            <input
              type="text"
              value={formData.institution.name}
              onChange={(event) =>
                updateNested("institution", "name", event.target.value)
              }
              maxLength={EDUCATION_FIELD_LIMITS.institutionName}
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Institution Type"
            field="institution.type"
            error={fieldErrors["institution.type"]}
          >
            <select
              value={formData.institution.type}
              onChange={(event) =>
                updateNested("institution", "type", event.target.value)
              }
              disabled={isSaving}
            >
              {EDUCATION_INSTITUTION_TYPE_OPTIONS.map((option) => (
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
            label="Institution Website"
            field="institution.website"
            error={fieldErrors["institution.website"]}
            wide
          >
            <input
              type="url"
              value={formData.institution.website}
              onChange={(event) =>
                updateNested("institution", "website", event.target.value)
              }
              maxLength={EDUCATION_FIELD_LIMITS.institutionWebsite}
              placeholder="https://www.example.edu"
              disabled={isSaving}
            />
          </FormField>
        </div>
      </section>

      <section className="education-form-section">
        <SectionHeader
          label="Credential"
          title="Degree and Field of Study"
          description="Describe the credential, degree, diploma, or academic program."
        />

        <div className="education-form-grid">
          <FormField
            label="Credential Type"
            field="credential.type"
            error={fieldErrors["credential.type"]}
            required
          >
            <select
              value={formData.credential.type}
              onChange={(event) =>
                updateNested("credential", "type", event.target.value)
              }
              disabled={isSaving}
            >
              {EDUCATION_CREDENTIAL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Credential Name"
            field="credential.name"
            error={fieldErrors["credential.name"]}
            required
          >
            <input
              type="text"
              value={formData.credential.name}
              onChange={(event) =>
                updateNested("credential", "name", event.target.value)
              }
              maxLength={EDUCATION_FIELD_LIMITS.credentialName}
              placeholder="Bachelor of Science"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Field of Study"
            field="credential.fieldOfStudy"
            error={fieldErrors["credential.fieldOfStudy"]}
          >
            <input
              type="text"
              value={formData.credential.fieldOfStudy}
              onChange={(event) =>
                updateNested("credential", "fieldOfStudy", event.target.value)
              }
              maxLength={EDUCATION_FIELD_LIMITS.fieldOfStudy}
              placeholder="Computer Engineering"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Minor"
            field="credential.minor"
            error={fieldErrors["credential.minor"]}
          >
            <input
              type="text"
              value={formData.credential.minor}
              onChange={(event) =>
                updateNested("credential", "minor", event.target.value)
              }
              maxLength={EDUCATION_FIELD_LIMITS.minor}
              disabled={isSaving}
            />
          </FormField>
        </div>
      </section>

      <section className="education-form-section">
        <SectionHeader
          label="Timeline"
          title="Dates and Location"
          description="Record when and where this education occurred."
        />

        <div className="education-form-grid">
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

          <label className="education-form-checkbox education-form-wide">
            <input
              type="checkbox"
              checked={formData.dates.isCurrent}
              onChange={(event) => handleCurrentChange(event.target.checked)}
              disabled={isSaving}
            />

            <span>I am currently completing this education</span>
          </label>

          {[
            ["city", "City"],
            ["stateRegion", "State or Region"],
            ["country", "Country"],
            ["displayValue", "Display Location"],
          ].map(([field, label]) => (
            <FormField
              key={field}
              label={label}
              field={`location.${field}`}
              error={fieldErrors[`location.${field}`]}
            >
              <input
                type="text"
                value={formData.location[field]}
                onChange={(event) =>
                  updateNested("location", field, event.target.value)
                }
                disabled={isSaving}
              />
            </FormField>
          ))}
        </div>
      </section>

      <section className="education-form-section">
        <SectionHeader
          label="Academic"
          title="Academic Information"
          description="Add GPA information only when you want it available for future selection."
        />

        <div className="education-form-grid">
          <FormField
            label="GPA"
            field="academic.gpa"
            error={fieldErrors["academic.gpa"]}
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.academic.gpa ?? ""}
              onChange={(event) =>
                updateNested("academic", "gpa", event.target.value)
              }
              disabled={isSaving}
            />
          </FormField>

          <FormField
            label="Maximum GPA"
            field="academic.maximumGpa"
            error={fieldErrors["academic.maximumGpa"]}
          >
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.academic.maximumGpa ?? ""}
              onChange={(event) =>
                updateNested("academic", "maximumGpa", event.target.value)
              }
              placeholder="4.00"
              disabled={isSaving}
            />
          </FormField>
        </div>
      </section>

      <section className="education-form-section">
        <SectionHeader
          label="Overview"
          title="Education Description"
          description="Summarize the program, focus, or academic experience."
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
            maxLength={EDUCATION_FIELD_LIMITS.description}
            disabled={isSaving}
          />
        </FormField>
      </section>

      <EducationOrderedItemEditor
        values={formData.academic.honors}
        label="Academic Recognition"
        title="Honors and Awards"
        description="Add academic honors, distinctions, scholarships, or awards."
        itemLabel="Honor"
        emptyTitle="No honors added"
        emptyMessage="Academic honors and distinctions will appear here."
        namePlaceholder="Dean’s List"
        descriptionPlaceholder="Describe the recognition."
        maximumItems={EDUCATION_FIELD_LIMITS.maximumHonors}
        maximumNameLength={EDUCATION_FIELD_LIMITS.honorName}
        maximumDescriptionLength={EDUCATION_FIELD_LIMITS.honorDescription}
        fieldPath="academic.honors"
        fieldErrors={fieldErrors}
        disabled={isSaving}
        createItem={createEducationHonor}
        onChange={(honors) => updateNested("academic", "honors", honors)}
      />

      <EducationOrderedItemEditor
        values={formData.coursework}
        label="Relevant Learning"
        title="Relevant Coursework"
        description="Add courses that support your professional qualifications."
        itemLabel="Course"
        emptyTitle="No coursework added"
        emptyMessage="Relevant academic courses will appear here."
        namePlaceholder="Data Structures and Algorithms"
        descriptionPlaceholder="Describe relevant subjects or work."
        maximumItems={EDUCATION_FIELD_LIMITS.maximumCoursework}
        maximumNameLength={EDUCATION_FIELD_LIMITS.courseworkName}
        maximumDescriptionLength={EDUCATION_FIELD_LIMITS.courseworkDescription}
        fieldPath="coursework"
        fieldErrors={fieldErrors}
        disabled={isSaving}
        createItem={createEducationCoursework}
        onChange={(coursework) => updateTopLevel("coursework", coursework)}
      />

      <EducationOrderedItemEditor
        values={formData.activities}
        label="Academic Involvement"
        title="Activities and Organizations"
        description="Add clubs, organizations, research, leadership, or academic service."
        itemLabel="Activity"
        emptyTitle="No activities added"
        emptyMessage="Academic activities and organizations will appear here."
        namePlaceholder="Engineering Student Association"
        descriptionPlaceholder="Describe your participation or leadership."
        maximumItems={EDUCATION_FIELD_LIMITS.maximumActivities}
        maximumNameLength={EDUCATION_FIELD_LIMITS.activityName}
        maximumDescriptionLength={EDUCATION_FIELD_LIMITS.activityDescription}
        fieldPath="activities"
        fieldErrors={fieldErrors}
        disabled={isSaving}
        createItem={createEducationActivity}
        onChange={(activities) => updateTopLevel("activities", activities)}
      />

      <EducationSkillsEditor
        skillRelationships={formData.skillRelationships}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onChange={(relationships) =>
          updateTopLevel("skillRelationships", relationships)
        }
      />

      <EducationDocumentEditor
        educationId={formData.id}
        documents={formData.supportingDocuments}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onChange={(documents) =>
          updateTopLevel("supportingDocuments", documents)
        }
      />

      <section className="education-form-section">
        <SectionHeader
          label="Management"
          title="Record Settings"
          description="Control visibility, private notes, source, and archive status."
        />

        <div className="education-form-visibility">
          {[
            ["showInstitutionWebsite", "Show institution website"],
            ["showLocation", "Show location"],
            ["showGpa", "Allow GPA display"],
            ["showHonors", "Show honors"],
            ["showCoursework", "Show coursework"],
            ["showActivities", "Show activities"],
            ["showSkills", "Show related skills"],
          ].map(([field, label]) => (
            <label key={field} className="education-form-checkbox">
              <input
                type="checkbox"
                checked={formData.visibility[field]}
                onChange={(event) =>
                  updateNested("visibility", field, event.target.checked)
                }
                disabled={isSaving}
              />

              <span>{label}</span>
            </label>
          ))}
        </div>

        <div className="education-form-grid">
          <FormField label="Source" field="source" error={fieldErrors.source}>
            <select
              value={formData.source}
              onChange={(event) => updateTopLevel("source", event.target.value)}
              disabled={isSaving}
            >
              {EDUCATION_SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Status" field="status" error={fieldErrors.status}>
            <select
              value={formData.status}
              onChange={(event) => updateTopLevel("status", event.target.value)}
              disabled={isSaving}
            >
              {EDUCATION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              maxLength={EDUCATION_FIELD_LIMITS.privateNotes}
              disabled={isSaving}
            />
          </FormField>
        </div>
      </section>

      {submitError && (
        <p className="education-form-submit-error" role="alert">
          {submitError}
        </p>
      )}

      {warnings.length > 0 && (
        <div className="education-form-warnings">
          <strong>Suggestions</strong>

          <ul>
            {warnings.map((warning, index) => (
              <li key={`${warning.field}-${index}`}>{warning.message}</li>
            ))}
          </ul>
        </div>
      )}

      <footer className="education-form-footer">
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
            className="education-form-submit"
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : initialEducation
                ? "Save Changes"
                : "Create Education"}
          </button>
        </div>
      </footer>
    </form>
  );
}

function SectionHeader({ label, title, description }) {
  return (
    <header className="education-form-section-header">
      <span aria-hidden="true" />

      <div>
        <small>{label}</small>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </header>
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
      className={`education-form-field ${wide ? "education-form-wide" : ""}`}
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

export default EducationForm;
