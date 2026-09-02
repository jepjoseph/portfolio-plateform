import { useId, useMemo, useState } from "react";

import "./ProfessionalSummaryBuilder.css";

const EMPTY_SUMMARY_META = {
  source: "manual",
  status: "empty",
  generatedAt: null,
  contextFingerprint: "",
  isStale: false,
};

const TEMPLATE_GUIDANCE = {
  professional: {
    label: "Professional",
    description: "Formal, concise, and achievement-focused.",
    recommendedWords: "55–80 words",
  },

  modern: {
    label: "Modern",
    description: "Direct, engaging, and focused on professional value.",
    recommendedWords: "45–70 words",
  },

  technical: {
    label: "Technical",
    description: "Focused on technical strengths, tools, and outcomes.",
    recommendedWords: "55–85 words",
  },

  academic: {
    label: "Academic",
    description: "Focused on education, research, instruction, and expertise.",
    recommendedWords: "70–100 words",
  },
};

/*
 * =========================================
 * Value Helpers
 * =========================================
 */

function getTextValue(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function getSkillName(skill) {
  if (typeof skill === "string") {
    return skill.trim();
  }

  return (
    skill?.name?.trim() || skill?.value?.trim() || skill?.label?.trim() || ""
  );
}

function getProfessionalTitle(profile, professionalTitleId) {
  if (!professionalTitleId) {
    return "";
  }

  const selectedTitle = (profile?.professionalTitles || []).find(
    (title) => title.id === professionalTitleId,
  );

  return selectedTitle?.name?.trim() || "";
}

/*
 * =========================================
 * Summary Context
 * =========================================
 */

function buildSummaryContext(profile, resumeDraft, documentType) {
  const professionalTitleId =
    resumeDraft?.headerSelections?.professionalTitleId || "";

  return {
    documentType,

    targetRole: getTextValue(resumeDraft?.targetRole),

    template: resumeDraft?.template || "professional",

    professionalTitle: getProfessionalTitle(profile, professionalTitleId),

    skills: (resumeDraft?.skills || []).map(getSkillName).filter(Boolean),

    experiences: (resumeDraft?.experiences || []).map((experience) => ({
      position:
        experience.position?.trim() ||
        experience.title?.trim() ||
        experience.role?.trim() ||
        "",

      company:
        experience.company?.trim() ||
        experience.organization?.trim() ||
        experience.employer?.trim() ||
        "",

      description: experience.description?.trim() || "",

      achievements: (
        experience.achievements ||
        experience.responsibilities ||
        experience.highlights ||
        []
      )
        .map((achievement) =>
          typeof achievement === "string"
            ? achievement.trim()
            : achievement?.value?.trim() ||
              achievement?.description?.trim() ||
              "",
        )
        .filter(Boolean),
    })),

    projects: (resumeDraft?.projects || []).map((project) => ({
      name: project.name?.trim() || project.title?.trim() || "",

      description: project.description?.trim() || "",

      technologies: (project.technologies || [])
        .map((technology) =>
          typeof technology === "string"
            ? technology.trim()
            : technology?.name?.trim() || technology?.value?.trim() || "",
        )
        .filter(Boolean),
    })),

    education: (resumeDraft?.education || []).map((educationItem) => ({
      degree:
        educationItem.degree?.trim() || educationItem.program?.trim() || "",

      fieldOfStudy: educationItem.fieldOfStudy?.trim() || "",

      institution:
        educationItem.institution?.trim() || educationItem.school?.trim() || "",
    })),

    certifications: (resumeDraft?.certifications || []).map(
      (certification) => ({
        name: certification.name?.trim() || certification.title?.trim() || "",

        organization:
          certification.issuingOrganization?.trim() ||
          certification.organization?.trim() ||
          "",
      }),
    ),

    existingSummary: getTextValue(resumeDraft?.summary),
  };
}

/*
 * =========================================
 * Context Fingerprint
 * =========================================
 */

function createContextFingerprint(context) {
  const contextValue = JSON.stringify({
    documentType: context.documentType,
    targetRole: context.targetRole,
    template: context.template,
    professionalTitle: context.professionalTitle,
    skills: context.skills,
    experiences: context.experiences,
    projects: context.projects,
    education: context.education,
    certifications: context.certifications,
  });

  let hash = 0;

  for (let index = 0; index < contextValue.length; index += 1) {
    hash = (hash << 5) - hash + contextValue.charCodeAt(index);
    hash |= 0;
  }

  return `summary-${Math.abs(hash).toString(36)}`;
}

/*
 * =========================================
 * Readiness
 * =========================================
 */

function getContextReadiness(context) {
  let score = 0;

  if (context.targetRole) {
    score += 2;
  }

  if (context.professionalTitle) {
    score += 2;
  }

  if (context.skills.length >= 3) {
    score += 2;
  } else if (context.skills.length > 0) {
    score += 1;
  }

  if (context.experiences.length > 0) {
    score += 2;
  }

  if (context.projects.length > 0) {
    score += 1;
  }

  if (context.education.length > 0) {
    score += 1;
  }

  if (context.certifications.length > 0) {
    score += 1;
  }

  if (score >= 9) {
    return {
      level: "excellent",
      label: "Excellent",
      description:
        "Your saved information provides excellent context for a targeted summary.",
    };
  }

  if (score >= 6) {
    return {
      level: "strong",
      label: "Strong",
      description:
        "Your profile provides strong context for a professional summary.",
    };
  }

  if (score >= 4) {
    return {
      level: "good",
      label: "Good",
      description:
        "The AI can generate a useful draft, but additional information can improve it.",
    };
  }

  return {
    level: "basic",
    label: "Basic",
    description:
      "Add skills, experience, or projects for a more specific summary.",
  };
}

/*
 * =========================================
 * Generated Suggestions
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
          id: `summary-suggestion-${index + 1}`,
          label: `Option ${index + 1}`,
          text: suggestion.trim(),
        };
      }

      return {
        id: suggestion.id || `summary-suggestion-${index + 1}`,

        label: suggestion.label || `Option ${index + 1}`,

        text: suggestion.text?.trim() || "",
      };
    })
    .filter((suggestion) => suggestion.text);
}

/*
 * =========================================
 * Professional Summary Builder
 * =========================================
 */

function ProfessionalSummaryBuilder({
  profile = {},
  resumeDraft = {},
  summary = "",
  summaryMeta = EMPTY_SUMMARY_META,
  documentType = "resume",
  onChange,
}) {
  const titleId = useId();
  const textareaId = useId();

  const [suggestions, setSuggestions] = useState([]);

  const [generationStatus, setGenerationStatus] = useState("idle");

  const [generationError, setGenerationError] = useState("");

  const [generationWarnings, setGenerationWarnings] = useState([]);

  const currentSummaryMeta = {
    ...EMPTY_SUMMARY_META,
    ...summaryMeta,
  };

  /*
   * =========================================
   * Generation Context
   * =========================================
   */

  const summaryContext = useMemo(
    () =>
      buildSummaryContext(
        profile,
        {
          ...resumeDraft,
          summary,
        },
        documentType,
      ),
    [profile, resumeDraft, summary, documentType],
  );

  const contextFingerprint = useMemo(
    () => createContextFingerprint(summaryContext),
    [summaryContext],
  );

  const readiness = useMemo(
    () => getContextReadiness(summaryContext),
    [summaryContext],
  );

  const selectedTemplate =
    TEMPLATE_GUIDANCE[summaryContext.template] ||
    TEMPLATE_GUIDANCE.professional;

  const canGenerate = Boolean(
    summaryContext.targetRole || summaryContext.professionalTitle,
  );

  const isGenerating = generationStatus === "loading";

  const isAiSummaryStale =
    currentSummaryMeta.source === "ai" &&
    Boolean(currentSummaryMeta.contextFingerprint) &&
    currentSummaryMeta.contextFingerprint !== contextFingerprint;

  /*
   * =========================================
   * Counts
   * =========================================
   */

  const wordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0;

  const characterCount = summary.length;

  /*
   * =========================================
   * Manual Summary
   * =========================================
   */

  const handleSummaryChange = (event) => {
    const { value } = event.target;

    onChange?.({
      summary: value,

      summaryMeta: {
        source: "manual",
        status: value.trim() ? "draft" : "empty",
        generatedAt: null,
        contextFingerprint: "",
        isStale: false,
      },
    });

    setGenerationError("");
  };

  /*
   * =========================================
   * AI Generation
   * =========================================
   */

  const handleGenerateSummary = async () => {
    if (!canGenerate || isGenerating) {
      return;
    }

    try {
      setGenerationStatus("loading");
      setGenerationError("");
      setGenerationWarnings([]);

      const response = await fetch("/api/ai/resume-summary", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...summaryContext,

          generationRules: {
            useOnlyProvidedFacts: true,
            doNotInventQualifications: true,
            doNotInventMetrics: true,
            numberOfSuggestions: 3,
            recommendedWords: selectedTemplate.recommendedWords,
          },
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.message || "The summary-generation request failed.",
        );
      }

      const generatedSuggestions = normalizeSuggestions(responseData);

      if (generatedSuggestions.length === 0) {
        throw new Error(
          "The AI did not return any usable summary suggestions.",
        );
      }

      setSuggestions(generatedSuggestions);

      setGenerationWarnings(
        Array.isArray(responseData.warnings) ? responseData.warnings : [],
      );

      setGenerationStatus("success");
    } catch (error) {
      console.error("Unable to generate professional summary:", error);

      setSuggestions([]);
      setGenerationStatus("error");

      setGenerationError(
        error.message ||
          "The summary could not be generated. Please try again.",
      );
    }
  };

  /*
   * =========================================
   * Accept Suggestion
   * =========================================
   */

  const handleAcceptSuggestion = (selectedSuggestion) => {
    onChange?.({
      summary: selectedSuggestion.text,

      summaryMeta: {
        source: "ai",
        status: "accepted",
        generatedAt: new Date().toISOString(),
        contextFingerprint,
        isStale: false,
      },
    });

    setSuggestions([]);
    setGenerationWarnings([]);
    setGenerationStatus("idle");
    setGenerationError("");
  };

  /*
   * =========================================
   * Suggestion Actions
   * =========================================
   */

  const handleDismissSuggestions = () => {
    setSuggestions([]);
    setGenerationWarnings([]);
    setGenerationStatus("idle");
    setGenerationError("");
  };

  const handleClearSummary = () => {
    onChange?.({
      summary: "",

      summaryMeta: {
        ...EMPTY_SUMMARY_META,
      },
    });

    handleDismissSuggestions();
  };

  return (
    <section className="professional-summary-builder" aria-labelledby={titleId}>
      {/* =====================================
          Header
          ===================================== */}

      <header className="professional-summary-builder-header">
        <div>
          <span>Professional Introduction</span>

          <h4 id={titleId}>Professional Summary</h4>

          <p>
            Write your own summary or generate targeted suggestions using the
            professional information saved in your profile and resume.
          </p>
        </div>

        <div className="professional-summary-builder-header-actions">
          <span
            className={`professional-summary-source professional-summary-source--${currentSummaryMeta.source}`}
          >
            {currentSummaryMeta.source === "ai" ? "AI Assisted" : "Manual"}
          </span>

          {summary && (
            <button
              type="button"
              className="professional-summary-clear"
              onClick={handleClearSummary}
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* =====================================
          Context Readiness
          ===================================== */}

      <section className="professional-summary-context">
        <header>
          <div>
            <span>Generation Context</span>

            <h5>Summary Readiness</h5>
          </div>

          <span
            className={`professional-summary-readiness professional-summary-readiness--${readiness.level}`}
          >
            {readiness.label}
          </span>
        </header>

        <p>{readiness.description}</p>

        <div className="professional-summary-context-items">
          <span>
            Target role
            <strong>{summaryContext.targetRole || "Not provided"}</strong>
          </span>

          <span>
            Professional title
            <strong>
              {summaryContext.professionalTitle || "Not selected"}
            </strong>
          </span>

          <span>
            Skills
            <strong>{summaryContext.skills.length}</strong>
          </span>

          <span>
            Experiences
            <strong>{summaryContext.experiences.length}</strong>
          </span>

          <span>
            Projects
            <strong>{summaryContext.projects.length}</strong>
          </span>

          <span>
            Certifications
            <strong>{summaryContext.certifications.length}</strong>
          </span>
        </div>
      </section>

      {/* =====================================
          Stale Summary Warning
          ===================================== */}

      {isAiSummaryStale && (
        <div className="professional-summary-stale-warning" role="status">
          <div>
            <strong>Your resume information has changed.</strong>

            <p>
              This summary was generated using older information. You can keep
              it, edit it manually, or generate updated suggestions.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={!canGenerate || isGenerating}
          >
            Regenerate
          </button>
        </div>
      )}

      {/* =====================================
          Summary Editor
          ===================================== */}

      <section className="professional-summary-editor">
        <div className="professional-summary-editor-label">
          <label htmlFor={textareaId}>Summary</label>

          <span>
            {wordCount} {wordCount === 1 ? "word" : "words"}
            {" · "}
            {characterCount}/1400 characters
          </span>
        </div>

        <textarea
          id={textareaId}
          value={summary}
          onChange={handleSummaryChange}
          rows={7}
          maxLength={1400}
          placeholder={
            documentType === "portfolio"
              ? "Introduce your professional background, interests, strengths, and goals..."
              : "Write a concise summary targeted to this resume’s position..."
          }
        />

        <div className="professional-summary-editor-footer">
          <div>
            <span>{selectedTemplate.label} style</span>

            <small>
              {selectedTemplate.description} Recommended length:{" "}
              {selectedTemplate.recommendedWords}.
            </small>
          </div>

          <button
            type="button"
            className="professional-summary-generate"
            onClick={handleGenerateSummary}
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating
              ? "Generating..."
              : suggestions.length > 0
                ? "Regenerate"
                : "Generate with AI"}
          </button>
        </div>

        {!canGenerate && (
          <p className="professional-summary-generation-help">
            Add a target position or select a professional title before
            generating a summary.
          </p>
        )}
      </section>

      {/* =====================================
          Loading
          ===================================== */}

      {isGenerating && (
        <div
          className="professional-summary-loading"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" />

          <div>
            <strong>Generating targeted summaries</strong>

            <p>The AI is reviewing your saved professional information.</p>
          </div>
        </div>
      )}

      {/* =====================================
          Generation Error
          ===================================== */}

      {generationError && (
        <div className="professional-summary-error" role="alert">
          <div>
            <strong>Unable to generate the summary</strong>

            <p>{generationError}</p>
          </div>

          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={!canGenerate || isGenerating}
          >
            Try Again
          </button>
        </div>
      )}

      {/* =====================================
          Generation Warnings
          ===================================== */}

      {generationWarnings.length > 0 && (
        <div className="professional-summary-warnings">
          <strong>Suggestions for better results</strong>

          <ul>
            {generationWarnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* =====================================
          AI Suggestions
          ===================================== */}

      {suggestions.length > 0 && (
        <section
          className="professional-summary-suggestions"
          aria-labelledby={`${titleId}-suggestions`}
        >
          <header className="professional-summary-suggestions-header">
            <div>
              <span>AI Suggestions</span>

              <h5 id={`${titleId}-suggestions`}>Choose a Summary</h5>

              <p>
                Review every suggestion carefully. You can accept one and
                continue editing it.
              </p>
            </div>

            <button
              type="button"
              className="professional-summary-dismiss"
              onClick={handleDismissSuggestions}
            >
              Dismiss
            </button>
          </header>

          <div className="professional-summary-suggestions-list">
            {suggestions.map((suggestion, index) => (
              <article
                key={suggestion.id}
                className="professional-summary-suggestion"
              >
                <header>
                  <div>
                    <span>Option {index + 1}</span>

                    <h6>{suggestion.label}</h6>
                  </div>

                  <span>
                    {suggestion.text.trim().split(/\s+/).length} words
                  </span>
                </header>

                <p>{suggestion.text}</p>

                <button
                  type="button"
                  onClick={() => handleAcceptSuggestion(suggestion)}
                >
                  Use This Summary
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* =====================================
          AI Notice
          ===================================== */}

      <footer className="professional-summary-ai-notice">
        <span aria-hidden="true">✦</span>

        <p>
          AI-generated content can contain mistakes. Review and edit every
          summary before using it in a resume or public portfolio.
        </p>
      </footer>
    </section>
  );
}

export default ProfessionalSummaryBuilder;
