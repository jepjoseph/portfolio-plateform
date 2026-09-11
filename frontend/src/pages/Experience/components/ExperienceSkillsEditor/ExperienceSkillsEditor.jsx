import { useId, useMemo } from "react";

import {
  SKILL_PROFICIENCY_OPTIONS,
  getSkillCategoryLabel,
  getSkillTypeLabel,
} from "../../../../config/skillConfig.js";

import { EXPERIENCE_FIELD_LIMITS } from "../../../../config/experienceConfig.js";

import { useSkillData } from "../../../../context/SkillDataContext.jsx";

import { createExperienceSkill } from "../../../../models/experienceModel.js";

import SkillSelector from "../../../skills/components/SkillSelector/SkillSelector.jsx";

import ExperienceSkillSuggestions from "./ExperienceSkillSuggestions/ExperienceSkillSuggestions.jsx";

import "./ExperienceSkillsEditor.css";

/*
 * =========================================
 * Relationship Ordering
 * =========================================
 */

function normalizeSkillOrder(skills = []) {
  return skills.map((skill, index) => ({
    ...skill,
    order: index,
  }));
}

/*
 * =========================================
 * Relationship Display
 * =========================================
 */

function getRelationshipInformation(relationship, skillsById) {
  const librarySkill = skillsById.get(relationship.skillId);

  return {
    librarySkill,

    name:
      librarySkill?.name || relationship.nameSnapshot || "Unavailable Skill",

    category:
      librarySkill?.category || relationship.categorySnapshot || "other",

    type: librarySkill?.type || relationship.typeSnapshot || "professional",

    isConnected: Boolean(librarySkill),

    isArchived: librarySkill?.status === "archived",
  };
}

/*
 * =========================================
 * Experience Skills Editor
 * =========================================
 */

