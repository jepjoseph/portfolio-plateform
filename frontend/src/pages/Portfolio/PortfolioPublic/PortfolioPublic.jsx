import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import PortfolioView from "../../../components/PortfolioView/PortfolioView";

import { getPublicPortfolio } from "../../../services/Portfolio/portfolioService";

import "./PortfolioPublic.css";

function PortfolioPublic() {
  const { username, portfolioSlug } = useParams();

  const [portfolio, setPortfolio] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isActive = true;

    const loadPortfolio = async () => {
      try {
        setStatus("loading");

        const savedPortfolio =
          await getPublicPortfolio(
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

        console.error(
          "Unable to load public portfolio:",
          error,
        );

        setPortfolio(null);
        setStatus("error");
      }
    };

    loadPortfolio();

    return () => {
      isActive = false;
    };
  }, [username, portfolioSlug]);

  if (status === "loading") {
    return (
      <main className="portfolio-public-status">
        <div
          className="portfolio-public-loader"
          aria-hidden="true"
        />

        <p>Loading portfolio...</p>
      </main>
    );
  }

  if (status === "error" || !portfolio) {
    return (
      <main className="portfolio-public-status">
        <h1>Portfolio not found</h1>

        <p>
          This portfolio may be private, unpublished, or unavailable.
        </p>
      </main>
    );
  }

  return (
    <div className="portfolio-public-page">
      <PortfolioView portfolio={portfolio} />
    </div>
  );
}

export default PortfolioPublic;