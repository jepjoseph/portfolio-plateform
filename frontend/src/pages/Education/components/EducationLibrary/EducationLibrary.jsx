import { useEffect, useId, useMemo, useState } from "react";

import {
  EDUCATION_CREDENTIAL_TYPE_OPTIONS,
  EDUCATION_INSTITUTION_TYPE_OPTIONS,
} from "../../../../config/educationConfig.js";

import { useSkillData } from "../../../../context/SkillDataContext.jsx";

import { prepareEducationCollection } from "../../../../services/Education/educationUtils.js";

import EducationItem from "../EducationItem/EducationItem.jsx";

import "./EducationLibrary.css";

const DEFAULT_FILTERS = {
  credentialType: "all",
  institutionType: "all",
  timeline: "all",
  hasHonors: false,
  hasSkills: false,
};

function EducationLibrary({
  educationRecords = [],
  showArchived = false,
  isLoading = false,
  loadStatus = "idle",
  operation = {},
  onAddEducation,
  onRetry,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const titleId = useId();

  const { skillsById } = useSkillData();

  const [query, setQuery] = useState("");

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
    setSortOption("newest");
  }, [showArchived]);

  const displayedEducation = useMemo(
    () =>
      prepareEducationCollection({
        educationRecords,
        query,
        filters,
        sortOption,
      }),
    [educationRecords, query, filters, sortOption],
  );

  const hasActiveFilters =
    Boolean(query.trim()) ||
    filters.credentialType !== "all" ||
    filters.institutionType !== "all" ||
    filters.timeline !== "all" ||
    filters.hasHonors ||
    filters.hasSkills;

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
    setSortOption("newest");
  };

  return (
    <section className="education-library" aria-labelledby={titleId}>
      <header className="education-library-header">
        <div>
          <span>{showArchived ? "Archived Records" : "Education Library"}</span>

          <h2 id={titleId}>
            {showArchived ? "Archived Education" : "Saved Education"}
          </h2>

          <p>
            {showArchived
              ? "Archived education remains preserved but unavailable for normal selection."
              : "Manage reusable academic records for résumés, portfolios, training, certifications, and projects."}
          </p>
        </div>

        <span className="education-library-count">
          {displayedEducation.length}{" "}
          {displayedEducation.length === 1 ? "Record" : "Records"}
        </span>
      </header>

      {!isLoading && loadStatus !== "error" && educationRecords.length > 0 && (
        <section
          className="education-library-controls"
          aria-label="Education Library controls"
        >
          <label className="education-library-search">
            <span>Search Education</span>

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search credentials, institutions, fields, courses, skills, or honors"
            />
          </label>

          <div className="education-library-filter-grid">
            <LibrarySelect
              label="Credential Type"
              value={filters.credentialType}
              onChange={(value) => updateFilter("credentialType", value)}
            >
              <option value="all">All Credentials</option>

              {EDUCATION_CREDENTIAL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </LibrarySelect>

            <LibrarySelect
              label="Institution Type"
              value={filters.institutionType}
              onChange={(value) => updateFilter("institutionType", value)}
            >
              <option value="all">All Institutions</option>

              {EDUCATION_INSTITUTION_TYPE_OPTIONS.filter(
                (option) => option.value,
              ).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </LibrarySelect>

            <LibrarySelect
              label="Timeline"
              value={filters.timeline}
              onChange={(value) => updateFilter("timeline", value)}
            >
              <option value="all">All Records</option>

              <option value="current">In Progress</option>

              <option value="completed">Completed</option>
            </LibrarySelect>

            <LibrarySelect
              label="Sort By"
              value={sortOption}
              onChange={setSortOption}
            >
              <option value="newest">Newest</option>

              <option value="oldest">Oldest</option>

              <option value="credential-ascending">Credential Name</option>

              <option value="institution-ascending">Institution Name</option>

              <option value="recently-updated">Recently Updated</option>
            </LibrarySelect>
          </div>

          <div className="education-library-options">
            <label>
              <input
                type="checkbox"
                checked={filters.hasHonors}
                onChange={(event) =>
                  updateFilter("hasHonors", event.target.checked)
                }
              />
              Has honors
            </label>

            <label>
              <input
                type="checkbox"
                checked={filters.hasSkills}
                onChange={(event) =>
                  updateFilter("hasSkills", event.target.checked)
                }
              />
              Has related skills
            </label>
          </div>

          <footer>
            <span>
              Showing <strong>{displayedEducation.length}</strong> of{" "}
              <strong>{educationRecords.length}</strong> records
            </span>

            {hasActiveFilters && (
              <button type="button" onClick={clearFilters}>
                Clear Search and Filters
              </button>
            )}
          </footer>
        </section>
      )}

      {isLoading && (
        <div className="education-library-loading" role="status">
          <span aria-hidden="true" />

          <div>
            <strong>Loading Education Library</strong>

            <p>Retrieving your education records.</p>
          </div>
        </div>
      )}

      {!isLoading && loadStatus === "error" && (
        <div className="education-library-state">
          <span aria-hidden="true">!</span>

          <h3>Education could not be loaded</h3>

          <p>Check browser storage and try again.</p>

          <button type="button" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}

      {!isLoading &&
        loadStatus !== "error" &&
        educationRecords.length === 0 && (
          <div className="education-library-state">
            <span aria-hidden="true">{showArchived ? "□" : "◇"}</span>

            <h3>
              {showArchived
                ? "No archived education"
                : "No education saved yet"}
            </h3>

            <p>
              {showArchived
                ? "Education records you archive will appear here."
                : "Add your first education record for future résumé and portfolio selection."}
            </p>

            {!showArchived && (
              <button type="button" onClick={onAddEducation}>
                Add Your First Education
              </button>
            )}
          </div>
        )}

      {!isLoading &&
        loadStatus !== "error" &&
        educationRecords.length > 0 &&
        displayedEducation.length === 0 && (
          <div className="education-library-state">
            <span aria-hidden="true">⌕</span>

            <h3>No matching education</h3>

            <p>Change the search text or filters.</p>

            <button type="button" onClick={clearFilters}>
              Clear Search and Filters
            </button>
          </div>
        )}

      {!isLoading &&
        loadStatus !== "error" &&
        displayedEducation.length > 0 && (
          <div className="education-library-list">
            {displayedEducation.map((education) => {
              const isWorking =
                operation.educationId === education.id &&
                operation.status === "loading";

              return (
                <EducationItem
                  key={education.id}
                  education={education}
                  skillsById={skillsById}
                  isWorking={isWorking}
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

function LibrarySelect({ label, value, onChange, children }) {
  const id = useId();

  return (
    <label className="education-library-select">
      <span>{label}</span>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

export default EducationLibrary;
