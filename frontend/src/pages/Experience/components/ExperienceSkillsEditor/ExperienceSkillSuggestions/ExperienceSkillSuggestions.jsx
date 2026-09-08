import { useEffect, useMemo, useRef, useState } from "react";

import { API_ENDPOINTS } from "../../../../../config/api.js";

import { useSkillData } from "../../../../../context/SkillDataContext.jsx";

import { createExperienceSkill } from "../../../../../models/experienceModel.js";

import { normalizeSkillNameForComparison } from "../../../../../models/skillModel.js";

import {
  getSkillCategoryLabel,
  getSkillTypeLabel,
} from "../../../../../config/skillConfig.js";

import "./ExperienceSkillSuggestions.css";

/*
 * =========================================
 * Context Helpers
 * =========================================
 */

function getResponsibilityText(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  return value?.text?.trim() || "";
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

function getRelationshipName(relationship, skillsById) {
  return (
    skillsById.get(relationship.skillId)?.name ||
    relationship.nameSnapshot ||
    ""
  );
}

function normalizeRelationshipOrder(relationships) {
  return relationships.map((relationship, index) => ({
    ...relationship,
    order: index,
  }));
}

/*
 * =========================================
 * Experience Skill Suggestions
 * =========================================
 */

function ExperienceSkillSuggestions({
  experience = {},
  experienceSkills = [],
  maximumExperienceSkills = 50,
  disabled = false,
  onChange,
}) {
  const { skillsById, findOrCreateSkill } = useSkillData();

  const abortControllerRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);

  const [selectedNames, setSelectedNames] = useState(() => new Set());

  const [warnings, setWarnings] = useState([]);

  const [status, setStatus] = useState("idle");

  const [error, setError] = useState("");

  /*
   * =========================================
   * Attached Skill Information
   * =========================================
   */

  const attachedSkillIds = useMemo(
    () =>
      new Set(
        experienceSkills
          .map((relationship) => relationship.skillId)
          .filter(Boolean),
      ),
    [experienceSkills],
  );

  const attachedSkillNames = useMemo(
    () =>
      new Set(
        experienceSkills
          .map((relationship) =>
            normalizeSkillNameForComparison(
              getRelationshipName(relationship, skillsById),
            ),
          )
          .filter(Boolean),
      ),
    [experienceSkills, skillsById],
  );

  const existingSkillNames = useMemo(
    () =>
      experienceSkills
        .map((relationship) => getRelationshipName(relationship, skillsById))
        .filter(Boolean),
    [experienceSkills, skillsById],
  );

  /*
   * =========================================
   * Generation Readiness
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

      overview: experience.overview || "",

      responsibilities: (experience.responsibilities || [])
        .map(getResponsibilityText)
        .filter(Boolean),

      achievements: (experience.achievements || [])
        .map(normalizeAchievement)
        .filter((achievement) => achievement.text),

      leadership: {
        hasLeadershipResponsibilities:
          experience.leadership?.hasLeadershipResponsibilities === true,

        peopleManaged:
          experience.leadership?.peopleManaged === "" ||
          experience.leadership?.peopleManaged === undefined
            ? null
            : Number(experience.leadership?.peopleManaged),

        description: experience.leadership?.description || "",
      },

      existingSkills: existingSkillNames,

      technologies: (experience.technologies || [])
        .map(
          (technology) => technology?.name || technology?.value || technology,
        )
        .filter(Boolean),

      generationRules: {
        maximumSuggestions: 8,
        excludeExistingSkills: true,
        useOnlySupportedEvidence: true,
      },
    }),
    [experience, existingSkillNames],
  );

  const canGenerate = Boolean(
    generationContext.positionTitle ||
    generationContext.overview ||
    generationContext.responsibilities.length > 0 ||
    generationContext.achievements.length > 0 ||
    generationContext.technologies.length > 0 ||
    generationContext.leadership.description,
  );

  const isGenerating = status === "generating";

  const isAccepting = status === "accepting";

  const isWorking = disabled || isGenerating || isAccepting;

  /*
   * =========================================
   * Cleanup Pending Request
   * =========================================
   */

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /*
   * =========================================
   * Generate Suggestions
   * =========================================
   */

  const handleGenerate = async () => {
    if (!canGenerate || isWorking) {
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();

    abortControllerRef.current = controller;

    try {
      setStatus("generating");
      setError("");
      setWarnings([]);
      setSelectedNames(new Set());

      const response = await fetch(API_ENDPOINTS.generateExperienceSkills, {
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
          responseData.message || "The skill-suggestion request failed.",
        );
      }

      const responseSuggestions = Array.isArray(responseData.suggestions)
        ? responseData.suggestions
        : [];

      const seenNames = new Set();

      const usableSuggestions = responseSuggestions.filter((suggestion) => {
        const normalizedName = normalizeSkillNameForComparison(
          suggestion?.name,
        );

        if (
          !normalizedName ||
          attachedSkillNames.has(normalizedName) ||
          seenNames.has(normalizedName)
        ) {
          return false;
        }

        seenNames.add(normalizedName);

        return Boolean(suggestion.reason);
      });

      if (usableSuggestions.length === 0) {
        throw new Error(
          "The AI did not return any new supported skill suggestions.",
        );
      }

      setSuggestions(usableSuggestions);

      setWarnings(
        Array.isArray(responseData.warnings) ? responseData.warnings : [],
      );

      setStatus("success");
    } catch (generationError) {
      if (generationError.name === "AbortError") {
        return;
      }

      console.error("Unable to generate experience skills:", generationError);

      setSuggestions([]);
      setSelectedNames(new Set());
      setStatus("error");

      setError(
        generationError.message || "Skill suggestions could not be generated.",
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  /*
   * =========================================
   * Selection
   * =========================================
   */

  const handleSelectionChange = (skillName, checked) => {
    const normalizedName = normalizeSkillNameForComparison(skillName);

    setSelectedNames((currentNames) => {
      const nextNames = new Set(currentNames);

      if (checked) {
        nextNames.add(normalizedName);
      } else {
        nextNames.delete(normalizedName);
      }

      return nextNames;
    });
  };

  const selectableSuggestions = useMemo(
    () =>
      suggestions.filter(
        (suggestion) =>
          !attachedSkillNames.has(
            normalizeSkillNameForComparison(suggestion.name),
          ),
      ),
    [suggestions, attachedSkillNames],
  );

  const allSuggestionsSelected =
    selectableSuggestions.length > 0 &&
    selectableSuggestions.every((suggestion) =>
      selectedNames.has(normalizeSkillNameForComparison(suggestion.name)),
    );

  const handleSelectAll = () => {
    if (allSuggestionsSelected) {
      setSelectedNames(new Set());

      return;
    }

    setSelectedNames(
      new Set(
        selectableSuggestions.map((suggestion) =>
          normalizeSkillNameForComparison(suggestion.name),
        ),
      ),
    );
  };

  /*
   * =========================================
   * Accept Suggestions
   * =========================================
   */

  const acceptSuggestions = async (suggestionsToAccept) => {
    if (suggestionsToAccept.length === 0 || isWorking) {
      return;
    }

    const availableSlots = maximumExperienceSkills - experienceSkills.length;

    if (availableSlots <= 0) {
      setStatus("error");
      setError(
        `This experience already contains the maximum of ${maximumExperienceSkills} skills.`,
      );

      return;
    }

    try {
      setStatus("accepting");
      setError("");

      const acceptedRelationships = [];

      /*
       * Process sequentially so multiple new skills
       * cannot overwrite one another in temporary
       * browser storage.
       */

      for (const suggestion of suggestionsToAccept.slice(0, availableSlots)) {
        const normalizedName = normalizeSkillNameForComparison(suggestion.name);

        if (attachedSkillNames.has(normalizedName)) {
          continue;
        }

        const result = await findOrCreateSkill({
          name: suggestion.name,
          category: suggestion.category || "other",
          type: suggestion.type || "professional",
          source: "ai-suggested",
          sourceContext: "ai-experience-suggestion",
        });

        const skill = result.skill;

        if (
          attachedSkillIds.has(skill.id) ||
          acceptedRelationships.some(
            (relationship) => relationship.skillId === skill.id,
          )
        ) {
          continue;
        }

        acceptedRelationships.push(
          createExperienceSkill({
            skillId: skill.id,
            nameSnapshot: skill.name,
            level: "",
            order: experienceSkills.length + acceptedRelationships.length,
          }),
        );
      }

      if (acceptedRelationships.length === 0) {
        throw new Error(
          "The selected skills were already attached to this experience.",
        );
      }

      onChange?.(
        normalizeRelationshipOrder([
          ...experienceSkills,
          ...acceptedRelationships,
        ]),
      );

      const acceptedNames = new Set(
        suggestionsToAccept.map((suggestion) =>
          normalizeSkillNameForComparison(suggestion.name),
        ),
      );

      setSuggestions((currentSuggestions) =>
        currentSuggestions.filter(
          (suggestion) =>
            !acceptedNames.has(
              normalizeSkillNameForComparison(suggestion.name),
            ),
        ),
      );

      setSelectedNames(new Set());
      setStatus("accepted");
    } catch (acceptanceError) {
      console.error("Unable to accept skill suggestions:", acceptanceError);

      setStatus("error");

      setError(
        acceptanceError.publicMessage ||
          acceptanceError.message ||
          "The selected skills could not be added.",
      );
    }
  };

  const handleAcceptOne = (suggestion) => {
    acceptSuggestions([suggestion]);
  };

  const handleAcceptSelected = () => {
    const suggestionsToAccept = selectableSuggestions.filter((suggestion) =>
      selectedNames.has(normalizeSkillNameForComparison(suggestion.name)),
    );

    acceptSuggestions(suggestionsToAccept);
  };

  /*
   * =========================================
   * Dismiss
   * =========================================
   */

  const handleDismiss = () => {
    abortControllerRef.current?.abort();

    setSuggestions([]);
    setSelectedNames(new Set());
    setWarnings([]);
    setError("");
    setStatus("idle");
  };

  return (
    <section className="experience-skill-suggestions">
      <header className="experience-skill-suggestions-header">
        <div>
          <span>AI Assistance</span>

          <h4>Skill Suggestions</h4>

          <p>
            Generate skills supported by the overview, responsibilities,
            achievements, technologies, and leadership information entered
            above.
          </p>
        </div>

        <button
          type="button"
          className="experience-skill-generate-button"
          onClick={handleGenerate}
          disabled={!canGenerate || isWorking}
        >
          {isGenerating
            ? "Generating..."
            : suggestions.length > 0
              ? "Regenerate"
              : "Generate Skills"}
        </button>
      </header>

      {!canGenerate && (
        <p className="experience-skill-generation-help">
          Add a position title, overview, responsibility, achievement,
          technology, or leadership description before generating suggestions.
        </p>
      )}

      {isGenerating && (
        <div
          className="experience-skill-loading"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" />

          <div>
            <strong>Identifying supported skills</strong>

            <p>
              The AI is reviewing this experience for evidence of professional
              capabilities.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="experience-skill-error" role="alert">
          <div>
            <strong>Unable to process suggestions</strong>

            <p>{error}</p>
          </div>

          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      {status === "accepted" && (
        <div className="experience-skill-accepted" role="status">
          Accepted skills were added to this experience and your central Skill
          Library.
        </div>
      )}

      {warnings.length > 0 && (
        <div className="experience-skill-warnings">
          <strong>Generation notes</strong>

          <ul>
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {selectableSuggestions.length > 0 && (
        <>
          <div className="experience-skill-suggestion-toolbar">
            <label>
              <input
                type="checkbox"
                checked={allSuggestionsSelected}
                onChange={handleSelectAll}
                disabled={isWorking}
              />

              <span>Select all suggestions</span>
            </label>

            <div>
              <button
                type="button"
                onClick={handleAcceptSelected}
                disabled={isWorking || selectedNames.size === 0}
              >
                {isAccepting
                  ? "Adding..."
                  : `Add Selected (${selectedNames.size})`}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                disabled={isAccepting}
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="experience-skill-suggestion-list">
            {selectableSuggestions.map((suggestion) => {
              const normalizedName = normalizeSkillNameForComparison(
                suggestion.name,
              );

              const isSelected = selectedNames.has(normalizedName);

              return (
                <article
                  key={normalizedName}
                  className={`experience-skill-suggestion-card ${
                    isSelected
                      ? "experience-skill-suggestion-card--selected"
                      : ""
                  }`}
                >
                  <label className="experience-skill-suggestion-select">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) =>
                        handleSelectionChange(
                          suggestion.name,
                          event.target.checked,
                        )
                      }
                      disabled={isWorking}
                    />

                    <span className="sr-only">Select {suggestion.name}</span>
                  </label>

                  <div className="experience-skill-suggestion-content">
                    <div className="experience-skill-suggestion-tags">
                      <span>{getSkillCategoryLabel(suggestion.category)}</span>

                      <span>{getSkillTypeLabel(suggestion.type)}</span>
                    </div>

                    <h5>{suggestion.name}</h5>

                    <div className="experience-skill-evidence">
                      <strong>Supporting evidence</strong>

                      <p>{suggestion.reason}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="experience-skill-accept-button"
                    onClick={() => handleAcceptOne(suggestion)}
                    disabled={isWorking}
                  >
                    Add Skill
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default ExperienceSkillSuggestions;
