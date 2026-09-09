import {
  CONTACT_INFORMATION_CONFIG,
  isValidContactType,
  isValidProfileItemStatus,
  isValidProfileStatus,
  PROFILE_FIELD_LIMITS,
  PROFILE_PICTURE_UPLOAD_CONFIG,
} from "../../config/profileConfig.js";

import {
  getProfileFullName,
  normalizeProfileExternalUrl,
} from "../../models/profileModel.js";

/*
 * =========================================
 * Basic Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function getObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function normalizeComparisonValue(value) {
  return getText(value)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrlForComparison(value) {
  return normalizeComparisonValue(value)
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

function normalizePhoneForComparison(value) {
  return getText(value).replace(/[^\d]/g, "");
}

function createIssue(field, message, code = "invalid") {
  return {
    field,
    message,
    code,
  };
}

/*
 * =========================================
 * Validation Collector
 * =========================================
 */

function createValidationCollector() {
  const errors = [];
  const warnings = [];
  const conflicts = [];

  return {
    errors,
    warnings,
    conflicts,

    addError(field, message, code = "invalid") {
      errors.push(createIssue(field, message, code));
    },

    addWarning(field, message, code = "warning") {
      warnings.push(createIssue(field, message, code));
    },

    addConflict(field, message, conflictingItem, code = "duplicate") {
      const conflict = {
        ...createIssue(field, message, code),

        conflictingItemId: conflictingItem?.id || "",

        conflictingValue: conflictingItem?.value || conflictingItem?.name || "",
      };

      conflicts.push(conflict);
      errors.push(conflict);
    },
  };
}

/*
 * =========================================
 * Text Length
 * =========================================
 */

function validateTextLength(collector, field, value, maximumLength, label) {
  if (typeof value !== "string" || !Number.isFinite(Number(maximumLength))) {
    return;
  }

  if (value.trim().length > Number(maximumLength)) {
    collector.addError(
      field,
      `${label} cannot exceed ${maximumLength} characters.`,
      "too_long",
    );
  }
}

/*
 * =========================================
 * Identity Validation
 * =========================================
 */

