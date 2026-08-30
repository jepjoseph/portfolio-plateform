import {
  getContactIcon,
  getContactTypeLabel,
} from "../../../../services/PersonalInformation/contactInformationConfig";

import "./ContactInformationItem.css";

function getExternalUrl(value) {
  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `https://${value}`;
}

function getLink(category, value) {
  if (!value) {
    return "";
  }

  if (category === "emails") {
    return `mailto:${value}`;
  }

  if (category === "phones") {
    const normalizedPhone = value.replace(/[^\d+]/g, "");

    return `tel:${normalizedPhone}`;
  }

  if (
    category === "websites" ||
    category === "socialLinks"
  ) {
    return getExternalUrl(value);
  }

  return "";
}

function ContactInformationItem({
  item,
  category,
  index,
}) {
  const typeLabel = getContactTypeLabel(
    category,
    item.type,
  );

  const icon = getContactIcon(category, item.type);
  const link = getLink(category, item.value);
  const isPrimary = index === 0;

  const isExternalLink =
    category === "websites" ||
    category === "socialLinks";

  return (
    <article
      className="contact-information-item"
      data-category={category}
      data-type={item.type}
    >
      <div
        className="contact-information-item-icon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="contact-information-item-content">
        <div className="contact-information-item-label">
          <span>{typeLabel}</span>

          {isPrimary && <small>Primary</small>}
        </div>

        {link ? (
          <a
            href={link}
            target={isExternalLink ? "_blank" : undefined}
            rel={
              isExternalLink
                ? "noopener noreferrer"
                : undefined
            }
            aria-label={
              isExternalLink
                ? `Open ${typeLabel} in a new tab`
                : undefined
            }
          >
            <span className="contact-information-link-value">
              {item.value}
            </span>

            {isExternalLink && (
              <span
                className="contact-information-link-arrow"
                aria-hidden="true"
              >
                ↗
              </span>
            )}
          </a>
        ) : (
          <p className="contact-information-item-value">
            {item.value || "Not provided"}
          </p>
        )}

        {item.description && (
          <p className="contact-information-item-description">
            {item.description}
          </p>
        )}
      </div>
    </article>
  );
}

export default ContactInformationItem;