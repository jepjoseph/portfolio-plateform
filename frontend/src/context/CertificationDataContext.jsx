import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addCertificationDocument as addDocumentService,
  archiveCertification as archiveService,
  createCertification as createService,
  deleteCertification as deleteService,
  getCertifications,
  removeCertificationDocument as removeDocumentService,
  replaceCertificationDocumentFile as replaceDocumentService,
  restoreCertification as restoreService,
  setPrimaryCertificationDocument as setPrimaryDocumentService,
  updateCertification as updateService,
} from "../services/Certification/certificationService.js";

import { CERTIFICATION_STORAGE_KEY } from "../services/Certification/certificationStorage.js";

import { migrateLegacyTrainingCertifications } from "../services/Certification/certificationTrainingMigrationService.js";

const CertificationDataContext = createContext(null);

/*
 * =========================================
 * Error Normalization
 * =========================================
 */

function normalizeContextError(error) {
  return {
    name: error?.name || "CertificationError",

    code: error?.code || "CERTIFICATION_OPERATION_ERROR",

    message:
      error?.publicMessage ||
      error?.message ||
      "The Certification Library operation could not be completed.",

    fieldErrors: error?.fieldErrors || error?.validation?.fieldErrors || {},

    errors: error?.errors || error?.validation?.errors || [],

    warnings: error?.warnings || error?.validation?.warnings || [],

    certificationId: error?.certificationId || "",

    documentId: error?.documentId || "",
  };
}

/*
 * =========================================
 * Certification Provider
 * =========================================
 */

