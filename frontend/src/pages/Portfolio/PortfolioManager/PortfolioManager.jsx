import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  PortfolioDataProvider,
  usePortfolioData,
} from "../../../context/PortfolioDataContext.jsx";

import { portfolioBackendService as api } from "../../../services/Portfolio/portfolioBackendService.js";
import { isSupportedPublicSnapshot } from "../../../services/Portfolio/portfolioPublicRouteUtils.js";

import PortfolioLinkActions from "./PortfolioLinkActions.jsx";
import PortfolioSectionBuilder from "./PortfolioSectionBuilder.jsx";
import "./PortfolioManager.css";

const PURPOSES = [
  ["professional", "Professional"],
  ["student", "Student"],
  ["researcher", "Researcher"],
  ["creative", "Creative"],
  ["developer_engineer", "Developer / Engineer"],
  ["entrepreneur", "Entrepreneur"],
  ["educator", "Educator"],
  ["freelancer", "Freelancer"],
];

const FIELDS = [
  ["technology_engineering", "Technology / Engineering"],
  ["corporate_business", "Corporate / Business"],
  ["academic_research", "Academic / Research"],
  ["art_design", "Art / Design"],
  ["architecture_product_design", "Architecture / Product Design"],
  ["healthcare_science", "Healthcare / Science"],
];

const STYLES = [
  ["technical", "Technical"],
  ["professional", "Professional"],
  ["modern", "Modern"],
  ["academic", "Academic"],
];

function optionLabel(options, value) {
  return options.find(item => item[0] === value)?.[1]
    || value;
}

const PUBLIC_ENABLED = import.meta.env.VITE_PORTFOLIO_PUBLIC_ENABLED === "true";

function PortfolioStatus({ portfolioId, revision }) {
  const [status, setStatus] = useState("checking");
  const [routeKey, setRouteKey] = useState("");
  useEffect(() => {
    let active = true;
    const update = value => { if (active) setStatus(value); };
    async function check() {
      update("checking");
      if (active) setRouteKey("");
      try {
        const result = await api.getPublication(portfolioId);
        if (!active) return;
        const route = typeof result.primaryRoute === "string" ? result.primaryRoute : "";
        setRouteKey(route);
        if (!PUBLIC_ENABLED || result.publication?.isPublished !== true || !route) {
          update("offline"); return;
        }
        const publicResult = await api.getPublicPortfolio(result.primaryRoute);
        update(isSupportedPublicSnapshot(publicResult.snapshot) ? "online" : "offline");
      } catch (error) {
        update(error.status === 404 ? "offline" : "unknown");
      }
    }
    void check();
    return () => { active = false; };
  }, [portfolioId, revision]);
  return <><p role="status" className={status === "online" ? "pm-online" : status === "offline" ? "pm-offline" : undefined}>
    {status === "online" ? "\u2713 Portfolio online" : status === "offline" ? "\u2715 Portfolio offline" : status === "checking" ? "Checking publication..." : "Publication status unavailable"}
  </p>
    {routeKey && <PortfolioLinkActions key={routeKey} routeKey={routeKey} />}
    {!routeKey && status === "offline" && <small>No reserved URL</small>}
  </>;
}

function PortfolioManagerContent() {
  const { portfolios, isLoading, isSaving, error, refreshPortfolios, deletePortfolio } = usePortfolioData();
  const [selected, setSelected] = useState(null);
  const [activity, setActivity] = useState({ dirty: false, busy: false });
  const busy = isLoading || isSaving || activity.busy;
  const canLeave = () => !busy && (!activity.dirty || window.confirm("Discard unsaved selection changes?"));
  const guard = event => { if (!canLeave()) event.preventDefault(); };
  return <main className="pm-page">
    <header className="pm-header"><div><h1>My Portfolios</h1><p>Create and manage your portfolios.</p></div><Link className="pm-button pm-primary" to="/portfolio/manage/create" onClick={guard}>Create Portfolio</Link></header>
    {error && <p role="alert" className="pm-error">{error.message}</p>}
    <section className="pm-panel"><div className="pm-section-header"><h2>Saved Portfolios ({portfolios.length})</h2><button className="pm-button" disabled={busy} onClick={() => { if (canLeave()) { setSelected(null); setActivity({dirty:false,busy:false}); refreshPortfolios().catch(() => {}); } }}>Refresh</button></div>
    {isLoading ? <p>Loading Portfolios...</p> : !portfolios.length ? <p>{error ? "Unable to load portfolios." : "No portfolios created yet. Create your first portfolio."}</p> : <div className="pm-portfolio-grid">{portfolios.map(p => <article className="pm-portfolio-card" key={p.id}>
      <h3>{p.title}</h3><PortfolioStatus portfolioId={p.id} revision={p.rowVersion} /><dl><dt>Purpose</dt><dd>{optionLabel(PURPOSES,p.purpose)}</dd><dt>Field</dt><dd>{optionLabel(FIELDS,p.professionalField)}</dd><dt>Style</dt><dd>{optionLabel(STYLES,p.style)}</dd></dl>
      <div className="pm-actions"><button className="pm-button" disabled={busy} onClick={() => { if (canLeave()) { setSelected(selected === p.id ? null : p.id); setActivity({dirty:false,busy:false}); } }}>{selected === p.id ? "Close selection" : "Select"}</button><Link className="pm-button" onClick={guard} to={`/portfolio/manage/${p.id}/preview`}>Preview</Link><Link className="pm-button" onClick={guard} to={`/portfolio/manage/${p.id}/edit`}>Edit</Link><button className="pm-button pm-danger" disabled={busy} onClick={async () => { if (!canLeave() || !window.confirm(`Delete ${p.title}? Original source records will remain.`)) return; setSelected(null); setActivity({dirty:false,busy:false}); try { await deletePortfolio(p.id,p.rowVersion); } catch { /* Context displays error. */ } }}>Delete</button></div>
      {selected === p.id && <PortfolioSectionBuilder key={p.id} portfolioId={p.id} onActivityChange={setActivity} onSaved={() => refreshPortfolios().catch(() => {})} />}
    </article>)}</div>}</section>
    {!PUBLIC_ENABLED && <p>Public access is currently disabled.</p>}
  </main>;
}
export default function PortfolioManager() { return <PortfolioDataProvider><PortfolioManagerContent /></PortfolioDataProvider>; }
