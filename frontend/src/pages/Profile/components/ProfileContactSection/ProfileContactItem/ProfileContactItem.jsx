import {
  getProfileContactLink,
  getProfileItemIcon,
  getProfileItemTypeLabel,
  isExternalProfileLink,
} from "../../../../../services/Profile/profileUtils.js";

import "./ProfileContactItem.css";

function ProfileContactItem({ item, category, isPrimary = false }) {
  if (!item) {
    return null;
  }

  const typeLabel = getProfileItemTypeLabel(category, item);

  const icon = getProfileItemIcon(category, item);

  const link = getProfileContactLink(category, item.value);

  const isExternalLink = isExternalProfileLink(category);

  const displayValue = typeof item.value === "string" ? item.value.trim() : "";

  const description =
    typeof item.description === "string" ? item.description.trim() : "";

  return (
    <article
      className={`profile-contact-item ${
        isPrimary ? "profile-contact-item--primary" : ""
      }`}
      data-category={category}
      data-type={item.type || ""}
      data-primary={isPrimary ? "true" : "false"}
    >
      <div className="profile-contact-item-icon" aria-hidden="true">
        {icon}
      </div>

      <div className="profile-contact-item-content">
        <div className="profile-contact-item-label">
          <span>{typeLabel}</span>

          {isPrimary && <small>Primary</small>}
        </div>

        {link ? (
          <a
            href={link}
            target={isExternalLink ? "_blank" : undefined}
            rel={isExternalLink ? "noopener noreferrer" : undefined}
            aria-label={
              isExternalLink ? `Open ${typeLabel} in a new tab` : undefined
            }
          >
            <span className="profile-contact-item-link-value">
              {displayValue}
            </span>

            {isExternalLink && (
              <span
                className="profile-contact-item-link-arrow"
                aria-hidden="true"
              >
                ↗
              </span>
            )}
          </a>
        ) : (
          <p className="profile-contact-item-value">
            {displayValue || "Not provided"}
          </p>
        )}

        {description && (
          <p className="profile-contact-item-description">{description}</p>
        )}
      </div>
    </article>
  );
}

export default ProfileContactItem;
