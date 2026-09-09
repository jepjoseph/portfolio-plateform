import { useId } from "react";

import "./NameEditor.css";

/*
 * =========================================
 * Error Helper
 * =========================================
 */

function getFieldError(fieldErrors, fieldName) {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return "";
  }

  return fieldErrors[fieldName] || "";
}

/*
 * =========================================
 * Name Editor
 * =========================================
 */

function NameEditor({
  firstName = "",
  middleName = "",
  lastName = "",
  fieldErrors = {},
  disabled = false,
  onChange,
}) {
  const sectionTitleId = useId();

  const firstNameId = useId();
  const middleNameId = useId();
  const lastNameId = useId();

  const firstNameError = getFieldError(fieldErrors, "firstName");
  const middleNameError = getFieldError(fieldErrors, "middleName");
  const lastNameError = getFieldError(fieldErrors, "lastName");

  const firstNameErrorId = `${firstNameId}-error`;
  const middleNameErrorId = `${middleNameId}-error`;
  const lastNameErrorId = `${lastNameId}-error`;

  const handleChange = (field, value) => {
    onChange?.(field, value);
  };

  return (
    <section className="profile-name-editor" aria-labelledby={sectionTitleId}>
      <header className="profile-name-editor-header">
        <div>
          <span>Identity</span>

          <h3 id={sectionTitleId}>Personal Name</h3>

          <p>
            Enter the name information used in professional documents and public
            portfolio content.
          </p>
        </div>

        <span className="profile-name-editor-badge" aria-hidden="true">
          ID
        </span>
      </header>

      <div className="profile-name-editor-grid">
        {/* =====================================
            First Name
            ===================================== */}

        <div
          className={`profile-name-editor-field ${
            firstNameError ? "profile-name-editor-field--error" : ""
          }`}
        >
          <label htmlFor={firstNameId}>
            First Name
            <span className="profile-name-editor-required">Required</span>
          </label>

          <input
            id={firstNameId}
            name="firstName"
            type="text"
            value={firstName}
            onChange={(event) => handleChange("firstName", event.target.value)}
            autoComplete="given-name"
            placeholder="First name"
            disabled={disabled}
            aria-invalid={Boolean(firstNameError)}
            aria-describedby={firstNameError ? firstNameErrorId : undefined}
          />

          {firstNameError && (
            <small id={firstNameErrorId} role="alert">
              {firstNameError}
            </small>
          )}
        </div>

        {/* =====================================
            Middle Name
            ===================================== */}

        <div
          className={`profile-name-editor-field ${
            middleNameError ? "profile-name-editor-field--error" : ""
          }`}
        >
          <label htmlFor={middleNameId}>
            Middle Name
            <span className="profile-name-editor-optional">Optional</span>
          </label>

          <input
            id={middleNameId}
            name="middleName"
            type="text"
            value={middleName}
            onChange={(event) => handleChange("middleName", event.target.value)}
            autoComplete="additional-name"
            placeholder="Middle name"
            disabled={disabled}
            aria-invalid={Boolean(middleNameError)}
            aria-describedby={middleNameError ? middleNameErrorId : undefined}
          />

          {middleNameError && (
            <small id={middleNameErrorId} role="alert">
              {middleNameError}
            </small>
          )}
        </div>

        {/* =====================================
            Last Name
            ===================================== */}

        <div
          className={`profile-name-editor-field ${
            lastNameError ? "profile-name-editor-field--error" : ""
          }`}
        >
          <label htmlFor={lastNameId}>
            Last Name
            <span className="profile-name-editor-required">Required</span>
          </label>

          <input
            id={lastNameId}
            name="lastName"
            type="text"
            value={lastName}
            onChange={(event) => handleChange("lastName", event.target.value)}
            autoComplete="family-name"
            placeholder="Last name"
            disabled={disabled}
            aria-invalid={Boolean(lastNameError)}
            aria-describedby={lastNameError ? lastNameErrorId : undefined}
          />

          {lastNameError && (
            <small id={lastNameErrorId} role="alert">
              {lastNameError}
            </small>
          )}
        </div>
      </div>
    </section>
  );
}

export default NameEditor;
