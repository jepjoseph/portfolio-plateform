import "./TrainingPageHeader.css";

function TrainingPageHeader({
  totalTraining = 0,
  activeCount = 0,
  archivedCount = 0,
  showArchived = false,
  isLoading = false,
  onAddTraining,
  onToggleArchived,
}) {
  return (
    <header className="training-page-header">
      <div className="training-page-header-content">
        <span>Professional Development</span>

        <h1>Training</h1>

        <p>
          Manage courses, workshops, technical instruction, employer training,
          conferences, and other professional-development records.
        </p>

        <div className="training-page-header-statistics">
          <span>
            <strong>{totalTraining}</strong> Total
          </span>

          <span>
            <strong>{activeCount}</strong> Active
          </span>

          <span>
            <strong>{archivedCount}</strong> Archived
          </span>
        </div>
      </div>

      <div className="training-page-header-actions">
        <button
          type="button"
          className="training-page-header-archive"
          onClick={onToggleArchived}
          disabled={isLoading}
          aria-pressed={showArchived}
        >
          {showArchived ? "View Active Training" : "View Archived"}
        </button>

        <button
          type="button"
          className="training-page-header-add"
          onClick={onAddTraining}
          disabled={isLoading}
        >
          <span aria-hidden="true">+</span>
          Add Training
        </button>
      </div>
    </header>
  );
}

export default TrainingPageHeader;
