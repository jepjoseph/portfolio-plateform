import "./ExperienceCard.css";

/*
 * =========================================
 * Display Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatOptionValue(value) {
  return getText(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMonthYear(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return "";
  }

  const [year, month] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getDateRange(experience) {
  const startDate = formatMonthYear(experience.dates?.startDate);

  const endDate = experience.dates?.isCurrent
    ? "Present"
    : formatMonthYear(experience.dates?.endDate);

  if (startDate && endDate) {
    return `${startDate} – ${endDate}`;
  }

  return startDate || endDate || "Dates not provided";
}

function getLocation(experience) {
  const location = experience.location || {};

  return [location.city, location.state, location.country]
    .map(getText)
    .filter(Boolean)
    .join(", ");
}

function getResponsibilityText(responsibility) {
  if (typeof responsibility === "string") {
    return responsibility.trim();
  }

  return getText(responsibility?.text);
}

function getAchievementInformation(achievement) {
  if (typeof achievement === "string") {
    return {
      text: achievement.trim(),
      metric: "",
    };
  }

  return {
    text: getText(achievement?.text),
    metric: getText(achievement?.metric || achievement?.measurableResult),
  };
}

function getSkillName(skill) {
  if (typeof skill === "string") {
    return skill.trim();
  }

  return getText(skill?.nameSnapshot || skill?.name || skill?.label);
}

function getTechnologyName(technology) {
  if (typeof technology === "string") {
    return technology.trim();
  }

  return getText(
    technology?.nameSnapshot ||
      technology?.name ||
      technology?.label ||
      technology?.value,
  );
}

/*
 * =========================================
 * Detail Group
 * =========================================
 */

function ExperienceDetailGroup({ eyebrow, title, children, className = "" }) {
  return (
    <section className={`experience-card-detail-group ${className}`}>
      <header>
        <span>{eyebrow}</span>

        <h4>{title}</h4>
      </header>

      {children}
    </section>
  );
}

/*
 * =========================================
 * Experience Card
 * =========================================
 */

