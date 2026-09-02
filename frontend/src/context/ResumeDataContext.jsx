import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ResumeDataContext = createContext(null);

const RESUME_STORAGE_KEY = "portfolio-platform-saved-resumes";

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `resume-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createSlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "resume";
}

function createUniqueSlug(resumeName, resumes, currentResumeId = null) {
  const baseSlug = createSlug(resumeName);

  const usedSlugs = new Set(
    resumes
      .filter((resume) => resume.id !== currentResumeId)
      .map((resume) => resume.publicSlug)
      .filter(Boolean),
  );

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let nextSlug = `${baseSlug}-${suffix}`;

  while (usedSlugs.has(nextSlug)) {
    suffix += 1;
    nextSlug = `${baseSlug}-${suffix}`;
  }

  return nextSlug;
}

function normalizeResume(resume) {
  return {
    id: resume.id || createId(),

    resumeName: resume.resumeName || "",
    targetRole: resume.targetRole || "",
    template: resume.template || "professional",

    headerSelections: {
      nameOptionId: "",
      professionalTitleId: "",
      emailId: "",
      phoneId: "",
      locationId: "",
      linkedinId: "",
      websiteId: "",
      pictureId: "",
      ...resume.headerSelections,
    },

    summary: resume.summary || "",

    summaryMeta: {
      source: "manual",
      status: "empty", //"draft"
      generatedAt: null,
      contextFingerprint: "",
      isStale: false,
      ...resume.summaryMeta,
    },

    experiences: Array.isArray(resume.experiences) ? resume.experiences : [],

    education: Array.isArray(resume.education) ? resume.education : [],

    skills: Array.isArray(resume.skills) ? resume.skills : [],

    projects: Array.isArray(resume.projects) ? resume.projects : [],

    certifications: Array.isArray(resume.certifications)
      ? resume.certifications
      : [],

    sectionVisibility: {
      header: true,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
      ...resume.sectionVisibility,
    },

    isSharedOnline: Boolean(resume.isSharedOnline),
    isShownOnPortfolio: Boolean(resume.isShownOnPortfolio),

    publicSlug: resume.publicSlug || "",

    createdAt: resume.createdAt || null,
    updatedAt: resume.updatedAt || null,
  };
}

function loadSavedResumes() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(RESUME_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.map(normalizeResume);
  } catch (error) {
    console.error("Unable to load saved resumes:", error);

    return [];
  }
}

export function ResumeDataProvider({ children }) {
  const [savedResumes, setSavedResumes] = useState(loadSavedResumes);

  const [persistenceError, setPersistenceError] = useState("");

  /*
   * =========================================
   * Local Storage Persistence
   * =========================================
   */

  useEffect(() => {
    try {
      window.localStorage.setItem(
        RESUME_STORAGE_KEY,
        JSON.stringify(savedResumes),
      );

      setPersistenceError("");
    } catch (error) {
      console.error("Unable to persist saved resumes:", error);

      setPersistenceError(
        "Your resume changes could not be saved in this browser.",
      );
    }
  }, [savedResumes]);

  /*
   * =========================================
   * Save or Update Resume
   * =========================================
   */

  const saveResume = useCallback(
    (resumeData) => {
      const now = new Date().toISOString();

      const existingResume = savedResumes.find(
        (resume) => resume.id === resumeData.id,
      );

      const resumeName = String(resumeData.resumeName || "").trim();

      const publicSlug =
        existingResume?.publicSlug ||
        resumeData.publicSlug ||
        createUniqueSlug(resumeName, savedResumes, resumeData.id);

      const savedResume = normalizeResume({
        ...resumeData,

        id: resumeData.id || createId(),

        resumeName,

        targetRole: String(resumeData.targetRole || "").trim(),

        publicSlug,

        createdAt: existingResume?.createdAt || resumeData.createdAt || now,

        updatedAt: now,
      });

      setSavedResumes((currentResumes) => {
        const resumeExists = currentResumes.some(
          (resume) => resume.id === savedResume.id,
        );

        if (resumeExists) {
          return currentResumes.map((resume) =>
            resume.id === savedResume.id ? savedResume : resume,
          );
        }

        return [savedResume, ...currentResumes];
      });

      return savedResume;
    },
    [savedResumes],
  );

  /*
   * =========================================
   * Delete Resume
   * =========================================
   */

  const deleteResume = useCallback((resumeId) => {
    setSavedResumes((currentResumes) =>
      currentResumes.filter((resume) => resume.id !== resumeId),
    );
  }, []);

  /*
   * =========================================
   * Duplicate Resume
   * =========================================
   */

  const duplicateResume = useCallback(
    (resume) => {
      const now = new Date().toISOString();

      const copiedResumeName = `${resume.resumeName} Copy`;

      const duplicatedResume = normalizeResume({
        ...resume,

        id: createId(),

        resumeName: copiedResumeName,

        publicSlug: createUniqueSlug(copiedResumeName, savedResumes),

        isSharedOnline: false,
        isShownOnPortfolio: false,

        createdAt: now,
        updatedAt: now,
      });

      setSavedResumes((currentResumes) => [
        duplicatedResume,
        ...currentResumes,
      ]);

      return duplicatedResume;
    },
    [savedResumes],
  );

  /*
   * =========================================
   * Toggle Resume Setting
   * =========================================
   */

  const toggleResumeSetting = useCallback((resumeId, settingName) => {
    const allowedSettings = ["isSharedOnline", "isShownOnPortfolio"];

    if (!allowedSettings.includes(settingName)) {
      console.warn(`Unsupported resume setting: ${settingName}`);

      return;
    }

    setSavedResumes((currentResumes) =>
      currentResumes.map((resume) =>
        resume.id === resumeId
          ? {
              ...resume,
              [settingName]: !resume[settingName],
              updatedAt: new Date().toISOString(),
            }
          : resume,
      ),
    );
  }, []);

  /*
   * =========================================
   * Resume Lookups
   * =========================================
   */

  const getResumeById = useCallback(
    (resumeId) => savedResumes.find((resume) => resume.id === resumeId) || null,
    [savedResumes],
  );

  const getResumeBySlug = useCallback(
    (publicSlug) =>
      savedResumes.find(
        (resume) => resume.publicSlug === publicSlug && resume.isSharedOnline,
      ) || null,
    [savedResumes],
  );

  const portfolioResumes = useMemo(
    () => savedResumes.filter((resume) => resume.isShownOnPortfolio),
    [savedResumes],
  );

  const sharedResumes = useMemo(
    () => savedResumes.filter((resume) => resume.isSharedOnline),
    [savedResumes],
  );

  const contextValue = useMemo(
    () => ({
      savedResumes,
      portfolioResumes,
      sharedResumes,
      persistenceError,

      saveResume,
      deleteResume,
      duplicateResume,
      toggleResumeSetting,

      getResumeById,
      getResumeBySlug,
    }),
    [
      savedResumes,
      portfolioResumes,
      sharedResumes,
      persistenceError,
      saveResume,
      deleteResume,
      duplicateResume,
      toggleResumeSetting,
      getResumeById,
      getResumeBySlug,
    ],
  );

  return (
    <ResumeDataContext.Provider value={contextValue}>
      {children}
    </ResumeDataContext.Provider>
  );
}

export function useResumeData() {
  const context = useContext(ResumeDataContext);

  if (!context) {
    throw new Error("useResumeData must be used inside a ResumeDataProvider.");
  }

  return context;
}
