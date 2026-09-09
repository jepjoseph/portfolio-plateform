import { useEffect, useMemo, useState } from "react";

import NameEditor from "./NameEditor/NameEditor.jsx";
import ProfilePictureEditor from "./ProfilePictureEditor/ProfilePictureEditor.jsx";
import ProfessionalTitleEditor from "./ProfessionalTitleEditor/ProfessionalTitleEditor.jsx";
import EmailEditor from "./EmailEditor/EmailEditor.jsx";
import PhoneEditor from "./PhoneEditor/PhoneEditor.jsx";
import WebsiteEditor from "./WebsiteEditor/WebsiteEditor.jsx";
import LocationEditor from "./LocationEditor/LocationEditor.jsx";
import SocialLinkEditor from "./SocialLinkEditor/SocialLinkEditor.jsx";
import { getProfileInitials } from "../../../../services/Profile/profileUtils.js";

import {
  CONTACT_INFORMATION_CONFIG,
  PROFILE_COLLECTION_NAMES,
} from "../../../../config/profileConfig.js";

import { normalizeProfile } from "../../../../models/profileModel.js";

import "./ProfileForm.css";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function createId(prefix = "profile-item") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getFieldError(fieldErrors, fieldName) {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return "";
  }

  return fieldErrors[fieldName] || "";
}

/*
 * =========================================
 * Empty Items
 * =========================================
 */

