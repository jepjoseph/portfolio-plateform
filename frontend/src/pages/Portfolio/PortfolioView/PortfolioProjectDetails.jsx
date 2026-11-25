import {
  getProjectCategoryLabel,
  getProjectLifecycleStatusLabel,
  getProjectOwnershipLabel,
} from "../../../config/projectConfig.js";

import {
  getProjectDateRange,
} from "../../../services/Project/projectUtils.js";

import {
  PortfolioProjectMedia,
  PortfolioProjectDocuments,
} from "./PortfolioProjectAssets.jsx";

import "./PortfolioProjectDetails.css";

function TextSection({ title, entries = [] }) {
  const visible = entries.filter(
    ([, value]) => typeof value === "string" && value.trim()
  );

  if (!visible.length) return null;

  return (
    <section className="portfolio-view-section ppd-section">
      <header className="portfolio-view-section-header">
        <h2>{title}</h2>
      </header>

      {visible.map(([label, value]) => (
        <div className="ppd-text" key={label}>
          <h3>{label}</h3>
          <p>{value}</p>
        </div>
      ))}
    </section>
  );
}

function ListSection({ title, items = [] }) {
  const values = items
    .map(item => typeof item === "string"
      ? item
      : item?.text || item?.name || "")
    .filter(Boolean);

  if (!values.length) return null;

  return (
    <section className="portfolio-view-section ppd-section">
      <header className="portfolio-view-section-header">
        <h2>{title}</h2>
      </header>

      <ul className="ppd-list">
        {values.map((value, index) => (
          <li key={index}>{value}</li>
        ))}
      </ul>
    </section>
  );
}

function safeExternalUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

export default function PortfolioProjectDetails({
  project,
  onBack,
}) {
  const problem = project.problem || {};
  const solution = project.solution || {};
  const results = project.results || {};
  const presentation = project.presentation || {};

  const links = [
    ["View Source Code", project.links?.repositoryUrl],
    ["Visit Live Website", project.links?.liveUrl],
    ["External Case Study", project.links?.caseStudyUrl],
  ].map(([label, value]) => [
    label, safeExternalUrl(value)
  ]).filter(([, url]) => url);

  return (
    <main className="portfolio-view-main ppd-page">
      <div className="ppd-toolbar">
        <button
          type="button"
          className="ppd-button"
          onClick={onBack}
          autoFocus
        >
          Back to Portfolio
        </button>

        <span>Selected Work / Project Details</span>
      </div>

      <section className="portfolio-view-section ppd-hero">
        <span className="ppd-eyebrow">
          {getProjectCategoryLabel(project.category)}
        </span>

        <h1>{project.title || "Untitled Project"}</h1>

        {presentation.shortSummary && (
          <p>{presentation.shortSummary}</p>
        )}

        <div className="ppd-metadata">
          {[
            ["Status", getProjectLifecycleStatusLabel(project.lifecycleStatus)],
            ["Role", project.role],
            ["Ownership", project.ownership
              ? getProjectOwnershipLabel(project.ownership) : ""],
            ["Organization", project.organization?.name],
            ["Timeline", project.dates
              ? getProjectDateRange(project) : ""],
          ].filter(([, value]) => value).map(([label, value]) => (
            <div key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <PortfolioProjectMedia project={project} />

      <TextSection title="Project Overview" entries={[
        ["Overview", solution.overview],
        ["Case Study", presentation.caseStudy],
      ]} />

      <TextSection title="Problem Statement" entries={[
        ["Problem", problem.statement],
        ["Target Audience", problem.targetAudience],
        ["Context", problem.context],
        ["Importance", problem.importance],
      ]} />

      <ListSection title="Objectives" items={problem.objectives} />
      <ListSection title="Constraints" items={problem.constraints} />

      <TextSection title="Solution and Architecture" entries={[
        ["Approach", solution.approach],
        ["System Architecture", solution.architecture],
      ]} />

      <ListSection title="Project Features" items={solution.features} />
      <ListSection title="My Contributions" items={solution.contributions} />

      <ListSection
        title="Technologies and Tools"
        items={project.technologies}
      />

      <TextSection title="Results and Impact" entries={[
        ["Outcome", results.outcome],
        ["Problems Solved", results.problemsSolved],
        ["Impact", results.impact],
        ["Beneficiaries", results.beneficiariesAffected],
        ["Lessons Learned", results.lessonsLearned],
        ["Future Improvements", results.futureImprovements],
      ]} />

      <ListSection title="Metrics" items={
        (results.metrics || []).map(metric =>
          [metric.label, metric.value].filter(Boolean).join(": ")
        )
      } />

      <ListSection title="Awards" items={project.awards} />

      <PortfolioProjectDocuments project={project} />

      {links.length > 0 && (
        <section className="portfolio-view-section ppd-section">
          <header className="portfolio-view-section-header">
            <h2>Project Resources</h2>
          </header>

          <div className="ppd-resources">
            {links.map(([label, url]) => (
              <a
                key={label}
                className="ppd-button"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {label}
              </a>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        className="ppd-button"
        onClick={onBack}
      >
        Back to Portfolio
      </button>
    </main>
  );
}