import { useNavigate } from "react-router-dom";

import "./QuickActions.css";

function QuickActions({ actions = [] }) {
  const navigate = useNavigate();

  const handleAction = (action) => {
    if (action.path) {
      navigate(action.path);
      return;
    }

    if (typeof action.onClick === "function") {
      action.onClick();
    }
  };

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
            onClick={() => handleAction(action)}
          >
            <span className="quick-action-icon" aria-hidden="true">
              {action.icon}
            </span>

            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

export default QuickActions;
