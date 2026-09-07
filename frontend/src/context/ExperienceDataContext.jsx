import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  archiveExperience as archiveExperienceService,
  createExperience as createExperienceService,
  deleteExperience as deleteExperienceService,
  getExperienceById as getExperienceByIdService,
  getExperiences as getExperiencesService,
  restoreExperience as restoreExperienceService,
  updateExperience as updateExperienceService,
  validateExperienceDraft as validateExperienceDraftService,
} from "../services/Experience/experienceService.js";

/*
 * =========================================
 * Context
 * =========================================
 */

const ExperienceDataContext = createContext(null);

/*
 * =========================================
 * Default Status
 * =========================================
 */

const INITIAL_OPERATION_STATE = {
  type: "",
  experienceId: "",
  status: "idle",
};

/*
 * =========================================
 * Error Normalization
 * =========================================
 */

function normalizeContextError(error) {
  return {
    message:
      error?.publicMessage ||
      error?.message ||
      "An unexpected experience-management error occurred.",

    code: error?.code || "EXPERIENCE_OPERATION_FAILED",

    status: Number(error?.status) || 500,

    errors: Array.isArray(error?.errors) ? error.errors : [],

    fieldErrors:
      error?.fieldErrors && typeof error.fieldErrors === "object"
        ? error.fieldErrors
        : {},

    validation: error?.validation || null,

    originalError: error,
  };
}

/*
 * =========================================
 * Provider
 * =========================================
 */

