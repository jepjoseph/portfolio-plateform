import {
  CONTACT_INFORMATION_CONFIG,
  DEFAULT_PROFILE_VALUES,
  isValidContactType,
  isValidProfileItemStatus,
  isValidProfileStatus,
  PROFILE_FIELD_LIMITS,
  PROFILE_MODEL_VERSION,
} from "../config/profileConfig.js";

/*
 * =========================================
 * ID Creation
 * =========================================
 */

export function createProfileId(prefix = "profile") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/*
 * =========================================
 * Primitive Normalization
 * =========================================
 */

function normalizeText(value, maximumLength = Infinity) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maximumLength);
}

function normalizeBoolean(value, defaultValue = false) {
  return typeof value === "boolean" ? value : defaultValue;
}

function normalizeNonNegativeNumber(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0;
  }

  return numericValue;
}

function normalizeNullableDimension(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Math.round(numericValue);
}

function normalizeOrder(value, fallbackOrder = 0) {
  const numericOrder = Number(value);

  if (!Number.isInteger(numericOrder) || numericOrder < 0) {
    return fallbackOrder;
  }

  return numericOrder;
}

/*
 * =========================================
 * URL Normalization
 * =========================================
 */

export function normalizeProfileExternalUrl(value) {
  const url = normalizeText(value, PROFILE_FIELD_LIMITS.website);

  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
}

/*
 * =========================================
 * Empty Collection Items
 * =========================================
 */

