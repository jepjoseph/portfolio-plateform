/*
 * =========================================
 * Profile Model
 * =========================================
 */

export const PROFILE_MODEL_VERSION = 1;

/*
 * =========================================
 * Profile Collections
 * =========================================
 */

export const PROFILE_COLLECTION_NAMES = [
  "professionalTitles",
  "emails",
  "phones",
  "websites",
  "locations",
  "socialLinks",
  "profilePictures",
];

/*
 * =========================================
 * Profile Status
 * =========================================
 */

export const PROFILE_STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

export const PROFILE_ITEM_STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

/*
 * =========================================
 * Field Limits
 * =========================================
 *
 * These values should later be duplicated in:
 *
 * - Backend Zod validation
 * - SQL Server column constraints
 */

export const PROFILE_FIELD_LIMITS = {
  firstName: 100,
  middleName: 100,
  lastName: 100,

  professionalTitle: 200,

  email: 320,
  phone: 50,
  website: 2048,
  location: 500,
  socialLink: 2048,

  description: 500,
  label: 150,

  fileName: 255,
  fileType: 100,
  imageUrl: 5_000_000,

  maximumProfessionalTitles: 20,
  maximumEmails: 20,
  maximumPhones: 20,
  maximumWebsites: 20,
  maximumLocations: 20,
  maximumSocialLinks: 30,
  maximumProfilePictures: 20,
};

/*
 * =========================================
 * Picture Upload
 * =========================================
 */

export const PROFILE_PICTURE_UPLOAD_CONFIG = {
  accept: ".gif,.jpg,.jpeg,.png,.webp,.avif",

  allowedFileTypes: [
    "image/gif",
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ],

  /*
   * Keep local-development pictures small.
   * Azure Blob Storage will later replace Base64.
   */

  maximumLocalFileSize: 3 * 1024 * 1024,

  maximumProductionFileSize: 20 * 1024 * 1024,
};

/*
 * =========================================
 * Email Types
 * =========================================
 */

export const EMAIL_TYPE_OPTIONS = [
  {
    value: "personal",
    label: "Personal Email",
  },
  {
    value: "work",
    label: "Work Email",
  },
  {
    value: "school",
    label: "School Email",
  },
  {
    value: "business",
    label: "Business Email",
  },
  {
    value: "other",
    label: "Other Email",
  },
];

/*
 * =========================================
 * Phone Types
 * =========================================
 */

export const PHONE_TYPE_OPTIONS = [
  {
    value: "personal",
    label: "Personal Phone",
  },
  {
    value: "mobile",
    label: "Mobile Phone",
  },
  {
    value: "home",
    label: "Home Phone",
  },
  {
    value: "work",
    label: "Work Phone",
  },
  {
    value: "school",
    label: "School Phone",
  },
  {
    value: "other",
    label: "Other Phone",
  },
];

/*
 * =========================================
 * Website Types
 * =========================================
 */

export const WEBSITE_TYPE_OPTIONS = [
  {
    value: "portfolio",
    label: "Portfolio Website",
  },
  {
    value: "personal",
    label: "Personal Website",
  },
  {
    value: "business",
    label: "Business Website",
  },
  {
    value: "company",
    label: "Company Website",
  },
  {
    value: "school",
    label: "School Website",
  },
  {
    value: "blog",
    label: "Blog",
  },
  {
    value: "other",
    label: "Other Website",
  },
];

/*
 * =========================================
 * Location Types
 * =========================================
 */

export const LOCATION_TYPE_OPTIONS = [
  {
    value: "home",
    label: "Home Location",
  },
  {
    value: "office",
    label: "Office Location",
  },
  {
    value: "work",
    label: "Work Location",
  },
  {
    value: "school",
    label: "School Location",
  },
  {
    value: "business",
    label: "Business Location",
  },
  {
    value: "other",
    label: "Other Location",
  },
];

/*
 * =========================================
 * Social Link Types
 * =========================================
 */

export const SOCIAL_LINK_TYPE_OPTIONS = [
  {
    value: "linkedin",
    label: "LinkedIn",
    icon: "in",
  },
  {
    value: "github",
    label: "GitHub",
    icon: "GH",
  },
  {
    value: "youtube",
    label: "YouTube",
    icon: "YT",
  },
  {
    value: "facebook",
    label: "Facebook",
    icon: "f",
  },
  {
    value: "instagram",
    label: "Instagram",
    icon: "IG",
  },
  {
    value: "x",
    label: "X",
    icon: "X",
  },
  {
    value: "other",
    label: "Other Social Profile",
    icon: "↗",
  },
];

/*
 * =========================================
 * Picture Usage
 * =========================================
 *
 * Pictures remain reusable. A portfolio or
 * résumé can assign a specific usage later.
 */

export const PROFILE_PICTURE_USAGE_OPTIONS = [
  {
    value: "profile",
    label: "Profile Picture",
  },
  {
    value: "headshot",
    label: "Professional Headshot",
  },
  {
    value: "avatar",
    label: "Avatar",
  },
  {
    value: "header-background",
    label: "Header Background",
  },
  {
    value: "portfolio-background",
    label: "Portfolio Background",
  },
  {
    value: "logo",
    label: "Logo",
  },
  {
    value: "icon",
    label: "Icon",
  },
];

