import { useId } from "react";

import ProfessionalTitle from "./ProfessionalTitle/ProfessionalTitle";
import ContactInformation from "./ContactInformation/ContactInformation";

import "./PersonalInformation.css";

/*
 * =========================================
 * Picture Helpers
 * =========================================
 */

function getPictureUrl(picture) {
  return picture?.imageUrl || picture?.fileUrl || picture?.url || "";
}

function PersonalInformation({
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
      value: profile.firstName,
    },
    {
      id: "middleName",
      label: "Middle Name",
      value: profile.middleName,
    },
    {
      id: "lastName",
      label: "Last Name",
      value: profile.lastName,
    },
  ];

  const visibleNameFields = showEmptyFields
    ? nameFields
    : nameFields.filter((field) => field.value?.trim());

  /*
   * =========================================
   * Pictures
   * =========================================
   */

  const visiblePictures = (profile.profilePictures || []).filter((picture) =>
    getPictureUrl(picture),
  );

  return (
    <section
      className="personal-information"
      aria-labelledby={showHeader ? titleId : undefined}
    >
      {showHeader && (
        <header className="personal-information-header">
          <div className="personal-information-heading">
            <span className="personal-information-eyebrow">Personal</span>

            <h3 id={titleId}>{title}</h3>

            {description && <p>{description}</p>}
          </div>

          {onEdit && (
            <button
              type="button"
              className="personal-information-edit-button"
              onClick={onEdit}
            >
              Edit Personal Information
            </button>
          )}
        </header>
      )}

      {/* =========================================
          Name
          ========================================= */}

      {/* =========================================
    Identity
    ========================================= */}

      {visibleNameFields.length > 0 && (
        <section className="personal-information-identity">
          <header className="personal-information-identity-header">
            <div>
              <span>Name</span>

              <h4>Personal Identity</h4>

              <p>The name information associated with your profile.</p>
            </div>

            <span className="personal-information-identity-count">
              {visibleNameFields.length}
            </span>
          </header>

          <dl className="personal-information-grid">
            {visibleNameFields.map((field) => (
              <div key={field.id} className="personal-information-field">
                <dt>{field.label}</dt>

                <dd>
                  {field.value || (
                    <span className="personal-information-empty">
                      Not provided
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* =========================================
          Pictures
          ========================================= */}

      {visiblePictures.length > 0 && (
        <section className="personal-information-pictures">
          <header className="personal-information-pictures-header">
            <div>
              <span>Media</span>

              <h4>Profile Pictures</h4>
            </div>

            <span className="personal-information-pictures-count">
              {visiblePictures.length}
            </span>
          </header>

          <div className="personal-information-pictures-grid">
            {visiblePictures.map((picture, index) => {
              const pictureUrl = getPictureUrl(picture);

              const pictureName = picture.fileName || `Picture ${index + 1}`;

              return (
                <article
                  key={picture.id}
                  className="personal-information-picture-item"
                >
                  <div className="personal-information-picture-preview">
                    <img
                      src={pictureUrl}
                      alt={
                        picture.description ||
                        picture.fileName ||
                        `Uploaded picture ${index + 1}`
                      }
                    />
                  </div>

                  <div className="personal-information-picture-content">
                    <div className="personal-information-picture-label">
                      <span>Picture {index + 1}</span>
                    </div>

                    <strong>{pictureName}</strong>

                    {picture.description && <p>{picture.description}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================
          Professional Titles
          ========================================= */}

      <ProfessionalTitle titles={profile.professionalTitles || []} />

      {/* =========================================
          Reusable Contact Information
          ========================================= */}

      <div className="personal-information-contact-grid">
        <ContactInformation
          category="emails"
          title="Email Addresses"
          eyebrow="Email"
          items={profile.emails || []}
          showEmptyItems={showEmptyFields}
        />

        <ContactInformation
          category="phones"
          title="Phone Numbers"
          eyebrow="Phone"
          items={profile.phones || []}
          showEmptyItems={showEmptyFields}
        />

        <ContactInformation
          category="websites"
          title="Websites"
          eyebrow="Website"
          items={profile.websites || []}
          showEmptyItems={showEmptyFields}
        />

        <ContactInformation
          category="locations"
          title="Locations"
          eyebrow="Location"
          items={profile.locations || []}
          showEmptyItems={showEmptyFields}
        />

        <ContactInformation
          category="socialLinks"
          title="Social Profiles"
          eyebrow="Social"
          items={profile.socialLinks || []}
          showEmptyItems={showEmptyFields}
        />
      </div>
    </section>
  );
}

export default PersonalInformation;
