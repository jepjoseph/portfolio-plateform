import "./TrainingDashboard.css";

function TrainingDashboard({ statistics = {}, isLoading = false }) {
  const cards = [
    {
      id: "active",
      label: "Active Records",
      value: statistics.active || 0,
      description: "Available for normal selection",
    },
    {
      id: "in-progress",
      label: "In Progress",
      value: statistics.inProgress || 0,
      description: "Training currently underway",
    },
    {
      id: "completed",
      label: "Completed",
      value: statistics.completed || 0,
      description: "Successfully completed training",
    },
    {
      id: "credentials",
      label: "With Credentials",
      value: statistics.withCredentials || 0,
      description: "Includes credential evidence",
    },
    {
      id: "skills",
      label: "With Skills",
      value: statistics.withSkills || 0,
      description: "Connected to the Skill Library",
    },
    {
      id: "documents",
      label: "With Documents",
      value: statistics.withDocuments || 0,
      description: "Contains supporting files",
    },
  ];

  return (
    <section
      className="training-dashboard"
      aria-label="Training statistics"
      aria-busy={isLoading}
    >
      {cards.map((card) => (
        <article key={card.id}>
          <span>{card.label}</span>

          <strong>{isLoading ? "—" : card.value}</strong>

          <p>{card.description}</p>
        </article>
      ))}
    </section>
  );
}

export default TrainingDashboard;
