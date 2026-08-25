import "./Statistics.css";

function Statistics({ statistics }) {
  return (
    <section className="dashboard-statistics">
      {statistics.map((stat) => (
        <article className="dashboard-stat-card" key={stat.id}>
          <div className="stat-icon">{stat.icon}</div>

          <div className="stat-content">
            <span className="stat-label">{stat.label}</span>

            <strong className="stat-value">{stat.value}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}

export default Statistics;
