import "./CertificationDashboard.css";

function CertificationDashboard({ statistics = {}, isLoading = false }) {
  const cards = [
    {
      id: "active",
      label: "Active Credentials",
      value: statistics.activeCredentials || 0,
      description: "Currently valid",
    },
    {
      id: "expired",
      label: "Expired",
      value: statistics.expiredCredentials || 0,
      description: "Renewal may be needed",
    },
    {
      id: "planned",
      label: "Planned",
      value: statistics.plannedCredentials || 0,
      description: "Future credentials",
    },
    {
      id: "documents",
      label: "Documents",
      value: statistics.withDocuments || 0,
      description: "With certificate files",
    },
    {
      id: "training",
      label: "Training Links",
      value: statistics.linkedToTraining || 0,
      description: "Connected to Training",
    },
    {
      id: "skills",
      label: "Skill Links",
      value: statistics.withSkills || 0,
      description: "With related Skills",
    },
  ];

  return (
    <section
      className="certification-dashboard"
      aria-label="Certification statistics"
      aria-busy={isLoading}
    >
      {cards.map((card) => (
        <article key={card.id}>
          <span>{card.label}</span>

          <strong>{isLoading ? "—" : card.value}</strong>

          <small>{card.description}</small>
        </article>
      ))}
    </section>
  );
}

export default CertificationDashboard;
