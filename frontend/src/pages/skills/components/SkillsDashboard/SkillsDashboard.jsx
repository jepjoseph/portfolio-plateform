import "./SkillsDashboard.css";

function SkillsDashboard({ statistics = {}, isLoading = false }) {
  const {
    total = 0,
    active = 0,
    archived = 0,
    technical = 0,
    professional = 0,
    languages = 0,
    tools = 0,
    aiSuggested = 0,
    withDescriptions = 0,
    withProficiency = 0,
    categoryCount = 0,
  } = statistics;

  const cards = [
    {
      id: "total",
      label: "Total Skills",
      value: total,
      description: "All Skill Library records",
      icon: "✦",
      tone: "primary",
    },
    {
      id: "technical",
      label: "Technical Skills",
      value: technical,
      description: "Technical capabilities",
      icon: "⌘",
      tone: "technical",
    },
    {
      id: "tools",
      label: "Tools and Platforms",
      value: tools,
      description: "Software, systems, and equipment",
      icon: "◇",
      tone: "tools",
    },
    {
      id: "categories",
      label: "Categories Used",
      value: categoryCount,
      description: "Areas represented in the library",
      icon: "▦",
      tone: "category",
    },
  ];

  const details = [
    {
      id: "professional",
      label: "Professional skills",
      value: professional,
    },
    {
      id: "languages",
      label: "Languages",
      value: languages,
    },
    {
      id: "descriptions",
      label: "With descriptions",
      value: withDescriptions,
    },
    {
      id: "proficiency",
      label: "With proficiency",
      value: withProficiency,
    },
    {
      id: "ai",
      label: "AI suggested",
      value: aiSuggested,
    },
  ];

  return (
    <section
      className="skills-dashboard"
      aria-labelledby="skills-dashboard-title"
      aria-busy={isLoading}
    >
      <header className="skills-dashboard-header">
        <div>
          <span>Skills Overview</span>

          <h2 id="skills-dashboard-title">Professional Capability Summary</h2>

          <p>
            Review the coverage and completeness of your reusable Skill Library.
          </p>
        </div>

        <div className="skills-dashboard-status">
          <span>
            <strong>{isLoading ? "—" : active}</strong> active
          </span>

          <span>
            <strong>{isLoading ? "—" : archived}</strong> archived
          </span>
        </div>
      </header>

      <div className="skills-dashboard-grid">
        {cards.map((card) => (
          <article
            key={card.id}
            className={`skills-dashboard-card skills-dashboard-card--${card.tone}`}
          >
            <div className="skills-dashboard-card-icon" aria-hidden="true">
              {card.icon}
            </div>

            <div className="skills-dashboard-card-content">
              <span>{card.label}</span>

              <strong>{isLoading ? "—" : card.value}</strong>

              <small>{card.description}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="skills-dashboard-details">
        {details.map((detail) => (
          <div key={detail.id}>
            <span>{detail.label}</span>

            <strong>{isLoading ? "—" : detail.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SkillsDashboard;