function createProfessionalTitle(order = 0) {
  const timestamp = new Date().toISOString();

  return {
    id: createId("professional-title"),
    name: "",
    order,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createContactItem(category, order = 0) {
  const timestamp = new Date().toISOString();

  const config = CONTACT_INFORMATION_CONFIG[category];

  return {
    id: createId(category),
    type: config?.defaultType || "other",
    value: "",
    description: "",
    order,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createProfilePicture(order = 0) {
  const timestamp = new Date().toISOString();

  return {
    id: createId("profile-picture"),
    type: "",
    imageUrl: "",
    fileName: "",
    fileType: "",
    fileSize: 0,
    useDefaultAvatar: false,
    description: "",
    order,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createEmptyCollectionItem(category, order = 0) {
  if (category === "professionalTitles") {
    return createProfessionalTitle(order);
  }

  if (category === "profilePictures") {
    return createProfilePicture(order);
  }

  return createContactItem(category, order);
}

/*
 * =========================================
 * Initial Form Data
 * =========================================
 */

function ensureEditableCollection(profile, category) {
  const collection = Array.isArray(profile?.[category])
    ? profile[category]
    : [];

  const activeItems = collection.filter((item) => item?.status !== "archived");

  /*
   * Preserve archived items in the form state,
   * but RepeatableInformationSection currently
   * displays only editable active items.
   */

  if (activeItems.length > 0) {
    return collection;
  }

  return [
    ...collection,
    createEmptyCollectionItem(category, collection.length),
  ];
}

function getInitialFormData(profile) {
  const normalizedProfile = normalizeProfile(profile || {});

  return {
    ...normalizedProfile,

    professionalTitles: ensureEditableCollection(
      normalizedProfile,
      "professionalTitles",
    ),

    emails: ensureEditableCollection(normalizedProfile, "emails"),

    phones: ensureEditableCollection(normalizedProfile, "phones"),

    websites: ensureEditableCollection(normalizedProfile, "websites"),

    locations: ensureEditableCollection(normalizedProfile, "locations"),

    socialLinks: ensureEditableCollection(normalizedProfile, "socialLinks"),

    profilePictures: ensureEditableCollection(
      normalizedProfile,
      "profilePictures",
    ),
  };
}

/*
 * =========================================
 * Cleaning
 * =========================================
 */

function normalizeExternalUrl(value) {
  const trimmedValue = getText(value);

  if (!trimmedValue) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

function cleanProfessionalTitles(titles = []) {
  const usedNames = new Set();

  return titles.reduce((cleanedTitles, title) => {
    const name = getText(title?.name);

    /*
     * Preserve archived records even if they are
     * not currently shown by the editor.
     */

    if (title?.status === "archived") {
      cleanedTitles.push(title);
      return cleanedTitles;
    }

    if (!name) {
      return cleanedTitles;
    }

    const comparisonName = name.normalize("NFKC").toLocaleLowerCase();

    if (usedNames.has(comparisonName)) {
      return cleanedTitles;
    }

    usedNames.add(comparisonName);

    cleanedTitles.push({
      ...title,
      name,
      status: title.status || "active",
      updatedAt: new Date().toISOString(),
    });

    return cleanedTitles;
  }, []);
}

function cleanContactItems(items = [], category) {
  const usedValues = new Set();

  return items.reduce((cleanedItems, item) => {
    if (item?.status === "archived") {
      cleanedItems.push(item);
      return cleanedItems;
    }

    let value = getText(item?.value);

    if (!value) {
      return cleanedItems;
    }

    if (category === "websites" || category === "socialLinks") {
      value = normalizeExternalUrl(value);
    }

    const comparisonValue = value.normalize("NFKC").toLocaleLowerCase();

    if (usedValues.has(comparisonValue)) {
      return cleanedItems;
    }

    usedValues.add(comparisonValue);

    cleanedItems.push({
      ...item,
      type:
        item.type ||
        CONTACT_INFORMATION_CONFIG[category]?.defaultType ||
        "other",
      value,
      description: getText(item.description),
      status: item.status || "active",
      updatedAt: new Date().toISOString(),
    });

    return cleanedItems;
  }, []);
}

function cleanProfilePictures(profilePictures = []) {
  const usedPictures = new Set();

  return profilePictures.reduce((cleanedPictures, picture) => {
    if (picture?.status === "archived") {
      cleanedPictures.push(picture);

      return cleanedPictures;
    }

    const imageUrl = getText(
      picture?.imageUrl || picture?.fileUrl || picture?.url,
    );

    const useDefaultAvatar = picture?.useDefaultAvatar === true;

    /*
     * An untouched empty editor row is discarded.
     * A deliberately selected default avatar is saved.
     */

    if (!imageUrl && !useDefaultAvatar) {
      return cleanedPictures;
    }

    const comparisonValue = useDefaultAvatar
      ? `default-avatar-${picture.id}`
      : getText(picture.fileName).toLocaleLowerCase() || imageUrl;

    if (usedPictures.has(comparisonValue)) {
      return cleanedPictures;
    }

    usedPictures.add(comparisonValue);

    cleanedPictures.push({
      ...picture,

      imageUrl: useDefaultAvatar ? "" : imageUrl,

      fileName: useDefaultAvatar ? "" : getText(picture.fileName),

      fileType: useDefaultAvatar ? "" : getText(picture.fileType),

      fileSize: useDefaultAvatar ? 0 : Number(picture.fileSize) || 0,

      useDefaultAvatar,

      description: getText(picture.description),

      status: picture.status || "active",

      updatedAt: new Date().toISOString(),
    });

    return cleanedPictures;
  }, []);
}

function reindexCollection(items = []) {
  return items.map((item, index) => ({
    ...item,
    order: index,
  }));
}

/*
 * =========================================
 * Profile Form
 * =========================================
 */

function ProfileForm({
  profile,
  isSaving = false,
  fieldErrors = {},
  onSave,
  onCancel,
}) {
  const [formData, setFormData] = useState(() => getInitialFormData(profile));

  const [submitError, setSubmitError] = useState("");

  /*
   * =========================================
   * Synchronize Profile
   * =========================================
   */

  useEffect(() => {
    setFormData(getInitialFormData(profile));
    setSubmitError("");
  }, [profile]);

  /*
   * =========================================
   * Active Editable Items
   * =========================================
   */

  const activeCollections = useMemo(() => {
    return PROFILE_COLLECTION_NAMES.reduce((collections, category) => {
      collections[category] = (
        Array.isArray(formData[category]) ? formData[category] : []
      ).filter((item) => item?.status !== "archived");

      return collections;
    }, {});
  }, [formData]);

  /*
   * =========================================
   * Identity
   * =========================================
   */

  const handleIdentityChange = (field, value) => {
    if (!["firstName", "middleName", "lastName"].includes(field)) {
      return;
    }

    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));

    setSubmitError("");
  };

  /*
   * =========================================
   * Profile Picture Editor
   * =========================================
   */

  const handleAddProfilePicture = () => {
    handleAddInformation("profilePictures");
  };

  const handleProfilePictureChange = (pictureId, field, value) => {
    handleInformationChange("profilePictures", pictureId, field, value);
  };

  const handleRemoveProfilePicture = (pictureId) => {
    handleRemoveInformation("profilePictures", pictureId);
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
        createProfessionalTitle(currentFormData.professionalTitles.length),
      ],
    }));

    setSubmitError("");
  };

  const handleTitleChange = (titleId, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,

      professionalTitles: currentFormData.professionalTitles.map((title) =>
        title.id === titleId
          ? {
              ...title,
              name: value,
              updatedAt: new Date().toISOString(),
            }
          : title,
      ),
    }));

    setSubmitError("");
  };

  const handleRemoveTitle = (titleId) => {
    setFormData((currentFormData) => {
      const remainingTitles = currentFormData.professionalTitles.filter(
        (title) => title.id !== titleId,
      );

      const activeTitles = remainingTitles.filter(
        (title) => title.status !== "archived",
      );

      return {
        ...currentFormData,

        professionalTitles:
          activeTitles.length > 0
            ? reindexCollection(remainingTitles)
            : [
                ...remainingTitles,
                createProfessionalTitle(remainingTitles.length),
              ],
      };
    });

    setSubmitError("");
  };

  /*
   * =========================================
   * Repeatable Information
   * =========================================
   */

  const handleAddInformation = (category) => {
    setFormData((currentFormData) => ({
      ...currentFormData,

      [category]: [
        ...currentFormData[category],
        createEmptyCollectionItem(category, currentFormData[category].length),
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
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }));

    setSubmitError("");
  };

  const handleRemoveInformation = (category, itemId) => {
    setFormData((currentFormData) => {
      const remainingItems = currentFormData[category].filter(
        (item) => item.id !== itemId,
      );

      const activeItems = remainingItems.filter(
        (item) => item.status !== "archived",
      );

      return {
        ...currentFormData,

        [category]:
          activeItems.length > 0
            ? reindexCollection(remainingItems)
            : [
                ...remainingItems,
                createEmptyCollectionItem(category, remainingItems.length),
              ],
      };
    });
  };

  /*
   * =========================================
   * Email Editor
   * =========================================
   */

  const handleAddEmail = () => {
    handleAddInformation("emails");
  };

  const handleEmailChange = (emailId, field, value) => {
    handleInformationChange("emails", emailId, field, value);
  };

  const handleRemoveEmail = (emailId) => {
    handleRemoveInformation("emails", emailId);
  };

  /*
   * =========================================
   * Phone Editor
   * =========================================
   */

  const handleAddPhone = () => {
    handleAddInformation("phones");
  };

  const handlePhoneChange = (phoneId, field, value) => {
    handleInformationChange("phones", phoneId, field, value);
  };

  const handleRemovePhone = (phoneId) => {
    handleRemoveInformation("phones", phoneId);
  };

  /*
   * =========================================
   * Website Editor
   * =========================================
   */

  const handleAddWebsite = () => {
    handleAddInformation("websites");
  };

  const handleWebsiteChange = (websiteId, field, value) => {
    handleInformationChange("websites", websiteId, field, value);
  };

  const handleRemoveWebsite = (websiteId) => {
    handleRemoveInformation("websites", websiteId);
  };

  /*
   * =========================================
   * Location Editor
   * =========================================
   */

  const handleAddLocation = () => {
    handleAddInformation("locations");
  };

  const handleLocationChange = (locationId, field, value) => {
    handleInformationChange("locations", locationId, field, value);
  };

  const handleRemoveLocation = (locationId) => {
    handleRemoveInformation("locations", locationId);
  };

  /*
   * =========================================
   * Social Link Editor
   * =========================================
   */

  const handleAddSocialLink = () => {
    handleAddInformation("socialLinks");
  };

  const handleSocialLinkChange = (socialLinkId, field, value) => {
    handleInformationChange("socialLinks", socialLinkId, field, value);
  };

  const handleRemoveSocialLink = (socialLinkId) => {
    handleRemoveInformation("socialLinks", socialLinkId);
  };

  /*
   * =========================================
   * Submit
   * =========================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setSubmitError("");

    const updatedProfile = {
      ...formData,

      firstName: getText(formData.firstName),
      middleName: getText(formData.middleName),
      lastName: getText(formData.lastName),

      professionalTitles: reindexCollection(
        cleanProfessionalTitles(formData.professionalTitles),
      ),

      emails: reindexCollection(cleanContactItems(formData.emails, "emails")),

      phones: reindexCollection(cleanContactItems(formData.phones, "phones")),

      websites: reindexCollection(
        cleanContactItems(formData.websites, "websites"),
      ),

      locations: reindexCollection(
        cleanContactItems(formData.locations, "locations"),
      ),

      socialLinks: reindexCollection(
        cleanContactItems(formData.socialLinks, "socialLinks"),
      ),

      profilePictures: reindexCollection(
        cleanProfilePictures(formData.profilePictures),
      ),
    };

    try {
      await onSave?.(updatedProfile);
    } catch (error) {
      setSubmitError(
        error?.publicMessage ||
          error?.message ||
          "The Profile could not be saved.",
      );
    }
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit} noValidate>
      <header className="profile-form-header">
        <div>
          <span>Profile Editor</span>

          <h2>Edit Profile Information</h2>

          <p>
            Update the reusable identity, professional, contact, and media
            information available to your portfolios and résumés.
          </p>
        </div>

        <span className="profile-form-status">
          {isSaving ? "Saving..." : "Editing"}
        </span>
      </header>

      {/* =====================================
          Name Editor
          ===================================== */}

      <NameEditor
        firstName={formData.firstName}
        middleName={formData.middleName}
        lastName={formData.lastName}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onChange={handleIdentityChange}
      />

      <ProfilePictureEditor
        profilePictures={activeCollections.profilePictures}
        defaultAvatarText={getProfileInitials(formData, "P")}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onAdd={handleAddProfilePicture}
        onChange={handleProfilePictureChange}
        onRemove={handleRemoveProfilePicture}
      />

      {/* =====================================
          Professional Title Editor
          ===================================== */}
      <ProfessionalTitleEditor
        titles={activeCollections.professionalTitles}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onAdd={handleAddTitle}
        onChange={handleTitleChange}
        onRemove={handleRemoveTitle}
      />

      {/* =====================================
          Email Editor
          ===================================== */}
      <EmailEditor
        emails={activeCollections.emails}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onAdd={handleAddEmail}
        onChange={handleEmailChange}
        onRemove={handleRemoveEmail}
      />
      {/* =====================================
          Phone Editor
          ===================================== */}
      <PhoneEditor
        phones={activeCollections.phones}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onAdd={handleAddPhone}
        onChange={handlePhoneChange}
        onRemove={handleRemovePhone}
      />
      {/* =====================================
          Website Editor
          ===================================== */}
      <WebsiteEditor
        websites={activeCollections.websites}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onAdd={handleAddWebsite}
        onChange={handleWebsiteChange}
        onRemove={handleRemoveWebsite}
      />
      {/* =====================================
          Location Editor
          ===================================== */}
      <LocationEditor
        locations={activeCollections.locations}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onAdd={handleAddLocation}
        onChange={handleLocationChange}
        onRemove={handleRemoveLocation}
      />
      {/* =====================================
          Social Link Editor
          ===================================== */}
      <SocialLinkEditor
        socialLinks={activeCollections.socialLinks}
        fieldErrors={fieldErrors}
        disabled={isSaving}
        onAdd={handleAddSocialLink}
        onChange={handleSocialLinkChange}
        onRemove={handleRemoveSocialLink}
      />

      {/* =====================================
          Submit Error
          ===================================== */}

      {submitError && (
        <div className="profile-form-message profile-form-message--error">
          <strong>Profile could not be saved</strong>
          <p>{submitError}</p>
        </div>
      )}

      {/* =====================================
          Actions
          ===================================== */}

      <footer className="profile-form-actions">
        <button
          type="button"
          className="profile-form-cancel-button"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="profile-form-save-button"
          disabled={isSaving}
        >
          {isSaving ? "Saving Profile..." : "Save Profile"}
        </button>
      </footer>
    </form>
  );
}

export default ProfileForm;
