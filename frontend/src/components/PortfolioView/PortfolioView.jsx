import "./PortfolioView.css";

function getExternalUrl(value) {
  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function getInitials(name) {
  if (!name) {
    return "P";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getReadableUrl(value) {
  if (!value) {
    return "";
  }

  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function getPhoneLink(value) {
  return value.replace(/[^\d+]/g, "");
}

function PortfolioView({ portfolio }) {
  if (!portfolio) {
    return null;
  }

  const {
    selectedProfile = {},
    summary = "",
    sectionVisibility = {},
  } = portfolio;

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

  const primaryTitle = professionalTitles[0];
  const primaryLocation = locations[0];
  const primaryEmail = emails[0];

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

  const profilePictureUrl =
    selectedProfilePicture?.imageUrl ||
    selectedProfilePicture?.fileUrl ||
    selectedProfilePicture?.url ||
    "";

  const headerBackgroundUrl =
    selectedHeaderBackground?.imageUrl ||
    selectedHeaderBackground?.fileUrl ||
    selectedHeaderBackground?.url ||
    "";

  const portfolioBackgroundUrl =
    selectedPortfolioBackground?.imageUrl ||
    selectedPortfolioBackground?.fileUrl ||
    selectedPortfolioBackground?.url ||
    "";

  const isSectionVisible = (sectionName) => {
    return sectionVisibility[sectionName] !== false;
  };

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
      {/* =========================================
          Hero
          ========================================= */}

      <header
        className={`portfolio-view-hero ${
          headerBackgroundUrl ? "portfolio-view-hero--has-background" : ""
        }`}
      >
        {headerBackgroundUrl && (
          <img
            className="portfolio-view-hero-background"
            src={headerBackgroundUrl}
            alt=""
            aria-hidden="true"
          />
        )}

        <div className="portfolio-view-hero-decoration" aria-hidden="true" />

        <div className="portfolio-view-hero-content">
          {/* Profile Picture */}

          <div className="portfolio-view-profile-picture">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={
                  selectedProfilePicture?.description ||
                  `${selectedName || "Portfolio owner"} profile`
                }
              />
            ) : (
              <span aria-hidden="true">{getInitials(selectedName)}</span>
            )}
          </div>

          {/* Identity */}

          <div className="portfolio-view-identity">
            <span className="portfolio-view-availability">
              Professional Portfolio
            </span>

            <h1>{selectedName || "Portfolio Owner"}</h1>

            {primaryTitle && (
              <p className="portfolio-view-primary-title">
                {primaryTitle.name}
              </p>
            )}

            {primaryLocation && (
              <div className="portfolio-view-primary-location">
                <span aria-hidden="true">⌖</span>

                <span>{primaryLocation.value}</span>
              </div>
            )}

            {/* Additional Titles */}

            {professionalTitles.length > 1 && (
              <div className="portfolio-view-title-list">
                {professionalTitles.slice(1).map((professionalTitle) => (
                  <span key={professionalTitle.id}>
                    {professionalTitle.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Primary Actions */}

        <div className="portfolio-view-hero-actions">
          {primaryEmail && (
            <a
              className="portfolio-view-contact-button portfolio-view-contact-button--primary"
              href={`mailto:${primaryEmail.value}`}
            >
              Contact Me
            </a>
          )}

          {websites[0] && (
            <a
              className="portfolio-view-contact-button"
              href={getExternalUrl(websites[0].value)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit Website
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </header>

      {/* =========================================
          Portfolio Navigation
          ========================================= */}

      <nav
        className="portfolio-view-navigation"
        aria-label="Portfolio sections"
      >
        <a href="#about">About</a>

        {isSectionVisible("experience") && <a href="#experience">Experience</a>}

        {isSectionVisible("education") && <a href="#education">Education</a>}

        {isSectionVisible("skills") && <a href="#skills">Skills</a>}

        {isSectionVisible("certifications") && (
          <a href="#certifications">Certifications</a>
        )}

        {isSectionVisible("projects") && <a href="#projects">Projects</a>}

        <a href="#contact">Contact</a>
      </nav>

      {/* =========================================
          Main Content
          ========================================= */}

      <main className="portfolio-view-main">
        {/* Professional Summary */}

        {isSectionVisible("summary") && summary && (
          <section id="about" className="portfolio-view-section">
            <header className="portfolio-view-section-header">
              <span>About Me</span>

              <h2>Professional Summary</h2>
            </header>

            <p className="portfolio-view-summary">{summary}</p>
          </section>
        )}

        {/* Professional Titles */}

        {professionalTitles.length > 0 && (
          <section className="portfolio-view-section">
            <header className="portfolio-view-section-header">
              <span>Professional Identity</span>

              <h2>Areas of Expertise</h2>
            </header>

            <div className="portfolio-view-title-cards">
              {professionalTitles.map((professionalTitle, index) => (
                <article
                  key={professionalTitle.id}
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

        {/* Contact Information */}

        {(emails.length > 0 ||
          phones.length > 0 ||
          websites.length > 0 ||
          locations.length > 0 ||
          socialLinks.length > 0) && (
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
                    <span>{email.type} email</span>

                    <a href={`mailto:${email.value}`}>{email.value}</a>

                    {email.description && <p>{email.description}</p>}
                  </div>
                </article>
              ))}

              {phones.map((phone) => (
                <article key={phone.id} className="portfolio-view-contact-card">
                  <div className="portfolio-view-contact-icon">☎</div>

                  <div>
                    <span>{phone.type} phone</span>

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
                    <span>{website.type} website</span>

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
                    <span>{location.type} location</span>

                    <strong>{location.value}</strong>

                    {location.description && <p>{location.description}</p>}
                  </div>
                </article>
              ))}
            </div>

            {/* Social Links */}

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
                    <span>
                      {socialLink.type === "linkedin" && "in"}

                      {socialLink.type === "github" && "GH"}

                      {socialLink.type === "youtube" && "YT"}

                      {socialLink.type === "facebook" && "f"}

                      {socialLink.type === "instagram" && "IG"}

                      {socialLink.type === "x" && "X"}

                      {![
                        "linkedin",
                        "github",
                        "youtube",
                        "facebook",
                        "instagram",
                        "x",
                      ].includes(socialLink.type) && "↗"}
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

      {/* =========================================
          Footer
          ========================================= */}

      <footer className="portfolio-view-footer">
        <p>
          © {new Date().getFullYear()} {selectedName || "Portfolio Owner"}
        </p>

        <a href="#top">Back to top ↑</a>
      </footer>
    </div>
  );
}

export default PortfolioView;
