import "./SkillsPageHeader.css";

function SkillsPageHeader({
  totalSkills = 0,
  activeCount = 0,
  archivedCount = 0,
  showArchived = false,
  isLoading = false,
  onAddSkill,
  onToggleArchived,
}) {
  return (
    <header className="skills-page-header">
      <div className="skills-page-header-content">
        <span className="skills-page-header-eyebrow">
          Professional Capabilities
        </span>

        <h1>Skills</h1>

        <p>
          Create and maintain a central library of professional skills,
          technologies, tools, languages, and industry knowledge. Saved skills
          can be connected to experiences and selected later for résumés and
          portfolios.
        </p>

        <div className="skills-page-header-meta">
          <span>
            <strong>{totalSkills}</strong>{" "}
            {totalSkills === 1 ? "saved skill" : "saved skills"}
          </span>

          <span>
            <strong>{activeCount}</strong> active
          </span>

          {archivedCount > 0 && (
            <span>
              <strong>{archivedCount}</strong>{" "}
              {archivedCount === 1 ? "archived skill" : "archived skills"}
            </span>
          )}
        </div>
      </div>

      <div className="skills-page-header-actions">
        {(showArchived || archivedCount > 0) && (
          <button
            type="button"
            className={`skills-page-header-archive-button ${
              showArchived ? "skills-page-header-archive-button--active" : ""
            }`}
            onClick={onToggleArchived}
            disabled={isLoading}
            aria-pressed={showArchived}
          >
            {showArchived ? "View Active" : "View Archived"}

            {!showArchived && archivedCount > 0 && (
              <span className="skills-page-header-archive-count">
                {archivedCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          className="skills-page-header-add-button"
          onClick={onAddSkill}
          disabled={isLoading || showArchived}
        >
          <span aria-hidden="true">+</span>
          Add Skill
        </button>
      </div>
    </header>
  );
}

export default SkillsPageHeader;
