import { useMemo, useState } from "react";

import {
  ProjectDataProvider,
  useProjectData,
} from "../../context/ProjectDataContext.jsx";

import {
  getProjectStatistics,
  prepareProjectCollection,
} from "../../services/Project/projectUtils.js";

import ProjectFilters, {
  DEFAULT_PROJECT_FILTERS,
} from "./components/ProjectFilters/ProjectFilters.jsx";

import ProjectForm from "./components/ProjectForm/ProjectForm.jsx";
import ProjectList from "./components/ProjectList/ProjectList.jsx";
import ProjectDetailViewer from "./components/ProjectDetailViewer/ProjectDetailViewer.jsx";

import "./Projects.css";

/*
 * =========================================
 * Default Project Sort
 * =========================================
 */

const DEFAULT_PROJECT_SORT = "newest-started";

/*
 * =========================================
 * Projects Page Content
 * =========================================
 */

function ProjectsContent({ relationshipCollections = {} }) {
  const {
    projects,
    isLoading,
    loadStatus,
    saveStatus,
    error,
    warnings,
    refreshProjects,
    createProject,
    updateProject,
    archiveProject,
    restoreProject,
    deleteProject,
    clearError,
    clearWarnings,
  } = useProjectData();

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingProject, setEditingProject] = useState(null);

  const [viewingProject, setViewingProject] = useState(null);

  const [showArchived, setShowArchived] = useState(false);

  const [query, setQuery] = useState("");

  const [filters, setFilters] = useState(DEFAULT_PROJECT_FILTERS);

  const [sortOption, setSortOption] = useState(DEFAULT_PROJECT_SORT);

  const isSaving = saveStatus === "saving";

  /*
   * =========================================
   * Relationship Collections
   * =========================================
   */

  const normalizedCollections = useMemo(
    () => ({
      skills: Array.isArray(relationshipCollections.skills)
        ? relationshipCollections.skills
        : [],

      experiences: Array.isArray(relationshipCollections.experiences)
        ? relationshipCollections.experiences
        : [],

      educationRecords: Array.isArray(relationshipCollections.educationRecords)
        ? relationshipCollections.educationRecords
        : [],

      trainingRecords: Array.isArray(relationshipCollections.trainingRecords)
        ? relationshipCollections.trainingRecords
        : [],

      certifications: Array.isArray(relationshipCollections.certifications)
        ? relationshipCollections.certifications
        : [],

      isLoading: Boolean(relationshipCollections.isLoading),
    }),
    [relationshipCollections],
  );

  /*
   * =========================================
   * Project Statistics
   * =========================================
   */

  const statistics = useMemo(() => getProjectStatistics(projects), [projects]);

  /*
   * =========================================
   * Active or Archived Collection
   * =========================================
   */

  const statusCollection = useMemo(
    () =>
      projects.filter((project) =>
        showArchived
          ? project.recordStatus === "archived"
          : project.recordStatus !== "archived",
      ),
    [projects, showArchived],
  );

  /*
   * =========================================
   * Search, Filter, and Sort
   * =========================================
   */

  const displayedProjects = useMemo(
    () =>
      prepareProjectCollection({
        projects: statusCollection,
        query,
        filters,
        sortOption,
      }),
    [statusCollection, query, filters, sortOption],
  );

  const hasActiveFilters =
    Boolean(query.trim()) ||
    Object.entries(DEFAULT_PROJECT_FILTERS).some(
      ([key, defaultValue]) => filters[key] !== defaultValue,
    );

  /*
   * =========================================
   * Create and Edit
   * =========================================
   */

  const openCreateForm = () => {
    clearError();
    clearWarnings();

    setViewingProject(null);
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const openEditForm = (project) => {
    if (!project || project.recordStatus === "archived") {
      return;
    }

    clearError();
    clearWarnings();

    setViewingProject(null);
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }

    clearError();

    setEditingProject(null);
    setIsFormOpen(false);
  };

  /*
   * =========================================
   * Save Project
   * =========================================
   */

  const handleSaveProject = async (projectData, assetOptions = {}) => {
    const options = {
      ...assetOptions,

      collections: {
        skills: normalizedCollections.skills,

        experiences: normalizedCollections.experiences,

        educationRecords: normalizedCollections.educationRecords,

        trainingRecords: normalizedCollections.trainingRecords,

        certifications: normalizedCollections.certifications,
      },
    };

    if (editingProject?.id) {
      await updateProject(editingProject.id, projectData, options);
    } else {
      await createProject(projectData, options);
    }

    setEditingProject(null);
    setIsFormOpen(false);
  };

  /*
   * =========================================
   * Archive Project
   * =========================================
   */

  const handleArchive = async (project) => {
    const projectTitle = project?.title || "this project";

    const confirmed = window.confirm(`Archive “${projectTitle}”?`);

    if (!confirmed) {
      return;
    }

    try {
      await archiveProject(project);

      if (viewingProject?.id === project.id) {
        setViewingProject(null);
      }
    } catch {
      /*
       * ProjectDataContext displays the
       * normalized service error.
       */
    }
  };

  /*
   * =========================================
   * Restore Project
   * =========================================
   */

  const handleRestore = async (project) => {
    try {
      await restoreProject(project);

      if (viewingProject?.id === project.id) {
        setViewingProject(null);
      }
    } catch {
      /*
       * ProjectDataContext displays the
       * normalized service error.
       */
    }
  };

  /*
   * =========================================
   * Permanently Delete Project
   * =========================================
   */

  const handleDelete = async (project) => {
    const projectTitle = project?.title || "this project";

    const confirmed = window.confirm(
      `Permanently delete “${projectTitle}” and all of its stored files? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject(project);

      if (viewingProject?.id === project.id) {
        setViewingProject(null);
      }

      if (editingProject?.id === project.id) {
        setEditingProject(null);
        setIsFormOpen(false);
      }
    } catch {
      /*
       * ProjectDataContext displays the
       * normalized service error.
       */
    }
  };

  /*
   * =========================================
   * Project Item Record Action
   * =========================================
   */

  const handleProjectAction = (project) => {
    if (project.recordStatus === "archived") {
      return handleDelete(project);
    }

    return handleArchive(project);
  };

  /*
   * =========================================
   * Archived View
   * =========================================
   */

  const toggleArchivedView = () => {
    clearError();
    clearWarnings();

    setViewingProject(null);
    setQuery("");
    setFilters(DEFAULT_PROJECT_FILTERS);
    setSortOption(DEFAULT_PROJECT_SORT);

    setShowArchived((currentValue) => !currentValue);
  };

  /*
   * =========================================
   * Reset Filters
   * =========================================
   */

  const resetFilters = () => {
    setQuery("");
    setFilters(DEFAULT_PROJECT_FILTERS);
    setSortOption(DEFAULT_PROJECT_SORT);
  };

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <main className="projects-page">
      <header className="projects-page-header">
        <div className="projects-page-heading">
          <span>Professional Portfolio</span>

          <h1>Project Library</h1>

          <p>
            Build evidence-based project case studies, connect professional
            records, and manage the media shown in your portfolio.
          </p>
        </div>

        <div className="projects-page-header-actions">
          <div className="projects-page-statistics" aria-label="Project totals">
            <span>
              <strong>{statistics.total}</strong>
              Total
            </span>

            <span>
              <strong>{statistics.active}</strong>
              Active
            </span>

            <span>
              <strong>{statistics.featured}</strong>
              Featured
            </span>

            <span>
              <strong>{statistics.withMedia}</strong>
              With Media
            </span>
          </div>

          <div className="projects-page-primary-actions">
            <button
              type="button"
              className="projects-page-archive-button"
              onClick={toggleArchivedView}
              disabled={isLoading || isSaving}
            >
              {showArchived
                ? "View Active"
                : `Archived (${statistics.archived})`}
            </button>

            {!showArchived && (
              <button
                type="button"
                className="projects-page-add-button"
                onClick={openCreateForm}
                disabled={isLoading || isSaving}
              >
                <span aria-hidden="true">+</span>
                Add Project
              </button>
            )}
          </div>
        </div>
      </header>

      {error && !isFormOpen && (
        <div
          className="projects-page-message projects-page-message--error"
          role="alert"
        >
          <div>
            <strong>Project operation unsuccessful</strong>

            <p>{error.message}</p>
          </div>

          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}

      {warnings.length > 0 && !isFormOpen && (
        <div className="projects-page-message projects-page-message--warning">
          <div>
            <strong>Project saved with suggestions</strong>

            <ul>
              {warnings.map((warning, index) => (
                <li key={`${warning.code || "warning"}-${index}`}>
                  {warning.message}
                </li>
              ))}
            </ul>
          </div>

          <button type="button" onClick={clearWarnings}>
            Dismiss
          </button>
        </div>
      )}

      {isFormOpen ? (
        <section
          className="projects-page-editor"
          aria-labelledby="project-editor-title"
        >
          <header>
            <div>
              <span>{editingProject ? "Edit Project" : "New Project"}</span>

              <h2 id="project-editor-title">
                {editingProject
                  ? editingProject.title || "Edit Project"
                  : "Create a Portfolio Project"}
              </h2>

              <p>
                Complete the professional record, relationships, evidence,
                media, and public presentation.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={isSaving}
              aria-label="Close project editor"
            >
              ×
            </button>
          </header>

          <ProjectForm
            initialProject={editingProject}
            relationshipCollections={normalizedCollections}
            isSaving={isSaving}
            onSubmit={handleSaveProject}
            onCancel={closeForm}
          />
        </section>
      ) : (
        <section
          className="projects-page-library"
          aria-labelledby="project-library-title"
        >
          <header>
            <div>
              <span>
                {showArchived ? "Archived Records" : "Portfolio Collection"}
              </span>

              <h2 id="project-library-title">
                {showArchived ? "Archived Projects" : "Saved Projects"}
              </h2>

              <p>
                Projects are listed from the newest start date to the oldest by
                default.
              </p>
            </div>
          </header>

          <ProjectFilters
            query={query}
            filters={filters}
            sortOption={sortOption}
            resultCount={displayedProjects.length}
            onQueryChange={setQuery}
            onFiltersChange={setFilters}
            onSortChange={setSortOption}
            onReset={resetFilters}
          />

          {isLoading && (
            <div className="projects-page-state" role="status">
              Loading projects…
            </div>
          )}

          {!isLoading && loadStatus === "error" && (
            <div className="projects-page-state">
              <strong>Projects could not be loaded</strong>

              <p>Check browser storage access and try again.</p>

              <button type="button" onClick={() => refreshProjects()}>
                Try Again
              </button>
            </div>
          )}

          {!isLoading && loadStatus !== "error" && (
            <ProjectList
              projects={displayedProjects}
              hasActiveSearch={hasActiveFilters}
              showArchived={showArchived}
              isSaving={isSaving}
              onCreate={openCreateForm}
              onView={setViewingProject}
              onEdit={showArchived ? undefined : openEditForm}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onDelete={handleDelete}
            />
          )}

          {showArchived && displayedProjects.length > 0 && (
            <section className="projects-page-archive-actions">
              <header>
                <strong>Restore Archived Projects</strong>

                <p>
                  Restoring a project returns it to the active Project Library.
                </p>
              </header>

              <div>
                {displayedProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleRestore(project)}
                    disabled={isSaving}
                  >
                    Restore {project.title || "Project"}
                  </button>
                ))}
              </div>
            </section>
          )}
        </section>
      )}

      {viewingProject && (
        <ProjectDetailViewer
          project={viewingProject}
          onClose={() => setViewingProject(null)}
          onEdit={
            viewingProject.recordStatus === "archived"
              ? undefined
              : openEditForm
          }
        />
      )}
    </main>
  );
}

/*
 * =========================================
 * Projects Page Provider
 * =========================================
 */

function Projects(props) {
  return (
    <ProjectDataProvider>
      <ProjectsContent {...props} />
    </ProjectDataProvider>
  );
}

export default Projects;
