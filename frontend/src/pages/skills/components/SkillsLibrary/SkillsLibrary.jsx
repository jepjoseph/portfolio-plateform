import { useEffect, useId, useMemo, useState } from "react";

import {
  SKILL_CATEGORY_OPTIONS,
  SKILL_PROFICIENCY_OPTIONS,
  SKILL_TYPE_OPTIONS,
} from "../../../../config/skillConfig.js";

import { prepareSkillCollection } from "../../../../services/Skill/skillUtils.js";

import SkillItem from "../SkillItem/SkillItem.jsx";

import "./SkillsLibrary.css";

const DEFAULT_FILTERS = {
  category: "all",
  type: "all",
  proficiency: "all",
};

const EMPTY_USAGE_MAP = {};

function resolveSkillUsage(usageBySkillId, skillId) {
  if (!skillId) {
    return {};
  }

  if (usageBySkillId instanceof Map) {
    return usageBySkillId.get(skillId) || {};
  }

  if (usageBySkillId && typeof usageBySkillId === "object") {
    return usageBySkillId[skillId] || {};
  }

  return {};
}

function SkillsLibrary({
  skills = [],
  showArchived = false,
  isLoading = false,
  isUsageLoading = false,
  loadStatus = "idle",
  operation = {},
  usageBySkillId = EMPTY_USAGE_MAP,
  onAddSkill,
  onRetry,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const libraryTitleId = useId();

  const [query, setQuery] = useState("");

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [sortOption, setSortOption] = useState("name-ascending");

  useEffect(() => {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
    setSortOption("name-ascending");
  }, [showArchived]);

  const displayedSkills = useMemo(
    () =>
      prepareSkillCollection({
        skills,
        query,
        filters,
        sortOption,
      }),
    [skills, query, filters, sortOption],
  );

  const hasActiveFilters =
    Boolean(query.trim()) ||
    filters.category !== "all" ||
    filters.type !== "all" ||
    filters.proficiency !== "all";

  const updateFilter = (fieldName, value) => {
    setFilters((current) => ({
      ...current,
      [fieldName]: value,
    }));
  };

  const handleClearFilters = () => {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
    setSortOption("name-ascending");
  };

  return (
    <section className="skills-library" aria-labelledby={libraryTitleId}>
      <header className="skills-library-header">
        <div>
          <span>{showArchived ? "Archived Records" : "Central Library"}</span>

          <h2 id={libraryTitleId}>
            {showArchived ? "Archived Skills" : "Saved Skills"}
          </h2>

          <p>
            {showArchived
              ? "Archived skills are preserved but unavailable for normal Experience, Résumé, and Portfolio selection."
              : "Manage the professional capabilities available to your Experiences, Résumés, and Portfolios."}
          </p>
        </div>

        <span className="skills-library-count">
          {displayedSkills.length}{" "}
          {displayedSkills.length === 1 ? "Skill" : "Skills"}
        </span>
      </header>

      {!isLoading && loadStatus !== "error" && skills.length > 0 && (
        <section
          className="skills-library-controls"
          aria-label="Skill Library controls"
        >
          <div className="skills-library-search">
            <label htmlFor={`${libraryTitleId}-search`}>Search Skills</label>

            <div>
              <span aria-hidden="true">⌕</span>

              <input
                id={`${libraryTitleId}-search`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search names, aliases, categories, or descriptions"
                autoComplete="off"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear skill search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="skills-library-filter-grid">
            <LibrarySelect
              id={`${libraryTitleId}-category`}
              label="Category"
              value={filters.category}
              onChange={(value) => updateFilter("category", value)}
            >
              <option value="all">All Categories</option>

              {SKILL_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </LibrarySelect>

            <LibrarySelect
              id={`${libraryTitleId}-type`}
              label="Skill Type"
              value={filters.type}
              onChange={(value) => updateFilter("type", value)}
            >
              <option value="all">All Types</option>

              {SKILL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </LibrarySelect>

            <LibrarySelect
              id={`${libraryTitleId}-proficiency`}
              label="Proficiency"
              value={filters.proficiency}
              onChange={(value) => updateFilter("proficiency", value)}
            >
              <option value="all">All Levels</option>

              {SKILL_PROFICIENCY_OPTIONS.map((option) => (
                <option
                  key={option.value || "not-specified"}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </LibrarySelect>

            <LibrarySelect
              id={`${libraryTitleId}-sort`}
              label="Sort By"
              value={sortOption}
              onChange={setSortOption}
            >
              <option value="name-ascending">Name: A–Z</option>

              <option value="name-descending">Name: Z–A</option>

              <option value="category-ascending">Category</option>

              <option value="type-ascending">Skill Type</option>

              <option value="proficiency-descending">
                Highest Proficiency
              </option>

              <option value="years-descending">Most Experience</option>

              <option value="recently-updated">Recently Updated</option>

              <option value="recently-created">Recently Created</option>
            </LibrarySelect>
          </div>

          <footer className="skills-library-controls-footer">
            <span>
              Showing <strong>{displayedSkills.length}</strong> of{" "}
              <strong>{skills.length}</strong>{" "}
              {skills.length === 1 ? "skill" : "skills"}
            </span>

            {hasActiveFilters && (
              <button type="button" onClick={handleClearFilters}>
                Clear Search and Filters
              </button>
            )}
          </footer>
        </section>
      )}

      {isLoading && (
        <div
          className="skills-library-loading"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" />

          <div>
            <strong>Loading Skill Library</strong>

            <p>Retrieving your reusable professional skills.</p>
          </div>
        </div>
      )}

      {!isLoading && loadStatus === "error" && (
        <div className="skills-library-load-error">
          <span aria-hidden="true">!</span>

          <h3>Skills could not be loaded</h3>

          <p>Check browser storage and try loading the Skill Library again.</p>

          <button type="button" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}

      {!isLoading && loadStatus !== "error" && skills.length === 0 && (
        <div className="skills-library-empty">
          <div aria-hidden="true">{showArchived ? "□" : "✦"}</div>

          <h3>{showArchived ? "No archived skills" : "No skills saved yet"}</h3>

          <p>
            {showArchived
              ? "Skills you archive will appear here."
              : "Add your first skill to make it available for Experiences, Résumés, and Portfolios."}
          </p>

          {!showArchived && (
            <button type="button" onClick={onAddSkill}>
              Add Your First Skill
            </button>
          )}
        </div>
      )}

      {!isLoading &&
        loadStatus !== "error" &&
        skills.length > 0 &&
        displayedSkills.length === 0 && (
          <div className="skills-library-no-results">
            <span aria-hidden="true">⌕</span>

            <h3>No matching skills</h3>

            <p>
              Try changing the search, category, type, or proficiency filter.
            </p>

            <button type="button" onClick={handleClearFilters}>
              Clear Search and Filters
            </button>
          </div>
        )}

      {!isLoading && loadStatus !== "error" && displayedSkills.length > 0 && (
        <div className="skills-library-list">
          {displayedSkills.map((skill) => {
            const isWorking =
              operation?.skillId === skill.id &&
              operation?.status === "loading";

            return (
              <SkillItem
                key={skill.id}
                skill={skill}
                usage={resolveSkillUsage(usageBySkillId, skill.id)}
                isWorking={isWorking}
                isUsageLoading={isUsageLoading}
                onEdit={onEdit}
                onArchive={onArchive}
                onRestore={onRestore}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function LibrarySelect({ id, label, value, onChange, children }) {
  return (
    <div className="skills-library-select">
      <label htmlFor={id}>{label}</label>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

export default SkillsLibrary;
