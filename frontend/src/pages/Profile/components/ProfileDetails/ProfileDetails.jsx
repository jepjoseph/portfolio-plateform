import { useId } from "react";

import ProfileProfessionalTitles from "../ProfileProfessionalTitles/ProfileProfessionalTitles.jsx";
import ProfileContactSection from "../ProfileContactSection/ProfileContactSection.jsx";

import {
  getActiveProfileItems,
  getPrimaryProfileItem,
  getPrimaryProfilePicture,
  getProfileInitials,
  getProfilePictureName,
  getProfilePictureUrl,
  hasConfiguredProfilePicture,
  usesDefaultProfileAvatar,
} from "../../../../services/Profile/profileUtils.js";

import "./ProfileDetails.css";

/*
 * =========================================
 * Primary Item Ordering
 * =========================================
 *
 * The legacy display components still assume
 * that the first item is the primary item.
 *
 * Until those components are extracted and
 * upgraded, place the explicitly selected
 * primary item first in the displayed list.
 */

function placePrimaryItemFirst(items = [], primaryItem = null) {
  if (!primaryItem) {
    return items;
  }

  const remainingItems = items.filter((item) => item?.id !== primaryItem.id);

  return [primaryItem, ...remainingItems];
}

/*
 * =========================================
 * Profile Details
 * =========================================
 */

