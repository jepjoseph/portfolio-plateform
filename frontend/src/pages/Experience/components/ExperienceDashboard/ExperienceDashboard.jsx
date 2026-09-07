import "./ExperienceDashboard.css";

function ExperienceDashboard({ statistics = {}, isLoading = false }) {
  const {
    total = 0,
    active = 0,
    archived = 0,
    current = 0,
    previous = 0,
    withAchievements = 0,
  } = statistics;

  const cards = [
    {
      id: "total",
      label: "Total Experiences",
      value: total,
      description: "All professional records",
      icon: "✦",
      tone: "primary",
    },
    {
      id: "current",
      label: "Current Positions",
      value: current,
      description: "Positions currently held",
      icon: "●",
      tone: "success",
    },
    {
      id: "previous",
      label: "Previous Positions",
      value: previous,
      description: "Completed professional roles",
      icon: "◷",
      tone: "neutral",
    },
    {
      id: "achievements",
      label: "With Achievements",
      value: withAchievements,
      description: "Records with documented impact",
      icon: "★",
      tone: "achievement",
    },
  ];

  return (
    <section
      className="experience-dashboard"
      aria-labelledby="experience-dashboard-title"
      aria-busy={isLoading}
    >
      <header className="experience-dashboard-header">
        <div>
          <span>Experience Overview</span>

          <h2 id="experience-dashboard-title">Professional Record Summary</h2>
        </div>

        <div className="experience-dashboard-status">
          <span>
            <strong>{active}</strong> active
          </span>

          <span>
            <strong>{archived}</strong> archived
          </span>
        </div>
      </header>

      <div className="experience-dashboard-grid">
        {cards.map((card) => (
          <article
            key={card.id}
            className={`experience-dashboard-card experience-dashboard-card--${card.tone}`}
          >
            <div className="experience-dashboard-card-icon" aria-hidden="true">
              {card.icon}
            </div>

            <div className="experience-dashboard-card-content">
              <span>{card.label}</span>

              <strong>{isLoading ? "—" : card.value}</strong>

              <small>{card.description}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ExperienceDashboard;
