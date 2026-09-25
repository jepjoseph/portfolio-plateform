import { apiGet, apiPut } from "../apiClient.js";
import {
  createEmptyProfessionalTitle,
  createEmptyProfile,
  createEmptyProfileInformationItem,
  createEmptyProfilePicture,
  normalizeProfile,
} from "../../models/profileModel.js";
import { assertValidProfile, validateProfile } from "./profileValidation.js";
import { isProfileCollectionName } from "../../config/profileConfig.js";

const PRIMARY_BY_COLLECTION = {
  professionalTitles: "primaryProfessionalTitleId",
  emails: "primaryEmailId",
  phones: "primaryPhoneId",
  websites: "primaryWebsiteId",
  locations: "primaryLocationId",
  socialLinks: "primarySocialLinkId",
  profilePictures: "primaryProfilePictureId",
};

function normalizeResponse(response) {
  return {
    status: response?.status || "success",
    message: response?.message || "",
    ...(response?.data || {}),
  };
}

function createServiceError(message, code, status = 400) {
  const error = new Error(message);
  error.name = "ProfileServiceError";
  error.code = code;
  error.status = status;
  error.publicMessage = message;
  return error;
}

function assertCollection(collectionName) {
  if (!isProfileCollectionName(collectionName)) {
    throw createServiceError(
      "The requested Profile information category is invalid.",
      "INVALID_PROFILE_COLLECTION",
    );
  }
}

function toUpdatePayload(profileValue) {
  const profile = normalizeProfile(profileValue);

  return {
    firstName: profile.firstName,
    middleName: profile.middleName,
    lastName: profile.lastName,
    professionalTitles: profile.professionalTitles,
    emails: profile.emails,
    phones: profile.phones,
    websites: profile.websites,
    locations: profile.locations,
    socialLinks: profile.socialLinks,
    profilePictures: profile.profilePictures,
    preferences: profile.preferences,
    visibility: profile.visibility,
    status: profile.status,
  };
}

async function save(profileValue, options = {}) {
  const payload = toUpdatePayload(profileValue);
  assertValidProfile(normalizeProfile(profileValue));
  const response = await apiPut("/profile/me", payload, options);
  return normalizeProfile(normalizeResponse(response).profile);
}

export async function getProfile(options = {}) {
  const response = await apiGet("/profile/me", options);
  return normalizeProfile(normalizeResponse(response).profile);
}

export async function updateProfile(profileData, options = {}) {
  return save(profileData, options);
}

export async function updateProfileIdentity(updates, options = {}) {
  const profile = await getProfile(options);
  return save({ ...profile, ...updates }, options);
}

export async function getProfileCollection(collectionName, options = {}) {
  assertCollection(collectionName);
  const profile = await getProfile(options);
  return profile[collectionName];
}

export async function getProfileItem(collectionName, itemId, options = {}) {
  const collection = await getProfileCollection(collectionName, options);
  const item = collection.find((value) => value.id === itemId);

  if (!item) {
    throw createServiceError(
      "The requested Profile information could not be found.",
      "PROFILE_ITEM_NOT_FOUND",
      404,
    );
  }

  return item;
}

function createItem(collectionName, values) {
  if (collectionName === "professionalTitles") {
    return { ...createEmptyProfessionalTitle(), ...values };
  }

  if (collectionName === "profilePictures") {
    return { ...createEmptyProfilePicture(), ...values };
  }

  return {
    ...createEmptyProfileInformationItem(collectionName),
    ...values,
  };
}

export async function addProfileItem(collectionName, values = {}, options = {}) {
  assertCollection(collectionName);
  const profile = await getProfile(options);
  const item = createItem(collectionName, {
    ...values,
    order: profile[collectionName].length,
  });
  const updatedProfile = await save(
    { ...profile, [collectionName]: [...profile[collectionName], item] },
    options,
  );
  return { item: updatedProfile[collectionName].find((entry) => entry.id === item.id), profile: updatedProfile };
}

