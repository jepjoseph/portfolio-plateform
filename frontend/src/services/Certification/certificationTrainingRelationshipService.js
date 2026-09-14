import {
  createTrainingCertificationRelationship,
  normalizeTrainingCollection,
} from "../../models/trainingModel.js";

import {
  createCertificationTrainingRelationship,
  normalizeCertification,
  normalizeCertificationCollection,
} from "../../models/certificationModel.js";

import {
  readStoredTraining,
  replaceStoredTraining,
} from "../Training/trainingStorage.js";

import {
  readStoredCertifications,
  replaceStoredCertifications,
} from "./certificationStorage.js";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function createIdSet(values) {
  return new Set(
    getArray(values)
      .map((value) => getText(value))
      .filter(Boolean),
  );
}

/*
 * =========================================
 * Relationship Error
 * =========================================
 */

function createRelationshipError(
  code,
  message,
  publicMessage,
  details = {},
  cause = null,
) {
  const error = new Error(message);

  error.name = "TrainingCertificationRelationshipError";
  error.code = code;
  error.status = 409;
  error.publicMessage = publicMessage;

  Object.assign(error, details);

  if (cause) {
    error.cause = cause;
  }

  return error;
}

/*
 * =========================================
 * Relationship IDs
 * =========================================
 */

function getTrainingCertificationIds(training) {
  const relationships = Array.isArray(training?.certificationRelationships)
    ? training.certificationRelationships
    : getArray(training?.relatedCertificationIds).map((certificationId) => ({
        certificationId,
      }));

  return [
    ...new Set(
      relationships
        .map((relationship) =>
          getText(
            relationship?.certificationId ||
              relationship?.certificationRecordId,
          ),
        )
        .filter(Boolean),
    ),
  ];
}

function getCertificationTrainingIds(certification) {
  return [
    ...new Set(
      getArray(certification?.relatedRecords?.trainingRelationships)
        .map((relationship) =>
          getText(relationship?.trainingId || relationship?.trainingRecordId),
        )
        .filter(Boolean),
    ),
  ];
}

/*
 * =========================================
 * Collection Lookup
 * =========================================
 */

function createRecordMap(records) {
  return new Map(
    getArray(records)
      .filter((record) => getText(record?.id))
      .map((record) => [record.id, record]),
  );
}

function requireTraining(trainingMap, trainingId) {
  const training = trainingMap.get(trainingId);

  if (!training) {
    throw createRelationshipError(
      "TRAINING_RELATIONSHIP_NOT_FOUND",
      `Training record "${trainingId}" could not be found during relationship synchronization.`,
      "A linked Training record could not be found.",
      {
        trainingId,
      },
    );
  }

  return training;
}

function requireCertification(certificationMap, certificationId) {
  const certification = certificationMap.get(certificationId);

  if (!certification) {
    throw createRelationshipError(
      "CERTIFICATION_RELATIONSHIP_NOT_FOUND",
      `Certification record "${certificationId}" could not be found during relationship synchronization.`,
      "A linked Certification record could not be found.",
      {
        certificationId,
      },
    );
  }

  return certification;
}

/*
 * =========================================
 * Snapshot Refresh
 * =========================================
 */

function refreshTrainingCertificationRelationships(training, certificationMap) {
  const certificationIds = getTrainingCertificationIds(training);

  const certificationRelationships = certificationIds.map(
    (certificationId, index) => {
      const certification = requireCertification(
        certificationMap,
        certificationId,
      );

      return createTrainingCertificationRelationship(certification, index);
    },
  );

  return {
    ...training,

    certificationRelationships,

    relatedCertificationIds: certificationRelationships.map(
      (relationship) => relationship.certificationId,
    ),

    updatedAt: new Date().toISOString(),
  };
}

function refreshCertificationTrainingRelationships(certification, trainingMap) {
  const trainingIds = getCertificationTrainingIds(certification);

  const trainingRelationships = trainingIds.map((trainingId, index) => {
    const training = requireTraining(trainingMap, trainingId);

    return createCertificationTrainingRelationship(training, index);
  });

  return normalizeCertification({
    ...certification,

    relatedRecords: {
      ...certification.relatedRecords,
      trainingRelationships,
    },

    updatedAt: new Date().toISOString(),
  });
}

/*
 * =========================================
 * Add or Remove One Relationship
 * =========================================
 */

