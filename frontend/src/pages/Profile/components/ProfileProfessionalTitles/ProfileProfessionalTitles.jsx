import { useId } from "react";

import ProfileProfessionalTitleItem from "./ProfileProfessionalTitleItem/ProfileProfessionalTitleItem.jsx";

import "./ProfileProfessionalTitles.css";

function ProfileProfessionalTitles({
  titles = [],
  primaryTitleId = "",
  title = "Professional Titles",
  description = "Professional roles and areas of expertise.",
  showEmptyState = false,
}) {
  const sectionTitleId = useId();

  /*
   * Archived titles should not appear in the
   * normal saved-profile display.
   */

  const visibleTitles = Array.isArray(titles)
    ? titles.filter(
        (professionalTitle) =>
          professionalTitle?.status !== "archived" &&
          professionalTitle?.name?.trim(),
      )
    : [];

  if (visibleTitles.length === 0 && !showEmptyState) {
    return null;
  }

  return (
    <section
      className="profile-professional-titles"
      aria-labelledby={sectionTitleId}
    >
      <header className="profile-professional-titles-header">
        <div>
          <span className="profile-professional-titles-eyebrow">
            Career Identity
          </span>

          <h4 id={sectionTitleId}>{title}</h4>

          {description && <p>{description}</p>}
        </div>

        <span className="profile-professional-titles-count">
          {visibleTitles.length}{" "}
          {visibleTitles.length === 1 ? "Title" : "Titles"}
        </span>
      </header>

      {visibleTitles.length > 0 ? (
        <div className="profile-professional-titles-list">
          {visibleTitles.map((professionalTitle, index) => (
            <ProfileProfessionalTitleItem
              key={professionalTitle.id}
              professionalTitle={professionalTitle}
              index={index}
              isPrimary={
                Boolean(primaryTitleId) &&
                professionalTitle.id === primaryTitleId
              }
            />
          ))}
        </div>
      ) : (
        <div className="profile-professional-titles-empty">
          <span aria-hidden="true">✦</span>

          <p>No professional titles have been provided.</p>
        </div>
      )}
    </section>
  );
}

export default ProfileProfessionalTitles;
