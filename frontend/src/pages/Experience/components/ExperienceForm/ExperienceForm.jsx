import { useEffect, useId, useState } from "react";

import {
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_CATEGORY_OPTIONS,
  EXPERIENCE_FIELD_LIMITS,
  EXPERIENCE_STATUS_OPTIONS,
  WORK_ARRANGEMENT_OPTIONS,
} from "../../../../config/experienceConfig.js";

import {
  createEmptyExperience,
  normalizeExperience,
} from "../../../../models/experienceModel.js";

import { validateExperience } from "../../../../services/Experience/experienceValidation.js";

import ResponsibilityEditor from "../ResponsibilityEditor/ResponsibilityEditor.jsx";
import AchievementEditor from "../AchievementEditor/AchievementEditor.jsx";
import ExperienceSkillsEditor from "../ExperienceSkillsEditor/ExperienceSkillsEditor.jsx";
import ExperienceOverviewBuilder from "../ExperienceOverviewBuilder/ExperienceOverviewBuilder.jsx";
import ExperienceTechnologyEditor from "./ExperienceTechnologyEditor/ExperienceTechnologyEditor.jsx";

import "./ExperienceForm.css";

/*
 * =========================================
 * Form Data Creation
 * =========================================
 */

function createFormData(initialExperience) {
  return initialExperience
    ? normalizeExperience(initialExperience)
    : createEmptyExperience();
}

/*
 * =========================================
 * Experience Form
 * =========================================
 */

