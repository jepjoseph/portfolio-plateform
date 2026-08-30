import { useEffect, useState } from "react";

import RepeatableInformationSection from "./RepeatableInformationSection/RepeatableInformationSection";

import "./PersonalInformationForm.css";

const EMPTY_PROFILE = {
  firstName: "",
  middleName: "",
  lastName: "",
  professionalTitles: [],
  emails: [],
  phones: [],
  websites: [],
  locations: [],
  socialLinks: [],
  profilePictures: [],
};

const POSITION_NAMES = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
];

function getPositionName(index) {
  return POSITION_NAMES[index] || `Title ${index + 1}`;
}

function createId() {
  return crypto.randomUUID();
}

function createTitle(name = "") {
  return {
    id: createId(),
    name,
  };
}

function createInformationItem(
  value = "",
  type = "personal",
  description = "",
) {
  return {
    id: createId(),
    type,
    value,
    description,

    imageUrl: "",
    fileName: "",
    fileType: "",
    fileSize: 0,
  };
}

function createInitialList(currentList, legacyValue, defaultType) {
  if (Array.isArray(currentList) && currentList.length > 0) {
    return currentList.map((item) => ({
      id: item.id || createId(),
      type: item.type || defaultType,
      value: item.value || "",
      description: item.description || "",

      imageUrl: item.imageUrl || item.fileUrl || item.url || "",

      fileName: item.fileName || "",
      fileType: item.fileType || "",
      fileSize: item.fileSize || 0,
    }));
  }

  return [createInformationItem(legacyValue || "", defaultType)];
}

function getInitialFormData(profile) {
  const professionalTitles =
    Array.isArray(profile?.professionalTitles) &&
    profile.professionalTitles.length > 0
      ? profile.professionalTitles.map((title) => ({
          id: title.id || createId(),
          name: title.name || "",
        }))
      : [createTitle(profile?.professionalTitle || "")];

  return {
    ...EMPTY_PROFILE,
    ...profile,

    professionalTitles,

    emails: createInitialList(profile?.emails, profile?.email, "personal"),

    phones: createInitialList(profile?.phones, profile?.phone, "personal"),

    websites: createInitialList(
      profile?.websites,
      profile?.website,
      "portfolio",
    ),

    locations: createInitialList(profile?.locations, profile?.location, "home"),

    socialLinks: createInitialList(
      profile?.socialLinks,
      profile?.linkedin,
      "linkedin",
    ),

    profilePictures: createInitialList(profile?.profilePictures, "", "profile"),
  };
}

function normalizeExternalUrl(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://")
  ) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

function cleanInformationItems(items, category) {
  const usedValues = new Set();

  return items.reduce((cleanedItems, item) => {
    let value = item.value.trim();

    if (!value) {
      return cleanedItems;
    }

    if (category === "websites" || category === "socialLinks") {
      value = normalizeExternalUrl(value);
    }

    const comparisonValue = value.toLowerCase();

    if (usedValues.has(comparisonValue)) {
      return cleanedItems;
    }

    usedValues.add(comparisonValue);

    cleanedItems.push({
      id: item.id,
      type: item.type,
      value,
      description: item.description.trim(),
    });

    return cleanedItems;
  }, []);
}

function cleanProfilePictures(profilePictures) {
  return profilePictures
    .filter((picture) => picture.imageUrl)
    .map((picture) => ({
      id: picture.id,
      type: picture.type,
      imageUrl: picture.imageUrl,
      fileName: picture.fileName,
      fileType: picture.fileType,
      fileSize: picture.fileSize,
      description: picture.description.trim(),
    }));
}

