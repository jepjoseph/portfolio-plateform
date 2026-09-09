import {
  CONTACT_INFORMATION_CONFIG,
  isProfileCollectionName,
  PROFILE_FIELD_LIMITS,
} from "../../config/profileConfig.js";

import {
  createEmptyProfessionalTitle,
  createEmptyProfile,
  createEmptyProfileInformationItem,
  createEmptyProfilePicture,
  createProfile,
  normalizeProfile,
  updateProfileModel,
} from "../../models/profileModel.js";

import { assertValidProfile, validateProfile } from "./profileValidation.js";

import {
  readStoredProfile,
  removeStoredProfile,
  replaceStoredProfile,
  resetStoredProfile,
} from "./profileStorage.js";

/*
 * =========================================
 * Primary Preference Mapping
 * =========================================
 */

const PRIMARY_PREFERENCE_BY_COLLECTION = {
  professionalTitles: "primaryProfessionalTitleId",

  emails: "primaryEmailId",

  phones: "primaryPhoneId",

  websites: "primaryWebsiteId",

  locations: "primaryLocationId",

  socialLinks: "primarySocialLinkId",

  profilePictures: "primaryProfilePictureId",
};

/*
 * =========================================
 * Service Errors
 * =========================================
 */

function createProfileServiceError({
  message,
  publicMessage,
  code,
  status = 500,
  details = null,
}) {
  const error = new Error(message);

  error.name = "ProfileServiceError";
  error.code = code;
  error.status = status;
  error.publicMessage = publicMessage;
  error.details = details;

  return error;
}

function createInvalidCollectionError(collectionName) {
  return createProfileServiceError({
    message: `Unsupported Profile collection "${collectionName}".`,

    publicMessage: "The requested Profile information category is invalid.",

    code: "INVALID_PROFILE_COLLECTION",
    status: 400,

    details: {
      collectionName,
    },
  });
}

function createProfileItemNotFoundError(collectionName, itemId) {
  return createProfileServiceError({
    message: `Profile item "${itemId}" was not found in "${collectionName}".`,

    publicMessage: "The requested Profile information could not be found.",

    code: "PROFILE_ITEM_NOT_FOUND",
    status: 404,

    details: {
      collectionName,
      itemId,
    },
  });
}

/*
 * =========================================
 * Internal Validation
 * =========================================
 */

function assertCollectionName(collectionName) {
  if (!isProfileCollectionName(collectionName)) {
    throw createInvalidCollectionError(collectionName);
  }

  return collectionName;
}

function assertItemId(itemId) {
  if (typeof itemId !== "string" || !itemId.trim()) {
    throw createProfileServiceError({
      message: "A Profile information item ID is required.",

      publicMessage: "The Profile information could not be identified.",

      code: "PROFILE_ITEM_ID_REQUIRED",
      status: 400,
    });
  }

  return itemId.trim();
}

function assertCollectionCapacity(collectionName, collection) {
  const config = CONTACT_INFORMATION_CONFIG[collectionName];

  const maximumItems =
    config?.maximumItems ||
    {
      professionalTitles: PROFILE_FIELD_LIMITS.maximumProfessionalTitles,

      profilePictures: PROFILE_FIELD_LIMITS.maximumProfilePictures,
    }[collectionName];

  if (maximumItems && collection.length >= maximumItems) {
    throw createProfileServiceError({
      message: `Profile collection "${collectionName}" has reached its maximum size.`,

      publicMessage: `You cannot add more than ${maximumItems} items to this Profile section.`,

      code: "PROFILE_COLLECTION_LIMIT_REACHED",
      status: 400,

      details: {
        collectionName,
        maximumItems,
      },
    });
  }
}

/*
 * =========================================
 * Initial Item Creation
 * =========================================
 */

function createCollectionItemCandidate(collectionName, itemData = {}) {
  if (collectionName === "professionalTitles") {
    return {
      ...createEmptyProfessionalTitle(),
      ...itemData,
    };
  }

  if (collectionName === "profilePictures") {
    return {
      ...createEmptyProfilePicture(),
      ...itemData,
    };
  }

  return {
    ...createEmptyProfileInformationItem(collectionName),

    ...itemData,
  };
}

