import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  archiveEducation as archiveEducationService,
  createEducation as createEducationService,
  deleteEducation as deleteEducationService,
  getEducationById as getEducationByIdService,
  getEducationRecords as getEducationRecordsService,
  replaceEducationRecords as replaceEducationRecordsService,
  restoreEducation as restoreEducationService,
  updateEducation as updateEducationService,
  validateEducationDraft as validateEducationDraftService,
} from "../services/Education/educationService.js";

import { EDUCATION_STORAGE_KEY } from "../services/Education/educationStorage.js";

import { sortEducation } from "../services/Education/educationUtils.js";

/*
 * =========================================
 * Context
 * =========================================
 */

const EducationDataContext = createContext(null);

/*
 * =========================================
 * Default Operation
 * =========================================
 */

const INITIAL_OPERATION = {
  type: "",
  educationId: "",
  status: "idle",
};

/*
 * =========================================
 * Error Normalization
 * =========================================
 */

function normalizeEducationContextError(error) {
  return {
    message:
      error?.publicMessage ||
      error?.message ||
      "An unexpected education-management error occurred.",

    code: error?.code || "EDUCATION_OPERATION_FAILED",

    status: Number(error?.status) || 500,

    errors: Array.isArray(error?.errors) ? error.errors : [],

    warnings: Array.isArray(error?.warnings) ? error.warnings : [],

    conflicts: Array.isArray(error?.conflicts) ? error.conflicts : [],

    fieldErrors:
      error?.fieldErrors && typeof error.fieldErrors === "object"
        ? error.fieldErrors
        : {},

    validation: error?.validation || null,

    details:
      error?.details && typeof error.details === "object"
        ? error.details
        : null,

    originalError: error,
  };
}

/*
 * =========================================
 * Collection Sorting
 * =========================================
 */

function sortEducationLibrary(educationRecords) {
  return sortEducation(
    Array.isArray(educationRecords) ? educationRecords : [],
    "newest",
  );
}

/*
 * =========================================
 * Provider
 * =========================================
 */

