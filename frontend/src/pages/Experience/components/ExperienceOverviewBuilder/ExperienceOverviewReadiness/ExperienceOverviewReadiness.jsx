import "./ExperienceOverviewReadiness.css";

function ExperienceOverviewReadiness({ readiness }) {
  const {
    level = "basic",
    label = "Basic",
    description = "",
    score = 0,
    maximumScore = 11,
    details = [],
  } = readiness || {};

  const percentage = Math.round((score / maximumScore) * 100);

  return (
    <section className="experience-overview-readiness">
      <header>
        <div>
          <span>Generation Context</span>

          <h4>Overview Readiness</h4>
        </div>

        <span
          className={`experience-overview-readiness-badge experience-overview-readiness-badge--${level}`}
        >
          {label}
        </span>
      </header>

      <p>{description}</p>

      <div className="experience-overview-readiness-progress">
        <span
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <div className="experience-overview-readiness-items">
        {details.map((detail) => (
          <article
            key={detail.id}
            className={
              detail.complete
                ? "experience-overview-readiness-item--complete"
                : ""
            }
          >
            <span aria-hidden="true">{detail.complete ? "✓" : "○"}</span>

            <div>
              <strong>{detail.label}</strong>

              <small>{detail.value}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ExperienceOverviewReadiness;
