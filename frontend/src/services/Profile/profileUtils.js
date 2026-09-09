import {
  CONTACT_INFORMATION_CONFIG,
  PROFILE_COLLECTION_NAMES,
  getContactIcon,
  getContactTypeLabel,
} from "../../config/profileConfig.js";

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

function isActiveItem(item) {
  return item?.status !== "archived";
}

function getItemOrder(item, fallbackOrder = 0) {
  const order = Number(item?.order);

  return Number.isFinite(order) && order >= 0 ? order : fallbackOrder;
}

/*
 * =========================================
 * Name Formatting
 * =========================================
 */

export function getProfileFullName(
  profile,
  { includeMiddleName = true, fallback = "Unnamed Profile" } = {},
) {
  const firstName = getText(profile?.firstName);
  const middleName = getText(profile?.middleName);
  const lastName = getText(profile?.lastName);

  const nameParts = [
    firstName,
    includeMiddleName ? middleName : "",
    lastName,
  ].filter(Boolean);

  return nameParts.join(" ") || fallback;
}

export function getProfileFirstAndLastName(
  profile,
  fallback = "Unnamed Profile",
) {
  return getProfileFullName(profile, {
    includeMiddleName: false,
    fallback,
  });
}

export function getProfileInitials(profile, fallback = "?") {
  const firstName = getText(profile?.firstName);
  const lastName = getText(profile?.lastName);

  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((name) => name.charAt(0).toLocaleUpperCase())
    .join("");

  if (initials) {
    return initials;
  }

  const middleName = getText(profile?.middleName);

  return middleName.charAt(0).toLocaleUpperCase() || fallback;
}

/*
 * =========================================
 * Collection Helpers
 * =========================================
 */

export function isProfileCollectionName(collectionName) {
  return getArray(PROFILE_COLLECTION_NAMES).includes(collectionName);
}

export function getProfileCollection(profile, collectionName) {
  if (!isProfileCollectionName(collectionName)) {
    return [];
  }

  return getArray(profile?.[collectionName]);
}

export function sortProfileItems(items = []) {
  return getArray(items)
    .map((item, index) => ({
      item,
      originalIndex: index,
    }))
    .sort((firstEntry, secondEntry) => {
      const orderDifference =
        getItemOrder(firstEntry.item, firstEntry.originalIndex) -
        getItemOrder(secondEntry.item, secondEntry.originalIndex);

      if (orderDifference !== 0) {
        return orderDifference;
      }

      const firstCreatedAt = getText(firstEntry.item?.createdAt);

      const secondCreatedAt = getText(secondEntry.item?.createdAt);

      if (firstCreatedAt && secondCreatedAt) {
        const dateDifference =
          new Date(firstCreatedAt).getTime() -
          new Date(secondCreatedAt).getTime();

        if (Number.isFinite(dateDifference) && dateDifference !== 0) {
          return dateDifference;
        }
      }

      return firstEntry.originalIndex - secondEntry.originalIndex;
    })
    .map((entry) => entry.item);
}

export function getActiveProfileItems(profile, collectionName) {
  return sortProfileItems(
    getProfileCollection(profile, collectionName).filter(isActiveItem),
  );
}

export function getArchivedProfileItems(profile, collectionName) {
  return sortProfileItems(
    getProfileCollection(profile, collectionName).filter(
      (item) => item?.status === "archived",
    ),
  );
}

export function getProfileItemById(
  profile,
  collectionName,
  itemId,
  { includeArchived = true } = {},
) {
  if (!itemId) {
    return null;
  }

  const collection = includeArchived
    ? getProfileCollection(profile, collectionName)
    : getActiveProfileItems(profile, collectionName);

  return collection.find((item) => item?.id === itemId) || null;
}

/*
 * =========================================
 * Primary Item Resolution
 * =========================================
 */

const PRIMARY_PREFERENCE_FIELDS = {
  professionalTitles: "primaryProfessionalTitleId",

  emails: "primaryEmailId",

  phones: "primaryPhoneId",

  websites: "primaryWebsiteId",

  locations: "primaryLocationId",

  socialLinks: "primarySocialLinkId",

  profilePictures: "primaryProfilePictureId",
};

export function getPrimaryPreferenceField(collectionName) {
  return PRIMARY_PREFERENCE_FIELDS[collectionName] || "";
}

export function getPrimaryProfileItem(profile, collectionName) {
  const activeItems = getActiveProfileItems(profile, collectionName);

  if (activeItems.length === 0) {
    return null;
  }

  const preferenceField = getPrimaryPreferenceField(collectionName);

  const primaryItemId = preferenceField
    ? getText(profile?.preferences?.[preferenceField])
    : "";

  if (primaryItemId) {
    const selectedPrimaryItem = activeItems.find(
      (item) => item.id === primaryItemId,
    );

    if (selectedPrimaryItem) {
      return selectedPrimaryItem;
    }
  }

  /*
   * Supports records created before the central
   * preferences object was introduced.
   */

  const legacyPrimaryItem = activeItems.find(
    (item) => item?.isPrimary === true,
  );

  return legacyPrimaryItem || activeItems[0];
}

