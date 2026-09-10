import { useId } from "react";

import ProfileContactItem from "./ProfileContactItem/ProfileContactItem.jsx";

import "./ProfileContactSection.css";

function ProfileContactSection({
  category,
  title,
  eyebrow,
  items = [],
  primaryItemId = "",
  showEmptyItems = false,
  showEmptyState = false,
}) {
  const sectionTitleId = useId();

  /*
   * Exclude archived records from the normal
   * saved-profile display.
   */

  const activeItems = Array.isArray(items)
    ? items.filter((item) => item?.status !== "archived")
    : [];

  /*
   * Empty values can still appear while the Profile
   * page is configured to show empty fields.
   */

  const visibleItems = showEmptyItems
    ? activeItems
    : activeItems.filter(
        (item) => typeof item?.value === "string" && item.value.trim(),
      );

  if (visibleItems.length === 0 && !showEmptyState) {
    return null;
  }

  return (
    <section
      className="profile-contact-section"
      data-category={category}
      aria-labelledby={sectionTitleId}
    >
      <header className="profile-contact-section-header">
        <div>
          <span className="profile-contact-section-eyebrow">{eyebrow}</span>

          <h4 id={sectionTitleId}>{title}</h4>
        </div>

        <span className="profile-contact-section-count">
          {visibleItems.length}
        </span>
      </header>

      {visibleItems.length > 0 ? (
        <div className="profile-contact-section-list">
          {visibleItems.map((item) => (
            <ProfileContactItem
              key={item.id}
              item={item}
              category={category}
              isPrimary={Boolean(primaryItemId) && item.id === primaryItemId}
            />
          ))}
        </div>
      ) : (
        <div className="profile-contact-section-empty">
          <span aria-hidden="true">＋</span>

          <p>No {title.toLowerCase()} provided.</p>
        </div>
      )}
    </section>
  );
}

export default ProfileContactSection;
