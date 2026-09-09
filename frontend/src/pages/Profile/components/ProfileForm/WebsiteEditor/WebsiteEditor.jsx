import { useId } from "react";

import {
  CONTACT_INFORMATION_CONFIG,
  getContactTypeLabel,
} from "../../../../../config/profileConfig.js";

import {
  getProfileContactLink,
  getReadableProfileUrl,
} from "../../../../../services/Profile/profileUtils.js";

import "./WebsiteEditor.css";

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
    fieldErrors[`websites.${index}.${field}`] ||
    fieldErrors[`websites.${item.id}.${field}`] ||
    ""
  );
}

function getWebsiteTypeOptions() {
  return CONTACT_INFORMATION_CONFIG.websites?.typeOptions || [];
}

/*
 * =========================================
 * Website Editor
 * =========================================
 */

function WebsiteEditor({
  websites = [],
  fieldErrors = {},
  disabled = false,
  onAdd,
  onChange,
  onRemove,
}) {
  const sectionTitleId = useId();

  const activeWebsites = Array.isArray(websites)
    ? websites.filter((website) => website?.status !== "archived")
    : [];

  const typeOptions = getWebsiteTypeOptions();

  return (
    <section
      className="profile-website-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="profile-website-editor-header">
        <div>
          <span>Online Presence</span>

          <h3 id={sectionTitleId}>Websites</h3>

          <p>
            Add portfolio, personal, business, company, school, or blog websites
            that can be used in professional content.
          </p>
        </div>

        <button
          type="button"
          className="profile-website-editor-add-button"
          onClick={onAdd}
          disabled={disabled}
        >
          + Add Website
        </button>
      </header>

      <div className="profile-website-editor-summary">
        <span>
          <strong>{activeWebsites.length}</strong>{" "}
          {activeWebsites.length === 1 ? "active website" : "active websites"}
        </span>

        {activeWebsites.length > 0 && (
          <small>
            Primary:{" "}
            {getReadableProfileUrl(activeWebsites[0].value) || "Not completed"}
          </small>
        )}
      </div>

      {activeWebsites.length > 0 ? (
        <div className="profile-website-editor-list">
          {activeWebsites.map((website, index) => {
            const typeInputId = `profile-website-type-${website.id}`;
            const valueInputId = `profile-website-value-${website.id}`;
            const descriptionInputId = `profile-website-description-${website.id}`;

            const typeError = getFieldError(
              fieldErrors,
              website,
              index,
              "type",
            );

            const valueError = getFieldError(
              fieldErrors,
              website,
              index,
              "value",
            );

            const descriptionError = getFieldError(
              fieldErrors,
              website,
              index,
              "description",
            );

            const itemHasError = Boolean(
              typeError || valueError || descriptionError,
            );

            const websiteLink = getProfileContactLink(
              "websites",
              website.value,
            );

            return (
              <article
                key={website.id}
                className={`profile-website-editor-item ${
                  itemHasError ? "profile-website-editor-item--error" : ""
                }`}
              >
                <header className="profile-website-editor-item-header">
                  <div>
                    <span>Website {index + 1}</span>

                    {index === 0 && <small>Primary</small>}
                  </div>

                  <button
                    type="button"
                    className="profile-website-editor-remove-button"
                    onClick={() => onRemove?.(website.id)}
                    disabled={disabled}
                    aria-label={`Remove website ${index + 1}`}
                    title="Remove website"
                  >
                    Remove
                  </button>
                </header>

                <div className="profile-website-editor-fields">
                  {/* =====================================
                      Website Type
                      ===================================== */}

                  <div className="profile-website-editor-field">
                    <label htmlFor={typeInputId}>Website Type</label>

                    <select
                      id={typeInputId}
                      value={website.type || "portfolio"}
                      onChange={(event) =>
                        onChange?.(website.id, "type", event.target.value)
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
                      Website URL
                      ===================================== */}

                  <div className="profile-website-editor-field">
                    <label htmlFor={valueInputId}>
                      Website URL
                      <span>Required</span>
                    </label>

                    <input
                      id={valueInputId}
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      value={website.value || ""}
                      onChange={(event) =>
                        onChange?.(website.id, "value", event.target.value)
                      }
                      placeholder="https://example.com"
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

                  <div className="profile-website-editor-field profile-website-editor-field--full">
                    <label htmlFor={descriptionInputId}>
                      Description
                      <span>Optional</span>
                    </label>

                    <input
                      id={descriptionInputId}
                      type="text"
                      value={website.description || ""}
                      onChange={(event) =>
                        onChange?.(
                          website.id,
                          "description",
                          event.target.value,
                        )
                      }
                      placeholder="For example: Personal project portfolio"
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

                <footer className="profile-website-editor-item-footer">
                  <div>
                    <span>{getContactTypeLabel("websites", website.type)}</span>

                    <small>
                      {website.value?.trim()
                        ? "Ready for Profile selection"
                        : "Enter a website address"}
                    </small>
                  </div>

                  {websiteLink && (
                    <a
                      href={websiteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open website ${index + 1} in a new tab`}
                    >
                      Preview
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="profile-website-editor-empty">
          <span aria-hidden="true">↗</span>

          <h4>No websites added</h4>

          <p>
            Add a website to make it available to your résumés and portfolios.
          </p>

          <button type="button" onClick={onAdd} disabled={disabled}>
            Add Website
          </button>
        </div>
      )}
    </section>
  );
}

export default WebsiteEditor;