function synchronizeCertificationWithTraining(
  certification,
  training,
  shouldBeLinked,
) {
  const currentRelationships = getArray(
    certification?.relatedRecords?.trainingRelationships,
  );

  const existingRelationship = currentRelationships.find(
    (relationship) => getText(relationship?.trainingId) === training.id,
  );

  /*
   * The Certification is not linked and does not
   * need to be linked. Preserve it unchanged.
   */

  if (!shouldBeLinked && !existingRelationship) {
    return certification;
  }

  const nextRelationships = currentRelationships.filter(
    (relationship) => getText(relationship?.trainingId) !== training.id,
  );

  if (shouldBeLinked) {
    nextRelationships.push(
      createCertificationTrainingRelationship(
        training,
        nextRelationships.length,
      ),
    );
  }

  return normalizeCertification({
    ...certification,

    relatedRecords: {
      ...certification.relatedRecords,

      trainingRelationships: nextRelationships,
    },

    updatedAt: new Date().toISOString(),
  });
}

function synchronizeTrainingWithCertification(
  training,
  certification,
  shouldBeLinked,
) {
  const currentRelationships = getArray(training?.certificationRelationships);

  const existingRelationship = currentRelationships.find(
    (relationship) =>
      getText(relationship?.certificationId) === certification.id,
  );

  /*
   * This Training is not linked and does not need
   * to be linked. Preserve the record unchanged.
   */

  if (!shouldBeLinked && !existingRelationship) {
    return training;
  }

  const nextRelationships = currentRelationships.filter(
    (relationship) =>
      getText(relationship?.certificationId) !== certification.id,
  );

  if (shouldBeLinked) {
    nextRelationships.push(
      createTrainingCertificationRelationship(
        certification,
        nextRelationships.length,
      ),
    );
  }

  const certificationRelationships = nextRelationships.map(
    (relationship, index) => ({
      ...relationship,
      order: index,
    }),
  );

  const certificationState = getText(certification?.credential?.state);

  const representsEarnedCertificate =
    shouldBeLinked && ["active", "expired"].includes(certificationState);

  return {
    ...training,

    certificationRelationships,

    relatedCertificationIds: certificationRelationships.map(
      (relationship) => relationship.certificationId,
    ),

    completion: {
      ...training.completion,

      certificateEarned: representsEarnedCertificate
        ? true
        : training.completion?.certificateEarned === true,
    },

    updatedAt: new Date().toISOString(),
  };
}

/*
 * =========================================
 * Application-Level Transaction
 * =========================================
 */

function commitCollections({
  originalTrainingRecords,
  originalCertificationRecords,
  nextTrainingRecords,
  nextCertificationRecords,
}) {
  let trainingWriteCompleted = false;
  let certificationWriteCompleted = false;

  try {
    const storedTrainingRecords = replaceStoredTraining(nextTrainingRecords);

    trainingWriteCompleted = true;

    const storedCertificationRecords = replaceStoredCertifications(
      nextCertificationRecords,
    );

    certificationWriteCompleted = true;

    return {
      trainingRecords: storedTrainingRecords,
      certificationRecords: storedCertificationRecords,
    };
  } catch (cause) {
    const rollbackErrors = [];

    if (trainingWriteCompleted || certificationWriteCompleted) {
      try {
        replaceStoredTraining(originalTrainingRecords);
      } catch (rollbackError) {
        rollbackErrors.push({
          collection: "training",
          error: rollbackError,
        });
      }

      try {
        replaceStoredCertifications(originalCertificationRecords);
      } catch (rollbackError) {
        rollbackErrors.push({
          collection: "certifications",
          error: rollbackError,
        });
      }
    }

    throw createRelationshipError(
      rollbackErrors.length > 0
        ? "TRAINING_CERTIFICATION_ROLLBACK_FAILED"
        : "TRAINING_CERTIFICATION_TRANSACTION_FAILED",

      "Training and Certification relationship synchronization failed.",

      rollbackErrors.length > 0
        ? "The relationship update failed and could not be completely restored. Reload both libraries before making more changes."
        : "The Training and Certification relationship could not be saved.",

      {
        rollbackErrors,
        trainingWriteCompleted,
        certificationWriteCompleted,
      },

      cause,
    );
  }
}

/*
 * =========================================
 * Training-Authoritative Synchronization
 * =========================================
 */

