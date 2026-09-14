import { useMemo, useState } from "react";

import { prepareExperienceCollection } from "../../../../services/Experience/experienceUtils.js";

import ExperienceCard from "../ExperienceCard/ExperienceCard.jsx";
import ExperienceFilters from "../ExperienceFilters/ExperienceFilters.jsx";

import "./ExperienceList.css";

const DEFAULT_FILTERS = {
  category: "all",
  employmentType: "all",
  workArrangement: "all",
  timeline: "all",
  hasAchievements: false,
  hasSkillsOrTechnologies: false,
};

function ExperienceList({
  experiences = [],
  operation = {},
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const [expandedExperienceId, setExpandedExperienceId] = useState("");

  const [query, setQuery] = useState("");

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  /*
   * Current positions appear first. Previous
   * positions follow from most recently ended
   * to oldest.
   */

  const [sortOption, setSortOption] = useState("newest");

  const displayedExperiences = useMemo(
    () =>
      prepareExperienceCollection({
        experiences,
        query,
        filters,
        sortOption,
      }),
    [experiences, query, filters, sortOption],
  );

  const hasActiveFilters =
    Boolean(query.trim()) ||
    filters.category !== "all" ||
    filters.employmentType !== "all" ||
    filters.workArrangement !== "all" ||
    filters.timeline !== "all" ||
    filters.hasAchievements ||
    filters.hasSkillsOrTechnologies;

  const handleToggleView = (experienceId) => {
    setExpandedExperienceId((currentId) =>
      currentId === experienceId ? "" : experienceId,
    );
  };

  const handleFilterChange = (field, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));

    setExpandedExperienceId("");
  };

  const handleQueryChange = (value) => {
    setQuery(value);
    setExpandedExperienceId("");
  };

  const handleSortChange = (value) => {
    setSortOption(value);
    setExpandedExperienceId("");
  };

  const handleClearFilters = () => {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
    setSortOption("newest");
    setExpandedExperienceId("");
  };

  return (
    <div className="experience-list-container">
      <ExperienceFilters
        query={query}
        filters={filters}
        sortOption={sortOption}
        resultCount={displayedExperiences.length}
        totalCount={experiences.length}
        hasActiveFilters={hasActiveFilters}
        onQueryChange={handleQueryChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onClear={handleClearFilters}
      />

      {displayedExperiences.length > 0 ? (
        <div className="experience-list">
          {displayedExperiences.map((experience) => {
            const isWorking =
              operation?.experienceId === experience.id &&
              operation?.status === "loading";

            return (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                isExpanded={expandedExperienceId === experience.id}
                isWorking={isWorking}
                onToggleView={handleToggleView}
                onEdit={onEdit}
                onArchive={onArchive}
                onRestore={onRestore}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      ) : (
        <div className="experience-list-empty">
          <span aria-hidden="true">⌕</span>

          <h3>No matching experiences</h3>

          <p>
            Change the search text or filter selections to display more
            Experience records.
          </p>

          <button type="button" onClick={handleClearFilters}>
            Clear Search and Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default ExperienceList;
