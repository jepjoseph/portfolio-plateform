import { useId, useMemo } from "react";

import { TRAINING_FIELD_LIMITS } from "../../../../config/trainingConfig.js";
import { getSkillCategoryLabel } from "../../../../config/skillConfig.js";

import { useSkillData } from "../../../../context/SkillDataContext.jsx";

import { createTrainingSkillRelationship } from "../../../../models/trainingModel.js";

import SkillSelector from "../../../skills/components/SkillSelector/SkillSelector.jsx";

import "./TrainingSkillsEditor.css";

/*
 * =========================================
 * Order Normalization
 * =========================================
 */

function normalizeOrder(relationships) {
  return relationships.map((relationship, index) => ({
    ...relationship,
    order: index,
  }));
}

/*
 * =========================================
 * Training Skills Editor
 * =========================================
 */

function TrainingSkillsEditor({
  skillRelationships = [],
  fieldErrors = {},
  disabled = false,
  onChange,
}) {
  const titleId = useId();

  const {
    activeSkills,
    skillsById,
    isLoading: areSkillsLoading,
    findOrCreateSkill,
  } = useSkillData();

  const maximumItems = TRAINING_FIELD_LIMITS.maximumSkills;

  const orderedRelationships = useMemo(
    () =>
      [...skillRelationships].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      ),
    [skillRelationships],
  );

  const selectedSkillIds = useMemo(
    () =>
      orderedRelationships
        .map(
          (relationship) => relationship.skillId || relationship.profileSkillId,
        )
        .filter(Boolean),
    [orderedRelationships],
  );

  const isWorking = disabled || areSkillsLoading;

  const hasReachedMaximum = orderedRelationships.length >= maximumItems;

  /*
   * =========================================
   * Select Existing Skill
   * =========================================
   */

  const handleSelectSkill = (skill) => {
    if (!skill?.id || isWorking || hasReachedMaximum) {
      return;
    }

    const alreadySelected = skillRelationships.some(
      (relationship) =>
        (relationship.skillId || relationship.profileSkillId) === skill.id,
    );

    if (alreadySelected) {
      return;
    }

    const relationship = createTrainingSkillRelationship({
      skillId: skill.id,

      nameSnapshot: skill.name,

      categorySnapshot: skill.category,

      typeSnapshot: skill.type,

      order: skillRelationships.length,
    });

    onChange?.(normalizeOrder([...skillRelationships, relationship]));
  };

  /*
   * =========================================
   * Create Central Skill
   * =========================================
   */

  const handleCreateSkill = async (skillData) => {
    /*
     * SkillSelector calls handleSelectSkill after this
     * operation succeeds. Do not attach the relationship
     * here, or the skill will be added twice.
     */

    return findOrCreateSkill(
      {
        ...skillData,

        source: skillData.source || "manual",

        sourceContext: skillData.sourceContext || "training",
      },
      {
        restoreArchived: true,
      },
    );
  };

  /*
   * =========================================
   * Remove Relationship
   * =========================================
   */

  const handleRemove = (relationshipId) => {
    const nextRelationships = skillRelationships.filter(
      (relationship) => relationship.id !== relationshipId,
    );

    onChange?.(normalizeOrder(nextRelationships));
  };

  /*
   * =========================================
   * Reorder Relationships
   * =========================================
   */

  const handleMove = (relationshipId, direction) => {
    const currentIndex = orderedRelationships.findIndex(
      (relationship) => relationship.id === relationshipId,
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedRelationships.length) {
      return;
    }

    const reorderedRelationships = [...orderedRelationships];

    const [movedRelationship] = reorderedRelationships.splice(currentIndex, 1);

    reorderedRelationships.splice(targetIndex, 0, movedRelationship);

    onChange?.(normalizeOrder(reorderedRelationships));
  };

  /*
   * =========================================
   * Library Lookup
   * =========================================
   */

  const getLibrarySkill = (skillId) => {
    if (!skillId) {
      return null;
    }

    if (skillsById instanceof Map) {
      return skillsById.get(skillId) || null;
    }

    return skillsById?.[skillId] || null;
  };

  return (
    <section
      className="training-form-section training-skills-editor"
      aria-labelledby={titleId}
    >
      <header className="training-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Professional Capabilities</small>

          <h3 id={titleId}>Skills Developed</h3>

          <p>
            Connect skills learned, strengthened, or meaningfully practiced
            during this training.
          </p>
        </div>
      </header>

      <SkillSelector
        skills={activeSkills}
        selectedSkillIds={selectedSkillIds}
        maximumSelections={maximumItems}
        disabled={isWorking || hasReachedMaximum}
        title="Select Training Skills"
        description="Search the central Skill Library or create a new reusable skill."
        emptyMessage="No active skills are currently available."
        defaultNewSkillCategory="other"
        defaultNewSkillType="professional"
        onSelect={handleSelectSkill}
        onCreateSkill={handleCreateSkill}
      />

      {fieldErrors.skillRelationships && (
        <p className="training-skills-editor-error" role="alert">
          {fieldErrors.skillRelationships}
        </p>
      )}

      <div className="training-skills-editor-summary">
        <span>Training Skill Set</span>

        <strong>
          {orderedRelationships.length}/{maximumItems}
        </strong>
      </div>

      {orderedRelationships.length > 0 ? (
        <div className="training-skills-editor-list">
          {orderedRelationships.map((relationship, index) => {
            const relationshipSkillId =
              relationship.skillId || relationship.profileSkillId;

            const librarySkill = getLibrarySkill(relationshipSkillId);

            const skillName =
              librarySkill?.name ||
              relationship.nameSnapshot ||
              "Unavailable Skill";

            const category =
              librarySkill?.category ||
              relationship.categorySnapshot ||
              "other";

            const type =
              librarySkill?.type || relationship.typeSnapshot || "professional";

            const relationshipError =
              fieldErrors[`skillRelationships.${index}.skillId`] ||
              fieldErrors[`skillRelationships.${index}.nameSnapshot`];

            return (
              <article
                key={relationship.id}
                className={`training-skills-editor-item ${
                  relationshipError ? "training-skills-editor-item--error" : ""
                }`}
              >
                <div className="training-skills-editor-order">
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleMove(relationship.id, "up")}
                      disabled={isWorking || index === 0}
                      aria-label={`Move ${skillName} up`}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(relationship.id, "down")}
                      disabled={
                        isWorking || index === orderedRelationships.length - 1
                      }
                      aria-label={`Move ${skillName} down`}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="training-skills-editor-content">
                  <div className="training-skills-editor-labels">
                    <span>{getSkillCategoryLabel(category)}</span>

                    <span>{type}</span>
                  </div>

                  <strong>{skillName}</strong>

                  {!librarySkill && (
                    <small className="training-skills-editor-warning">
                      Library record unavailable; saved snapshot will be used.
                    </small>
                  )}

                  {relationshipError && (
                    <small
                      className="training-skills-editor-field-error"
                      role="alert"
                    >
                      {relationshipError}
                    </small>
                  )}
                </div>

                <button
                  type="button"
                  className="training-skills-editor-remove"
                  onClick={() => handleRemove(relationship.id)}
                  disabled={isWorking}
                  aria-label={`Remove ${skillName} from this training`}
                >
                  Remove
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="training-skills-editor-empty">
          <span aria-hidden="true">✦</span>

          <h4>No skills selected</h4>

          <p>Add skills developed or practiced through this training.</p>
        </div>
      )}
    </section>
  );
}

export default TrainingSkillsEditor;
