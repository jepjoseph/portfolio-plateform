import { useId, useMemo, useState } from "react";

import { API_ENDPOINTS } from "../../../../config/api.js";

import { buildSelectedProfile } from "../../../../services/Portfolio/profileSelectionUtils.js";

import {
  getPortfolioStyleOption,
  normalizePortfolioStyle,
} from "../../../../services/Portfolio/portfolioStyleUtils.js";

import AboutContextReadiness from "./AboutContextReadiness/AboutContextReadiness";
import AboutEditor from "./AboutEditor/AboutEditor";
import AboutSuggestions from "./AboutSuggestions/AboutSuggestions";

import "./PortfolioAboutBuilder.css";

const EMPTY_ABOUT_META = {
  source: "manual",
  status: "empty",
  generatedAt: null,
  contextFingerprint: "",
  isStale: false,
};

const EMPTY_ABOUT = {
  text: "",
  meta: {
    ...EMPTY_ABOUT_META,
  },
};

/*
 * =========================================
 * Value Helpers
 * =========================================
 */

function getTextValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function getSkillName(skill) {
  if (typeof skill === "string") {
    return skill.trim();
  }

  return (
    getTextValue(skill?.name) ||
    getTextValue(skill?.value) ||
    getTextValue(skill?.label) ||
    getTextValue(skill?.title)
  );
}

function getAchievementText(achievement) {
  if (typeof achievement === "string") {
    return achievement.trim();
  }

  return (
    getTextValue(achievement?.value) ||
    getTextValue(achievement?.description) ||
    getTextValue(achievement?.text)
  );
}

function mergeInformation(primary = [], secondary = []) {
  const combinedItems = [...getArray(primary), ...getArray(secondary)];

  const seenItems = new Set();

  return combinedItems.filter((item) => {
    const identifier = item?.id || JSON.stringify(item);

    if (seenItems.has(identifier)) {
      return false;
    }

    seenItems.add(identifier);

    return true;
  });
}

/*
 * =========================================
 * About Context
 * =========================================
 */

function buildAboutContext(profile, portfolioDraft) {
  const selectedProfile = buildSelectedProfile(
    profile,
    portfolioDraft.profileSelections || [],
  );

  const professionalTitle = selectedProfile.professionalTitles?.[0]?.name || "";

  const skills = mergeInformation(portfolioDraft.skills, profile?.skills)
    .map(getSkillName)
    .filter(Boolean);

  const experiences = mergeInformation(
    portfolioDraft.experiences,
    profile?.experiences,
  ).map((experience) => ({
    position:
      getTextValue(experience?.position) ||
      getTextValue(experience?.title) ||
      getTextValue(experience?.role),

    company:
      getTextValue(experience?.company) ||
      getTextValue(experience?.organization) ||
      getTextValue(experience?.employer),

    description:
      getTextValue(experience?.description) ||
      getTextValue(experience?.summary),

    achievements: getArray(
      experience?.achievements ||
        experience?.responsibilities ||
        experience?.highlights,
    )
      .map(getAchievementText)
      .filter(Boolean),
  }));

  const projects = mergeInformation(
    portfolioDraft.projects,
    profile?.projects,
  ).map((project) => ({
    name: getTextValue(project?.name) || getTextValue(project?.title),

    description:
      getTextValue(project?.description) || getTextValue(project?.summary),

    technologies: getArray(
      project?.technologies || project?.skills || project?.tools,
    )
      .map(getSkillName)
      .filter(Boolean),
  }));

  const education = mergeInformation(
    portfolioDraft.education,
    profile?.education,
  ).map((educationItem) => ({
    degree:
      getTextValue(educationItem?.degree) ||
      getTextValue(educationItem?.program),

    fieldOfStudy:
      getTextValue(educationItem?.fieldOfStudy) ||
      getTextValue(educationItem?.major),

    institution:
      getTextValue(educationItem?.institution) ||
      getTextValue(educationItem?.school),
  }));

  const certifications = mergeInformation(
    portfolioDraft.certifications,
    profile?.certifications,
  ).map((certification) => ({
    name:
      getTextValue(certification?.name) || getTextValue(certification?.title),

    organization:
      getTextValue(certification?.issuingOrganization) ||
      getTextValue(certification?.organization),
  }));

  const trainings = mergeInformation(
    portfolioDraft.trainings,
    profile?.trainings || profile?.training,
  ).map((training) => ({
    name:
      getTextValue(training?.name) ||
      getTextValue(training?.title) ||
      getTextValue(training?.courseName),

    organization:
      getTextValue(training?.organization) ||
      getTextValue(training?.provider) ||
      getTextValue(training?.institution),

    description:
      getTextValue(training?.description) || getTextValue(training?.summary),
  }));

  return {
    documentType: "portfolio",

    targetRole:
      getTextValue(portfolioDraft.targetRole) ||
      getTextValue(portfolioDraft.heroSettings?.availability?.label),

    template: normalizePortfolioStyle(
      portfolioDraft.heroSettings?.portfolioStyle,
    ),

    professionalTitle,

    skills,
    experiences,
    projects,
    education,
    certifications,
    trainings,

    existingSummary:
      getTextValue(portfolioDraft.about?.text) ||
      getTextValue(portfolioDraft.summary),
  };
}

