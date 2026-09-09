import { useMemo, useState } from "react";

import PersonalInformation from "../../components/PersonalInformation/PersonalInformation.jsx";
import ProfileForm from "./components/ProfileForm/ProfileForm.jsx";

import { useProfileData } from "../../context/ProfileDataContext.jsx";

import {
  getProfileDisplaySummary,
  getProfileStatistics,
} from "../../services/Profile/profileUtils.js";

import ProfileDashboard from "./components/ProfileDashboard/ProfileDashboard.jsx";
import ProfilePageHeader from "./components/ProfilePageHeader/ProfilePageHeader.jsx";

import "./Profile.css";

function Profile() {
  const {
    profile,

    isLoading,
    loadStatus,
    saveStatus,
    operation,
    error,

    refreshProfile,
    updateProfile,

    clearError,
    resetSaveStatus,
  } = useProfileData();

  const [isEditing, setIsEditing] = useState(false);

  /*
   * =========================================
   * Derived Information
   * =========================================
   */

  const statistics = useMemo(() => getProfileStatistics(profile), [profile]);

  const profileSummary = useMemo(
    () => getProfileDisplaySummary(profile),
    [profile],
  );

  const isSaving = saveStatus === "saving";

  const isWorking = isLoading || isSaving;

  /*
   * =========================================
   * Editing
   * =========================================
   */

  const handleEdit = () => {
    setIsEditing(true);
    clearError();
    resetSaveStatus();
  };

  const handleCancel = () => {
    setIsEditing(false);
    clearError();
    resetSaveStatus();
  };

  /*
   * =========================================
   * Save
   * =========================================
   */

  const handleSave = async (updatedProfile) => {
    try {
      await updateProfile(updatedProfile);

      setIsEditing(false);
    } catch (saveError) {
      /*
       * ProfileDataContext already normalizes
       * and exposes this error.
       *
       * Keep the form open so the user does not
       * lose the submitted information.
       */

      console.error("Unable to save Profile:", saveError);
    }
  };

  /*
   * =========================================
   * Refresh
   * =========================================
   */

  const handleRefresh = () => {
    refreshProfile({
      showLoading: true,
    }).catch(() => {
      /*
       * ProfileDataContext already stores the
       * normalized loading error.
       */
    });
  };

  return (
    <main className="profile-page">
      <ProfilePageHeader
        fullName={profileSummary.fullName}
        isEditing={isEditing}
        isLoading={isWorking}
        onEdit={handleEdit}
        onCancelEditing={handleCancel}
        onRefresh={handleRefresh}
      />

      <ProfileDashboard statistics={statistics} isLoading={isLoading} />

      {/* =====================================
          Load Error
          ===================================== */}

      {!isLoading && loadStatus === "error" && (
        <section
          className="profile-page-message profile-page-message--error"
          role="alert"
        >
          <div>
            <strong>Profile could not be loaded</strong>

            <p>
              {error?.message ||
                "The saved Profile information could not be retrieved."}
            </p>
          </div>

          <button type="button" onClick={handleRefresh}>
            Try Again
          </button>
        </section>
      )}

      {/* =====================================
          Operation Error
          ===================================== */}

      {error && loadStatus !== "error" && (
        <section
          className="profile-page-message profile-page-message--error"
          role="alert"
        >
          <div>
            <strong>Unable to complete the Profile operation</strong>

            <p>{error.message}</p>

            {error.errors?.length > 0 && (
              <ul>
                {error.errors.slice(0, 5).map((validationError, index) => (
                  <li key={`${validationError.field || "profile"}-${index}`}>
                    {validationError.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </section>
      )}

      {/* =====================================
          Saving Status
          ===================================== */}

      {saveStatus === "saving" && (
        <section
          className="profile-page-message profile-page-message--saving"
          role="status"
          aria-live="polite"
        >
          <span className="profile-page-message-loader" aria-hidden="true" />

          <div>
            <strong>Saving Profile</strong>

            <p>
              Your reusable personal and professional information is being
              updated.
            </p>
          </div>
        </section>
      )}

      {/* =====================================
          Save Success
          ===================================== */}

      {saveStatus === "success" && (
        <section
          className="profile-page-message profile-page-message--success"
          role="status"
        >
          <div>
            <strong>Profile changes saved</strong>

            <p>Your Profile is ready for use in résumés and portfolios.</p>

            {operation?.type && (
              <small>Completed operation: {operation.type}</small>
            )}
          </div>

          <button type="button" onClick={resetSaveStatus}>
            Dismiss
          </button>
        </section>
      )}

      {/* =====================================
          Initial Loading
          ===================================== */}

      {isLoading && !profile && (
        <section
          className="profile-page-loading"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" />

          <div>
            <strong>Loading Profile</strong>

            <p>Retrieving your reusable Profile information.</p>
          </div>
        </section>
      )}

      {/* =====================================
          Profile Content
          ===================================== */}

      {profile && (
        <div className="profile-page-content">
          {isEditing ? (
            <ProfileForm
              profile={profile}
              isSaving={isSaving}
              fieldErrors={error?.fieldErrors || {}}
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
      )}
    </main>
  );
}

export default Profile;