export function createEmptyProfessionalTitle() {
  const timestamp = new Date().toISOString();

  return {
    id: createProfileId("title"),

    name: "",
    description: "",

    order: 0,
    status: "active",

    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createEmptyProfileInformationItem(category) {
  const timestamp = new Date().toISOString();

  const config = CONTACT_INFORMATION_CONFIG[category];

  return {
    id: createProfileId(config?.singular?.toLowerCase() || "profile-item"),

    type: config?.defaultType || "",

    value: "",
    description: "",

    order: 0,
    status: "active",

    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createEmptyProfilePicture() {
  const timestamp = new Date().toISOString();

  return {
    id: createProfileId("picture"),

    /*
     * Picture usage is normally assigned by the
     * résumé or portfolio selection.
     */

    type: "",

    /*
     * Temporary local image or future persisted
     * backend image information.
     */

    imageUrl: "",
    blobName: "",

    fileName: "",
    fileType: "",
    fileSize: 0,

    /*
     * A saved picture record may deliberately use
     * an initials-based default avatar instead of
     * an uploaded image.
     */

    useDefaultAvatar: false,

    width: null,
    height: null,

    description: "",

    order: 0,
    status: "active",

    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/*
 * =========================================
 * Empty Profile
 * =========================================
 */

export function createEmptyProfile() {
  const timestamp = new Date().toISOString();

  return {
    modelVersion: PROFILE_MODEL_VERSION,

    id: createProfileId(),
    userId: "",

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

    preferences: {
      ...DEFAULT_PROFILE_VALUES.preferences,
    },

    visibility: {
      ...DEFAULT_PROFILE_VALUES.visibility,
    },

    status: DEFAULT_PROFILE_VALUES.status,

    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/*
 * =========================================
 * Professional Title Normalization
 * =========================================
 */

function normalizeProfessionalTitle(value, index) {
  const source =
    typeof value === "string"
      ? {
          name: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  const timestamp = new Date().toISOString();

  return {
    id: normalizeText(source.id, 200) || createProfileId("title"),

    name: normalizeText(
      source.name || source.value || source.label,
      PROFILE_FIELD_LIMITS.professionalTitle,
    ),

    description: normalizeText(
      source.description,
      PROFILE_FIELD_LIMITS.description,
    ),

    order: normalizeOrder(source.order, index),

    status: isValidProfileItemStatus(source.status) ? source.status : "active",

    createdAt: normalizeText(source.createdAt, 100) || timestamp,

    updatedAt: normalizeText(source.updatedAt, 100) || timestamp,
  };
}

/*
 * =========================================
 * Contact Item Normalization
 * =========================================
 */

function normalizeContactItem(value, category, index) {
  const source = value && typeof value === "object" ? value : {};

  const config = CONTACT_INFORMATION_CONFIG[category];

  const timestamp = new Date().toISOString();

  let normalizedValue = normalizeText(
    source.value,
    config?.maximumValueLength || 500,
  );

  if (category === "websites" || category === "socialLinks") {
    normalizedValue = normalizeProfileExternalUrl(normalizedValue);
  }

  const type = isValidContactType(category, source.type)
    ? source.type
    : config?.defaultType || "other";

  return {
    id:
      normalizeText(source.id, 200) ||
      createProfileId(config?.singular?.toLowerCase() || "contact"),

    type,

    value: normalizedValue,

    description: normalizeText(
      source.description,
      PROFILE_FIELD_LIMITS.description,
    ),

    order: normalizeOrder(source.order, index),

    status: isValidProfileItemStatus(source.status) ? source.status : "active",

    createdAt: normalizeText(source.createdAt, 100) || timestamp,

    updatedAt: normalizeText(source.updatedAt, 100) || timestamp,
  };
}

/*
 * =========================================
 * Picture Normalization
 * =========================================
 */

function normalizeProfilePicture(value, index) {
  const source = value && typeof value === "object" ? value : {};

  const timestamp = new Date().toISOString();

  const useDefaultAvatar = normalizeBoolean(source.useDefaultAvatar, false);

  /*
   * A default-avatar record must not retain uploaded
   * image metadata. This prevents conflicting states.
   */

  const imageUrl = useDefaultAvatar
    ? ""
    : normalizeText(
        source.imageUrl || source.fileUrl || source.url,
        PROFILE_FIELD_LIMITS.imageUrl,
      );

  const blobName = useDefaultAvatar
    ? ""
    : normalizeText(source.blobName, PROFILE_FIELD_LIMITS.fileName);

  const fileName = useDefaultAvatar
    ? ""
    : normalizeText(source.fileName, PROFILE_FIELD_LIMITS.fileName);

  const fileType = useDefaultAvatar
    ? ""
    : normalizeText(source.fileType, PROFILE_FIELD_LIMITS.fileType);

  const fileSize = useDefaultAvatar
    ? 0
    : normalizeNonNegativeNumber(source.fileSize);

  const width = useDefaultAvatar
    ? null
    : normalizeNullableDimension(source.width);

  const height = useDefaultAvatar
    ? null
    : normalizeNullableDimension(source.height);

  return {
    id: normalizeText(source.id, 200) || createProfileId("picture"),

    /*
     * Retained for compatibility with older data.
     * Portfolio and résumé selections may override
     * this usage.
     */

    type: normalizeText(source.type, 100),

    imageUrl,
    blobName,

    fileName,
    fileType,
    fileSize,

    useDefaultAvatar,

    width,
    height,

    description: normalizeText(
      source.description,
      PROFILE_FIELD_LIMITS.description,
    ),

    order: normalizeOrder(source.order, index),

    status: isValidProfileItemStatus(source.status) ? source.status : "active",

    createdAt: normalizeText(source.createdAt, 100) || timestamp,

    updatedAt: normalizeText(source.updatedAt, 100) || timestamp,
  };
}

/*
 * =========================================
 * Collection Normalization
 * =========================================
 */

function normalizeCollection(values, normalizer, maximumItems) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedItems = values
    .slice(0, maximumItems)
    .map((value, index) => normalizer(value, index))
    .filter(Boolean);

  const usedIds = new Set();

  return normalizedItems
    .filter((item) => {
      if (usedIds.has(item.id)) {
        return false;
      }

      usedIds.add(item.id);

      return true;
    })
    .sort((firstItem, secondItem) => {
      if (firstItem.order !== secondItem.order) {
        return firstItem.order - secondItem.order;
      }

      return firstItem.createdAt.localeCompare(secondItem.createdAt);
    })
    .map((item, index) => ({
      ...item,
      order: index,
    }));
}

/*
 * =========================================
 * Primary Preference
 * =========================================
 */

function resolvePrimaryId(requestedId, collection) {
  const activeItems = collection.filter((item) => item.status !== "archived");

  /*
   * An archived record cannot remain the primary item.
   */

  if (requestedId && activeItems.some((item) => item.id === requestedId)) {
    return requestedId;
  }

  /*
   * Support older records that stored isPrimary
   * directly on the child item.
   */

  const legacyPrimaryItem = activeItems.find((item) => item.isPrimary === true);

  return legacyPrimaryItem?.id || activeItems[0]?.id || "";
}

/*
 * =========================================
 * Profile Normalization
 * =========================================
 */

export function normalizeProfile(value = {}) {
  const defaults = createEmptyProfile();

  const source = value && typeof value === "object" ? value : {};

  const professionalTitles = normalizeCollection(
    source.professionalTitles,
    normalizeProfessionalTitle,
    PROFILE_FIELD_LIMITS.maximumProfessionalTitles,
  );

  const emails = normalizeCollection(
    source.emails,
    (item, index) => normalizeContactItem(item, "emails", index),
    PROFILE_FIELD_LIMITS.maximumEmails,
  );

  const phones = normalizeCollection(
    source.phones,
    (item, index) => normalizeContactItem(item, "phones", index),
    PROFILE_FIELD_LIMITS.maximumPhones,
  );

  const websites = normalizeCollection(
    source.websites,
    (item, index) => normalizeContactItem(item, "websites", index),
    PROFILE_FIELD_LIMITS.maximumWebsites,
  );

  const locations = normalizeCollection(
    source.locations,
    (item, index) => normalizeContactItem(item, "locations", index),
    PROFILE_FIELD_LIMITS.maximumLocations,
  );

  const socialLinks = normalizeCollection(
    source.socialLinks,
    (item, index) => normalizeContactItem(item, "socialLinks", index),
    PROFILE_FIELD_LIMITS.maximumSocialLinks,
  );

  const profilePictures = normalizeCollection(
    source.profilePictures,
    normalizeProfilePicture,
    PROFILE_FIELD_LIMITS.maximumProfilePictures,
  );

  const requestedPreferences =
    source.preferences && typeof source.preferences === "object"
      ? source.preferences
      : {};

  return {
    modelVersion: PROFILE_MODEL_VERSION,

    id: normalizeText(source.id, 200) || defaults.id,

    userId: normalizeText(source.userId, 200),

    firstName: normalizeText(source.firstName, PROFILE_FIELD_LIMITS.firstName),

    middleName: normalizeText(
      source.middleName,
      PROFILE_FIELD_LIMITS.middleName,
    ),

    lastName: normalizeText(source.lastName, PROFILE_FIELD_LIMITS.lastName),

    professionalTitles,

    emails,
    phones,
    websites,
    locations,
    socialLinks,
    profilePictures,

    preferences: {
      primaryProfessionalTitleId: resolvePrimaryId(
        requestedPreferences.primaryProfessionalTitleId,
        professionalTitles,
      ),

      primaryEmailId: resolvePrimaryId(
        requestedPreferences.primaryEmailId,
        emails,
      ),

      primaryPhoneId: resolvePrimaryId(
        requestedPreferences.primaryPhoneId,
        phones,
      ),

      primaryWebsiteId: resolvePrimaryId(
        requestedPreferences.primaryWebsiteId,
        websites,
      ),

      primaryLocationId: resolvePrimaryId(
        requestedPreferences.primaryLocationId,
        locations,
      ),

      primarySocialLinkId: resolvePrimaryId(
        requestedPreferences.primarySocialLinkId,
        socialLinks,
      ),

      primaryProfilePictureId: resolvePrimaryId(
        requestedPreferences.primaryProfilePictureId,
        profilePictures,
      ),
    },

    visibility: {
      isPublic: normalizeBoolean(source.visibility?.isPublic, false),
    },

    status: isValidProfileStatus(source.status)
      ? source.status
      : defaults.status,

    createdAt: normalizeText(source.createdAt, 100) || defaults.createdAt,

    updatedAt: normalizeText(source.updatedAt, 100) || defaults.updatedAt,
  };
}

/*
 * =========================================
 * Create Profile
 * =========================================
 */

export function createProfile(values = {}) {
  const timestamp = new Date().toISOString();

  return normalizeProfile({
    ...values,

    id: normalizeText(values.id, 200) || createProfileId(),

    createdAt: normalizeText(values.createdAt, 100) || timestamp,

    updatedAt: timestamp,
  });
}

/*
 * =========================================
 * Update Profile
 * =========================================
 */

export function updateProfileModel(currentProfile, updates = {}) {
  return normalizeProfile({
    ...currentProfile,
    ...updates,

    preferences: {
      ...currentProfile?.preferences,
      ...updates?.preferences,
    },

    visibility: {
      ...currentProfile?.visibility,
      ...updates?.visibility,
    },

    id: currentProfile?.id,

    userId: currentProfile?.userId,

    createdAt: currentProfile?.createdAt,

    updatedAt: new Date().toISOString(),
  });
}

/*
 * =========================================
 * Full Name
 * =========================================
 */

export function getProfileFullName(profile) {
  return [profile?.firstName, profile?.middleName, profile?.lastName]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" ");
}

/*
 * =========================================
 * Picture State Helpers
 * =========================================
 */

export function usesDefaultProfileAvatar(picture) {
  return Boolean(
    picture?.useDefaultAvatar === true &&
    !normalizeText(picture?.imageUrl || picture?.fileUrl || picture?.url),
  );
}

export function hasUploadedProfilePicture(picture) {
  return Boolean(
    normalizeText(picture?.imageUrl || picture?.fileUrl || picture?.url),
  );
}

export function hasConfiguredProfilePicture(picture) {
  return Boolean(
    hasUploadedProfilePicture(picture) || usesDefaultProfileAvatar(picture),
  );
}

/*
 * =========================================
 * Public Profile
 * =========================================
 */

export function createPublicProfile(value) {
  const profile = normalizeProfile(value);

  const { userId, ...publicProfile } = profile;

  return publicProfile;
}
