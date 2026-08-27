import "./ProfileHeader.css";

function ProfileHeader({ profile, onEdit }) {
  const fullName = [profile?.firstName, profile?.middleName, profile?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="profile-header-card">
      {/* =========================================
          Card Header
          ========================================= */}

      <div className="profile-header-card-top">
        <div>
          <span className="profile-header-eyebrow">Profile Information</span>

          <h3>Professional Profile</h3>

          <p>
            Manage the professional identity displayed at the top of your public
            portfolio.
          </p>
        </div>

        <button
          type="button"
          className="profile-header-edit-button"
          onClick={onEdit}
        >
          Edit Profile
        </button>
      </div>

      {/* =========================================
          Profile Identity
          ========================================= */}

      <div className="profile-header-identity">
        <div className="profile-header-photo">JP</div>

        <div className="profile-header-identity-info">
          <h4>{fullName || "Your Name"}</h4>

          <span>{profile?.professionalTitle || "Professional Title"}</span>

          <span>{profile?.location || "Location not provided"}</span>
        </div>
      </div>
    </article>
  );
}

export default ProfileHeader;