export function getPrimaryProfessionalTitle(profile) {
  return getPrimaryProfileItem(profile, "professionalTitles");
}

export function getPrimaryEmail(profile) {
  return getPrimaryProfileItem(profile, "emails");
}

export function getPrimaryPhone(profile) {
  return getPrimaryProfileItem(profile, "phones");
}

export function getPrimaryWebsite(profile) {
  return getPrimaryProfileItem(profile, "websites");
}

export function getPrimaryLocation(profile) {
  return getPrimaryProfileItem(profile, "locations");
}

export function getPrimarySocialLink(profile) {
  return getPrimaryProfileItem(profile, "socialLinks");
}

export function getPrimaryProfilePicture(profile) {
  return getPrimaryProfileItem(profile, "profilePictures");
}

/*
 * =========================================
 * External URL Helpers
 * =========================================
 */

export function normalizeProfileExternalUrl(value) {
  const url = getText(value);

  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
}

export function getProfileContactLink(category, value) {
  const normalizedValue = getText(value);

  if (!normalizedValue) {
    return "";
  }

  if (category === "emails") {
    return `mailto:${normalizedValue}`;
  }

  if (category === "phones") {
    const normalizedPhone = normalizedValue.replace(/[^\d+]/g, "");

    return normalizedPhone ? `tel:${normalizedPhone}` : "";
  }

  if (category === "websites" || category === "socialLinks") {
    return normalizeProfileExternalUrl(normalizedValue);
  }

  return "";
}

export function isExternalProfileLink(category) {
  return category === "websites" || category === "socialLinks";
}

export function getReadableProfileUrl(value) {
  const url = getText(value);

  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(normalizeProfileExternalUrl(url));

    const pathname =
      parsedUrl.pathname === "/" ? "" : parsedUrl.pathname.replace(/\/$/, "");

    return `${parsedUrl.hostname.replace(/^www\./i, "")}${pathname}`;
  } catch {
    return url
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/$/, "");
  }
}

/*
 * =========================================
 * Picture Helpers
 * =========================================
 */

export function getProfilePictureUrl(picture) {
  return getText(picture?.imageUrl || picture?.fileUrl || picture?.url);
}

export function usesDefaultProfileAvatar(picture) {
  return Boolean(
    picture?.useDefaultAvatar === true && !getProfilePictureUrl(picture),
  );
}

export function hasConfiguredProfilePicture(picture) {
  return Boolean(
    getProfilePictureUrl(picture) || usesDefaultProfileAvatar(picture),
  );
}

export function hasProfilePicture(picture) {
  return hasConfiguredProfilePicture(picture);
}

export function getProfilePictureName(picture, fallback = "Profile Picture") {
  if (usesDefaultProfileAvatar(picture)) {
    return getText(picture?.description) || "Default Avatar";
  }

  return (
    getText(picture?.fileName) || getText(picture?.description) || fallback
  );
}

export function getProfilePictureAltText(
  picture,
  profile,
  fallback = "Professional profile picture",
) {
  const description = getText(picture?.description);

  if (description) {
    return description;
  }

  const fullName = getProfileFullName(profile, {
    fallback: "",
  });

  if (usesDefaultProfileAvatar(picture)) {
    return fullName
      ? `${fullName} default profile avatar`
      : "Default profile avatar";
  }

  return fullName ? `${fullName} profile picture` : fallback;
}

/*
 * =========================================
 * Display Helpers
 * =========================================
 */

export function getProfileCollectionLabel(collectionName, count = null) {
  const labels = {
    professionalTitles: {
      singular: "Professional Title",
      plural: "Professional Titles",
    },

    emails: {
      singular: "Email Address",
      plural: "Email Addresses",
    },

    phones: {
      singular: "Phone Number",
      plural: "Phone Numbers",
    },

    websites: {
      singular: "Website",
      plural: "Websites",
    },

    locations: {
      singular: "Location",
      plural: "Locations",
    },

    socialLinks: {
      singular: "Social Link",
      plural: "Social Links",
    },

    profilePictures: {
      singular: "Picture",
      plural: "Pictures",
    },
  };

  const collectionLabel = labels[collectionName];

  if (!collectionLabel) {
    return collectionName || "Profile Information";
  }

  return count === 1 ? collectionLabel.singular : collectionLabel.plural;
}

