import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  archiveProject as archiveProjectService,
  createProject as createProjectService,
  deleteProject as deleteProjectService,
  getProjects,
  restoreProject as restoreProjectService,
  updateProject as updateProjectService,
} from "../services/Project/projectService.js";

import { PROJECT_STORAGE_KEY } from "../services/Project/projectStorage.js";

/*
 * =========================================
 * Project Data Context
 * =========================================
 */

const ProjectDataContext = createContext(null);

/*
 * =========================================
 * Error Normalization
 * =========================================
 */

function normalizeContextError(error) {
  return {
    name: error?.name || "ProjectError",

    code: error?.code || "PROJECT_OPERATION_ERROR",

    message:
      error?.publicMessage ||
      error?.message ||
      "The Project Library operation could not be completed.",

    fieldErrors: error?.fieldErrors || error?.validation?.fieldErrors || {},

    errors: error?.errors || error?.validation?.errors || [],

    warnings: error?.warnings || error?.validation?.warnings || [],

    projectId: error?.projectId || error?.details?.projectId || "",
  };
}

/*
 * =========================================
 * Warning Normalization
 * =========================================
 */

function normalizeOperationWarnings(result) {
  const operationWarnings = Array.isArray(result?.warnings)
    ? result.warnings
    : [];

  const assetCleanupWarning = result?.assetCleanupWarning;

  if (!assetCleanupWarning) {
    return operationWarnings;
  }

  const cleanupMessage =
    typeof assetCleanupWarning === "string"
      ? assetCleanupWarning
      : assetCleanupWarning?.publicMessage ||
        assetCleanupWarning?.message ||
        "The Project was saved, but one or more unused files could not be removed.";

  return [
    ...operationWarnings,

    {
      code: "PROJECT_ASSET_CLEANUP_WARNING",
      field: "media",
      message: cleanupMessage,
    },
  ];
}

/*
 * =========================================
 * Project Data Provider
 * =========================================
 */

