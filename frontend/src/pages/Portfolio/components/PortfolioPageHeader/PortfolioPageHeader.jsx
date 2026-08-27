import "./PortfolioPageHeader.css";

function PortfolioPageHeader({
  onPreview,
  onSave,
  isSaving = false,
  isLive = true,
}) {
  return (
    <header className="portfolio-page-header">
      <div className="portfolio-page-header-content">
        <span className="portfolio-page-eyebrow">Professional Profile</span>

        <h2>My Portfolio</h2>

        <p>
          Build and manage the professional information displayed on your public
          portfolio.
        </p>
      </div>

      <div className="portfolio-page-header-actions">
        <div className="portfolio-page-status">
          <span
            className={`portfolio-page-status-dot ${
              isLive ? "live" : "offline"
            }`}
          />

          <span>{isLive ? "Portfolio Live" : "Portfolio Offline"}</span>
        </div>

        <button
          type="button"
          className="portfolio-secondary-button"
          onClick={onPreview}
        >
          Preview
        </button>

        <button
          type="button"
          className="portfolio-primary-button"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </header>
  );
}

export default PortfolioPageHeader;