/*
 * =========================================
 * Context Fingerprint
 * =========================================
 */

function createContextFingerprint(context) {
  const fingerprintValue = JSON.stringify({
    portfolioStyle: context.template,
    professionalTitle: context.professionalTitle,
    skills: context.skills,
    experiences: context.experiences,
    projects: context.projects,
    education: context.education,
    certifications: context.certifications,
    trainings: context.trainings,
  });

  let hash = 0;

  for (let index = 0; index < fingerprintValue.length; index += 1) {
    hash = (hash << 5) - hash + fingerprintValue.charCodeAt(index);

    hash |= 0;
  }

  return `portfolio-about-${Math.abs(hash).toString(36)}`;
}

/*
 * =========================================
 * Context Readiness
 * =========================================
 */

function calculateReadiness(context) {
  const details = [
    {
      id: "portfolio-style",
      label: "Portfolio style",
      value: getPortfolioStyleOption(context.template).label,
      count: 1,
      weight: 1,
    },
    {
      id: "title",
      label: "Professional title",
      count: context.professionalTitle ? 1 : 0,
      weight: 2,
    },
    {
      id: "experience",
      label: "Experiences",
      count: context.experiences.length,
      weight: 3,
    },
    {
      id: "skills",
      label: "Skills",
      count: context.skills.length,
      weight: context.skills.length >= 3 ? 2 : 1,
    },
    {
      id: "projects",
      label: "Projects",
      count: context.projects.length,
      weight: 2,
    },
    {
      id: "education",
      label: "Education",
      count: context.education.length,
      weight: 1,
    },
    {
      id: "certifications",
      label: "Certifications",
      count: context.certifications.length,
      weight: 1,
    },
    {
      id: "trainings",
      label: "Training",
      count: context.trainings.length,
      weight: 1,
    },
  ];

  const score = details.reduce(
    (currentScore, detail) =>
      detail.count > 0 ? currentScore + detail.weight : currentScore,
    0,
  );

  if (score >= 10) {
    return {
      level: "excellent",
      label: "Excellent",
      description:
        "Your professional information provides excellent context for a detailed and distinctive About section.",
      details,
    };
  }

  if (score >= 7) {
    return {
      level: "strong",
      label: "Strong",
      description:
        "Your saved information provides strong context for a professional About section.",
      details,
    };
  }

  if (score >= 4) {
    return {
      level: "good",
      label: "Good",
      description:
        "The AI can prepare a useful About draft, but more experience, projects, or skills would improve it.",
      details,
    };
  }

  return {
    level: "basic",
    label: "Basic",
    description:
      "Add professional titles, experience, skills, projects, education, or training for a more specific About section.",
    details,
  };
}