export function CertificationDataProvider({ children }) {
  const [certifications, setCertifications] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadStatus, setLoadStatus] = useState("idle");

  const [saveStatus, setSaveStatus] = useState("idle");

  const [operation, setOperation] = useState(null);

  const [error, setError] = useState(null);

  const [warnings, setWarnings] = useState([]);

  /*
   * =========================================
   * Load Certification Library
   * =========================================
   */

  const refreshCertifications = useCallback(
    async ({ includeArchived = true, runLegacyMigration = false } = {}) => {
      setIsLoading(true);
      setLoadStatus("loading");

      try {
        let migrationReport = null;

        if (runLegacyMigration) {
          migrationReport = await migrateLegacyTrainingCertifications();
        }

        const records = getCertifications({
          includeArchived,
        });

        setCertifications(records);
        setLoadStatus("success");
        setError(null);

        return {
          certifications: records,
          migration: migrationReport,
        };
      } catch (caughtError) {
        const normalizedError = normalizeContextError(caughtError);

        setCertifications([]);
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
   * Synchronize After Changes
   * =========================================
   */

  const synchronizeCertifications = useCallback(() => {
    const records = getCertifications({
      includeArchived: true,
    });

    setCertifications(records);
    setLoadStatus("success");

    return records;
  }, []);

  /*
   * =========================================
   * Initial Loading
   * =========================================
   */

  useEffect(() => {
    refreshCertifications({
      includeArchived: true,

      /*
       * The migration service uses its version marker,
       * so this is safe to request during every initial
       * Certification context load.
       */

      runLegacyMigration: true,
    }).catch(() => {
      /*
       * The loading or migration error is already
       * saved in the context.
       */
    });
  }, [refreshCertifications]);

  /*
   * =========================================
   * Browser Tab Synchronization
   * =========================================
   */

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleStorageChange = (event) => {
      if (
        event.storageArea !== window.localStorage ||
        event.key !== CERTIFICATION_STORAGE_KEY
      ) {
        return;
      }

      refreshCertifications({
        includeArchived: true,
        runLegacyMigration: false,
      }).catch(() => {
        /*
         * The loading error is already saved
         * in the context.
         */
      });
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshCertifications]);

  /*
   * =========================================
   * Mutation Runner
   * =========================================
   */

  const runMutation = useCallback(
    async (operationInformation, mutation) => {
      setOperation(operationInformation);
      setSaveStatus("saving");
      setError(null);
      setWarnings([]);

      try {
        const result = await mutation();

        synchronizeCertifications();

        const resultWarnings = Array.isArray(result?.warnings)
          ? result.warnings
          : [];

        setWarnings(resultWarnings);
        setSaveStatus("success");

        return result?.certification || result;
      } catch (caughtError) {
        const normalizedError = normalizeContextError(caughtError);

        setError(normalizedError);

        setWarnings(normalizedError.warnings);

        setSaveStatus("error");

        throw caughtError;
      } finally {
        setOperation(null);
      }
    },
    [synchronizeCertifications],
  );

  /*
   * =========================================
   * Create Certification
   * =========================================
   */

  const createCertification = useCallback(
    (certificationData, options = {}) =>
      runMutation(
        {
          type: "create",

          certificationId: certificationData?.id || "",
        },
        () => createService(certificationData, options),
      ),
    [runMutation],
  );

  /*
   * =========================================
   * Update Certification
   * =========================================
   */

  const updateCertification = useCallback(
    (certificationId, certificationData, options = {}) =>
      runMutation(
        {
          type: "update",
          certificationId,
        },
        () => updateService(certificationId, certificationData, options),
      ),
    [runMutation],
  );

  /*
   * =========================================
   * Archive Certification
   * =========================================
   */

  const archiveCertification = useCallback(
    (certificationId) =>
      runMutation(
        {
          type: "archive",
          certificationId,
        },
        () => archiveService(certificationId),
      ),
    [runMutation],
  );

  /*
   * =========================================
   * Restore Certification
   * =========================================
   */

  const restoreCertification = useCallback(
    (certificationId) =>
      runMutation(
        {
          type: "restore",
          certificationId,
        },
        () => restoreService(certificationId),
      ),
    [runMutation],
  );

  /*
   * =========================================
   * Delete Certification
   * =========================================
   */

  const deleteCertification = useCallback(
    (certificationId) =>
      runMutation(
        {
          type: "delete",
          certificationId,
        },
        () => deleteService(certificationId),
      ),
    [runMutation],
  );

  /*
   * =========================================
   * Add Certification Document
   * =========================================
   */

  const addCertificationDocument = useCallback(
    (
      certificationId,
      file,
      documentInformation = {},
      validationCollections = {},
    ) =>
      runMutation(
        {
          type: "add-document",
          certificationId,
        },
        () =>
          addDocumentService(
            certificationId,
            file,
            documentInformation,
            validationCollections,
          ),
      ),
    [runMutation],
  );

  /*
   * =========================================
   * Remove Certification Document
   * =========================================
   */

  const removeCertificationDocument = useCallback(
    (certificationId, documentId, validationCollections = {}) =>
      runMutation(
        {
          type: "remove-document",
          certificationId,
          documentId,
        },
        () =>
          removeDocumentService(
            certificationId,
            documentId,
            validationCollections,
          ),
      ),
    [runMutation],
  );

  /*
   * =========================================
   * Replace Certification Document
   * =========================================
   */

  const replaceCertificationDocumentFile = useCallback(
    (certificationId, documentId, file, validationCollections = {}) =>
      runMutation(
        {
          type: "replace-document",
          certificationId,
          documentId,
        },
        () =>
          replaceDocumentService(
            certificationId,
            documentId,
            file,
            validationCollections,
          ),
      ),
    [runMutation],
  );

  /*
   * =========================================
   * Set Primary Preview Document
   * =========================================
   */

  const setPrimaryCertificationDocument = useCallback(
    (certificationId, documentId, validationCollections = {}) =>
      runMutation(
        {
          type: "set-primary-document",

          certificationId,
          documentId,
        },
        () =>
          setPrimaryDocumentService(
            certificationId,
            documentId,
            validationCollections,
          ),
      ),
    [runMutation],
  );

  /*
   * =========================================
   * Message Management
   * =========================================
   */

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  const resetSaveStatus = useCallback(() => {
    setSaveStatus("idle");
  }, []);

  /*
   * =========================================
   * Derived Collections
   * =========================================
   */

  const activeCertifications = useMemo(
    () =>
      certifications.filter(
        (certification) => certification.status !== "archived",
      ),
    [certifications],
  );

  const archivedCertifications = useMemo(
    () =>
      certifications.filter(
        (certification) => certification.status === "archived",
      ),
    [certifications],
  );

  /*
   * =========================================
   * Context Value
   * =========================================
   */

  const contextValue = useMemo(
    () => ({
      certifications,

      activeCertifications,

      archivedCertifications,

      isLoading,

      loadStatus,

      saveStatus,

      operation,

      error,

      warnings,

      refreshCertifications,

      synchronizeCertifications,

      createCertification,

      updateCertification,

      archiveCertification,

      restoreCertification,

      deleteCertification,

      addCertificationDocument,

      removeCertificationDocument,

      replaceCertificationDocumentFile,

      setPrimaryCertificationDocument,

      clearError,

      clearWarnings,

      resetSaveStatus,
    }),
    [
      certifications,
      activeCertifications,
      archivedCertifications,
      isLoading,
      loadStatus,
      saveStatus,
      operation,
      error,
      warnings,
      refreshCertifications,
      synchronizeCertifications,
      createCertification,
      updateCertification,
      archiveCertification,
      restoreCertification,
      deleteCertification,
      addCertificationDocument,
      removeCertificationDocument,
      replaceCertificationDocumentFile,
      setPrimaryCertificationDocument,
      clearError,
      clearWarnings,
      resetSaveStatus,
    ],
  );

  return (
    <CertificationDataContext.Provider value={contextValue}>
      {children}
    </CertificationDataContext.Provider>
  );
}

/*
 * =========================================
 * Certification Context Hook
 * =========================================
 */

export function useCertificationData() {
  const context = useContext(CertificationDataContext);

  if (!context) {
    throw new Error(
      "useCertificationData must be used within a CertificationDataProvider.",
    );
  }

  return context;
}

export default CertificationDataContext;
