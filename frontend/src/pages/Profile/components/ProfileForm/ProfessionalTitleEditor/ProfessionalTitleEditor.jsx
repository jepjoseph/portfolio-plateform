import { useId } from "react";

import "./ProfessionalTitleEditor.css";

/*
 * =========================================
 * Position Names
 * =========================================
 */

const POSITION_NAMES = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
];

function getPositionName(index) {
  return POSITION_NAMES[index] || `Title ${index + 1}`;
}

/*
 * =========================================
 * Error Helpers
 * =========================================
 */

function getFieldError(fieldErrors, title, index) {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return "";
  }

  return (
    fieldErrors[`professionalTitles.${index}.name`] ||
    fieldErrors[`professionalTitles.${title.id}.name`] ||
    ""
  );
}

/*
 * =========================================
 * Professional Title Editor
 * =========================================
 */

function ProfessionalTitleEditor({
  titles = [],
  fieldErrors = {},
  disabled = false,
  onAdd,
  onChange,
  onRemove,
}) {
  const sectionTitleId = useId();

  const activeTitles = Array.isArray(titles)
    ? titles.filter((title) => title?.status !== "archived")
    : [];

  return (
    <section
      className="professional-title-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="professional-title-editor-header">
        <div>
          <span>Career Identity</span>

          <h3 id={sectionTitleId}>Professional Titles</h3>

          <p>
            Add professional roles in priority order. The first title is
            currently used as the primary title.
          </p>
        </div>

        <button
          type="button"
          className="professional-title-editor-add-button"
          onClick={onAdd}
          disabled={disabled}
        >
          + Add Title
        </button>
      </header>

      <div className="professional-title-editor-summary">
        <span>
          <strong>{activeTitles.length}</strong>{" "}
          {activeTitles.length === 1
            ? "active professional title"
            : "active professional titles"}
        </span>

        {activeTitles.length > 0 && (
          <small>
            Primary: {activeTitles[0].name?.trim() || "Not completed"}
          </small>
        )}
      </div>

      {activeTitles.length > 0 ? (
        <div className="professional-title-editor-list">
          {activeTitles.map((title, index) => {
            const inputId = `professional-title-${title.id}`;
            const errorId = `${inputId}-error`;

            const nameError = getFieldError(fieldErrors, title, index);

            return (
              <article
                key={title.id}
                className={`professional-title-editor-item ${
                  nameError ? "professional-title-editor-item--error" : ""
                }`}
              >
                <div className="professional-title-editor-order">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>

                <div className="professional-title-editor-field">
                  <div className="professional-title-editor-label">
                    <label htmlFor={inputId}>
                      {getPositionName(index)} Title
                    </label>

                    {index === 0 && <span>Primary</span>}
                  </div>

                  <input
                    id={inputId}
                    type="text"
                    value={title.name || ""}
                    onChange={(event) =>
                      onChange?.(title.id, event.target.value)
                    }
                    placeholder="Computer Engineer"
                    disabled={disabled}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? errorId : undefined}
                  />

                  {nameError && (
                    <small id={errorId} role="alert">
                      {nameError}
                    </small>
                  )}
                </div>

                <button
                  type="button"
                  className="professional-title-editor-remove-button"
                  onClick={() => onRemove?.(title.id)}
                  disabled={disabled}
                  aria-label={`Remove ${getPositionName(index)} title`}
                  title="Remove title"
                >
                  Remove
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="professional-title-editor-empty">
          <span aria-hidden="true">✦</span>

          <h4>No professional titles added</h4>

          <p>
            Add at least one professional title to describe your career
            identity.
          </p>

          <button type="button" onClick={onAdd} disabled={disabled}>
            Add Professional Title
          </button>
        </div>
      )}
    </section>
  );
}

export default ProfessionalTitleEditor;