function ProfileDetails({
  profile,
  title = "Personal Information",
  description = "Your personal, professional, and contact information.",
  showHeader = true,
  showEmptyFields = false,
  onEdit,
}) {
  const titleId = useId();

  if (!profile) {
    return null;
  }

  /*
   * =========================================
   * Name Fields
   * =========================================
   */

  const nameFields = [
    {
      id: "firstName",
      label: "First Name",
      value: profile.firstName || "",
    },
    {
      id: "middleName",
      label: "Middle Name",
      value: profile.middleName || "",
    },
    {
      id: "lastName",
      label: "Last Name",
      value: profile.lastName || "",
    },
  ];

  const visibleNameFields = showEmptyFields
    ? nameFields
    : nameFields.filter((field) => field.value.trim());

  /*
   * =========================================
   * Professional Titles
   * =========================================
   */

  const activeProfessionalTitles = getActiveProfileItems(
    profile,
    "professionalTitles",
  );

  const primaryProfessionalTitle = getPrimaryProfileItem(
    profile,
    "professionalTitles",
  );

  const displayedProfessionalTitles = placePrimaryItemFirst(
    activeProfessionalTitles,
    primaryProfessionalTitle,
  );

  /*
   * =========================================
   * Contact Collections
   * =========================================
   */

  const createDisplayedCollection = (collectionName) => {
    const activeItems = getActiveProfileItems(profile, collectionName);

    const primaryItem = getPrimaryProfileItem(profile, collectionName);

    return placePrimaryItemFirst(activeItems, primaryItem);
  };

  const displayedEmails = createDisplayedCollection("emails");
  const displayedPhones = createDisplayedCollection("phones");
  const displayedWebsites = createDisplayedCollection("websites");
  const displayedLocations = createDisplayedCollection("locations");
  const displayedSocialLinks = createDisplayedCollection("socialLinks");

  const primaryEmailId = getPrimaryProfileItem(profile, "emails")?.id || "";

  const primaryPhoneId = getPrimaryProfileItem(profile, "phones")?.id || "";

  const primaryWebsiteId = getPrimaryProfileItem(profile, "websites")?.id || "";

  const primaryLocationId =
    getPrimaryProfileItem(profile, "locations")?.id || "";

  const primarySocialLinkId =
    getPrimaryProfileItem(profile, "socialLinks")?.id || "";

  /*
   * =========================================
   * Pictures
   * =========================================
   */

  const activePictures = getActiveProfileItems(
    profile,
    "profilePictures",
  ).filter(hasConfiguredProfilePicture);

  const primaryPicture = getPrimaryProfilePicture(profile);

  const visiblePictures = placePrimaryItemFirst(
    activePictures,
    primaryPicture &&
      primaryPicture.status !== "archived" &&
      hasConfiguredProfilePicture(primaryPicture)
      ? primaryPicture
      : null,
  );

  const profileInitials = getProfileInitials(profile, "P");

  return (
    <section
      className="profile-details"
      aria-labelledby={showHeader ? titleId : undefined}
    >
      {showHeader && (
        <header className="profile-details-header">
          <div className="profile-details-heading">
            <span className="profile-details-eyebrow">Personal</span>

            <h3 id={titleId}>{title}</h3>

            {description && <p>{description}</p>}
          </div>

          {onEdit && (
            <button
              type="button"
              className="profile-details-edit-button"
              onClick={onEdit}
            >
              Edit Personal Information
            </button>
          )}
        </header>
      )}

      {/*
       * =========================================
       * Identity
       * =========================================
       */}

      {visibleNameFields.length > 0 && (
        <section
          className="profile-details-identity"
          aria-labelledby={`${titleId}-identity`}
        >
          <header className="profile-details-section-header">
            <div>
              <span>Name</span>

              <h4 id={`${titleId}-identity`}>Personal Identity</h4>

              <p>The name information associated with your profile.</p>
            </div>

            <span className="profile-details-count">
              {visibleNameFields.length}
            </span>
          </header>

          <dl className="profile-details-name-grid">
            {visibleNameFields.map((field) => (
              <div key={field.id} className="profile-details-name-field">
                <dt>{field.label}</dt>

                <dd>
                  {field.value || (
                    <span className="profile-details-empty">Not provided</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/*
       * =========================================
       * Pictures
       * =========================================
       */}

      {visiblePictures.length > 0 && (
        <section
          className="profile-details-pictures"
          aria-labelledby={`${titleId}-pictures`}
        >
          <header className="profile-details-section-header">
            <div>
              <span>Media</span>

              <h4 id={`${titleId}-pictures`}>Profile Pictures</h4>

              <p>
                Reusable uploaded pictures and default avatars available to your
                professional documents.
              </p>
            </div>

            <span className="profile-details-count">
              {visiblePictures.length}
            </span>
          </header>

          <div className="profile-details-pictures-grid">
            {visiblePictures.map((picture, index) => {
              const pictureUrl = getProfilePictureUrl(picture);

              const isDefaultAvatar = usesDefaultProfileAvatar(picture);

              const isPrimary = picture.id === primaryPicture?.id;

              const pictureName = isDefaultAvatar
                ? "Default Avatar"
                : getProfilePictureName(picture, `Picture ${index + 1}`);

              return (
                <article
                  key={picture.id}
                  className={`profile-details-picture-item ${
                    isDefaultAvatar
                      ? "profile-details-picture-item--default"
                      : ""
                  }`}
                >
                  <div className="profile-details-picture-preview">
                    {pictureUrl ? (
                      <img
                        src={pictureUrl}
                        alt={
                          picture.description?.trim() ||
                          picture.fileName ||
                          `Profile picture ${index + 1}`
                        }
                      />
                    ) : (
                      <div
                        className="profile-details-default-avatar"
                        role="img"
                        aria-label={
                          picture.description?.trim() ||
                          `${profileInitials} default profile avatar`
                        }
                      >
                        <strong>{profileInitials}</strong>
                      </div>
                    )}
                  </div>

                  <div className="profile-details-picture-content">
                    <div className="profile-details-picture-label">
                      <span>Picture {index + 1}</span>

                      {isPrimary && <small>Primary</small>}

                      {isDefaultAvatar && (
                        <small className="profile-details-default-label">
                          Default Avatar
                        </small>
                      )}
                    </div>

                    <strong>{pictureName}</strong>

                    {picture.description?.trim() ? (
                      <p>{picture.description}</p>
                    ) : isDefaultAvatar ? (
                      <p>
                        Initials-based avatar generated from your profile name.
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/*
       * =========================================
       * Professional Titles
       * =========================================
       *
       * This temporarily uses the legacy display
       * component. The selected primary title was
       * placed first above.
       */}

      <ProfileProfessionalTitles
        titles={displayedProfessionalTitles}
        primaryTitleId={profile.preferences?.primaryProfessionalTitleId || ""}
        showEmptyState={showEmptyFields}
      />

      {/*
       * =========================================
       * Contact Information
       * =========================================
       *
       * These temporarily use the legacy contact
       * display components. Explicit primary items
       * have been placed first.
       */}

      <div className="profile-details-contact-grid">
        <ProfileContactSection
          category="emails"
          title="Email Addresses"
          eyebrow="Email"
          items={displayedEmails}
          primaryItemId={primaryEmailId}
          showEmptyItems={showEmptyFields}
          showEmptyState={showEmptyFields}
        />

        <ProfileContactSection
          category="phones"
          title="Phone Numbers"
          eyebrow="Phone"
          items={displayedPhones}
          primaryItemId={primaryPhoneId}
          showEmptyItems={showEmptyFields}
          showEmptyState={showEmptyFields}
        />

        <ProfileContactSection
          category="websites"
          title="Websites"
          eyebrow="Website"
          items={displayedWebsites}
          primaryItemId={primaryWebsiteId}
          showEmptyItems={showEmptyFields}
          showEmptyState={showEmptyFields}
        />

        <ProfileContactSection
          category="locations"
          title="Locations"
          eyebrow="Location"
          items={displayedLocations}
          primaryItemId={primaryLocationId}
          showEmptyItems={showEmptyFields}
          showEmptyState={showEmptyFields}
        />

        <ProfileContactSection
          category="socialLinks"
          title="Social Profiles"
          eyebrow="Social"
          items={displayedSocialLinks}
          primaryItemId={primarySocialLinkId}
          showEmptyItems={showEmptyFields}
          showEmptyState={showEmptyFields}
        />
      </div>
    </section>
  );
}

export default ProfileDetails;
