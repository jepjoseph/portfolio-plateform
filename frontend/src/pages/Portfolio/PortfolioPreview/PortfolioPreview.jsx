import { useNavigate } from "react-router-dom";

import PortfolioView from "../../../components/PortfolioView/PortfolioView";

import "./PortfolioPreview.css";

function PortfolioPreview() {
  const navigate = useNavigate();

  const storedDraft = sessionStorage.getItem("portfolio-preview");

  let portfolio = null;

  try {
    portfolio = storedDraft ? JSON.parse(storedDraft) : null;
  } catch (error) {
    console.error("Unable to read portfolio preview:", error);

    portfolio = null;
  }

  const handleBackToEditor = () => {
    navigate("/portfolio");
  };

  if (!portfolio) {
    return (
      <main className="portfolio-preview-empty">
        <div>
          <span>Preview Unavailable</span>

          <h1>No portfolio draft was found</h1>

          <p>Return to the portfolio editor and select Preview again.</p>

          <button type="button" onClick={handleBackToEditor}>
            Return to Portfolio Editor
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="portfolio-preview-page">
      <aside className="portfolio-preview-toolbar">
        <div>
          <span>Preview Mode</span>

          <p>This is how your public portfolio will appear.</p>
        </div>

        <button type="button" onClick={handleBackToEditor}>
          Back to Editor
        </button>
      </aside>

      <PortfolioView portfolio={portfolio} />
    </div>
  );
}

export default PortfolioPreview;
