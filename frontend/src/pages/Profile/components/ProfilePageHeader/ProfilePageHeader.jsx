import "./ProfilePageHeader.css";

function ProfilePageHeader({
  fullName = "",
  isEditing = false,
  isLoading = false,
  onEdit,
  onCancelEditing,
  onRefresh,
}) {
  return (
    <header className="profile-page-header">
      <div className="profile-page-header-content">
        <span className="profile-page-header-eyebrow">Account Profile</span>

        <h1>My Profile</h1>

        <p>
          Manage the reusable personal and professional information available to
          your portfolios and résumés.
        </p>

        {fullName && (
          <div className="profile-page-header-identity">
            <span>Current Profile</span>
            <strong>{fullName}</strong>
          </div>
        )}
      </div>

      <div className="profile-page-header-actions">
        <button
          type="button"
          className="profile-page-header-refresh-button"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>

        {isEditing ? (
          <button
            type="button"
            className="profile-page-header-cancel-button"
            onClick={onCancelEditing}
            disabled={isLoading}
          >
            Close Editor
          </button>
        ) : (
          <button
            type="button"
            className="profile-page-header-edit-button"
            onClick={onEdit}
            disabled={isLoading}
          >
            Edit Profile
          </button>
        )}
      </div>
    </header>
  );
}

export default ProfilePageHeader;
