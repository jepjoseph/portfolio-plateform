import { useMemo, useState } from "react";

import {
  getProjectCategoryLabel,
  getProjectLifecycleStatusLabel,
} from "../../../../config/projectConfig.js";

import {
  getProjectDateRange,
  getProjectFeaturedMedia,
  sortProjects,
} from "../../../../services/Project/projectUtils.js";

import "./Projects.css";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/*
 * =========================================
 * Selected Project IDs
 * =========================================
 *
 * Older drafts may contain complete Project
 * objects. New drafts store only identifiers.
 */

function normalizeSelectedProjectIds(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const identifiers = values
    .map((value) =>
      typeof value === "string" ? getText(value) : getText(value?.id),
    )
    .filter(Boolean);

  return [...new Set(identifiers)];
}

/*
 * =========================================
 * Portfolio Project Selector
 * =========================================
 */

function Projects({
  projects = [],
  selectedProjectIds = [],
  isLoading = false,
  disabled = false,
  onChange,
}) {
  const [query, setQuery] = useState("");

  const normalizedSelectedIds = useMemo(
    () => normalizeSelectedProjectIds(selectedProjectIds),
    [selectedProjectIds],
  );

  const selectedIdSet = useMemo(
    () => new Set(normalizedSelectedIds),
    [normalizedSelectedIds],
  );

  /*
   * =========================================
   * Available Projects
   * =========================================
   */

  const sortedProjects = useMemo(
    () =>
      sortProjects(Array.isArray(projects) ? projects : [], "newest-started"),
    [projects],
  );

  /*
   * =========================================
   * Search
   * =========================================
   */

  const filteredProjects = useMemo(() => {
    const normalizedQuery = getText(query)
      .normalize("NFKC")
      .toLocaleLowerCase();

    if (!normalizedQuery) {
      return sortedProjects;
    }

    const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);

    return sortedProjects.filter((project) => {
      const searchableText = [
        project?.title,
        project?.role,
        project?.organization?.name,
        project?.organization?.clientName,
        project?.presentation?.shortSummary,
        project?.solution?.overview,
        getProjectCategoryLabel(project?.category),
        getProjectLifecycleStatusLabel(project?.lifecycleStatus),
      ]
        .map(getText)
        .filter(Boolean)
        .join(" ")
        .normalize("NFKC")
        .toLocaleLowerCase();

      return searchTerms.every((term) => searchableText.includes(term));
    });
  }, [query, sortedProjects]);

  /*
   * =========================================
   * Selection
   * =========================================
   */

  const updateSelection = (projectId, isSelected) => {
    if (!projectId || disabled) {
      return;
    }

    if (isSelected) {
      if (selectedIdSet.has(projectId)) {
        return;
      }

      onChange?.([...normalizedSelectedIds, projectId]);

      return;
    }

    onChange?.(
      normalizedSelectedIds.filter(
        (selectedProjectId) => selectedProjectId !== projectId,
      ),
    );
  };

  const clearSelection = () => {
    if (disabled || normalizedSelectedIds.length === 0) {
      return;
    }

    onChange?.([]);
  };

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <section className="portfolio-projects dashboard-card">
      <header className="portfolio-projects-header">
        <div>
          <span>Selected Work</span>

          <h3>Portfolio Projects</h3>

          <p>
            Choose the active Projects that will appear in your public
            portfolio. Private Project information is removed before
            publication.
          </p>
        </div>

        <strong>
          {normalizedSelectedIds.length}{" "}
          {normalizedSelectedIds.length === 1 ? "Selected" : "Selected"}
        </strong>
      </header>

      <div className="portfolio-projects-controls">
        <label className="portfolio-projects-search">
          <span>Search Projects</span>

          <div>
            <span aria-hidden="true">⌕</span>

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Project titles, roles, or organizations"
              autoComplete="off"
              disabled={disabled}
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                disabled={disabled}
                aria-label="Clear Project search"
              >
                ×
              </button>
            )}
          </div>
        </label>

        <button
          type="button"
          className="portfolio-projects-clear"
          onClick={clearSelection}
          disabled={disabled || normalizedSelectedIds.length === 0}
        >
          Clear Selection
        </button>
      </div>

      {isLoading && (
        <div className="portfolio-projects-state" role="status">
          Loading Project Library…
        </div>
      )}

      {!isLoading && sortedProjects.length === 0 && (
        <div className="portfolio-projects-state">
          <strong>No Projects are available</strong>

          <p>
            Create a Project in the Project Library before selecting work for
            your portfolio.
          </p>
        </div>
      )}

      {!isLoading &&
        sortedProjects.length > 0 &&
        filteredProjects.length === 0 && (
          <div className="portfolio-projects-state">
            <strong>No Projects match this search</strong>

            <p>Clear the search or try a different Project title.</p>
          </div>
        )}

      {!isLoading && filteredProjects.length > 0 && (
        <div
          className="portfolio-projects-list"
          role="list"
          aria-label="Available portfolio Projects"
        >
          {filteredProjects.map((project) => {
            const isArchived = project?.recordStatus === "archived";

            const isSelected = selectedIdSet.has(project.id);

            const featuredMedia = getProjectFeaturedMedia(project);

            const organizationName =
              getText(project?.organization?.name) ||
              getText(project?.organization?.clientName);

            const summary =
              getText(project?.presentation?.shortSummary) ||
              getText(project?.solution?.overview) ||
              getText(project?.problem?.statement);

            return (
              <article
                key={project.id}
                className={`portfolio-projects-item ${
                  isSelected ? "portfolio-projects-item--selected" : ""
                } ${isArchived ? "portfolio-projects-item--archived" : ""}`}
                role="listitem"
              >
                <label>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(event) =>
                      updateSelection(project.id, event.target.checked)
                    }
                    disabled={disabled || (isArchived && !isSelected)}
                  />

                  <span className="portfolio-projects-checkbox" />

                  <span className="portfolio-projects-information">
                    <span className="portfolio-projects-labels">
                      <small>
                        {getProjectCategoryLabel(project?.category)}
                      </small>

                      <small>
                        {getProjectLifecycleStatusLabel(
                          project?.lifecycleStatus,
                        )}
                      </small>

                      {isArchived && (
                        <small className="portfolio-projects-archived">
                          Archived
                        </small>
                      )}
                    </span>

                    <strong>{project?.title || "Untitled Project"}</strong>

                    <span className="portfolio-projects-role">
                      {project?.role || "Role not specified"}

                      {organizationName && ` · ${organizationName}`}
                    </span>

                    {summary && <p>{summary}</p>}

                    <span className="portfolio-projects-metadata">
                      <span>
                        <strong>Timeline</strong>
                        {getProjectDateRange(project)}
                      </span>

                      <span>
                        <strong>Item Media</strong>
                        {featuredMedia?.name ||
                          featuredMedia?.fileName ||
                          "No public media selected"}
                      </span>
                    </span>
                  </span>
                </label>
              </article>
            );
          })}
        </div>
      )}

      <footer className="portfolio-projects-footer">
        <p>Projects are displayed from the newest start date to the oldest.</p>

        {normalizedSelectedIds.length > 0 && (
          <strong>
            {normalizedSelectedIds.length}{" "}
            {normalizedSelectedIds.length === 1
              ? "Project will appear"
              : "Projects will appear"}
          </strong>
        )}
      </footer>
    </section>
  );
}

export default Projects;
