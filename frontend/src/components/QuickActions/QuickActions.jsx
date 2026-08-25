import "./QuickActions.css";

function QuickActions({ actions }) {
  return (
    <article className="quick-actions dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <span className="dashboard-card-eyebrow">Shortcuts</span>

          <h3>Quick Actions</h3>
        </div>
      </div>

      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="quick-action"
            onClick={action.onClick}
          >
            <span className="quick-action-icon">{action.icon}</span>

            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

export default QuickActions;
