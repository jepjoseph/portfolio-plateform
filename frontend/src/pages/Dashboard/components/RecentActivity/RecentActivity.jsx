import { Link } from "react-router-dom";

import "./RecentActivity.css";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getTimestamp(value) {
  const timestamp = new Date(value || "").getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatRelativeTime(value) {
  const timestamp = getTimestamp(value);

  if (!timestamp) {
    return "Date unavailable";
  }

  const difference = Date.now() - timestamp;

  if (difference < 0) {
    return "Recently";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (difference < minute) {
    return "Just now";
  }

  if (difference < hour) {
    const minutes = Math.floor(difference / minute);

    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  if (difference < day) {
    const hours = Math.floor(difference / hour);

    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  if (difference < week) {
    const days = Math.floor(difference / day);

    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(timestamp));
  } catch {
    return "Recently";
  }
}

function formatExactDate(value) {
  const timestamp = getTimestamp(value);

  if (!timestamp) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

/*
 * =========================================
 * Activity Item
 * =========================================
 */

function ActivityItem({ activity }) {
  const {
    title = "Professional record updated",
    description = "",
    timestamp = "",
    dateTime = "",
    time = "",
    path = "",
    icon = "•",
    type = "default",
  } = activity;

  const activityDate = timestamp || dateTime;

  const displayedTime =
    time || formatRelativeTime(activityDate);

  const exactDate = formatExactDate(activityDate);

  const className = [
    "activity-item",
    `activity-item--${type}`,
    path ? "activity-item--interactive" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="activity-icon" aria-hidden="true">
        {icon}
      </span>

      <span className="activity-content">
        <strong>{title}</strong>

        {description && <span>{description}</span>}
      </span>

      <time
        dateTime={activityDate || undefined}
        title={exactDate || undefined}
      >
        {displayedTime}
      </time>

      {path && (
        <span className="activity-arrow" aria-hidden="true">
          →
        </span>
      )}
    </>
  );

  if (path) {
    return (
      <Link to={path} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

/*
 * =========================================
 * Recent Activity
 * =========================================
 */

function RecentActivity({
  activities = [],
  maximumItems = 7,
  isLoading = false,
}) {
  const collection = (
    Array.isArray(activities) ? activities : []
  )
    .filter((activity) => activity?.id)
    .sort(
      (firstActivity, secondActivity) =>
        getTimestamp(
          secondActivity.timestamp ||
            secondActivity.dateTime,
        ) -
        getTimestamp(
          firstActivity.timestamp ||
            firstActivity.dateTime,
        ),
    );

  const displayedActivities = collection.slice(
    0,
    Math.max(1, maximumItems),
  );

  return (
    <article className="recent-activity dashboard-card">
      <header className="dashboard-card-header">
        <div>
          <span className="dashboard-card-eyebrow">
            Platform History
          </span>

          <h3>Recent Activity</h3>
        </div>

        <span className="activity-count">
          {isLoading ? "—" : displayedActivities.length}
        </span>
      </header>

      <p className="recent-activity-description">
        Your latest updates across professional records, Projects, résumés, and
        portfolio content.
      </p>

      {isLoading ? (
        <div
          className="activity-state"
          role="status"
        >
          Loading recent activity…
        </div>
      ) : displayedActivities.length > 0 ? (
        <div
          className="activity-list"
          role="list"
          aria-label="Recent platform activity"
        >
          {displayedActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
            />
          ))}
        </div>
      ) : (
        <div className="activity-empty">
          <div
            className="activity-empty-icon"
            aria-hidden="true"
          >
            ◷
          </div>

          <strong>No recent activity</strong>

          <span>
            Create or update a professional record and the activity will appear
            here.
          </span>
        </div>
      )}

      {collection.length > displayedActivities.length && (
        <footer className="recent-activity-footer">
          Showing the {displayedActivities.length} most recent of{" "}
          {collection.length} activities.
        </footer>
      )}
    </article>
  );
}

export default RecentActivity;