import { useId, useMemo, useState } from "react";

import "./EducationOrderedItemEditor.css";

function normalizeOrder(items) {
  return items.map((item, index) => ({
    ...item,
    order: index,
  }));
}

function EducationOrderedItemEditor({
  values = [],
  title,
  label,
  description,
  itemLabel,
  emptyTitle,
  emptyMessage,
  namePlaceholder,
  descriptionPlaceholder,
  maximumItems,
  maximumNameLength,
  maximumDescriptionLength,
  fieldPath,
  fieldErrors = {},
  disabled = false,
  createItem,
  onChange,
}) {
  const titleId = useId();
  const nameId = useId();
  const descriptionId = useId();

  const [draftName, setDraftName] = useState("");

  const [draftDescription, setDraftDescription] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [editorError, setEditorError] = useState("");

  const orderedItems = useMemo(
    () =>
      [...values].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      ),
    [values],
  );

  const isEditing = Boolean(editingId);

  const hasReachedMaximum = values.length >= maximumItems;

  const resetEditor = () => {
    setDraftName("");
    setDraftDescription("");
    setEditingId(null);
    setEditorError("");
  };

  const isDuplicate = (name) => {
    const normalizedName = name.normalize("NFKC").trim().toLocaleLowerCase();

    return values.some((item) => {
      if (item.id === editingId) {
        return false;
      }

      return (
        String(item.name || "")
          .normalize("NFKC")
          .trim()
          .toLocaleLowerCase() === normalizedName
      );
    });
  };

  const handleSave = () => {
    const name = draftName.trim();

    const itemDescription = draftDescription.trim();

    if (!name) {
      setEditorError(`Enter a ${itemLabel.toLowerCase()} name.`);

      return;
    }

    if (name.length > maximumNameLength) {
      setEditorError(
        `${itemLabel} name cannot exceed ${maximumNameLength} characters.`,
      );

      return;
    }

    if (itemDescription.length > maximumDescriptionLength) {
      setEditorError(
        `${itemLabel} description cannot exceed ${maximumDescriptionLength} characters.`,
      );

      return;
    }

    if (!isEditing && hasReachedMaximum) {
      setEditorError(
        `Add no more than ${maximumItems} ${itemLabel.toLowerCase()} records.`,
      );

      return;
    }

    if (isDuplicate(name)) {
      setEditorError(`This ${itemLabel.toLowerCase()} has already been added.`);

      return;
    }

    if (isEditing) {
      onChange?.(
        normalizeOrder(
          values.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  name,
                  description: itemDescription,
                }
              : item,
          ),
        ),
      );
    } else {
      onChange?.(
        normalizeOrder([
          ...values,

          createItem({
            name,
            description: itemDescription,
            order: values.length,
          }),
        ]),
      );
    }

    resetEditor();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setDraftName(item.name || "");
    setDraftDescription(item.description || "");
    setEditorError("");
  };

  const handleRemove = (itemId) => {
    onChange?.(normalizeOrder(values.filter((item) => item.id !== itemId)));

    if (editingId === itemId) {
      resetEditor();
    }
  };

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

    const reordered = [...orderedItems];

    const [movedItem] = reordered.splice(currentIndex, 1);

    reordered.splice(targetIndex, 0, movedItem);

    onChange?.(normalizeOrder(reordered));
  };

  return (
    <section
      className="education-form-section education-ordered-editor"
      aria-labelledby={titleId}
    >
      <header className="education-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>{label}</small>

          <h3 id={titleId}>{title}</h3>

          <p>{description}</p>
        </div>
      </header>

      <div className="education-ordered-editor-form">
        <div className="education-ordered-editor-field">
          <div className="education-ordered-editor-label">
            <label htmlFor={nameId}>
              {isEditing ? `Edit ${itemLabel}` : `${itemLabel} Name`}
            </label>

            <span>
              {draftName.length}/{maximumNameLength}
            </span>
          </div>

          <input
            id={nameId}
            type="text"
            value={draftName}
            onChange={(event) => {
              setDraftName(event.target.value);

              setEditorError("");
            }}
            maxLength={maximumNameLength}
            placeholder={namePlaceholder}
            disabled={disabled}
          />
        </div>

        <div className="education-ordered-editor-field">
          <div className="education-ordered-editor-label">
            <label htmlFor={descriptionId}>
              Description
              <small> Optional</small>
            </label>

            <span>
              {draftDescription.length}/{maximumDescriptionLength}
            </span>
          </div>

          <textarea
            id={descriptionId}
            rows={3}
            value={draftDescription}
            onChange={(event) => {
              setDraftDescription(event.target.value);

              setEditorError("");
            }}
            maxLength={maximumDescriptionLength}
            placeholder={descriptionPlaceholder}
            disabled={disabled}
          />
        </div>

        {editorError && (
          <p className="education-ordered-editor-error" role="alert">
            {editorError}
          </p>
        )}

        <footer className="education-ordered-editor-form-footer">
          <small>
            {values.length}/{maximumItems} {itemLabel.toLowerCase()} records
          </small>

          <div>
            {isEditing && (
              <button type="button" onClick={resetEditor} disabled={disabled}>
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              className="education-ordered-editor-add"
              onClick={handleSave}
              disabled={disabled || (!isEditing && hasReachedMaximum)}
            >
              {isEditing ? `Save ${itemLabel}` : `+ Add ${itemLabel}`}
            </button>
          </div>
        </footer>
      </div>

      {orderedItems.length > 0 ? (
        <div className="education-ordered-editor-list">
          {orderedItems.map((item, index) => {
            const nameError = fieldErrors[`${fieldPath}.${index}.name`];

            const descriptionError =
              fieldErrors[`${fieldPath}.${index}.description`];

            return (
              <article
                key={item.id}
                className={`education-ordered-editor-item ${
                  nameError || descriptionError
                    ? "education-ordered-editor-item--error"
                    : ""
                }`}
              >
                <div className="education-ordered-editor-order">
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleMove(item.id, "up")}
                      disabled={disabled || index === 0}
                      aria-label={`Move ${item.name} up`}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(item.id, "down")}
                      disabled={disabled || index === orderedItems.length - 1}
                      aria-label={`Move ${item.name} down`}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="education-ordered-editor-content">
                  <span>{itemLabel}</span>

                  <strong>{item.name}</strong>

                  {item.description && <p>{item.description}</p>}

                  {nameError && <small role="alert">{nameError}</small>}

                  {descriptionError && (
                    <small role="alert">{descriptionError}</small>
                  )}
                </div>

                <div className="education-ordered-editor-actions">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    disabled={disabled}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="education-ordered-editor-remove"
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
        <div className="education-ordered-editor-empty">
          <span aria-hidden="true">◇</span>

          <h4>{emptyTitle}</h4>

          <p>{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

export default EducationOrderedItemEditor;
