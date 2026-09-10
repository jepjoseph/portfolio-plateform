import "./ProfileProfessionalTitleItem.css";

const POSITION_NAMES = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
];

function getPositionName(index) {
  return POSITION_NAMES[index] || `Title ${index + 1}`;
}

function ProfileProfessionalTitleItem({
  professionalTitle,
  index = 0,
  isPrimary = false,
}) {
  if (!professionalTitle?.name?.trim()) {
    return null;
  }

  return (
    <article
      className={`profile-professional-title-item ${
        isPrimary ? "profile-professional-title-item--primary" : ""
      }`}
      data-primary={isPrimary ? "true" : "false"}
    >
      <div className="profile-professional-title-item-icon" aria-hidden="true">
        ✦
      </div>

      <div className="profile-professional-title-item-information">
        <div className="profile-professional-title-item-label">
          <span>{getPositionName(index)} Title</span>

          {isPrimary && <small>Primary</small>}
        </div>

        <h5>{professionalTitle.name}</h5>

        {professionalTitle.description?.trim() && (
          <p>{professionalTitle.description}</p>
        )}
      </div>
    </article>
  );
}

export default ProfileProfessionalTitleItem;
