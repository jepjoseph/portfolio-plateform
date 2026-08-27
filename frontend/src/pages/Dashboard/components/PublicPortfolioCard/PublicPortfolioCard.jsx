import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./PublicPortfolioCard.css";

function PublicPortfolioCard({
  username,
  isLive = true,
  platformUrl = "yourplatform.com",
}) {
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);

  const portfolioPath = `/u/${username}`;
  const portfolioUrl = `${platformUrl}${portfolioPath}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${portfolioUrl}`);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy portfolio URL:", error);
    }
  };

  const handleViewPortfolio = () => {
    navigate(portfolioPath);
  };

  return (
    <article className="public-portfolio-card dashboard-card">
      {/* =========================================
          Header
          ========================================= */}

      <div className="dashboard-card-header">
        <div>
          <span className="dashboard-card-eyebrow">Public Profile</span>

          <h3>Your Portfolio</h3>
        </div>

        <span className={`portfolio-status ${isLive ? "live" : "offline"}`}>
          <span className="portfolio-status-dot">●</span>

          {isLive ? "Live" : "Offline"}
        </span>
      </div>

      {/* =========================================
          Description
          ========================================= */}

      <p className="dashboard-card-description">
        Your professional portfolio is available publicly through your unique
        profile URL.
      </p>

      {/* =========================================
          Portfolio URL
          ========================================= */}

      <div className="portfolio-url">
        <span className="portfolio-url-text" title={`https://${portfolioUrl}`}>
          {portfolioUrl}
        </span>

        <button
          type="button"
          className={`portfolio-copy-button ${copied ? "copied" : ""}`}
          onClick={handleCopy}
          aria-label={copied ? "Portfolio URL copied" : "Copy portfolio URL"}
          title={copied ? "Copied" : "Copy portfolio URL"}
        >
          {copied ? "✓" : "⧉"}
        </button>
      </div>

      {/* =========================================
          View Portfolio
          ========================================= */}

      <button
        type="button"
        className="dashboard-primary-button"
        onClick={handleViewPortfolio}
        disabled={!isLive}
      >
        {isLive ? "View Public Portfolio" : "Portfolio Offline"}
      </button>
    </article>
  );
}

export default PublicPortfolioCard;
