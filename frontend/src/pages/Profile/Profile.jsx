import { useState } from "react";

import PersonalInformation from "../../components/PersonalInformation/PersonalInformation";
import PersonalInformationForm from "../../components/PersonalInformation/PersonalInformationForm/PersonalInformationForm";
import { useProfileData } from "../../context/ProfileDataContext";

import "./Profile.css";

const INITIAL_PROFILE = {};

function Profile() {
  const {profile, setProfile} = useProfileData();
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = (updatedProfile) => {
    setProfile(updatedProfile);
    setIsEditing(false);

    /*
     * Replace this with an API request later.
     *
     * Example:
     * await profileService.updateProfile(updatedProfile);
     */

    console.log("Profile saved:", updatedProfile);
  };

  return (
    <main className="profile-page">
      <header className="profile-page-header">
        <span className="profile-page-eyebrow">Account Profile</span>

        <h2>My Profile</h2>

        <p>
          Manage the reusable personal information available to your portfolios
          and resumes.
        </p>
      </header>

      <div className="profile-page-content">
        {isEditing ? (
          <PersonalInformationForm
            profile={profile}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <PersonalInformation
            profile={profile}
            onEdit={handleEdit}
            showEmptyFields
          />
        )}
      </div>
    </main>
  );
}

export default Profile;
