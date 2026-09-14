import { Link } from "react-router-dom";

import "./QuickActions.css";

/*
 * =========================================
 * Quick Action Item
 * =========================================
 */

function QuickActionItem({ action, disabled = false }) {
  const {
    id,
    label = "Open",
    description = "",
    icon = "→",
    path = "",
    state,
    badge = "",
    tone = "default",
    onClick,
  } = action;

  const isDisabled = disabled || action.disabled === true;

  const className = [
    "quick-action",
    `quick-action--${tone}`,
    isDisabled ? "quick-action--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="quick-action-icon" aria-hidden="true">
        {icon}
      </span>

      <span className="quick-action-content">
        <strong>{label}</strong>

        {description && <small>{description}</small>}
      </span>

      <span className="quick-action-aside">
        {badge && <small className="quick-action-badge">{badge}</small>}

        <span aria-hidden="true">→</span>
      </span>
    </>
  );

  if (path && !isDisabled) {
    return (
      <Link
        key={id}
        to={path}
        state={state}
        className={className}
        aria-label={label}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      key={id}
      type="button"
      className={className}
      onClick={onClick}
      disabled={isDisabled || typeof onClick !== "function"}
    >
      {content}
    </button>
  );
}

/*
 * =========================================
 * Quick Actions
 * =========================================
 */

function QuickActions({ actions = [], isLoading = false }) {
  const collection = Array.isArray(actions)
    ? actions.filter((action) => action?.id)
    : [];

  return (
    <article className="quick-actions dashboard-card">
      <header className="dashboard-card-header">
        <div>
          <span className="dashboard-card-eyebrow">Platform Shortcuts</span>

          <h3>Quick Actions</h3>
        </div>

        <span className="quick-actions-count">
          {isLoading ? "—" : collection.length}
        </span>
      </header>

      <p className="quick-actions-description">
        Quickly update the professional records used throughout your résumé and
        portfolio.
      </p>

      {isLoading ? (
        <div className="quick-actions-state" role="status">
          Loading actions…
        </div>
      ) : collection.length > 0 ? (
        <div className="quick-actions-grid">
          {collection.map((action) => (
            <QuickActionItem key={action.id} action={action} />
          ))}
        </div>
      ) : (
        <div className="quick-actions-state">
          No quick actions are available.
        </div>
      )}
    </article>
  );
}

export default QuickActions;
