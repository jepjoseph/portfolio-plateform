import { useMemo, useState } from "react";

import {
  getProfileCategoryLabel,
  getProfileSelectionOptions,
  getSelectedProfileValue,
  PROFILE_CATEGORY_OPTIONS,
} from "../../../../services/Portfolio/profileSelectionUtils";

import "./ProfileInformationSelector.css";

function createSelection(category, itemId) {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `profile-selection-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return {
    id,
    category,
    itemId,
  };
}

function ProfileInformationSelector({ profile, selections = [], onChange }) {
  const [selectedCategory, setSelectedCategory] = useState("");

  const [selectedItemId, setSelectedItemId] = useState("");

  const [editingSelectionId, setEditingSelectionId] = useState(null);

  const [error, setError] = useState("");

  const availableItems = useMemo(
    () => getProfileSelectionOptions(profile, selectedCategory),
    [profile, selectedCategory],
  );

  const isEditing = Boolean(editingSelectionId);

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setSelectedItemId("");
    setError("");
  };

  const resetEditor = () => {
    setSelectedCategory("");
    setSelectedItemId("");
    setEditingSelectionId(null);
    setError("");
  };

  const isDuplicateSelection = (category, itemId) => {
    return selections.some(
      (selection) =>
        selection.category === category &&
        selection.itemId === itemId &&
        selection.id !== editingSelectionId,
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedCategory) {
      setError("Choose an information type.");

      return;
    }

    if (!selectedItemId) {
      setError("Choose the information to include.");

      return;
    }

    if (isDuplicateSelection(selectedCategory, selectedItemId)) {
      setError("This information has already been added.");

      return;
    }

    if (isEditing) {
      onChange((currentSelections) =>
        currentSelections.map((selection) =>
          selection.id === editingSelectionId
            ? {
                ...selection,
                category: selectedCategory,
                itemId: selectedItemId,
              }
            : selection,
        ),
      );
    } else {
      onChange((currentSelections) => [
        ...currentSelections,

        createSelection(selectedCategory, selectedItemId),
      ]);
    }

    resetEditor();
  };

  const handleEdit = (selection) => {
    setSelectedCategory(selection.category);
    setSelectedItemId(selection.itemId);
    setEditingSelectionId(selection.id);
    setError("");
  };

  const handleDelete = (selectionId) => {
    onChange((currentSelections) =>
      currentSelections.filter((selection) => selection.id !== selectionId),
    );

    if (editingSelectionId === selectionId) {
      resetEditor();
    }
  };

  return (
    <section
      className="profile-information-selector portfolio-editor-card"
      aria-labelledby="profile-information-selector-title"
    >
      <header className="profile-information-selector-header">
        <div>
          <span>Profile Content</span>

          <h3 id="profile-information-selector-title">Profile Information</h3>

          <p>
            Choose the personal information that will appear at the top of this
            portfolio.
          </p>
        </div>

        <span className="profile-information-selection-count">
          {selections.length}{" "}
          {selections.length === 1 ? "Selection" : "Selections"}
        </span>
      </header>

      {/* =========================================
          Selection Form
          ========================================= */}

      <form
        className="profile-information-selection-form"
        onSubmit={handleSubmit}
      >
        <div className="profile-information-selection-fields">
          <div className="profile-information-selection-field">
            <label htmlFor="profile-information-category">
              Information Type
            </label>

            <select
              id="profile-information-category"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <option value="">Choose information type</option>

              {PROFILE_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="profile-information-selection-field">
            <label htmlFor="profile-information-item">Information</label>

            <select
              id="profile-information-item"
              value={selectedItemId}
              onChange={(event) => {
                setSelectedItemId(event.target.value);
                setError("");
              }}
              disabled={!selectedCategory || availableItems.length === 0}
            >
              <option value="">
                {!selectedCategory
                  ? "Choose a type first"
                  : availableItems.length > 0
                    ? "Choose information"
                    : selectedCategory === "profilePictures"
                      ? "Upload and save a picture on your Profile page first"
                      : "No information available"}
              </option>

              {availableItems.map((option) => {
                const duplicate = isDuplicateSelection(
                  selectedCategory,
                  option.id,
                );

                return (
                  <option
                    key={option.id}
                    value={option.id}
                    disabled={duplicate}
                  >
                    {option.label}
                    {option.displayValue ? ` — ${option.displayValue}` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {error && (
          <p className="profile-information-selection-error" role="alert">
            {error}
          </p>
        )}

        <div className="profile-information-selection-actions">
          {isEditing && (
            <button
              type="button"
              className="profile-information-selection-cancel"
              onClick={resetEditor}
            >
              Cancel Edit
            </button>
          )}

          <button type="submit" className="profile-information-selection-add">
            {isEditing ? "Save Selection" : "+ Add Information"}
          </button>
        </div>
      </form>

      {/* =========================================
          Selected Information
          ========================================= */}

      <div className="profile-information-selected-list">
        {selections.length > 0 ? (
          selections.map((selection) => {
            const selectedValue = getSelectedProfileValue(profile, selection);

            if (!selectedValue) {
              return null;
            }

            return (
              <article
                key={selection.id}
                className="profile-information-selected-item"
              >
                {selection.category === "profilePictures" &&
                selectedValue.imageUrl ? (
                  <img
                    className="profile-information-selected-picture"
                    src={selectedValue.imageUrl}
                    alt={selectedValue.displayValue || "Selected picture"}
                  />
                ) : (
                  <div
                    className="profile-information-selected-icon"
                    aria-hidden="true"
                  >
                    ✦
                  </div>
                )}

                <div className="profile-information-selected-content">
                  <span>{getProfileCategoryLabel(selection.category)}</span>

                  <strong>{selectedValue.displayValue}</strong>

                  <small>{selectedValue.label}</small>
                </div>

                <div className="profile-information-selected-actions">
                  <button
                    type="button"
                    className="profile-information-selected-edit"
                    onClick={() => handleEdit(selection)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="profile-information-selected-delete"
                    onClick={() => handleDelete(selection.id)}
                    aria-label={`Remove ${selectedValue.displayValue}`}
                  >
                    ×
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="profile-information-selected-empty">
            <span aria-hidden="true">✦</span>

            <h4>No profile information selected</h4>

            <p>
              Use the dropdown menus above to add information to this portfolio.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProfileInformationSelector;
