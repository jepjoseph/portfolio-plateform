import { useMemo, useState } from "react";

import {
  getProfileCategoryLabel,
  getProfileSelectionOptions,
  getSelectedProfileValue,
  PICTURE_USAGE_OPTIONS,
  PROFILE_CATEGORY_OPTIONS,
} from "../../../../services/Portfolio/profileSelectionUtils";

import "./ProfileInformationSelector.css";

/*
 * =========================================
 * Helpers
 * =========================================
 */

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `profile-selection-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createSelection({ category, itemId, pictureUsage = "" }) {
  return {
    id: createId(),
    category,
    itemId,

    pictureUsage: category === "profilePictures" ? pictureUsage : "",
  };
}

function getPictureUsageLabel(pictureUsage) {
  return (
    PICTURE_USAGE_OPTIONS.find((option) => option.value === pictureUsage)
      ?.label || "Picture"
  );
}

function ProfileInformationSelector({ profile, selections = [], onChange }) {
  const [selectedCategory, setSelectedCategory] = useState("");

  const [selectedItemId, setSelectedItemId] = useState("");

  const [selectedPictureUsage, setSelectedPictureUsage] = useState("");

  const [editingSelectionId, setEditingSelectionId] = useState(null);

  const [error, setError] = useState("");

  /*
   * =========================================
   * Derived Information
   * =========================================
   */

  const isPictureCategory = selectedCategory === "profilePictures";

  const availableItems = useMemo(
    () => getProfileSelectionOptions(profile, selectedCategory),
    [profile, selectedCategory],
  );

  const selectedPictureOption = useMemo(
    () => availableItems.find((option) => option.id === selectedItemId) || null,
    [availableItems, selectedItemId],
  );

  const isEditing = Boolean(editingSelectionId);

  const hasAvailableInformation = availableItems.length > 0;

  const canChoosePictureUsage = isPictureCategory && hasAvailableInformation;

  const canChoosePictureFile =
    isPictureCategory &&
    hasAvailableInformation &&
    Boolean(selectedPictureUsage);

  /*
   * =========================================
   * Form Reset
   * =========================================
   */

  const resetEditor = () => {
    setSelectedCategory("");
    setSelectedItemId("");
    setSelectedPictureUsage("");
    setEditingSelectionId(null);
    setError("");
  };

  /*
   * =========================================
   * Category Change
   * =========================================
   */

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);

    setSelectedItemId("");
    setSelectedPictureUsage("");
    setError("");
  };

  /*
   * =========================================
   * Duplicate Detection
   * =========================================
   */

  const isDuplicateSelection = ({ category, itemId, pictureUsage = "" }) => {
    return selections.some((selection) => {
      if (selection.id === editingSelectionId) {
        return false;
      }

      if (category === "profilePictures") {
        return (
          selection.category === category &&
          selection.itemId === itemId &&
          selection.pictureUsage === pictureUsage
        );
      }

      return selection.category === category && selection.itemId === itemId;
    });
  };

  /*
   * =========================================
   * Submit
   * =========================================
   */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedCategory) {
      setError("Choose an information type.");

      return;
    }

    if (isPictureCategory && !selectedPictureUsage) {
      setError("Choose where the picture will be used.");

      return;
    }

    if (!selectedItemId) {
      setError(
        isPictureCategory
          ? "Choose an uploaded picture."
          : "Choose the information to include.",
      );

      return;
    }

    const selectionData = {
      category: selectedCategory,
      itemId: selectedItemId,

      pictureUsage: isPictureCategory ? selectedPictureUsage : "",
    };

    if (isDuplicateSelection(selectionData)) {
      setError("This information has already been added.");

      return;
    }

    if (isEditing) {
      onChange?.((currentSelections = []) =>
        currentSelections.map((selection) =>
          selection.id === editingSelectionId
            ? {
                ...selection,
                ...selectionData,
              }
            : selection,
        ),
      );
    } else {
      onChange?.((currentSelections = []) => [
        ...currentSelections,
        createSelection(selectionData),
      ]);
    }

    resetEditor();
  };

  /*
   * =========================================
   * Edit
   * =========================================
   */

  const handleEdit = (selection) => {
    setSelectedCategory(selection.category);

    setSelectedItemId(selection.itemId);

    setSelectedPictureUsage(selection.pictureUsage || "");

    setEditingSelectionId(selection.id);
    setError("");
  };

  /*
   * =========================================
   * Delete
   * =========================================
   */

  const handleDelete = (selectionId) => {
    onChange?.((currentSelections = []) =>
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
      {/* =========================================
          Header
          ========================================= */}

      <header className="profile-information-selector-header">
        <div>
          <span>Profile Content</span>

          <h3 id="profile-information-selector-title">Profile Information</h3>

          <p>
            Choose reusable profile information and decide how uploaded pictures
            will be used in this portfolio.
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
          {/* =====================================
              Dropdown 1: Information Type
              ===================================== */}

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

          {/* =====================================
              Dropdown 2: Information / Usage
              ===================================== */}

          <div className="profile-information-selection-field">
            <label htmlFor="profile-information-value">
              {isPictureCategory ? "Picture Usage" : "Information"}
            </label>

            {isPictureCategory ? (
              <select
                id="profile-information-value"
                value={selectedPictureUsage}
                onChange={(event) => {
                  setSelectedPictureUsage(event.target.value);

                  setSelectedItemId("");
                  setError("");
                }}
                disabled={!canChoosePictureUsage}
              >
                <option value="">
                  {!hasAvailableInformation
                    ? "Upload and save a picture first"
                    : "Choose picture usage"}
                </option>

                {PICTURE_USAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                id="profile-information-value"
                value={selectedItemId}
                onChange={(event) => {
                  setSelectedItemId(event.target.value);

                  setError("");
                }}
                disabled={!selectedCategory || !hasAvailableInformation}
              >
                <option value="">
                  {!selectedCategory
                    ? "Choose a type first"
                    : hasAvailableInformation
                      ? "Choose information"
                      : "No information available"}
                </option>

                {availableItems.map((option) => {
                  const duplicate = isDuplicateSelection({
                    category: selectedCategory,
                    itemId: option.id,
                  });

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
            )}
          </div>

          {/* =====================================
              Dropdown 3: Picture File
              ===================================== */}

          <div className="profile-information-selection-field">
            <label htmlFor="profile-information-picture">Picture File</label>

            <select
              id="profile-information-picture"
              value={isPictureCategory ? selectedItemId : ""}
              onChange={(event) => {
                setSelectedItemId(event.target.value);

                setError("");
              }}
              disabled={!canChoosePictureFile}
            >
              <option value="">
                {!isPictureCategory
                  ? "Available for pictures only"
                  : !hasAvailableInformation
                    ? "No uploaded pictures available"
                    : !selectedPictureUsage
                      ? "Choose picture usage first"
                      : "Choose uploaded picture"}
              </option>

              {isPictureCategory &&
                availableItems.map((option) => {
                  const duplicate = isDuplicateSelection({
                    category: "profilePictures",
                    itemId: option.id,
                    pictureUsage: selectedPictureUsage,
                  });

                  return (
                    <option
                      key={option.id}
                      value={option.id}
                      disabled={duplicate}
                    >
                      {option.displayValue}

                      {option.label && option.label !== option.displayValue
                        ? ` — ${option.label}`
                        : ""}
                    </option>
                  );
                })}
            </select>
          </div>
        </div>

        {/* =========================================
            Picture Preview
            ========================================= */}

        {isPictureCategory && selectedPictureOption?.imageUrl && (
          <div className="profile-information-picture-choice-preview">
            <img
              src={selectedPictureOption.imageUrl}
              alt={
                selectedPictureOption.label ||
                selectedPictureOption.displayValue ||
                "Selected picture"
              }
            />

            <div>
              <span>{getPictureUsageLabel(selectedPictureUsage)}</span>

              <strong>{selectedPictureOption.displayValue}</strong>

              {selectedPictureOption.label &&
                selectedPictureOption.label !==
                  selectedPictureOption.displayValue && (
                  <small>{selectedPictureOption.label}</small>
                )}
            </div>
          </div>
        )}

        {/* =========================================
            Error
            ========================================= */}

        {error && (
          <p className="profile-information-selection-error" role="alert">
            {error}
          </p>
        )}

        {/* =========================================
            Form Actions
            ========================================= */}

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

            const isPicture = selection.category === "profilePictures";

            return (
              <article
                key={selection.id}
                className="profile-information-selected-item"
              >
                {isPicture && selectedValue.imageUrl ? (
                  <img
                    className="profile-information-selected-picture"
                    src={selectedValue.imageUrl}
                    alt={
                      selectedValue.label ||
                      selectedValue.displayValue ||
                      "Selected picture"
                    }
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
                  <span>
                    {isPicture
                      ? getPictureUsageLabel(selection.pictureUsage)
                      : getProfileCategoryLabel(selection.category)}
                  </span>

                  <strong>{selectedValue.displayValue}</strong>

                  <small>
                    {isPicture ? selectedValue.label : selectedValue.label}
                  </small>
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
