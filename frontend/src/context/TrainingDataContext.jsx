import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  archiveTraining as archiveTrainingService,
  createTraining as createTrainingService,
  deleteTraining as deleteTrainingService,
  getTrainingById as getTrainingByIdService,
  getTrainingRecords as getTrainingRecordsService,
  replaceTrainingRecords as replaceTrainingRecordsService,
  restoreTraining as restoreTrainingService,
  updateTraining as updateTrainingService,
  validateTrainingDraft as validateTrainingDraftService,
} from "../services/Training/trainingService.js";

import { TRAINING_STORAGE_KEY } from "../services/Training/trainingStorage.js";

/*
 * =========================================
 * Context
 * =========================================
 */

const TrainingDataContext = createContext(null);

/*
 * =========================================
 * Initial Operation
 * =========================================
 */

const INITIAL_OPERATION = {
  type: "",
  trainingId: "",
  status: "idle",
};

/*
 * =========================================
 * Error Normalization
 * =========================================
 */

function normalizeTrainingContextError(error) {
  return {
    message:
      error?.publicMessage ||
      error?.message ||
      "An unexpected Training Library error occurred.",

    code: error?.code || "TRAINING_OPERATION_FAILED",

    status: Number(error?.status) || 500,

    errors: Array.isArray(error?.errors) ? error.errors : [],

    warnings: Array.isArray(error?.warnings) ? error.warnings : [],

    fieldErrors:
      error?.fieldErrors && typeof error.fieldErrors === "object"
        ? error.fieldErrors
        : {},

    validation:
      error?.validation && typeof error.validation === "object"
        ? error.validation
        : null,

    details:
      error?.details && typeof error.details === "object"
        ? error.details
        : null,

    originalError: error,
  };
}

/*
 * =========================================
 * Library Sorting
 * =========================================
 */