/*
 * =========================================
 * Primary Item Helpers
 * =========================================
 */

function getPrimaryPreferenceName(collectionName) {
  return PRIMARY_PREFERENCE_BY_COLLECTION[collectionName] || "";
}

function getFirstActiveItemId(collection, excludedItemId = "") {
  return (
    collection.find(
      (item) => item.id !== excludedItemId && item.status !== "archived",
    )?.id || ""
  );
}

function updatePrimaryPreferenceAfterRemoval(
  profile,
  collectionName,
  itemId,
  nextCollection,
) {
  const preferenceName = getPrimaryPreferenceName(collectionName);

  if (!preferenceName) {
    return profile.preferences;
  }

  const currentPrimaryId = profile.preferences?.[preferenceName] || "";

  if (currentPrimaryId !== itemId) {
    return profile.preferences;
  }

  return {
    ...profile.preferences,

    [preferenceName]: getFirstActiveItemId(nextCollection),
  };
}

function updatePrimaryPreferenceAfterArchive(
  profile,
  collectionName,
  itemId,
  nextCollection,
) {
  return updatePrimaryPreferenceAfterRemoval(
    profile,
    collectionName,
    itemId,
    nextCollection,
  );
}

/*
 * =========================================
 * Candidate Persistence
 * =========================================
 */

function saveValidatedProfile(candidate) {
  /*
   * Validate before normalization so oversized
   * or unsupported input is not silently truncated
   * or replaced with a default.
   */

  assertValidProfile(candidate);

  const currentProfile = readStoredProfile();

  const normalizedProfile = currentProfile?.id
    ? updateProfileModel(currentProfile, candidate)
    : createProfile(candidate);

  return replaceStoredProfile(normalizedProfile);
}

/*
 * =========================================
 * Read Profile
 * =========================================
 */

export async function getProfile({ fallbackProfile = null } = {}) {
  return readStoredProfile({
    fallbackProfile,
    migrateLegacy: true,
  });
}

/*
 * =========================================
 * Update Complete Profile
 * =========================================
 */

export async function updateProfile(profileData = {}) {
  const currentProfile = readStoredProfile();

  /*
   * Preserve internal ownership and creation
   * metadata when the form sends only editable
   * Profile properties.
   */

  const candidate = {
    ...currentProfile,
    ...profileData,

    id: currentProfile.id,

    userId: currentProfile.userId,

    preferences: {
      ...currentProfile.preferences,
      ...profileData.preferences,
    },

    visibility: {
      ...currentProfile.visibility,
      ...profileData.visibility,
    },

    createdAt: currentProfile.createdAt,

    updatedAt: new Date().toISOString(),
  };

  return saveValidatedProfile(candidate);
}

/*
 * =========================================
 * Update Identity
 * =========================================
 */

export async function updateProfileIdentity(identityUpdates = {}) {
  const currentProfile = readStoredProfile();

  const candidate = {
    ...currentProfile,

    firstName: identityUpdates.firstName ?? currentProfile.firstName,

    middleName: identityUpdates.middleName ?? currentProfile.middleName,

    lastName: identityUpdates.lastName ?? currentProfile.lastName,

    updatedAt: new Date().toISOString(),
  };

  return saveValidatedProfile(candidate);
}

/*
 * =========================================
 * Get Collection
 * =========================================
 */

export async function getProfileCollection(
  collectionName,
  { includeArchived = false } = {},
) {
  assertCollectionName(collectionName);

  const profile = readStoredProfile();

  const collection = Array.isArray(profile[collectionName])
    ? profile[collectionName]
    : [];

  if (includeArchived) {
    return [...collection];
  }

  return collection.filter((item) => item.status !== "archived");
}

/*
 * =========================================
 * Get Collection Item
 * =========================================
 */

export async function getProfileItem(collectionName, itemId) {
  assertCollectionName(collectionName);

  const normalizedItemId = assertItemId(itemId);

  const profile = readStoredProfile();

  const item = (profile[collectionName] || []).find(
    (candidate) => candidate.id === normalizedItemId,
  );

  if (!item) {
    throw createProfileItemNotFoundError(collectionName, normalizedItemId);
  }

  return item;
}

/*
 * =========================================
 * Add Collection Item
 * =========================================
 */