export function saveTrainingWithCertificationSync({
  trainingRecords,
  changedTrainingIds = [],
  deletedTrainingIds = [],
} = {}) {
  const originalTrainingRecords = readStoredTraining();

  const originalCertificationRecords = readStoredCertifications();

  let nextTrainingRecords = normalizeTrainingCollection(trainingRecords);

  let nextCertificationRecords = normalizeCertificationCollection(
    originalCertificationRecords,
  );

  const changedIds = createIdSet(changedTrainingIds);

  const deletedIds = createIdSet(deletedTrainingIds);

  const trainingMap = createRecordMap(nextTrainingRecords);

  const certificationMap = createRecordMap(nextCertificationRecords);

  /*
   * Remove deleted Training records from every
   * Certification relationship collection.
   */

  if (deletedIds.size > 0) {
    nextCertificationRecords = nextCertificationRecords.map((certification) => {
      const currentRelationships = getArray(
        certification?.relatedRecords?.trainingRelationships,
      );

      const remainingRelationships = currentRelationships.filter(
        (relationship) => !deletedIds.has(getText(relationship?.trainingId)),
      );

      if (remainingRelationships.length === currentRelationships.length) {
        return certification;
      }

      return normalizeCertification({
        ...certification,

        relatedRecords: {
          ...certification.relatedRecords,

          trainingRelationships: remainingRelationships,
        },

        updatedAt: new Date().toISOString(),
      });
    });
  }

  /*
   * For a Training save, Training is authoritative:
   * its selected Certification IDs determine which
   * Certification records should point back to it.
   */

  changedIds.forEach((trainingId) => {
    const training = requireTraining(trainingMap, trainingId);

    const selectedCertificationIds = new Set(
      getTrainingCertificationIds(training),
    );

    selectedCertificationIds.forEach((certificationId) => {
      requireCertification(certificationMap, certificationId);
    });

    nextCertificationRecords = nextCertificationRecords.map((certification) =>
      synchronizeCertificationWithTraining(
        certification,
        training,
        selectedCertificationIds.has(certification.id),
      ),
    );
  });

  /*
   * Refresh both snapshot directions after the
   * relationship membership is synchronized.
   */

  const refreshedCertificationMap = createRecordMap(nextCertificationRecords);

  nextTrainingRecords = nextTrainingRecords.map((training) =>
    changedIds.has(training.id)
      ? refreshTrainingCertificationRelationships(
          training,
          refreshedCertificationMap,
        )
      : training,
  );

  return commitCollections({
    originalTrainingRecords,
    originalCertificationRecords,
    nextTrainingRecords,
    nextCertificationRecords,
  });
}

/*
 * =========================================
 * Certification-Authoritative Synchronization
 * =========================================
 */

export function saveCertificationWithTrainingSync({
  certificationRecords,
  changedCertificationIds = [],
  deletedCertificationIds = [],
} = {}) {
  const originalTrainingRecords = readStoredTraining();

  const originalCertificationRecords = readStoredCertifications();

  let nextTrainingRecords = normalizeTrainingCollection(
    originalTrainingRecords,
  );

  let nextCertificationRecords =
    normalizeCertificationCollection(certificationRecords);

  const changedIds = createIdSet(changedCertificationIds);

  const deletedIds = createIdSet(deletedCertificationIds);

  const trainingMap = createRecordMap(nextTrainingRecords);

  const certificationMap = createRecordMap(nextCertificationRecords);

  /*
   * Remove deleted Certification records from
   * all Training records.
   */

  if (deletedIds.size > 0) {
    nextTrainingRecords = nextTrainingRecords.map((training) => {
      const remainingRelationships = getArray(
        training?.certificationRelationships,
      ).filter(
        (relationship) =>
          !deletedIds.has(getText(relationship?.certificationId)),
      );

      return {
        ...training,

        certificationRelationships: remainingRelationships,

        relatedCertificationIds: remainingRelationships.map(
          (relationship) => relationship.certificationId,
        ),
      };
    });
  }

  /*
   * For a Certification save, Certification is
   * authoritative: its Training relationships
   * determine which Training records point back.
   */

  changedIds.forEach((certificationId) => {
    const certification = requireCertification(
      certificationMap,
      certificationId,
    );

    const selectedTrainingIds = new Set(
      getCertificationTrainingIds(certification),
    );

    selectedTrainingIds.forEach((trainingId) => {
      requireTraining(trainingMap, trainingId);
    });

    nextTrainingRecords = nextTrainingRecords.map((training) =>
      synchronizeTrainingWithCertification(
        training,
        certification,
        selectedTrainingIds.has(training.id),
      ),
    );
  });

  const refreshedTrainingMap = createRecordMap(nextTrainingRecords);

  nextCertificationRecords = nextCertificationRecords.map((certification) =>
    changedIds.has(certification.id)
      ? refreshCertificationTrainingRelationships(
          certification,
          refreshedTrainingMap,
        )
      : certification,
  );

  return commitCollections({
    originalTrainingRecords,
    originalCertificationRecords,
    nextTrainingRecords,
    nextCertificationRecords,
  });
}