function getTrainingDateValue(training) {
  const value =
    training?.dates?.endDate ||
    training?.dates?.startDate ||
    training?.updatedAt ||
    "";

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortTrainingLibrary(trainingRecords = []) {
  return [...trainingRecords].sort((firstTraining, secondTraining) => {
    const firstCurrent =
      firstTraining?.dates?.isCurrent === true ||
      firstTraining?.completion?.status === "in-progress";

    const secondCurrent =
      secondTraining?.dates?.isCurrent === true ||
      secondTraining?.completion?.status === "in-progress";

    if (firstCurrent !== secondCurrent) {
      return firstCurrent ? -1 : 1;
    }

    const dateDifference =
      getTrainingDateValue(secondTraining) -
      getTrainingDateValue(firstTraining);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return String(firstTraining?.title || "").localeCompare(
      String(secondTraining?.title || ""),
      undefined,
      {
        sensitivity: "base",
      },
    );
  });
}

/*
 * =========================================
 * Provider
 * =========================================
 */

export function TrainingDataProvider({ children }) {
  const [trainingRecords, setTrainingRecords] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadStatus, setLoadStatus] = useState("idle");

  const [saveStatus, setSaveStatus] = useState("idle");

  const [error, setError] = useState(null);

  const [operation, setOperation] = useState(INITIAL_OPERATION);

  /*
   * =========================================
   * Status Management
   * =========================================
   */

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetSaveStatus = useCallback(() => {
    setSaveStatus("idle");
  }, []);

  const resetOperation = useCallback(() => {
    setOperation(INITIAL_OPERATION);
  }, []);

  /*
   * =========================================
   * Load Training Records
   * =========================================
   */

  const refreshTraining = useCallback(
    async ({ includeArchived = true, showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setIsLoading(true);
          setLoadStatus("loading");
        }

        setError(null);

        const loadedRecords = await getTrainingRecordsService({
          includeArchived,
        });

        const nextRecords = sortTrainingLibrary(
          Array.isArray(loadedRecords) ? loadedRecords : [],
        );

        setTrainingRecords(nextRecords);
        setLoadStatus("success");

        return nextRecords;
      } catch (loadError) {
        console.error("Unable to load training records:", loadError);

        setLoadStatus("error");
        setError(normalizeTrainingContextError(loadError));

        throw loadError;
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  /*
   * =========================================
   * Initial Load
   * =========================================
   */

  useEffect(() => {
    let isActive = true;

    const loadInitialTraining = async () => {
      try {
        setIsLoading(true);
        setLoadStatus("loading");
        setError(null);

        const loadedRecords = await getTrainingRecordsService({
          includeArchived: true,
        });

        if (!isActive) {
          return;
        }

        setTrainingRecords(
          sortTrainingLibrary(
            Array.isArray(loadedRecords) ? loadedRecords : [],
          ),
        );

        setLoadStatus("success");
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        console.error("Unable to load training records:", loadError);

        setTrainingRecords([]);
        setLoadStatus("error");
        setError(normalizeTrainingContextError(loadError));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadInitialTraining();

    return () => {
      isActive = false;
    };
  }, []);

  /*
   * =========================================
   * Cross-Tab Synchronization
   * =========================================
   */

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        event.storageArea !== window.localStorage ||
        event.key !== TRAINING_STORAGE_KEY
      ) {
        return;
      }

      refreshTraining({
        includeArchived: true,
        showLoading: false,
      }).catch(() => {
        /*
         * The context already records the error.
         */
      });
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshTraining]);

  /*
   * =========================================
   * Get Training By ID
   * =========================================
   */

  const getTrainingById = useCallback(
    async (trainingId) => {
      const existingTraining = trainingRecords.find(
        (training) => training.id === trainingId,
      );

      if (existingTraining) {
        return existingTraining;
      }

      try {
        setError(null);

        return await getTrainingByIdService(trainingId);
      } catch (getError) {
        console.error("Unable to retrieve training record:", getError);

        setError(normalizeTrainingContextError(getError));

        throw getError;
      }
    },
    [trainingRecords],
  );

  /*
   * =========================================
   * Create Training
   * =========================================
   */

  const createTraining = useCallback(async (trainingData) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "create",
        trainingId: "",
        status: "loading",
      });

      const createdTraining = await createTrainingService(trainingData);

      setTrainingRecords((currentRecords) =>
        sortTrainingLibrary([
          createdTraining,

          ...currentRecords.filter(
            (training) => training.id !== createdTraining.id,
          ),
        ]),
      );

      setSaveStatus("success");

      setOperation({
        type: "create",
        trainingId: createdTraining.id,
        status: "success",
      });

      return createdTraining;
    } catch (createError) {
      console.error("Unable to create training record:", createError);

      setSaveStatus("error");

      setOperation({
        type: "create",
        trainingId: "",
        status: "error",
      });

      setError(normalizeTrainingContextError(createError));

      throw createError;
    }
  }, []);

  /*
   * =========================================
   * Update Training
   * =========================================
   */

  const updateTraining = useCallback(async (trainingId, updates) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "update",
        trainingId,
        status: "loading",
      });

      const updatedTraining = await updateTrainingService(trainingId, updates);

      setTrainingRecords((currentRecords) =>
        sortTrainingLibrary(
          currentRecords.map((training) =>
            training.id === trainingId ? updatedTraining : training,
          ),
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "update",
        trainingId,
        status: "success",
      });

      return updatedTraining;
    } catch (updateError) {
      console.error("Unable to update training record:", updateError);

      setSaveStatus("error");

      setOperation({
        type: "update",
        trainingId,
        status: "error",
      });

      setError(normalizeTrainingContextError(updateError));

      throw updateError;
    }
  }, []);

  /*
   * =========================================
   * Archive Training
   * =========================================
   */

  const archiveTraining = useCallback(async (trainingId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "archive",
        trainingId,
        status: "loading",
      });

      const archivedTraining = await archiveTrainingService(trainingId);

      setTrainingRecords((currentRecords) =>
        sortTrainingLibrary(
          currentRecords.map((training) =>
            training.id === trainingId ? archivedTraining : training,
          ),
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "archive",
        trainingId,
        status: "success",
      });

      return archivedTraining;
    } catch (archiveError) {
      console.error("Unable to archive training record:", archiveError);

      setSaveStatus("error");

      setOperation({
        type: "archive",
        trainingId,
        status: "error",
      });

      setError(normalizeTrainingContextError(archiveError));

      throw archiveError;
    }
  }, []);

  /*
   * =========================================
   * Restore Training
   * =========================================
   */

  const restoreTraining = useCallback(async (trainingId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "restore",
        trainingId,
        status: "loading",
      });

      const restoredTraining = await restoreTrainingService(trainingId);

      setTrainingRecords((currentRecords) =>
        sortTrainingLibrary(
          currentRecords.map((training) =>
            training.id === trainingId ? restoredTraining : training,
          ),
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "restore",
        trainingId,
        status: "success",
      });

      return restoredTraining;
    } catch (restoreError) {
      console.error("Unable to restore training record:", restoreError);

      setSaveStatus("error");

      setOperation({
        type: "restore",
        trainingId,
        status: "error",
      });

      setError(normalizeTrainingContextError(restoreError));

      throw restoreError;
    }
  }, []);

  /*
   * =========================================
   * Delete Training
   * =========================================
   */

  const deleteTraining = useCallback(async (trainingId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "delete",
        trainingId,
        status: "loading",
      });

      const deletionResult = await deleteTrainingService(trainingId);

      setTrainingRecords((currentRecords) =>
        currentRecords.filter((training) => training.id !== trainingId),
      );

      setSaveStatus("success");

      setOperation({
        type: "delete",
        trainingId,
        status: "success",
      });

      return deletionResult;
    } catch (deleteError) {
      console.error("Unable to delete training record:", deleteError);

      setSaveStatus("error");

      setOperation({
        type: "delete",
        trainingId,
        status: "error",
      });

      setError(normalizeTrainingContextError(deleteError));

      throw deleteError;
    }
  }, []);

  /*
   * =========================================
   * Replace Training Library
   * =========================================
   */

  const replaceTrainingRecords = useCallback(async (trainingValues) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "replace",
        trainingId: "",
        status: "loading",
      });

      const replacedRecords =
        await replaceTrainingRecordsService(trainingValues);

      const nextRecords = sortTrainingLibrary(replacedRecords);

      setTrainingRecords(nextRecords);

      setSaveStatus("success");

      setOperation({
        type: "replace",
        trainingId: "",
        status: "success",
      });

      return nextRecords;
    } catch (replaceError) {
      console.error("Unable to replace Training Library:", replaceError);

      setSaveStatus("error");

      setOperation({
        type: "replace",
        trainingId: "",
        status: "error",
      });

      setError(normalizeTrainingContextError(replaceError));

      throw replaceError;
    }
  }, []);

  /*
   * =========================================
   * Draft Validation
   * =========================================
   */

  const validateTrainingDraft = useCallback(async (trainingData) => {
    try {
      return await validateTrainingDraftService(trainingData);
    } catch (validationError) {
      console.error("Unable to validate training record:", validationError);

      setError(normalizeTrainingContextError(validationError));

      throw validationError;
    }
  }, []);

  /*
   * =========================================
   * Derived Collections
   * =========================================
   */

  const activeTrainingRecords = useMemo(
    () => trainingRecords.filter((training) => training.status !== "archived"),
    [trainingRecords],
  );

  const archivedTrainingRecords = useMemo(
    () => trainingRecords.filter((training) => training.status === "archived"),
    [trainingRecords],
  );

  const plannedTrainingRecords = useMemo(
    () =>
      activeTrainingRecords.filter(
        (training) => training.completion?.status === "planned",
      ),
    [activeTrainingRecords],
  );

  const inProgressTrainingRecords = useMemo(
    () =>
      activeTrainingRecords.filter(
        (training) =>
          training.completion?.status === "in-progress" ||
          training.dates?.isCurrent === true,
      ),
    [activeTrainingRecords],
  );

  const completedTrainingRecords = useMemo(
    () =>
      activeTrainingRecords.filter(
        (training) => training.completion?.status === "completed",
      ),
    [activeTrainingRecords],
  );

  const pausedTrainingRecords = useMemo(
    () =>
      activeTrainingRecords.filter(
        (training) => training.completion?.status === "paused",
      ),
    [activeTrainingRecords],
  );

  const withdrawnTrainingRecords = useMemo(
    () =>
      activeTrainingRecords.filter(
        (training) => training.completion?.status === "withdrawn",
      ),
    [activeTrainingRecords],
  );

  const trainingById = useMemo(
    () => new Map(trainingRecords.map((training) => [training.id, training])),
    [trainingRecords],
  );

  const trainingByType = useMemo(
    () =>
      activeTrainingRecords.reduce((groups, training) => {
        const trainingType = training.trainingType || "other";

        if (!groups[trainingType]) {
          groups[trainingType] = [];
        }

        groups[trainingType].push(training);

        return groups;
      }, {}),
    [activeTrainingRecords],
  );

  const statistics = useMemo(
    () => ({
      total: trainingRecords.length,

      active: activeTrainingRecords.length,

      archived: archivedTrainingRecords.length,

      planned: plannedTrainingRecords.length,

      inProgress: inProgressTrainingRecords.length,

      completed: completedTrainingRecords.length,

      paused: pausedTrainingRecords.length,

      withdrawn: withdrawnTrainingRecords.length,

      withCredentials: activeTrainingRecords.filter(
        (training) =>
          training.completion?.certificateEarned === true ||
          Boolean(training.completion?.credentialId) ||
          Boolean(training.completion?.credentialUrl),
      ).length,

      withSkills: activeTrainingRecords.filter(
        (training) =>
          Array.isArray(training.skillRelationships) &&
          training.skillRelationships.length > 0,
      ).length,

      withDocuments: activeTrainingRecords.filter(
        (training) =>
          Array.isArray(training.supportingDocuments) &&
          training.supportingDocuments.length > 0,
      ).length,
    }),
    [
      trainingRecords,
      activeTrainingRecords,
      archivedTrainingRecords,
      plannedTrainingRecords,
      inProgressTrainingRecords,
      completedTrainingRecords,
      pausedTrainingRecords,
      withdrawnTrainingRecords,
    ],
  );

  /*
   * =========================================
   * Context Value
   * =========================================
   */

  const contextValue = useMemo(
    () => ({
      /*
       * Collections
       */

      trainingRecords,

      activeTrainingRecords,
      archivedTrainingRecords,

      plannedTrainingRecords,
      inProgressTrainingRecords,
      completedTrainingRecords,
      pausedTrainingRecords,
      withdrawnTrainingRecords,

      trainingById,
      trainingByType,

      statistics,

      /*
       * Status
       */

      isLoading,
      loadStatus,
      saveStatus,
      operation,
      error,

      /*
       * Read Operations
       */

      refreshTraining,
      getTrainingById,

      /*
       * Write Operations
       */

      createTraining,
      updateTraining,
      archiveTraining,
      restoreTraining,
      deleteTraining,
      replaceTrainingRecords,

      /*
       * Validation
       */

      validateTrainingDraft,

      /*
       * Status Management
       */

      clearError,
      resetSaveStatus,
      resetOperation,
    }),
    [
      trainingRecords,
      activeTrainingRecords,
      archivedTrainingRecords,
      plannedTrainingRecords,
      inProgressTrainingRecords,
      completedTrainingRecords,
      pausedTrainingRecords,
      withdrawnTrainingRecords,
      trainingById,
      trainingByType,
      statistics,
      isLoading,
      loadStatus,
      saveStatus,
      operation,
      error,
      refreshTraining,
      getTrainingById,
      createTraining,
      updateTraining,
      archiveTraining,
      restoreTraining,
      deleteTraining,
      replaceTrainingRecords,
      validateTrainingDraft,
      clearError,
      resetSaveStatus,
      resetOperation,
    ],
  );

  return (
    <TrainingDataContext.Provider value={contextValue}>
      {children}
    </TrainingDataContext.Provider>
  );
}

/*
 * =========================================
 * Context Hook
 * =========================================
 */

export function useTrainingData() {
  const context = useContext(TrainingDataContext);

  if (!context) {
    throw new Error(
      "useTrainingData must be used inside TrainingDataProvider.",
    );
  }

  return context;
}
