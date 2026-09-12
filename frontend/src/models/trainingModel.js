import {
  TRAINING_FIELD_LIMITS,
  isValidTrainingCompletionStatus,
  isValidTrainingDeliveryFormat,
  isValidTrainingDocumentType,
  isValidTrainingProviderType,
  isValidTrainingSource,
  isValidTrainingStatus,
  isValidTrainingType,
} from "../config/trainingConfig.js";

import { isValidDocumentVisibility } from "../config/documentConfig.js";

/*
 * =========================================
 * Model Version
 * =========================================
 */

export const TRAINING_MODEL_VERSION = 1;

/*
 * =========================================
 * ID Creation
 * =========================================
 */

export function createTrainingId(prefix = "training") {
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

function normalizeNullableNumber(value, maximumValue = Infinity) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return Math.min(maximumValue, Math.max(0, numberValue));
}

function normalizeDate(value) {
  if (typeof value !== "string") {
    return "";
  }

  const text = value.trim();

  if (!/^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/.test(text)) {
    return "";
  }

  return text;
}

function normalizeIdentifierList(values, maximumItems) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map((value) =>
          typeof value === "string"
            ? value.trim()
            : String(value?.id || "").trim(),
        )
        .filter(Boolean),
    ),
  ].slice(0, maximumItems);
}

/*
 * =========================================
 * Instructor
 * =========================================
 */

