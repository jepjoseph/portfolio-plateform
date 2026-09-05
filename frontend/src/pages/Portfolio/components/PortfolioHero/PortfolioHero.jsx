import "./PortfolioHero.css";

const DEFAULT_HERO_SETTINGS = {
  eyebrow: "Professional Portfolio",
  tagline: "",
  availability: {
    isAvailable: false,
    label: "",
  },
  showLocation: true,
  showSocialLinks: true,
  showWebsiteButton: true,
  showContactButton: true,
  showProjectsButton: true,
  showResumeButton: true,
  featuredResumeId: "",
};

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

function getInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "P";
}

function getSocialLabel(type) {
  const labels = {
    linkedin: "LinkedIn",
    github: "GitHub",
    youtube: "YouTube",
    facebook: "Facebook",
    instagram: "Instagram",
    x: "X",
  };

  return labels[type] || "Profile";
}

function PortfolioHero({
  portfolio = {},
  selectedProfile = {},
  profilePictureUrl = "",
  headerBackgroundUrl = "",
  selectedProfilePicture = null,
}) {
  const {
    selectedName = "",
    professionalTitles = [],
    emails = [],
    websites = [],
    locations = [],
    socialLinks = [],
  } = selectedProfile;

  const savedHeroSettings = portfolio.heroSettings || {};

  const heroSettings = {
    ...DEFAULT_HERO_SETTINGS,
    ...savedHeroSettings,

    availability: {
      ...DEFAULT_HERO_SETTINGS.availability,
      ...savedHeroSettings.availability,
    },
  };

  const primaryTitle = professionalTitles[0];
  const primaryLocation = locations[0];
  const primaryEmail = emails[0];
  const primaryWebsite = websites[0];

  const hasProjects =
    portfolio.sectionVisibility?.projects !== false &&
    Array.isArray(portfolio.projects) &&
    portfolio.projects.length > 0;

  /*
   * The résumé section has not been implemented
   * yet. Do not display a link to a missing target.
   */

  const hasResume =
    Boolean(heroSettings.featuredResumeId) && Boolean(portfolio.featuredResume);

  const hasActions =
    (heroSettings.showProjectsButton && hasProjects) ||
    (heroSettings.showResumeButton && hasResume) ||
    (heroSettings.showContactButton && primaryEmail) ||
    (heroSettings.showWebsiteButton && primaryWebsite);

  return (
    <section
      id="home"
      className={`portfolio-hero ${
        headerBackgroundUrl ? "portfolio-hero--has-background" : ""
      }`}
      aria-labelledby="portfolio-hero-name"
    >
      {headerBackgroundUrl && (
        <img
          className="portfolio-hero-background"
          src={headerBackgroundUrl}
          alt=""
          aria-hidden="true"
        />
      )}

      <div className="portfolio-hero-overlay" aria-hidden="true" />

      <div className="portfolio-hero-decoration" aria-hidden="true" />

      <div className="portfolio-hero-main">
        <div className="portfolio-hero-picture">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt={
                selectedProfilePicture?.description ||
                `${selectedName || "Portfolio owner"} professional profile`
              }
            />
          ) : (
            <span aria-hidden="true">{getInitials(selectedName)}</span>
          )}
        </div>

        <div className="portfolio-hero-identity">
          <span className="portfolio-hero-eyebrow">{heroSettings.eyebrow}</span>

          <h1 id="portfolio-hero-name">{selectedName || "Portfolio Owner"}</h1>

          <p className="portfolio-hero-title">
            {primaryTitle?.name || "Professional Title"}
          </p>

          {heroSettings.tagline && (
            <p className="portfolio-hero-tagline">{heroSettings.tagline}</p>
          )}

          <div className="portfolio-hero-meta">
            {heroSettings.showLocation && primaryLocation?.value && (
              <span className="portfolio-hero-location">
                <span aria-hidden="true">⌖</span>

                {primaryLocation.value}
              </span>
            )}

            {heroSettings.availability.isAvailable &&
              heroSettings.availability.label && (
                <span className="portfolio-hero-availability">
                  {heroSettings.availability.label}
                </span>
              )}
          </div>

          {heroSettings.showSocialLinks && socialLinks.length > 0 && (
            <div
              className="portfolio-hero-socials"
              aria-label="Professional profiles"
            >
              {socialLinks.map((socialLink) => (
                <a
                  key={socialLink.id}
                  href={getExternalUrl(socialLink.value)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getSocialLabel(socialLink.type)}

                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {hasActions && (
        <div className="portfolio-hero-actions">
          {heroSettings.showProjectsButton && hasProjects && (
            <a
              href="#projects"
              className="portfolio-hero-button portfolio-hero-button--primary"
            >
              View Projects
            </a>
          )}

          {heroSettings.showResumeButton && hasResume && (
            <a href="#resume" className="portfolio-hero-button">
              View Résumé
            </a>
          )}

          {heroSettings.showContactButton && primaryEmail?.value && (
            <a
              href="#contact"
              className={
                hasProjects
                  ? "portfolio-hero-button"
                  : "portfolio-hero-button portfolio-hero-button--primary"
              }
            >
              Contact Me
            </a>
          )}

          {heroSettings.showWebsiteButton && primaryWebsite?.value && (
            <a
              href={getExternalUrl(primaryWebsite.value)}
              target="_blank"
              rel="noopener noreferrer"
              className="portfolio-hero-button"
            >
              Visit Website
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      )}
    </section>
  );
}

export default PortfolioHero;