export function ExperienceDataProvider({ children }) {
  const [experiences, setExperiences] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadStatus, setLoadStatus] = useState("idle");

  const [saveStatus, setSaveStatus] = useState("idle");

  const [error, setError] = useState(null);

  const [operation, setOperation] = useState(INITIAL_OPERATION_STATE);

  /*
   * =========================================
   * Error Management
   * =========================================
   */

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetSaveStatus = useCallback(() => {
    setSaveStatus("idle");
  }, []);

  const resetOperation = useCallback(() => {
    setOperation(INITIAL_OPERATION_STATE);
  }, []);

  /*
   * =========================================
   * Load Experiences
   * =========================================
   */

  const refreshExperiences = useCallback(
    async ({ includeArchived = true } = {}) => {
      try {
        setIsLoading(true);
        setLoadStatus("loading");
        setError(null);

        const loadedExperiences = await getExperiencesService({
          includeArchived,
        });

        setExperiences(
          Array.isArray(loadedExperiences) ? loadedExperiences : [],
        );

        setLoadStatus("success");

        return loadedExperiences;
      } catch (loadError) {
        const normalizedError = normalizeContextError(loadError);

        console.error("Unable to load experiences:", loadError);

        setExperiences([]);
        setLoadStatus("error");
        setError(normalizedError);

        throw loadError;
      } finally {
        setIsLoading(false);
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

    const loadInitialExperiences = async () => {
      try {
        setIsLoading(true);
        setLoadStatus("loading");
        setError(null);

        const loadedExperiences = await getExperiencesService({
          includeArchived: true,
        });

        if (!isActive) {
          return;
        }

        setExperiences(
          Array.isArray(loadedExperiences) ? loadedExperiences : [],
        );

        setLoadStatus("success");
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        console.error("Unable to load experiences:", loadError);

        setExperiences([]);
        setLoadStatus("error");

        setError(normalizeContextError(loadError));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadInitialExperiences();

    return () => {
      isActive = false;
    };
  }, []);

  /*
   * =========================================
   * Get Experience
   * =========================================
   */

  const getExperienceById = useCallback(
    async (experienceId) => {
      /*
       * First use the existing context state to
       * avoid an unnecessary service request.
       */

      const existingExperience = experiences.find(
        (experience) => experience.id === experienceId,
      );

      if (existingExperience) {
        return existingExperience;
      }

      try {
        setError(null);

        return await getExperienceByIdService(experienceId);
      } catch (getError) {
        console.error("Unable to get experience:", getError);

        setError(normalizeContextError(getError));

        throw getError;
      }
    },
    [experiences],
  );

  /*
   * =========================================
   * Create Experience
   * =========================================
   */

  const createExperience = useCallback(async (experienceData) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "create",
        experienceId: "",
        status: "loading",
      });

      const createdExperience = await createExperienceService(experienceData);

      setExperiences((currentExperiences) => [
        createdExperience,

        ...currentExperiences.filter(
          (experience) => experience.id !== createdExperience.id,
        ),
      ]);

      setSaveStatus("success");

      setOperation({
        type: "create",
        experienceId: createdExperience.id,
        status: "success",
      });

      return createdExperience;
    } catch (createError) {
      console.error("Unable to create experience:", createError);

      setSaveStatus("error");

      setOperation({
        type: "create",
        experienceId: "",
        status: "error",
      });

      setError(normalizeContextError(createError));

      throw createError;
    }
  }, []);

  /*
   * =========================================
   * Update Experience
   * =========================================
   */

  const updateExperience = useCallback(async (experienceId, updates) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "update",
        experienceId,
        status: "loading",
      });

      const updatedExperience = await updateExperienceService(
        experienceId,
        updates,
      );

      setExperiences((currentExperiences) =>
        currentExperiences.map((experience) =>
          experience.id === experienceId ? updatedExperience : experience,
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "update",
        experienceId,
        status: "success",
      });

      return updatedExperience;
    } catch (updateError) {
      console.error("Unable to update experience:", updateError);

      setSaveStatus("error");

      setOperation({
        type: "update",
        experienceId,
        status: "error",
      });

      setError(normalizeContextError(updateError));

      throw updateError;
    }
  }, []);

  /*
   * =========================================
   * Archive Experience
   * =========================================
   */

  const archiveExperience = useCallback(async (experienceId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "archive",
        experienceId,
        status: "loading",
      });

      const archivedExperience = await archiveExperienceService(experienceId);

      setExperiences((currentExperiences) =>
        currentExperiences.map((experience) =>
          experience.id === experienceId ? archivedExperience : experience,
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "archive",
        experienceId,
        status: "success",
      });

      return archivedExperience;
    } catch (archiveError) {
      console.error("Unable to archive experience:", archiveError);

      setSaveStatus("error");

      setOperation({
        type: "archive",
        experienceId,
        status: "error",
      });

      setError(normalizeContextError(archiveError));

      throw archiveError;
    }
  }, []);

  /*
   * =========================================
   * Restore Experience
   * =========================================
   */

  const restoreExperience = useCallback(async (experienceId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "restore",
        experienceId,
        status: "loading",
      });

      const restoredExperience = await restoreExperienceService(experienceId);

      setExperiences((currentExperiences) =>
        currentExperiences.map((experience) =>
          experience.id === experienceId ? restoredExperience : experience,
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "restore",
        experienceId,
        status: "success",
      });

      return restoredExperience;
    } catch (restoreError) {
      console.error("Unable to restore experience:", restoreError);

      setSaveStatus("error");

      setOperation({
        type: "restore",
        experienceId,
        status: "error",
      });

      setError(normalizeContextError(restoreError));

      throw restoreError;
    }
  }, []);

  /*
   * =========================================
   * Delete Experience
   * =========================================
   */

  const deleteExperience = useCallback(async (experienceId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "delete",
        experienceId,
        status: "loading",
      });

      const deletionResult = await deleteExperienceService(experienceId);

      setExperiences((currentExperiences) =>
        currentExperiences.filter(
          (experience) => experience.id !== experienceId,
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "delete",
        experienceId,
        status: "success",
      });

      return deletionResult;
    } catch (deleteError) {
      console.error("Unable to delete experience:", deleteError);

      setSaveStatus("error");

      setOperation({
        type: "delete",
        experienceId,
        status: "error",
      });

      setError(normalizeContextError(deleteError));

      throw deleteError;
    }
  }, []);

  /*
   * =========================================
   * Validate Draft
   * =========================================
   */

  const validateExperienceDraft = useCallback(async (experienceData) => {
    try {
      return await validateExperienceDraftService(experienceData);
    } catch (validationError) {
      console.error("Unable to validate experience:", validationError);

      setError(normalizeContextError(validationError));

      throw validationError;
    }
  }, []);

  /*
   * =========================================
   * Derived Collections
   * =========================================
   */

  const activeExperiences = useMemo(
    () => experiences.filter((experience) => experience.status !== "archived"),
    [experiences],
  );

  const archivedExperiences = useMemo(
    () => experiences.filter((experience) => experience.status === "archived"),
    [experiences],
  );

  const currentExperiences = useMemo(
    () =>
      activeExperiences.filter(
        (experience) => experience.dates?.isCurrent === true,
      ),
    [activeExperiences],
  );

  const previousExperiences = useMemo(
    () =>
      activeExperiences.filter(
        (experience) => experience.dates?.isCurrent !== true,
      ),
    [activeExperiences],
  );

  /*
   * =========================================
   * Context Value
   * =========================================
   */

  const contextValue = useMemo(
    () => ({
      /*
       * Records
       */

      experiences,
      activeExperiences,
      archivedExperiences,
      currentExperiences,
      previousExperiences,

      /*
       * Status
       */

      isLoading,
      loadStatus,
      saveStatus,
      operation,
      error,

      /*
       * Read operations
       */

      refreshExperiences,
      getExperienceById,

      /*
       * Write operations
       */

      createExperience,
      updateExperience,
      archiveExperience,
      restoreExperience,
      deleteExperience,

      /*
       * Validation
       */

      validateExperienceDraft,

      /*
       * Status management
       */

      clearError,
      resetSaveStatus,
      resetOperation,
    }),
    [
      experiences,
      activeExperiences,
      archivedExperiences,
      currentExperiences,
      previousExperiences,
      isLoading,
      loadStatus,
      saveStatus,
      operation,
      error,
      refreshExperiences,
      getExperienceById,
      createExperience,
      updateExperience,
      archiveExperience,
      restoreExperience,
      deleteExperience,
      validateExperienceDraft,
      clearError,
      resetSaveStatus,
      resetOperation,
    ],
  );

  return (
    <ExperienceDataContext.Provider value={contextValue}>
      {children}
    </ExperienceDataContext.Provider>
  );
}

/*
 * =========================================
 * Context Hook
 * =========================================
 */

export function useExperienceData() {
  const context = useContext(ExperienceDataContext);

  if (!context) {
    throw new Error(
      "useExperienceData must be used inside ExperienceDataProvider.",
    );
  }

  return context;
}
