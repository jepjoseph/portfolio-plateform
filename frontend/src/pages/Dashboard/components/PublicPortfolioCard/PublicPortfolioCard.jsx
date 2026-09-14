import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import "./PublicPortfolioCard.css";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatUpdatedDate(value) {
  const timestamp = new Date(value || "").getTime();

  if (!Number.isFinite(timestamp)) {
    return "Not published yet";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(timestamp));
  } catch {
    return "Recently updated";
  }
}

function getPlatformOrigin(platformUrl) {
  const suppliedUrl = getText(platformUrl);

  if (suppliedUrl) {
    return suppliedUrl.startsWith("http://") ||
      suppliedUrl.startsWith("https://")
      ? suppliedUrl.replace(/\/+$/, "")
      : `https://${suppliedUrl.replace(/\/+$/, "")}`;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

/*
 * =========================================
 * Public Portfolio Card
 * =========================================
 */

function PublicPortfolioCard({
  username = "",
  portfolioSlug = "",
  portfolioName = "Professional Portfolio",
  isLive = false,
  updatedAt = "",
  projectCount = 0,
  resumeCount = 0,
  platformUrl = "",
  isLoading = false,
}) {
  const [copyStatus, setCopyStatus] = useState("idle");

  const copyTimeoutRef = useRef(null);

  const normalizedUsername = getText(username);

  const normalizedSlug = getText(portfolioSlug);

  const hasPortfolioIdentity = Boolean(normalizedUsername && normalizedSlug);

  const portfolioPath = hasPortfolioIdentity
    ? `/portfolio/${encodeURIComponent(
        normalizedUsername,
      )}/${encodeURIComponent(normalizedSlug)}`
    : "";

  const portfolioUrl = useMemo(() => {
    if (!portfolioPath) {
      return "";
    }

    const origin = getPlatformOrigin(platformUrl);

    return origin ? `${origin}${portfolioPath}` : portfolioPath;
  }, [platformUrl, portfolioPath]);

  const canOpenPortfolio = isLive && hasPortfolioIdentity && !isLoading;

  const publishedDate = formatUpdatedDate(updatedAt);

  /*
   * =========================================
   * Clear Copy Timer
   * =========================================
   */

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  /*
   * =========================================
   * Copy Portfolio URL
   * =========================================
   */

  const handleCopy = async () => {
    if (!portfolioUrl || !canOpenPortfolio) {
      return;
    }

    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable.");
      }

      await navigator.clipboard.writeText(portfolioUrl);

      setCopyStatus("copied");

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopyStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Unable to copy portfolio URL:", error);

      setCopyStatus("error");

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopyStatus("idle");
      }, 2500);
    }
  };

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <article className="public-portfolio-card dashboard-card">
      <header className="dashboard-card-header">
        <div>
          <span className="dashboard-card-eyebrow">Public Presence</span>

          <h3>Your Portfolio</h3>
        </div>

        <span
          className={`portfolio-status ${
            isLive ? "portfolio-status--live" : "portfolio-status--offline"
          }`}
        >
          <span className="portfolio-status-dot" aria-hidden="true" />

          {isLoading ? "Loading" : isLive ? "Published" : "Draft"}
        </span>
      </header>

      <p className="dashboard-card-description">
        {isLive
          ? "Your professional portfolio is published and available through its public URL."
          : "Complete and publish your portfolio to create a shareable professional presence."}
      </p>

      <div className="public-portfolio-information">
        <span>
          <small>Portfolio</small>

          <strong>{getText(portfolioName) || "Professional Portfolio"}</strong>
        </span>

        <span>
          <small>Projects</small>

          <strong>{Number(projectCount) || 0}</strong>
        </span>

        <span>
          <small>Résumés</small>

          <strong>{Number(resumeCount) || 0}</strong>
        </span>

        <span>
          <small>Last Published</small>

          <strong>{isLive ? publishedDate : "Not published"}</strong>
        </span>
      </div>

      <div
        className={`portfolio-url ${
          !canOpenPortfolio ? "portfolio-url--disabled" : ""
        }`}
      >
        <span className="portfolio-url-text" title={portfolioUrl}>
          {portfolioUrl || "Publish the portfolio to create its public URL"}
        </span>

        <button
          type="button"
          className={`portfolio-copy-button ${
            copyStatus === "copied" ? "portfolio-copy-button--copied" : ""
          } ${copyStatus === "error" ? "portfolio-copy-button--error" : ""}`}
          onClick={handleCopy}
          disabled={!canOpenPortfolio}
          aria-label={
            copyStatus === "copied"
              ? "Portfolio URL copied"
              : copyStatus === "error"
                ? "Portfolio URL could not be copied"
                : "Copy portfolio URL"
          }
          title={
            copyStatus === "copied"
              ? "Copied"
              : copyStatus === "error"
                ? "Copy unsuccessful"
                : "Copy portfolio URL"
          }
        >
          {copyStatus === "copied" ? "✓" : copyStatus === "error" ? "!" : "⧉"}
        </button>
      </div>

      {copyStatus === "copied" && (
        <p
          className="portfolio-copy-message portfolio-copy-message--success"
          role="status"
        >
          Portfolio URL copied.
        </p>
      )}

      {copyStatus === "error" && (
        <p
          className="portfolio-copy-message portfolio-copy-message--error"
          role="alert"
        >
          The URL could not be copied. You can select it manually.
        </p>
      )}

      <footer className="public-portfolio-actions">
        <Link to="/portfolio">
          {isLive ? "Edit Portfolio" : "Complete Portfolio"}
        </Link>

        {canOpenPortfolio ? (
          <a
            href={portfolioPath}
            target="_blank"
            rel="noopener noreferrer"
            className="public-portfolio-primary-action"
          >
            View Public Portfolio
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span
            className="public-portfolio-primary-action public-portfolio-primary-action--disabled"
            aria-disabled="true"
          >
            Portfolio Not Published
          </span>
        )}
      </footer>
    </article>
  );
}

export default PublicPortfolioCard;
