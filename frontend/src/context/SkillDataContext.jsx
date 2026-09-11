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

const SkillDataContext = createContext(null);

const INITIAL_OPERATION = {
  type: "",
  skillId: "",
  status: "idle",
};

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

    usage: error?.usage && typeof error.usage === "object" ? error.usage : null,

    originalError: error,
  };
}

function createSkillDeletionConflict(skillId, usage) {
  const experienceCount = Number(usage?.experienceCount) || 0;

  const error = new Error(`Skill "${skillId}" is still referenced.`);

  error.name = "SkillUsageConflictError";
  error.code = "SKILL_IN_USE";
  error.status = 409;

  error.publicMessage =
    experienceCount === 1
      ? "This skill cannot be permanently deleted because it is used by an experience. Archive it instead."
      : `This skill cannot be permanently deleted because it is used by ${experienceCount} experiences. Archive it instead.`;

  error.usage = usage;

  error.conflicts = [
    {
      field: "skillId",
      code: "skill_in_use",
      message: error.publicMessage,
      skillId,
      experienceCount,

      experienceSkillCount: Number(usage?.experienceSkillCount) || 0,

      experienceTechnologyCount: Number(usage?.experienceTechnologyCount) || 0,

      experienceIds: Array.isArray(usage?.experiences)
        ? usage.experiences.map((item) => item.id).filter(Boolean)
        : [],
    },
  ];

  return error;
}

function sortSkillLibrary(skills) {
  return [...skills].sort((firstSkill, secondSkill) =>
    firstSkill.name.localeCompare(secondSkill.name, undefined, {
      sensitivity: "base",
    }),
  );
}

export function SkillDataProvider({ children }) {
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState("idle");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [operation, setOperation] = useState(INITIAL_OPERATION);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetSaveStatus = useCallback(() => {
    setSaveStatus("idle");
  }, []);

  const resetOperation = useCallback(() => {
    setOperation(INITIAL_OPERATION);
  }, []);

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

  useEffect(() => {
    let isActive = true;

    getSkillsService({
      includeArchived: true,
    })
      .then((loadedSkills) => {
        if (!isActive) {
          return;
        }

        setSkills(
          sortSkillLibrary(Array.isArray(loadedSkills) ? loadedSkills : []),
        );

        setLoadStatus("success");
      })
      .catch((loadError) => {
        if (!isActive) {
          return;
        }

        console.error("Unable to load skills:", loadError);

        setSkills([]);
        setLoadStatus("error");

        setError(normalizeSkillContextError(loadError));
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

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
      }).catch(() => {});
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshSkills]);

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
        setError(normalizeSkillContextError(getError));

        throw getError;
      }
    },
    [skills],
  );

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

      setSkills((current) =>
        sortSkillLibrary([
          createdSkill,
          ...current.filter((skill) => skill.id !== createdSkill.id),
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

      setSkills((current) =>
        sortSkillLibrary(
          current.map((skill) => (skill.id === skillId ? updatedSkill : skill)),
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

      setSkills((current) => {
        const exists = current.some((skill) => skill.id === resolvedSkill.id);

        const next = exists
          ? current.map((skill) =>
              skill.id === resolvedSkill.id ? resolvedSkill : skill,
            )
          : [resolvedSkill, ...current];

        return sortSkillLibrary(next);
      });

      setSaveStatus("success");

      setOperation({
        type: "find-or-create",
        skillId: resolvedSkill.id,
        status: "success",
      });

      return result;
    } catch (operationError) {
      setSaveStatus("error");

      setOperation({
        type: "find-or-create",
        skillId: "",
        status: "error",
      });

      setError(normalizeSkillContextError(operationError));

      throw operationError;
    }
  }, []);

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

      setSkills((current) =>
        sortSkillLibrary(
          current.map((skill) =>
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

      setSkills((current) =>
        sortSkillLibrary(
          current.map((skill) =>
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

  const deleteSkill = useCallback(async (skillId, { usage = null } = {}) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "delete",
        skillId,
        status: "loading",
      });

      if (Number(usage?.total ?? usage?.totalUsage) > 0) {
        throw createSkillDeletionConflict(skillId, usage);
      }

      const deletionResult = await deleteSkillService(skillId);

      setSkills((current) => current.filter((skill) => skill.id !== skillId));

      setSaveStatus("success");

      setOperation({
        type: "delete",
        skillId,
        status: "success",
      });

      return deletionResult;
    } catch (deleteError) {
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

  const replaceSkills = useCallback(async (skillValues) => {
    try {
      setSaveStatus("saving");
      setError(null);

      setOperation({
        type: "replace",
        skillId: "",
        status: "loading",
      });

      const replaced = await replaceSkillsService(skillValues);

      setSkills(sortSkillLibrary(replaced));

      setSaveStatus("success");

      setOperation({
        type: "replace",
        skillId: "",
        status: "success",
      });

      return replaced;
    } catch (replaceError) {
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

  const validateSkillDraft = useCallback(
    (skillData, options = {}) => validateSkillDraftService(skillData, options),
    [],
  );

  const checkSkillNameAvailability = useCallback(
    (name, options = {}) => checkSkillNameAvailabilityService(name, options),
    [],
  );

  const resolveSkillMatch = useCallback(
    (name) => resolveSkillMatchService(name),
    [],
  );

  const activeSkills = useMemo(
    () => skills.filter((skill) => skill.status !== "archived"),
    [skills],
  );

  const archivedSkills = useMemo(
    () => skills.filter((skill) => skill.status === "archived"),
    [skills],
  );

  const skillsById = useMemo(
    () => new Map(skills.map((skill) => [skill.id, skill])),
    [skills],
  );

  const skillsByCategory = useMemo(
    () =>
      activeSkills.reduce((groups, skill) => {
        if (!groups[skill.category]) {
          groups[skill.category] = [];
        }

        groups[skill.category].push(skill);

        return groups;
      }, {}),
    [activeSkills],
  );

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

  const contextValue = useMemo(
    () => ({
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

export function useSkillData() {
  const context = useContext(SkillDataContext);

  if (!context) {
    throw new Error("useSkillData must be used inside SkillDataProvider.");
  }

  return context;
}