function validatePersonName(
  collector,
  field,
  value,
  label,
  maximumLength,
  required,
) {
  const name = getText(value);

  if (!name) {
    if (required) {
      collector.addError(
        field,
        `Enter your ${label.toLowerCase()}.`,
        "required",
      );
    }

    return;
  }

  validateTextLength(collector, field, value, maximumLength, label);

  if (name.length < 2) {
    collector.addError(
      field,
      `${label} must contain at least two characters.`,
      "too_short",
    );
  }

  /*
   * Supports letters from different languages,
   * spaces, apostrophes, periods and hyphens.
   */

  if (!/^[\p{L}\p{M} .'-]+$/u.test(name)) {
    collector.addError(
      field,
      `${label} contains unsupported characters.`,
      "invalid_name",
    );
  }

  if (!/\p{L}/u.test(name)) {
    collector.addError(
      field,
      `${label} must contain at least one letter.`,
      "invalid_name",
    );
  }
}

function validateIdentity(collector, profile) {
  validatePersonName(
    collector,
    "firstName",
    profile.firstName,
    "First name",
    PROFILE_FIELD_LIMITS.firstName,
    true,
  );

  validatePersonName(
    collector,
    "middleName",
    profile.middleName,
    "Middle name",
    PROFILE_FIELD_LIMITS.middleName,
    false,
  );

  validatePersonName(
    collector,
    "lastName",
    profile.lastName,
    "Last name",
    PROFILE_FIELD_LIMITS.lastName,
    true,
  );
}

/*
 * =========================================
 * Collection Limits
 * =========================================
 */

function validateCollectionLimit(
  collector,
  profile,
  category,
  maximumItems,
  label,
) {
  const collection = profile[category];

  if (collection !== undefined && !Array.isArray(collection)) {
    collector.addError(
      category,
      `${label} must be stored as a list.`,
      "invalid_collection",
    );

    return;
  }

  if (getArray(collection).length > maximumItems) {
    collector.addError(
      category,
      `Add no more than ${maximumItems} ${label.toLowerCase()}.`,
      "too_many_items",
    );
  }
}

function validateCollectionLimits(collector, profile) {
  validateCollectionLimit(
    collector,
    profile,
    "professionalTitles",
    PROFILE_FIELD_LIMITS.maximumProfessionalTitles,
    "Professional titles",
  );

  validateCollectionLimit(
    collector,
    profile,
    "emails",
    PROFILE_FIELD_LIMITS.maximumEmails,
    "Email addresses",
  );

  validateCollectionLimit(
    collector,
    profile,
    "phones",
    PROFILE_FIELD_LIMITS.maximumPhones,
    "Phone numbers",
  );

  validateCollectionLimit(
    collector,
    profile,
    "websites",
    PROFILE_FIELD_LIMITS.maximumWebsites,
    "Websites",
  );

  validateCollectionLimit(
    collector,
    profile,
    "locations",
    PROFILE_FIELD_LIMITS.maximumLocations,
    "Locations",
  );

  validateCollectionLimit(
    collector,
    profile,
    "socialLinks",
    PROFILE_FIELD_LIMITS.maximumSocialLinks,
    "Social links",
  );

  validateCollectionLimit(
    collector,
    profile,
    "profilePictures",
    PROFILE_FIELD_LIMITS.maximumProfilePictures,
    "Profile pictures",
  );
}

/*
 * =========================================
 * Collection IDs
 * =========================================
 */

function validateCollectionIds(collector, collection, category) {
  const seenIds = new Set();

  getArray(collection).forEach((item, index) => {
    const itemId = getText(item?.id);

    if (!itemId) {
      collector.addError(
        `${category}.${index}.id`,
        "This profile item is missing an identifier.",
        "missing_id",
      );

      return;
    }

    if (seenIds.has(itemId)) {
      collector.addError(
        `${category}.${index}.id`,
        "This profile item identifier is duplicated.",
        "duplicate_id",
      );

      return;
    }

    seenIds.add(itemId);
  });
}

/*
 * =========================================
 * Professional Titles
 * =========================================
 */

function validateProfessionalTitles(collector, profile) {
  const titles = getArray(profile.professionalTitles);

  const seenTitles = new Map();

  titles.forEach((titleValue, index) => {
    const title = getObject(titleValue);

    const fieldPrefix = `professionalTitles.${index}`;

    const name = getText(title.name);

    if (!name) {
      collector.addError(
        `${fieldPrefix}.name`,
        "Enter a professional title.",
        "required",
      );

      return;
    }

    validateTextLength(
      collector,
      `${fieldPrefix}.name`,
      title.name,
      PROFILE_FIELD_LIMITS.professionalTitle,
      "Professional title",
    );

    validateTextLength(
      collector,
      `${fieldPrefix}.description`,
      title.description,
      PROFILE_FIELD_LIMITS.description,
      "Professional title description",
    );

    if (title.status && !isValidProfileItemStatus(title.status)) {
      collector.addError(
        `${fieldPrefix}.status`,
        "Select a valid professional-title status.",
        "invalid_option",
      );
    }

    const comparisonName = normalizeComparisonValue(name);

    if (seenTitles.has(comparisonName)) {
      collector.addConflict(
        `${fieldPrefix}.name`,
        `"${name}" has already been added as a professional title.`,
        titles[seenTitles.get(comparisonName)],
        "duplicate_professional_title",
      );

      return;
    }

    seenTitles.set(comparisonName, index);
  });

  validateCollectionIds(collector, titles, "professionalTitles");
}

/*
 * =========================================
 * Email Validation
 * =========================================
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateEmailValue(collector, field, value) {
  if (!EMAIL_PATTERN.test(value)) {
    collector.addError(field, "Enter a valid email address.", "invalid_email");
  }
}

/*
 * =========================================
 * Phone Validation
 * =========================================
 */

function validatePhoneValue(collector, field, value) {
  const digits = value.replace(/[^\d]/g, "");

  if (digits.length < 7) {
    collector.addError(
      field,
      "Enter a phone number containing at least seven digits.",
      "invalid_phone",
    );
  }

  if (digits.length > 20) {
    collector.addError(
      field,
      "The phone number contains too many digits.",
      "invalid_phone",
    );
  }

  if (!/^[\d\s()+\-./]+$/.test(value)) {
    collector.addError(
      field,
      "The phone number contains unsupported characters.",
      "invalid_phone",
    );
  }
}

/*
 * =========================================
 * URL Validation
 * =========================================
 */

function validateExternalUrl(collector, field, value, label) {
  let parsedUrl;

  try {
    parsedUrl = new URL(normalizeProfileExternalUrl(value));
  } catch {
    collector.addError(
      field,
      `Enter a valid ${label.toLowerCase()} URL.`,
      "invalid_url",
    );

    return;
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    collector.addError(
      field,
      `${label} must use HTTP or HTTPS.`,
      "invalid_protocol",
    );
  }

  if (!parsedUrl.hostname) {
    collector.addError(
      field,
      `Enter a valid ${label.toLowerCase()} domain.`,
      "invalid_url",
    );
  }
}

/*
 * =========================================
 * Contact Collections
 * =========================================
 */

function getContactComparisonValue(category, value) {
  if (category === "phones") {
    return normalizePhoneForComparison(value);
  }

  if (category === "websites" || category === "socialLinks") {
    return normalizeUrlForComparison(value);
  }

  return normalizeComparisonValue(value);
}

function validateContactCollection(collector, profile, category) {
  const config = CONTACT_INFORMATION_CONFIG[category];

  const items = getArray(profile[category]);

  const seenValues = new Map();

  items.forEach((itemValue, index) => {
    const item = getObject(itemValue);

    const fieldPrefix = `${category}.${index}`;

    const value = getText(item.value);

    if (!value) {
      collector.addError(
        `${fieldPrefix}.value`,
        `Enter a ${config.singular.toLowerCase()}.`,
        "required",
      );

      return;
    }

    validateTextLength(
      collector,
      `${fieldPrefix}.value`,
      item.value,
      config.maximumValueLength,
      config.singular,
    );

    validateTextLength(
      collector,
      `${fieldPrefix}.description`,
      item.description,
      PROFILE_FIELD_LIMITS.description,
      `${config.singular} description`,
    );

    if (!isValidContactType(category, item.type)) {
      collector.addError(
        `${fieldPrefix}.type`,
        `Select a valid ${config.singular.toLowerCase()} type.`,
        "invalid_option",
      );
    }

    if (item.status && !isValidProfileItemStatus(item.status)) {
      collector.addError(
        `${fieldPrefix}.status`,
        `Select a valid ${config.singular.toLowerCase()} status.`,
        "invalid_option",
      );
    }

    if (category === "emails") {
      validateEmailValue(collector, `${fieldPrefix}.value`, value);
    }

    if (category === "phones") {
      validatePhoneValue(collector, `${fieldPrefix}.value`, value);
    }

    if (category === "websites") {
      validateExternalUrl(collector, `${fieldPrefix}.value`, value, "Website");
    }

    if (category === "socialLinks") {
      validateExternalUrl(
        collector,
        `${fieldPrefix}.value`,
        value,
        "Social profile",
      );
    }

    const comparisonValue = getContactComparisonValue(category, value);

    if (seenValues.has(comparisonValue)) {
      collector.addConflict(
        `${fieldPrefix}.value`,
        `This ${config.singular.toLowerCase()} has already been added.`,
        items[seenValues.get(comparisonValue)],
        `duplicate_${category}`,
      );

      return;
    }

    seenValues.set(comparisonValue, index);
  });

  validateCollectionIds(collector, items, category);
}

/*
 * =========================================
 * Picture Helpers
 * =========================================
 */

function isDataImageUrl(value) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value);
}

