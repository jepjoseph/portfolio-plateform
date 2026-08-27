import "./RecentActivity.css";

function RecentActivity({ activities = [] }) {
  return (
    <article className="recent-activity dashboard-card">
      {/* =========================================
          Header
          ========================================= */}

      <div className="dashboard-card-header">
        <div>
          <span className="dashboard-card-eyebrow">Activity</span>

          <h3>Recent Activity</h3>
        </div>

        <span className="activity-count">{activities.length}</span>
      </div>

      {/* =========================================
          Activity List
          ========================================= */}

      {activities.length > 0 ? (
        <div className="activity-list">
          {activities.map((activity) => (
            <div className="activity-item" key={activity.id}>
              <div className="activity-indicator">
                <span className="activity-dot" />
              </div>

              <div className="activity-content">
                <strong>{activity.title}</strong>

                <span>{activity.description}</span>
              </div>

              <time dateTime={activity.dateTime || undefined}>
                {activity.time}
              </time>
            </div>
          ))}
        </div>
      ) : (
        <div className="activity-empty">
          <div className="activity-empty-icon">◷</div>

          <strong>No recent activity</strong>

          <span>Your portfolio activity will appear here.</span>
        </div>
      )}
    </article>
  );
}

export default RecentActivity;
