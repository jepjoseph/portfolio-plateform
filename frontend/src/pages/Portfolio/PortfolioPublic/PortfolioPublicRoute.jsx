import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  portfolioBackendService as api,
} from "../../../services/Portfolio/portfolioBackendService.js";

import {
  normalizePublicPortfolioRoute,
  getPublicPortfolioStyle,
  isSupportedPublicSnapshot,
} from "../../../services/Portfolio/portfolioPublicRouteUtils.js";

import PortfolioSnapshotPreview
  from "../PortfolioManager/PortfolioSnapshotPreview.jsx";

import "../PortfolioManager/PortfolioManager.css";
import "./PortfolioPublicRoute.css";
import PublicProjectDetails from "./PublicProjectDetails.jsx";

// Activate only after end-to-end security validation.
const PUBLIC_PORTFOLIO_ENABLED =
  import.meta.env.VITE_PORTFOLIO_PUBLIC_ENABLED === "true";

function PublicMessage({ title, description, children }) {
  return (
    <main className="ppr-message">
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
      <Link to="/">Return to home</Link>
    </main>
  );
}

function PublishedPortfolio({ routeKey, projectKey }) {
  const [state, setState] = useState({
    status: "loading",
    snapshot: null,
  });

  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;

    api.getPublicPortfolio(routeKey)
      .then(result => {
        if (!active) return;

        if (!isSupportedPublicSnapshot(result.snapshot)) {
          setState({
            status: "unavailable",
            snapshot: null,
          });

          return;
        }

        setState({
          status: "success",
          snapshot: result.snapshot,
        });
      })
      .catch(error => {
        if (!active) return;

        setState({
          status: error.status === 404
            ? "unavailable"
            : "error",

          snapshot: null,
        });
      });

    return () => {
      active = false;
    };
  }, [routeKey, revision]);

  const title = state.snapshot?.title;

  useEffect(() => {
    const previousTitle = document.title;

    document.title = title
      ? `${title} | Portfolio`
      : "Portfolio";

    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  if (state.status === "loading") {
    return (
      <main className="ppr-message" role="status">
        Loading Portfolio...
      </main>
    );
  }

  if (state.status === "unavailable") {
    return (
      <PublicMessage
        title="Portfolio unavailable"
        description="This Portfolio is not currently available."
      />
    );
  }

  if (state.status === "error") {
    return (
      <PublicMessage
        title="Unable to load Portfolio"
        description="Please try again in a moment."
      >
        <button
          type="button"
          onClick={() => {
            setState({
              status: "loading",
              snapshot: null,
            });

            setRevision(value => value + 1);
          }}
        >
          Try again
        </button>
      </PublicMessage>
    );
  }

  const style = getPublicPortfolioStyle(
    state.snapshot.style,
  );

  const projects = state.snapshot.sections.some(section => section.sectionKey === "projects" && section.isVisible === true) ? state.snapshot.projects || [] : [];
  const matches = projects.filter(project => project.projectKey === projectKey);
  if (projectKey && matches.length !== 1) return <PublicMessage title="Project unavailable" description="This project is not currently available." />;
  return (
    <main className={`ppr-page ppr-${style}`}>
      <div className="ppr-container">
        {projectKey ? <PublicProjectDetails project={matches[0]} routeKey={routeKey} /> : <>
          <PortfolioSnapshotPreview snapshot={state.snapshot} routeKey={routeKey} />
        </>}

        <footer className="ppr-footer">
          <Link to="/">Portfolio Platform</Link>
        </footer>
      </div>
    </main>
  );
}

export default function PortfolioPublicRoute({
  provider,
}) {
  const { portfolioSlug, projectKey } = useParams();

  const routeKey = normalizePublicPortfolioRoute(
    provider
      ? `${provider}/${portfolioSlug || ""}`
      : portfolioSlug,
  );

  if (!routeKey || (projectKey && !/^[a-f0-9]{64}$/.test(projectKey)) || !PUBLIC_PORTFOLIO_ENABLED) {
    return (
      <PublicMessage
        title="Portfolio unavailable"
        description="This Portfolio is not currently available."
      />
    );
  }

  return (
    <PublishedPortfolio
      key={routeKey}
      routeKey={routeKey}
      projectKey={projectKey}
    />
  );
}
