import "./ProfileCompletion.css";

function ProfileCompletion({ percentage, completedItems, remainingItems }) {
  return (
    <article className="profile-completion dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <span className="dashboard-card-eyebrow">Profile</span>

          <h3>Profile Completion</h3>
        </div>

        <span className="completion-percentage">{percentage}%</span>
      </div>

      <div className="completion-bar">
        <div
          className="completion-progress"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="dashboard-card-description">
        Complete your profile to make your portfolio more attractive to visitors
        and employers.
      </p>

      <div className="completion-items">
        {completedItems.map((item) => (
          <div className="completion-item completed" key={item}>
            <span>✓</span>
            <span>{item}</span>
          </div>
        ))}

        {remainingItems.map((item) => (
          <div className="completion-item" key={item}>
            <span>○</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default ProfileCompletion;
