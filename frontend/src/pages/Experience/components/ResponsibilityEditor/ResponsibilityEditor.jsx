import { useId, useMemo, useState } from "react";

import { EXPERIENCE_FIELD_LIMITS } from "../../../../config/experienceConfig.js";

import { createResponsibility } from "../../../../models/experienceModel.js";

import "./ResponsibilityEditor.css";

/*
 * =========================================
 * Helpers
 * =========================================
 */

function normalizeResponsibilityOrder(responsibilities) {
  return responsibilities.map((responsibility, index) => ({
    ...responsibility,
    order: index,
  }));
}

function getResponsibilityText(responsibility) {
  if (typeof responsibility === "string") {
    return responsibility.trim();
  }

  return responsibility?.text?.trim() || "";
}

/*
 * =========================================
 * Responsibility Editor
 * =========================================
 */

function ResponsibilityEditor({
  responsibilities = [],
  fieldErrors = {},
  disabled = false,
  onChange,
}) {
  const sectionTitleId = useId();
  const textareaId = useId();

  const [draftText, setDraftText] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [editorError, setEditorError] = useState("");

  const isEditing = Boolean(editingId);

  const maximumItems = EXPERIENCE_FIELD_LIMITS.maximumResponsibilities;

  const maximumTextLength = EXPERIENCE_FIELD_LIMITS.responsibilityText;

  const hasReachedMaximum = responsibilities.length >= maximumItems;

  /*
   * =========================================
   * Ordered Responsibilities
   * =========================================
   */

  const orderedResponsibilities = useMemo(
    () =>
      [...responsibilities].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      ),
    [responsibilities],
  );

  /*
   * =========================================
   * Reset Editor
   * =========================================
   */

  const resetEditor = () => {
    setDraftText("");
    setEditingId(null);
    setEditorError("");
  };

  /*
   * =========================================
   * Duplicate Check
   * =========================================
   */

  const isDuplicateResponsibility = (text) => {
    const normalizedText = text.trim().toLocaleLowerCase();

    return responsibilities.some((responsibility) => {
      if (responsibility.id === editingId) {
        return false;
      }

      return (
        getResponsibilityText(responsibility).toLocaleLowerCase() ===
        normalizedText
      );
    });
  };

  /*
   * =========================================
   * Add or Update
   * =========================================
   */

  const handleSubmit = () => {
    const normalizedText = draftText.trim();

    if (!normalizedText) {
      setEditorError("Enter a responsibility before adding it.");

      return;
    }

    if (normalizedText.length > maximumTextLength) {
      setEditorError(
        `A responsibility cannot exceed ${maximumTextLength} characters.`,
      );

      return;
    }

    if (!isEditing && hasReachedMaximum) {
      setEditorError(
        `You can add no more than ${maximumItems} responsibilities.`,
      );

      return;
    }

    if (isDuplicateResponsibility(normalizedText)) {
      setEditorError("This responsibility has already been added.");

      return;
    }

    if (isEditing) {
      const updatedResponsibilities = responsibilities.map((responsibility) =>
        responsibility.id === editingId
          ? {
              ...responsibility,
              text: normalizedText,
            }
          : responsibility,
      );

      onChange?.(normalizeResponsibilityOrder(updatedResponsibilities));
    } else {
      const newResponsibility = createResponsibility({
        text: normalizedText,
        order: responsibilities.length,
      });

      onChange?.(
        normalizeResponsibilityOrder([...responsibilities, newResponsibility]),
      );
    }

    resetEditor();
  };

  /*
   * =========================================
   * Edit
   * =========================================
   */

  const handleEdit = (responsibility) => {
    setEditingId(responsibility.id);

    setDraftText(getResponsibilityText(responsibility));

    setEditorError("");
  };

  /*
   * =========================================
   * Remove
   * =========================================
   */

  const handleRemove = (responsibilityId) => {
    const remainingResponsibilities = responsibilities.filter(
      (responsibility) => responsibility.id !== responsibilityId,
    );

    onChange?.(normalizeResponsibilityOrder(remainingResponsibilities));

    if (responsibilityId === editingId) {
      resetEditor();
    }
  };

  /*
   * =========================================
   * Reorder
   * =========================================
   */

  const handleMove = (responsibilityId, direction) => {
    const currentIndex = orderedResponsibilities.findIndex(
      (responsibility) => responsibility.id === responsibilityId,
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedResponsibilities.length) {
      return;
    }

    const reorderedResponsibilities = [...orderedResponsibilities];

    const [movedResponsibility] = reorderedResponsibilities.splice(
      currentIndex,
      1,
    );

    reorderedResponsibilities.splice(targetIndex, 0, movedResponsibility);

    onChange?.(normalizeResponsibilityOrder(reorderedResponsibilities));
  };

  /*
   * =========================================
   * Text Change
   * =========================================
   */

  const handleTextChange = (event) => {
    setDraftText(event.target.value);
    setEditorError("");
  };

  return (
    <section
      className="experience-form-section responsibility-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="experience-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Responsibilities</small>

          <h3 id={sectionTitleId}>Primary Responsibilities</h3>

          <p>
            Add the important duties, activities, and ongoing responsibilities
            associated with this role.
          </p>
        </div>
      </header>

      {/* =====================================
          Responsibility Form
          ===================================== */}

      <div className="responsibility-editor-form">
        <div className="responsibility-editor-label-row">
          <label htmlFor={textareaId}>
            {isEditing ? "Edit Responsibility" : "Add Responsibility"}
          </label>

          <span>
            {draftText.length}/{maximumTextLength}
          </span>
        </div>

        <textarea
          id={textareaId}
          value={draftText}
          onChange={handleTextChange}
          rows={4}
          maxLength={maximumTextLength}
          disabled={disabled}
          placeholder={`Describe one important duty using a clear action verb.

Example: Administered user accounts, group policies, and access permissions within Active Directory.`}
        />

        {editorError && (
          <p className="responsibility-editor-error" role="alert">
            {editorError}
          </p>
        )}

        <div className="responsibility-editor-form-footer">
          <small>
            {responsibilities.length}/{maximumItems} responsibilities
          </small>

          <div>
            {isEditing && (
              <button
                type="button"
                className="responsibility-editor-cancel-button"
                onClick={resetEditor}
                disabled={disabled}
              >
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              className="responsibility-editor-add-button"
              onClick={handleSubmit}
              disabled={disabled || (!isEditing && hasReachedMaximum)}
            >
              {isEditing ? "Save Responsibility" : "+ Add Responsibility"}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================
          Responsibility List
          ===================================== */}

      <div className="responsibility-editor-list">
        {orderedResponsibilities.length > 0 ? (
          orderedResponsibilities.map((responsibility, index) => {
            const validationError =
              fieldErrors[`responsibilities.${index}.text`];

            return (
              <article
                key={responsibility.id}
                className={`responsibility-editor-item ${
                  validationError ? "responsibility-editor-item--error" : ""
                } ${
                  editingId === responsibility.id
                    ? "responsibility-editor-item--editing"
                    : ""
                }`}
              >
                <div className="responsibility-editor-order">
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleMove(responsibility.id, "up")}
                      disabled={disabled || index === 0}
                      aria-label={`Move responsibility ${index + 1} up`}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(responsibility.id, "down")}
                      disabled={
                        disabled || index === orderedResponsibilities.length - 1
                      }
                      aria-label={`Move responsibility ${index + 1} down`}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="responsibility-editor-content">
                  <span>Responsibility</span>

                  <p>{responsibility.text}</p>

                  {validationError && (
                    <small role="alert">{validationError}</small>
                  )}
                </div>

                <div className="responsibility-editor-actions">
                  <button
                    type="button"
                    className="responsibility-editor-edit-button"
                    onClick={() => handleEdit(responsibility)}
                    disabled={disabled}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="responsibility-editor-delete-button"
                    onClick={() => handleRemove(responsibility.id)}
                    disabled={disabled}
                    aria-label={`Remove responsibility ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="responsibility-editor-empty">
            <span aria-hidden="true">✦</span>

            <h4>No responsibilities added</h4>

            <p>
              Add the most important ongoing duties associated with this
              professional experience.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ResponsibilityEditor;
