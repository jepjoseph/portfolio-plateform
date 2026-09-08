import { useEffect, useId, useMemo, useRef, useState } from "react";

import { API_ENDPOINTS } from "../../../../config/api.js";

import { EXPERIENCE_FIELD_LIMITS } from "../../../../config/experienceConfig.js";

import { useSkillData } from "../../../../context/SkillDataContext.jsx";

import ExperienceOverviewReadiness from "./ExperienceOverviewReadiness/ExperienceOverviewReadiness.jsx";
import ExperienceOverviewSuggestions from "./ExperienceOverviewSuggestions/ExperienceOverviewSuggestions.jsx";

import "./ExperienceOverviewBuilder.css";

const EMPTY_OVERVIEW_META = {
  source: "manual",
  status: "empty",
  generatedAt: null,
  contextFingerprint: "",
  isStale: false,
};

/*
 * =========================================
 * Context Helpers
 * =========================================
 */

function getResponsibilityText(value) {
  return typeof value === "string" ? value.trim() : value?.text?.trim() || "";
}

function normalizeAchievement(value) {
  if (typeof value === "string") {
    return {
      text: value.trim(),
      metric: "",
    };
  }

  return {
    text: value?.text?.trim() || "",
    metric: value?.metric?.trim() || "",
  };
}

function getTechnologyName(value) {
  return typeof value === "string"
    ? value.trim()
    : (value?.name || value?.value || value?.label || "").trim();
}

function getWordCount(value) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

/*
 * =========================================
 * Context Fingerprint
 * =========================================
 */

function createContextFingerprint(context) {
  const fingerprintValue = JSON.stringify({
    positionTitle: context.positionTitle,
    organizationIndustry: context.organizationIndustry,
    employmentType: context.employmentType,
    workArrangement: context.workArrangement,
    responsibilities: context.responsibilities,
    achievements: context.achievements,
    skills: context.skills,
    technologies: context.technologies,
    leadership: context.leadership,
  });

  let hash = 0;

  for (let index = 0; index < fingerprintValue.length; index += 1) {
    hash = (hash << 5) - hash + fingerprintValue.charCodeAt(index);

    hash |= 0;
  }

  return `experience-overview-${Math.abs(hash).toString(36)}`;
}

/*
 * =========================================
 * Readiness
 * =========================================
 */

function getOverviewReadiness(context) {
  const details = [
    {
      id: "position",
      label: "Position",
      complete: Boolean(context.positionTitle),
      weight: 2,
      value: context.positionTitle || "Not provided",
    },
    {
      id: "responsibilities",
      label: "Responsibilities",
      complete: context.responsibilities.length > 0,
      weight: 3,
      value: `${context.responsibilities.length} added`,
    },
    {
      id: "achievements",
      label: "Achievements",
      complete: context.achievements.length > 0,
      weight: 3,
      value: `${context.achievements.length} added`,
    },
    {
      id: "skills",
      label: "Skills",
      complete: context.skills.length > 0,
      weight: 2,
      value: `${context.skills.length} selected`,
    },
    {
      id: "leadership",
      label: "Leadership",
      complete: Boolean(
        context.leadership.description ||
        context.leadership.hasLeadershipResponsibilities,
      ),
      weight: 1,
      value:
        context.leadership.description ||
        context.leadership.hasLeadershipResponsibilities
          ? "Provided"
          : "Not provided",
    },
  ];

  const maximumScore = details.reduce(
    (total, detail) => total + detail.weight,
    0,
  );

  const score = details.reduce(
    (total, detail) => total + (detail.complete ? detail.weight : 0),
    0,
  );

  if (score >= maximumScore) {
    return {
      level: "excellent",
      label: "Excellent",
      description:
        "All major context areas are available for a detailed and accurate overview.",
      score,
      maximumScore,
      details,
    };
  }

  if (score >= 7) {
    return {
      level: "strong",
      label: "Strong",
      description:
        "The available information provides strong context for an accurate overview.",
      score,
      maximumScore,
      details,
    };
  }

  if (score >= 3) {
    return {
      level: "developing",
      label: "Developing",
      description:
        "The AI can generate an overview, but more responsibilities, achievements, or skills would improve it.",
      score,
      maximumScore,
      details,
    };
  }

  return {
    level: "basic",
    label: "Basic",
    description:
      "Add more professional context for a specific and meaningful overview.",
    score,
    maximumScore,
    details,
  };
}

