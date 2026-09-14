import ProjectItem from "../ProjectItem/ProjectItem.jsx";

import "./ProjectList.css";

/*
 * =========================================
 * Project List
 * =========================================
 */

function ProjectList({
  projects = [],
  hasActiveSearch = false,
  showArchived = false,
  isSaving = false,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onCreate,
}) {
  const collection = Array.isArray(projects) ? projects.filter(Boolean) : [];

  /*
   * =========================================
   * Empty State
   * =========================================
   */

  if (collection.length === 0) {
    let title = "No projects saved yet";

    let description =
      "Create your first professional Project record and build a portfolio-ready case study.";

    if (hasActiveSearch) {
      title = "No projects match your search";

      description =
        "Adjust or reset the search and filter selections to see other projects.";
    } else if (showArchived) {
      title = "No archived projects";

      description =
        "Projects moved to the archive will appear in this collection.";
    }

    return (
      <section
        className="project-list-empty"
        aria-labelledby="project-list-empty-title"
      >
        <div className="project-list-empty-visual" aria-hidden="true">
          <span>01</span>
        </div>

        <strong id="project-list-empty-title">{title}</strong>

        <p>{description}</p>

        {!hasActiveSearch && !showArchived && onCreate && (
          <button type="button" onClick={onCreate} disabled={isSaving}>
            <span aria-hidden="true">+</span>
            Create Your First Project
          </button>
        )}
      </section>
    );
  }

  /*
   * =========================================
   * Project Collection
   * =========================================
   */

  return (
    <section
      className="project-list"
      role="list"
      aria-label={
        showArchived ? "Archived project records" : "Saved project records"
      }
      aria-busy={isSaving}
    >
      {collection.map((project, index) => (
        <div
          className="project-list-entry"
          role="listitem"
          key={project.id || `project-${index}`}
        >
          <ProjectItem
            project={project}
            listPosition={index + 1}
            showArchived={showArchived}
            isSaving={isSaving}
            onView={onView}
            onEdit={onEdit}
            onArchive={onArchive}
            onRestore={onRestore}
            onDelete={onDelete}
          />
        </div>
      ))}
    </section>
  );
}

export default ProjectList;