export function createTrainingInstructor(value = {}) {
  const source =
    typeof value === "string"
      ? {
          name: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  return {
    id:
      normalizeText(source.id, 200) || createTrainingId("training-instructor"),

    name: normalizeText(source.name, TRAINING_FIELD_LIMITS.instructorName),

    title: normalizeText(source.title, TRAINING_FIELD_LIMITS.instructorTitle),

    organization: normalizeText(
      source.organization,
      TRAINING_FIELD_LIMITS.instructorOrganization,
    ),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeTrainingInstructors(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(createTrainingInstructor)
    .filter((instructor) => instructor.name)
    .slice(0, TRAINING_FIELD_LIMITS.maximumInstructors)
    .map((instructor, index) => ({
      ...instructor,
      order: index,
    }));
}

/*
 * =========================================
 * Topic
 * =========================================
 */

export function createTrainingTopic(value = {}) {
  const source =
    typeof value === "string"
      ? {
          name: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  return {
    id: normalizeText(source.id, 200) || createTrainingId("training-topic"),

    name: normalizeText(
      source.name || source.title,
      TRAINING_FIELD_LIMITS.topicName,
    ),

    description: normalizeText(
      source.description,
      TRAINING_FIELD_LIMITS.topicDescription,
    ),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeTrainingTopics(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(createTrainingTopic)
    .filter((topic) => topic.name)
    .slice(0, TRAINING_FIELD_LIMITS.maximumTopics)
    .map((topic, index) => ({
      ...topic,
      order: index,
    }));
}

/*
 * =========================================
 * Learning Outcome
 * =========================================
 */

export function createTrainingOutcome(value = {}) {
  const source =
    typeof value === "string"
      ? {
          text: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  return {
    id: normalizeText(source.id, 200) || createTrainingId("training-outcome"),

    text: normalizeText(
      source.text || source.description || source.value,
      TRAINING_FIELD_LIMITS.outcomeText,
    ),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeTrainingOutcomes(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(createTrainingOutcome)
    .filter((outcome) => outcome.text)
    .slice(0, TRAINING_FIELD_LIMITS.maximumLearningOutcomes)
    .map((outcome, index) => ({
      ...outcome,
      order: index,
    }));
}

/*
 * =========================================
 * Skill Relationship
 * =========================================
 */

export function createTrainingSkillRelationship(value = {}) {
  const source =
    typeof value === "string"
      ? {
          nameSnapshot: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  return {
    id: normalizeText(source.id, 200) || createTrainingId("training-skill"),

    skillId: normalizeText(source.skillId || source.profileSkillId, 200),

    nameSnapshot: normalizeText(
      source.nameSnapshot || source.name || source.label,
      TRAINING_FIELD_LIMITS.skillName,
    ),

    categorySnapshot: normalizeText(
      source.categorySnapshot || source.category,
      TRAINING_FIELD_LIMITS.skillCategory,
    ),

    typeSnapshot: normalizeText(
      source.typeSnapshot || source.type,
      TRAINING_FIELD_LIMITS.skillType,
    ),

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeTrainingSkillRelationships(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedRelationships = values
    .map(createTrainingSkillRelationship)
    .filter(
      (relationship) => relationship.skillId || relationship.nameSnapshot,
    );

  const uniqueRelationships = normalizedRelationships.filter(
    (relationship, index, collection) => {
      const identity = (
        relationship.skillId || relationship.nameSnapshot
      ).toLocaleLowerCase();

      return (
        collection.findIndex((candidate) => {
          const candidateIdentity = (
            candidate.skillId || candidate.nameSnapshot
          ).toLocaleLowerCase();

          return candidateIdentity === identity;
        }) === index
      );
    },
  );

  return uniqueRelationships
    .slice(0, TRAINING_FIELD_LIMITS.maximumSkills)
    .map((relationship, index) => ({
      ...relationship,
      order: index,
    }));
}

/*
 * =========================================
 * Supporting Document
 * =========================================
 */

export function createTrainingDocument(value = {}) {
  const source =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return {
    id: normalizeText(source.id, 200) || createTrainingId("training-document"),

    documentType: isValidTrainingDocumentType(source.documentType)
      ? source.documentType
      : "supporting-evidence",

    name: normalizeText(source.name || source.title, 250),

    description: normalizeText(source.description, 1000),

    fileName: normalizeText(source.fileName, 500),

    mimeType: normalizeText(source.mimeType || source.fileType, 200),

    fileSize: normalizeNullableNumber(source.fileSize),

    storageProvider:
      normalizeText(source.storageProvider, 100) ||
      (source.storageKey ? "indexed-db" : ""),

    storageKey: normalizeText(source.storageKey, 500),

    fileUrl: normalizeText(source.fileUrl || source.url, 2000),

    uploadedAt: normalizeText(source.uploadedAt, 100),

    visibility: isValidDocumentVisibility(source.visibility)
      ? source.visibility
      : "private",

    order:
      Number.isInteger(source.order) && source.order >= 0 ? source.order : 0,
  };
}

function normalizeTrainingDocuments(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedDocuments = values
    .map(createTrainingDocument)
    .filter(
      (document) =>
        document.name ||
        document.fileName ||
        document.storageKey ||
        document.fileUrl,
    );

  const uniqueDocuments = normalizedDocuments.filter(
    (document, index, collection) => {
      const identity =
        document.storageKey ||
        document.fileUrl ||
        document.id ||
        document.fileName;

      return (
        collection.findIndex((candidate) => {
          const candidateIdentity =
            candidate.storageKey ||
            candidate.fileUrl ||
            candidate.id ||
            candidate.fileName;

          return candidateIdentity === identity;
        }) === index
      );
    },
  );

  return uniqueDocuments
    .slice(0, TRAINING_FIELD_LIMITS.maximumDocuments)
    .map((document, index) => ({
      ...document,
      order: index,
    }));
}

/*
 * =========================================
 * Empty Training
 * =========================================
 */

export function createEmptyTraining() {
  const timestamp = new Date().toISOString();

  return {
    modelVersion: TRAINING_MODEL_VERSION,

    id: createTrainingId(),

    title: "",

    trainingType: "professional-course",

    provider: {
      name: "",
      type: "",
      website: "",
    },

    delivery: {
      format: "in-person",

      location: {
        city: "",
        stateRegion: "",
        country: "",
        displayValue: "",
      },
    },

    dates: {
      startDate: "",
      endDate: "",
      isCurrent: false,
    },

    completion: {
      status: "completed",
      durationHours: null,

      certificateEarned: false,

      credentialId: "",
      credentialUrl: "",
    },

    description: "",

    instructors: [],

    topics: [],

    learningOutcomes: [],

    skillRelationships: [],

    supportingDocuments: [],

    relatedEducationIds: [],

    relatedCertificationIds: [],

    relatedExperienceIds: [],

    relatedProjectIds: [],

    visibility: {
      showProvider: true,
      showProviderWebsite: true,
      showDeliveryFormat: true,
      showLocation: true,
      showDates: true,
      showDuration: true,
      showDescription: true,
      showInstructors: true,
      showTopics: true,
      showLearningOutcomes: true,
      showSkills: true,
      showCredential: true,
      showSupportingDocuments: false,
    },

    privateInformation: {
      notes: "",
    },

    source: "manual",

    sourceContext: "",

    status: "active",

    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/*
 * =========================================
 * Normalize Training
 * =========================================
 */

export function normalizeTraining(value = {}) {
  const defaults = createEmptyTraining();

  const source =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  const provider =
    source.provider &&
    typeof source.provider === "object" &&
    !Array.isArray(source.provider)
      ? source.provider
      : {};

  const delivery =
    source.delivery &&
    typeof source.delivery === "object" &&
    !Array.isArray(source.delivery)
      ? source.delivery
      : {};

  const location =
    delivery.location &&
    typeof delivery.location === "object" &&
    !Array.isArray(delivery.location)
      ? delivery.location
      : source.location &&
          typeof source.location === "object" &&
          !Array.isArray(source.location)
        ? source.location
        : {};

  const dates =
    source.dates &&
    typeof source.dates === "object" &&
    !Array.isArray(source.dates)
      ? source.dates
      : {};

  const completion =
    source.completion &&
    typeof source.completion === "object" &&
    !Array.isArray(source.completion)
      ? source.completion
      : {};

  const visibility =
    source.visibility &&
    typeof source.visibility === "object" &&
    !Array.isArray(source.visibility)
      ? source.visibility
      : {};

  const privateInformation =
    source.privateInformation &&
    typeof source.privateInformation === "object" &&
    !Array.isArray(source.privateInformation)
      ? source.privateInformation
      : {};

  const trainingType = isValidTrainingType(source.trainingType)
    ? source.trainingType
    : defaults.trainingType;

  const providerType = isValidTrainingProviderType(provider.type ?? "")
    ? (provider.type ?? "")
    : defaults.provider.type;

  const deliveryFormat = isValidTrainingDeliveryFormat(delivery.format)
    ? delivery.format
    : defaults.delivery.format;

  const completionStatus = isValidTrainingCompletionStatus(completion.status)
    ? completion.status
    : defaults.completion.status;

  const trainingStatus = isValidTrainingStatus(source.status)
    ? source.status
    : defaults.status;

  const trainingSource = isValidTrainingSource(source.source)
    ? source.source
    : defaults.source;

  const isCurrent =
    completionStatus === "in-progress" ||
    normalizeBoolean(dates.isCurrent, false);

  return {
    modelVersion: TRAINING_MODEL_VERSION,

    id: normalizeText(source.id, 200) || defaults.id,

    title: normalizeText(
      source.title || source.name,
      TRAINING_FIELD_LIMITS.title,
    ),

    trainingType,

    provider: {
      name: normalizeText(
        provider.name || source.providerName || source.organizationName,
        TRAINING_FIELD_LIMITS.providerName,
      ),

      type: providerType,

      website: normalizeText(
        provider.website || source.providerWebsite,
        TRAINING_FIELD_LIMITS.providerWebsite,
      ),
    },

    delivery: {
      format: deliveryFormat,

      location: {
        city: normalizeText(location.city, TRAINING_FIELD_LIMITS.city),

        stateRegion: normalizeText(
          location.stateRegion || location.state,
          TRAINING_FIELD_LIMITS.stateRegion,
        ),

        country: normalizeText(location.country, TRAINING_FIELD_LIMITS.country),

        displayValue: normalizeText(
          location.displayValue ||
            source.locationValue ||
            (typeof source.location === "string" ? source.location : ""),
          TRAINING_FIELD_LIMITS.locationDisplayValue,
        ),
      },
    },

    dates: {
      startDate: normalizeDate(dates.startDate || source.startDate),

      endDate: isCurrent ? "" : normalizeDate(dates.endDate || source.endDate),

      isCurrent,
    },

    completion: {
      status: completionStatus,

      durationHours: normalizeNullableNumber(
        completion.durationHours ?? source.durationHours,
        TRAINING_FIELD_LIMITS.maximumDurationHours,
      ),

      certificateEarned: normalizeBoolean(completion.certificateEarned, false),

      credentialId: normalizeText(
        completion.credentialId || source.credentialId,
        TRAINING_FIELD_LIMITS.credentialId,
      ),

      credentialUrl: normalizeText(
        completion.credentialUrl || source.credentialUrl,
        TRAINING_FIELD_LIMITS.credentialUrl,
      ),
    },

    description: normalizeText(
      source.description || source.overview,
      TRAINING_FIELD_LIMITS.description,
    ),

    instructors: normalizeTrainingInstructors(source.instructors),

    topics: normalizeTrainingTopics(source.topics || source.curriculum),

    learningOutcomes: normalizeTrainingOutcomes(
      source.learningOutcomes || source.outcomes,
    ),

    skillRelationships: normalizeTrainingSkillRelationships(
      source.skillRelationships || source.skills,
    ),

    supportingDocuments: normalizeTrainingDocuments(
      source.supportingDocuments || source.documents || source.attachments,
    ),

    relatedEducationIds: normalizeIdentifierList(
      source.relatedEducationIds,
      TRAINING_FIELD_LIMITS.maximumRelatedEducation,
    ),

    relatedCertificationIds: normalizeIdentifierList(
      source.relatedCertificationIds,
      TRAINING_FIELD_LIMITS.maximumRelatedCertifications,
    ),

    relatedExperienceIds: normalizeIdentifierList(
      source.relatedExperienceIds,
      TRAINING_FIELD_LIMITS.maximumRelatedExperiences,
    ),

    relatedProjectIds: normalizeIdentifierList(
      source.relatedProjectIds,
      TRAINING_FIELD_LIMITS.maximumRelatedProjects,
    ),

    visibility: {
      showProvider: normalizeBoolean(
        visibility.showProvider,
        defaults.visibility.showProvider,
      ),

      showProviderWebsite: normalizeBoolean(
        visibility.showProviderWebsite,
        defaults.visibility.showProviderWebsite,
      ),

      showDeliveryFormat: normalizeBoolean(
        visibility.showDeliveryFormat,
        defaults.visibility.showDeliveryFormat,
      ),

      showLocation: normalizeBoolean(
        visibility.showLocation,
        defaults.visibility.showLocation,
      ),

      showDates: normalizeBoolean(
        visibility.showDates,
        defaults.visibility.showDates,
      ),

      showDuration: normalizeBoolean(
        visibility.showDuration,
        defaults.visibility.showDuration,
      ),

      showDescription: normalizeBoolean(
        visibility.showDescription,
        defaults.visibility.showDescription,
      ),

      showInstructors: normalizeBoolean(
        visibility.showInstructors,
        defaults.visibility.showInstructors,
      ),

      showTopics: normalizeBoolean(
        visibility.showTopics,
        defaults.visibility.showTopics,
      ),

      showLearningOutcomes: normalizeBoolean(
        visibility.showLearningOutcomes,
        defaults.visibility.showLearningOutcomes,
      ),

      showSkills: normalizeBoolean(
        visibility.showSkills,
        defaults.visibility.showSkills,
      ),

      showCredential: normalizeBoolean(
        visibility.showCredential,
        defaults.visibility.showCredential,
      ),

      showSupportingDocuments: normalizeBoolean(
        visibility.showSupportingDocuments,
        defaults.visibility.showSupportingDocuments,
      ),
    },

    privateInformation: {
      notes: normalizeText(
        privateInformation.notes || source.privateNotes,
        TRAINING_FIELD_LIMITS.privateNotes,
      ),
    },

    source: trainingSource,

    sourceContext: normalizeText(
      source.sourceContext,
      TRAINING_FIELD_LIMITS.sourceContext,
    ),

    status: trainingStatus,

    createdAt: normalizeText(source.createdAt, 100) || defaults.createdAt,

    updatedAt: normalizeText(source.updatedAt, 100) || defaults.updatedAt,
  };
}

/*
 * =========================================
 * Create Training
 * =========================================
 */

export function createTraining(values = {}) {
  const timestamp = new Date().toISOString();

  return normalizeTraining({
    ...values,

    id: normalizeText(values?.id, 200) || createTrainingId(),

    createdAt: normalizeText(values?.createdAt, 100) || timestamp,

    updatedAt: timestamp,
  });
}

/*
 * =========================================
 * Update Training
 * =========================================
 */

export function updateTrainingModel(currentTraining, updates = {}) {
  const safeUpdates = updates && typeof updates === "object" ? updates : {};

  return normalizeTraining({
    ...currentTraining,
    ...safeUpdates,

    provider: {
      ...currentTraining?.provider,
      ...safeUpdates.provider,
    },

    delivery: {
      ...currentTraining?.delivery,
      ...safeUpdates.delivery,

      location: {
        ...currentTraining?.delivery?.location,
        ...safeUpdates.delivery?.location,
      },
    },

    dates: {
      ...currentTraining?.dates,
      ...safeUpdates.dates,
    },

    completion: {
      ...currentTraining?.completion,
      ...safeUpdates.completion,
    },

    visibility: {
      ...currentTraining?.visibility,
      ...safeUpdates.visibility,
    },

    privateInformation: {
      ...currentTraining?.privateInformation,
      ...safeUpdates.privateInformation,
    },

    id: currentTraining?.id,

    createdAt: currentTraining?.createdAt,

    updatedAt: new Date().toISOString(),
  });
}

/*
 * =========================================
 * Normalize Collection
 * =========================================
 */

export function normalizeTrainingCollection(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedTraining = values.map(normalizeTraining);

  return normalizedTraining.filter(
    (training, index, collection) =>
      collection.findIndex((candidate) => candidate.id === training.id) ===
      index,
  );
}

/*
 * =========================================
 * Public Training
 * =========================================
 */

export function createPublicTraining(value) {
  const training = normalizeTraining(value);

  const { privateInformation, sourceContext, ...publicTraining } = training;

  return {
    ...publicTraining,

    supportingDocuments: publicTraining.visibility.showSupportingDocuments
      ? publicTraining.supportingDocuments.filter(
          (document) => document.visibility === "public",
        )
      : [],
  };
}