function ExperienceSkillsEditor({
  experience = {},
  experienceSkills = [],
  fieldErrors = {},
  disabled = false,
  onChange,
}) {
  const sectionTitleId = useId();

  const { activeSkills, skillsById, findOrCreateSkill, isLoading } =
    useSkillData();

  const maximumSkills = EXPERIENCE_FIELD_LIMITS.maximumSkills;

  const orderedExperienceSkills = useMemo(
    () =>
      [...experienceSkills].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      ),
    [experienceSkills],
  );

  const selectedSkillIds = useMemo(
    () =>
      orderedExperienceSkills
        .map((relationship) => relationship.skillId)
        .filter(Boolean),
    [orderedExperienceSkills],
  );

  const isWorking = disabled || isLoading;

  /*
   * =========================================
   * Attach Library Skill
   * =========================================
   */

  const handleSelectSkill = (skill) => {
    if (isWorking || !skill?.id || experienceSkills.length >= maximumSkills) {
      return;
    }

    const alreadyAttached = experienceSkills.some(
      (relationship) => relationship.skillId === skill.id,
    );

    if (alreadyAttached) {
      return;
    }

    const relationship = createExperienceSkill({
      skillId: skill.id,
      nameSnapshot: skill.name,
      categorySnapshot: skill.category,
      typeSnapshot: skill.type,
      level: "",
      usageDescription: "",
      order: experienceSkills.length,
    });

    onChange?.(normalizeSkillOrder([...experienceSkills, relationship]));
  };

  /*
   * =========================================
   * Create Library Skill
   * =========================================
   *
   * SkillSelector will call handleSelectSkill()
   * after this operation succeeds.
   */

  const handleCreateSkill = async (skillData) => {
    return findOrCreateSkill({
      ...skillData,
      source: skillData.source || "manual",
      sourceContext: "experience",
    });
  };

  /*
   * =========================================
   * Remove Relationship
   * =========================================
   */

  const removeRelationship = (relationshipId) => {
    onChange?.(
      normalizeSkillOrder(
        experienceSkills.filter(
          (relationship) => relationship.id !== relationshipId,
        ),
      ),
    );
  };

  const handleRemoveSelectedSkill = (skill) => {
    const relationship = experienceSkills.find(
      (candidate) => candidate.skillId === skill.id,
    );

    if (relationship) {
      removeRelationship(relationship.id);
    }
  };

  /*
   * =========================================
   * Update Relationship
   * =========================================
   */

  const updateRelationship = (relationshipId, updates) => {
    onChange?.(
      normalizeSkillOrder(
        orderedExperienceSkills.map((relationship) =>
          relationship.id === relationshipId
            ? {
                ...relationship,
                ...updates,
              }
            : relationship,
        ),
      ),
    );
  };

  /*
   * =========================================
   * Reorder Relationship
   * =========================================
   */

  const handleMove = (relationshipId, direction) => {
    const currentIndex = orderedExperienceSkills.findIndex(
      (relationship) => relationship.id === relationshipId,
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedExperienceSkills.length) {
      return;
    }

    const reorderedSkills = [...orderedExperienceSkills];

    const [movedSkill] = reorderedSkills.splice(currentIndex, 1);

    reorderedSkills.splice(targetIndex, 0, movedSkill);

    onChange?.(normalizeSkillOrder(reorderedSkills));
  };

  return (
    <section
      className="experience-form-section experience-skills-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="experience-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Professional Capabilities</small>

          <h3 id={sectionTitleId}>Skills Used in This Experience</h3>

          <p>
            Select skills from your central Skill Library or create a reusable
            skill and attach it to this Experience.
          </p>
        </div>
      </header>

      {/*
       * =========================================
       * Shared Skill Selector
       * =========================================
       */}

      <SkillSelector
        skills={activeSkills}
        selectedSkillIds={selectedSkillIds}
        maximumSelections={maximumSkills}
        disabled={isWorking}
        allowCreate
        defaultNewSkillCategory="other"
        defaultNewSkillType="professional"
        title="Select Experience Skills"
        description="Search the central Skill Library or create a new skill used in this professional experience."
        emptyMessage="Add a new skill to begin building the shared Skill Library."
        onSelect={handleSelectSkill}
        onRemove={handleRemoveSelectedSkill}
        onCreateSkill={handleCreateSkill}
      />

      {/*
       * =========================================
       * AI Skill Suggestions
       * =========================================
       */}

      <ExperienceSkillSuggestions
        experience={experience}
        experienceSkills={experienceSkills}
        maximumExperienceSkills={maximumSkills}
        disabled={isWorking}
        onChange={onChange}
      />

      {/*
       * =========================================
       * Selected Relationships
       * =========================================
       */}

      <section className="experience-skills-selected">
        <header>
          <div>
            <span>Selected Skills</span>

            <h4>Experience Skill Set</h4>

            <p>
              Add Experience-specific proficiency and explain how each skill was
              used.
            </p>
          </div>

          <strong>{orderedExperienceSkills.length}</strong>
        </header>

        {orderedExperienceSkills.length > 0 ? (
          <div className="experience-skills-selected-list">
            {orderedExperienceSkills.map((relationship, index) => {
              const information = getRelationshipInformation(
                relationship,
                skillsById,
              );

              const relationshipError =
                fieldErrors[`skills.${index}.skillId`] ||
                fieldErrors[`skills.${index}.nameSnapshot`];

              const levelError = fieldErrors[`skills.${index}.level`];

              const usageError =
                fieldErrors[`skills.${index}.usageDescription`];

              const itemHasError = Boolean(
                relationshipError || levelError || usageError,
              );

              return (
                <article
                  key={relationship.id}
                  className={`experience-skills-selected-item ${
                    itemHasError ? "experience-skills-selected-item--error" : ""
                  }`}
                >
                  <div className="experience-skills-order">
                    <span>{String(index + 1).padStart(2, "0")}</span>

                    <div>
                      <button
                        type="button"
                        onClick={() => handleMove(relationship.id, "up")}
                        disabled={isWorking || index === 0}
                        aria-label={`Move ${information.name} up`}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMove(relationship.id, "down")}
                        disabled={
                          isWorking ||
                          index === orderedExperienceSkills.length - 1
                        }
                        aria-label={`Move ${information.name} down`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  <div className="experience-skills-selected-content">
                    <div className="experience-skills-selected-labels">
                      <span>{getSkillCategoryLabel(information.category)}</span>

                      <span>{getSkillTypeLabel(information.type)}</span>

                      {information.isArchived && (
                        <span className="experience-skills-archived-label">
                          Library Skill Archived
                        </span>
                      )}

                      {!information.isConnected && (
                        <span className="experience-skills-snapshot-label">
                          Snapshot Only
                        </span>
                      )}
                    </div>

                    <h5>{information.name}</h5>

                    <small>
                      {information.isConnected
                        ? "Connected to the central Skill Library"
                        : "The central record is unavailable; the saved name snapshot is being displayed."}
                    </small>

                    {relationshipError && (
                      <p role="alert">{relationshipError}</p>
                    )}
                  </div>

                  <div className="experience-skills-relationship-fields">
                    <div>
                      <label htmlFor={`${relationship.id}-level`}>
                        Proficiency in This Role
                      </label>

                      <select
                        id={`${relationship.id}-level`}
                        value={relationship.level || ""}
                        onChange={(event) =>
                          updateRelationship(relationship.id, {
                            level: event.target.value,
                          })
                        }
                        disabled={isWorking}
                        aria-invalid={Boolean(levelError)}
                      >
                        {SKILL_PROFICIENCY_OPTIONS.map((option) => (
                          <option
                            key={option.value || "unspecified"}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {levelError && <small role="alert">{levelError}</small>}
                    </div>

                    <div>
                      <label htmlFor={`${relationship.id}-usage`}>
                        How This Skill Was Used
                        <span>Optional</span>
                      </label>

                      <textarea
                        id={`${relationship.id}-usage`}
                        value={relationship.usageDescription || ""}
                        onChange={(event) =>
                          updateRelationship(relationship.id, {
                            usageDescription: event.target.value,
                          })
                        }
                        rows={3}
                        maxLength={
                          EXPERIENCE_FIELD_LIMITS.skillUsageDescription
                        }
                        disabled={isWorking}
                        placeholder="Example: Used Active Directory to manage accounts, permissions, and Group Policy."
                        aria-invalid={Boolean(usageError)}
                      />

                      <div className="experience-skills-usage-meta">
                        <span>
                          {(relationship.usageDescription || "").length}/
                          {EXPERIENCE_FIELD_LIMITS.skillUsageDescription}
                        </span>
                      </div>

                      {usageError && <small role="alert">{usageError}</small>}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="experience-skills-remove-button"
                    onClick={() => removeRelationship(relationship.id)}
                    disabled={isWorking}
                  >
                    Remove
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="experience-skills-empty">
            <span aria-hidden="true">✦</span>

            <h4>No skills selected</h4>

            <p>
              Search the central Skill Library, create a skill, or generate
              supported AI suggestions.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}

export default ExperienceSkillsEditor;
