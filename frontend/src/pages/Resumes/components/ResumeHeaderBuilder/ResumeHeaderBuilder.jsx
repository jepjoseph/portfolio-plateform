import { useId, useMemo } from "react";

import { getProfileSelectionOptions } from "../../../../services/Portfolio/profileSelectionUtils";

import "./ResumeHeaderBuilder.css";

const EMPTY_HEADER_SELECTIONS = {
  nameOptionId: "",
  professionalTitleId: "",
  emailId: "",
  phoneId: "",
  locationId: "",
  linkedinId: "",
  websiteId: "",
  pictureId: "",
};

function getOptionById(options, optionId) {
  if (!optionId) {
    return null;
  }

  return options.find((option) => option.id === optionId) || null;
}

function getPictureUrl(picture) {
  return picture?.imageUrl || picture?.fileUrl || picture?.url || "";
}

function ResumeHeaderBuilder({
  profile = {},
  selections = EMPTY_HEADER_SELECTIONS,
  onChange,
}) {
  const sectionTitleId = useId();

  const headerSelections = {
    ...EMPTY_HEADER_SELECTIONS,
    ...selections,
  };

  /*
   * =========================================
   * Available Profile Information
   * =========================================
   */

  const options = useMemo(() => {
    const socialOptions = getProfileSelectionOptions(profile, "socialLinks");

    return {
      names: getProfileSelectionOptions(profile, "name"),

      professionalTitles: getProfileSelectionOptions(
        profile,
        "professionalTitles",
      ),

      emails: getProfileSelectionOptions(profile, "emails"),

      phones: getProfileSelectionOptions(profile, "phones"),

      locations: getProfileSelectionOptions(profile, "locations"),

      websites: getProfileSelectionOptions(profile, "websites"),

      linkedin: socialOptions.filter((option) => {
        const selectedSocialLink = profile?.socialLinks?.find(
          (socialLink) => socialLink.id === option.id,
        );

        return selectedSocialLink?.type === "linkedin";
      }),

      pictures: getProfileSelectionOptions(profile, "profilePictures"),
    };
  }, [profile]);

  /*
   * =========================================
   * Selected Preview Values
   * =========================================
   */

  const selectedValues = useMemo(
    () => ({
      name: getOptionById(options.names, headerSelections.nameOptionId),

      professionalTitle: getOptionById(
        options.professionalTitles,
        headerSelections.professionalTitleId,
      ),

      email: getOptionById(options.emails, headerSelections.emailId),

      phone: getOptionById(options.phones, headerSelections.phoneId),

      location: getOptionById(options.locations, headerSelections.locationId),

      linkedin: getOptionById(options.linkedin, headerSelections.linkedinId),

      website: getOptionById(options.websites, headerSelections.websiteId),

      picture: getOptionById(options.pictures, headerSelections.pictureId),
    }),
    [options, headerSelections],
  );

  /*
   * =========================================
   * Selection Change
   * =========================================
   */

  const handleSelectionChange = (fieldName, value) => {
    onChange?.((currentSelections = {}) => ({
      ...EMPTY_HEADER_SELECTIONS,
      ...currentSelections,
      [fieldName]: value,
    }));
  };

  const handleClearHeader = () => {
    onChange?.({
      ...EMPTY_HEADER_SELECTIONS,
    });
  };

  const selectedContactItems = [
    selectedValues.email,
    selectedValues.phone,
    selectedValues.location,
    selectedValues.linkedin,
    selectedValues.website,
  ].filter(Boolean);

  const selectedCount = Object.values(headerSelections).filter(Boolean).length;

  return (
    <section className="resume-header-builder" aria-labelledby={sectionTitleId}>
      {/* =========================================
          Header
          ========================================= */}

      <header className="resume-header-builder-header">
        <div>
          <span>Resume Header</span>

          <h4 id={sectionTitleId}>Header Information</h4>

          <p>
            Select reusable profile information for this resume. Changes made
            here do not modify your main profile.
          </p>
        </div>

        <div className="resume-header-builder-header-actions">
          <span className="resume-header-builder-count">
            {selectedCount} Selected
          </span>

          {selectedCount > 0 && (
            <button
              type="button"
              className="resume-header-builder-clear"
              onClick={handleClearHeader}
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* =========================================
          Required Identity
          ========================================= */}

      <section className="resume-header-builder-group">
        <header className="resume-header-builder-group-header">
          <div>
            <span>Identity</span>

            <h5>Name and Professional Title</h5>
          </div>

          <span aria-hidden="true">01</span>
        </header>

        <div className="resume-header-builder-fields">
          <ResumeHeaderField
            id="resume-header-name"
            label="Name Format"
            value={headerSelections.nameOptionId}
            options={options.names}
            placeholder="Choose name format"
            emptyMessage="No name information available"
            required
            onChange={(value) => handleSelectionChange("nameOptionId", value)}
          />

          <ResumeHeaderField
            id="resume-header-title"
            label="Professional Title"
            value={headerSelections.professionalTitleId}
            options={options.professionalTitles}
            placeholder="Choose professional title"
            emptyMessage="No professional titles available"
            required
            onChange={(value) =>
              handleSelectionChange("professionalTitleId", value)
            }
          />
        </div>
      </section>

      {/* =========================================
          Contact Information
          ========================================= */}

      <section className="resume-header-builder-group">
        <header className="resume-header-builder-group-header">
          <div>
            <span>Contact</span>

            <h5>Contact Information</h5>
          </div>

          <span aria-hidden="true">02</span>
        </header>

        <div className="resume-header-builder-fields resume-header-builder-fields--contacts">
          <ResumeHeaderField
            id="resume-header-email"
            label="Email"
            value={headerSelections.emailId}
            options={options.emails}
            placeholder="Choose email"
            emptyMessage="No email addresses available"
            required
            onChange={(value) => handleSelectionChange("emailId", value)}
          />

          <ResumeHeaderField
            id="resume-header-phone"
            label="Phone"
            value={headerSelections.phoneId}
            options={options.phones}
            placeholder="Choose phone"
            emptyMessage="No phone numbers available"
            onChange={(value) => handleSelectionChange("phoneId", value)}
          />

          <ResumeHeaderField
            id="resume-header-location"
            label="Location"
            value={headerSelections.locationId}
            options={options.locations}
            placeholder="Choose location"
            emptyMessage="No locations available"
            onChange={(value) => handleSelectionChange("locationId", value)}
          />

          <ResumeHeaderField
            id="resume-header-linkedin"
            label="LinkedIn"
            value={headerSelections.linkedinId}
            options={options.linkedin}
            placeholder="Choose LinkedIn profile"
            emptyMessage="No LinkedIn profile available"
            onChange={(value) => handleSelectionChange("linkedinId", value)}
          />

          <ResumeHeaderField
            id="resume-header-website"
            label="Website"
            value={headerSelections.websiteId}
            options={options.websites}
            placeholder="Choose website"
            emptyMessage="No websites available"
            onChange={(value) => handleSelectionChange("websiteId", value)}
          />
        </div>
      </section>

      {/* =========================================
          Optional Picture
          ========================================= */}

      <section className="resume-header-builder-group">
        <header className="resume-header-builder-group-header">
          <div>
            <span>Optional Media</span>

            <h5>Resume Picture</h5>

            <p>
              Use this only for a template or application where a picture is
              appropriate.
            </p>
          </div>

          <span aria-hidden="true">03</span>
        </header>

        <div className="resume-header-builder-picture-row">
          <ResumeHeaderField
            id="resume-header-picture"
            label="Picture"
            value={headerSelections.pictureId}
            options={options.pictures}
            placeholder="No picture"
            emptyMessage="No uploaded pictures available"
            onChange={(value) => handleSelectionChange("pictureId", value)}
          />

          {selectedValues.picture?.imageUrl && (
            <div className="resume-header-builder-picture-preview">
              <img
                src={selectedValues.picture.imageUrl}
                alt={
                  selectedValues.picture.label ||
                  selectedValues.picture.displayValue ||
                  "Selected resume picture"
                }
              />

              <div>
                <span>Selected Picture</span>

                <strong>{selectedValues.picture.displayValue}</strong>

                {selectedValues.picture.label &&
                  selectedValues.picture.label !==
                    selectedValues.picture.displayValue && (
                    <small>{selectedValues.picture.label}</small>
                  )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          Header Preview
          ========================================= */}

      <section className="resume-header-preview">
        <header className="resume-header-preview-label">
          <span>Live Preview</span>

          <small>Resume header only</small>
        </header>

        <div className="resume-header-preview-content">
          {selectedValues.picture?.imageUrl && (
            <div className="resume-header-preview-picture">
              <img
                src={selectedValues.picture.imageUrl}
                alt=""
                aria-hidden="true"
              />
            </div>
          )}

          <div className="resume-header-preview-identity">
            <h3>{selectedValues.name?.displayValue || "Your Name"}</h3>

            <p>
              {selectedValues.professionalTitle?.displayValue ||
                "Professional Title"}
            </p>

            {selectedContactItems.length > 0 && (
              <div className="resume-header-preview-contact">
                {selectedContactItems.map((item) => (
                  <span key={item.id}>{item.displayValue}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

/*
 * =========================================
 * Reusable Selection Field
 * =========================================
 */

function ResumeHeaderField({
  id,
  label,
  value,
  options = [],
  placeholder,
  emptyMessage,
  required = false,
  onChange,
}) {
  const hasOptions = options.length > 0;

  return (
    <div className="resume-header-builder-field">
      <label htmlFor={id}>
        {label}

        <span
          className={
            required
              ? "resume-header-field-required"
              : "resume-header-field-optional"
          }
        >
          {required ? "Required" : "Optional"}
        </span>
      </label>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!hasOptions}
        required={required}
      >
        <option value="">{hasOptions ? placeholder : emptyMessage}</option>

        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}

            {option.displayValue && option.displayValue !== option.label
              ? ` — ${option.displayValue}`
              : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ResumeHeaderBuilder;
