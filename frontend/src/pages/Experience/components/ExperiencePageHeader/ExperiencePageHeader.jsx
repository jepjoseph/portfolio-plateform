import "./ExperiencePageHeader.css";

function ExperiencePageHeader({
  totalExperiences = 0,
  archivedCount = 0,
  showArchived = false,
  isLoading = false,
  onAddExperience,
  onToggleArchived,
}) {
  return (
    <header className="experience-page-header">
      <div className="experience-page-header-content">
        <span>Professional Background</span>

        <h1>Experience</h1>

        <p>
          Create and maintain your employment, internship, freelance, volunteer,
          teaching, research, and leadership experience. Saved records can be
          selected later for résumés and portfolios.
        </p>

        <div className="experience-page-header-meta">
          <span>
            <strong>{totalExperiences}</strong>{" "}
            {totalExperiences === 1 ? "saved experience" : "saved experiences"}
          </span>

          {archivedCount > 0 && (
            <span>
              <strong>{archivedCount}</strong>{" "}
              {archivedCount === 1 ? "archived record" : "archived records"}
            </span>
          )}
        </div>
      </div>

      <div className="experience-page-header-actions">
        {archivedCount > 0 && (
          <button
            type="button"
            className={`experience-page-header-archive-button ${
              showArchived
                ? "experience-page-header-archive-button--active"
                : ""
            }`}
            onClick={onToggleArchived}
            disabled={isLoading}
            aria-pressed={showArchived}
          >
            {showArchived ? "View Active" : "View Archived"}
          </button>
        )}

        <button
          type="button"
          className="experience-page-header-add-button"
          onClick={onAddExperience}
          disabled={isLoading}
        >
          <span aria-hidden="true">+</span>
          Add Experience
        </button>
      </div>
    </header>
  );
}

export default ExperiencePageHeader;