export function ProjectDataProvider({ children }) {
  const [projects, setProjects] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadStatus, setLoadStatus] = useState("idle");

  const [saveStatus, setSaveStatus] = useState("idle");

  const [operation, setOperation] = useState(null);

  const [error, setError] = useState(null);

  const [warnings, setWarnings] = useState([]);

  /*
   * =========================================
   * Load Project Records
   * =========================================
   */

  const refreshProjects = useCallback(
    async ({ includeArchived = true, preserveCurrentRecords = false } = {}) => {
      setIsLoading(true);
      setLoadStatus("loading");

      try {
        const records = getProjects({
          includeArchived,
        });

        setProjects(records);
        setLoadStatus("success");
        setError(null);

        return records;
      } catch (caughtError) {
        const normalizedError = normalizeContextError(caughtError);

        if (!preserveCurrentRecords) {
          setProjects([]);
        }

        setLoadStatus("error");
        setError(normalizedError);

        throw caughtError;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /*
   * =========================================
   * Silent Local Synchronization
   * =========================================
   *
   * Used after a successful mutation. This
   * avoids showing the full loading state
   * every time a Project is saved.
   */

  const synchronizeProjects = useCallback(() => {
    const records = getProjects({
      includeArchived: true,
    });

    setProjects(records);
    setLoadStatus("success");

    return records;
  }, []);

  /*
   * =========================================
   * Initial Load
   * =========================================
   */

  useEffect(() => {
    refreshProjects().catch(() => {
      /*
       * The normalized loading error is already
       * stored in the Context.
       */
    });
  }, [refreshProjects]);

  /*
   * =========================================
   * Cross-Tab Synchronization
   * =========================================
   */

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleStorageChange = (event) => {
      if (
        event.storageArea !== window.localStorage ||
        event.key !== PROJECT_STORAGE_KEY
      ) {
        return;
      }

      refreshProjects({
        includeArchived: true,
        preserveCurrentRecords: true,
      }).catch(() => {
        /*
         * Keep the current in-memory collection
         * when another tab writes invalid data.
         */
      });
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshProjects]);

  /*
   * =========================================
   * Shared Operation Runner
   * =========================================
   */

  const runOperation = useCallback(
    async (nextOperation, action) => {
      setOperation({
        ...nextOperation,
        status: "loading",
      });

      setSaveStatus("saving");
      setError(null);
      setWarnings([]);

      try {
        const result = await action();

        /*
         * The service has already completed the
         * Project metadata and IndexedDB asset
         * transaction at this point.
         */

        synchronizeProjects();

        const operationWarnings = normalizeOperationWarnings(result);

        setWarnings(operationWarnings);
        setSaveStatus("success");

        setOperation({
          ...nextOperation,
          status: "success",
        });

        /*
         * Create and update services return:
         *
         * {
         *   project,
         *   warnings,
         *   assetCleanupWarning
         * }
         *
         * Archive, restore, and delete may
         * return the Project directly.
         */

        return result?.project || result;
      } catch (caughtError) {
        const normalizedError = normalizeContextError(caughtError);

        setError(normalizedError);
        setWarnings(normalizedError.warnings);
        setSaveStatus("error");

        setOperation({
          ...nextOperation,
          status: "error",
        });

        throw caughtError;
      }
    },
    [synchronizeProjects],
  );

  /*
   * =========================================
   * Create Project
   * =========================================
   */

  const createProject = useCallback(
    (projectData, options = {}) =>
      runOperation(
        {
          type: "create",
          projectId: projectData?.id || "",
        },
        () => createProjectService(projectData, options),
      ),
    [runOperation],
  );

  /*
   * =========================================
   * Update Project
   * =========================================
   */

  const updateProject = useCallback(
    (projectId, projectData, options = {}) =>
      runOperation(
        {
          type: "update",
          projectId,
        },
        () => updateProjectService(projectId, projectData, options),
      ),
    [runOperation],
  );

  /*
   * =========================================
   * Archive Project
   * =========================================
   */

  const archiveProject = useCallback(
    (projectOrId) => {
      const projectId =
        typeof projectOrId === "string" ? projectOrId : projectOrId?.id;

      return runOperation(
        {
          type: "archive",
          projectId,
        },
        () => archiveProjectService(projectId),
      );
    },
    [runOperation],
  );

  /*
   * =========================================
   * Restore Project
   * =========================================
   */

  const restoreProject = useCallback(
    (projectOrId) => {
      const projectId =
        typeof projectOrId === "string" ? projectOrId : projectOrId?.id;

      return runOperation(
        {
          type: "restore",
          projectId,
        },
        () => restoreProjectService(projectId),
      );
    },
    [runOperation],
  );

  /*
   * =========================================
   * Delete Project
   * =========================================
   */

  const deleteProject = useCallback(
    (projectOrId) => {
      const projectId =
        typeof projectOrId === "string" ? projectOrId : projectOrId?.id;

      return runOperation(
        {
          type: "delete",
          projectId,
        },
        () => deleteProjectService(projectId),
      );
    },
    [runOperation],
  );

  /*
   * =========================================
   * Utility Actions
   * =========================================
   */

  const getProjectById = useCallback(
    (projectId, { includeArchived = true } = {}) => {
      const project =
        projects.find((record) => record.id === projectId) || null;

      if (project?.recordStatus === "archived" && !includeArchived) {
        return null;
      }

      return project;
    },
    [projects],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  const resetSaveStatus = useCallback(() => {
    setSaveStatus("idle");
    setOperation(null);
  }, []);

  /*
   * =========================================
   * Derived Project Collections
   * =========================================
   */

  const activeProjects = useMemo(
    () => projects.filter((project) => project.recordStatus !== "archived"),
    [projects],
  );

  const archivedProjects = useMemo(
    () => projects.filter((project) => project.recordStatus === "archived"),
    [projects],
  );

  /*
   * =========================================
   * Context Value
   * =========================================
   */

  const value = useMemo(
    () => ({
      projects,
      activeProjects,
      archivedProjects,

      isLoading,
      isSaving: saveStatus === "saving",

      loadStatus,
      saveStatus,
      operation,

      error,
      warnings,

      refreshProjects,
      getProjectById,

      createProject,
      updateProject,
      archiveProject,
      restoreProject,
      deleteProject,

      clearError,
      clearWarnings,
      resetSaveStatus,
    }),
    [
      projects,
      activeProjects,
      archivedProjects,
      isLoading,
      loadStatus,
      saveStatus,
      operation,
      error,
      warnings,
      refreshProjects,
      getProjectById,
      createProject,
      updateProject,
      archiveProject,
      restoreProject,
      deleteProject,
      clearError,
      clearWarnings,
      resetSaveStatus,
    ],
  );

  return (
    <ProjectDataContext.Provider value={value}>
      {children}
    </ProjectDataContext.Provider>
  );
}

/*
 * =========================================
 * Project Data Hook
 * =========================================
 */

export function useProjectData() {
  const context = useContext(ProjectDataContext);

  if (!context) {
    throw new Error("useProjectData must be used inside ProjectDataProvider.");
  }

  return context;
}

export default ProjectDataContext;
