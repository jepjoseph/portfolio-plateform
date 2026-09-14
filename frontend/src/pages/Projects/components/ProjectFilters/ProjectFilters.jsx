import { useId } from "react";

import {
  PROJECT_CATEGORY_OPTIONS,
  PROJECT_LIFECYCLE_STATUS_OPTIONS,
  PROJECT_OWNERSHIP_OPTIONS,
} from "../../../../config/projectConfig.js";

import "./ProjectFilters.css";

/*
 * =========================================
 * Default Filters
 * =========================================
 */

export const DEFAULT_PROJECT_FILTERS = Object.freeze({
  category: "all",
  lifecycleStatus: "all",
  ownership: "all",
  featured: "all",
  media: "all",
  awarded: "all",
  relationship: "all",
});

/*
 * =========================================
 * Default Sort
 * =========================================
 */

export const DEFAULT_PROJECT_SORT = "newest-started";

/*
 * =========================================
 * Sort Options
 * =========================================
 */

export const PROJECT_SORT_OPTIONS = [
  {
    value: "newest-started",
    label: "Newest Start Date",
  },
  {
    value: "oldest",
    label: "Oldest Start Date",
  },
  {
    value: "newest-completed",
    label: "Newest Completion Date",
  },
  {
    value: "recently-updated",
    label: "Recently Updated",
  },
  {
    value: "impact",
    label: "Strongest Impact Evidence",
  },
  {
    value: "portfolio-default",
    label: "Portfolio Priority",
  },
  {
    value: "title-ascending",
    label: "Project Title A–Z",
  },
  {
    value: "title-descending",
    label: "Project Title Z–A",
  },
];

/*
 * =========================================
 * Featured Options
 * =========================================
 */

const PROJECT_FEATURED_FILTER_OPTIONS = [
  {
    value: "all",
    label: "All Projects",
  },
  {
    value: "featured",
    label: "Featured Only",
  },
  {
    value: "not-featured",
    label: "Not Featured",
  },
];

/*
 * =========================================
 * Media Options
 * =========================================
 */

const PROJECT_MEDIA_FILTER_OPTIONS = [
  {
    value: "all",
    label: "All Projects",
  },
  {
    value: "with-media",
    label: "With Media",
  },
  {
    value: "without-media",
    label: "Without Media",
  },
];

/*
 * =========================================
 * Award Options
 * =========================================
 */

const PROJECT_AWARD_FILTER_OPTIONS = [
  {
    value: "all",
    label: "All Projects",
  },
  {
    value: "awarded",
    label: "Awarded or Recognized",
  },
  {
    value: "not-awarded",
    label: "Without Recognition",
  },
];

/*
 * =========================================
 * Relationship Options
 * =========================================
 */

const PROJECT_RELATIONSHIP_FILTER_OPTIONS = [
  {
    value: "all",
    label: "All Projects",
  },
  {
    value: "skill",
    label: "Related to Skills",
  },
  {
    value: "experience",
    label: "Related to Experience",
  },
  {
    value: "education",
    label: "Related to Education",
  },
  {
    value: "training",
    label: "Related to Training",
  },
  {
    value: "certification",
    label: "Related to Certifications",
  },
];

/*
 * =========================================
 * Project Filters
 * =========================================
 */

