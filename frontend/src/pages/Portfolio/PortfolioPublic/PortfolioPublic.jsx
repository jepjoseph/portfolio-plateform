import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import PortfolioView from "../PortfolioView/PortfolioView";

import {
  createPortfolioStorageKey,
  getPublicPortfolio,
} from "../../../services/Portfolio/portfolioService.js";

import "./PortfolioPublic.css";

/*
 * =========================================
 * Public Portfolio
 * =========================================
 */

function PortfolioPublic() {
  const { username = "", portfolioSlug = "" } = useParams();

  const [portfolio, setPortfolio] = useState(null);

  const [status, setStatus] = useState("loading");

  const [errorMessage, setErrorMessage] = useState("");

  /*
   * =========================================
   * Load and Synchronize Portfolio
   * =========================================
   */

  useEffect(() => {
    let isActive = true;

    let storageKey = "";

    try {
      storageKey = createPortfolioStorageKey(username, portfolioSlug);
    } catch (error) {
      setPortfolio(null);
      setStatus("error");

      setErrorMessage(
        error?.publicMessage ||
          error?.message ||
          "The requested portfolio could not be identified.",
      );

      return undefined;
    }

    const loadPortfolio = async ({ showLoading = true } = {}) => {
      try {
        if (showLoading && isActive) {
          setStatus("loading");
        }

        if (isActive) {
          setErrorMessage("");
        }

        const savedPortfolio = await getPublicPortfolio(
          username,
          portfolioSlug,
        );

        if (!isActive) {
          return;
        }

        setPortfolio(savedPortfolio);
        setStatus("success");
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error("Unable to load public portfolio:", error);

        setPortfolio(null);
        setStatus("error");

        setErrorMessage(
          error?.publicMessage ||
            error?.message ||
            "The requested portfolio could not be loaded.",
        );
      }
    };

    loadPortfolio();

    /*
     * The storage event is triggered when a
     * different browser tab changes localStorage.
     *
     * This keeps an already-open public portfolio
     * synchronized after it is republished from
     * the Portfolio editor in another tab.
     */

    const handleStorageChange = (event) => {
      if (
        event.storageArea !== window.localStorage ||
        event.key !== storageKey
      ) {
        return;
      }

      loadPortfolio({
        showLoading: false,
      });
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      isActive = false;

      window.removeEventListener("storage", handleStorageChange);
    };
  }, [username, portfolioSlug]);

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

    if (portfolio) {
      const portfolioOwner =
        portfolio.selectedProfile?.selectedName || portfolio.username || "";

      document.title = portfolioOwner
        ? `${portfolioOwner} | Professional Portfolio`
        : "Professional Portfolio";
    }

    return () => {
      document.title = previousTitle;
    };
  }, [portfolio]);

  /*
   * =========================================
   * Loading State
   * =========================================
   */

  if (status === "loading") {
    return (
      <main
        className="portfolio-public-status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="portfolio-public-loader" aria-hidden="true" />

        <p>Loading portfolio…</p>
      </main>
    );
  }

  /*
   * =========================================
   * Error or Unpublished State
   * =========================================
   */

  if (status === "error" || !portfolio || portfolio.isPublished !== true) {
    return (
      <main className="portfolio-public-status" role="alert">
        <h1>Portfolio not found</h1>

        <p>
          {errorMessage ||
            "This portfolio may be private, unpublished, or unavailable."}
        </p>
      </main>
    );
  }

  /*
   * =========================================
   * Published Portfolio
   * =========================================
   */

  return (
    <div className="portfolio-public-page">
      <PortfolioView portfolio={portfolio} mode="public" />
    </div>
  );
}

export default PortfolioPublic;
