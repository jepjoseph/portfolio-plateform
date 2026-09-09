import { useId } from "react";

import {
  CONTACT_INFORMATION_CONFIG,
  getContactIcon,
  getContactTypeLabel,
} from "../../../../../config/profileConfig.js";

import {
  getProfileContactLink,
  getReadableProfileUrl,
} from "../../../../../services/Profile/profileUtils.js";

import "./SocialLinkEditor.css";

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
    fieldErrors[`socialLinks.${index}.${field}`] ||
    fieldErrors[`socialLinks.${item.id}.${field}`] ||
    ""
  );
}

function getSocialLinkTypeOptions() {
  return CONTACT_INFORMATION_CONFIG.socialLinks?.typeOptions || [];
}

/*
 * =========================================
 * Social Link Editor
 * =========================================
 */

function SocialLinkEditor({
  socialLinks = [],
  fieldErrors = {},
  disabled = false,
  onAdd,
  onChange,
  onRemove,
}) {
  const sectionTitleId = useId();

  const activeSocialLinks = Array.isArray(socialLinks)
    ? socialLinks.filter((socialLink) => socialLink?.status !== "archived")
    : [];

  const typeOptions = getSocialLinkTypeOptions();

  return (
    <section
      className="profile-social-link-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="profile-social-link-editor-header">
        <div>
          <span>Online Presence</span>

          <h3 id={sectionTitleId}>Social Profiles</h3>

          <p>
            Add professional social profiles that can be selected for résumés,
            portfolios, and public profile content.
          </p>
        </div>

        <button
          type="button"
          className="profile-social-link-editor-add-button"
          onClick={onAdd}
          disabled={disabled}
        >
          + Add Social Link
        </button>
      </header>

      <div className="profile-social-link-editor-summary">
        <span>
          <strong>{activeSocialLinks.length}</strong>{" "}
          {activeSocialLinks.length === 1
            ? "active social profile"
            : "active social profiles"}
        </span>

        {activeSocialLinks.length > 0 && (
          <small>
            Primary:{" "}
            {getContactTypeLabel("socialLinks", activeSocialLinks[0].type)}
          </small>
        )}
      </div>

      {activeSocialLinks.length > 0 ? (
        <div className="profile-social-link-editor-list">
          {activeSocialLinks.map((socialLink, index) => {
            const typeInputId = `profile-social-link-type-${socialLink.id}`;

            const valueInputId = `profile-social-link-value-${socialLink.id}`;

            const descriptionInputId = `profile-social-link-description-${socialLink.id}`;

            const typeError = getFieldError(
              fieldErrors,
              socialLink,
              index,
              "type",
            );

            const valueError = getFieldError(
              fieldErrors,
              socialLink,
              index,
              "value",
            );

            const descriptionError = getFieldError(
              fieldErrors,
              socialLink,
              index,
              "description",
            );

            const itemHasError = Boolean(
              typeError || valueError || descriptionError,
            );

            const socialLinkUrl = getProfileContactLink(
              "socialLinks",
              socialLink.value,
            );

            const typeLabel = getContactTypeLabel(
              "socialLinks",
              socialLink.type,
            );

            const icon = getContactIcon("socialLinks", socialLink.type);

            return (
              <article
                key={socialLink.id}
                className={`profile-social-link-editor-item ${
                  itemHasError ? "profile-social-link-editor-item--error" : ""
                }`}
                data-type={socialLink.type}
              >
                <header className="profile-social-link-editor-item-header">
                  <div>
                    <span
                      className="profile-social-link-editor-icon"
                      aria-hidden="true"
                    >
                      {icon}
                    </span>

                    <div>
                      <span>Social Profile {index + 1}</span>

                      <div>
                        <strong>{typeLabel}</strong>

                        {index === 0 && <small>Primary</small>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="profile-social-link-editor-remove-button"
                    onClick={() => onRemove?.(socialLink.id)}
                    disabled={disabled}
                    aria-label={`Remove ${typeLabel} profile`}
                    title="Remove social profile"
                  >
                    Remove
                  </button>
                </header>

                <div className="profile-social-link-editor-fields">
                  {/* =====================================
                      Platform
                      ===================================== */}

                  <div className="profile-social-link-editor-field">
                    <label htmlFor={typeInputId}>Platform</label>

                    <select
                      id={typeInputId}
                      value={socialLink.type || "linkedin"}
                      onChange={(event) =>
                        onChange?.(socialLink.id, "type", event.target.value)
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
                      Profile URL
                      ===================================== */}

                  <div className="profile-social-link-editor-field">
                    <label htmlFor={valueInputId}>
                      Profile URL
                      <span>Required</span>
                    </label>

                    <input
                      id={valueInputId}
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      value={socialLink.value || ""}
                      onChange={(event) =>
                        onChange?.(socialLink.id, "value", event.target.value)
                      }
                      placeholder="https://..."
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

                  <div className="profile-social-link-editor-field profile-social-link-editor-field--full">
                    <label htmlFor={descriptionInputId}>
                      Description
                      <span>Optional</span>
                    </label>

                    <input
                      id={descriptionInputId}
                      type="text"
                      value={socialLink.description || ""}
                      onChange={(event) =>
                        onChange?.(
                          socialLink.id,
                          "description",
                          event.target.value,
                        )
                      }
                      placeholder="For example: Professional LinkedIn profile"
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

                <footer className="profile-social-link-editor-item-footer">
                  <div>
                    <span>{typeLabel}</span>

                    <small>
                      {socialLinkUrl
                        ? getReadableProfileUrl(socialLink.value)
                        : "Enter a social profile address"}
                    </small>
                  </div>

                  {socialLinkUrl && (
                    <a
                      href={socialLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${typeLabel} in a new tab`}
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
        <div className="profile-social-link-editor-empty">
          <span aria-hidden="true">↗</span>

          <h4>No social profiles added</h4>

          <p>
            Add a professional social profile to make it available to your
            résumés and portfolios.
          </p>

          <button type="button" onClick={onAdd} disabled={disabled}>
            Add Social Profile
          </button>
        </div>
      )}
    </section>
  );
}

export default SocialLinkEditor;