/*
 * =========================================
 * Contact Configuration
 * =========================================
 */

export const CONTACT_INFORMATION_CONFIG = {
  emails: {
    singular: "Email",
    plural: "Email Addresses",
    eyebrow: "Email",
    inputType: "email",
    inputMode: "email",
    autoComplete: "email",
    placeholder: "name@example.com",
    icon: "@",
    defaultType: "personal",
    maximumItems: PROFILE_FIELD_LIMITS.maximumEmails,
    maximumValueLength: PROFILE_FIELD_LIMITS.email,
    typeOptions: EMAIL_TYPE_OPTIONS,
  },

  phones: {
    singular: "Phone",
    plural: "Phone Numbers",
    eyebrow: "Phone",
    inputType: "tel",
    inputMode: "tel",
    autoComplete: "tel",
    placeholder: "+1 954 555 0100",
    icon: "☎",
    defaultType: "personal",
    maximumItems: PROFILE_FIELD_LIMITS.maximumPhones,
    maximumValueLength: PROFILE_FIELD_LIMITS.phone,
    typeOptions: PHONE_TYPE_OPTIONS,
  },

  websites: {
    singular: "Website",
    plural: "Websites",
    eyebrow: "Website",
    inputType: "text",
    inputMode: "url",
    autoComplete: "url",
    placeholder: "https://example.com",
    icon: "↗",
    defaultType: "portfolio",
    maximumItems: PROFILE_FIELD_LIMITS.maximumWebsites,
    maximumValueLength: PROFILE_FIELD_LIMITS.website,
    typeOptions: WEBSITE_TYPE_OPTIONS,
  },

  locations: {
    singular: "Location",
    plural: "Locations",
    eyebrow: "Location",
    inputType: "text",
    inputMode: "text",
    autoComplete: "street-address",
    placeholder: "City, State or full address",
    icon: "⌖",
    defaultType: "home",
    maximumItems: PROFILE_FIELD_LIMITS.maximumLocations,
    maximumValueLength: PROFILE_FIELD_LIMITS.location,
    typeOptions: LOCATION_TYPE_OPTIONS,
  },

  socialLinks: {
    singular: "Social Link",
    plural: "Social Links",
    eyebrow: "Social",
    inputType: "text",
    inputMode: "url",
    autoComplete: "url",
    placeholder: "https://...",
    icon: "↗",
    defaultType: "linkedin",
    maximumItems: PROFILE_FIELD_LIMITS.maximumSocialLinks,
    maximumValueLength: PROFILE_FIELD_LIMITS.socialLink,
    typeOptions: SOCIAL_LINK_TYPE_OPTIONS,
  },

  profilePictures: {
    singular: "Picture",
    plural: "Pictures",
    eyebrow: "Media",
    kind: "image",
    inputType: "file",

    accept: PROFILE_PICTURE_UPLOAD_CONFIG.accept,

    allowedFileTypes: PROFILE_PICTURE_UPLOAD_CONFIG.allowedFileTypes,

    maxFileSize: PROFILE_PICTURE_UPLOAD_CONFIG.maximumLocalFileSize,

    maximumItems: PROFILE_FIELD_LIMITS.maximumProfilePictures,

    icon: "▧",
    defaultType: "",
    typeOptions: [],
  },
};

/*
 * =========================================
 * Default Values
 * =========================================
 */

export const DEFAULT_PROFILE_VALUES = {
  status: "active",

  visibility: {
    isPublic: false,
  },

  preferences: {
    primaryProfessionalTitleId: "",
    primaryEmailId: "",
    primaryPhoneId: "",
    primaryWebsiteId: "",
    primaryLocationId: "",
    primarySocialLinkId: "",
    primaryProfilePictureId: "",
  },
};

/*
 * =========================================
 * Option Helpers
 * =========================================
 */

function findOption(options, value) {
  return options.find((option) => option.value === value) || null;
}

export function getContactTypeOption(category, type) {
  const config = CONTACT_INFORMATION_CONFIG[category];

  return findOption(config?.typeOptions || [], type);
}

export function getContactTypeLabel(category, type) {
  const config = CONTACT_INFORMATION_CONFIG[category];

  const option = getContactTypeOption(category, type);

  return option?.label || type || config?.singular || "Contact";
}

export function getContactIcon(category, type) {
  const config = CONTACT_INFORMATION_CONFIG[category];

  const option = getContactTypeOption(category, type);

  return option?.icon || config?.icon || "✦";
}

export function isValidContactType(category, type) {
  return Boolean(getContactTypeOption(category, type));
}

export function isValidProfileStatus(value) {
  return Boolean(findOption(PROFILE_STATUS_OPTIONS, value));
}

export function isValidProfileItemStatus(value) {
  return Boolean(findOption(PROFILE_ITEM_STATUS_OPTIONS, value));
}

export function isProfileCollectionName(value) {
  return PROFILE_COLLECTION_NAMES.includes(value);
}