export function getProfileItemTypeLabel(collectionName, item) {
  if (collectionName === "professionalTitles") {
    return "Professional Title";
  }

  if (collectionName === "profilePictures") {
    if (usesDefaultProfileAvatar(item)) {
      return "Default Avatar";
    }

    return item?.type
      ? String(item.type)
          .split("-")
          .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
          .join(" ")
      : "Picture";
  }

  return getContactTypeLabel(collectionName, item?.type);
}

export function getProfileItemIcon(collectionName, item) {
  if (collectionName === "professionalTitles") {
    return "✦";
  }

  if (collectionName === "profilePictures") {
    return usesDefaultProfileAvatar(item) ? "ID" : "▧";
  }

  return getContactIcon(collectionName, item?.type);
}

export function getProfileItemDisplayValue(collectionName, item) {
  if (!item) {
    return "";
  }

  if (collectionName === "professionalTitles") {
    return getText(item.name);
  }

  if (collectionName === "profilePictures") {
    return getProfilePictureName(item);
  }

  return getText(item.value);
}

export function getProfileItemDescription(item) {
  return getText(item?.description);
}

/*
 * =========================================
 * Meaningful Information
 * =========================================
 */

export function hasMeaningfulProfileContent(profile) {
  if (!profile) {
    return false;
  }

  if (
    getText(profile.firstName) ||
    getText(profile.middleName) ||
    getText(profile.lastName)
  ) {
    return true;
  }

  return getArray(PROFILE_COLLECTION_NAMES).some((collectionName) =>
    getActiveProfileItems(profile, collectionName).some((item) => {
      if (collectionName === "professionalTitles") {
        return Boolean(getText(item.name));
      }

      if (collectionName === "profilePictures") {
        return hasConfiguredProfilePicture(item);
      }

      return Boolean(getText(item.value));
    }),
  );
}

/*
 * =========================================
 * Completeness
 * =========================================
 */

export function getProfileCompleteness(profile) {
  const primaryProfessionalTitle = getPrimaryProfessionalTitle(profile);

  const primaryEmail = getPrimaryEmail(profile);

  const primaryPhone = getPrimaryPhone(profile);

  const primaryLocation = getPrimaryLocation(profile);

  const primaryWebsite = getPrimaryWebsite(profile);

  const primarySocialLink = getPrimarySocialLink(profile);

  const primaryPicture = getPrimaryProfilePicture(profile);

  const details = [
    {
      id: "name",
      label: "Name",

      complete: Boolean(
        getText(profile?.firstName) && getText(profile?.lastName),
      ),

      weight: 3,

      value:
        getProfileFullName(profile, {
          fallback: "",
        }) || "Not provided",
    },

    {
      id: "professionalTitle",
      label: "Professional Title",

      complete: Boolean(getText(primaryProfessionalTitle?.name)),

      weight: 2,

      value: getText(primaryProfessionalTitle?.name) || "Not provided",
    },

    {
      id: "email",
      label: "Email",

      complete: Boolean(getText(primaryEmail?.value)),

      weight: 2,

      value: getText(primaryEmail?.value) || "Not provided",
    },

    {
      id: "phone",
      label: "Phone",

      complete: Boolean(getText(primaryPhone?.value)),

      weight: 1,

      value: getText(primaryPhone?.value) || "Not provided",
    },

    {
      id: "location",
      label: "Location",

      complete: Boolean(getText(primaryLocation?.value)),

      weight: 1,

      value: getText(primaryLocation?.value) || "Not provided",
    },

    {
      id: "onlinePresence",
      label: "Online Presence",

      complete: Boolean(
        getText(primaryWebsite?.value) || getText(primarySocialLink?.value),
      ),

      weight: 1,

      value:
        getText(primaryWebsite?.value) ||
        getText(primarySocialLink?.value) ||
        "Not provided",
    },

    {
      id: "picture",
      label: "Profile Picture",

      complete: hasConfiguredProfilePicture(primaryPicture),

      weight: 1,

      value: hasConfiguredProfilePicture(primaryPicture)
        ? usesDefaultProfileAvatar(primaryPicture)
          ? "Default avatar"
          : "Uploaded picture"
        : "Not provided",
    },
  ];

  const maximumScore = details.reduce(
    (total, detail) => total + detail.weight,
    0,
  );

  const score = details.reduce(
    (total, detail) => total + (detail.complete ? detail.weight : 0),
    0,
  );

  const percentage =
    maximumScore > 0 ? Math.round((score / maximumScore) * 100) : 0;

  let level = "empty";
  let label = "Not Started";

  let description = "Add your identity and professional contact information.";

  if (percentage === 100) {
    level = "complete";
    label = "Complete";

    description =
      "The Profile contains all recommended professional information.";
  } else if (percentage >= 75) {
    level = "strong";
    label = "Strong";

    description =
      "The Profile has strong reusable information with only a few optional details missing.";
  } else if (percentage >= 40) {
    level = "developing";
    label = "Developing";

    description =
      "The Profile is usable, but additional professional and contact information would improve it.";
  } else if (percentage > 0) {
    level = "basic";
    label = "Basic";

    description =
      "The Profile contains limited information and should be expanded.";
  }

  return {
    level,
    label,
    description,

    score,
    maximumScore,
    percentage,

    completedCount: details.filter((detail) => detail.complete).length,

    totalCount: details.length,

    details,
  };
}

