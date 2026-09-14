import "./CertificationPageHeader.css";

function CertificationPageHeader({
  totalCertifications = 0,
  activeCount = 0,
  archivedCount = 0,
  showArchived = false,
  isLoading = false,
  onAddCertification,
  onToggleArchived,
}) {
  return (
    <header className="certification-page-header">
      <div>
        <span>Career Credentials</span>

        <h1>Certification Library</h1>

        <p>
          Manage verified credentials, related Training and Skills, renewal
          information, and certificate documents.
        </p>
      </div>

      <div className="certification-page-header-actions">
        <div
          className="certification-page-header-counts"
          aria-label="Certification totals"
        >
          <span>
            <strong>{totalCertifications}</strong> Total
          </span>

          <span>
            <strong>{activeCount}</strong> Active
          </span>

          <span>
            <strong>{archivedCount}</strong> Archived
          </span>
        </div>

        <div>
          <button
            type="button"
            className="certification-page-archive-button"
            onClick={onToggleArchived}
            disabled={isLoading}
          >
            {showArchived ? "View Active" : "View Archived"}
          </button>

          {!showArchived && (
            <button
              type="button"
              className="certification-page-add-button"
              onClick={onAddCertification}
              disabled={isLoading}
            >
              <span aria-hidden="true">+</span>
              Add Certification
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default CertificationPageHeader;