function ExperienceCard({
  experience,
  isExpanded = false,
  isWorking = false,
  onToggleView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const positionTitle =
    getText(experience.position?.title) || "Untitled Position";

  const organizationName =
    getText(experience.organization?.name) || "Organization not provided";

  const responsibilities = (experience.responsibilities || [])
    .map(getResponsibilityText)
    .filter(Boolean);

  const achievements = (experience.achievements || [])
    .map(getAchievementInformation)
    .filter((achievement) => achievement.text);

  const skills = (experience.skills || []).map(getSkillName).filter(Boolean);

  const technologies = (experience.technologies || [])
    .map(getTechnologyName)
    .filter(Boolean);

  const overview = getText(experience.overview);

  const leadershipDescription = getText(experience.leadership?.description);

  const location = getLocation(experience);

  const isArchived = experience.status === "archived";

  const employmentType = formatOptionValue(experience.position?.employmentType);

  const workArrangement = formatOptionValue(
    experience.position?.workArrangement,
  );

  return (
    <article
      className={`experience-card ${
        isExpanded ? "experience-card--expanded" : ""
      } ${isArchived ? "experience-card--archived" : ""}`}
    >
      <header className="experience-card-summary">
        <div className="experience-card-marker">
          <span aria-hidden="true">{isArchived ? "□" : "✦"}</span>
        </div>

        <div className="experience-card-heading">
          <div className="experience-card-status-row">
            <span
              className={`experience-card-status ${
                experience.dates?.isCurrent
                  ? "experience-card-status--current"
                  : ""
              }`}
            >
              {isArchived
                ? "Archived"
                : experience.dates?.isCurrent
                  ? "Current Position"
                  : "Previous Position"}
            </span>

            {experience.visibility?.showOnResume && (
              <span className="experience-card-usage-badge">Résumé</span>
            )}

            {experience.visibility?.showOnPortfolio && (
              <span className="experience-card-usage-badge">Portfolio</span>
            )}
          </div>

          <h3>{positionTitle}</h3>

          <p>{organizationName}</p>

          <div className="experience-card-primary-meta">
            <span>{getDateRange(experience)}</span>

            {location && <span>{location}</span>}

            {employmentType && <span>{employmentType}</span>}

            {workArrangement && <span>{workArrangement}</span>}
          </div>
        </div>

        <div className="experience-card-actions">
          <button
            type="button"
            className="experience-card-view-button"
            onClick={() => onToggleView?.(experience.id)}
            disabled={isWorking}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Hide Details" : "View"}
          </button>

          {!isArchived && (
            <button
              type="button"
              onClick={() => onEdit?.(experience)}
              disabled={isWorking}
            >
              Edit
            </button>
          )}

          {isArchived ? (
            <button
              type="button"
              onClick={() => onRestore?.(experience)}
              disabled={isWorking}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onArchive?.(experience)}
              disabled={isWorking}
            >
              Archive
            </button>
          )}

          <button
            type="button"
            className="experience-card-delete-button"
            onClick={() => onDelete?.(experience)}
            disabled={isWorking}
          >
            Delete
          </button>
        </div>
      </header>

      {isWorking && (
        <div className="experience-card-operation" role="status">
          <span aria-hidden="true" />

          <small>Updating experience...</small>
        </div>
      )}

      {isExpanded && (
        <div className="experience-card-details">
          {overview && (
            <ExperienceDetailGroup
              eyebrow="Professional Focus"
              title="Experience Overview"
              className="experience-card-detail-group--full"
            >
              <p className="experience-card-overview">{overview}</p>

              {experience.overviewMeta?.source === "ai" && (
                <span className="experience-card-ai-label">AI assisted</span>
              )}
            </ExperienceDetailGroup>
          )}

          {responsibilities.length > 0 && (
            <ExperienceDetailGroup
              eyebrow="Primary Work"
              title="Responsibilities"
            >
              <ul>
                {responsibilities.map((responsibility, index) => (
                  <li key={`${responsibility}-${index}`}>{responsibility}</li>
                ))}
              </ul>
            </ExperienceDetailGroup>
          )}

          {achievements.length > 0 && (
            <ExperienceDetailGroup
              eyebrow="Professional Impact"
              title="Achievements and Results"
            >
              <ul>
                {achievements.map((achievement, index) => (
                  <li key={`${achievement.text}-${index}`}>
                    <span>{achievement.text}</span>

                    {achievement.metric && (
                      <strong>{achievement.metric}</strong>
                    )}
                  </li>
                ))}
              </ul>
            </ExperienceDetailGroup>
          )}

          {skills.length > 0 && (
            <ExperienceDetailGroup eyebrow="Capabilities" title="Skills">
              <div className="experience-card-tags">
                {skills.map((skill, index) => (
                  <span key={`${skill}-${index}`}>{skill}</span>
                ))}
              </div>
            </ExperienceDetailGroup>
          )}

          {technologies.length > 0 && (
            <ExperienceDetailGroup
              eyebrow="Tools and Systems"
              title="Technologies"
            >
              <div className="experience-card-tags">
                {technologies.map((technology, index) => (
                  <span key={`${technology}-${index}`}>{technology}</span>
                ))}
              </div>
            </ExperienceDetailGroup>
          )}

          {leadershipDescription && (
            <ExperienceDetailGroup
              eyebrow="Collaboration"
              title="Leadership"
              className="experience-card-detail-group--full"
            >
              <p>{leadershipDescription}</p>

              {experience.leadership?.peopleManaged !== null &&
                experience.leadership?.peopleManaged !== undefined &&
                experience.leadership?.peopleManaged !== "" && (
                  <small>
                    People managed: {experience.leadership.peopleManaged}
                  </small>
                )}
            </ExperienceDetailGroup>
          )}

          {!overview &&
            responsibilities.length === 0 &&
            achievements.length === 0 &&
            skills.length === 0 &&
            technologies.length === 0 &&
            !leadershipDescription && (
              <div className="experience-card-no-details">
                <p>
                  This experience does not contain additional display
                  information.
                </p>
              </div>
            )}

          <footer className="experience-card-details-footer">
            <button
              type="button"
              onClick={() => onToggleView?.(experience.id)}
              disabled={isWorking}
            >
              Hide Details
            </button>

            {!isArchived && (
              <button
                type="button"
                className="experience-card-details-edit"
                onClick={() => onEdit?.(experience)}
                disabled={isWorking}
              >
                Edit This Experience
              </button>
            )}
          </footer>
        </div>
      )}
    </article>
  );
}

export default ExperienceCard;
