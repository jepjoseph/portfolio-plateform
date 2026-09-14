import StatisticCard from "./StatisticCard/StatisticCard";

import "./Statistics.css";

/*
 * =========================================
 * Statistics
 * =========================================
 */

function Statistics({
  statistics = [],
  title = "Platform Overview",
  description = "A summary of your professional records across the platform.",
  isLoading = false,
}) {
  const collection = Array.isArray(statistics) ? statistics : [];

  return (
    <section
      className="statistics-section"
      aria-labelledby="dashboard-statistics-title"
    >
      <header className="statistics-header">
        <div>
          <span>Professional Records</span>

          <h2 id="dashboard-statistics-title">{title}</h2>

          {description && <p>{description}</p>}
        </div>

        <strong>
          {isLoading
            ? "Loading"
            : `${collection.length} ${
                collection.length === 1 ? "Category" : "Categories"
              }`}
        </strong>
      </header>

      {collection.length > 0 ? (
        <div className="statistics">
          {collection.map((statistic) => (
            <StatisticCard
              key={statistic.id}
              label={statistic.label}
              value={statistic.value}
              icon={statistic.icon}
              description={statistic.description}
              status={statistic.status}
              href={statistic.href}
              tone={statistic.tone}
              isLoading={isLoading || statistic.isLoading === true}
            />
          ))}
        </div>
      ) : (
        <div className="statistics-empty">
          No platform statistics are available.
        </div>
      )}
    </section>
  );
}

export default Statistics;