/*
 * =========================================
 * Overview Builder
 * =========================================
 */

function ExperienceOverviewBuilder({
  experience = {},
  fieldError = "",
  disabled = false,
  onChange,
}) {
  const sectionTitleId = useId();
  const textareaId = useId();

  const abortControllerRef = useRef(null);

  const { skillsById } = useSkillData();

  const [suggestions, setSuggestions] = useState([]);

  const [warnings, setWarnings] = useState([]);

  const [status, setStatus] = useState("idle");

  const [error, setError] = useState("");

  const overview = experience.overview || "";

  const overviewMeta = {
    ...EMPTY_OVERVIEW_META,
    ...experience.overviewMeta,
  };

  /*
   * =========================================
   * Generation Context
   * =========================================
   */

  const generationContext = useMemo(
    () => ({
      positionTitle: experience.position?.title || "",

      organizationName: experience.organization?.name || "",

      organizationIndustry: experience.organization?.industry || "",

      experienceCategory: experience.category || "",

      employmentType: experience.position?.employmentType || "",

      workArrangement: experience.position?.workArrangement || "",

      responsibilities: (experience.responsibilities || [])
        .map(getResponsibilityText)
        .filter(Boolean),

      achievements: (experience.achievements || [])
        .map(normalizeAchievement)
        .filter((achievement) => achievement.text),

      skills: (experience.skills || [])
        .map((relationship) => ({
          name:
            skillsById.get(relationship.skillId)?.name ||
            relationship.nameSnapshot ||
            "",

          nameSnapshot: relationship.nameSnapshot || "",

          level: relationship.level || "",
        }))
        .filter((skill) => skill.name || skill.nameSnapshot),

      technologies: (experience.technologies || [])
        .map(getTechnologyName)
        .filter(Boolean),

      leadership: {
        hasLeadershipResponsibilities:
          experience.leadership?.hasLeadershipResponsibilities === true,

        peopleManaged:
          experience.leadership?.peopleManaged === "" ||
          experience.leadership?.peopleManaged === null ||
          experience.leadership?.peopleManaged === undefined
            ? null
            : Number(experience.leadership.peopleManaged),

        description: experience.leadership?.description || "",
      },

      existingOverview: overview,

      generationRules: {
        numberOfSuggestions: 3,
        recommendedWords: "50–120 words",
        useOnlyProvidedFacts: true,
        doNotInventMetrics: true,
      },
    }),
    [experience, overview, skillsById],
  );

  const contextFingerprint = useMemo(
    () => createContextFingerprint(generationContext),
    [generationContext],
  );

  const readiness = useMemo(
    () => getOverviewReadiness(generationContext),
    [generationContext],
  );

  const canGenerate = readiness.score > 0;

  const isGenerating = status === "loading";

  const isStale =
    overviewMeta.source === "ai" &&
    Boolean(overviewMeta.contextFingerprint) &&
    overviewMeta.contextFingerprint !== contextFingerprint;

  /*
   * =========================================
   * Request Cleanup
   * =========================================
   */

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /*
   * =========================================
   * Manual Editing
   * =========================================
   */

  const handleOverviewChange = (event) => {
    const nextOverview = event.target.value;

    onChange?.({
      overview: nextOverview,

      overviewMeta: {
        source: "manual",
        status: nextOverview.trim() ? "draft" : "empty",
        generatedAt: null,
        contextFingerprint: "",
        isStale: false,
      },
    });

    setError("");
  };

  /*
   * =========================================
   * Generate
   * =========================================
   */

  const handleGenerate = async () => {
    if (!canGenerate || disabled || isGenerating) {
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();

    abortControllerRef.current = controller;

    try {
      setStatus("loading");
      setError("");
      setWarnings([]);

      const response = await fetch(API_ENDPOINTS.generateExperienceOverview, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(generationContext),

        signal: controller.signal,
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.message || "The Experience Overview request failed.",
        );
      }

      const generatedSuggestions = Array.isArray(responseData.suggestions)
        ? responseData.suggestions.filter((suggestion) =>
            suggestion?.text?.trim(),
          )
        : [];

      if (generatedSuggestions.length !== 3) {
        throw new Error(
          "The AI did not return three usable Experience Overview suggestions.",
        );
      }

      setSuggestions(generatedSuggestions);

      setWarnings(
        Array.isArray(responseData.warnings) ? responseData.warnings : [],
      );

      setStatus("success");
    } catch (generationError) {
      if (generationError.name === "AbortError") {
        return;
      }

      console.error("Unable to generate Experience Overview:", generationError);

      setSuggestions([]);
      setStatus("error");

      setError(
        generationError.message ||
          "The Experience Overview could not be generated.",
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  /*
   * =========================================
   * Accept Suggestion
   * =========================================
   */

  const handleAcceptSuggestion = (suggestion) => {
    onChange?.({
      overview: suggestion.text,

      overviewMeta: {
        source: "ai",
        status: "accepted",
        generatedAt: new Date().toISOString(),
        contextFingerprint,
        isStale: false,
      },
    });

    setSuggestions([]);
    setWarnings([]);
    setError("");
    setStatus("accepted");
  };

  /*
   * =========================================
   * Dismiss and Clear
   * =========================================
   */

  const handleDismiss = () => {
    setSuggestions([]);
    setWarnings([]);
    setError("");
    setStatus("idle");
  };

  const handleClear = () => {
    onChange?.({
      overview: "",
      overviewMeta: {
        ...EMPTY_OVERVIEW_META,
      },
    });

    handleDismiss();
  };

  return (
    <section
      className="experience-form-section experience-overview-builder"
      aria-labelledby={sectionTitleId}
    >
      <header className="experience-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Overview</small>

          <h3 id={sectionTitleId}>Experience Overview</h3>

          <p>Explain the purpose, scope, and professional focus of the role.</p>
        </div>
      </header>

      <ExperienceOverviewReadiness readiness={readiness} />

      {isStale && (
        <div className="experience-overview-stale" role="status">
          <div>
            <strong>Supporting information has changed</strong>

            <p>
              This AI-generated overview was created from older experience
              information.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={disabled || isGenerating}
          >
            Regenerate
          </button>
        </div>
      )}

      <div
        className={`experience-overview-editor ${
          fieldError ? "experience-overview-editor--error" : ""
        }`}
      >
        <div className="experience-overview-label-row">
          <label htmlFor={textareaId}>Professional Overview</label>

          <span>
            {getWordCount(overview)} words
            {" · "}
            {overview.length}/{EXPERIENCE_FIELD_LIMITS.overview}
          </span>
        </div>

        <textarea
          id={textareaId}
          value={overview}
          onChange={handleOverviewChange}
          rows={7}
          maxLength={EXPERIENCE_FIELD_LIMITS.overview}
          disabled={disabled}
          placeholder={`Explain the role's purpose, scope, responsibilities, and professional value.

Example: Supported business-critical systems and maintained reliable technology services across the organization.`}
        />

        {fieldError && <p role="alert">{fieldError}</p>}

        <footer>
          <div>
            <span>
              {overviewMeta.source === "ai" ? "AI Assisted" : "Manual"}
            </span>

            <small>Recommended length: 50–120 words.</small>
          </div>

          <div>
            {overview && (
              <button type="button" onClick={handleClear} disabled={disabled}>
                Clear
              </button>
            )}

            <button
              type="button"
              className="experience-overview-generate-button"
              onClick={handleGenerate}
              disabled={!canGenerate || disabled || isGenerating}
            >
              {isGenerating
                ? "Generating..."
                : suggestions.length > 0
                  ? "Regenerate"
                  : "Generate with AI"}
            </button>
          </div>
        </footer>
      </div>

      {!canGenerate && (
        <p className="experience-overview-generation-help">
          Add a position, responsibility, achievement, skill, or leadership
          detail before generating an overview.
        </p>
      )}

      {isGenerating && (
        <div className="experience-overview-loading" role="status">
          <span aria-hidden="true" />

          <div>
            <strong>Generating Experience Overviews</strong>

            <p>The AI is reviewing the supported professional information.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="experience-overview-error" role="alert">
          <strong>Unable to generate the overview</strong>

          <p>{error}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="experience-overview-warnings">
          <strong>Generation notes</strong>

          <ul>
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <ExperienceOverviewSuggestions
        suggestions={suggestions}
        disabled={disabled || isGenerating}
        onAccept={handleAcceptSuggestion}
        onDismiss={handleDismiss}
      />
    </section>
  );
}

export default ExperienceOverviewBuilder;
