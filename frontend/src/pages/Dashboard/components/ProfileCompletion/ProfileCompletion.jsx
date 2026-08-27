import CompletionItem from "./CompletionItem/CompletionItem";

import "./ProfileCompletion.css";

function ProfileCompletion({
  percentage,
  completedItems = [],
  remainingItems = [],
}) {
  const completedCount = completedItems.length;
  const remainingCount = remainingItems.length;

  const totalItems = completedCount + remainingCount;

  const calculatedPercentage =
    totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const completionPercentage =
    typeof percentage === "number" ? percentage : calculatedPercentage;

  return (
    <article className="profile-completion dashboard-card">
      {/* =========================================
          Header
          ========================================= */}

      <div className="dashboard-card-header">
        <div>
          <span className="dashboard-card-eyebrow">Profile</span>

          <h3>Profile Completion</h3>
        </div>

        <span className="completion-percentage">{completionPercentage}%</span>
      </div>

      {/* =========================================
          Progress
          ========================================= */}

      <div
        className="completion-progress-track"
        role="progressbar"
        aria-valuenow={completionPercentage}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Profile completion"
      >
        <div
          className="completion-progress-bar"
          style={{
            width: `${completionPercentage}%`,
          }}
        />
      </div>

      {/* =========================================
          Description
          ========================================= */}

      <p className="dashboard-card-description">
        Complete your profile to make your portfolio more attractive to visitors
        and employers.
      </p>

      {/* =========================================
          Completion Items
          ========================================= */}

      <div className="completion-items">
        {completedItems.map((item) => (
          <CompletionItem key={item} label={item} completed />
        ))}

        {remainingItems.map((item) => (
          <CompletionItem key={item} label={item} completed={false} />
        ))}
      </div>
    </article>
  );
}

export default ProfileCompletion;