/*
 * =========================================
 * Response Normalization
 * =========================================
 */

function normalizeSuggestions(responseData) {
  const responseSuggestions = Array.isArray(responseData?.suggestions)
    ? responseData.suggestions
    : [];

  return responseSuggestions
    .map((suggestion, index) => {
      if (typeof suggestion === "string") {
        return {
          id: `about-suggestion-${index + 1}`,
          label: `Option ${index + 1}`,
          text: suggestion.trim(),
        };
      }

      return {
        id: suggestion?.id || `about-suggestion-${index + 1}`,

        label: suggestion?.label || `Option ${index + 1}`,

        text: getTextValue(suggestion?.text || suggestion?.summary),
      };
    })
    .filter((suggestion) => suggestion.text)
    .slice(0, 3);
}

/*
 * =========================================
 * Portfolio About Builder
 * =========================================
 */

function PortfolioAboutBuilder({
  profile = {},
  portfolioDraft = {},
  about = EMPTY_ABOUT,
  onChange,
}) {
  const titleId = useId();

  const currentAbout = {
    ...EMPTY_ABOUT,
    ...about,

    text: typeof about === "string" ? about : about?.text || "",

    meta: {
      ...EMPTY_ABOUT_META,
      ...(typeof about === "object" ? about?.meta : {}),
    },
  };

  const [suggestions, setSuggestions] = useState([]);

  const [generationStatus, setGenerationStatus] = useState("idle");

  const [generationError, setGenerationError] = useState("");

  const [generationWarnings, setGenerationWarnings] = useState([]);

  const context = useMemo(
    () =>
      buildAboutContext(profile, {
        ...portfolioDraft,

        about: currentAbout,
      }),
    [profile, portfolioDraft, currentAbout.text],
  );

  const contextFingerprint = useMemo(
    () => createContextFingerprint(context),
    [context],
  );

  const readiness = useMemo(() => calculateReadiness(context), [context]);

  const wordCount = currentAbout.text.trim()
    ? currentAbout.text.trim().split(/\s+/).length
    : 0;

  const characterCount = currentAbout.text.length;

  const isGenerating = generationStatus === "loading";

  const canGenerate = Boolean(
    context.professionalTitle ||
    context.experiences.length ||
    context.projects.length ||
    context.skills.length,
  );

  const isOutdated =
    currentAbout.meta.source === "ai" &&
    Boolean(currentAbout.meta.contextFingerprint) &&
    currentAbout.meta.contextFingerprint !== contextFingerprint;

  /*
   * =========================================
   * Manual Changes
   * =========================================
   */

  const handleTextChange = (value) => {
    onChange?.({
      text: value,

      meta: {
        source: "manual",
        status: value.trim() ? "draft" : "empty",
        generatedAt: null,
        contextFingerprint: "",
        isStale: false,
      },
    });

    setGenerationError("");
  };

  const handleClear = () => {
    onChange?.({
      ...EMPTY_ABOUT,

      meta: {
        ...EMPTY_ABOUT_META,
      },
    });

    setSuggestions([]);
    setGenerationWarnings([]);
    setGenerationError("");
    setGenerationStatus("idle");
  };

  /*
   * =========================================
   * Generate Suggestions
   * =========================================
   */

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) {
      return;
    }

    try {
      setGenerationStatus("loading");
      setGenerationError("");
      setGenerationWarnings([]);

      const response = await fetch(API_ENDPOINTS.generateResumeSummary, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...context,

          generationRules: {
            useOnlyProvidedFacts: true,
            doNotInventQualifications: true,
            doNotInventMetrics: true,
            numberOfSuggestions: 3,
            recommendedWords: "100–250 words",
          },
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.message || "The About-generation request failed.",
        );
      }

      const generatedSuggestions = normalizeSuggestions(responseData);

      if (generatedSuggestions.length !== 3) {
        throw new Error(
          "The AI did not return three usable About suggestions.",
        );
      }

      setSuggestions(generatedSuggestions);

      setGenerationWarnings(
        Array.isArray(responseData.warnings) ? responseData.warnings : [],
      );

      setGenerationStatus("success");
    } catch (error) {
      console.error("Unable to generate portfolio About suggestions:", error);

      setSuggestions([]);
      setGenerationStatus("error");

      setGenerationError(
        error.message || "The About suggestions could not be generated.",
      );
    }
  };

  /*
   * =========================================
   * Suggestion Actions
   * =========================================
   */

  const saveSuggestion = (suggestion, status) => {
    onChange?.({
      text: suggestion.text,

      meta: {
        source: "ai",
        status,
        generatedAt: new Date().toISOString(),
        contextFingerprint,
        isStale: false,
      },
    });

    setSuggestions([]);
    setGenerationWarnings([]);
    setGenerationError("");
    setGenerationStatus("idle");
  };

  const handleAcceptSuggestion = (suggestion) => {
    saveSuggestion(suggestion, "accepted");
  };

  const handleEditSuggestion = (suggestion) => {
    saveSuggestion(suggestion, "editing");
  };

  const handleDismissSuggestions = () => {
    setSuggestions([]);
    setGenerationWarnings([]);
    setGenerationError("");
    setGenerationStatus("idle");
  };

  return (
    <section
      className="portfolio-about-builder portfolio-editor-card"
      aria-labelledby={titleId}
    >
      <header className="portfolio-about-builder-header">
        <div>
          <span>Professional Story</span>

          <h3 id={titleId}>Portfolio About</h3>

          <p>
            Write your professional story or generate three first-person
            suggestions using the information saved throughout your portfolio
            and profile.
          </p>
        </div>

        <div className="portfolio-about-builder-header-actions">
          <span
            className={`portfolio-about-source portfolio-about-source--${currentAbout.meta.source}`}
          >
            {currentAbout.meta.source === "ai" ? "AI Assisted" : "Manual"}
          </span>

          {currentAbout.text && (
            <button type="button" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
      </header>

      <AboutContextReadiness readiness={readiness} />

      {isOutdated && (
        <div className="portfolio-about-outdated" role="status">
          <div>
            <strong>Your professional information has changed.</strong>

            <p>
              This About section was generated using older information. You can
              keep it, edit it, or generate updated suggestions.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
          >
            Regenerate
          </button>
        </div>
      )}

      <AboutEditor
        value={currentAbout.text}
        wordCount={wordCount}
        characterCount={characterCount}
        isGenerating={isGenerating}
        canGenerate={canGenerate}
        hasSuggestions={suggestions.length > 0}
        source={currentAbout.meta.source}
        status={currentAbout.meta.status}
        onChange={handleTextChange}
        onGenerate={handleGenerate}
      />

      {isGenerating && (
        <div
          className="portfolio-about-loading"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" />

          <div>
            <strong>Generating your professional story</strong>

            <p>
              The AI is reviewing your experience, projects, skills, education,
              certifications, and training.
            </p>
          </div>
        </div>
      )}

      {generationError && (
        <div className="portfolio-about-error" role="alert">
          <div>
            <strong>Unable to generate suggestions</strong>

            <p>{generationError}</p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
          >
            Try Again
          </button>
        </div>
      )}

      {generationWarnings.length > 0 && (
        <div className="portfolio-about-warnings">
          <strong>Suggestions for better results</strong>

          <ul>
            {generationWarnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <AboutSuggestions
        suggestions={suggestions}
        onAccept={handleAcceptSuggestion}
        onEdit={handleEditSuggestion}
        onRegenerate={handleGenerate}
        onDismiss={handleDismissSuggestions}
        isGenerating={isGenerating}
      />

      <footer className="portfolio-about-notice">
        <span aria-hidden="true">✦</span>

        <p>
          AI-generated content may contain mistakes. Review every suggestion and
          confirm that it accurately represents your experience.
        </p>
      </footer>
    </section>
  );
}

export default PortfolioAboutBuilder;
