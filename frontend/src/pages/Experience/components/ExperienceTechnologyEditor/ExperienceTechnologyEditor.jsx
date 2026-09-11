import { useId, useMemo } from "react";

import { EXPERIENCE_FIELD_LIMITS } from "../../../../../config/experienceConfig.js";

import {
  getSkillCategoryLabel,
  SKILL_PROFICIENCY_OPTIONS,
} from "../../../../../config/skillConfig.js";

import { useSkillData } from "../../../../../context/SkillDataContext.jsx";

import { createExperienceTechnology } from "../../../../../models/experienceModel.js";

import SkillSelector from "../../../../Skills/components/SkillSelector/SkillSelector.jsx";

import "./ExperienceTechnologyEditor.css";

/*
 * =========================================
 * Relationship Helpers
 * =========================================
 */

function normalizeTechnologyOrder(technologies) {
  return technologies.map((technology, index) => ({
    ...technology,
    order: index,
  }));
}

function getTechnologySkillId(technology) {
  return technology?.skillId || technology?.profileSkillId || "";
}

function getTechnologyName(technology, librarySkill) {
  return (
    librarySkill?.name ||
    technology?.nameSnapshot ||
    technology?.name ||
    "Unavailable Technology"
  );
}

/*
 * =========================================
 * Experience Technology Editor
 * =========================================
 */