function PersonalInformationForm({ profile, onSave, onCancel }) {
  const [formData, setFormData] = useState(() => getInitialFormData(profile));

  useEffect(() => {
    setFormData(getInitialFormData(profile));
  }, [profile]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  /*
   * =========================================
   * Professional Titles
   * =========================================
   */

  const handleAddTitle = () => {
    setFormData((currentFormData) => ({
      ...currentFormData,

      professionalTitles: [
        ...currentFormData.professionalTitles,
        createTitle(),
      ],
    }));
  };

  const handleTitleChange = (titleId, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,

      professionalTitles: currentFormData.professionalTitles.map((title) =>
        title.id === titleId
          ? {
              ...title,
              name: value,
            }
          : title,
      ),
    }));
  };

  const handleRemoveTitle = (titleId) => {
    setFormData((currentFormData) => {
      const remainingTitles = currentFormData.professionalTitles.filter(
        (title) => title.id !== titleId,
      );

      return {
        ...currentFormData,

        professionalTitles:
          remainingTitles.length > 0 ? remainingTitles : [createTitle()],
      };
    });
  };

  /*
   * =========================================
   * Repeatable Information
   * =========================================
   */

  const handleAddInformation = (category) => {
    const defaultTypes = {
      emails: "personal",
      phones: "personal",
      websites: "portfolio",
      locations: "home",
      socialLinks: "linkedin",
      profilePictures: "profile",
    };

    setFormData((currentFormData) => ({
      ...currentFormData,

      [category]: [
        ...currentFormData[category],

        createInformationItem("", defaultTypes[category]),
      ],
    }));
  };

  const handleInformationChange = (category, itemId, field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,

      [category]: currentFormData[category].map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  };

  const handleRemoveInformation = (category, itemId) => {
    const defaultTypes = {
      emails: "personal",
      phones: "personal",
      websites: "portfolio",
      locations: "home",
      socialLinks: "linkedin",
      profilePictures: "profile",
    };

    setFormData((currentFormData) => {
      const remainingItems = currentFormData[category].filter(
        (item) => item.id !== itemId,
      );

      return {
        ...currentFormData,

        [category]:
          remainingItems.length > 0
            ? remainingItems
            : [createInformationItem("", defaultTypes[category])],
      };
    });
  };

  /*
   * =========================================
   * Submit
   * =========================================
   */

  const handleSubmit = (event) => {
    event.preventDefault();

    const professionalTitles = formData.professionalTitles
      .map((title) => ({
        ...title,
        name: title.name.trim(),
      }))
      .filter((title) => title.name);

    onSave?.({
      firstName: formData.firstName.trim(),
      middleName: formData.middleName.trim(),
      lastName: formData.lastName.trim(),

      professionalTitles,

      emails: cleanInformationItems(formData.emails, "emails"),

      phones: cleanInformationItems(formData.phones, "phones"),

      websites: cleanInformationItems(formData.websites, "websites"),

      locations: cleanInformationItems(formData.locations, "locations"),

      socialLinks: cleanInformationItems(formData.socialLinks, "socialLinks"),

      profilePictures: cleanProfilePictures(formData.profilePictures),
    });
  };

  return (
    <form className="personal-information-form" onSubmit={handleSubmit}>
      <header className="personal-information-form-header">
        <span className="personal-information-form-eyebrow">Personal</span>

        <h3>Edit Personal Information</h3>

        <p>
          Update the reusable information available to your portfolios and
          resumes.
        </p>
      </header>

      {/* =========================================
          Name
          ========================================= */}

      <div className="personal-information-form-grid">
        <div className="personal-information-form-field">
          <label htmlFor="profile-first-name">First Name</label>

          <input
            id="profile-first-name"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            autoComplete="given-name"
            placeholder="First name"
            required
          />
        </div>

        <div className="personal-information-form-field">
          <label htmlFor="profile-middle-name">Middle Name</label>

          <input
            id="profile-middle-name"
            name="middleName"
            type="text"
            value={formData.middleName}
            onChange={handleChange}
            autoComplete="additional-name"
            placeholder="Middle name"
          />
        </div>

        <div className="personal-information-form-field">
          <label htmlFor="profile-last-name">Last Name</label>

          <input
            id="profile-last-name"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            autoComplete="family-name"
            placeholder="Last name"
            required
          />
        </div>
      </div>

      {/* =========================================
          Professional Titles
          ========================================= */}

      <section className="professional-title-form-section">
        <header className="professional-title-form-header">
          <div>
            <span>Career Identity</span>

            <h4>Professional Titles</h4>

            <p>
              Add your professional roles in priority order. The first title
              will be your primary title.
            </p>
          </div>

          <button
            type="button"
            className="professional-title-add-button"
            onClick={handleAddTitle}
          >
            + Add Title
          </button>
        </header>

        <div className="professional-title-form-list">
          {formData.professionalTitles.map((title, index) => (
            <div key={title.id} className="professional-title-form-item">
              <div className="professional-title-form-field">
                <div className="professional-title-form-label">
                  <label htmlFor={`professional-title-${title.id}`}>
                    {getPositionName(index)} Title
                  </label>

                  {index === 0 && <span>Primary</span>}
                </div>

                <input
                  id={`professional-title-${title.id}`}
                  type="text"
                  value={title.name}
                  onChange={(event) =>
                    handleTitleChange(title.id, event.target.value)
                  }
                  placeholder="Computer Engineer"
                  required={index === 0}
                />
              </div>

              <button
                type="button"
                className="professional-title-remove-button"
                onClick={() => handleRemoveTitle(title.id)}
                aria-label={`Remove ${getPositionName(index)} title`}
                title="Remove title"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================
          Contact Information
          ========================================= */}

      {[
        "profilePictures",
        "emails",
        "phones",
        "websites",
        "locations",
        "socialLinks",
      ].map((category) => (
        <RepeatableInformationSection
          key={category}
          category={category}
          items={formData[category]}
          onAdd={handleAddInformation}
          onChange={handleInformationChange}
          onRemove={handleRemoveInformation}
        />
      ))}

      {/* =========================================
          Actions
          ========================================= */}

      <div className="personal-information-form-actions">
        <button
          type="button"
          className="personal-information-cancel-button"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button type="submit" className="personal-information-save-button">
          Save Profile
        </button>
      </div>
    </form>
  );
}

export default PersonalInformationForm;