function ExperienceForm({
  initialExperience = null,
  isSaving = false,
  onSubmit,
  onCancel,
}) {
  const formId = useId();

  const [formData, setFormData] = useState(() =>
    createFormData(initialExperience),
  );

  const [fieldErrors, setFieldErrors] = useState({});

  const [warnings, setWarnings] = useState([]);

  const [submissionError, setSubmissionError] = useState("");

  const isEditing = Boolean(initialExperience?.id);

  /*
   * =========================================
   * Synchronize Editing Record
   * =========================================
   */

  useEffect(() => {
    setFormData(createFormData(initialExperience));

    setFieldErrors({});
    setWarnings([]);
    setSubmissionError("");
  }, [initialExperience]);

  /*
   * =========================================
   * Error Management
   * =========================================
   */

  const clearFieldError = (fieldName) => {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = {
        ...currentErrors,
      };

      delete nextErrors[fieldName];

      return nextErrors;
    });

    setSubmissionError("");
  };

  /*
   * =========================================
   * Top-Level Field Update
   * =========================================
   */

  const updateTopLevelField = (fieldName, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));

    clearFieldError(fieldName);
  };

  /*
   * =========================================
   * Nested Field Update
   * =========================================
   */

  const updateNestedField = (sectionName, fieldName, value) => {
    setFormData((currentData) => ({
      ...currentData,

      [sectionName]: {
        ...currentData[sectionName],
        [fieldName]: value,
      },
    }));

    clearFieldError(`${sectionName}.${fieldName}`);
  };

  /*
   * =========================================
   * Current Position
   * =========================================
   */

  const handleCurrentPositionChange = (event) => {
    const { checked } = event.target;

    setFormData((currentData) => ({
      ...currentData,

      dates: {
        ...currentData.dates,
        isCurrent: checked,

        /*
         * A current position cannot have an
         * end date.
         */

        endDate: checked ? "" : currentData.dates.endDate,
      },
    }));

    clearFieldError("dates.isCurrent");
    clearFieldError("dates.endDate");
  };

  /*
   * =========================================
   * Leadership Toggle
   * =========================================
   */

  const handleLeadershipChange = (event) => {
    const { checked } = event.target;

    setFormData((currentData) => ({
      ...currentData,

      leadership: {
        ...currentData.leadership,

        hasLeadershipResponsibilities: checked,
      },
    }));

    clearFieldError("leadership.hasLeadershipResponsibilities");
  };

  /*
   * =========================================
   * Collection Update
   * =========================================
   */

  const updateCollectionField = (fieldName, values) => {
    setFormData((currentData) => ({
      ...currentData,
      [fieldName]: values,
    }));

    setFieldErrors((currentErrors) => {
      const nextErrors = {};

      Object.entries(currentErrors).forEach(([errorField, message]) => {
        if (
          errorField !== fieldName &&
          !errorField.startsWith(`${fieldName}.`)
        ) {
          nextErrors[errorField] = message;
        }
      });

      return nextErrors;
    });

    setSubmissionError("");
  };

  /*
   * =========================================
   * Form Submission
   * =========================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmissionError("");

    const validationResult = validateExperience(formData);

    setFieldErrors(validationResult.fieldErrors);

    setWarnings(validationResult.warnings);

    if (!validationResult.isValid) {
      setSubmissionError(
        `${validationResult.errors.length} ${
          validationResult.errors.length === 1
            ? "problem must"
            : "problems must"
        } be corrected before saving.`,
      );

      return;
    }

    try {
      await onSubmit?.(formData);
    } catch (error) {
      const serviceFieldErrors =
        error?.fieldErrors || error?.validation?.fieldErrors || {};

      setFieldErrors(serviceFieldErrors);

      setSubmissionError(
        error?.publicMessage ||
          error?.message ||
          "The experience could not be saved.",
      );
    }
  };

  /*
   * =========================================
   * Form IDs
   * =========================================
   */

  const getFieldId = (fieldName) => `${formId}-${fieldName}`;

  const handleOverviewUpdate = ({ overview, overviewMeta }) => {
    setFormData((currentData) => ({
      ...currentData,
      overview,
      overviewMeta,
    }));

    clearFieldError("overview");
    setSubmissionError("");
  };

  /*
   * =========================================
   * Technologies Update
   * =========================================
   */

  const handleTechnologiesChange = (nextTechnologies) => {
    setFormData((currentData) => ({
      ...currentData,

      technologies: nextTechnologies,
    }));

    clearFieldError("technologies");
    setSubmissionError("");
  };

  return (
    <form className="experience-form" onSubmit={handleSubmit} noValidate>
      {/* =====================================
          Role and Organization
          ===================================== */}

      <section
        className="experience-form-section"
        aria-labelledby={`${formId}-position-section-title`}
      >
        <header className="experience-form-section-header">
          <span aria-hidden="true" />

          <div>
            <small>Position</small>

            <h3 id={`${formId}-position-section-title`}>
              Role and Organization
            </h3>

            <p>
              Identify the role, organization, experience category, and
              employment arrangement.
            </p>
          </div>
        </header>

        <div className="experience-form-grid">
          <FormField
            className="experience-form-field--wide"
            id={getFieldId("position-title")}
            label="Position or Role Title"
            required
            error={fieldErrors["position.title"]}
          >
            <input
              id={getFieldId("position-title")}
              type="text"
              value={formData.position.title}
              onChange={(event) =>
                updateNestedField("position", "title", event.target.value)
              }
              maxLength={EXPERIENCE_FIELD_LIMITS.positionTitle}
              placeholder="Example: IT Systems Administrator"
              autoComplete="organization-title"
            />
          </FormField>

          <FormField
            className="experience-form-field--wide"
            id={getFieldId("organization-name")}
            label="Organization, Employer, or Client"
            required
            error={fieldErrors["organization.name"]}
          >
            <input
              id={getFieldId("organization-name")}
              type="text"
              value={formData.organization.name}
              onChange={(event) =>
                updateNestedField("organization", "name", event.target.value)
              }
              maxLength={EXPERIENCE_FIELD_LIMITS.organizationName}
              placeholder="Example: Example Financial Services"
              autoComplete="organization"
            />
          </FormField>

          <FormField
            id={getFieldId("category")}
            label="Experience Category"
            required
            error={fieldErrors.category}
          >
            <select
              id={getFieldId("category")}
              value={formData.category}
              onChange={(event) =>
                updateTopLevelField("category", event.target.value)
              }
            >
              {EXPERIENCE_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id={getFieldId("employment-type")}
            label="Employment Type"
            required
            error={fieldErrors["position.employmentType"]}
          >
            <select
              id={getFieldId("employment-type")}
              value={formData.position.employmentType}
              onChange={(event) =>
                updateNestedField(
                  "position",
                  "employmentType",
                  event.target.value,
                )
              }
            >
              {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id={getFieldId("work-arrangement")}
            label="Work Arrangement"
            required
            error={fieldErrors["position.workArrangement"]}
          >
            <select
              id={getFieldId("work-arrangement")}
              value={formData.position.workArrangement}
              onChange={(event) =>
                updateNestedField(
                  "position",
                  "workArrangement",
                  event.target.value,
                )
              }
            >
              {WORK_ARRANGEMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id={getFieldId("industry")}
            label="Industry"
            error={fieldErrors["organization.industry"]}
          >
            <input
              id={getFieldId("industry")}
              type="text"
              value={formData.organization.industry}
              onChange={(event) =>
                updateNestedField(
                  "organization",
                  "industry",
                  event.target.value,
                )
              }
              maxLength={EXPERIENCE_FIELD_LIMITS.industry}
              placeholder="Example: Financial Services"
            />
          </FormField>

          <FormField
            className="experience-form-field--full"
            id={getFieldId("organization-website")}
            label="Organization Website"
            error={fieldErrors["organization.website"]}
            help="Optional. This link can be hidden from public documents."
          >
            <input
              id={getFieldId("organization-website")}
              type="url"
              value={formData.organization.website}
              onChange={(event) =>
                updateNestedField("organization", "website", event.target.value)
              }
              maxLength={EXPERIENCE_FIELD_LIMITS.organizationWebsite}
              placeholder="Example: https://example.com"
              autoComplete="url"
            />
          </FormField>
        </div>
      </section>

      {/* =====================================
          Dates and Location
          ===================================== */}

      <section
        className="experience-form-section"
        aria-labelledby={`${formId}-timeline-section-title`}
      >
        <header className="experience-form-section-header">
          <span aria-hidden="true" />

          <div>
            <small>Timeline</small>

            <h3 id={`${formId}-timeline-section-title`}>Dates and Location</h3>

            <p>Enter when and where this experience occurred.</p>
          </div>
        </header>

        <div className="experience-form-grid">
          <FormField
            id={getFieldId("start-date")}
            label="Start Date"
            required
            error={fieldErrors["dates.startDate"]}
          >
            <input
              id={getFieldId("start-date")}
              type="month"
              value={formData.dates.startDate}
              onChange={(event) =>
                updateNestedField("dates", "startDate", event.target.value)
              }
            />
          </FormField>

          <FormField
            id={getFieldId("end-date")}
            label="End Date"
            required={!formData.dates.isCurrent}
            error={fieldErrors["dates.endDate"]}
          >
            <input
              id={getFieldId("end-date")}
              type="month"
              value={formData.dates.endDate}
              onChange={(event) =>
                updateNestedField("dates", "endDate", event.target.value)
              }
              disabled={formData.dates.isCurrent}
            />
          </FormField>

          <div className="experience-form-checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={formData.dates.isCurrent}
                onChange={handleCurrentPositionChange}
              />

              <span>
                <strong>I currently hold this position</strong>

                <small>The end date will be displayed as Present.</small>
              </span>
            </label>
          </div>

          <FormField
            id={getFieldId("city")}
            label="City"
            error={fieldErrors["location.city"]}
          >
            <input
              id={getFieldId("city")}
              type="text"
              value={formData.location.city}
              onChange={(event) =>
                updateNestedField("location", "city", event.target.value)
              }
              maxLength={EXPERIENCE_FIELD_LIMITS.city}
              placeholder="Example: Coconut Creek"
              autoComplete="address-level2"
            />
          </FormField>

          <FormField
            id={getFieldId("state-region")}
            label="State or Region"
            error={fieldErrors["location.stateRegion"]}
          >
            <input
              id={getFieldId("state-region")}
              type="text"
              value={formData.location.stateRegion}
              onChange={(event) =>
                updateNestedField("location", "stateRegion", event.target.value)
              }
              maxLength={EXPERIENCE_FIELD_LIMITS.stateRegion}
              placeholder="Example: Florida"
              autoComplete="address-level1"
            />
          </FormField>

          <FormField
            id={getFieldId("country")}
            label="Country"
            error={fieldErrors["location.country"]}
          >
            <input
              id={getFieldId("country")}
              type="text"
              value={formData.location.country}
              onChange={(event) =>
                updateNestedField("location", "country", event.target.value)
              }
              maxLength={EXPERIENCE_FIELD_LIMITS.country}
              placeholder="Example: United States"
              autoComplete="country-name"
            />
          </FormField>

          <FormField
            className="experience-form-field--full"
            id={getFieldId("display-location")}
            label="Public Display Location"
            error={fieldErrors["location.displayValue"]}
            help="Optional. When provided, this value is shown instead of combining the city, region, and country."
          >
            <input
              id={getFieldId("display-location")}
              type="text"
              value={formData.location.displayValue}
              onChange={(event) =>
                updateNestedField(
                  "location",
                  "displayValue",
                  event.target.value,
                )
              }
              maxLength={EXPERIENCE_FIELD_LIMITS.locationDisplayValue}
              placeholder="Example: Coconut Creek, Florida"
            />
          </FormField>
        </div>
      </section>

      {/* =====================================
          Experience Overview
          ===================================== */}

      <ExperienceOverviewBuilder
        experience={formData}
        fieldError={fieldErrors.overview}
        disabled={isSaving}
        onChange={handleOverviewUpdate}
      />

      {/* =====================================
          Responsibility
          ===================================== */}

      <ResponsibilityEditor
        responsibilities={formData.responsibilities}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onChange={(nextResponsibilities) =>
          updateCollectionField("responsibilities", nextResponsibilities)
        }
      />

      {/* =====================================
          Achievements and Results
          ===================================== */}

      <AchievementEditor
        achievements={formData.achievements}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onChange={(nextAchievements) =>
          updateCollectionField("achievements", nextAchievements)
        }
      />

      {/* =====================================
          Skills and Competencies
          ===================================== */}

      <ExperienceSkillsEditor
        experience={formData}
        experienceSkills={formData.skills}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onChange={(nextSkills) => updateCollectionField("skills", nextSkills)}
      />

      <ExperienceTechnologyEditor
        technologies={formData.technologies || []}
        fieldError={fieldErrors.technologies}
        disabled={isSaving}
        onChange={handleTechnologiesChange}
      />

      {/* =====================================
          Leadership
          ===================================== */}

      <section
        className="experience-form-section"
        aria-labelledby={`${formId}-timeline-section-title`}
      >
        <header className="experience-form-section-header">
          <span aria-hidden="true" />

          <div>
            <small>Leadership</small>

            <h3 id={`${formId}-leadership-section-title`}>
              Leadership and Collaboration
            </h3>

            <p>
              Record supervision, mentoring, coordination, and leadership
              responsibilities.
            </p>
          </div>
        </header>

        <div className="experience-form-checkbox-field experience-form-checkbox-field--full">
          <label>
            <input
              type="checkbox"
              checked={formData.leadership.hasLeadershipResponsibilities}
              onChange={handleLeadershipChange}
            />

            <span>
              <strong>This role included leadership responsibilities</strong>

              <small>
                Include supervision, mentoring, technical leadership, training,
                or team coordination.
              </small>
            </span>
          </label>
        </div>

        {formData.leadership.hasLeadershipResponsibilities && (
          <div className="experience-form-grid experience-form-leadership-fields">
            <FormField
              id={getFieldId("people-managed")}
              label="People Managed or Supervised"
              error={fieldErrors["leadership.peopleManaged"]}
              help="Leave blank if the role involved leadership without direct supervision."
            >
              <input
                id={getFieldId("people-managed")}
                type="number"
                min="0"
                step="1"
                value={formData.leadership.peopleManaged ?? ""}
                onChange={(event) =>
                  updateNestedField(
                    "leadership",
                    "peopleManaged",
                    event.target.value,
                  )
                }
                placeholder="Example: 5"
              />
            </FormField>

            <FormField
              className="experience-form-field--full"
              id={getFieldId("leadership-description")}
              label="Leadership Description"
              error={fieldErrors["leadership.description"]}
              count={`${formData.leadership.description.length}/${
                EXPERIENCE_FIELD_LIMITS.leadershipDescription
              }`}
            >
              <textarea
                id={getFieldId("leadership-description")}
                value={formData.leadership.description}
                onChange={(event) =>
                  updateNestedField(
                    "leadership",
                    "description",
                    event.target.value,
                  )
                }
                rows={4}
                maxLength={EXPERIENCE_FIELD_LIMITS.leadershipDescription}
                placeholder="Example: Coordinated technical support activities, trained new team members, and helped establish troubleshooting procedures."
              />
            </FormField>
          </div>
        )}
      </section>

      {/* =====================================
          Private Career Information
          ===================================== */}

      <section
        className="experience-form-section"
        aria-labelledby={`${formId}-timeline-section-title`}
      >
        <header className="experience-form-section-header">
          <span aria-hidden="true" />

          <div>
            <small>Private Information</small>

            <h3 id={`${formId}-private-section-title`}>
              Career Management Notes
            </h3>

            <p>
              Save information that may help with interviews and career
              planning.
            </p>
          </div>
        </header>

        <div className="experience-form-private-notice" role="note">
          <span aria-hidden="true">●</span>

          <p>
            These fields are private and should never appear automatically on a
            résumé or public portfolio.
          </p>
        </div>

        <div className="experience-form-grid">
          <FormField
            className="experience-form-field--full"
            id={getFieldId("reason-for-leaving")}
            label="Reason for Leaving"
            error={fieldErrors["privateInformation.reasonForLeaving"]}
            count={`${formData.privateInformation.reasonForLeaving.length}/${
              EXPERIENCE_FIELD_LIMITS.reasonForLeaving
            }`}
          >
            <textarea
              id={getFieldId("reason-for-leaving")}
              value={formData.privateInformation.reasonForLeaving}
              onChange={(event) =>
                updateNestedField(
                  "privateInformation",
                  "reasonForLeaving",
                  event.target.value,
                )
              }
              rows={3}
              maxLength={EXPERIENCE_FIELD_LIMITS.reasonForLeaving}
              placeholder="Optional private note about why the position ended."
            />
          </FormField>

          <FormField
            className="experience-form-field--full"
            id={getFieldId("private-notes")}
            label="Private Notes"
            error={fieldErrors["privateInformation.notes"]}
            count={`${formData.privateInformation.notes.length}/${
              EXPERIENCE_FIELD_LIMITS.privateNotes
            }`}
          >
            <textarea
              id={getFieldId("private-notes")}
              value={formData.privateInformation.notes}
              onChange={(event) =>
                updateNestedField(
                  "privateInformation",
                  "notes",
                  event.target.value,
                )
              }
              rows={4}
              maxLength={EXPERIENCE_FIELD_LIMITS.privateNotes}
              placeholder="Add private interview reminders, references, important context, or career notes."
            />
          </FormField>
        </div>
      </section>

      {/* =====================================
          Visibility and Status
          ===================================== */}

      <section
        className="experience-form-section"
        aria-labelledby={`${formId}-timeline-section-title`}
      >
        <header className="experience-form-section-header">
          <span aria-hidden="true" />

          <div>
            <small>Presentation</small>

            <h3 id={`${formId}-visibility-section-title`}>
              Visibility and Record Status
            </h3>

            <p>
              Choose the information available for résumé and portfolio
              presentation.
            </p>
          </div>
        </header>

        <FormField
          id={getFieldId("record-status")}
          label="Record Status"
          error={fieldErrors.status}
        >
          <select
            id={getFieldId("record-status")}
            value={formData.status}
            onChange={(event) =>
              updateTopLevelField("status", event.target.value)
            }
          >
            {EXPERIENCE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <div className="experience-form-visibility-grid">
          <VisibilityOption
            label="Organization Website"
            description="Allow the organization website to appear publicly."
            checked={formData.visibility.showOrganizationWebsite}
            onChange={(checked) =>
              updateNestedField(
                "visibility",
                "showOrganizationWebsite",
                checked,
              )
            }
          />

          <VisibilityOption
            label="Location"
            description="Allow the experience location to appear."
            checked={formData.visibility.showLocation}
            onChange={(checked) =>
              updateNestedField("visibility", "showLocation", checked)
            }
          />

          <VisibilityOption
            label="Employment Type"
            description="Show full-time, internship, contract, or another type."
            checked={formData.visibility.showEmploymentType}
            onChange={(checked) =>
              updateNestedField("visibility", "showEmploymentType", checked)
            }
          />

          <VisibilityOption
            label="Work Arrangement"
            description="Show whether the role was on-site, remote, or hybrid."
            checked={formData.visibility.showWorkArrangement}
            onChange={(checked) =>
              updateNestedField("visibility", "showWorkArrangement", checked)
            }
          />

          <VisibilityOption
            label="Responsibilities"
            description="Allow selected responsibilities to appear."
            checked={formData.visibility.showResponsibilities}
            onChange={(checked) =>
              updateNestedField("visibility", "showResponsibilities", checked)
            }
          />

          <VisibilityOption
            label="Achievements"
            description="Allow selected accomplishments and outcomes to appear."
            checked={formData.visibility.showAchievements}
            onChange={(checked) =>
              updateNestedField("visibility", "showAchievements", checked)
            }
          />

          <VisibilityOption
            label="Skills"
            description="Allow relevant professional skills to appear."
            checked={formData.visibility.showSkills}
            onChange={(checked) =>
              updateNestedField("visibility", "showSkills", checked)
            }
          />

          <VisibilityOption
            label="Technologies"
            description="Allow tools, technologies, and systems to appear."
            checked={formData.visibility.showTechnologies}
            onChange={(checked) =>
              updateNestedField("visibility", "showTechnologies", checked)
            }
          />
        </div>
      </section>

      {/* =====================================
          Validation Warnings
          ===================================== */}

      {warnings.length > 0 && (
        <section className="experience-form-warnings">
          <strong>Suggestions for a stronger experience</strong>

          <ul>
            {warnings.map((warning, index) => (
              <li key={`${warning.code}-${warning.field}-${index}`}>
                {warning.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* =====================================
          Submission Error
          ===================================== */}

      {submissionError && (
        <div className="experience-form-submission-error" role="alert">
          <strong>Unable to save this experience</strong>

          <p>{submissionError}</p>
        </div>
      )}

      {/* =====================================
          Form Actions
          ===================================== */}

      <footer className="experience-form-actions">
        <button
          type="button"
          className="experience-form-cancel-button"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="experience-form-save-button"
          disabled={isSaving}
        >
          {isSaving
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Save Experience"}
        </button>
      </footer>
    </form>
  );
}

/*
 * =========================================
 * Form Field
 * =========================================
 */

function FormField({
  id,
  label,
  required = false,
  error = "",
  help = "",
  count = "",
  className = "",
  children,
}) {
  return (
    <div
      className={`experience-form-field ${className} ${
        error ? "experience-form-field--error" : ""
      }`}
    >
      <div className="experience-form-label-row">
        <label htmlFor={id}>
          {label}

          {required && <span aria-hidden="true">*</span>}
        </label>

        {count && <small>{count}</small>}
      </div>

      {children}

      {help && !error && <small className="experience-form-help">{help}</small>}

      {error && (
        <p className="experience-form-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/*
 * =========================================
 * Visibility Option
 * =========================================
 */

function VisibilityOption({ label, description, checked, onChange }) {
  return (
    <label className="experience-form-visibility-option">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
      />

      <span>
        <strong>{label}</strong>

        <small>{description}</small>
      </span>
    </label>
  );
}

export default ExperienceForm;