function ExperienceTechnologyEditor({
  technologies = [],
  fieldErrors = {},
  disabled = false,
  onChange,
}) {
  const sectionTitleId = useId();

  const {
    activeSkills,
    skillsById,
    isLoading: areSkillsLoading,
    findOrCreateSkill,
  } = useSkillData();

  const maximumItems = EXPERIENCE_FIELD_LIMITS.maximumTechnologies;

  const isWorking = disabled || areSkillsLoading;

  /*
   * =========================================
   * Ordered Relationships
   * =========================================
   */

  const orderedTechnologies = useMemo(
    () =>
      [...technologies].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      ),
    [technologies],
  );

  const selectedSkillIds = useMemo(
    () => orderedTechnologies.map(getTechnologySkillId).filter(Boolean),
    [orderedTechnologies],
  );

  const hasReachedMaximum = orderedTechnologies.length >= maximumItems;

  /*
   * =========================================
   * Add Existing Library Skill
   * =========================================
   */

  const handleSelectSkill = (skill) => {
    if (!skill?.id || hasReachedMaximum) {
      return;
    }

    const alreadySelected = technologies.some(
      (technology) => getTechnologySkillId(technology) === skill.id,
    );

    if (alreadySelected) {
      return;
    }

    const relationship = createExperienceTechnology({
      skillId: skill.id,

      nameSnapshot: skill.name,
      name: skill.name,

      category: skill.category,

      proficiency: "",

      usageDescription: "",

      order: technologies.length,
    });

    onChange?.(normalizeTechnologyOrder([...technologies, relationship]));
  };

  /*
   * =========================================
   * Create Central Skill
   * =========================================
   */

  const handleCreateSkill = async (skillData) => {
    const result = await findOrCreateSkill(
      {
        ...skillData,

        category: skillData.category || "tools-platforms",

        type: skillData.type || "tool",

        source: skillData.source || "manual",

        sourceContext:
          skillData.sourceContext || "experience-technology-editor",
      },
      {
        restoreArchived: true,
      },
    );

    if (result?.skill) {
      handleSelectSkill(result.skill);
    }

    return result;
  };

  /*
   * =========================================
   * Relationship Updates
   * =========================================
   */

  const handleRelationshipChange = (relationshipId, updates) => {
    const updatedTechnologies = technologies.map((technology) =>
      technology.id === relationshipId
        ? {
            ...technology,
            ...updates,
          }
        : technology,
    );

    onChange?.(normalizeTechnologyOrder(updatedTechnologies));
  };

  const handleRemove = (relationshipId) => {
    const remainingTechnologies = technologies.filter(
      (technology) => technology.id !== relationshipId,
    );

    onChange?.(normalizeTechnologyOrder(remainingTechnologies));
  };

  /*
   * =========================================
   * Reordering
   * =========================================
   */

  const handleMove = (relationshipId, direction) => {
    const currentIndex = orderedTechnologies.findIndex(
      (technology) => technology.id === relationshipId,
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedTechnologies.length) {
      return;
    }

    const reorderedTechnologies = [...orderedTechnologies];

    const [movedTechnology] = reorderedTechnologies.splice(currentIndex, 1);

    reorderedTechnologies.splice(targetIndex, 0, movedTechnology);

    onChange?.(normalizeTechnologyOrder(reorderedTechnologies));
  };

  return (
    <section
      className="experience-form-section experience-technology-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="experience-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Tools and Technologies</small>

          <h3 id={sectionTitleId}>Technologies Used in This Experience</h3>

          <p>
            Select tools, platforms, systems, and technologies from your central
            Skill Library. You can also create a new library skill without
            leaving the experience form.
          </p>
        </div>
      </header>

      <SkillSelector
        skills={activeSkills}
        selectedSkillIds={selectedSkillIds}
        maximumSelections={maximumItems}
        disabled={isWorking || hasReachedMaximum}
        title="Select Technologies and Tools"
        description="Search the central Skill Library or create a tool that is not saved yet."
        emptyMessage="No matching tools or technologies were found."
        defaultNewSkillCategory="tools-platforms"
        defaultNewSkillType="tool"
        onSelectSkill={handleSelectSkill}
        onCreateSkill={handleCreateSkill}
      />

      {fieldErrors.technologies && (
        <p className="experience-technology-editor-error" role="alert">
          {fieldErrors.technologies}
        </p>
      )}

      <div className="experience-technology-editor-summary">
        <span>Experience Technology Set</span>

        <strong>
          {orderedTechnologies.length}/{maximumItems}
        </strong>
      </div>

      {orderedTechnologies.length > 0 ? (
        <div className="experience-technology-editor-list">
          {orderedTechnologies.map((relationship, index) => {
            const skillId = getTechnologySkillId(relationship);

            const librarySkill = skillId ? skillsById.get(skillId) : null;

            const technologyName = getTechnologyName(
              relationship,
              librarySkill,
            );

            const category =
              librarySkill?.category ||
              relationship.category ||
              "tools-platforms";

            const isArchived = librarySkill?.status === "archived";

            const isUnavailable = Boolean(skillId) && !librarySkill;

            const relationshipError =
              fieldErrors[`technologies.${index}.skillId`] ||
              fieldErrors[`technologies.${index}.nameSnapshot`] ||
              fieldErrors[`technologies.${index}.name`] ||
              fieldErrors[`technologies.${index}.category`];

            const proficiencyError =
              fieldErrors[`technologies.${index}.proficiency`];

            const usageDescriptionError =
              fieldErrors[`technologies.${index}.usageDescription`];

            return (
              <article
                key={relationship.id}
                className={`experience-technology-editor-item ${
                  relationshipError || proficiencyError || usageDescriptionError
                    ? "experience-technology-editor-item--error"
                    : ""
                }`}
              >
                <div className="experience-technology-editor-order">
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleMove(relationship.id, "up")}
                      disabled={isWorking || index === 0}
                      aria-label={`Move ${technologyName} up`}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(relationship.id, "down")}
                      disabled={
                        isWorking || index === orderedTechnologies.length - 1
                      }
                      aria-label={`Move ${technologyName} down`}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="experience-technology-editor-content">
                  <span>{getSkillCategoryLabel(category)}</span>

                  <strong>{technologyName}</strong>

                  <div className="experience-technology-editor-badges">
                    {librarySkill && <small>Skill Library</small>}

                    {isArchived && (
                      <small className="experience-technology-editor-badge--warning">
                        Archived
                      </small>
                    )}

                    {isUnavailable && (
                      <small className="experience-technology-editor-badge--warning">
                        Library record unavailable
                      </small>
                    )}

                    {!skillId && (
                      <small className="experience-technology-editor-badge--legacy">
                        Legacy record
                      </small>
                    )}
                  </div>

                  {relationshipError && (
                    <small
                      className="experience-technology-editor-field-error"
                      role="alert"
                    >
                      {relationshipError}
                    </small>
                  )}
                </div>

                <div className="experience-technology-editor-fields">
                  <div>
                    <label htmlFor={`${relationship.id}-proficiency`}>
                      Proficiency in this experience
                    </label>

                    <select
                      id={`${relationship.id}-proficiency`}
                      value={relationship.proficiency || ""}
                      onChange={(event) =>
                        handleRelationshipChange(relationship.id, {
                          proficiency: event.target.value,
                        })
                      }
                      disabled={isWorking}
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

                    {proficiencyError && (
                      <small role="alert">{proficiencyError}</small>
                    )}
                  </div>

                  <div>
                    <label htmlFor={`${relationship.id}-usage`}>
                      How it was used
                      <small> Optional</small>
                    </label>

                    <textarea
                      id={`${relationship.id}-usage`}
                      rows={3}
                      value={relationship.usageDescription || ""}
                      onChange={(event) =>
                        handleRelationshipChange(relationship.id, {
                          usageDescription: event.target.value,
                        })
                      }
                      maxLength={
                        EXPERIENCE_FIELD_LIMITS.technologyUsageDescription
                      }
                      disabled={isWorking}
                      placeholder={`Example: Used ${technologyName} to automate deployment and monitor application health.`}
                    />

                    <div className="experience-technology-editor-character-count">
                      <span>{usageDescriptionError || ""}</span>

                      <small>
                        {(relationship.usageDescription || "").length}/
                        {EXPERIENCE_FIELD_LIMITS.technologyUsageDescription}
                      </small>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="experience-technology-editor-remove-button"
                  onClick={() => handleRemove(relationship.id)}
                  disabled={isWorking}
                  aria-label={`Remove ${technologyName} from this experience`}
                >
                  Remove
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="experience-technology-editor-empty">
          <span aria-hidden="true">◇</span>

          <h4>No technologies selected</h4>

          <p>
            Search the Skill Library and add the tools, systems, or technologies
            used in this experience.
          </p>
        </div>
      )}
    </section>
  );
}

export default ExperienceTechnologyEditor;
