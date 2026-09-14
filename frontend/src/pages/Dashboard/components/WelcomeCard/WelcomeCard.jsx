import { useState } from "react";
import { Link } from "react-router-dom";

import "./WelcomeCard.css";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getGreeting() {
  const currentHour = new Date().getHours();

  if (currentHour < 12) {
    return "Good morning";
  }

  if (currentHour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getCurrentDate() {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  } catch {
    return "";
  }
}

/*
 * =========================================
 * Welcome Card
 * =========================================
 */

function WelcomeCard({
  firstName = "",
  fullName = "",
  initials = "",
  professionalTitle = "",
  location = "",
  profileImageUrl = "",
  isProfileComplete = false,
}) {
  const [hasImageError, setHasImageError] = useState(false);

  const displayName =
    getText(firstName) || getText(fullName).split(/\s+/)[0] || "there";

  const avatarLabel =
    getText(initials) || getText(displayName).slice(0, 2).toUpperCase() || "JP";

  const shouldShowImage = Boolean(getText(profileImageUrl)) && !hasImageError;

  const currentDate = getCurrentDate();

  return (
    <section className="welcome-card">
      <div className="welcome-card-decoration" aria-hidden="true" />

      <div className="welcome-card-content">
        <div className="welcome-card-introduction">
          <span className="welcome-eyebrow">Professional Dashboard</span>

          <h1>
            {getGreeting()}, <strong>{displayName}.</strong>
          </h1>

          <p>
            Manage your professional identity, career records, projects,
            résumés, and public portfolio from one connected workspace.
          </p>
        </div>

        <div className="welcome-card-profile">
          {professionalTitle && (
            <span>
              <small>Primary Role</small>
              <strong>{professionalTitle}</strong>
            </span>
          )}

          {location && (
            <span>
              <small>Location</small>
              <strong>{location}</strong>
            </span>
          )}

          <span>
            <small>Profile Status</small>

            <strong
              className={
                isProfileComplete
                  ? "welcome-card-status--complete"
                  : "welcome-card-status--progress"
              }
            >
              {isProfileComplete ? "Portfolio Ready" : "In Progress"}
            </strong>
          </span>
        </div>

        <div className="welcome-card-actions">
          <Link to="/profile">Review Profile</Link>

          <Link to="/portfolio" className="welcome-card-primary-action">
            Manage Portfolio
          </Link>
        </div>
      </div>

      <aside className="welcome-card-aside">
        <div
          className={`welcome-avatar ${
            shouldShowImage ? "welcome-avatar--has-image" : ""
          }`}
          aria-label={`${displayName}'s profile`}
        >
          {shouldShowImage ? (
            <img
              src={profileImageUrl}
              alt=""
              onError={() => setHasImageError(true)}
            />
          ) : (
            <span>{avatarLabel}</span>
          )}
        </div>

        {currentDate && <time>{currentDate}</time>}

        <small>
          {isProfileComplete
            ? "Your professional information is ready to present."
            : "Continue building your professional presence."}
        </small>
      </aside>
    </section>
  );
}

export default WelcomeCard;
