import { createContext, useContext, useEffect, useMemo, useState } from "react";

const PortfolioDraftContext = createContext(null);

const EDITOR_STORAGE_KEY = "portfolio-editor-draft";

const INITIAL_PORTFOLIO_DRAFT = {
  id: "portfolio-1",
  username: "jean-pierre-joseph",
  slug: "professional-portfolio",
  portfolioName: "My Professional Portfolio",

  profileSelections: [],

  summary: "",

  experiences: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],

  sectionVisibility: {
    profile: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    certifications: true,
    projects: false,
  },

  isPublished: false,
};

function loadStoredDraft() {
  try {
    const storedDraft = sessionStorage.getItem(EDITOR_STORAGE_KEY);

    if (!storedDraft) {
      return INITIAL_PORTFOLIO_DRAFT;
    }

    const parsedDraft = JSON.parse(storedDraft);

    return {
      ...INITIAL_PORTFOLIO_DRAFT,
      ...parsedDraft,

      sectionVisibility: {
        ...INITIAL_PORTFOLIO_DRAFT.sectionVisibility,
        ...parsedDraft.sectionVisibility,
      },
    };
  } catch (error) {
    console.error("Unable to load the portfolio editor draft:", error);

    return INITIAL_PORTFOLIO_DRAFT;
  }
}

function resolveStateValue(valueOrUpdater, currentValue) {
  return typeof valueOrUpdater === "function"
    ? valueOrUpdater(currentValue)
    : valueOrUpdater;
}

export function PortfolioDraftProvider({ children }) {
  const [portfolioDraft, setPortfolioDraft] = useState(loadStoredDraft);

  const [saveStatus, setSaveStatus] = useState("idle");

  useEffect(() => {
    try {
      sessionStorage.setItem(
        EDITOR_STORAGE_KEY,
        JSON.stringify(portfolioDraft),
      );
    } catch (error) {
      console.error("Unable to store the portfolio editor draft:", error);
    }
  }, [portfolioDraft]);

  const updateDraftField = (fieldName, valueOrUpdater) => {
    setPortfolioDraft((currentDraft) => ({
      ...currentDraft,

      [fieldName]: resolveStateValue(valueOrUpdater, currentDraft[fieldName]),
    }));
  };

  const updateSectionVisibility = (sectionName, isVisible) => {
    setPortfolioDraft((currentDraft) => ({
      ...currentDraft,

      sectionVisibility: {
        ...currentDraft.sectionVisibility,
        [sectionName]: isVisible,
      },
    }));
  };

  const resetPortfolioDraft = () => {
    setPortfolioDraft(INITIAL_PORTFOLIO_DRAFT);
    setSaveStatus("idle");

    sessionStorage.removeItem(EDITOR_STORAGE_KEY);
    sessionStorage.removeItem("portfolio-preview");
  };

  const contextValue = useMemo(
    () => ({
      portfolioDraft,
      setPortfolioDraft,
      updateDraftField,
      updateSectionVisibility,
      resetPortfolioDraft,
      saveStatus,
      setSaveStatus,
    }),
    [portfolioDraft, saveStatus],
  );

  return (
    <PortfolioDraftContext.Provider value={contextValue}>
      {children}
    </PortfolioDraftContext.Provider>
  );
}

export function usePortfolioDraft() {
  const context = useContext(PortfolioDraftContext);

  if (!context) {
    throw new Error(
      "usePortfolioDraft must be used inside PortfolioDraftProvider.",
    );
  }

  return context;
}
