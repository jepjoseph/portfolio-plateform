import { useMemo, useState } from "react";

import { API_ENDPOINTS } from "../../../../../config/api.js";

import { buildSelectedProfile } from "../../../../../services/Portfolio/profileSelectionUtils.js";

import {
  getPortfolioStyleOption,
  normalizePortfolioStyle,
} from "../../../../../services/Portfolio/portfolioStyleUtils.js";

import "./PortfolioTaglineGenerator.css";

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function getSkillName(skill) {
  if (typeof skill === "string") {
    return skill.trim();
  }

  return getText(skill?.name) || getText(skill?.value) || getText(skill?.label);
}

function createFingerprint(context) {
  const value = JSON.stringify(context);

  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);

    hash |= 0;
  }

  return `portfolio-tagline-${Math.abs(hash).toString(36)}`;
}

function normalizeSuggestions(responseData) {
  const suggestions = Array.isArray(responseData?.suggestions)
    ? responseData.suggestions
    : [];

  return suggestions
    .map((suggestion, index) => ({
      id: suggestion?.id || `tagline-${index + 1}`,

      label: suggestion?.label || `Option ${index + 1}`,

      text: getText(suggestion?.text || suggestion?.summary),
    }))
    .filter((suggestion) => suggestion.text)
    .slice(0, 3);
}

function PortfolioTaglineGenerator({
  profile = {},
  portfolioDraft = {},
  tagline = "",
  taglineMeta = {},
  onChange,
}) {
  const [suggestions, setSuggestions] = useState([]);

  const [status, setStatus] = useState("idle");

  const [error, setError] = useState("");

  const context = useMemo(() => {
    const selectedProfile = buildSelectedProfile(
      profile,
      portfolioDraft.profileSelections || [],
    );

    const portfolioStyle = normalizePortfolioStyle(
      portfolioDraft.heroSettings?.portfolioStyle,
    );

    return {
      documentType: "portfolio",
      generationPurpose: "tagline",

      targetRole: "",

      template: portfolioStyle,

      professionalTitle: selectedProfile.professionalTitles?.[0]?.name || "",

      skills: getArray(portfolioDraft.skills).map(getSkillName).filter(Boolean),

      experiences: getArray(portfolioDraft.experiences),

      projects: getArray(portfolioDraft.projects),

      education: getArray(portfolioDraft.education),

      certifications: getArray(portfolioDraft.certifications),

      trainings: getArray(portfolioDraft.trainings),

      interests: getArray(portfolioDraft.interests),

      professionalGoals: getText(portfolioDraft.professionalGoals),

      existingSummary: tagline,

      generationRules: {
        useOnlyProvidedFacts: true,
        doNotInventQualifications: true,
        doNotInventMetrics: true,
        numberOfSuggestions: 3,
        recommendedWords: "8–20 words",
      },
    };
  }, [profile, portfolioDraft, tagline]);

  const fingerprint = useMemo(() => createFingerprint(context), [context]);

  const isGenerating = status === "loading";

  const canGenerate = Boolean(
    context.professionalTitle ||
    context.skills.length ||
    context.experiences.length ||
    context.projects.length,
  );

  const isOutdated =
    taglineMeta?.source === "ai" &&
    Boolean(taglineMeta.contextFingerprint) &&
    taglineMeta.contextFingerprint !== fingerprint;

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) {
      return;
    }

    try {
      setStatus("loading");
      setError("");

      const response = await fetch(API_ENDPOINTS.generateResumeSummary, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(context),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.message || "Unable to generate taglines.");
      }

      const generatedSuggestions = normalizeSuggestions(responseData);

      if (generatedSuggestions.length !== 3) {
        throw new Error("The AI did not return three usable taglines.");
      }

      setSuggestions(generatedSuggestions);

      setStatus("success");
    } catch (generationError) {
      console.error("Unable to generate portfolio taglines:", generationError);

      setSuggestions([]);
      setStatus("error");

      setError(
        generationError.message || "The taglines could not be generated.",
      );
    }
  };

  const handleAccept = (suggestion) => {
    onChange?.({
      tagline: suggestion.text,

      taglineMeta: {
        source: "ai",
        status: "accepted",
        generatedAt: new Date().toISOString(),
        contextFingerprint: fingerprint,
        isStale: false,
      },
    });

    setSuggestions([]);
    setStatus("idle");
    setError("");
  };

  const handleDismiss = () => {
    setSuggestions([]);
    setStatus("idle");
    setError("");
  };

  const selectedStyle = getPortfolioStyleOption(context.template);

  return (
    <section className="portfolio-tagline-generator">
      <header>
        <div>
          <span>AI Assistance</span>

          <h5>Generate a Tagline</h5>

          <p>
            Generate three 8–20-word taglines using your{" "}
            {selectedStyle.label.toLowerCase()} style and saved professional
            information. <br/> Complete your Profile, Projects, Experience, Education, Skills, Certifications and training sections first for the best results.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
        >
          {isGenerating
            ? "Generating..."
            : suggestions.length
              ? "Regenerate"
              : "Generate Taglines"}
        </button>
      </header>

      {isOutdated && (
        <p className="portfolio-tagline-outdated">
          Your professional information or portfolio style has changed. Generate
          an updated tagline when ready.
        </p>
      )}

      {!canGenerate && (
        <p className="portfolio-tagline-help">
          Select a professional title or add skills, experience, or projects
          first.
        </p>
      )}

      {error && (
        <p className="portfolio-tagline-error" role="alert">
          {error}
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="portfolio-tagline-suggestions">
          {suggestions.map((suggestion, index) => (
            <article key={suggestion.id}>
              <header>
                <span>Option {index + 1}</span>

                <small>
                  {suggestion.text.trim().split(/\s+/).length} words
                </small>
              </header>

              <p>{suggestion.text}</p>

              <button type="button" onClick={() => handleAccept(suggestion)}>
                Use This Tagline
              </button>
            </article>
          ))}

          <button
            type="button"
            className="portfolio-tagline-dismiss"
            onClick={handleDismiss}
          >
            Dismiss Suggestions
          </button>
        </div>
      )}
    </section>
  );
}

export default PortfolioTaglineGenerator;
