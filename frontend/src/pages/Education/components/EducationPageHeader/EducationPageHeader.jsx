import "./EducationPageHeader.css";

function EducationPageHeader({
  totalEducation = 0,
  activeCount = 0,
  archivedCount = 0,
  showArchived = false,
  isLoading = false,
  onAddEducation,
  onToggleArchived,
}) {
  return (
    <header className="education-page-header">
      <div className="education-page-header-content">
        <div className="education-page-header-label">
          <span aria-hidden="true" />

          <strong>Academic Background</strong>
        </div>

        <h1>Education</h1>

        <p>
          Build a reusable library of degrees, diplomas, academic programs,
          coursework, honors, activities, and skills for your résumés and
          portfolios.
        </p>

        <div className="education-page-header-summary">
          <span>
            <strong>{totalEducation}</strong>{" "}
            {totalEducation === 1 ? "record" : "records"}
          </span>

          <span aria-hidden="true">•</span>

          <span>
            <strong>{activeCount}</strong> active
          </span>

          <span aria-hidden="true">•</span>

          <span>
            <strong>{archivedCount}</strong> archived
          </span>
        </div>
      </div>

      <div className="education-page-header-actions">
        <button
          type="button"
          className={`education-page-header-archive-button ${
            showArchived ? "education-page-header-archive-button--active" : ""
          }`}
          onClick={onToggleArchived}
          disabled={isLoading}
          aria-pressed={showArchived}
        >
          <span aria-hidden="true">{showArchived ? "←" : "□"}</span>

          {showArchived
            ? "View Active Education"
            : `Archived (${archivedCount})`}
        </button>

        <button
          type="button"
          className="education-page-header-add-button"
          onClick={onAddEducation}
          disabled={isLoading}
        >
          <span aria-hidden="true">+</span>
          Add Education
        </button>
      </div>
    </header>
  );
}

export default EducationPageHeader;