function ProjectFilters({
  query = "",
  filters = DEFAULT_PROJECT_FILTERS,
  sortOption = DEFAULT_PROJECT_SORT,
  resultCount = 0,
  disabled = false,
  onQueryChange,
  onFiltersChange,
  onSortChange,
  onReset,
}) {
  const formId = useId();

  const currentFilters = {
    ...DEFAULT_PROJECT_FILTERS,
    ...(filters || {}),
  };

  const normalizedResultCount = Number.isFinite(Number(resultCount))
    ? Math.max(0, Number(resultCount))
    : 0;

  /*
   * =========================================
   * Filter Update
   * =========================================
   */

  const updateFilter = (filterName, value) => {
    onFiltersChange?.({
      ...currentFilters,
      [filterName]: value,
    });
  };

  /*
   * =========================================
   * Reset State
   * =========================================
   */

  const hasActiveFilters =
    Boolean(query.trim()) ||
    Object.entries(DEFAULT_PROJECT_FILTERS).some(
      ([filterName, defaultValue]) =>
        currentFilters[filterName] !== defaultValue,
    ) ||
    sortOption !== DEFAULT_PROJECT_SORT;

  return (
    <section className="project-filters" aria-labelledby={`${formId}-title`}>
      <header className="project-filters-header">
        <div>
          <span>Library Controls</span>

          <h3 id={`${formId}-title`}>Search and Filter Projects</h3>

          <p>
            Find projects by title, technology, organization, skill, outcome,
            recognition, or related professional record.
          </p>
        </div>

        <strong aria-live="polite">
          {normalizedResultCount}{" "}
          {normalizedResultCount === 1 ? "Project" : "Projects"}
        </strong>
      </header>

      <div className="project-filters-primary">
        <label className="project-filters-search" htmlFor={`${formId}-search`}>
          <span>Search Projects</span>

          <div>
            <span aria-hidden="true">⌕</span>

            <input
              id={`${formId}-search`}
              type="search"
              value={query}
              onChange={(event) => onQueryChange?.(event.target.value)}
              placeholder="Search titles, technologies, results, or skills"
              autoComplete="off"
              disabled={disabled}
            />

            {query && (
              <button
                type="button"
                onClick={() => onQueryChange?.("")}
                aria-label="Clear project search"
                disabled={disabled}
              >
                ×
              </button>
            )}
          </div>
        </label>

        <FilterSelect
          id={`${formId}-sort`}
          label="Sort Projects"
          value={sortOption}
          options={PROJECT_SORT_OPTIONS}
          disabled={disabled}
          onChange={onSortChange}
        />
      </div>

      <div className="project-filters-grid">
        <FilterSelect
          id={`${formId}-category`}
          label="Category"
          value={currentFilters.category}
          options={[
            {
              value: "all",
              label: "All Categories",
            },
            ...PROJECT_CATEGORY_OPTIONS,
          ]}
          disabled={disabled}
          onChange={(value) => updateFilter("category", value)}
        />

        <FilterSelect
          id={`${formId}-lifecycle`}
          label="Lifecycle"
          value={currentFilters.lifecycleStatus}
          options={[
            {
              value: "all",
              label: "All Lifecycle States",
            },
            ...PROJECT_LIFECYCLE_STATUS_OPTIONS,
          ]}
          disabled={disabled}
          onChange={(value) => updateFilter("lifecycleStatus", value)}
        />

        <FilterSelect
          id={`${formId}-ownership`}
          label="Ownership"
          value={currentFilters.ownership}
          options={[
            {
              value: "all",
              label: "All Ownership Types",
            },
            ...PROJECT_OWNERSHIP_OPTIONS,
          ]}
          disabled={disabled}
          onChange={(value) => updateFilter("ownership", value)}
        />

        <FilterSelect
          id={`${formId}-featured`}
          label="Portfolio Placement"
          value={currentFilters.featured}
          options={PROJECT_FEATURED_FILTER_OPTIONS}
          disabled={disabled}
          onChange={(value) => updateFilter("featured", value)}
        />

        <FilterSelect
          id={`${formId}-media`}
          label="Project Media"
          value={currentFilters.media}
          options={PROJECT_MEDIA_FILTER_OPTIONS}
          disabled={disabled}
          onChange={(value) => updateFilter("media", value)}
        />

        <FilterSelect
          id={`${formId}-awarded`}
          label="Recognition"
          value={currentFilters.awarded}
          options={PROJECT_AWARD_FILTER_OPTIONS}
          disabled={disabled}
          onChange={(value) => updateFilter("awarded", value)}
        />

        <FilterSelect
          id={`${formId}-relationship`}
          label="Related Records"
          value={currentFilters.relationship}
          options={PROJECT_RELATIONSHIP_FILTER_OPTIONS}
          disabled={disabled}
          onChange={(value) => updateFilter("relationship", value)}
        />
      </div>

      <footer className="project-filters-footer">
        <p>
          Showing <strong>{normalizedResultCount}</strong>{" "}
          {normalizedResultCount === 1
            ? "matching project"
            : "matching projects"}
        </p>

        <button
          type="button"
          onClick={onReset}
          disabled={disabled || !hasActiveFilters}
        >
          Reset Search and Filters
        </button>
      </footer>
    </section>
  );
}

/*
 * =========================================
 * Filter Select
 * =========================================
 */

function FilterSelect({
  id,
  label,
  value,
  options = [],
  disabled = false,
  onChange,
}) {
  return (
    <label className="project-filter-select" htmlFor={id}>
      <span>{label}</span>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value || "empty-option"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default ProjectFilters;
