import { useId, useMemo, useState } from "react";

import {
  SKILL_CATEGORY_OPTIONS,
  SKILL_TYPE_OPTIONS,
  getSkillCategoryLabel,
  getSkillTypeLabel,
} from "../../../../config/skillConfig.js";

import { normalizeSkillNameForComparison } from "../../../../models/skillModel.js";

import {
  getActiveSkills,
  prepareSkillCollection,
} from "../../../../services/Skill/skillUtils.js";

import "./SkillSelector.css";

/*
 * =========================================
 * Skill Selector
 * =========================================
 */

function SkillSelector({
  skills = [],
  selectedSkillIds = [],
  maximumSelections = 50,
  disabled = false,

  allowCreate = true,
  defaultNewSkillCategory = "other",
  defaultNewSkillType = "professional",

  title = "Select Skills",
  description = "Search your central Skill Library and select reusable professional skills.",
  emptyMessage = "No active skills are available.",

  onSelect,
  onRemove,
  onCreateSkill,
}) {
  const selectorId = useId();

  const [query, setQuery] = useState("");

  const [category, setCategory] = useState("all");

  const [type, setType] = useState("all");

  const [newSkillCategory, setNewSkillCategory] = useState(
    defaultNewSkillCategory,
  );

  const [newSkillType, setNewSkillType] = useState(defaultNewSkillType);

  const [status, setStatus] = useState("idle");

  const [message, setMessage] = useState("");

  /*
   * =========================================
   * Normalized Input
   * =========================================
   */

  const activeSkills = useMemo(() => getActiveSkills(skills), [skills]);

  const selectedIds = useMemo(
    () =>
      new Set(
        (selectedSkillIds || [])
          .map((value) =>
            typeof value === "string" ? value : value?.skillId || value?.id,
          )
          .filter(Boolean),
      ),
    [selectedSkillIds],
  );

  const selectedSkills = useMemo(
    () => activeSkills.filter((skill) => selectedIds.has(skill.id)),
    [activeSkills, selectedIds],
  );

  /*
   * =========================================
   * Search Results
   * =========================================
   */

  const searchResults = useMemo(
    () =>
      prepareSkillCollection({
        skills: activeSkills,
        query,
        filters: {
          category,
          type,
          proficiency: "all",
          status: "active",
        },
        sortOption: "name-ascending",
      }),
    [activeSkills, query, category, type],
  );

  const availableResults = useMemo(
    () => searchResults.filter((skill) => !selectedIds.has(skill.id)),
    [searchResults, selectedIds],
  );

  const normalizedQuery = normalizeSkillNameForComparison(query);

  const exactLibraryMatch = useMemo(() => {
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
  }, [activeSkills, normalizedQuery]);

  const hasReachedMaximum = selectedIds.size >= maximumSelections;

  const canCreateSkill =
    allowCreate &&
    Boolean(query.trim()) &&
    !exactLibraryMatch &&
    !hasReachedMaximum &&
    typeof onCreateSkill === "function";

  const isWorking = disabled || status === "loading";

  /*
   * =========================================
   * Select Existing Skill
   * =========================================
   */

  const handleSelect = async (skill) => {
    if (isWorking || hasReachedMaximum || selectedIds.has(skill.id)) {
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      await onSelect?.(skill);

      setQuery("");
      setStatus("success");
      setMessage(`"${skill.name}" was selected.`);
    } catch (error) {
      setStatus("error");

      setMessage(
        error?.publicMessage ||
          error?.message ||
          "The skill could not be selected.",
      );
    }
  };

  /*
   * =========================================
   * Remove Selected Skill
   * =========================================
   */

  const handleRemove = async (skill) => {
    if (isWorking) {
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      await onRemove?.(skill);

      setStatus("success");
      setMessage(
        `"${skill.name}" was removed from this selection. The Skill Library record was not deleted.`,
      );
    } catch (error) {
      setStatus("error");

      setMessage(
        error?.publicMessage ||
          error?.message ||
          "The skill could not be removed.",
      );
    }
  };

  /*
   * =========================================
   * Create and Select Skill
   * =========================================
   */

  const handleCreateSkill = async () => {
    const name = query.trim();

    if (!name || !canCreateSkill || isWorking) {
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const result = await onCreateSkill({
        name,
        category: newSkillCategory,
        type: newSkillType,
        source: "manual",
      });

      const createdSkill = result?.skill || result;

      if (!createdSkill?.id) {
        throw new Error(
          "The new Skill Library record could not be identified.",
        );
      }

      /*
       * Some consumers may create and attach the
       * relationship inside onCreateSkill.
       *
       * Set attached=true in the returned object to
       * prevent the selector from calling onSelect
       * a second time.
       */

      if (result?.attached !== true) {
        await onSelect?.(createdSkill);
      }

      setQuery("");
      setNewSkillCategory(defaultNewSkillCategory);
      setNewSkillType(defaultNewSkillType);

      setStatus("success");

      setMessage(
        result?.created === false
          ? `"${createdSkill.name}" already existed and was selected.`
          : `"${createdSkill.name}" was added to the Skill Library and selected.`,
      );
    } catch (error) {
      setStatus("error");

      setMessage(
        error?.publicMessage ||
          error?.message ||
          "The skill could not be created.",
      );
    }
  };

  /*
   * =========================================
   * Clear Controls
   * =========================================
   */

  const handleClearControls = () => {
    setQuery("");
    setCategory("all");
    setType("all");
    setMessage("");
    setStatus("idle");
  };

  const hasFilters = Boolean(query) || category !== "all" || type !== "all";

  return (
    <section className="skill-selector" aria-labelledby={`${selectorId}-title`}>
      <header className="skill-selector-header">
        <div>
          <span>Shared Skill Library</span>

          <h3 id={`${selectorId}-title`}>{title}</h3>

          <p>{description}</p>
        </div>

        <span className="skill-selector-count">
          {selectedIds.size}/{maximumSelections}
        </span>
      </header>

      {/*
       * =========================================
       * Selected Skills
       * =========================================
       */}

      {selectedSkills.length > 0 && (
        <section className="skill-selector-selected">
          <header>
            <span>Currently Selected</span>

            <strong>{selectedSkills.length}</strong>
          </header>

          <div>
            {selectedSkills.map((skill) => (
              <article key={skill.id}>
                <div>
                  <strong>{skill.name}</strong>

                  <small>{getSkillCategoryLabel(skill.category)}</small>
                </div>

                {onRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemove(skill)}
                    disabled={isWorking}
                    aria-label={`Remove ${skill.name} from this selection`}
                  >
                    ×
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/*
       * =========================================
       * Search
       * =========================================
       */}

      <div className="skill-selector-search">
        <label htmlFor={`${selectorId}-search`}>Search or Add a Skill</label>

        <div>
          <span aria-hidden="true">⌕</span>

          <input
            id={`${selectorId}-search`}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setMessage("");
              setStatus("idle");
            }}
            disabled={isWorking}
            placeholder="Example: Python, Active Directory, Azure"
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              disabled={isWorking}
              aria-label="Clear skill search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/*
       * =========================================
       * Filters
       * =========================================
       */}

      <div className="skill-selector-filters">
        <div>
          <label htmlFor={`${selectorId}-category`}>Category</label>

          <select
            id={`${selectorId}-category`}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={isWorking}
          >
            <option value="all">All Categories</option>

            {SKILL_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${selectorId}-type`}>Skill Type</label>

          <select
            id={`${selectorId}-type`}
            value={type}
            onChange={(event) => setType(event.target.value)}
            disabled={isWorking}
          >
            <option value="all">All Types</option>

            {SKILL_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={handleClearControls}
            disabled={isWorking}
          >
            Clear
          </button>
        )}
      </div>

      {/*
       * =========================================
       * Status
       * =========================================
       */}

      {message && (
        <div
          className={`skill-selector-message skill-selector-message--${status}`}
          role={status === "error" ? "alert" : "status"}
        >
          <span>{message}</span>

          <button
            type="button"
            onClick={() => {
              setMessage("");
              setStatus("idle");
            }}
            aria-label="Dismiss selector message"
          >
            ×
          </button>
        </div>
      )}

      {hasReachedMaximum && (
        <div className="skill-selector-limit" role="status">
          The maximum of {maximumSelections} skills has been selected.
        </div>
      )}

      {/*
       * =========================================
       * Search Results
       * =========================================
       */}

      <section className="skill-selector-results">
        <header>
          <div>
            <span>Available Skills</span>

            <h4>Skill Library Results</h4>
          </div>

          <span>
            {availableResults.length}{" "}
            {availableResults.length === 1 ? "result" : "results"}
          </span>
        </header>

        {activeSkills.length === 0 ? (
          <div className="skill-selector-empty">
            <span aria-hidden="true">✦</span>

            <h5>No active skills available</h5>

            <p>{emptyMessage}</p>
          </div>
        ) : availableResults.length > 0 ? (
          <div className="skill-selector-result-list">
            {availableResults.map((skill) => (
              <article key={skill.id}>
                <div className="skill-selector-result-icon">
                  <span aria-hidden="true">✦</span>
                </div>

                <div className="skill-selector-result-content">
                  <div>
                    <span>{getSkillCategoryLabel(skill.category)}</span>

                    <span>{getSkillTypeLabel(skill.type)}</span>
                  </div>

                  <strong>{skill.name}</strong>

                  {skill.description && <p>{skill.description}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(skill)}
                  disabled={isWorking || hasReachedMaximum}
                >
                  Select
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="skill-selector-empty">
            <span aria-hidden="true">⌕</span>

            <h5>No available matches</h5>

            <p>
              Change the search or filters, or create a new Skill Library
              record.
            </p>
          </div>
        )}
      </section>

      {/*
       * =========================================
       * Create Skill
       * =========================================
       */}

      {canCreateSkill && (
        <section className="skill-selector-create">
          <header>
            <span>New Library Skill</span>

            <h4>Create “{query.trim()}”</h4>

            <p>
              This creates one reusable Skill record. The current Experience,
              Résumé, or Portfolio will store a relationship to that record.
            </p>
          </header>

          <div className="skill-selector-create-fields">
            <div>
              <label htmlFor={`${selectorId}-new-category`}>Category</label>

              <select
                id={`${selectorId}-new-category`}
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
              <label htmlFor={`${selectorId}-new-type`}>Skill Type</label>

              <select
                id={`${selectorId}-new-type`}
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
            {status === "loading"
              ? "Creating Skill..."
              : "Create and Select Skill"}
          </button>
        </section>
      )}
    </section>
  );
}

export default SkillSelector;
