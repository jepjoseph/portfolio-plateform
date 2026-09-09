import { useId } from "react";

import {
  CONTACT_INFORMATION_CONFIG,
  getContactTypeLabel,
} from "../../../../../config/profileConfig.js";

import "./PhoneEditor.css";

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
    fieldErrors[`phones.${index}.${field}`] ||
    fieldErrors[`phones.${item.id}.${field}`] ||
    ""
  );
}

function getPhoneTypeOptions() {
  return CONTACT_INFORMATION_CONFIG.phones?.typeOptions || [];
}

/*
 * =========================================
 * Phone Editor
 * =========================================
 */

function PhoneEditor({
  phones = [],
  fieldErrors = {},
  disabled = false,
  onAdd,
  onChange,
  onRemove,
}) {
  const sectionTitleId = useId();

  const activePhones = Array.isArray(phones)
    ? phones.filter((phone) => phone?.status !== "archived")
    : [];

  const typeOptions = getPhoneTypeOptions();

  return (
    <section className="profile-phone-editor" aria-labelledby={sectionTitleId}>
      <header className="profile-phone-editor-header">
        <div>
          <span>Contact</span>

          <h3 id={sectionTitleId}>Phone Numbers</h3>

          <p>
            Add the phone numbers that can be selected for résumés, portfolios,
            and other professional content.
          </p>
        </div>

        <button
          type="button"
          className="profile-phone-editor-add-button"
          onClick={onAdd}
          disabled={disabled}
        >
          + Add Phone
        </button>
      </header>

      <div className="profile-phone-editor-summary">
        <span>
          <strong>{activePhones.length}</strong>{" "}
          {activePhones.length === 1
            ? "active phone number"
            : "active phone numbers"}
        </span>

        {activePhones.length > 0 && (
          <small>
            Primary: {activePhones[0].value?.trim() || "Not completed"}
          </small>
        )}
      </div>

      {activePhones.length > 0 ? (
        <div className="profile-phone-editor-list">
          {activePhones.map((phone, index) => {
            const typeInputId = `profile-phone-type-${phone.id}`;
            const valueInputId = `profile-phone-value-${phone.id}`;
            const descriptionInputId = `profile-phone-description-${phone.id}`;

            const typeError = getFieldError(fieldErrors, phone, index, "type");

            const valueError = getFieldError(
              fieldErrors,
              phone,
              index,
              "value",
            );

            const descriptionError = getFieldError(
              fieldErrors,
              phone,
              index,
              "description",
            );

            const itemHasError = Boolean(
              typeError || valueError || descriptionError,
            );

            return (
              <article
                key={phone.id}
                className={`profile-phone-editor-item ${
                  itemHasError ? "profile-phone-editor-item--error" : ""
                }`}
              >
                <header className="profile-phone-editor-item-header">
                  <div>
                    <span>Phone {index + 1}</span>

                    {index === 0 && <small>Primary</small>}
                  </div>

                  <button
                    type="button"
                    className="profile-phone-editor-remove-button"
                    onClick={() => onRemove?.(phone.id)}
                    disabled={disabled}
                    aria-label={`Remove phone number ${index + 1}`}
                    title="Remove phone number"
                  >
                    Remove
                  </button>
                </header>

                <div className="profile-phone-editor-fields">
                  {/* =====================================
                      Phone Type
                      ===================================== */}

                  <div className="profile-phone-editor-field">
                    <label htmlFor={typeInputId}>Phone Type</label>

                    <select
                      id={typeInputId}
                      value={phone.type || "personal"}
                      onChange={(event) =>
                        onChange?.(phone.id, "type", event.target.value)
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
                      Phone Number
                      ===================================== */}

                  <div className="profile-phone-editor-field">
                    <label htmlFor={valueInputId}>
                      Phone Number
                      <span>Required</span>
                    </label>

                    <input
                      id={valueInputId}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone.value || ""}
                      onChange={(event) =>
                        onChange?.(phone.id, "value", event.target.value)
                      }
                      placeholder="+1 954 555 0100"
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

                  <div className="profile-phone-editor-field profile-phone-editor-field--full">
                    <label htmlFor={descriptionInputId}>
                      Description
                      <span>Optional</span>
                    </label>

                    <input
                      id={descriptionInputId}
                      type="text"
                      value={phone.description || ""}
                      onChange={(event) =>
                        onChange?.(phone.id, "description", event.target.value)
                      }
                      placeholder="For example: Preferred mobile number"
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

                <footer className="profile-phone-editor-item-footer">
                  <span>{getContactTypeLabel("phones", phone.type)}</span>

                  <small>
                    {phone.value?.trim()
                      ? "Ready for Profile selection"
                      : "Enter a phone number"}
                  </small>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="profile-phone-editor-empty">
          <span aria-hidden="true">☎</span>

          <h4>No phone numbers added</h4>

          <p>
            Add a phone number to make it available to your résumés and
            portfolios.
          </p>

          <button type="button" onClick={onAdd} disabled={disabled}>
            Add Phone Number
          </button>
        </div>
      )}
    </section>
  );
}

export default PhoneEditor;
