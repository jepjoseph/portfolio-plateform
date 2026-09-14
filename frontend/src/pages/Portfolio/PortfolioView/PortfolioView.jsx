import { useEffect, useMemo, useState } from "react";

import {
  getProjectCategoryLabel,
  getProjectLifecycleStatusLabel,
  getProjectOwnershipLabel,
} from "../../../config/projectConfig.js";

import {
  createProjectAssetUrl,
  revokeProjectAssetUrl,
} from "../../../services/Project/projectAssetStorage.js";

import {
  getProjectDateRange,
  getProjectFeaturedMedia,
} from "../../../services/Project/projectUtils.js";

import PortfolioHero from "../components/PortfolioHero/PortfolioHero";
import PortfolioNavigation from "../components/PortfolioNavigation/PortfolioNavigation";

import "./PortfolioView.css";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

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

function getNestedValue(source, path) {
  return String(path || "")
    .split(".")
    .reduce((currentValue, fieldName) => {
      if (
        currentValue === null ||
        currentValue === undefined ||
        typeof currentValue !== "object"
      ) {
        return undefined;
      }

      return currentValue[fieldName];
    }, source);
}

function getItemText(item, fields = []) {
  if (typeof item === "string") {
    return item.trim();
  }

  for (const field of fields) {
    const value = field.includes(".")
      ? getNestedValue(item, field)
      : item?.[field];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

/*
 * =========================================
 * Portfolio View
 * =========================================
 */

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
          <section id="projects" className="portfolio-view-section">
            <header className="portfolio-view-section-header">
              <span>Selected Work</span>

              <h2>Projects</h2>

              <p>
                Professional case studies demonstrating technical capability,
                problem solving, implementation, and measurable results.
              </p>
            </header>

            <div
              className="portfolio-view-projects"
              role="list"
              aria-label="Portfolio Projects"
            >
              {projects.map((project, index) => (
                <PortfolioProjectEntry
                  key={project?.id || `project-${index}`}
                  project={project}
                />
              ))}
            </div>
          </section>
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

/*
 * =========================================
 * Portfolio Project Entry
 * =========================================
 */

function PortfolioProjectEntry({ project }) {
  const featuredMedia = useMemo(
    () => getProjectFeaturedMedia(project),
    [project],
  );

  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaError, setMediaError] = useState(false);

  useEffect(() => {
    let isActive = true;
    let createdUrl = "";

    setMediaUrl("");
    setMediaError(false);

    if (!featuredMedia?.storageKey) {
      setMediaUrl(featuredMedia?.externalUrl || "");

      return undefined;
    }

    createProjectAssetUrl(featuredMedia.storageKey)
      .then((url) => {
        createdUrl = url;

        if (isActive) {
          setMediaUrl(url);
        } else {
          revokeProjectAssetUrl(url);
        }
      })
      .catch(() => {
        if (isActive) {
          setMediaError(true);
        }
      });

    return () => {
      isActive = false;

      revokeProjectAssetUrl(createdUrl);
    };
  }, [featuredMedia?.storageKey, featuredMedia?.externalUrl]);

  const title = project?.title || "Untitled Project";

  const organizationName =
    project?.organization?.name || project?.organization?.clientName || "";

  const summary =
    project?.presentation?.shortSummary ||
    project?.solution?.overview ||
    project?.problem?.statement ||
    "";

  const liveUrl =
    project?.links?.liveUrl ||
    project?.links?.caseStudyUrl ||
    project?.links?.repositoryUrl ||
    "";

  const technologies = Array.isArray(project?.technologies)
    ? project.technologies.filter((technology) => technology?.name).slice(0, 6)
    : [];

  const skillCount = Array.isArray(project?.skillRelationships)
    ? project.skillRelationships.length
    : 0;

  const isVideo =
    featuredMedia?.type === "video" ||
    featuredMedia?.mimeType?.startsWith("video/");

  return (
    <article className="portfolio-view-project" role="listitem">
      <div className="portfolio-view-project-media">
        {mediaUrl && !mediaError && isVideo && (
          <video
            src={mediaUrl}
            muted
            playsInline
            preload="metadata"
            onError={() => setMediaError(true)}
            aria-label={`Video preview for ${title}`}
          />
        )}

        {mediaUrl && !mediaError && !isVideo && (
          <img
            src={mediaUrl}
            alt={
              featuredMedia?.altText ||
              featuredMedia?.caption ||
              featuredMedia?.name ||
              `${title} preview`
            }
            onError={() => setMediaError(true)}
          />
        )}

        {(!mediaUrl || mediaError) && (
          <div className="portfolio-view-project-placeholder">
            <small>Project</small>

            <strong>{title.slice(0, 1).toUpperCase()}</strong>
          </div>
        )}

        {project?.presentation?.isFeatured && (
          <span className="portfolio-view-project-featured">Featured</span>
        )}
      </div>

      <div className="portfolio-view-project-content">
        <div className="portfolio-view-project-labels">
          <span>{getProjectCategoryLabel(project?.category)}</span>

          <span>
            {getProjectLifecycleStatusLabel(project?.lifecycleStatus)}
          </span>
        </div>

        <header>
          <h3>{title}</h3>

          <p>
            {project?.role || "Role not specified"}

            {organizationName && ` · ${organizationName}`}
          </p>
        </header>

        {summary && <p className="portfolio-view-project-summary">{summary}</p>}

        <div className="portfolio-view-project-details">
          {project?.dates && (
            <span>
              <small>Timeline</small>

              <strong>{getProjectDateRange(project)}</strong>
            </span>
          )}

          <span>
            <small>Ownership</small>

            <strong>{getProjectOwnershipLabel(project?.ownership)}</strong>
          </span>

          {skillCount > 0 && (
            <span>
              <small>Related Skills</small>

              <strong>{skillCount}</strong>
            </span>
          )}
        </div>

        {technologies.length > 0 && (
          <div
            className="portfolio-view-project-technologies"
            aria-label="Project technologies"
          >
            {technologies.map((technology) => (
              <span key={technology.id || technology.name}>
                {technology.name}
              </span>
            ))}
          </div>
        )}

        {liveUrl && (
          <a
            className="portfolio-view-project-link"
            href={getExternalUrl(liveUrl)}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Project
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}

/*
 * =========================================
 * Generic Portfolio List
 * =========================================
 */

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

/*
 * =========================================
 * Generic Portfolio Entry
 * =========================================
 */

function PortfolioEntry({ item, type }) {
  const configuration = {
    experience: {
      title: getItemText(item, [
        "position.title",
        "jobTitle",
        "position",
        "title",
        "role",
      ]),

      subtitle: getItemText(item, [
        "organization.name",
        "company",
        "organization",
        "employer",
      ]),
    },

    education: {
      title: getItemText(item, [
        "credential.name",
        "degree",
        "program",
        "title",
      ]),

      subtitle: getItemText(item, [
        "institution.name",
        "institution",
        "school",
        "organization",
      ]),
    },

    certification: {
      title: getItemText(item, ["name", "title"]),

      subtitle: getItemText(item, [
        "issuingOrganization.name",
        "issuingOrganization",
        "organization",
      ]),
    },
  }[type] || {
    title: "",
    subtitle: "",
  };

  const description = getItemText(item, [
    "description",
    "summary",
    "responsibilities",
  ]);

  const location = getItemText(item, ["location.displayValue", "location"]);

  const startDate = getItemText(item, [
    "dates.startDate",
    "startDate",
    "issueDate",
  ]);

  const isCurrent =
    item?.dates?.isCurrent === true ||
    item?.isCurrent === true ||
    item?.current === true;

  const endDate = isCurrent
    ? "Present"
    : getItemText(item, ["dates.endDate", "endDate", "expirationDate"]);

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

/*
 * =========================================
 * Social Icons
 * =========================================
 */

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
