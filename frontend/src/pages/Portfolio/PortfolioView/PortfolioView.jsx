import PortfolioHero from "../components/PortfolioHero/PortfolioHero";
import PortfolioNavigation from "../components/PortfolioNavigation/PortfolioNavigation";

import "./PortfolioView.css";

function getExternalUrl(value) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "";
  }

  if (
    normalizedValue.startsWith("http://") ||
    normalizedValue.startsWith("https://")
  ) {
    return normalizedValue;
  }

  return `https://${normalizedValue}`;
}

function getReadableUrl(value) {
  return String(value || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function getPhoneLink(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function getImageUrl(picture) {
  return picture?.imageUrl || picture?.fileUrl || picture?.url || "";
}

function getItemText(item, fields = []) {
  if (typeof item === "string") {
    return item.trim();
  }

  for (const field of fields) {
    const value = item?.[field];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function PortfolioView({ portfolio, mode = "public" }) {
  if (!portfolio) {
    return null;
  }

  const {
    selectedProfile = {},
    about = {},
    summary = "",
    experiences = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    featuredResume = null,
    sectionVisibility = {},
  } = portfolio;

  const aboutText =
    typeof about === "string" ? about : about?.text || summary || "";

  const {
    selectedName = "",
    professionalTitles = [],
    emails = [],
    phones = [],
    websites = [],
    locations = [],
    socialLinks = [],
    profilePictures = [],
  } = selectedProfile;

  const selectedProfilePicture =
    profilePictures.find((picture) =>
      ["profile", "headshot", "avatar"].includes(picture.type),
    ) || null;

  const selectedHeaderBackground =
    profilePictures.find((picture) => picture.type === "header-background") ||
    null;

  const selectedPortfolioBackground =
    profilePictures.find(
      (picture) => picture.type === "portfolio-background",
    ) || null;

  const profilePictureUrl = getImageUrl(selectedProfilePicture);

  const headerBackgroundUrl = getImageUrl(selectedHeaderBackground);

  const portfolioBackgroundUrl = getImageUrl(selectedPortfolioBackground);

  const isSectionVisible = (sectionName) =>
    sectionVisibility[sectionName] !== false;

  const hasContactInformation =
    emails.length > 0 ||
    phones.length > 0 ||
    websites.length > 0 ||
    locations.length > 0 ||
    socialLinks.length > 0;

  return (
    <div
      id="top"
      className={`portfolio-view ${
        portfolioBackgroundUrl ? "portfolio-view--has-background" : ""
      }`}
      style={
        portfolioBackgroundUrl
          ? {
              "--portfolio-background-image": `url("${portfolioBackgroundUrl}")`,
            }
          : undefined
      }
    >
      <PortfolioNavigation
        portfolio={portfolio}
        selectedName={selectedName}
        mode={mode}
      />

      <PortfolioHero
        portfolio={portfolio}
        selectedProfile={selectedProfile}
        selectedProfilePicture={selectedProfilePicture}
        profilePictureUrl={profilePictureUrl}
        headerBackgroundUrl={headerBackgroundUrl}
      />

      <main className="portfolio-view-main">
        {isSectionVisible("summary") && aboutText && (
          <section id="about" className="portfolio-view-section">
            <header className="portfolio-view-section-header">
              <span>Professional Story</span>

              <h2>About</h2>
            </header>

            <p className="portfolio-view-summary">{aboutText}</p>
          </section>
        )}

        {isSectionVisible("experience") && experiences.length > 0 && (
          <PortfolioListSection
            id="experience"
            eyebrow="Career History"
            title="Professional Experience"
            items={experiences}
            type="experience"
          />
        )}

        {isSectionVisible("skills") && skills.length > 0 && (
          <section id="skills" className="portfolio-view-section">
            <header className="portfolio-view-section-header">
              <span>Capabilities</span>

              <h2>Skills</h2>
            </header>

            <div className="portfolio-view-skills">
              {skills.map((skill, index) => {
                const skillName = getItemText(skill, [
                  "name",
                  "value",
                  "label",
                  "title",
                ]);

                if (!skillName) {
                  return null;
                }

                return (
                  <span key={skill?.id || `${skillName}-${index}`}>
                    {skillName}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {isSectionVisible("projects") && projects.length > 0 && (
          <PortfolioListSection
            id="projects"
            eyebrow="Selected Work"
            title="Projects"
            items={projects}
            type="project"
          />
        )}

        {isSectionVisible("education") && education.length > 0 && (
          <PortfolioListSection
            id="education"
            eyebrow="Academic Background"
            title="Education"
            items={education}
            type="education"
          />
        )}

        {isSectionVisible("certifications") && certifications.length > 0 && (
          <PortfolioListSection
            id="certifications"
            eyebrow="Professional Development"
            title="Certifications"
            items={certifications}
            type="certification"
          />
        )}

        {professionalTitles.length > 1 && (
          <section className="portfolio-view-section">
            <header className="portfolio-view-section-header">
              <span>Professional Identity</span>

              <h2>Areas of Expertise</h2>
            </header>

            <div className="portfolio-view-title-cards">
              {professionalTitles.map((professionalTitle, index) => (
                <article
                  key={
                    professionalTitle.id || `${professionalTitle.name}-${index}`
                  }
                  className="portfolio-view-title-card"
                >
                  <div aria-hidden="true">✦</div>

                  <span>
                    {index === 0 ? "Primary Title" : "Professional Title"}
                  </span>

                  <h3>{professionalTitle.name}</h3>
                </article>
              ))}
            </div>
          </section>
        )}

        {isSectionVisible("resume") && featuredResume && (
          <section id="resume" className="portfolio-view-section">
            <header className="portfolio-view-section-header">
              <span>Career Document</span>

              <h2>Featured Résumé</h2>
            </header>

            <article className="portfolio-view-resume-card">
              <div className="portfolio-view-resume-icon" aria-hidden="true">
                CV
              </div>

              <div className="portfolio-view-resume-content">
                <span>{featuredResume.template || "Professional"} résumé</span>

                <h3>{featuredResume.resumeName || "Professional Résumé"}</h3>

                {featuredResume.targetRole && (
                  <p>{featuredResume.targetRole}</p>
                )}
              </div>

              {featuredResume.isSharedOnline && featuredResume.publicSlug && (
                <a
                  href={`/resumes/${featuredResume.publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Résumé
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </article>

            {!featuredResume.isSharedOnline && (
              <p className="portfolio-view-resume-private">
                This résumé is displayed on the portfolio, but its public résumé
                page is not enabled.
              </p>
            )}
          </section>
        )}

        {hasContactInformation && (
          <section id="contact" className="portfolio-view-section">
            <header className="portfolio-view-section-header">
              <span>Get in Touch</span>

              <h2>Contact Information</h2>
            </header>

            <div className="portfolio-view-contact-grid">
              {emails.map((email) => (
                <article key={email.id} className="portfolio-view-contact-card">
                  <div className="portfolio-view-contact-icon">@</div>

                  <div>
                    <span>{email.type || "Professional"} email</span>

                    <a href={`mailto:${email.value}`}>{email.value}</a>

                    {email.description && <p>{email.description}</p>}
                  </div>
                </article>
              ))}

              {phones.map((phone) => (
                <article key={phone.id} className="portfolio-view-contact-card">
                  <div className="portfolio-view-contact-icon">☎</div>

                  <div>
                    <span>{phone.type || "Professional"} phone</span>

                    <a href={`tel:${getPhoneLink(phone.value)}`}>
                      {phone.value}
                    </a>

                    {phone.description && <p>{phone.description}</p>}
                  </div>
                </article>
              ))}

              {websites.map((website) => (
                <article
                  key={website.id}
                  className="portfolio-view-contact-card"
                >
                  <div className="portfolio-view-contact-icon">↗</div>

                  <div>
                    <span>{website.type || "Professional"} website</span>

                    <a
                      href={getExternalUrl(website.value)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {getReadableUrl(website.value)}
                    </a>

                    {website.description && <p>{website.description}</p>}
                  </div>
                </article>
              ))}

              {locations.map((location) => (
                <article
                  key={location.id}
                  className="portfolio-view-contact-card"
                >
                  <div className="portfolio-view-contact-icon">⌖</div>

                  <div>
                    <span>{location.type || "Professional"} location</span>

                    <strong>{location.value}</strong>

                    {location.description && <p>{location.description}</p>}
                  </div>
                </article>
              ))}
            </div>

            {socialLinks.length > 0 && (
              <div className="portfolio-view-social-links">
                {socialLinks.map((socialLink) => (
                  <a
                    key={socialLink.id}
                    href={getExternalUrl(socialLink.value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`portfolio-view-social-link portfolio-view-social-link--${socialLink.type}`}
                  >
                    <span aria-hidden="true">
                      {getSocialIcon(socialLink.type)}
                    </span>

                    <div>
                      <strong>{socialLink.type}</strong>

                      <small>{getReadableUrl(socialLink.value)}</small>
                    </div>

                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="portfolio-view-footer">
        <p>
          © {new Date().getFullYear()} {selectedName || "Portfolio Owner"}
        </p>

        <a href="#top">Back to top ↑</a>
      </footer>
    </div>
  );
}

function PortfolioListSection({ id, eyebrow, title, items, type }) {
  return (
    <section id={id} className="portfolio-view-section">
      <header className="portfolio-view-section-header">
        <span>{eyebrow}</span>

        <h2>{title}</h2>
      </header>

      <div className="portfolio-view-entry-list">
        {items.map((item, index) => (
          <PortfolioEntry
            key={item?.id || `${type}-${index}`}
            item={item}
            type={type}
          />
        ))}
      </div>
    </section>
  );
}

function PortfolioEntry({ item, type }) {
  const configuration = {
    experience: {
      title: getItemText(item, ["position", "title", "role"]),
      subtitle: getItemText(item, ["company", "organization", "employer"]),
    },

    project: {
      title: getItemText(item, ["name", "title"]),
      subtitle: getItemText(item, ["organization", "role"]),
    },

    education: {
      title: getItemText(item, ["degree", "program", "title"]),
      subtitle: getItemText(item, ["institution", "school", "organization"]),
    },

    certification: {
      title: getItemText(item, ["name", "title"]),
      subtitle: getItemText(item, ["issuingOrganization", "organization"]),
    },
  }[type];

  const description = getItemText(item, ["description", "summary"]);

  const location = getItemText(item, ["location"]);

  const startDate = getItemText(item, ["startDate", "issueDate"]);

  const endDate = item?.isCurrent
    ? "Present"
    : getItemItemText(item, ["endDate", "expirationDate"]);

  const url = getItemText(item, [
    "url",
    "projectUrl",
    "credentialUrl",
    "website",
  ]);

  return (
    <article className="portfolio-view-entry">
      <header>
        <div>
          <h3>{configuration.title || "Professional Information"}</h3>

          {configuration.subtitle && <p>{configuration.subtitle}</p>}
        </div>

        {(startDate || endDate) && (
          <span>{[startDate, endDate].filter(Boolean).join(" – ")}</span>
        )}
      </header>

      {location && <small>{location}</small>}

      {description && <p>{description}</p>}

      {url && (
        <a href={getExternalUrl(url)} target="_blank" rel="noopener noreferrer">
          View details
          <span aria-hidden="true">↗</span>
        </a>
      )}
    </article>
  );
}

function getSocialIcon(type) {
  const icons = {
    linkedin: "in",
    github: "GH",
    youtube: "YT",
    facebook: "f",
    instagram: "IG",
    x: "X",
  };

  return icons[type] || "↗";
}

export default PortfolioView;
