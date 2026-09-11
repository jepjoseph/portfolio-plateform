import "./EducationDashboard.css";

/*
 * =========================================
 * Dashboard Cards
 * =========================================
 */

const DASHBOARD_CARDS = [
  {
    id: "active",
    label: "Active Records",
    description: "Available for résumés and portfolios.",
    icon: "◆",
  },
  {
    id: "current",
    label: "In Progress",
    description: "Education currently being completed.",
    icon: "◉",
  },
  {
    id: "completed",
    label: "Completed",
    description: "Completed programs and credentials.",
    icon: "✓",
  },
  {
    id: "withHonors",
    label: "With Honors",
    description: "Records containing academic honors.",
    icon: "★",
  },
  {
    id: "withSkills",
    label: "With Skills",
    description: "Records connected to the Skill Library.",
    icon: "✦",
  },
  {
    id: "archived",
    label: "Archived",
    description: "Preserved outside normal selection.",
    icon: "□",
  },
];

/*
 * =========================================
 * Dashboard
 * =========================================
 */

function EducationDashboard({ statistics = {}, isLoading = false }) {
  return (
    <section
      className="education-dashboard"
      aria-label="Education statistics"
      aria-busy={isLoading}
    >
      {DASHBOARD_CARDS.map((card) => (
        <article
          key={card.id}
          className={`education-dashboard-card education-dashboard-card--${card.id}`}
        >
          <div className="education-dashboard-icon" aria-hidden="true">
            {card.icon}
          </div>

          <div className="education-dashboard-content">
            <span>{card.label}</span>

            <strong>
              {isLoading ? "—" : Number(statistics[card.id]) || 0}
            </strong>

            <p>{card.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

export default EducationDashboard;