export function EducationDataProvider({ children }) {
  const [educationRecords, setEducationRecords] = useState([]);

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
   * Load Education Records
   * =========================================
   */

  const refreshEducation = useCallback(
    async ({ includeArchived = true, showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setIsLoading(true);
          setLoadStatus("loading");
        }

        setError(null);

        const loadedRecords = await getEducationRecordsService({
          includeArchived,
        });

        const nextRecords = sortEducationLibrary(loadedRecords);

        setEducationRecords(nextRecords);

        setLoadStatus("success");

        return nextRecords;
      } catch (loadError) {
        console.error("Unable to load education records:", loadError);

        setLoadStatus("error");

        setError(normalizeEducationContextError(loadError));

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

    const loadInitialEducation = async () => {
      try {
        setIsLoading(true);
        setLoadStatus("loading");
        setError(null);

        const loadedRecords = await getEducationRecordsService({
          includeArchived: true,
        });

        if (!isActive) {
          return;
        }

        setEducationRecords(sortEducationLibrary(loadedRecords));

        setLoadStatus("success");
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        console.error("Unable to load education records:", loadError);

        setEducationRecords([]);
        setLoadStatus("error");

        setError(normalizeEducationContextError(loadError));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadInitialEducation();

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
        event.key !== EDUCATION_STORAGE_KEY
      ) {
        return;
      }

      refreshEducation({
        includeArchived: true,
        showLoading: false,
      }).catch(() => {
        /*
         * The context already records
         * the loading error.
         */
      });
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshEducation]);

  /*
   * =========================================
   * Get Education By ID
   * =========================================
   */

  const getEducationById = useCallback(
    async (educationId) => {
      const existingRecord = educationRecords.find(
        (education) => education.id === educationId,
      );

      if (existingRecord) {
        return existingRecord;
      }

      try {
        setError(null);

        return await getEducationByIdService(educationId);
      } catch (getError) {
        console.error("Unable to get education record:", getError);

        setError(normalizeEducationContextError(getError));

        throw getError;
      }
    },
    [educationRecords],
  );

  /*
   * =========================================
   * Create Education
   * =========================================
   */

  const createEducation = useCallback(async (educationData) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "create",
        educationId: "",
        status: "loading",
      });

      const createdEducation = await createEducationService(educationData);

      setEducationRecords((currentRecords) =>
        sortEducationLibrary([
          createdEducation,

          ...currentRecords.filter(
            (education) => education.id !== createdEducation.id,
          ),
        ]),
      );

      setSaveStatus("success");

      setOperation({
        type: "create",
        educationId: createdEducation.id,
        status: "success",
      });

      return createdEducation;
    } catch (createError) {
      console.error("Unable to create education record:", createError);

      setSaveStatus("error");

      setOperation({
        type: "create",
        educationId: "",
        status: "error",
      });

      setError(normalizeEducationContextError(createError));

      throw createError;
    }
  }, []);

  /*
   * =========================================
   * Update Education
   * =========================================
   */

  const updateEducation = useCallback(async (educationId, updates) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "update",
        educationId,
        status: "loading",
      });

      const updatedEducation = await updateEducationService(
        educationId,
        updates,
      );

      setEducationRecords((currentRecords) =>
        sortEducationLibrary(
          currentRecords.map((education) =>
            education.id === educationId ? updatedEducation : education,
          ),
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "update",
        educationId,
        status: "success",
      });

      return updatedEducation;
    } catch (updateError) {
      console.error("Unable to update education record:", updateError);

      setSaveStatus("error");

      setOperation({
        type: "update",
        educationId,
        status: "error",
      });

      setError(normalizeEducationContextError(updateError));

      throw updateError;
    }
  }, []);

  /*
   * =========================================
   * Archive Education
   * =========================================
   */

  const archiveEducation = useCallback(async (educationId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "archive",
        educationId,
        status: "loading",
      });

      const archivedEducation = await archiveEducationService(educationId);

      setEducationRecords((currentRecords) =>
        sortEducationLibrary(
          currentRecords.map((education) =>
            education.id === educationId ? archivedEducation : education,
          ),
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "archive",
        educationId,
        status: "success",
      });

      return archivedEducation;
    } catch (archiveError) {
      console.error("Unable to archive education record:", archiveError);

      setSaveStatus("error");

      setOperation({
        type: "archive",
        educationId,
        status: "error",
      });

      setError(normalizeEducationContextError(archiveError));

      throw archiveError;
    }
  }, []);

  /*
   * =========================================
   * Restore Education
   * =========================================
   */

  const restoreEducation = useCallback(async (educationId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "restore",
        educationId,
        status: "loading",
      });

      const restoredEducation = await restoreEducationService(educationId);

      setEducationRecords((currentRecords) =>
        sortEducationLibrary(
          currentRecords.map((education) =>
            education.id === educationId ? restoredEducation : education,
          ),
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "restore",
        educationId,
        status: "success",
      });

      return restoredEducation;
    } catch (restoreError) {
      console.error("Unable to restore education record:", restoreError);

      setSaveStatus("error");

      setOperation({
        type: "restore",
        educationId,
        status: "error",
      });

      setError(normalizeEducationContextError(restoreError));

      throw restoreError;
    }
  }, []);

  /*
   * =========================================
   * Delete Education
   * =========================================
   */

  const deleteEducation = useCallback(async (educationId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "delete",
        educationId,
        status: "loading",
      });

      const deletionResult = await deleteEducationService(educationId);

      setEducationRecords((currentRecords) =>
        currentRecords.filter((education) => education.id !== educationId),
      );

      setSaveStatus("success");

      setOperation({
        type: "delete",
        educationId,
        status: "success",
      });

      return deletionResult;
    } catch (deleteError) {
      console.error("Unable to delete education record:", deleteError);

      setSaveStatus("error");

      setOperation({
        type: "delete",
        educationId,
        status: "error",
      });

      setError(normalizeEducationContextError(deleteError));

      throw deleteError;
    }
  }, []);

  /*
   * =========================================
   * Replace Collection
   * =========================================
   */

  const replaceEducationRecords = useCallback(async (educationValues) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "replace",
        educationId: "",
        status: "loading",
      });

      const replacedRecords =
        await replaceEducationRecordsService(educationValues);

      const sortedRecords = sortEducationLibrary(replacedRecords);

      setEducationRecords(sortedRecords);

      setSaveStatus("success");

      setOperation({
        type: "replace",
        educationId: "",
        status: "success",
      });

      return sortedRecords;
    } catch (replaceError) {
      console.error("Unable to replace education records:", replaceError);

      setSaveStatus("error");

      setOperation({
        type: "replace",
        educationId: "",
        status: "error",
      });

      setError(normalizeEducationContextError(replaceError));

      throw replaceError;
    }
  }, []);

  /*
   * =========================================
   * Draft Validation
   * =========================================
   */

  const validateEducationDraft = useCallback(async (educationData) => {
    try {
      return await validateEducationDraftService(educationData);
    } catch (validationError) {
      console.error("Unable to validate education record:", validationError);

      setError(normalizeEducationContextError(validationError));

      throw validationError;
    }
  }, []);

  /*
   * =========================================
   * Derived Collections
   * =========================================
   */

  const activeEducationRecords = useMemo(
    () =>
      educationRecords.filter((education) => education.status !== "archived"),
    [educationRecords],
  );

  const archivedEducationRecords = useMemo(
    () =>
      educationRecords.filter((education) => education.status === "archived"),
    [educationRecords],
  );

  const currentEducationRecords = useMemo(
    () =>
      activeEducationRecords.filter(
        (education) => education.dates?.isCurrent === true,
      ),
    [activeEducationRecords],
  );

  const completedEducationRecords = useMemo(
    () =>
      activeEducationRecords.filter(
        (education) => education.dates?.isCurrent !== true,
      ),
    [activeEducationRecords],
  );

  const educationById = useMemo(
    () =>
      new Map(educationRecords.map((education) => [education.id, education])),
    [educationRecords],
  );

  const educationByCredentialType = useMemo(
    () =>
      activeEducationRecords.reduce((groups, education) => {
        const credentialType = education.credential?.type || "other";

        if (!groups[credentialType]) {
          groups[credentialType] = [];
        }

        groups[credentialType].push(education);

        return groups;
      }, {}),
    [activeEducationRecords],
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

      educationRecords,
      activeEducationRecords,
      archivedEducationRecords,
      currentEducationRecords,
      completedEducationRecords,
      educationById,
      educationByCredentialType,

      /*
       * Compatibility aliases
       */

      education: educationRecords,
      activeEducation: activeEducationRecords,
      archivedEducation: archivedEducationRecords,
      currentEducation: currentEducationRecords,
      completedEducation: completedEducationRecords,

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

      refreshEducation,
      getEducationById,

      /*
       * Write Operations
       */

      createEducation,
      updateEducation,
      archiveEducation,
      restoreEducation,
      deleteEducation,
      replaceEducationRecords,

      /*
       * Validation
       */

      validateEducationDraft,

      /*
       * Status Management
       */

      clearError,
      resetSaveStatus,
      resetOperation,
    }),
    [
      educationRecords,
      activeEducationRecords,
      archivedEducationRecords,
      currentEducationRecords,
      completedEducationRecords,
      educationById,
      educationByCredentialType,
      isLoading,
      loadStatus,
      saveStatus,
      operation,
      error,
      refreshEducation,
      getEducationById,
      createEducation,
      updateEducation,
      archiveEducation,
      restoreEducation,
      deleteEducation,
      replaceEducationRecords,
      validateEducationDraft,
      clearError,
      resetSaveStatus,
      resetOperation,
    ],
  );

  return (
    <EducationDataContext.Provider value={contextValue}>
      {children}
    </EducationDataContext.Provider>
  );
}

/*
 * =========================================
 * Context Hook
 * =========================================
 */

export function useEducationData() {
  const context = useContext(EducationDataContext);

  if (!context) {
    throw new Error(
      "useEducationData must be used inside EducationDataProvider.",
    );
  }

  return context;
}
