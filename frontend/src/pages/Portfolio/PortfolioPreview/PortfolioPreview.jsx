import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PortfolioView from "../PortfolioView/PortfolioView";

import "./PortfolioPreview.css";

/*
 * =========================================
 * Preview Storage
 * =========================================
 */

const PORTFOLIO_PREVIEW_STORAGE_KEY = "portfolio-preview";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

/*
 * =========================================
 * Read Portfolio Preview
 * =========================================
 */

function readPortfolioPreview() {
  if (
    typeof window === "undefined" ||
    !window.sessionStorage
  ) {
    return {
      portfolio: null,
      error:
        "Portfolio preview storage is unavailable in this browser.",
    };
  }

  let storedDraft = "";

  try {
    storedDraft =
      window.sessionStorage.getItem(
        PORTFOLIO_PREVIEW_STORAGE_KEY,
      ) || "";
  } catch (error) {
    console.error("Unable to access portfolio preview storage:", error);

    return {
      portfolio: null,
      error:
        "The portfolio preview could not be accessed in this browser.",
    };
  }

  if (!storedDraft) {
    return {
      portfolio: null,
      error:
        "No portfolio preview was found. Return to the editor and select Preview again.",
    };
  }

  try {
    const parsedDraft = getObject(JSON.parse(storedDraft));

    if (!parsedDraft) {
      return {
        portfolio: null,
        error: "The stored portfolio preview is invalid.",
      };
    }

    if (!parsedDraft.username || !parsedDraft.slug) {
      return {
        portfolio: null,
        error:
          "The stored portfolio preview does not contain a valid username and portfolio slug.",
      };
    }

    return {
      portfolio: parsedDraft,
      error: "",
    };
  } catch (error) {
    console.error("Unable to parse portfolio preview:", error);

    return {
      portfolio: null,
      error:
        "The stored portfolio preview is corrupted. Return to the editor and create it again.",
    };
  }
}

/*
 * =========================================
 * Portfolio Preview
 * =========================================
 */

function PortfolioPreview() {
  const navigate = useNavigate();

  const [previewState] = useState(readPortfolioPreview);

  const { portfolio, error } = previewState;

  /*
   * =========================================
   * Browser Page Title
   * =========================================
   */

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const previousTitle = document.title;

    const portfolioOwner =
      portfolio?.selectedProfile?.selectedName ||
      portfolio?.username ||
      "";

    document.title = portfolioOwner
      ? `Preview: ${portfolioOwner} | Professional Portfolio`
      : "Portfolio Preview";

    return () => {
      document.title = previousTitle;
    };
  }, [portfolio]);

  /*
   * =========================================
   * Return to Editor
   * =========================================
   */

  const handleBackToEditor = () => {
    navigate("/portfolio");
  };

  /*
   * =========================================
   * Missing or Invalid Preview
   * =========================================
   */

  if (!portfolio) {
    return (
      <main className="portfolio-preview-empty">
        <div>
          <span>Preview Unavailable</span>

          <h1>No portfolio preview is available</h1>

          <p>
            {error ||
              "Return to the portfolio editor and select Preview again."}
          </p>

          <button type="button" onClick={handleBackToEditor}>
            Return to Portfolio Editor
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================
   * Preview
   * =========================================
   */

  return (
    <div className="portfolio-preview-page">
      <aside
        className="portfolio-preview-toolbar"
        aria-label="Portfolio preview controls"
      >
        <div>
          <span>Preview Mode</span>

          <p>
            This is how your public portfolio will appear after publication.
          </p>
        </div>

        <button type="button" onClick={handleBackToEditor}>
          Back to Editor
        </button>
      </aside>

      <PortfolioView
        portfolio={portfolio}
        mode="preview"
      />
    </div>
  );
}

export default PortfolioPreview;