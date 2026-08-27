import { useState } from "react";

import "./PersonalInformation.css";

function PersonalInformation() {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "Jean",
    middleName: "Pierre",
    lastName: "Joseph",
    professionalTitle: "Computer Engineer",
    location: "South Florida, FL",
    email: "jean@example.com",
    phone: "",
    website: "motich.com",
    linkedin: "linkedin.com/in/jeanpierrejoseph",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  };

  const handleSave = () => {
    setIsEditing(false);

    console.log("Profile saved:", profile);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <article className="profile-header-card">
      {/* =========================================
          Card Header
          ========================================= */}

      <div className="profile-header-card-top">
        <div>
          <span className="profile-header-eyebrow">Personal</span>

          <h3>Personal Information</h3>

          <p>
            Manage the information displayed at the top of your public
            portfolio.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="profile-header-edit-button"
            onClick={() => setIsEditing(true)}
          >
            Edit Personal Information
          </button>
        )}
      </div>

      {/* =========================================
          Profile Information
          ========================================= */}

      <div className="profile-header-information">
        {/* First Name */}

        <div className="profile-field">
          <label htmlFor="firstName">First Name</label>

          {isEditing ? (
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={profile.firstName}
              onChange={handleChange}
            />
          ) : (
            <span>{profile.firstName}</span>
          )}
        </div>

        {/* Middle Name */}

        <div className="profile-field">
          <label htmlFor="firstName">Middle Name</label>

          {isEditing ? (
            <input
              id="middleName"
              name="middleName"
              type="text"
              value={profile.middleName}
              onChange={handleChange}
            />
          ) : (
            <span>{profile.middleName || "Not provided"}</span>
          )}
        </div>

        {/* Last Name */}

        <div className="profile-field">
          <label htmlFor="firstName">Last Name</label>

          {isEditing ? (
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={profile.lastName}
              onChange={handleChange}
            />
          ) : (
            <span>{profile.lastName}</span>
          )}
        </div>

        {/* Professional Title */}

        <div className="profile-field">
          <label htmlFor="professionalTitle">Professional Title</label>

          {isEditing ? (
            <input
              id="professionalTitle"
              name="professionalTitle"
              type="text"
              value={profile.professionalTitle}
              onChange={handleChange}
            />
          ) : (
            <span>{profile.professionalTitle}</span>
          )}
        </div>

        {/* Location */}

        <div className="profile-field">
          <label htmlFor="location">Location</label>

          {isEditing ? (
            <input
              id="location"
              name="location"
              type="text"
              value={profile.location}
              onChange={handleChange}
            />
          ) : (
            <span>{profile.location}</span>
          )}
        </div>

        {/* Email */}

        <div className="profile-field">
          <label htmlFor="email">Email</label>

          {isEditing ? (
            <input
              id="email"
              name="email"
              type="email"
              value={profile.email}
              onChange={handleChange}
            />
          ) : (
            <span>{profile.email}</span>
          )}
        </div>

        {/* Phone */}

        <div className="profile-field">
          <label htmlFor="phone">Phone</label>

          {isEditing ? (
            <input
              id="phone"
              name="phone"
              type="tel"
              value={profile.phone}
              onChange={handleChange}
              placeholder="Add phone number"
            />
          ) : (
            <span>{profile.phone || "Not provided"}</span>
          )}
        </div>

        {/* Website */}

        <div className="profile-field">
          <label htmlFor="website">Website</label>

          {isEditing ? (
            <input
              id="website"
              name="website"
              type="text"
              value={profile.website}
              onChange={handleChange}
              placeholder="yourwebsite.com"
            />
          ) : (
            <span>{profile.website}</span>
          )}
        </div>

        {/* LinkedIn */}

        <div className="profile-field">
          <label htmlFor="linkedin">LinkedIn</label>

          {isEditing ? (
            <input
              id="linkedin"
              name="linkedin"
              type="text"
              value={profile.linkedin}
              onChange={handleChange}
              placeholder="linkedin.com/in/username"
            />
          ) : (
            <span>{profile.linkedin}</span>
          )}
        </div>
      </div>

      {/* =========================================
          Edit Actions
          ========================================= */}

      {isEditing && (
        <div className="profile-header-actions">
          <button
            type="button"
            className="profile-cancel-button"
            onClick={handleCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="profile-save-button"
            onClick={handleSave}
          >
            Save Profile
          </button>
        </div>
      )}
    </article>
  );
}

export default PersonalInformation;