function isRemoteImageUrl(value) {
  try {
    const parsedUrl = new URL(value);

    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function getMaximumLocalPictureSize() {
  return (
    Number(PROFILE_PICTURE_UPLOAD_CONFIG.maximumLocalFileSize) ||
    Number(PROFILE_PICTURE_UPLOAD_CONFIG.maxFileSize) ||
    0
  );
}

function getMaximumProductionPictureSize() {
  return (
    Number(PROFILE_PICTURE_UPLOAD_CONFIG.maximumProductionFileSize) ||
    Number(PROFILE_PICTURE_UPLOAD_CONFIG.maxFileSize) ||
    0
  );
}

function validatePictureDimension(collector, field, value, label) {
  if (value === "" || value === null || value === undefined) {
    return;
  }

  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0 ||
    !Number.isInteger(numericValue)
  ) {
    collector.addError(
      field,
      `${label} must be a positive whole number.`,
      "invalid_dimension",
    );
  }
}

/*
 * =========================================
 * Picture Validation
 * =========================================
 */

function validateProfilePictures(collector, profile) {
  const pictures = getArray(profile.profilePictures);

  pictures.forEach((pictureValue, index) => {
    const picture = getObject(pictureValue);

    const fieldPrefix = `profilePictures.${index}`;

    const imageUrl = getText(
      picture.imageUrl || picture.fileUrl || picture.url,
    );

    const useDefaultAvatar = picture.useDefaultAvatar === true;

    /*
     * =========================================
     * Default Avatar Type
     * =========================================
     */

    if (
      picture.useDefaultAvatar !== undefined &&
      typeof picture.useDefaultAvatar !== "boolean"
    ) {
      collector.addError(
        `${fieldPrefix}.useDefaultAvatar`,
        "Default-avatar selection must be true or false.",
        "invalid_boolean",
      );
    }

    /*
     * A saved picture must use one source:
     *
     * 1. An uploaded/remote image.
     * 2. The generated default avatar.
     */

    if (!imageUrl && !useDefaultAvatar) {
      collector.addError(
        `${fieldPrefix}.imageUrl`,
        "Select a picture or choose the default avatar.",
        "picture_required",
      );
    }

    /*
     * An image and default avatar cannot both be active.
     */

    if (imageUrl && useDefaultAvatar) {
      collector.addError(
        `${fieldPrefix}.useDefaultAvatar`,
        "A picture cannot use an uploaded image and the default avatar at the same time.",
        "conflicting_picture_source",
      );
    }

    /*
     * =========================================
     * Uploaded Image Validation
     * =========================================
     *
     * File URL and metadata validation must only run
     * when an actual image is present.
     */

    if (imageUrl) {
      if (!isDataImageUrl(imageUrl) && !isRemoteImageUrl(imageUrl)) {
        collector.addError(
          `${fieldPrefix}.imageUrl`,
          "The picture must contain a valid uploaded image or remote image URL.",
          "invalid_image_url",
        );
      }

      validateTextLength(
        collector,
        `${fieldPrefix}.imageUrl`,
        imageUrl,
        PROFILE_FIELD_LIMITS.imageUrl,
        "Image URL",
      );

      validateTextLength(
        collector,
        `${fieldPrefix}.blobName`,
        picture.blobName,
        PROFILE_FIELD_LIMITS.fileName,
        "Picture storage name",
      );

      validateTextLength(
        collector,
        `${fieldPrefix}.fileName`,
        picture.fileName,
        PROFILE_FIELD_LIMITS.fileName,
        "Picture filename",
      );

      validateTextLength(
        collector,
        `${fieldPrefix}.fileType`,
        picture.fileType,
        PROFILE_FIELD_LIMITS.fileType,
        "Picture file type",
      );

      const fileType = getText(picture.fileType);

      if (
        fileType &&
        !PROFILE_PICTURE_UPLOAD_CONFIG.allowedFileTypes.includes(fileType)
      ) {
        collector.addError(
          `${fieldPrefix}.fileType`,
          "Upload a GIF, JPG, JPEG, PNG, WEBP, or AVIF image.",
          "invalid_file_type",
        );
      }

      const fileSize = picture.fileSize;

      if (fileSize !== "" && fileSize !== null && fileSize !== undefined) {
        const numericFileSize = Number(fileSize);

        if (!Number.isFinite(numericFileSize) || numericFileSize < 0) {
          collector.addError(
            `${fieldPrefix}.fileSize`,
            "The picture file size is invalid.",
            "invalid_file_size",
          );
        } else {
          const maximumLocalFileSize = getMaximumLocalPictureSize();

          const maximumProductionFileSize = getMaximumProductionPictureSize();

          if (
            isDataImageUrl(imageUrl) &&
            maximumLocalFileSize > 0 &&
            numericFileSize > maximumLocalFileSize
          ) {
            collector.addError(
              `${fieldPrefix}.fileSize`,
              `Local pictures must be ${Math.round(
                maximumLocalFileSize / 1024 / 1024,
              )} MB or smaller.`,
              "file_too_large",
            );
          }

          if (
            !isDataImageUrl(imageUrl) &&
            maximumProductionFileSize > 0 &&
            numericFileSize > maximumProductionFileSize
          ) {
            collector.addError(
              `${fieldPrefix}.fileSize`,
              `Pictures must be ${Math.round(
                maximumProductionFileSize / 1024 / 1024,
              )} MB or smaller.`,
              "file_too_large",
            );
          }
        }
      }

      validatePictureDimension(
        collector,
        `${fieldPrefix}.width`,
        picture.width,
        "Picture width",
      );

      validatePictureDimension(
        collector,
        `${fieldPrefix}.height`,
        picture.height,
        "Picture height",
      );
    }

    /*
     * =========================================
     * Default Avatar Metadata
     * =========================================
     *
     * A normalized default avatar should not retain
     * uploaded-file metadata.
     */

    if (useDefaultAvatar) {
      const hasUploadedFileMetadata = Boolean(
        getText(picture.blobName) ||
        getText(picture.fileName) ||
        getText(picture.fileType) ||
        Number(picture.fileSize) > 0 ||
        (picture.width !== null &&
          picture.width !== undefined &&
          picture.width !== "") ||
        (picture.height !== null &&
          picture.height !== undefined &&
          picture.height !== ""),
      );

      if (hasUploadedFileMetadata) {
        collector.addError(
          `${fieldPrefix}.useDefaultAvatar`,
          "Remove uploaded-file metadata before using the default avatar.",
          "default_avatar_has_file_metadata",
        );
      }
    }

    /*
     * =========================================
     * Shared Picture Information
     * =========================================
     */

    validateTextLength(
      collector,
      `${fieldPrefix}.description`,
      picture.description,
      PROFILE_FIELD_LIMITS.description,
      "Picture description",
    );

    if (picture.status && !isValidProfileItemStatus(picture.status)) {
      collector.addError(
        `${fieldPrefix}.status`,
        "Select a valid picture status.",
        "invalid_option",
      );
    }

    if (!getText(picture.description)) {
      collector.addWarning(
        `${fieldPrefix}.description`,
        useDefaultAvatar
          ? "Consider adding a description for the default avatar."
          : "Add a picture description for accessibility.",
        "missing_alt_description",
      );
    }
  });

  validateCollectionIds(collector, pictures, "profilePictures");
}

/*
 * =========================================
 * Primary Preferences
 * =========================================
 */

const PRIMARY_PREFERENCE_CONFIG = [
  {
    preference: "primaryProfessionalTitleId",
    collection: "professionalTitles",
    label: "professional title",
  },
  {
    preference: "primaryEmailId",
    collection: "emails",
    label: "email",
  },
  {
    preference: "primaryPhoneId",
    collection: "phones",
    label: "phone",
  },
  {
    preference: "primaryWebsiteId",
    collection: "websites",
    label: "website",
  },
  {
    preference: "primaryLocationId",
    collection: "locations",
    label: "location",
  },
  {
    preference: "primarySocialLinkId",
    collection: "socialLinks",
    label: "social link",
  },
  {
    preference: "primaryProfilePictureId",
    collection: "profilePictures",
    label: "profile picture",
  },
];

function validatePrimaryPreferences(collector, profile) {
  const preferences = getObject(profile.preferences);

  PRIMARY_PREFERENCE_CONFIG.forEach(({ preference, collection, label }) => {
    const collectionItems = getArray(profile[collection]);

    const activeItems = collectionItems.filter(
      (item) => item?.status !== "archived",
    );

    const primaryId = getText(preferences[preference]);

    if (!primaryId) {
      if (activeItems.length > 0) {
        collector.addWarning(
          `preferences.${preference}`,
          `No primary ${label} is selected. The first active item will be used.`,
          "missing_primary_item",
        );
      }

      return;
    }

    const matchingItem = collectionItems.find((item) => item?.id === primaryId);

    if (!matchingItem) {
      collector.addError(
        `preferences.${preference}`,
        `The selected primary ${label} does not exist.`,
        "invalid_primary_id",
      );

      return;
    }

    if (matchingItem.status === "archived") {
      collector.addError(
        `preferences.${preference}`,
        `An archived ${label} cannot be the primary item.`,
        "archived_primary_item",
      );
    }
  });
}

/*
 * =========================================
 * Profile Configuration
 * =========================================
 */

function validateProfileConfiguration(collector, profile) {
  if (profile.status && !isValidProfileStatus(profile.status)) {
    collector.addError(
      "status",
      "Select a valid profile status.",
      "invalid_option",
    );
  }

  if (
    profile.visibility !== undefined &&
    (!profile.visibility ||
      typeof profile.visibility !== "object" ||
      Array.isArray(profile.visibility))
  ) {
    collector.addError(
      "visibility",
      "Profile visibility has an invalid format.",
      "invalid_object",
    );
  }

  if (
    profile.visibility?.isPublic !== undefined &&
    typeof profile.visibility.isPublic !== "boolean"
  ) {
    collector.addError(
      "visibility.isPublic",
      "Profile visibility must be true or false.",
      "invalid_boolean",
    );
  }
}

/*
 * =========================================
 * Meaningful Information
 * =========================================
 */

function validateMeaningfulInformation(collector, profile) {
  const fullName = getProfileFullName(profile);

  if (!fullName) {
    collector.addError(
      "firstName",
      "Enter your name before saving the profile.",
      "missing_identity",
    );
  }

  const hasProfessionalTitle = getArray(profile.professionalTitles).some(
    (title) => getText(title?.name),
  );

  const hasContactInformation = [
    "emails",
    "phones",
    "websites",
    "locations",
    "socialLinks",
  ].some((category) =>
    getArray(profile[category]).some((item) => getText(item?.value)),
  );

  if (!hasProfessionalTitle) {
    collector.addWarning(
      "professionalTitles",
      "Consider adding a professional title for résumés and portfolios.",
      "missing_professional_title",
    );
  }

  if (!hasContactInformation) {
    collector.addWarning(
      "emails",
      "Consider adding at least one contact method.",
      "missing_contact_information",
    );
  }
}

/*
 * =========================================
 * Field Error Map
 * =========================================
 */

export function createProfileFieldErrorMap(errors = []) {
  return errors.reduce((fieldErrors, error) => {
    if (!fieldErrors[error.field]) {
      fieldErrors[error.field] = error.message;
    }

    return fieldErrors;
  }, {});
}

/*
 * =========================================
 * Main Validation
 * =========================================
 */

export function validateProfile(profileValue) {
  const profile = getObject(profileValue);

  const collector = createValidationCollector();

  validateIdentity(collector, profile);

  validateCollectionLimits(collector, profile);

  validateProfessionalTitles(collector, profile);

  ["emails", "phones", "websites", "locations", "socialLinks"].forEach(
    (category) => {
      validateContactCollection(collector, profile, category);
    },
  );

  validateProfilePictures(collector, profile);

  validatePrimaryPreferences(collector, profile);

  validateProfileConfiguration(collector, profile);

  validateMeaningfulInformation(collector, profile);

  return {
    isValid: collector.errors.length === 0,

    errors: collector.errors,
    warnings: collector.warnings,
    conflicts: collector.conflicts,

    fieldErrors: createProfileFieldErrorMap(collector.errors),
  };
}

/*
 * =========================================
 * Assert Valid Profile
 * =========================================
 */

export function assertValidProfile(profile) {
  const validationResult = validateProfile(profile);

  if (validationResult.isValid) {
    return validationResult;
  }

  const error = new Error(
    "The profile contains invalid or incomplete information.",
  );

  error.name = "ProfileValidationError";
  error.code = "PROFILE_VALIDATION_FAILED";
  error.status = 400;

  error.publicMessage =
    "Correct the highlighted Profile information before saving.";

  error.validation = validationResult;
  error.errors = validationResult.errors;
  error.warnings = validationResult.warnings;
  error.conflicts = validationResult.conflicts;
  error.fieldErrors = validationResult.fieldErrors;

  throw error;
}

/*
 * =========================================
 * Validation Summary
 * =========================================
 */

export function getProfileValidationSummary(profile) {
  const result = validateProfile(profile);

  if (!result.isValid) {
    return `${result.errors.length} ${
      result.errors.length === 1 ? "problem must" : "problems must"
    } be corrected before saving.`;
  }

  if (result.warnings.length > 0) {
    return `Ready to save with ${result.warnings.length} ${
      result.warnings.length === 1 ? "suggestion" : "suggestions"
    } for improvement.`;
  }

  return "This profile is complete and ready to save.";
}
