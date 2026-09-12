import { useEffect, useId, useMemo, useState } from "react";

import {
  TRAINING_COMPLETION_STATUS_OPTIONS,
  TRAINING_DELIVERY_FORMAT_OPTIONS,
  TRAINING_PROVIDER_TYPE_OPTIONS,
  TRAINING_TYPE_OPTIONS,
} from "../../../../config/trainingConfig.js";

import { useSkillData } from "../../../../context/SkillDataContext.jsx";

import { prepareTrainingCollection } from "../../../../services/Training/trainingUtils.js";

import TrainingItem from "../TrainingItem/TrainingItem.jsx";

import "./TrainingLibrary.css";

const DEFAULT_FILTERS = {
  trainingType: "all",
  providerType: "all",
  completionStatus: "all",
  deliveryFormat: "all",
  hasCredential: false,
  hasSkills: false,
  hasDocuments: false,
};

function TrainingLibrary({
  trainingRecords = [],
  showArchived = false,
  isLoading = false,
  loadStatus = "idle",
  operation = {},
  onAddTraining,
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

  const displayedTraining = useMemo(
    () =>
      prepareTrainingCollection({
        trainingRecords,
        query,
        filters,
        sortOption,
      }),
    [trainingRecords, query, filters, sortOption],
  );

  const hasActiveFilters =
    Boolean(query.trim()) ||
    filters.trainingType !== "all" ||
    filters.providerType !== "all" ||
    filters.completionStatus !== "all" ||
    filters.deliveryFormat !== "all" ||
    filters.hasCredential ||
    filters.hasSkills ||
    filters.hasDocuments;

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
    <section className="training-library" aria-labelledby={titleId}>
      <header className="training-library-header">
        <div>
          <span>{showArchived ? "Archived Records" : "Training Library"}</span>

          <h2 id={titleId}>
            {showArchived ? "Archived Training" : "Saved Training"}
          </h2>

          <p>
            {showArchived
              ? "Archived training remains preserved but unavailable for normal selection."
              : "Manage reusable professional-development and technical-training records."}
          </p>
        </div>

        <span className="training-library-count">
          {displayedTraining.length}{" "}
          {displayedTraining.length === 1 ? "Record" : "Records"}
        </span>
      </header>

      {!isLoading && loadStatus !== "error" && trainingRecords.length > 0 && (
        <section
          className="training-library-controls"
          aria-label="Training Library controls"
        >
          <label className="training-library-search">
            <span>Search Training</span>

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, providers, topics, outcomes, instructors, or skills"
            />
          </label>

          <div className="training-library-filter-grid">
            <LibrarySelect
              label="Training Type"
              value={filters.trainingType}
              onChange={(value) => updateFilter("trainingType", value)}
            >
              <option value="all">All Training Types</option>

              {TRAINING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </LibrarySelect>

            <LibrarySelect
              label="Provider Type"
              value={filters.providerType}
              onChange={(value) => updateFilter("providerType", value)}
            >
              <option value="all">All Providers</option>

              {TRAINING_PROVIDER_TYPE_OPTIONS.filter(
                (option) => option.value,
              ).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </LibrarySelect>

            <LibrarySelect
              label="Completion"
              value={filters.completionStatus}
              onChange={(value) => updateFilter("completionStatus", value)}
            >
              <option value="all">All Statuses</option>

              {TRAINING_COMPLETION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </LibrarySelect>

            <LibrarySelect
              label="Delivery"
              value={filters.deliveryFormat}
              onChange={(value) => updateFilter("deliveryFormat", value)}
            >
              <option value="all">All Formats</option>

              {TRAINING_DELIVERY_FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </LibrarySelect>

            <LibrarySelect
              label="Sort By"
              value={sortOption}
              onChange={setSortOption}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title-ascending">Training Title</option>
              <option value="provider-ascending">Provider Name</option>
              <option value="recently-updated">Recently Updated</option>
            </LibrarySelect>
          </div>

          <div className="training-library-options">
            <label>
              <input
                type="checkbox"
                checked={filters.hasCredential}
                onChange={(event) =>
                  updateFilter("hasCredential", event.target.checked)
                }
              />
              Has credential
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

            <label>
              <input
                type="checkbox"
                checked={filters.hasDocuments}
                onChange={(event) =>
                  updateFilter("hasDocuments", event.target.checked)
                }
              />
              Has documents
            </label>
          </div>

          <footer>
            <span>
              Showing <strong>{displayedTraining.length}</strong> of{" "}
              <strong>{trainingRecords.length}</strong> records
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
        <div className="training-library-loading" role="status">
          <span aria-hidden="true" />

          <div>
            <strong>Loading Training Library</strong>

            <p>Retrieving your training records.</p>
          </div>
        </div>
      )}

      {!isLoading && loadStatus === "error" && (
        <div className="training-library-state">
          <span aria-hidden="true">!</span>

          <h3>Training could not be loaded</h3>

          <p>Check browser storage and try again.</p>

          <button type="button" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}

      {!isLoading && loadStatus !== "error" && trainingRecords.length === 0 && (
        <div className="training-library-state">
          <span aria-hidden="true">{showArchived ? "□" : "◇"}</span>

          <h3>
            {showArchived ? "No archived training" : "No training saved yet"}
          </h3>

          <p>
            {showArchived
              ? "Training records you archive will appear here."
              : "Add your first reusable training record."}
          </p>

          {!showArchived && (
            <button type="button" onClick={onAddTraining}>
              Add Your First Training
            </button>
          )}
        </div>
      )}

      {!isLoading &&
        loadStatus !== "error" &&
        trainingRecords.length > 0 &&
        displayedTraining.length === 0 && (
          <div className="training-library-state">
            <span aria-hidden="true">⌕</span>

            <h3>No matching training</h3>

            <p>Change the search or filters to display more records.</p>

            <button type="button" onClick={clearFilters}>
              Clear Search and Filters
            </button>
          </div>
        )}

      {!isLoading && loadStatus !== "error" && displayedTraining.length > 0 && (
        <div className="training-library-list">
          {displayedTraining.map((training) => {
            const isWorking =
              operation.trainingId === training.id &&
              operation.status === "loading";

            return (
              <TrainingItem
                key={training.id}
                training={training}
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
  return (
    <label className="training-library-select">
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

export default TrainingLibrary;
