import { useState } from "react";

import {
  createEmptySkillUsage,
  formatSkillLastUsedDate,
  getSkillCategoryDisplay,
  getSkillCompleteness,
  getSkillProficiencyDisplay,
  getSkillSourceDisplay,
  getSkillTypeDisplay,
  getSkillUsageSummary,
  isSkillInUse,
} from "../../../../services/Skill/skillUtils.js";

import "./SkillItem.css";

function SkillItem({
  skill,
  usage,
  isWorking = false,
  isUsageLoading = false,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!skill) {
    return null;
  }

  const resolvedUsage = usage || createEmptySkillUsage(skill.id);

  const isInUse = isSkillInUse(resolvedUsage);

  const usageValue = (value) => (isUsageLoading ? "—" : value);

  const completeness = getSkillCompleteness(skill);

  const category = getSkillCategoryDisplay(skill);

  const type = getSkillTypeDisplay(skill);

  const proficiency = getSkillProficiencyDisplay(skill);

  const source = getSkillSourceDisplay(skill);

  const lastUsedDate = formatSkillLastUsedDate(skill.proficiency?.lastUsedDate);

  const yearsOfExperience = skill.proficiency?.yearsOfExperience;

  const hasYearsOfExperience =
    yearsOfExperience !== null &&
    yearsOfExperience !== undefined &&
    yearsOfExperience !== "";

  const aliases = Array.isArray(skill.aliases)
    ? skill.aliases.filter(Boolean)
    : [];

  const isArchived = skill.status === "archived";

  const hasAdditionalDetails = Boolean(
    skill.description ||
    aliases.length > 0 ||
    hasYearsOfExperience ||
    lastUsedDate ||
    skill.notes ||
    skill.sourceContext ||
    resolvedUsage.experienceCount > 0,
  );

  return (
    <article
      className={`skill-item ${isExpanded ? "skill-item--expanded" : ""} ${
        isArchived ? "skill-item--archived" : ""
      }`}
    >
      <header className="skill-item-summary">
        <div className="skill-item-icon" aria-hidden="true">
          {isArchived ? "□" : "✦"}
        </div>

        <div className="skill-item-heading">
          <div className="skill-item-labels">
            <span>{category}</span>
            <span>{type}</span>

            {(skill.type === "language" || skill.proficiency?.level) && (
              <span>{proficiency}</span>
            )}

            {isArchived && (
              <span className="skill-item-archived-label">Archived</span>
            )}
          </div>

          <h3>{skill.name}</h3>

          {skill.description && <p>{skill.description}</p>}

          <div className="skill-item-summary-meta">
            {hasYearsOfExperience && (
              <span>
                <strong>{yearsOfExperience}</strong>{" "}
                {Number(yearsOfExperience) === 1 ? "year" : "years"} of
                experience
              </span>
            )}

            {lastUsedDate && (
              <span>
                Last used <strong>{lastUsedDate}</strong>
              </span>
            )}

            <span>
              <strong>{completeness.percentage}%</strong> complete
            </span>
          </div>
        </div>

        <div className="skill-item-actions">
          {hasAdditionalDetails && (
            <button
              type="button"
              className="skill-item-view-button"
              onClick={() => setIsExpanded((current) => !current)}
              disabled={isWorking}
              aria-expanded={isExpanded}
            >
              {isExpanded ? "Hide Details" : "View"}
            </button>
          )}

          {!isArchived && (
            <button
              type="button"
              onClick={() => onEdit?.(skill)}
              disabled={isWorking}
            >
              Edit
            </button>
          )}

          {isArchived ? (
            <button
              type="button"
              onClick={() => onRestore?.(skill)}
              disabled={isWorking}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onArchive?.(skill)}
              disabled={isWorking}
            >
              Archive
            </button>
          )}

          <button
            type="button"
            className="skill-item-delete-button"
            onClick={() => onDelete?.(skill)}
            disabled={isWorking || isUsageLoading || isInUse}
            aria-disabled={isUsageLoading || isInUse}
            title={
              isInUse
                ? "This skill is still used by an experience. Archive it instead."
                : "Permanently delete this skill"
            }
          >
            {isInUse ? "In Use" : "Delete"}
          </button>
        </div>
      </header>

      {isWorking && (
        <div className="skill-item-operation" role="status" aria-live="polite">
          <span aria-hidden="true" />

          <small>Updating skill...</small>
        </div>
      )}

      <section
        className="skill-item-usage"
        aria-label={`${skill.name} usage`}
        aria-busy={isUsageLoading}
      >
        <header className="skill-item-usage-header">
          <div>
            <span>Library Usage</span>

            <strong>
              {isUsageLoading
                ? "Checking relationships"
                : getSkillUsageSummary(resolvedUsage)}
            </strong>
          </div>

          <span
            className={`skill-item-usage-total ${
              isInUse ? "skill-item-usage-total--used" : ""
            }`}
          >
            {usageValue(resolvedUsage.total)}
          </span>
        </header>

        <div className="skill-item-usage-list">
          <div>
            <span>Experience</span>

            <strong>{usageValue(resolvedUsage.experienceCount)}</strong>
          </div>

          <div>
            <span>Résumé</span>

            <strong>{usageValue(resolvedUsage.resumeCount)}</strong>
          </div>

          <div>
            <span>Portfolio</span>

            <strong>{usageValue(resolvedUsage.portfolioCount)}</strong>
          </div>
        </div>

        {!isUsageLoading && resolvedUsage.experienceCount > 0 && (
          <>
            <div className="skill-item-usage-types">
              <span>
                Used as a skill
                <strong>{resolvedUsage.experienceSkillCount}</strong>
              </span>

              <span>
                Used as a technology
                <strong>{resolvedUsage.experienceTechnologyCount}</strong>
              </span>
            </div>

            <ul className="skill-item-experience-list">
              {resolvedUsage.experiences.map((experience) => (
                <li key={experience.id}>
                  <div>
                    <strong>{experience.positionTitle}</strong>

                    <span>{experience.organizationName}</span>
                  </div>

                  <div className="skill-item-experience-types">
                    {experience.usedAsSkill && <small>Skill</small>}

                    {experience.usedAsTechnology && <small>Technology</small>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {isUsageLoading ? (
          <small role="status">Checking Skill Library relationships...</small>
        ) : (
          !isInUse && (
            <small>
              This skill is not currently connected to an Experience, Résumé, or
              Portfolio.
            </small>
          )
        )}
      </section>

      {isExpanded && (
        <div className="skill-item-details">
          <div className="skill-item-detail-grid">
            <Detail label="Category" value={category} />

            <Detail label="Skill Type" value={type} />

            <Detail label="Proficiency" value={proficiency} />

            <Detail label="Record Source" value={source} />

            {hasYearsOfExperience && (
              <Detail
                label="Years of Experience"
                value={`${yearsOfExperience}`}
              />
            )}

            {lastUsedDate && <Detail label="Last Used" value={lastUsedDate} />}

            {skill.sourceContext && (
              <Detail label="Source Context" value={skill.sourceContext} />
            )}

            <Detail
              label="Record Status"
              value={isArchived ? "Archived" : "Active"}
            />
          </div>

          {aliases.length > 0 && (
            <section className="skill-item-aliases">
              <span>Alternative Names</span>

              <div>
                {aliases.map((alias, index) => (
                  <small key={`${alias}-${index}`}>{alias}</small>
                ))}
              </div>
            </section>
          )}

          {skill.description && (
            <section className="skill-item-description">
              <span>Professional Description</span>

              <p>{skill.description}</p>
            </section>
          )}

          {skill.notes && (
            <section className="skill-item-private-notes">
              <header>
                <span>Private Notes</span>

                <small>Not public</small>
              </header>

              <p>{skill.notes}</p>
            </section>
          )}

          <section className="skill-item-completeness">
            <header>
              <div>
                <span>Record Quality</span>

                <strong>{completeness.label}</strong>
              </div>

              <strong>{completeness.percentage}%</strong>
            </header>

            <div className="skill-item-completeness-progress">
              <span
                style={{
                  width: `${completeness.percentage}%`,
                }}
              />
            </div>

            {completeness.missingChecks.length > 0 && (
              <div className="skill-item-missing">
                <span>Suggested improvements</span>

                <ul>
                  {completeness.missingChecks.map((check) => (
                    <li key={check.id}>Add {check.label.toLowerCase()}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <footer className="skill-item-details-footer">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              disabled={isWorking}
            >
              Hide Details
            </button>

            {!isArchived && (
              <button
                type="button"
                className="skill-item-details-edit"
                onClick={() => onEdit?.(skill)}
                disabled={isWorking}
              >
                Edit This Skill
              </button>
            )}
          </footer>
        </div>
      )}
    </article>
  );
}

function Detail({ label, value }) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div className="skill-item-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default SkillItem;
