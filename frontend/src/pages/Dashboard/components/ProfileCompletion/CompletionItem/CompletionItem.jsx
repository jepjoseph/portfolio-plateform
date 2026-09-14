import { Link } from "react-router-dom";

import "./CompletionItem.css";

/*
 * =========================================
 * Completion Item
 * =========================================
 */

function CompletionItem({
  label = "",
  description = "",
  href = "",
  completed = false,
}) {
  const className = [
    "completion-item",
    completed ? "completion-item--completed" : "completion-item--remaining",
    href ? "completion-item--interactive" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="completion-item-status" aria-hidden="true">
        {completed ? "✓" : "○"}
      </span>

      <span className="completion-item-content">
        <strong>{label}</strong>

        {description && <small>{description}</small>}
      </span>

      {href && (
        <span className="completion-item-arrow" aria-hidden="true">
          →
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        className={className}
        aria-label={`${completed ? "Completed" : "Incomplete"}: ${label}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export default CompletionItem;
