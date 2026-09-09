import { useId } from "react";

import {
  CONTACT_INFORMATION_CONFIG,
  getContactTypeLabel,
} from "../../../../../config/profileConfig.js";

import "./LocationEditor.css";

/*
 * =========================================
 * Helpers
 * =========================================
 */

function getFieldError(fieldErrors, item, index, field) {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return "";
  }

  return (
    fieldErrors[`locations.${index}.${field}`] ||
    fieldErrors[`locations.${item.id}.${field}`] ||
    ""
  );
}

function getLocationTypeOptions() {
  return CONTACT_INFORMATION_CONFIG.locations?.typeOptions || [];
}

/*
 * =========================================
 * Location Editor
 * =========================================
 */

function LocationEditor({
  locations = [],
  fieldErrors = {},
  disabled = false,
  onAdd,
  onChange,
  onRemove,
}) {
  const sectionTitleId = useId();

  const activeLocations = Array.isArray(locations)
    ? locations.filter((location) => location?.status !== "archived")
    : [];

  const typeOptions = getLocationTypeOptions();

  return (
    <section
      className="profile-location-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="profile-location-editor-header">
        <div>
          <span>Location</span>

          <h3 id={sectionTitleId}>Locations</h3>

          <p>
            Add home, office, work, school, or business locations that can be
            selected for résumés and portfolios.
          </p>
        </div>

        <button
          type="button"
          className="profile-location-editor-add-button"
          onClick={onAdd}
          disabled={disabled}
        >
          + Add Location
        </button>
      </header>

      <div className="profile-location-editor-summary">
        <span>
          <strong>{activeLocations.length}</strong>{" "}
          {activeLocations.length === 1
            ? "active location"
            : "active locations"}
        </span>

        {activeLocations.length > 0 && (
          <small>
            Primary: {activeLocations[0].value?.trim() || "Not completed"}
          </small>
        )}
      </div>

      {activeLocations.length > 0 ? (
        <div className="profile-location-editor-list">
          {activeLocations.map((location, index) => {
            const typeInputId = `profile-location-type-${location.id}`;
            const valueInputId = `profile-location-value-${location.id}`;
            const descriptionInputId = `profile-location-description-${location.id}`;

            const typeError = getFieldError(
              fieldErrors,
              location,
              index,
              "type",
            );

            const valueError = getFieldError(
              fieldErrors,
              location,
              index,
              "value",
            );

            const descriptionError = getFieldError(
              fieldErrors,
              location,
              index,
              "description",
            );

            const itemHasError = Boolean(
              typeError || valueError || descriptionError,
            );

            return (
              <article
                key={location.id}
                className={`profile-location-editor-item ${
                  itemHasError ? "profile-location-editor-item--error" : ""
                }`}
              >
                <header className="profile-location-editor-item-header">
                  <div>
                    <span>Location {index + 1}</span>

                    {index === 0 && <small>Primary</small>}
                  </div>

                  <button
                    type="button"
                    className="profile-location-editor-remove-button"
                    onClick={() => onRemove?.(location.id)}
                    disabled={disabled}
                    aria-label={`Remove location ${index + 1}`}
                    title="Remove location"
                  >
                    Remove
                  </button>
                </header>

                <div className="profile-location-editor-fields">
                  {/* =====================================
                      Location Type
                      ===================================== */}

                  <div className="profile-location-editor-field">
                    <label htmlFor={typeInputId}>Location Type</label>

                    <select
                      id={typeInputId}
                      value={location.type || "home"}
                      onChange={(event) =>
                        onChange?.(location.id, "type", event.target.value)
                      }
                      disabled={disabled}
                      aria-invalid={Boolean(typeError)}
                      aria-describedby={
                        typeError ? `${typeInputId}-error` : undefined
                      }
                    >
                      {typeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {typeError && (
                      <small id={`${typeInputId}-error`} role="alert">
                        {typeError}
                      </small>
                    )}
                  </div>

                  {/* =====================================
                      Location Value
                      ===================================== */}

                  <div className="profile-location-editor-field">
                    <label htmlFor={valueInputId}>
                      Location
                      <span>Required</span>
                    </label>

                    <input
                      id={valueInputId}
                      type="text"
                      inputMode="text"
                      autoComplete="street-address"
                      value={location.value || ""}
                      onChange={(event) =>
                        onChange?.(location.id, "value", event.target.value)
                      }
                      placeholder="City, State or full address"
                      disabled={disabled}
                      aria-invalid={Boolean(valueError)}
                      aria-describedby={
                        valueError ? `${valueInputId}-error` : undefined
                      }
                    />

                    {valueError && (
                      <small id={`${valueInputId}-error`} role="alert">
                        {valueError}
                      </small>
                    )}
                  </div>

                  {/* =====================================
                      Description
                      ===================================== */}

                  <div className="profile-location-editor-field profile-location-editor-field--full">
                    <label htmlFor={descriptionInputId}>
                      Description
                      <span>Optional</span>
                    </label>

                    <input
                      id={descriptionInputId}
                      type="text"
                      value={location.description || ""}
                      onChange={(event) =>
                        onChange?.(
                          location.id,
                          "description",
                          event.target.value,
                        )
                      }
                      placeholder="For example: Preferred public location"
                      maxLength="150"
                      disabled={disabled}
                      aria-invalid={Boolean(descriptionError)}
                      aria-describedby={
                        descriptionError
                          ? `${descriptionInputId}-error`
                          : undefined
                      }
                    />

                    {descriptionError && (
                      <small id={`${descriptionInputId}-error`} role="alert">
                        {descriptionError}
                      </small>
                    )}
                  </div>
                </div>

                <footer className="profile-location-editor-item-footer">
                  <span>{getContactTypeLabel("locations", location.type)}</span>

                  <small>
                    {location.value?.trim()
                      ? "Ready for Profile selection"
                      : "Enter a location"}
                  </small>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="profile-location-editor-empty">
          <span aria-hidden="true">⌖</span>

          <h4>No locations added</h4>

          <p>
            Add a location to make it available to your résumés and portfolios.
          </p>

          <button type="button" onClick={onAdd} disabled={disabled}>
            Add Location
          </button>
        </div>
      )}
    </section>
  );
}

export default LocationEditor;