export async function addProfileItem(collectionName, itemData = {}) {
  assertCollectionName(collectionName);

  const profile = readStoredProfile();

  const currentCollection = Array.isArray(profile[collectionName])
    ? profile[collectionName]
    : [];

  assertCollectionCapacity(collectionName, currentCollection);

  const newItem = createCollectionItemCandidate(collectionName, itemData);

  const nextCollection = [
    ...currentCollection,

    {
      ...newItem,
      order: currentCollection.length,
    },
  ];

  const preferenceName = getPrimaryPreferenceName(collectionName);

  const shouldAssignPrimary =
    preferenceName && !profile.preferences?.[preferenceName];

  const candidate = {
    ...profile,

    [collectionName]: nextCollection,

    preferences: shouldAssignPrimary
      ? {
          ...profile.preferences,

          [preferenceName]: newItem.id,
        }
      : profile.preferences,

    updatedAt: new Date().toISOString(),
  };

  const savedProfile = saveValidatedProfile(candidate);

  return {
    profile: savedProfile,

    item:
      savedProfile[collectionName].find((item) => item.id === newItem.id) ||
      null,

    created: true,
  };
}

/*
 * =========================================
 * Update Collection Item
 * =========================================
 */

export async function updateProfileItem(collectionName, itemId, updates = {}) {
  assertCollectionName(collectionName);

  const normalizedItemId = assertItemId(itemId);

  const profile = readStoredProfile();

  const currentCollection = profile[collectionName] || [];

  const itemIndex = currentCollection.findIndex(
    (item) => item.id === normalizedItemId,
  );

  if (itemIndex === -1) {
    throw createProfileItemNotFoundError(collectionName, normalizedItemId);
  }

  const currentItem = currentCollection[itemIndex];

  const updatedItem = {
    ...currentItem,
    ...updates,

    id: currentItem.id,
    createdAt: currentItem.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const nextCollection = [...currentCollection];

  nextCollection[itemIndex] = updatedItem;

  const candidate = {
    ...profile,

    [collectionName]: nextCollection,

    updatedAt: new Date().toISOString(),
  };

  const savedProfile = saveValidatedProfile(candidate);

  return {
    profile: savedProfile,

    item:
      savedProfile[collectionName].find(
        (item) => item.id === normalizedItemId,
      ) || null,

    updated: true,
  };
}

/*
 * =========================================
 * Replace Collection
 * =========================================
 */

export async function replaceProfileCollection(
  collectionName,
  collectionValues,
) {
  assertCollectionName(collectionName);

  if (!Array.isArray(collectionValues)) {
    throw createProfileServiceError({
      message: `Replacement value for "${collectionName}" must be an array.`,

      publicMessage: "The Profile information list has an invalid format.",

      code: "INVALID_PROFILE_COLLECTION_VALUE",
      status: 400,
    });
  }

  const profile = readStoredProfile();

  const candidate = {
    ...profile,

    [collectionName]: collectionValues.map((item, index) => ({
      ...item,
      order: index,
    })),

    updatedAt: new Date().toISOString(),
  };

  return saveValidatedProfile(candidate);
}

/*
 * =========================================
 * Reorder Collection
 * =========================================
 */

export async function reorderProfileCollection(collectionName, orderedItemIds) {
  assertCollectionName(collectionName);

  if (!Array.isArray(orderedItemIds)) {
    throw createProfileServiceError({
      message: "Profile item order must be an array of IDs.",

      publicMessage: "The Profile information could not be reordered.",

      code: "INVALID_PROFILE_ITEM_ORDER",
      status: 400,
    });
  }

  const profile = readStoredProfile();

  const currentCollection = profile[collectionName] || [];

  const currentIds = new Set(currentCollection.map((item) => item.id));

  const requestedIds = new Set(orderedItemIds);

  const containsEveryItem =
    currentIds.size === requestedIds.size &&
    [...currentIds].every((id) => requestedIds.has(id));

  if (!containsEveryItem) {
    throw createProfileServiceError({
      message:
        "The supplied Profile item order does not match the current collection.",

      publicMessage:
        "The Profile information could not be reordered because its item list changed.",

      code: "PROFILE_ITEM_ORDER_MISMATCH",
      status: 409,
    });
  }

  const itemById = new Map(currentCollection.map((item) => [item.id, item]));

  const nextCollection = orderedItemIds.map((itemId, index) => ({
    ...itemById.get(itemId),

    order: index,
    updatedAt: new Date().toISOString(),
  }));

  const candidate = {
    ...profile,

    [collectionName]: nextCollection,

    updatedAt: new Date().toISOString(),
  };

  return saveValidatedProfile(candidate);
}

/*
 * =========================================
 * Assign Primary Item
 * =========================================
 */

export async function setPrimaryProfileItem(collectionName, itemId) {
  assertCollectionName(collectionName);

  const normalizedItemId = assertItemId(itemId);

  const preferenceName = getPrimaryPreferenceName(collectionName);

  if (!preferenceName) {
    throw createProfileServiceError({
      message: `Collection "${collectionName}" does not support a primary item.`,

      publicMessage:
        "This Profile information category cannot have a primary item.",

      code: "PRIMARY_ITEM_NOT_SUPPORTED",
      status: 400,
    });
  }

  const profile = readStoredProfile();

  const selectedItem = (profile[collectionName] || []).find(
    (item) => item.id === normalizedItemId,
  );

  if (!selectedItem) {
    throw createProfileItemNotFoundError(collectionName, normalizedItemId);
  }

  if (selectedItem.status === "archived") {
    throw createProfileServiceError({
      message: "An archived Profile item cannot be assigned as primary.",

      publicMessage:
        "Restore this Profile information before making it primary.",

      code: "ARCHIVED_PRIMARY_PROFILE_ITEM",
      status: 400,
    });
  }

  const candidate = {
    ...profile,

    preferences: {
      ...profile.preferences,

      [preferenceName]: normalizedItemId,
    },

    updatedAt: new Date().toISOString(),
  };

  const savedProfile = saveValidatedProfile(candidate);

  return {
    profile: savedProfile,
    item: selectedItem,
    preferenceName,
  };
}

/*
 * =========================================
 * Archive Item
 * =========================================
 */

export async function archiveProfileItem(collectionName, itemId) {
  assertCollectionName(collectionName);

  const normalizedItemId = assertItemId(itemId);

  const profile = readStoredProfile();

  const currentCollection = profile[collectionName] || [];

  const itemIndex = currentCollection.findIndex(
    (item) => item.id === normalizedItemId,
  );

  if (itemIndex === -1) {
    throw createProfileItemNotFoundError(collectionName, normalizedItemId);
  }

  const nextCollection = currentCollection.map((item) =>
    item.id === normalizedItemId
      ? {
          ...item,
          status: "archived",
          updatedAt: new Date().toISOString(),
        }
      : item,
  );

  const nextPreferences = updatePrimaryPreferenceAfterArchive(
    profile,
    collectionName,
    normalizedItemId,
    nextCollection,
  );

  const candidate = {
    ...profile,

    [collectionName]: nextCollection,

    preferences: nextPreferences,

    updatedAt: new Date().toISOString(),
  };

  const savedProfile = saveValidatedProfile(candidate);

  return {
    profile: savedProfile,

    item:
      savedProfile[collectionName].find(
        (item) => item.id === normalizedItemId,
      ) || null,

    archived: true,
  };
}

/*
 * =========================================
 * Restore Item
 * =========================================
 */

export async function restoreProfileItem(collectionName, itemId) {
  assertCollectionName(collectionName);

  const normalizedItemId = assertItemId(itemId);

  const profile = readStoredProfile();

  const currentCollection = profile[collectionName] || [];

  const itemIndex = currentCollection.findIndex(
    (item) => item.id === normalizedItemId,
  );

  if (itemIndex === -1) {
    throw createProfileItemNotFoundError(collectionName, normalizedItemId);
  }

  const nextCollection = currentCollection.map((item) =>
    item.id === normalizedItemId
      ? {
          ...item,
          status: "active",
          updatedAt: new Date().toISOString(),
        }
      : item,
  );

  const preferenceName = getPrimaryPreferenceName(collectionName);

  const shouldAssignPrimary =
    preferenceName && !profile.preferences?.[preferenceName];

  const candidate = {
    ...profile,

    [collectionName]: nextCollection,

    preferences: shouldAssignPrimary
      ? {
          ...profile.preferences,

          [preferenceName]: normalizedItemId,
        }
      : profile.preferences,

    updatedAt: new Date().toISOString(),
  };

  const savedProfile = saveValidatedProfile(candidate);

  return {
    profile: savedProfile,

    item:
      savedProfile[collectionName].find(
        (item) => item.id === normalizedItemId,
      ) || null,

    restored: true,
  };
}

/*
 * =========================================
 * Permanently Delete Item
 * =========================================
 */

export async function deleteProfileItem(collectionName, itemId) {
  assertCollectionName(collectionName);

  const normalizedItemId = assertItemId(itemId);

  const profile = readStoredProfile();

  const currentCollection = profile[collectionName] || [];

  const itemToDelete = currentCollection.find(
    (item) => item.id === normalizedItemId,
  );

  if (!itemToDelete) {
    throw createProfileItemNotFoundError(collectionName, normalizedItemId);
  }

  const nextCollection = currentCollection
    .filter((item) => item.id !== normalizedItemId)
    .map((item, index) => ({
      ...item,
      order: index,
    }));

  const nextPreferences = updatePrimaryPreferenceAfterRemoval(
    profile,
    collectionName,
    normalizedItemId,
    nextCollection,
  );

  const candidate = {
    ...profile,

    [collectionName]: nextCollection,

    preferences: nextPreferences,

    updatedAt: new Date().toISOString(),
  };

  const savedProfile = saveValidatedProfile(candidate);

  return {
    profile: savedProfile,

    deletedItem: itemToDelete,

    deleted: true,
  };
}

/*
 * =========================================
 * Update Profile Visibility
 * =========================================
 */

export async function updateProfileVisibility(visibilityUpdates = {}) {
  const profile = readStoredProfile();

  const candidate = {
    ...profile,

    visibility: {
      ...profile.visibility,
      ...visibilityUpdates,
    },

    updatedAt: new Date().toISOString(),
  };

  return saveValidatedProfile(candidate);
}

/*
 * =========================================
 * Archive Complete Profile
 * =========================================
 */

export async function archiveProfile() {
  const profile = readStoredProfile();

  return saveValidatedProfile({
    ...profile,

    status: "archived",

    updatedAt: new Date().toISOString(),
  });
}

/*
 * =========================================
 * Restore Complete Profile
 * =========================================
 */

export async function restoreProfile() {
  const profile = readStoredProfile();

  return saveValidatedProfile({
    ...profile,

    status: "active",

    updatedAt: new Date().toISOString(),
  });
}

/*
 * =========================================
 * Validate Profile Draft
 * =========================================
 */

export async function validateProfileDraft(profileData) {
  const currentProfile = readStoredProfile();

  const candidate = {
    ...currentProfile,
    ...profileData,

    preferences: {
      ...currentProfile.preferences,
      ...profileData?.preferences,
    },

    visibility: {
      ...currentProfile.visibility,
      ...profileData?.visibility,
    },
  };

  return validateProfile(candidate);
}

/*
 * =========================================
 * Reset Profile
 * =========================================
 */

export async function resetProfile(fallbackProfile = null) {
  return resetStoredProfile(fallbackProfile);
}

/*
 * =========================================
 * Delete Complete Profile
 * =========================================
 *
 * This removes the local Profile record.
 * Later, the backend version should require
 * authentication and explicit confirmation.
 */

export async function deleteProfile() {
  const currentProfile = readStoredProfile();

  const removalResult = removeStoredProfile();

  return {
    ...removalResult,

    profileId: currentProfile.id,

    deleted: true,
  };
}

/*
 * =========================================
 * Initialize Empty Profile
 * =========================================
 */

export async function createInitialProfile(initialValues = {}) {
  const profile = createProfile({
    ...createEmptyProfile(),
    ...initialValues,
  });

  assertValidProfile(profile);

  return replaceStoredProfile(profile);
}

/*
 * =========================================
 * Public Configuration
 * =========================================
 */

export const PROFILE_COLLECTION_PRIMARY_PREFERENCES = {
  ...PRIMARY_PREFERENCE_BY_COLLECTION,
};
