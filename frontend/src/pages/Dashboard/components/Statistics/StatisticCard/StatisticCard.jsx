import { Link } from "react-router-dom";

import "./StatisticCard.css";

/*
 * =========================================
 * Statistic Card
 * =========================================
 */

function StatisticCard({
  label = "",
  value = 0,
  icon = "•",
  description = "",
  status = "",
  href = "",
  tone = "default",
  isLoading = false,
}) {
  const className = [
    "statistic-card",
    `statistic-card--${tone}`,
    href ? "statistic-card--interactive" : "",
    isLoading ? "statistic-card--loading" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="statistic-card-icon" aria-hidden="true">
        {isLoading ? <span /> : icon}
      </div>

      <div className="statistic-card-content">
        <span className="statistic-card-label">{label}</span>

        <strong className="statistic-card-value">
          {isLoading ? "—" : value}
        </strong>

        {description && (
          <small className="statistic-card-description">{description}</small>
        )}
      </div>

      <div className="statistic-card-aside">
        {status && <span className="statistic-card-status">{status}</span>}

        {href && (
          <span className="statistic-card-arrow" aria-hidden="true">
            →
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        className={className}
        aria-label={`View ${label}: ${value}`}
      >
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}

export default StatisticCard;
