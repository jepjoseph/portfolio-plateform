import { Link } from "react-router-dom";

import CompletionItem from "./CompletionItem/CompletionItem";

import "./ProfileCompletion.css";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function normalizeCompletionItem(item, index, completed) {
  if (typeof item === "string") {
    return {
      id: `${completed ? "completed" : "remaining"}-${index}-${item}`,
      label: item,
      description: "",
      href: "",
      completed,
    };
  }

  const source = item && typeof item === "object" ? item : {};

  return {
    id: source.id || `${completed ? "completed" : "remaining"}-${index}`,

    label:
      typeof source.label === "string" && source.label.trim()
        ? source.label.trim()
        : "Professional information",

    description:
      typeof source.description === "string" ? source.description.trim() : "",

    href: typeof source.href === "string" ? source.href.trim() : "",

    completed,
  };
}

function clampPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(numericValue)));
}

/*
 * =========================================
 * Profile Completion
 * =========================================
 */

function ProfileCompletion({
  percentage,
  completedItems = [],
  remainingItems = [],
  isLoading = false,
}) {
  const normalizedCompletedItems = (
    Array.isArray(completedItems) ? completedItems : []
  ).map((item, index) => normalizeCompletionItem(item, index, true));

  const normalizedRemainingItems = (
    Array.isArray(remainingItems) ? remainingItems : []
  ).map((item, index) => normalizeCompletionItem(item, index, false));

  const completedCount = normalizedCompletedItems.length;

  const remainingCount = normalizedRemainingItems.length;

  const totalItems = completedCount + remainingCount;

  const calculatedPercentage =
    totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const completionPercentage = clampPercentage(
    typeof percentage === "number" ? percentage : calculatedPercentage,
  );

  const isComplete =
    totalItems > 0 && remainingCount === 0 && completionPercentage === 100;

  const nextRecommendedItem =
    normalizedRemainingItems.find((item) => item.href) ||
    normalizedRemainingItems[0] ||
    null;

  const allItems = [...normalizedRemainingItems, ...normalizedCompletedItems];

  return (
    <article className="profile-completion dashboard-card">
      <header className="dashboard-card-header">
        <div>
          <span className="dashboard-card-eyebrow">Professional Readiness</span>

          <h3>Profile Completion</h3>
        </div>

        <span
          className={`completion-percentage ${
            isComplete ? "completion-percentage--complete" : ""
          }`}
        >
          {isLoading ? "—" : `${completionPercentage}%`}
        </span>
      </header>

      <div
        className="completion-progress-track"
        role="progressbar"
        aria-valuenow={completionPercentage}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Professional profile completion"
      >
        <div
          className={`completion-progress-bar ${
            isComplete ? "completion-progress-bar--complete" : ""
          }`}
          style={{
            width: `${completionPercentage}%`,
          }}
        />
      </div>

      <div className="completion-summary">
        <p className="dashboard-card-description">
          {isComplete
            ? "Your essential professional information is complete and ready for portfolio presentation."
            : "Complete the remaining professional records to strengthen your portfolio and résumé content."}
        </p>

        {!isLoading && totalItems > 0 && (
          <span>
            <strong>{completedCount}</strong> of <strong>{totalItems}</strong>{" "}
            requirements complete
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="completion-loading" role="status">
          Calculating profile completion…
        </div>
      ) : allItems.length > 0 ? (
        <div className="completion-items">
          {allItems.map((item) => (
            <CompletionItem
              key={item.id}
              label={item.label}
              description={item.description}
              href={item.href}
              completed={item.completed}
            />
          ))}
        </div>
      ) : (
        <div className="completion-empty">
          Completion requirements are not available.
        </div>
      )}

      <footer className="completion-footer">
        {isComplete ? (
          <Link to="/portfolio">
            Review Public Portfolio
            <span aria-hidden="true">→</span>
          </Link>
        ) : nextRecommendedItem?.href ? (
          <Link to={nextRecommendedItem.href}>
            Continue with {nextRecommendedItem.label}
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <Link to="/profile">
            Continue Profile Setup
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </footer>
    </article>
  );
}

export default ProfileCompletion;
