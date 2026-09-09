import { useId } from "react";

import {
  CONTACT_INFORMATION_CONFIG,
  getContactTypeLabel,
} from "../../../../../config/profileConfig.js";

import "./EmailEditor.css";

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
    fieldErrors[`emails.${index}.${field}`] ||
    fieldErrors[`emails.${item.id}.${field}`] ||
    ""
  );
}

function getEmailTypeOptions() {
  return CONTACT_INFORMATION_CONFIG.emails?.typeOptions || [];
}

/*
 * =========================================
 * Email Editor
 * =========================================
 */

function EmailEditor({
  emails = [],
  fieldErrors = {},
  disabled = false,
  onAdd,
  onChange,
  onRemove,
}) {
  const sectionTitleId = useId();

  const activeEmails = Array.isArray(emails)
    ? emails.filter((email) => email?.status !== "archived")
    : [];

  const typeOptions = getEmailTypeOptions();

  return (
    <section className="profile-email-editor" aria-labelledby={sectionTitleId}>
      <header className="profile-email-editor-header">
        <div>
          <span>Contact</span>

          <h3 id={sectionTitleId}>Email Addresses</h3>

          <p>
            Add the email addresses that can be selected for résumés,
            portfolios, and other professional content.
          </p>
        </div>

        <button
          type="button"
          className="profile-email-editor-add-button"
          onClick={onAdd}
          disabled={disabled}
        >
          + Add Email
        </button>
      </header>

      <div className="profile-email-editor-summary">
        <span>
          <strong>{activeEmails.length}</strong>{" "}
          {activeEmails.length === 1
            ? "active email address"
            : "active email addresses"}
        </span>

        {activeEmails.length > 0 && (
          <small>
            Primary: {activeEmails[0].value?.trim() || "Not completed"}
          </small>
        )}
      </div>

      {activeEmails.length > 0 ? (
        <div className="profile-email-editor-list">
          {activeEmails.map((email, index) => {
            const typeInputId = `profile-email-type-${email.id}`;
            const valueInputId = `profile-email-value-${email.id}`;
            const descriptionInputId = `profile-email-description-${email.id}`;

            const typeError = getFieldError(fieldErrors, email, index, "type");

            const valueError = getFieldError(
              fieldErrors,
              email,
              index,
              "value",
            );

            const descriptionError = getFieldError(
              fieldErrors,
              email,
              index,
              "description",
            );

            const itemHasError = Boolean(
              typeError || valueError || descriptionError,
            );

            return (
              <article
                key={email.id}
                className={`profile-email-editor-item ${
                  itemHasError ? "profile-email-editor-item--error" : ""
                }`}
              >
                <header className="profile-email-editor-item-header">
                  <div>
                    <span>Email {index + 1}</span>

                    {index === 0 && <small>Primary</small>}
                  </div>

                  <button
                    type="button"
                    className="profile-email-editor-remove-button"
                    onClick={() => onRemove?.(email.id)}
                    disabled={disabled}
                    aria-label={`Remove email address ${index + 1}`}
                    title="Remove email address"
                  >
                    Remove
                  </button>
                </header>

                <div className="profile-email-editor-fields">
                  {/* =====================================
                      Email Type
                      ===================================== */}

                  <div className="profile-email-editor-field">
                    <label htmlFor={typeInputId}>Email Type</label>

                    <select
                      id={typeInputId}
                      value={email.type || "personal"}
                      onChange={(event) =>
                        onChange?.(email.id, "type", event.target.value)
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
                      Email Address
                      ===================================== */}

                  <div className="profile-email-editor-field">
                    <label htmlFor={valueInputId}>
                      Email Address
                      <span>Required</span>
                    </label>

                    <input
                      id={valueInputId}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email.value || ""}
                      onChange={(event) =>
                        onChange?.(email.id, "value", event.target.value)
                      }
                      placeholder="name@example.com"
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

                  <div className="profile-email-editor-field profile-email-editor-field--full">
                    <label htmlFor={descriptionInputId}>
                      Description
                      <span>Optional</span>
                    </label>

                    <input
                      id={descriptionInputId}
                      type="text"
                      value={email.description || ""}
                      onChange={(event) =>
                        onChange?.(email.id, "description", event.target.value)
                      }
                      placeholder="For example: Preferred professional email"
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

                <footer className="profile-email-editor-item-footer">
                  <span>{getContactTypeLabel("emails", email.type)}</span>

                  <small>
                    {email.value?.trim()
                      ? "Ready for Profile selection"
                      : "Enter an email address"}
                  </small>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="profile-email-editor-empty">
          <span aria-hidden="true">@</span>

          <h4>No email addresses added</h4>

          <p>
            Add an email address to make it available to your résumés and
            portfolios.
          </p>

          <button type="button" onClick={onAdd} disabled={disabled}>
            Add Email Address
          </button>
        </div>
      )}
    </section>
  );
}

export default EmailEditor;
