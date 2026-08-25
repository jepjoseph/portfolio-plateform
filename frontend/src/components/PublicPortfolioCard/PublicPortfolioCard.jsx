import "./PublicPortfolioCard.css";

function PublicPortfolioCard({ username, isLive = true }) {
  const portfolioUrl = `yourplatform.com/u/${username}`;

  return (
    <article className="public-portfolio-card dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <span className="dashboard-card-eyebrow">Public Profile</span>

          <h3>Your Portfolio</h3>
        </div>

        {isLive && <span className="portfolio-status">● Live</span>}
      </div>

      <p className="dashboard-card-description">
        Your professional portfolio is available publicly through your unique
        profile URL.
      </p>

      <div className="portfolio-url">
        <span>{portfolioUrl}</span>

        <button type="button" aria-label="Copy portfolio URL">
          ⧉
        </button>
      </div>

      <button type="button" className="dashboard-primary-button">
        View Public Portfolio
      </button>
    </article>
  );
}

export default PublicPortfolioCard;