/*
 * =========================================
 * Statistics
 * =========================================
 */

export function getProfileStatistics(profile) {
  const collectionStatistics = getArray(PROFILE_COLLECTION_NAMES).reduce(
    (statistics, collectionName) => {
      const allItems = getProfileCollection(profile, collectionName);

      const activeItems = allItems.filter(isActiveItem);

      const archivedItems = allItems.filter(
        (item) => item?.status === "archived",
      );

      statistics[collectionName] = {
        total: allItems.length,
        active: activeItems.length,
        archived: archivedItems.length,
      };

      statistics.totalItems += allItems.length;

      statistics.activeItems += activeItems.length;

      statistics.archivedItems += archivedItems.length;

      return statistics;
    },
    {
      totalItems: 0,
      activeItems: 0,
      archivedItems: 0,
    },
  );

  const completeness = getProfileCompleteness(profile);

  const primaryPicture = getPrimaryProfilePicture(profile);

  return {
    ...collectionStatistics,

    completeness,

    completenessPercentage: completeness.percentage,

    hasName: Boolean(getText(profile?.firstName) || getText(profile?.lastName)),

    hasProfessionalTitle: Boolean(
      getText(getPrimaryProfessionalTitle(profile)?.name),
    ),

    hasContactInformation: Boolean(
      getPrimaryEmail(profile) ||
      getPrimaryPhone(profile) ||
      getPrimaryWebsite(profile) ||
      getPrimarySocialLink(profile),
    ),

    hasProfilePicture: hasConfiguredProfilePicture(primaryPicture),

    usesDefaultAvatar: usesDefaultProfileAvatar(primaryPicture),

    hasUploadedPicture: Boolean(getProfilePictureUrl(primaryPicture)),
  };
}

/*
 * =========================================
 * Searchable Text
 * =========================================
 */

export function createProfileSearchText(profile) {
  if (!profile) {
    return "";
  }

  const searchableValues = [
    profile.firstName,
    profile.middleName,
    profile.lastName,
  ];

  getArray(PROFILE_COLLECTION_NAMES).forEach((collectionName) => {
    getProfileCollection(profile, collectionName).forEach((item) => {
      searchableValues.push(
        item?.name,
        item?.value,
        item?.description,
        item?.type,
        item?.fileName,

        usesDefaultProfileAvatar(item) ? "default avatar" : "",
      );
    });
  });

  return searchableValues
    .map(getText)
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC")
    .toLocaleLowerCase();
}

export function profileMatchesSearch(profile, query) {
  const normalizedQuery = getText(query).normalize("NFKC").toLocaleLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return createProfileSearchText(profile).includes(normalizedQuery);
}

/*
 * =========================================
 * Profile Display Summary
 * =========================================
 */

export function getProfileDisplaySummary(profile) {
  const primaryTitle = getPrimaryProfessionalTitle(profile);

  const primaryEmail = getPrimaryEmail(profile);

  const primaryLocation = getPrimaryLocation(profile);

  const primaryPicture = getPrimaryProfilePicture(profile);

  const pictureUsesDefaultAvatar = usesDefaultProfileAvatar(primaryPicture);

  return {
    fullName: getProfileFullName(profile),

    firstAndLastName: getProfileFirstAndLastName(profile),

    initials: getProfileInitials(profile),

    professionalTitle: getText(primaryTitle?.name) || "No professional title",

    email: getText(primaryEmail?.value),

    location: getText(primaryLocation?.value),

    /*
     * pictureUrl is empty when the default avatar
     * is selected. Consumers should check
     * usesDefaultAvatar and display initials.
     */

    pictureUrl: getProfilePictureUrl(primaryPicture),

    hasPicture: hasConfiguredProfilePicture(primaryPicture),

    usesDefaultAvatar: pictureUsesDefaultAvatar,

    pictureInitials: pictureUsesDefaultAvatar
      ? getProfileInitials(profile)
      : "",

    pictureAlt: primaryPicture
      ? getProfilePictureAltText(primaryPicture, profile)
      : "",

    status: profile?.status || "active",

    completeness: getProfileCompleteness(profile),
  };
}

/*
 * =========================================
 * Contact Configuration
 * =========================================
 */

export function getProfileContactConfig(collectionName) {
  return CONTACT_INFORMATION_CONFIG[collectionName] || null;
}
