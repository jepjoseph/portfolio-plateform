import "./RecentActivity.css";

function RecentActivity({ activities }) {
  return (
    <article className="recent-activity dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <span className="dashboard-card-eyebrow">Activity</span>

          <h3>Recent Activity</h3>
        </div>
      </div>

      <div className="activity-list">
        {activities.map((activity) => (
          <div className="activity-item" key={activity.id}>
            <div className="activity-dot" />

            <div className="activity-content">
              <strong>{activity.title}</strong>

              <span>{activity.description}</span>
            </div>

            <time>{activity.time}</time>
          </div>
        ))}
      </div>
    </article>
  );
}

export default RecentActivity;