export async function updateProfileItem(collectionName, itemId, updates = {}, options = {}) {
  assertCollection(collectionName);
  const profile = await getProfile(options);
  let found = false;
  const collection = profile[collectionName].map((item) => {
    if (item.id !== itemId) return item;
    found = true;
    return { ...item, ...updates, id: item.id, createdAt: item.createdAt, updatedAt: new Date().toISOString() };
  });
  if (!found) throw createServiceError("The requested Profile information could not be found.", "PROFILE_ITEM_NOT_FOUND", 404);
  const updatedProfile = await save({ ...profile, [collectionName]: collection }, options);
  return { item: updatedProfile[collectionName].find((item) => item.id === itemId), profile: updatedProfile };
}

export async function replaceProfileCollection(collectionName, values, options = {}) {
  assertCollection(collectionName);
  const profile = await getProfile(options);
  return save({ ...profile, [collectionName]: values }, options);
}

export async function reorderProfileCollection(collectionName, orderedItemIds, options = {}) {
  assertCollection(collectionName);
  const profile = await getProfile(options);
  const positions = new Map(orderedItemIds.map((id, index) => [id, index]));
  const collection = [...profile[collectionName]]
    .sort((a, b) => (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER))
    .map((item, order) => ({ ...item, order }));
  return save({ ...profile, [collectionName]: collection }, options);
}

export async function setPrimaryProfileItem(collectionName, itemId, options = {}) {
  assertCollection(collectionName);
  const profile = await getProfile(options);
  const item = profile[collectionName].find((value) => value.id === itemId && value.status === "active");
  if (!item) throw createServiceError("Only an active Profile item can be primary.", "PROFILE_PRIMARY_ITEM_INVALID");
  const updatedProfile = await save({
    ...profile,
    preferences: { ...profile.preferences, [PRIMARY_BY_COLLECTION[collectionName]]: itemId },
  }, options);
  return { item, profile: updatedProfile };
}

export function archiveProfileItem(collectionName, itemId, options = {}) {
  return updateProfileItem(collectionName, itemId, { status: "archived" }, options);
}

export function restoreProfileItem(collectionName, itemId, options = {}) {
  return updateProfileItem(collectionName, itemId, { status: "active" }, options);
}

export async function deleteProfileItem(collectionName, itemId, options = {}) {
  assertCollection(collectionName);
  const profile = await getProfile(options);
  const collection = profile[collectionName].filter((item) => item.id !== itemId).map((item, order) => ({ ...item, order }));
  if (collection.length === profile[collectionName].length) throw createServiceError("The requested Profile information could not be found.", "PROFILE_ITEM_NOT_FOUND", 404);
  const preferenceName = PRIMARY_BY_COLLECTION[collectionName];
  const preferences = { ...profile.preferences };
  if (preferences[preferenceName] === itemId) {
    preferences[preferenceName] = collection.find((item) => item.status === "active")?.id || "";
  }
  const updatedProfile = await save({ ...profile, [collectionName]: collection, preferences }, options);
  return { deleted: true, itemId, profile: updatedProfile };
}

export async function updateProfileVisibility(updates, options = {}) {
  const profile = await getProfile(options);
  return save({ ...profile, visibility: { ...profile.visibility, ...updates } }, options);
}

export async function archiveProfile(options = {}) {
  const profile = await getProfile(options);
  return save({ ...profile, status: "archived" }, options);
}

export async function restoreProfile(options = {}) {
  const profile = await getProfile(options);
  return save({ ...profile, status: "active" }, options);
}

export async function validateProfileDraft(profileData) {
  return validateProfile(normalizeProfile(profileData));
}

export async function resetProfile() {
  throw createServiceError(
    "Database Profiles cannot be reset without explicit account confirmation.",
    "PROFILE_RESET_NOT_AVAILABLE",
    409,
  );
}

export async function deleteProfile() {
  throw createServiceError(
    "The account Profile cannot be deleted independently from its user account.",
    "PROFILE_DELETE_NOT_AVAILABLE",
    409,
  );
}

export async function createInitialProfile(initialValues = {}, options = {}) {
  return save({ ...createEmptyProfile(), ...initialValues }, options);
}

export const PROFILE_COLLECTION_PRIMARY_PREFERENCES = {
  ...PRIMARY_BY_COLLECTION,
};

