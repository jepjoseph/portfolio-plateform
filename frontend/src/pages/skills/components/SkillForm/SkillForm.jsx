import { useEffect, useId, useState } from "react";

import {
  LANGUAGE_PROFICIENCY_OPTIONS,
  SKILL_CATEGORY_OPTIONS,
  SKILL_FIELD_LIMITS,
  SKILL_PROFICIENCY_OPTIONS,
  SKILL_STATUS_OPTIONS,
  SKILL_TYPE_OPTIONS,
  getSkillSourceLabel,
} from "../../../../config/skillConfig.js";

import {
  createEmptySkill,
  normalizeSkill,
  normalizeSkillNameForComparison,
} from "../../../../models/skillModel.js";

import { validateSkill } from "../../../../services/Skill/skillValidation.js";

import "./SkillForm.css";

/*
 * =========================================
 * Form Data
 * =========================================
 */

function createFormData(initialSkill) {
  if (initialSkill) {
    return normalizeSkill(initialSkill);
  }

  return {
    ...createEmptySkill(),
    source: "manual",
    sourceContext: "skill-page",
  };
}

/*
 * =========================================
 * Skill Form
 * =========================================
 */

function SkillForm({
  initialSkill = null,
  existingSkills = [],
  isSaving = false,
  onSubmit,
  onCancel,
}) {
  const formId = useId();

  const [formData, setFormData] = useState(() => createFormData(initialSkill));

  const [aliasDraft, setAliasDraft] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  const [warnings, setWarnings] = useState([]);

  const [submissionError, setSubmissionError] = useState("");

  const [aliasError, setAliasError] = useState("");

  const isEditing = Boolean(initialSkill?.id);

  /*
   * =========================================
   * Synchronize Editing Record
   * =========================================
   */

  useEffect(() => {
    setFormData(createFormData(initialSkill));
    setAliasDraft("");
    setFieldErrors({});
    setWarnings([]);
    setSubmissionError("");
    setAliasError("");
  }, [initialSkill]);

  /*
   * =========================================
   * Error Management
   * =========================================
   */

  const clearFieldError = (fieldName) => {
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
   * Top-Level Update
   * =========================================
   */

  const updateField = (fieldName, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));

    clearFieldError(fieldName);
  };

  /*
   * =========================================
   * Nested Update
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
   * Category and Type Consistency
   * =========================================
   */

  const handleCategoryChange = (event) => {
    const category = event.target.value;

    setFormData((currentData) => ({
      ...currentData,
      category,

      /*
       * A skill in the Languages category must
       * use the Language Skill type.
       */

      type:
        category === "language"
          ? "language"
          : currentData.type === "language"
            ? "professional"
            : currentData.type,

      language: {
        ...currentData.language,

        proficiency:
          category === "language" ? currentData.language.proficiency : "",
      },
    }));

    clearFieldError("category");
    clearFieldError("type");
    clearFieldError("language.proficiency");
  };

  const handleTypeChange = (event) => {
    const type = event.target.value;

    setFormData((currentData) => ({
      ...currentData,
      type,

      category:
        type === "language"
          ? "language"
          : currentData.category === "language"
            ? "other"
            : currentData.category,

      language: {
        ...currentData.language,

        proficiency:
          type === "language" ? currentData.language.proficiency : "",
      },
    }));

    clearFieldError("type");
    clearFieldError("category");
    clearFieldError("language.proficiency");
  };

  /*
   * =========================================
   * Alias Management
   * =========================================
   */

  const handleAddAlias = () => {
    const alias = aliasDraft.trim();

    if (!alias) {
      setAliasError("Enter an alias before adding it.");

      return;
    }

    if (alias.length > SKILL_FIELD_LIMITS.alias) {
      setAliasError(
        `An alias cannot exceed ${SKILL_FIELD_LIMITS.alias} characters.`,
      );

      return;
    }

    if (formData.aliases.length >= SKILL_FIELD_LIMITS.maximumAliases) {
      setAliasError(
        `Add no more than ${SKILL_FIELD_LIMITS.maximumAliases} aliases.`,
      );

      return;
    }

    const normalizedAlias = normalizeSkillNameForComparison(alias);

    const normalizedSkillName = normalizeSkillNameForComparison(formData.name);

    if (normalizedSkillName && normalizedAlias === normalizedSkillName) {
      setAliasError("An alias cannot be the same as the primary skill name.");

      return;
    }

    const isDuplicate = formData.aliases.some(
      (existingAlias) =>
        normalizeSkillNameForComparison(existingAlias) === normalizedAlias,
    );

    if (isDuplicate) {
      setAliasError("This alias has already been added.");

      return;
    }

    setFormData((currentData) => ({
      ...currentData,
      aliases: [...currentData.aliases, alias],
    }));

    setAliasDraft("");
    setAliasError("");
    clearFieldError("aliases");
  };

  const handleAliasKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    handleAddAlias();
  };

  const handleRemoveAlias = (aliasIndex) => {
    setFormData((currentData) => ({
      ...currentData,

      aliases: currentData.aliases.filter((_, index) => index !== aliasIndex),
    }));

    setAliasError("");
    clearFieldError("aliases");
  };

  /*
   * =========================================
   * Submit
   * =========================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmissionError("");
    setAliasError("");

    const validationResult = validateSkill(formData, {
      existingSkills,
      excludeSkillId: initialSkill?.id || "",
    });

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

      setWarnings(error?.warnings || error?.validation?.warnings || []);

      setSubmissionError(
        error?.publicMessage ||
          error?.message ||
          "The skill could not be saved.",
      );
    }
  };

  const getFieldId = (fieldName) => `${formId}-${fieldName}`;

  const isLanguageSkill = formData.type === "language";

  return (
    <form className="skill-form" onSubmit={handleSubmit} noValidate>
      {/*
       * =========================================
       * Identity
       * =========================================
       */}

      <section
        className="skill-form-section"
        aria-labelledby={`${formId}-identity-title`}
      >
        <header className="skill-form-section-header">
          <span aria-hidden="true" />

          <div>
            <small>Skill Identity</small>

            <h3 id={`${formId}-identity-title`}>Name and Classification</h3>

            <p>
              Give the skill a clear professional name and classify it for
              searching, Experiences, Résumés, and Portfolios.
            </p>
          </div>
        </header>

        <div className="skill-form-grid">
          <FormField
            className="skill-form-field--full"
            id={getFieldId("name")}
            label="Skill Name"
            required
            error={fieldErrors.name}
            count={`${formData.name.length}/${SKILL_FIELD_LIMITS.name}`}
          >
            <input
              id={getFieldId("name")}
              type="text"
              value={formData.name}
              onChange={(event) => updateField("name", event.target.value)}
              maxLength={SKILL_FIELD_LIMITS.name}
              placeholder="Example: Active Directory"
              autoComplete="off"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            id={getFieldId("category")}
            label="Category"
            required
            error={fieldErrors.category}
          >
            <select
              id={getFieldId("category")}
              value={formData.category}
              onChange={handleCategoryChange}
              disabled={isSaving}
            >
              {SKILL_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id={getFieldId("type")}
            label="Skill Type"
            required
            error={fieldErrors.type}
          >
            <select
              id={getFieldId("type")}
              value={formData.type}
              onChange={handleTypeChange}
              disabled={isSaving}
            >
              {SKILL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            className="skill-form-field--full"
            id={getFieldId("description")}
            label="Professional Description"
            error={fieldErrors.description}
            count={`${formData.description.length}/${SKILL_FIELD_LIMITS.description}`}
            help="Explain what the skill is and how you apply it professionally."
          >
            <textarea
              id={getFieldId("description")}
              value={formData.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              rows={5}
              maxLength={SKILL_FIELD_LIMITS.description}
              placeholder="Example: Administration of users, groups, permissions, Group Policy, authentication, and directory services."
              disabled={isSaving}
            />
          </FormField>
        </div>
      </section>

      {/*
       * =========================================
       * Aliases
       * =========================================
       */}

      <section
        className="skill-form-section"
        aria-labelledby={`${formId}-aliases-title`}
      >
        <header className="skill-form-section-header">
          <span aria-hidden="true" />

          <div>
            <small>Alternative Names</small>

            <h3 id={`${formId}-aliases-title`}>Skill Aliases</h3>

            <p>
              Add abbreviations or alternative names so the library can
              recognize equivalent skills and prevent duplicates.
            </p>
          </div>
        </header>

        <div className="skill-form-alias-editor">
          <div className="skill-form-alias-input">
            <label htmlFor={getFieldId("alias")}>New Alias</label>

            <div>
              <input
                id={getFieldId("alias")}
                type="text"
                value={aliasDraft}
                onChange={(event) => {
                  setAliasDraft(event.target.value);
                  setAliasError("");
                }}
                onKeyDown={handleAliasKeyDown}
                maxLength={SKILL_FIELD_LIMITS.alias}
                placeholder="Example: AD"
                disabled={isSaving}
              />

              <button
                type="button"
                onClick={handleAddAlias}
                disabled={
                  isSaving ||
                  formData.aliases.length >= SKILL_FIELD_LIMITS.maximumAliases
                }
              >
                Add Alias
              </button>
            </div>

            <small>
              {formData.aliases.length}/{SKILL_FIELD_LIMITS.maximumAliases}{" "}
              aliases
            </small>
          </div>

          {(aliasError || fieldErrors.aliases) && (
            <p className="skill-form-alias-error" role="alert">
              {aliasError || fieldErrors.aliases}
            </p>
          )}

          {formData.aliases.length > 0 ? (
            <div className="skill-form-alias-list">
              {formData.aliases.map((alias, index) => (
                <div
                  key={`${alias}-${index}`}
                  className={
                    fieldErrors[`aliases.${index}`]
                      ? "skill-form-alias--error"
                      : ""
                  }
                >
                  <span>{alias}</span>

                  <button
                    type="button"
                    onClick={() => handleRemoveAlias(index)}
                    disabled={isSaving}
                    aria-label={`Remove alias ${alias}`}
                  >
                    ×
                  </button>

                  {fieldErrors[`aliases.${index}`] && (
                    <small role="alert">
                      {fieldErrors[`aliases.${index}`]}
                    </small>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="skill-form-alias-empty">No aliases added.</div>
          )}
        </div>
      </section>

      {/*
       * =========================================
       * Proficiency
       * =========================================
       */}

      <section
        className="skill-form-section"
        aria-labelledby={`${formId}-proficiency-title`}
      >
        <header className="skill-form-section-header">
          <span aria-hidden="true" />

          <div>
            <small>Capability Level</small>

            <h3 id={`${formId}-proficiency-title`}>
              Proficiency and Experience
            </h3>

            <p>
              Record your general proficiency, approximate experience, and when
              the skill was last used.
            </p>
          </div>
        </header>

        <div className="skill-form-grid">
          {isLanguageSkill ? (
            <FormField
              id={getFieldId("language-proficiency")}
              label="Language Proficiency"
              error={fieldErrors["language.proficiency"]}
            >
              <select
                id={getFieldId("language-proficiency")}
                value={formData.language.proficiency}
                onChange={(event) =>
                  updateNestedField(
                    "language",
                    "proficiency",
                    event.target.value,
                  )
                }
                disabled={isSaving}
              >
                {LANGUAGE_PROFICIENCY_OPTIONS.map((option) => (
                  <option
                    key={option.value || "not-specified"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          ) : (
            <FormField
              id={getFieldId("proficiency")}
              label="General Proficiency"
              error={fieldErrors["proficiency.level"]}
            >
              <select
                id={getFieldId("proficiency")}
                value={formData.proficiency.level}
                onChange={(event) =>
                  updateNestedField("proficiency", "level", event.target.value)
                }
                disabled={isSaving}
              >
                {SKILL_PROFICIENCY_OPTIONS.map((option) => (
                  <option
                    key={option.value || "not-specified"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField
            id={getFieldId("years")}
            label="Years of Experience"
            error={fieldErrors["proficiency.yearsOfExperience"]}
            help="Optional. One decimal place is supported."
          >
            <input
              id={getFieldId("years")}
              type="number"
              min="0"
              max={SKILL_FIELD_LIMITS.yearsOfExperience}
              step="0.1"
              value={formData.proficiency.yearsOfExperience ?? ""}
              onChange={(event) =>
                updateNestedField(
                  "proficiency",
                  "yearsOfExperience",
                  event.target.value,
                )
              }
              placeholder="Example: 5"
              disabled={isSaving}
            />
          </FormField>

          <FormField
            id={getFieldId("last-used")}
            label="Last Used"
            error={fieldErrors["proficiency.lastUsedDate"]}
            help="Leave blank if you do not want to record a date."
          >
            <input
              id={getFieldId("last-used")}
              type="month"
              value={formData.proficiency.lastUsedDate}
              onChange={(event) =>
                updateNestedField(
                  "proficiency",
                  "lastUsedDate",
                  event.target.value,
                )
              }
              disabled={isSaving}
            />
          </FormField>
        </div>
      </section>

      {/*
       * =========================================
       * Management
       * =========================================
       */}

      <section
        className="skill-form-section"
        aria-labelledby={`${formId}-management-title`}
      >
        <header className="skill-form-section-header">
          <span aria-hidden="true" />

          <div>
            <small>Library Management</small>

            <h3 id={`${formId}-management-title`}>Status and Private Notes</h3>

            <p>
              Manage availability and save private information that should not
              appear automatically on public documents.
            </p>
          </div>
        </header>

        <div className="skill-form-private-notice">
          <span aria-hidden="true">●</span>

          <p>
            Private notes are for internal career management and should not
            appear automatically on Résumés or public Portfolios.
          </p>
        </div>

        <div className="skill-form-grid">
          <FormField
            id={getFieldId("status")}
            label="Record Status"
            error={fieldErrors.status}
          >
            <select
              id={getFieldId("status")}
              value={formData.status}
              onChange={(event) => updateField("status", event.target.value)}
              disabled={isSaving}
            >
              {SKILL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="skill-form-source">
            <span>Record Source</span>

            <strong>{getSkillSourceLabel(formData.source)}</strong>

            {formData.sourceContext && (
              <small>Context: {formData.sourceContext}</small>
            )}
          </div>

          <FormField
            className="skill-form-field--full"
            id={getFieldId("notes")}
            label="Private Notes"
            error={fieldErrors.notes}
            count={`${formData.notes.length}/${SKILL_FIELD_LIMITS.notes}`}
          >
            <textarea
              id={getFieldId("notes")}
              value={formData.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              rows={4}
              maxLength={SKILL_FIELD_LIMITS.notes}
              placeholder="Add private learning goals, interview reminders, certifications, or supporting context."
              disabled={isSaving}
            />
          </FormField>
        </div>
      </section>

      {/*
       * =========================================
       * Warnings
       * =========================================
       */}

      {warnings.length > 0 && (
        <section className="skill-form-warnings">
          <strong>Suggestions for a stronger skill record</strong>

          <ul>
            {warnings.map((warning, index) => (
              <li key={`${warning.code}-${warning.field}-${index}`}>
                {warning.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/*
       * =========================================
       * Submission Error
       * =========================================
       */}

      {submissionError && (
        <div className="skill-form-submission-error" role="alert">
          <strong>Unable to save this skill</strong>

          <p>{submissionError}</p>
        </div>
      )}

      {/*
       * =========================================
       * Actions
       * =========================================
       */}

      <footer className="skill-form-actions">
        <button
          type="button"
          className="skill-form-cancel-button"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="skill-form-save-button"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Save Skill"}
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
      className={`skill-form-field ${className} ${
        error ? "skill-form-field--error" : ""
      }`}
    >
      <div className="skill-form-label-row">
        <label htmlFor={id}>
          {label}

          {required && <span aria-hidden="true">*</span>}
        </label>

        {count && <small>{count}</small>}
      </div>

      {children}

      {help && !error && <small className="skill-form-help">{help}</small>}

      {error && (
        <p className="skill-form-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default SkillForm;
