import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  archiveSkill as archiveSkillService,
  checkSkillNameAvailability as checkSkillNameAvailabilityService,
  createSkill as createSkillService,
  deleteSkill as deleteSkillService,
  findOrCreateSkill as findOrCreateSkillService,
  getSkillById as getSkillByIdService,
  getSkills as getSkillsService,
  replaceSkills as replaceSkillsService,
  resolveSkillMatch as resolveSkillMatchService,
  restoreSkill as restoreSkillService,
  updateSkill as updateSkillService,
  validateSkillDraft as validateSkillDraftService,
} from "../services/Skill/skillService.js";

import { SKILL_STORAGE_KEY } from "../services/Skill/skillStorage.js";

/*
 * =========================================
 * Context
 * =========================================
 */

const SkillDataContext = createContext(null);

/*
 * =========================================
 * Default Operation
 * =========================================
 */

const INITIAL_OPERATION = {
  type: "",
  skillId: "",
  status: "idle",
};

/*
 * =========================================
 * Error Normalization
 * =========================================
 */

function normalizeSkillContextError(error) {
  return {
    message:
      error?.publicMessage ||
      error?.message ||
      "An unexpected Skill Library error occurred.",

    code: error?.code || "SKILL_OPERATION_FAILED",

    status: Number(error?.status) || 500,

    errors: Array.isArray(error?.errors) ? error.errors : [],

    warnings: Array.isArray(error?.warnings) ? error.warnings : [],

    conflicts: Array.isArray(error?.conflicts) ? error.conflicts : [],

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
 * Sort Library
 * =========================================
 */

function sortSkillLibrary(skills) {
  return [...skills].sort((firstSkill, secondSkill) =>
    firstSkill.name.localeCompare(secondSkill.name, undefined, {
      sensitivity: "base",
    }),
  );
}

/*
 * =========================================
 * Provider
 * =========================================
 */

export function SkillDataProvider({ children }) {
  const [skills, setSkills] = useState([]);

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
   * Load Skills
   * =========================================
   */

  const refreshSkills = useCallback(
    async ({ includeArchived = true, showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setIsLoading(true);
          setLoadStatus("loading");
        }

        setError(null);

        const loadedSkills = await getSkillsService({
          includeArchived,
        });

        const nextSkills = sortSkillLibrary(
          Array.isArray(loadedSkills) ? loadedSkills : [],
        );

        setSkills(nextSkills);
        setLoadStatus("success");

        return nextSkills;
      } catch (loadError) {
        console.error("Unable to load skills:", loadError);

        setLoadStatus("error");

        setError(normalizeSkillContextError(loadError));

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

    const loadInitialSkills = async () => {
      try {
        setIsLoading(true);
        setLoadStatus("loading");
        setError(null);

        const loadedSkills = await getSkillsService({
          includeArchived: true,
        });

        if (!isActive) {
          return;
        }

        setSkills(
          sortSkillLibrary(Array.isArray(loadedSkills) ? loadedSkills : []),
        );

        setLoadStatus("success");
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        console.error("Unable to load skills:", loadError);

        setSkills([]);
        setLoadStatus("error");

        setError(normalizeSkillContextError(loadError));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadInitialSkills();

    return () => {
      isActive = false;
    };
  }, []);

  /*
   * =========================================
   * Cross-Tab Synchronization
   * =========================================
   *
   * If the Skill Library changes in another browser
   * tab, reload it without showing the main loader.
   */

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        event.storageArea !== window.localStorage ||
        event.key !== SKILL_STORAGE_KEY
      ) {
        return;
      }

      refreshSkills({
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
  }, [refreshSkills]);

  /*
   * =========================================
   * Get Skill
   * =========================================
   */

  const getSkillById = useCallback(
    async (skillId) => {
      const existingSkill = skills.find((skill) => skill.id === skillId);

      if (existingSkill) {
        return existingSkill;
      }

      try {
        setError(null);

        return await getSkillByIdService(skillId);
      } catch (getError) {
        console.error("Unable to get skill:", getError);

        setError(normalizeSkillContextError(getError));

        throw getError;
      }
    },
    [skills],
  );

  /*
   * =========================================
   * Create Skill
   * =========================================
   */

  const createSkill = useCallback(async (skillData) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "create",
        skillId: "",
        status: "loading",
      });

      const createdSkill = await createSkillService(skillData);

      setSkills((currentSkills) =>
        sortSkillLibrary([
          createdSkill,

          ...currentSkills.filter((skill) => skill.id !== createdSkill.id),
        ]),
      );

      setSaveStatus("success");

      setOperation({
        type: "create",
        skillId: createdSkill.id,
        status: "success",
      });

      return createdSkill;
    } catch (createError) {
      console.error("Unable to create skill:", createError);

      setSaveStatus("error");

      setOperation({
        type: "create",
        skillId: "",
        status: "error",
      });

      setError(normalizeSkillContextError(createError));

      throw createError;
    }
  }, []);

  /*
   * =========================================
   * Update Skill
   * =========================================
   */

  const updateSkill = useCallback(async (skillId, updates) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "update",
        skillId,
        status: "loading",
      });

      const updatedSkill = await updateSkillService(skillId, updates);

      setSkills((currentSkills) =>
        sortSkillLibrary(
          currentSkills.map((skill) =>
            skill.id === skillId ? updatedSkill : skill,
          ),
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "update",
        skillId,
        status: "success",
      });

      return updatedSkill;
    } catch (updateError) {
      console.error("Unable to update skill:", updateError);

      setSaveStatus("error");

      setOperation({
        type: "update",
        skillId,
        status: "error",
      });

      setError(normalizeSkillContextError(updateError));

      throw updateError;
    }
  }, []);

  /*
   * =========================================
   * Find or Create Skill
   * =========================================
   */

  const findOrCreateSkill = useCallback(async (skillData, options = {}) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "find-or-create",
        skillId: "",
        status: "loading",
      });

      const result = await findOrCreateSkillService(skillData, options);

      const resolvedSkill = result.skill;

      setSkills((currentSkills) => {
        const alreadyInState = currentSkills.some(
          (skill) => skill.id === resolvedSkill.id,
        );

        const nextSkills = alreadyInState
          ? currentSkills.map((skill) =>
              skill.id === resolvedSkill.id ? resolvedSkill : skill,
            )
          : [resolvedSkill, ...currentSkills];

        return sortSkillLibrary(nextSkills);
      });

      setSaveStatus("success");

      setOperation({
        type: "find-or-create",
        skillId: resolvedSkill.id,
        status: "success",
      });

      return result;
    } catch (findOrCreateError) {
      console.error("Unable to find or create skill:", findOrCreateError);

      setSaveStatus("error");

      setOperation({
        type: "find-or-create",
        skillId: "",
        status: "error",
      });

      setError(normalizeSkillContextError(findOrCreateError));

      throw findOrCreateError;
    }
  }, []);

  /*
   * =========================================
   * Archive Skill
   * =========================================
   */

  const archiveSkill = useCallback(async (skillId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "archive",
        skillId,
        status: "loading",
      });

      const archivedSkill = await archiveSkillService(skillId);

      setSkills((currentSkills) =>
        sortSkillLibrary(
          currentSkills.map((skill) =>
            skill.id === skillId ? archivedSkill : skill,
          ),
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "archive",
        skillId,
        status: "success",
      });

      return archivedSkill;
    } catch (archiveError) {
      console.error("Unable to archive skill:", archiveError);

      setSaveStatus("error");

      setOperation({
        type: "archive",
        skillId,
        status: "error",
      });

      setError(normalizeSkillContextError(archiveError));

      throw archiveError;
    }
  }, []);

  /*
   * =========================================
   * Restore Skill
   * =========================================
   */

  const restoreSkill = useCallback(async (skillId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "restore",
        skillId,
        status: "loading",
      });

      const restoredSkill = await restoreSkillService(skillId);

      setSkills((currentSkills) =>
        sortSkillLibrary(
          currentSkills.map((skill) =>
            skill.id === skillId ? restoredSkill : skill,
          ),
        ),
      );

      setSaveStatus("success");

      setOperation({
        type: "restore",
        skillId,
        status: "success",
      });

      return restoredSkill;
    } catch (restoreError) {
      console.error("Unable to restore skill:", restoreError);

      setSaveStatus("error");

      setOperation({
        type: "restore",
        skillId,
        status: "error",
      });

      setError(normalizeSkillContextError(restoreError));

      throw restoreError;
    }
  }, []);

  /*
   * =========================================
   * Delete Skill
   * =========================================
   */

  const deleteSkill = useCallback(async (skillId) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "delete",
        skillId,
        status: "loading",
      });

      const deletionResult = await deleteSkillService(skillId);

      setSkills((currentSkills) =>
        currentSkills.filter((skill) => skill.id !== skillId),
      );

      setSaveStatus("success");

      setOperation({
        type: "delete",
        skillId,
        status: "success",
      });

      return deletionResult;
    } catch (deleteError) {
      console.error("Unable to delete skill:", deleteError);

      setSaveStatus("error");

      setOperation({
        type: "delete",
        skillId,
        status: "error",
      });

      setError(normalizeSkillContextError(deleteError));

      throw deleteError;
    }
  }, []);

  /*
   * =========================================
   * Replace Skill Library
   * =========================================
   */

  const replaceSkills = useCallback(async (skillValues) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "replace",
        skillId: "",
        status: "loading",
      });

      const replacedSkills = await replaceSkillsService(skillValues);

      setSkills(sortSkillLibrary(replacedSkills));

      setSaveStatus("success");

      setOperation({
        type: "replace",
        skillId: "",
        status: "success",
      });

      return replacedSkills;
    } catch (replaceError) {
      console.error("Unable to replace skills:", replaceError);

      setSaveStatus("error");

      setOperation({
        type: "replace",
        skillId: "",
        status: "error",
      });

      setError(normalizeSkillContextError(replaceError));

      throw replaceError;
    }
  }, []);

  /*
   * =========================================
   * Validation and Resolution
   * =========================================
   */

  const validateSkillDraft = useCallback(
    async (skillData, options = {}) =>
      validateSkillDraftService(skillData, options),
    [],
  );

  const checkSkillNameAvailability = useCallback(
    async (name, options = {}) =>
      checkSkillNameAvailabilityService(name, options),
    [],
  );

  const resolveSkillMatch = useCallback(
    async (name) => resolveSkillMatchService(name),
    [],
  );

  /*
   * =========================================
   * Derived Collections
   * =========================================
   */

  const activeSkills = useMemo(
    () => skills.filter((skill) => skill.status !== "archived"),
    [skills],
  );

  const archivedSkills = useMemo(
    () => skills.filter((skill) => skill.status === "archived"),
    [skills],
  );

  const skillsById = useMemo(() => {
    return new Map(skills.map((skill) => [skill.id, skill]));
  }, [skills]);

  const skillsByCategory = useMemo(() => {
    return activeSkills.reduce((groups, skill) => {
      if (!groups[skill.category]) {
        groups[skill.category] = [];
      }

      groups[skill.category].push(skill);

      return groups;
    }, {});
  }, [activeSkills]);

  const statistics = useMemo(
    () => ({
      total: skills.length,
      active: activeSkills.length,
      archived: archivedSkills.length,

      technical: activeSkills.filter((skill) => skill.type === "technical")
        .length,

      professional: activeSkills.filter(
        (skill) => skill.type === "professional",
      ).length,

      languages: activeSkills.filter((skill) => skill.type === "language")
        .length,

      aiSuggested: activeSkills.filter(
        (skill) => skill.source === "ai-suggested",
      ).length,
    }),
    [skills, activeSkills, archivedSkills],
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

      skills,
      activeSkills,
      archivedSkills,
      skillsById,
      skillsByCategory,
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

      refreshSkills,
      getSkillById,
      resolveSkillMatch,

      /*
       * Write Operations
       */

      createSkill,
      updateSkill,
      findOrCreateSkill,
      archiveSkill,
      restoreSkill,
      deleteSkill,
      replaceSkills,

      /*
       * Validation
       */

      validateSkillDraft,
      checkSkillNameAvailability,

      /*
       * Status Management
       */

      clearError,
      resetSaveStatus,
      resetOperation,
    }),
    [
      skills,
      activeSkills,
      archivedSkills,
      skillsById,
      skillsByCategory,
      statistics,
      isLoading,
      loadStatus,
      saveStatus,
      operation,
      error,
      refreshSkills,
      getSkillById,
      resolveSkillMatch,
      createSkill,
      updateSkill,
      findOrCreateSkill,
      archiveSkill,
      restoreSkill,
      deleteSkill,
      replaceSkills,
      validateSkillDraft,
      checkSkillNameAvailability,
      clearError,
      resetSaveStatus,
      resetOperation,
    ],
  );

  return (
    <SkillDataContext.Provider value={contextValue}>
      {children}
    </SkillDataContext.Provider>
  );
}

/*
 * =========================================
 * Context Hook
 * =========================================
 */

export function useSkillData() {
  const context = useContext(SkillDataContext);

  if (!context) {
    throw new Error("useSkillData must be used inside SkillDataProvider.");
  }

  return context;
}
