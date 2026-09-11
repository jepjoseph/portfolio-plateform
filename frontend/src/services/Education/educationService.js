import {
  createEmptyEducation,
  createEducation as createEducationModel,
  normalizeEducation,
  normalizeEducationCollection,
  updateEducationModel,
} from "../../models/educationModel.js";

import {
  assertValidEducation,
  validateEducation,
} from "./educationValidation.js";

import {
  readStoredEducation,
  replaceStoredEducation,
} from "./educationStorage.js";

/*
 * =========================================
 * Service Errors
 * =========================================
 */

function createEducationServiceError({
  message,
  publicMessage,
  code,
  status = 500,
  details = null,
}) {
  const error = new Error(message);

  error.name = "EducationServiceError";

  error.code = code;
  error.status = status;

  error.publicMessage = publicMessage;

  error.details = details;

  return error;
}

function createEducationNotFoundError(educationId) {
  return createEducationServiceError({
    message: `Education record "${educationId}" was not found.`,

    publicMessage: "The requested education record could not be found.",

    code: "EDUCATION_NOT_FOUND",

    status: 404,
  });
}

/*
 * =========================================
 * Candidate Creation
 * =========================================
 */

function createEducationCandidate(educationData = {}) {
  const defaults = createEmptyEducation();

  const source =
    educationData && typeof educationData === "object" ? educationData : {};

  return {
    ...defaults,
    ...source,

    institution: {
      ...defaults.institution,
      ...source.institution,
    },

    credential: {
      ...defaults.credential,
      ...source.credential,
    },

    location: {
      ...defaults.location,
      ...source.location,
    },

    dates: {
      ...defaults.dates,
      ...source.dates,
    },

    academic: {
      ...defaults.academic,
      ...source.academic,
    },

    visibility: {
      ...defaults.visibility,
      ...source.visibility,
    },

    privateInformation: {
      ...defaults.privateInformation,
      ...source.privateInformation,
    },
  };
}

/*
 * =========================================
 * Get Education Records
 * =========================================
 */

export async function getEducationRecords({ includeArchived = false } = {}) {
  const records = readStoredEducation();

  return includeArchived
    ? records
    : records.filter((education) => education.status !== "archived");
}

/*
 * Compatibility alias.
 */

export const getEducation = getEducationRecords;

/*
 * =========================================
 * Get Education By ID
 * =========================================
 */

export async function getEducationById(educationId) {
  if (!educationId) {
    throw createEducationServiceError({
      message: "An education ID is required.",

      publicMessage: "The education record could not be identified.",

      code: "EDUCATION_ID_REQUIRED",

      status: 400,
    });
  }

  const education = readStoredEducation().find(
    (record) => record.id === educationId,
  );

  if (!education) {
    throw createEducationNotFoundError(educationId);
  }

  return education;
}

/*
 * =========================================
 * Create Education
 * =========================================
 */

export async function createEducation(educationData) {
  const records = readStoredEducation();

  const candidate = createEducationCandidate(educationData);

  assertValidEducation(candidate);

  const education = createEducationModel(candidate);

  const duplicateId = records.some((record) => record.id === education.id);

  if (duplicateId) {
    throw createEducationServiceError({
      message: `Education ID "${education.id}" already exists.`,

      publicMessage:
        "This education record could not be created because its identifier already exists.",

      code: "EDUCATION_ID_CONFLICT",

      status: 409,
    });
  }

  replaceStoredEducation([education, ...records]);

  return education;
}

/*
 * =========================================
 * Update Education
 * =========================================
 */

export async function updateEducation(educationId, updates = {}) {
  if (!educationId) {
    throw createEducationServiceError({
      message: "An education ID is required.",

      publicMessage: "The education record could not be identified.",

      code: "EDUCATION_ID_REQUIRED",

      status: 400,
    });
  }

  const records = readStoredEducation();

  const recordIndex = records.findIndex(
    (education) => education.id === educationId,
  );

  if (recordIndex === -1) {
    throw createEducationNotFoundError(educationId);
  }

  const currentEducation = records[recordIndex];

  const safeUpdates = updates && typeof updates === "object" ? updates : {};

  const mergedEducation = {
    ...currentEducation,
    ...safeUpdates,

    institution: {
      ...currentEducation.institution,
      ...safeUpdates.institution,
    },

    credential: {
      ...currentEducation.credential,
      ...safeUpdates.credential,
    },

    location: {
      ...currentEducation.location,
      ...safeUpdates.location,
    },

    dates: {
      ...currentEducation.dates,
      ...safeUpdates.dates,
    },

    academic: {
      ...currentEducation.academic,
      ...safeUpdates.academic,
    },

    visibility: {
      ...currentEducation.visibility,
      ...safeUpdates.visibility,
    },

    privateInformation: {
      ...currentEducation.privateInformation,
      ...safeUpdates.privateInformation,
    },

    id: currentEducation.id,

    createdAt: currentEducation.createdAt,
  };

  assertValidEducation(mergedEducation);

  const updatedEducation = updateEducationModel(currentEducation, safeUpdates);

  const nextRecords = [...records];

  nextRecords[recordIndex] = updatedEducation;

  replaceStoredEducation(nextRecords);

  return updatedEducation;
}

/*
 * =========================================
 * Archive and Restore
 * =========================================
 */

export async function archiveEducation(educationId) {
  return updateEducation(educationId, {
    status: "archived",
  });
}

export async function restoreEducation(educationId) {
  return updateEducation(educationId, {
    status: "active",
  });
}

/*
 * =========================================
 * Delete Education
 * =========================================
 */

export async function deleteEducation(educationId) {
  if (!educationId) {
    throw createEducationServiceError({
      message: "An education ID is required.",

      publicMessage: "The education record could not be identified.",

      code: "EDUCATION_ID_REQUIRED",

      status: 400,
    });
  }

  const records = readStoredEducation();

  const recordToDelete = records.find(
    (education) => education.id === educationId,
  );

  if (!recordToDelete) {
    throw createEducationNotFoundError(educationId);
  }

  const remainingRecords = records.filter(
    (education) => education.id !== educationId,
  );

  replaceStoredEducation(remainingRecords);

  return {
    id: educationId,

    credentialName: recordToDelete.credential.name,

    institutionName: recordToDelete.institution.name,

    deleted: true,
  };
}

/*
 * =========================================
 * Draft Validation
 * =========================================
 */

export async function validateEducationDraft(educationData) {
  return validateEducation(createEducationCandidate(educationData));
}

/*
 * =========================================
 * Replace Collection
 * =========================================
 */

export async function replaceEducationRecords(educationValues) {
  if (!Array.isArray(educationValues)) {
    throw createEducationServiceError({
      message: "The replacement education collection must be an array.",

      publicMessage: "The education collection has an invalid format.",

      code: "INVALID_EDUCATION_COLLECTION",

      status: 400,
    });
  }

  const validatedRecords = educationValues.map((educationValue) => {
    const candidate = createEducationCandidate(educationValue);

    assertValidEducation(candidate);

    return normalizeEducation(candidate);
  });

  return replaceStoredEducation(normalizeEducationCollection(validatedRecords));
}
