import { useId, useMemo } from "react";

import { EDUCATION_FIELD_LIMITS } from "../../../../config/educationConfig.js";

import { getSkillCategoryLabel } from "../../../../config/skillConfig.js";

import { useSkillData } from "../../../../context/SkillDataContext.jsx";

import { createEducationSkill } from "../../../../models/educationModel.js";

import SkillSelector from "../../../skills/components/SkillSelector/SkillSelector.jsx";

import "./EducationSkillsEditor.css";

function normalizeOrder(relationships) {
  return relationships.map((relationship, index) => ({
    ...relationship,
    order: index,
  }));
}

function EducationSkillsEditor({
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

  const maximumItems = EDUCATION_FIELD_LIMITS.maximumSkills;

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

  const handleSelectSkill = (skill) => {
    if (!skill?.id || hasReachedMaximum) {
      return;
    }

    const alreadySelected = skillRelationships.some(
      (relationship) => relationship.skillId === skill.id,
    );

    if (alreadySelected) {
      return;
    }

    const relationship = createEducationSkill({
      skillId: skill.id,

      nameSnapshot: skill.name,

      categorySnapshot: skill.category,

      typeSnapshot: skill.type,

      order: skillRelationships.length,
    });

    onChange?.(normalizeOrder([...skillRelationships, relationship]));
  };

  const handleCreateSkill = async (skillData) => {
    const result = await findOrCreateSkill(
      {
        ...skillData,

        source: skillData.source || "manual",

        sourceContext: skillData.sourceContext || "education",
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

  const handleRemove = (relationshipId) => {
    onChange?.(
      normalizeOrder(
        skillRelationships.filter(
          (relationship) => relationship.id !== relationshipId,
        ),
      ),
    );
  };

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

    const reordered = [...orderedRelationships];

    const [movedRelationship] = reordered.splice(currentIndex, 1);

    reordered.splice(targetIndex, 0, movedRelationship);

    onChange?.(normalizeOrder(reordered));
  };

  return (
    <section
      className="education-form-section education-skills-editor"
      aria-labelledby={titleId}
    >
      <header className="education-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Academic Capabilities</small>

          <h3 id={titleId}>Skills Developed</h3>

          <p>
            Connect skills developed or meaningfully practiced during this
            education.
          </p>
        </div>
      </header>

      <SkillSelector
        skills={activeSkills}
        selectedSkillIds={selectedSkillIds}
        maximumSelections={maximumItems}
        disabled={isWorking || hasReachedMaximum}
        title="Select Education Skills"
        description="Search the central Skill Library or create a new skill."
        emptyMessage="No matching skills were found."
        defaultNewSkillCategory="other"
        defaultNewSkillType="professional"
        onSelectSkill={handleSelectSkill}
        onCreateSkill={handleCreateSkill}
      />

      {fieldErrors.skillRelationships && (
        <p className="education-skills-editor-error" role="alert">
          {fieldErrors.skillRelationships}
        </p>
      )}

      <div className="education-skills-editor-summary">
        <span>Education Skill Set</span>

        <strong>
          {orderedRelationships.length}/{maximumItems}
        </strong>
      </div>

      {orderedRelationships.length > 0 ? (
        <div className="education-skills-editor-list">
          {orderedRelationships.map((relationship, index) => {
            const librarySkill = skillsById.get(relationship.skillId);

            const skillName =
              librarySkill?.name ||
              relationship.nameSnapshot ||
              "Unavailable Skill";

            const category =
              librarySkill?.category ||
              relationship.categorySnapshot ||
              "other";

            const relationshipError =
              fieldErrors[`skillRelationships.${index}.skillId`] ||
              fieldErrors[`skillRelationships.${index}.nameSnapshot`];

            return (
              <article
                key={relationship.id}
                className={`education-skills-editor-item ${
                  relationshipError ? "education-skills-editor-item--error" : ""
                }`}
              >
                <div className="education-skills-editor-order">
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleMove(relationship.id, "up")}
                      disabled={isWorking || index === 0}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(relationship.id, "down")}
                      disabled={
                        isWorking || index === orderedRelationships.length - 1
                      }
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div>
                  <span>{getSkillCategoryLabel(category)}</span>

                  <strong>{skillName}</strong>

                  {!librarySkill && <small>Library record unavailable</small>}

                  {relationshipError && (
                    <small role="alert">{relationshipError}</small>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(relationship.id)}
                  disabled={isWorking}
                >
                  Remove
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="education-skills-editor-empty">
          <span aria-hidden="true">✦</span>

          <h4>No skills selected</h4>

          <p>Add skills developed through this educational program.</p>
        </div>
      )}
    </section>
  );
}

export default EducationSkillsEditor;
