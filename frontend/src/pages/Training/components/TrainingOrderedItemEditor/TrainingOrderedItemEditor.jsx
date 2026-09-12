import { useEffect, useId, useMemo, useState } from "react";

import "./TrainingOrderedItemEditor.css";

/*
 * =========================================
 * Helpers
 * =========================================
 */

function normalizeOrder(items) {
  return items.map((item, index) => ({
    ...item,
    order: index,
  }));
}

function createEmptyDraft(fields) {
  return fields.reduce((draft, field) => {
    draft[field.name] = "";

    return draft;
  }, {});
}

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/*
 * =========================================
 * Training Ordered Item Editor
 * =========================================
 */

function TrainingOrderedItemEditor({
  values = [],

  label,
  title,
  description,

  itemLabel,
  emptyTitle,
  emptyMessage,

  fields = [],
  primaryField = "name",

  maximumItems = 20,
  fieldPath,

  fieldErrors = {},
  disabled = false,

  createItem,
  onChange,
}) {
  const titleId = useId();

  const [draft, setDraft] = useState(() => createEmptyDraft(fields));

  const [editingId, setEditingId] = useState(null);

  const [editorError, setEditorError] = useState("");

  /*
   * Reset the draft if the editor configuration changes.
   */

  useEffect(() => {
    setDraft(createEmptyDraft(fields));
    setEditingId(null);
    setEditorError("");
  }, [fields]);

  const orderedItems = useMemo(
    () =>
      [...values].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      ),
    [values],
  );

  const isEditing = Boolean(editingId);

  const hasReachedMaximum = values.length >= maximumItems;

  /*
   * =========================================
   * Draft Management
   * =========================================
   */

  const resetEditor = () => {
    setDraft(createEmptyDraft(fields));
    setEditingId(null);
    setEditorError("");
  };

  const updateDraft = (fieldName, value) => {
    setDraft((current) => ({
      ...current,
      [fieldName]: value,
    }));

    setEditorError("");
  };

  /*
   * =========================================
   * Duplicate Detection
   * =========================================
   */

  const isDuplicate = (primaryValue) => {
    const normalizedValue = getText(primaryValue)
      .normalize("NFKC")
      .toLocaleLowerCase();

    if (!normalizedValue) {
      return false;
    }

    return values.some((item) => {
      if (item.id === editingId) {
        return false;
      }

      return (
        getText(item?.[primaryField]).normalize("NFKC").toLocaleLowerCase() ===
        normalizedValue
      );
    });
  };

  /*
   * =========================================
   * Draft Validation
   * =========================================
   */

  const validateDraft = () => {
    for (const field of fields) {
      const value = getText(draft[field.name]);

      if (field.required !== false && !value) {
        return `Enter ${field.label.toLowerCase()}.`;
      }

      if (field.maximumLength && value.length > field.maximumLength) {
        return `${field.label} cannot exceed ${field.maximumLength} characters.`;
      }
    }

    const primaryValue = getText(draft[primaryField]);

    if (!primaryValue) {
      const primaryConfiguration = fields.find(
        (field) => field.name === primaryField,
      );

      return `Enter ${(
        primaryConfiguration?.label || itemLabel
      ).toLowerCase()}.`;
    }

    if (isDuplicate(primaryValue)) {
      return `This ${itemLabel.toLowerCase()} has already been added.`;
    }

    if (!isEditing && hasReachedMaximum) {
      return `Add no more than ${maximumItems} ${itemLabel.toLowerCase()} records.`;
    }

    return "";
  };

  /*
   * =========================================
   * Save
   * =========================================
   */

  const handleSave = () => {
    const validationError = validateDraft();

    if (validationError) {
      setEditorError(validationError);
      return;
    }

    const normalizedDraft = fields.reduce((result, field) => {
      result[field.name] = getText(draft[field.name]);

      return result;
    }, {});

    if (isEditing) {
      onChange?.(
        normalizeOrder(
          values.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  ...normalizedDraft,
                }
              : item,
          ),
        ),
      );
    } else {
      if (typeof createItem !== "function") {
        setEditorError(
          `The ${itemLabel.toLowerCase()} creation function is unavailable.`,
        );

        return;
      }

      const createdItem = createItem({
        ...normalizedDraft,
        order: values.length,
      });

      onChange?.(normalizeOrder([...values, createdItem]));
    }

    resetEditor();
  };

  /*
   * =========================================
   * Edit
   * =========================================
   */

  const handleEdit = (item) => {
    const nextDraft = fields.reduce((result, field) => {
      result[field.name] =
        typeof item?.[field.name] === "string" ? item[field.name] : "";

      return result;
    }, {});

    setDraft(nextDraft);
    setEditingId(item.id);
    setEditorError("");
  };

  /*
   * =========================================
   * Remove
   * =========================================
   */

  const handleRemove = (itemId) => {
    onChange?.(normalizeOrder(values.filter((item) => item.id !== itemId)));

    if (editingId === itemId) {
      resetEditor();
    }
  };

  /*
   * =========================================
   * Reorder
   * =========================================
   */

  const handleMove = (itemId, direction) => {
    const currentIndex = orderedItems.findIndex((item) => item.id === itemId);

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedItems.length) {
      return;
    }

    const reorderedItems = [...orderedItems];

    const [movedItem] = reorderedItems.splice(currentIndex, 1);

    reorderedItems.splice(targetIndex, 0, movedItem);

    onChange?.(normalizeOrder(reorderedItems));
  };

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <section
      className="training-form-section training-ordered-editor"
      aria-labelledby={titleId}
    >
      <header className="training-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>{label}</small>

          <h3 id={titleId}>{title}</h3>

          <p>{description}</p>
        </div>
      </header>

      <div className="training-ordered-editor-form">
        {fields.map((field) => {
          const value = draft[field.name] || "";

          return (
            <div
              className={`training-ordered-editor-field ${
                field.wide ? "training-ordered-editor-wide" : ""
              }`}
              key={field.name}
            >
              <div className="training-ordered-editor-label">
                <label htmlFor={`${titleId}-${field.name}`}>
                  {field.label}

                  {field.required !== false ? (
                    <small> Required</small>
                  ) : (
                    <small> Optional</small>
                  )}
                </label>

                {field.maximumLength && (
                  <span>
                    {value.length}/{field.maximumLength}
                  </span>
                )}
              </div>

              {field.multiline ? (
                <textarea
                  id={`${titleId}-${field.name}`}
                  rows={field.rows || 3}
                  value={value}
                  onChange={(event) =>
                    updateDraft(field.name, event.target.value)
                  }
                  maxLength={field.maximumLength}
                  placeholder={field.placeholder}
                  disabled={disabled}
                />
              ) : (
                <input
                  id={`${titleId}-${field.name}`}
                  type="text"
                  value={value}
                  onChange={(event) =>
                    updateDraft(field.name, event.target.value)
                  }
                  maxLength={field.maximumLength}
                  placeholder={field.placeholder}
                  disabled={disabled}
                />
              )}
            </div>
          );
        })}

        {editorError && (
          <p
            className="training-ordered-editor-error training-ordered-editor-wide"
            role="alert"
          >
            {editorError}
          </p>
        )}

        <footer className="training-ordered-editor-form-footer training-ordered-editor-wide">
          <small>
            {values.length}/{maximumItems}{" "}
            {values.length === 1
              ? itemLabel.toLowerCase()
              : `${itemLabel.toLowerCase()} records`}
          </small>

          <div>
            {isEditing && (
              <button type="button" onClick={resetEditor} disabled={disabled}>
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              className="training-ordered-editor-add"
              onClick={handleSave}
              disabled={disabled || (!isEditing && hasReachedMaximum)}
            >
              {isEditing ? `Save ${itemLabel}` : `+ Add ${itemLabel}`}
            </button>
          </div>
        </footer>
      </div>

      {fieldErrors[fieldPath] && (
        <p className="training-ordered-editor-error" role="alert">
          {fieldErrors[fieldPath]}
        </p>
      )}

      {orderedItems.length > 0 ? (
        <div className="training-ordered-editor-list">
          {orderedItems.map((item, index) => {
            const itemErrors = fields
              .map(
                (field) => fieldErrors[`${fieldPath}.${index}.${field.name}`],
              )
              .filter(Boolean);

            const primaryValue = item[primaryField] || `Unnamed ${itemLabel}`;

            return (
              <article
                key={item.id}
                className={`training-ordered-editor-item ${
                  itemErrors.length > 0
                    ? "training-ordered-editor-item--error"
                    : ""
                }`}
              >
                <div className="training-ordered-editor-order">
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleMove(item.id, "up")}
                      disabled={disabled || index === 0}
                      aria-label={`Move ${primaryValue} up`}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(item.id, "down")}
                      disabled={disabled || index === orderedItems.length - 1}
                      aria-label={`Move ${primaryValue} down`}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="training-ordered-editor-content">
                  <span>{itemLabel}</span>

                  <strong>{primaryValue}</strong>

                  {fields
                    .filter((field) => field.name !== primaryField)
                    .map((field) => {
                      const fieldValue = getText(item[field.name]);

                      if (!fieldValue) {
                        return null;
                      }

                      return field.multiline ? (
                        <p key={field.name}>{fieldValue}</p>
                      ) : (
                        <small key={field.name}>
                          <b>{field.label}:</b> {fieldValue}
                        </small>
                      );
                    })}

                  {itemErrors.map((error, errorIndex) => (
                    <small
                      className="training-ordered-editor-item-error"
                      role="alert"
                      key={`${error}-${errorIndex}`}
                    >
                      {error}
                    </small>
                  ))}
                </div>

                <div className="training-ordered-editor-actions">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    disabled={disabled}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="training-ordered-editor-remove"
                    onClick={() => handleRemove(item.id)}
                    disabled={disabled}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="training-ordered-editor-empty">
          <span aria-hidden="true">◇</span>

          <h4>{emptyTitle}</h4>

          <p>{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

export default TrainingOrderedItemEditor;
