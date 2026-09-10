import { useId, useMemo, useState } from "react";

import {
  SKILL_CATEGORY_OPTIONS,
  SKILL_PROFICIENCY_OPTIONS,
  SKILL_TYPE_OPTIONS,
  getSkillCategoryLabel,
  getSkillTypeLabel,
} from "../../../../config/skillConfig.js";

import { EXPERIENCE_FIELD_LIMITS } from "../../../../config/experienceConfig.js";

import { createExperienceSkill } from "../../../../models/experienceModel.js";

import { normalizeSkillNameForComparison } from "../../../../models/skillModel.js";

import { useSkillData } from "../../../../context/SkillDataContext.jsx";

import ExperienceSkillSuggestions from "./ExperienceSkillSuggestions/ExperienceSkillSuggestions.jsx";

import "./ExperienceSkillsEditor.css";

/*
 * =========================================
 * Relationship Ordering
 * =========================================
 */

function normalizeSkillOrder(skills) {
  return skills.map((skill, index) => ({
    ...skill,
    order: index,
  }));
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
  const searchId = useId();
  const categoryId = useId();
  const typeId = useId();

  const { activeSkills, skillsById, findOrCreateSkill, isLoading } =
    useSkillData();

  const [searchQuery, setSearchQuery] = useState("");

  const [newSkillCategory, setNewSkillCategory] = useState("other");

  const [newSkillType, setNewSkillType] = useState("professional");

  const [editorStatus, setEditorStatus] = useState("idle");

  const [editorMessage, setEditorMessage] = useState("");

  const maximumSkills = EXPERIENCE_FIELD_LIMITS.maximumSkills;

  const hasReachedMaximum = experienceSkills.length >= maximumSkills;

  /*
   * =========================================
   * Selected Skill IDs
   * =========================================
   */

  const selectedSkillIds = useMemo(
    () =>
      new Set(experienceSkills.map((skill) => skill.skillId).filter(Boolean)),
    [experienceSkills],
  );

  /*
   * =========================================
   * Search Results
   * =========================================
   */

  const searchResults = useMemo(() => {
    const normalizedQuery = normalizeSkillNameForComparison(searchQuery);

    if (!normalizedQuery) {
      return activeSkills
        .filter((skill) => !selectedSkillIds.has(skill.id))
        .slice(0, 8);
    }

    return activeSkills
      .filter((skill) => {
        if (selectedSkillIds.has(skill.id)) {
          return false;
        }

        const searchableValues = [
          skill.name,
          skill.description,
          getSkillCategoryLabel(skill.category),
          getSkillTypeLabel(skill.type),
          ...(skill.aliases || []),
        ]
          .map(normalizeSkillNameForComparison)
          .filter(Boolean);

        return searchableValues.some((value) =>
          value.includes(normalizedQuery),
        );
      })
      .slice(0, 8);
  }, [activeSkills, searchQuery, selectedSkillIds]);

  /*
   * =========================================
   * Exact Library Match
   * =========================================
   */

  const exactLibraryMatch = useMemo(() => {
    const normalizedQuery = normalizeSkillNameForComparison(searchQuery);

    if (!normalizedQuery) {
      return null;
    }

    return (
      activeSkills.find((skill) => {
        if (normalizeSkillNameForComparison(skill.name) === normalizedQuery) {
          return true;
        }

        return (skill.aliases || []).some(
          (alias) => normalizeSkillNameForComparison(alias) === normalizedQuery,
        );
      }) || null
    );
  }, [activeSkills, searchQuery]);

  const canCreateNewSkill =
    Boolean(searchQuery.trim()) && !exactLibraryMatch && !hasReachedMaximum;

  /*
   * =========================================
   * Attach Existing Skill
   * =========================================
   */

  const handleAttachSkill = (skill) => {
    if (disabled || hasReachedMaximum || selectedSkillIds.has(skill.id)) {
      return;
    }

    const relationship = createExperienceSkill({
      skillId: skill.id,
      nameSnapshot: skill.name,
      level: "",
      order: experienceSkills.length,
    });

    onChange?.(normalizeSkillOrder([...experienceSkills, relationship]));

    setSearchQuery("");
    setEditorStatus("success");
    setEditorMessage(`"${skill.name}" was added to this experience.`);
  };

  /*
   * =========================================
   * Create and Attach
   * =========================================
   */

  const handleCreateSkill = async () => {
    const name = searchQuery.trim();

    if (!name) {
      setEditorStatus("error");
      setEditorMessage("Enter a skill name before creating it.");

      return;
    }

    if (hasReachedMaximum) {
      setEditorStatus("error");
      setEditorMessage(`You can add no more than ${maximumSkills} skills.`);

      return;
    }

    try {
      setEditorStatus("loading");
      setEditorMessage("");

      const result = await findOrCreateSkill({
        name,
        category: newSkillCategory,
        type: newSkillType,
        source: "manual",
        sourceContext: "experience",
      });

      const skill = result.skill;

      if (selectedSkillIds.has(skill.id)) {
        setEditorStatus("error");
        setEditorMessage(
          `"${skill.name}" is already attached to this experience.`,
        );

        return;
      }

      const relationship = createExperienceSkill({
        skillId: skill.id,
        nameSnapshot: skill.name,
        level: "",
        order: experienceSkills.length,
      });

      onChange?.(normalizeSkillOrder([...experienceSkills, relationship]));

      setSearchQuery("");
      setNewSkillCategory("other");
      setNewSkillType("professional");

      setEditorStatus("success");

      setEditorMessage(
        result.created
          ? `"${skill.name}" was added to your Skill Library and this experience.`
          : `"${skill.name}" already existed and was attached to this experience.`,
      );
    } catch (error) {
      console.error("Unable to create or attach skill:", error);

      setEditorStatus("error");

      setEditorMessage(
        error?.publicMessage ||
          error?.message ||
          "The skill could not be added.",
      );
    }
  };

  /*
   * =========================================
   * Update Relationship
   * =========================================
   */

  const handleLevelChange = (relationshipId, level) => {
    onChange?.(
      experienceSkills.map((skill) =>
        skill.id === relationshipId
          ? {
              ...skill,
              level,
            }
          : skill,
      ),
    );

    setEditorMessage("");
    setEditorStatus("idle");
  };

  /*
   * =========================================
   * Remove Relationship
   * =========================================
   */

  const handleRemove = (relationshipId) => {
    const relationship = experienceSkills.find(
      (skill) => skill.id === relationshipId,
    );

    onChange?.(
      normalizeSkillOrder(
        experienceSkills.filter((skill) => skill.id !== relationshipId),
      ),
    );

    setEditorStatus("success");

    setEditorMessage(
      relationship
        ? `"${getRelationshipName(
            relationship,
            skillsById,
          )}" was removed from this experience. The central Skill Library record was not deleted.`
        : "The skill was removed from this experience.",
    );
  };

  /*
   * =========================================
   * Reorder Relationship
   * =========================================
   */

  const handleMove = (relationshipId, direction) => {
    const orderedSkills = [...experienceSkills].sort(
      (first, second) => (first.order ?? 0) - (second.order ?? 0),
    );

    const currentIndex = orderedSkills.findIndex(
      (skill) => skill.id === relationshipId,
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedSkills.length) {
      return;
    }

    const [movedSkill] = orderedSkills.splice(currentIndex, 1);

    orderedSkills.splice(targetIndex, 0, movedSkill);

    onChange?.(normalizeSkillOrder(orderedSkills));
  };

  const orderedExperienceSkills = useMemo(
    () =>
      [...experienceSkills].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      ),
    [experienceSkills],
  );

  const isWorking = disabled || isLoading || editorStatus === "loading";

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
            Select skills from your central Skill Library or create a new skill
            and add it to both the library and this experience.
          </p>
        </div>
      </header>

      {/* =====================================
          Library Search
          ===================================== */}

      <div className="experience-skills-search">
        <div className="experience-skills-label-row">
          <label htmlFor={searchId}>Search or Add a Skill</label>

          <span>
            {experienceSkills.length}/{maximumSkills}
          </span>
        </div>

        <input
          id={searchId}
          type="search"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);

            setEditorStatus("idle");
            setEditorMessage("");
          }}
          disabled={isWorking}
          placeholder="Example: Active Directory, Python, Technical Support"
          autoComplete="off"
        />

        <small>
          Search your library first to avoid creating duplicate skills.
        </small>
      </div>

      {/* =====================================
          Search Results
          ===================================== */}

      {!isLoading && searchResults.length > 0 && (
        <div className="experience-skills-results">
          <header>
            <strong>Skill Library</strong>

            <span>
              {searchResults.length}{" "}
              {searchResults.length === 1 ? "result" : "results"}
            </span>
          </header>

          <div>
            {searchResults.map((skill) => (
              <article key={skill.id}>
                <div>
                  <strong>{skill.name}</strong>

                  <span>
                    {getSkillCategoryLabel(skill.category)}
                    {" · "}
                    {getSkillTypeLabel(skill.type)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAttachSkill(skill)}
                  disabled={isWorking || hasReachedMaximum}
                >
                  Add
                </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* =====================================
          Create New Skill
          ===================================== */}

      {canCreateNewSkill && (
        <section className="experience-skills-create">
          <header>
            <div>
              <span>New Skill</span>

              <h4>Add “{searchQuery.trim()}” to your Skill Library</h4>

              <p>
                Choose a category and type before creating this reusable skill.
              </p>
            </div>
          </header>

          <div className="experience-skills-create-grid">
            <div>
              <label htmlFor={categoryId}>Category</label>

              <select
                id={categoryId}
                value={newSkillCategory}
                onChange={(event) => setNewSkillCategory(event.target.value)}
                disabled={isWorking}
              >
                {SKILL_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={typeId}>Skill Type</label>

              <select
                id={typeId}
                value={newSkillType}
                onChange={(event) => setNewSkillType(event.target.value)}
                disabled={isWorking}
              >
                {SKILL_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateSkill}
            disabled={isWorking}
          >
            {editorStatus === "loading"
              ? "Adding Skill..."
              : "Create and Add Skill"}
          </button>
        </section>
      )}

      {/* =====================================
          Status Message
          ===================================== */}

      {editorMessage && (
        <div
          className={`experience-skills-message experience-skills-message--${editorStatus}`}
          role={editorStatus === "error" ? "alert" : "status"}
        >
          {editorMessage}
        </div>
      )}

      {/* =====================================
          AI Skill 
          ===================================== */}

      <ExperienceSkillSuggestions
        experience={experience}
        experienceSkills={experienceSkills}
        maximumExperienceSkills={maximumSkills}
        disabled={disabled}
        onChange={onChange}
      />

      {/* =====================================
          Selected Experience Skills
          ===================================== */}

      <div className="experience-skills-selected">
        <header>
          <div>
            <span>Selected Skills</span>

            <h4>Experience Skill Set</h4>
          </div>

          <strong>{experienceSkills.length}</strong>
        </header>

        {orderedExperienceSkills.length > 0 ? (
          <div className="experience-skills-selected-list">
            {orderedExperienceSkills.map((relationship, index) => {
              const librarySkill = skillsById.get(relationship.skillId);

              const skillName =
                librarySkill?.name ||
                relationship.nameSnapshot ||
                "Unavailable Skill";

              const category = librarySkill?.category || "other";

              const relationshipError =
                fieldErrors[`skills.${index}.skillId`] ||
                fieldErrors[`skills.${index}.nameSnapshot`];

              const levelError = fieldErrors[`skills.${index}.level`];

              return (
                <article
                  key={relationship.id}
                  className={`experience-skills-selected-item ${
                    relationshipError || levelError
                      ? "experience-skills-selected-item--error"
                      : ""
                  }`}
                >
                  <div className="experience-skills-order">
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
                          isWorking ||
                          index === orderedExperienceSkills.length - 1
                        }
                        aria-label={`Move ${skillName} down`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  <div className="experience-skills-selected-content">
                    <span>{getSkillCategoryLabel(category)}</span>

                    <strong>{skillName}</strong>

                    {relationshipError && (
                      <small role="alert">{relationshipError}</small>
                    )}
                  </div>

                  <div className="experience-skills-level">
                    <label htmlFor={`${relationship.id}-level`}>
                      Proficiency in this role
                    </label>

                    <select
                      id={`${relationship.id}-level`}
                      value={relationship.level || ""}
                      onChange={(event) =>
                        handleLevelChange(relationship.id, event.target.value)
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

                    {levelError && <small role="alert">{levelError}</small>}
                  </div>

                  <button
                    type="button"
                    className="experience-skills-remove-button"
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
          <div className="experience-skills-empty">
            <span aria-hidden="true">✦</span>

            <h4>No skills selected</h4>

            <p>
              Search the central Skill Library or create a skill used in this
              experience.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/*
 * =========================================
 * Relationship Name
 * =========================================
 */

function getRelationshipName(relationship, skillsById) {
  return (
    skillsById.get(relationship.skillId)?.name ||
    relationship.nameSnapshot ||
    "Skill"
  );
}

export default ExperienceSkillsEditor;
