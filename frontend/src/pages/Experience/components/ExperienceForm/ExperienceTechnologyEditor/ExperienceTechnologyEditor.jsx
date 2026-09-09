import { useMemo, useState } from "react";

import {
  getSkillCategoryLabel,
  getSkillProficiencyLabel,
  SKILL_CATEGORY_OPTIONS,
  SKILL_PROFICIENCY_OPTIONS,
} from "../../../../../config/skillConfig.js";

import { useSkillData } from "../../../../../context/SkillDataContext.jsx";

import "./ExperienceTechnologyEditor.css";

/*
 * =========================================
 * Technology Options
 * =========================================
 */

const EMPTY_EDITOR = {
  selectedSkillId: "",
  name: "",
  category: "",
  proficiency: "",
  usageDescription: "",
};

/*
 * =========================================
 * Helpers
 * =========================================
 */

function createRelationshipId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `experience-technology-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase();
}

function getTechnologyName(technology) {
  if (typeof technology === "string") {
    return technology.trim();
  }

  return String(
    technology?.nameSnapshot ||
      technology?.name ||
      technology?.label ||
      technology?.value ||
      "",
  ).trim();
}

function normalizeTechnologyRelationship(technology, index) {
  if (typeof technology === "string") {
    return {
      id: `legacy-technology-${index}`,
      skillId: "",
      nameSnapshot: technology.trim(),
      name: technology.trim(),
      category: "",
      proficiency: "",
      usageDescription: "",
      order: index,
    };
  }

  const name = getTechnologyName(technology);

  return {
    id: technology?.id || `technology-${index}`,
    skillId: technology?.skillId || technology?.profileSkillId || "",
    nameSnapshot: technology?.nameSnapshot || name,
    name,
    category: technology?.category || "",
    proficiency: technology?.proficiency || technology?.level || "",
    usageDescription:
      technology?.usageDescription || technology?.description || "",
    order: Number.isFinite(Number(technology?.order))
      ? Number(technology.order)
      : index,
  };
}

function getLibrarySkillCategory(skill) {
  return skill?.category || skill?.type || "";
}

/*
 * =========================================
 * Technology Editor
 * =========================================
 */

function ExperienceTechnologyEditor({
  technologies = [],
  fieldError = "",
  disabled = false,
  onChange,
}) {
  const { activeSkills = [], findOrCreateSkill } = useSkillData();

  const [editor, setEditor] = useState(EMPTY_EDITOR);
  const [editingRelationshipId, setEditingRelationshipId] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [editorError, setEditorError] = useState("");
  const [isSavingTechnology, setIsSavingTechnology] = useState(false);

  /*
   * =========================================
   * Normalized Relationships
   * =========================================
   */

  const normalizedTechnologies = useMemo(
    () =>
      (technologies || [])
        .map(normalizeTechnologyRelationship)
        .filter((technology) => technology.nameSnapshot)
        .sort((first, second) => first.order - second.order),
    [technologies],
  );

  const selectedNames = useMemo(
    () =>
      new Set(
        normalizedTechnologies.map((technology) =>
          normalizeName(technology.nameSnapshot),
        ),
      ),
    [normalizedTechnologies],
  );

  /*
   * =========================================
   * Library Search
   * =========================================
   */

  const matchingLibrarySkills = useMemo(() => {
    const normalizedSearch = normalizeName(searchValue);

    return activeSkills
      .filter((skill) => {
        if (!skill?.name) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchableValue = [
          skill.name,
          skill.category,
          skill.type,
          ...(skill.aliases || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();

        return searchableValue.includes(normalizedSearch);
      })
      .sort((first, second) => first.name.localeCompare(second.name))
      .slice(0, 25);
  }, [activeSkills, searchValue]);

  /*
   * =========================================
   * Editor State
   * =========================================
   */

  const updateEditor = (updates) => {
    setEditor((currentEditor) => ({
      ...currentEditor,
      ...updates,
    }));

    setEditorError("");
  };

  const resetEditor = () => {
    setEditor(EMPTY_EDITOR);
    setEditingRelationshipId("");
    setSearchValue("");
    setEditorError("");
  };

  /*
   * =========================================
   * Select Library Skill
   * =========================================
   */

  const handleLibrarySelection = (event) => {
    const skillId = event.target.value;

    if (!skillId) {
      updateEditor({
        selectedSkillId: "",
        name: "",
        category: "",
      });

      return;
    }

    const selectedSkill = activeSkills.find((skill) => skill.id === skillId);

    if (!selectedSkill) {
      setEditorError("The selected Skill Library item could not be found.");

      return;
    }

    updateEditor({
      selectedSkillId: selectedSkill.id,
      name: selectedSkill.name,
      category: getLibrarySkillCategory(selectedSkill),
    });
  };

  /*
   * =========================================
   * Duplicate Detection
   * =========================================
   */

  const isDuplicateTechnology = (name, skillId = "") => {
    const normalizedCandidateName = normalizeName(name);

    return normalizedTechnologies.some((technology) => {
      if (technology.id === editingRelationshipId) {
        return false;
      }

      if (skillId && technology.skillId && technology.skillId === skillId) {
        return true;
      }

      return normalizeName(technology.nameSnapshot) === normalizedCandidateName;
    });
  };

  /*
   * =========================================
   * Add or Update Technology
   * =========================================
   */

  const handleSaveTechnology = async () => {
    if (disabled || isSavingTechnology) {
      return;
    }

    const technologyName = editor.name.trim();

    if (!technologyName) {
      setEditorError("Select a Skill Library item or enter a technology name.");

      return;
    }

    if (isDuplicateTechnology(technologyName, editor.selectedSkillId)) {
      setEditorError(
        "This technology has already been added to the experience.",
      );

      return;
    }

    try {
      setIsSavingTechnology(true);
      setEditorError("");

      let librarySkill = activeSkills.find(
        (skill) => skill.id === editor.selectedSkillId,
      );

      /*
       * A manually entered technology is saved in the
       * central Skill Library before being attached to
       * this experience.
       */

      if (!librarySkill) {
        const skillResult = await findOrCreateSkill({
          name: technologyName,

          category: editor.category || "tools-platforms",

          type: "tool",

          proficiency: {
            level: editor.proficiency || "",
            yearsOfExperience: null,
            lastUsedDate: "",
          },

          language: {
            proficiency: "",
          },

          description: editor.usageDescription.trim(),

          aliases: [],

          source: "manual",

          sourceContext: "experience-technology-editor",

          notes: "",

          status: "active",
        });

        librarySkill = skillResult?.skill || skillResult;
      }

      const savedSkill = librarySkill;

      if (!savedSkill?.id) {
        throw new Error(
          "The technology could not be saved in the Skill Library.",
        );
      }

      const relationship = {
        id: editingRelationshipId || createRelationshipId(),

        skillId: savedSkill.id,

        /*
         * The snapshot keeps the experience readable
         * if the library item is renamed or unavailable.
         */

        nameSnapshot: savedSkill.name || technologyName,

        name: savedSkill.name || technologyName,

        category: editor.category || getLibrarySkillCategory(savedSkill) || "",

        proficiency: editor.proficiency,

        usageDescription: editor.usageDescription.trim(),

        order: editingRelationshipId
          ? (normalizedTechnologies.find(
              (technology) => technology.id === editingRelationshipId,
            )?.order ?? normalizedTechnologies.length)
          : normalizedTechnologies.length,
      };

      const nextTechnologies = editingRelationshipId
        ? normalizedTechnologies.map((technology) =>
            technology.id === editingRelationshipId ? relationship : technology,
          )
        : [...normalizedTechnologies, relationship];

      onChange?.(
        nextTechnologies.map((technology, index) => ({
          ...technology,
          order: index,
        })),
      );

      resetEditor();
    } catch (saveError) {
      console.error("Unable to save experience technology:", {
        error: saveError,
        errors: saveError?.errors,
        fieldErrors: saveError?.fieldErrors,
        validation: saveError?.validation,
      });

      const firstValidationMessage =
        saveError?.errors?.[0]?.message ||
        Object.values(saveError?.fieldErrors || {})[0];

      setEditorError(
        firstValidationMessage ||
          saveError?.publicMessage ||
          saveError?.message ||
          "The technology could not be saved.",
      );
    } finally {
      setIsSavingTechnology(false);
    }
  };

  /*
   * =========================================
   * Edit
   * =========================================
   */

  const handleEdit = (technology) => {
    setEditingRelationshipId(technology.id);

    setEditor({
      selectedSkillId: technology.skillId || "",
      name: technology.nameSnapshot,
      category: technology.category || "",
      proficiency: technology.proficiency || "",
      usageDescription: technology.usageDescription || "",
    });

    setSearchValue(technology.nameSnapshot);
    setEditorError("");
  };

  /*
   * =========================================
   * Remove
   * =========================================
   */

  const handleRemove = (relationshipId) => {
    const nextTechnologies = normalizedTechnologies
      .filter((technology) => technology.id !== relationshipId)
      .map((technology, index) => ({
        ...technology,
        order: index,
      }));

    onChange?.(nextTechnologies);

    if (editingRelationshipId === relationshipId) {
      resetEditor();
    }
  };

  /*
   * =========================================
   * Reorder
   * =========================================
   */

  const handleMove = (relationshipId, direction) => {
    const currentIndex = normalizedTechnologies.findIndex(
      (technology) => technology.id === relationshipId,
    );

    const nextIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= normalizedTechnologies.length
    ) {
      return;
    }

    const reorderedTechnologies = [...normalizedTechnologies];

    const [movedTechnology] = reorderedTechnologies.splice(currentIndex, 1);

    reorderedTechnologies.splice(nextIndex, 0, movedTechnology);

    onChange?.(
      reorderedTechnologies.map((technology, index) => ({
        ...technology,
        order: index,
      })),
    );
  };

  return (
    <section className="experience-form-section experience-technology-editor">
      <header className="experience-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Tools and Technology</small>

          <h3>Technologies and Tools</h3>

          <p>
            Add the software, platforms, frameworks, tools, systems, hardware,
            or equipment used in this experience.
          </p>
        </div>
      </header>

      <div className="experience-technology-editor-workspace">
        <section className="experience-technology-editor-panel">
          <header>
            <div>
              <span>
                {editingRelationshipId ? "Edit Technology" : "Add Technology"}
              </span>

              <h4>Select or Create a Library Item</h4>
            </div>

            {editingRelationshipId && (
              <button type="button" onClick={resetEditor} disabled={disabled}>
                Cancel Edit
              </button>
            )}
          </header>

          <div className="experience-technology-editor-fields">
            <div className="experience-technology-editor-field experience-technology-editor-field--full">
              <label htmlFor="experience-technology-search">
                Search Skill Library
              </label>

              <input
                id="experience-technology-search"
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                disabled={disabled}
                placeholder="Search React, Azure, SQL Server, AutoCAD..."
              />
            </div>

            <div className="experience-technology-editor-field experience-technology-editor-field--full">
              <label htmlFor="experience-technology-library">
                Existing Library Item
              </label>

              <select
                id="experience-technology-library"
                value={editor.selectedSkillId}
                onChange={handleLibrarySelection}
                disabled={disabled}
              >
                <option value="">Create or enter a different technology</option>

                {matchingLibrarySkills.map((skill) => {
                  const alreadySelected = selectedNames.has(
                    normalizeName(skill.name),
                  );

                  return (
                    <option
                      key={skill.id}
                      value={skill.id}
                      disabled={
                        alreadySelected && skill.id !== editor.selectedSkillId
                      }
                    >
                      {skill.name}
                      {skill.category ? ` — ${skill.category}` : ""}
                      {alreadySelected && skill.id !== editor.selectedSkillId
                        ? " — Already added"
                        : ""}
                    </option>
                  );
                })}
              </select>

              <small>
                Selecting a library item does not create a duplicate Skill
                record.
              </small>
            </div>

            <div className="experience-technology-editor-field">
              <label htmlFor="experience-technology-name">
                Technology Name
              </label>

              <input
                id="experience-technology-name"
                type="text"
                value={editor.name}
                onChange={(event) =>
                  updateEditor({
                    name: event.target.value,
                    selectedSkillId: "",
                  })
                }
                disabled={disabled}
                maxLength={150}
                placeholder="Example: Microsoft Azure"
              />
            </div>

            <div className="experience-technology-editor-field">
              <label htmlFor="experience-technology-category">Category</label>

              <select
                id="experience-technology-category"
                value={editor.category}
                onChange={(event) =>
                  updateEditor({
                    category: event.target.value,
                  })
                }
                disabled={disabled}
              >
                <option value="">Choose a category</option>

                {SKILL_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="experience-technology-editor-field">
              <label htmlFor="experience-technology-proficiency">
                Experience-Specific Proficiency
              </label>

              <select
                id="experience-technology-proficiency"
                value={editor.proficiency}
                onChange={(event) =>
                  updateEditor({
                    proficiency: event.target.value,
                  })
                }
                disabled={disabled}
              >
                {SKILL_PROFICIENCY_OPTIONS.map((option) => (
                  <option
                    key={option.value || "not-specified"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>

              <small>Optional. This applies only to this experience.</small>
            </div>

            <div className="experience-technology-editor-field experience-technology-editor-field--full">
              <label htmlFor="experience-technology-usage">
                How It Was Used
              </label>

              <textarea
                id="experience-technology-usage"
                value={editor.usageDescription}
                onChange={(event) =>
                  updateEditor({
                    usageDescription: event.target.value,
                  })
                }
                disabled={disabled}
                rows={3}
                maxLength={500}
                placeholder="Example: Used Azure App Service to deploy and manage the backend API."
              />

              <small>
                Optional context for résumés, portfolios, and AI-generated
                content.
              </small>
            </div>
          </div>

          {editorError && (
            <p className="experience-technology-editor-error" role="alert">
              {editorError}
            </p>
          )}

          <footer>
            {editingRelationshipId && (
              <button
                type="button"
                onClick={resetEditor}
                disabled={disabled || isSavingTechnology}
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              className="experience-technology-editor-save"
              onClick={handleSaveTechnology}
              disabled={disabled || isSavingTechnology}
            >
              {isSavingTechnology
                ? "Saving..."
                : editingRelationshipId
                  ? "Save Technology"
                  : "+ Add Technology"}
            </button>
          </footer>
        </section>

        <section className="experience-technology-editor-selected">
          <header>
            <div>
              <span>Experience Technologies</span>

              <h4>Selected Technologies</h4>
            </div>

            <span>
              {normalizedTechnologies.length}{" "}
              {normalizedTechnologies.length === 1 ? "item" : "items"}
            </span>
          </header>

          {normalizedTechnologies.length > 0 ? (
            <div className="experience-technology-editor-list">
              {normalizedTechnologies.map((technology, index) => (
                <article
                  key={technology.id}
                  className="experience-technology-editor-item"
                >
                  <div className="experience-technology-editor-item-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="experience-technology-editor-item-content">
                    <div>
                      <span>{getSkillCategoryLabel(technology.category)}</span>

                      {technology.proficiency && (
                        <span>
                          {getSkillProficiencyLabel(technology.proficiency)}
                        </span>
                      )}
                    </div>

                    <h5>{technology.nameSnapshot}</h5>

                    {technology.usageDescription && (
                      <p>{technology.usageDescription}</p>
                    )}

                    <small>
                      {technology.skillId
                        ? "Connected to Skill Library"
                        : "Legacy technology"}
                    </small>
                  </div>

                  <div className="experience-technology-editor-item-actions">
                    <button
                      type="button"
                      onClick={() => handleMove(technology.id, -1)}
                      disabled={disabled || index === 0}
                      aria-label={`Move ${technology.nameSnapshot} up`}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(technology.id, 1)}
                      disabled={
                        disabled || index === normalizedTechnologies.length - 1
                      }
                      aria-label={`Move ${technology.nameSnapshot} down`}
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(technology)}
                      disabled={disabled}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="experience-technology-editor-remove"
                      onClick={() => handleRemove(technology.id)}
                      disabled={disabled}
                      aria-label={`Remove ${technology.nameSnapshot}`}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="experience-technology-editor-empty">
              <span aria-hidden="true">⌘</span>

              <h5>No technologies added</h5>

              <p>
                Add tools and technologies that were actually used during this
                experience.
              </p>
            </div>
          )}
        </section>
      </div>

      {fieldError && (
        <p className="experience-technology-editor-field-error" role="alert">
          {fieldError}
        </p>
      )}
    </section>
  );
}

export default ExperienceTechnologyEditor;
