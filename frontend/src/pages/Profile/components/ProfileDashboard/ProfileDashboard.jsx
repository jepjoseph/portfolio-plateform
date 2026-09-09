import "./ProfileDashboard.css";

function ProfileDashboard({ statistics, isLoading = false }) {
  const completeness = statistics?.completeness || {
    percentage: 0,
    label: "Not Started",
    description: "Add information to complete your Profile.",
  };

  const dashboardItems = [
    {
      id: "active",
      label: "Active Information",
      value: statistics?.activeItems || 0,
      description: "Available to résumés and portfolios",
    },
    {
      id: "archived",
      label: "Archived Information",
      value: statistics?.archivedItems || 0,
      description: "Preserved but unavailable for selection",
    },
    {
      id: "titles",
      label: "Professional Titles",
      value: statistics?.professionalTitles?.active || 0,
      description: "Active career identities",
    },
    {
      id: "contact",
      label: "Contact Methods",
      value:
        (statistics?.emails?.active || 0) +
        (statistics?.phones?.active || 0) +
        (statistics?.websites?.active || 0) +
        (statistics?.socialLinks?.active || 0),
      description: "Active ways to contact or find you",
    },
  ];

  if (isLoading) {
    return (
      <section
        className="profile-dashboard profile-dashboard--loading"
        aria-label="Profile statistics"
        aria-busy="true"
      >
        {dashboardItems.map((item) => (
          <article key={item.id}>
            <span className="profile-dashboard-skeleton" />
            <span className="profile-dashboard-skeleton profile-dashboard-skeleton--short" />
          </article>
        ))}
      </section>
    );
  }

  return (
    <section className="profile-dashboard" aria-label="Profile statistics">
      <article className="profile-dashboard-completeness">
        <header>
          <div>
            <span>Profile Readiness</span>
            <strong>{completeness.label}</strong>
          </div>

          <strong>{completeness.percentage}%</strong>
        </header>

        <div
          className="profile-dashboard-progress"
          role="progressbar"
          aria-label="Profile completeness"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={completeness.percentage}
        >
          <span
            style={{
              width: `${Math.min(100, Math.max(0, completeness.percentage))}%`,
            }}
          />
        </div>

        <p>{completeness.description}</p>
      </article>

      {dashboardItems.map((item) => (
        <article key={item.id} className="profile-dashboard-statistic">
          <span>{item.label}</span>

          <strong>{item.value}</strong>

          <p>{item.description}</p>
        </article>
      ))}
    </section>
  );
}

export default ProfileDashboard;
