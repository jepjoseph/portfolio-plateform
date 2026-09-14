import {
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_CATEGORY_OPTIONS,
  WORK_ARRANGEMENT_OPTIONS,
} from "../../../../config/experienceConfig.js";

import "./ExperienceFilters.css";

function ExperienceFilters({
  query = "",
  filters = {},
  sortOption = "newest",
  resultCount = 0,
  totalCount = 0,
  hasActiveFilters = false,
  onQueryChange,
  onFilterChange,
  onSortChange,
  onClear,
}) {
  return (
    <section
      className="experience-filters"
      aria-label="Experience search and filters"
    >
      <label className="experience-filters-search">
        <span>Search Experiences</span>

        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange?.(event.target.value)}
          placeholder="Search positions, organizations, responsibilities, skills, or technologies"
        />
      </label>

      <div className="experience-filters-select-grid">
        <FilterSelect
          label="Category"
          value={filters.category || "all"}
          onChange={(value) => onFilterChange?.("category", value)}
        >
          <option value="all">All Categories</option>

          {EXPERIENCE_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Employment Type"
          value={filters.employmentType || "all"}
          onChange={(value) => onFilterChange?.("employmentType", value)}
        >
          <option value="all">All Employment Types</option>

          {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Work Arrangement"
          value={filters.workArrangement || "all"}
          onChange={(value) => onFilterChange?.("workArrangement", value)}
        >
          <option value="all">All Arrangements</option>

          {WORK_ARRANGEMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Timeline"
          value={filters.timeline || "all"}
          onChange={(value) => onFilterChange?.("timeline", value)}
        >
          <option value="all">Current and Previous</option>
          <option value="current">Current Positions</option>
          <option value="previous">Previous Positions</option>
        </FilterSelect>

        <FilterSelect
          label="Sort By"
          value={sortOption}
          onChange={onSortChange}
        >
          <option value="newest">Newest Experience</option>
          <option value="oldest">Oldest Experience</option>
          <option value="recently-updated">Recently Updated</option>
          <option value="position-ascending">Position A–Z</option>
          <option value="position-descending">Position Z–A</option>
          <option value="organization-ascending">Organization A–Z</option>
          <option value="organization-descending">Organization Z–A</option>
        </FilterSelect>
      </div>

      <div className="experience-filters-options">
        <label>
          <input
            type="checkbox"
            checked={Boolean(filters.hasAchievements)}
            onChange={(event) =>
              onFilterChange?.("hasAchievements", event.target.checked)
            }
          />

          <span>Has achievements</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={Boolean(filters.hasSkillsOrTechnologies)}
            onChange={(event) =>
              onFilterChange?.("hasSkillsOrTechnologies", event.target.checked)
            }
          />

          <span>Has skills or technologies</span>
        </label>
      </div>

      <footer className="experience-filters-footer">
        <span>
          Showing <strong>{resultCount}</strong> of{" "}
          <strong>{totalCount}</strong>{" "}
          {totalCount === 1 ? "experience" : "experiences"}
        </span>

        {hasActiveFilters && (
          <button type="button" onClick={onClear}>
            Clear Search and Filters
          </button>
        )}
      </footer>
    </section>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="experience-filters-select">
      <span>{label}</span>

      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

export default ExperienceFilters;
