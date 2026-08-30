import "./PortfolioView.css";

function PortfolioView({ portfolio }) {
  if (!portfolio) {
    return null;
  }

  const {
    personalInformation,
    summary,
    experiences = [],
    education = [],
    skills = [],
    certifications = [],
    projects = [],
    socialLinks = [],
    sectionVisibility = {},
  } = portfolio;

  const isSectionVisible = (sectionName) => {
    return sectionVisibility[sectionName] !== false;
  };

  return (
    <main className="portfolio-view">
      {/* =========================================
          Profile
          ========================================= */}

      <header className="portfolio-view-profile">
        <div className="portfolio-view-avatar">
          {personalInformation?.profileImage ? (
            <img
              src={personalInformation.profileImage}
              alt={personalInformation.fullName}
            />
          ) : (
            <span aria-hidden="true">
              {personalInformation?.fullName?.charAt(0) || "P"}
            </span>
          )}
        </div>

        <div>
          <h1>{personalInformation?.fullName || "Portfolio Owner"}</h1>

          {personalInformation?.professionalTitle && (
            <p>{personalInformation.professionalTitle}</p>
          )}

          {personalInformation?.location && (
            <span>{personalInformation.location}</span>
          )}
        </div>
      </header>

      {/* =========================================
          Professional Summary
          ========================================= */}

      {isSectionVisible("summary") && summary && (
        <section className="portfolio-view-section">
          <h2>Professional Summary</h2>

          <p className="portfolio-view-summary">{summary}</p>
        </section>
      )}

      {/* =========================================
          Experience
          ========================================= */}

      {isSectionVisible("experience") && experiences.length > 0 && (
        <section className="portfolio-view-section">
          <h2>Experience</h2>

          <div className="portfolio-view-list">
            {experiences.map((experience) => (
              <article key={experience.id} className="portfolio-view-card">
                <h3>{experience.jobTitle}</h3>

                <strong>{experience.company}</strong>

                <span>
                  {experience.startDate} –{" "}
                  {experience.current ? "Present" : experience.endDate}
                </span>

                {experience.location && <span>{experience.location}</span>}

                {experience.description && <p>{experience.description}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* =========================================
          Education
          ========================================= */}

      {isSectionVisible("education") && education.length > 0 && (
        <section className="portfolio-view-section">
          <h2>Education</h2>

          <div className="portfolio-view-list">
            {education.map((educationItem) => (
              <article key={educationItem.id} className="portfolio-view-card">
                <h3>
                  {educationItem.degree}
                  {educationItem.field ? ` in ${educationItem.field}` : ""}
                </h3>

                <strong>{educationItem.institution}</strong>

                <span>
                  {educationItem.startYear} – {educationItem.endYear}
                </span>

                {educationItem.description && (
                  <p>{educationItem.description}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* =========================================
          Skills
          ========================================= */}

      {isSectionVisible("skills") && skills.length > 0 && (
        <section className="portfolio-view-section">
          <h2>Skills</h2>

          <div className="portfolio-view-skills">
            {skills.map((skill) => (
              <article key={skill.id} className="portfolio-view-skill">
                <div>
                  <strong>{skill.name}</strong>

                  {skill.category && <span>{skill.category}</span>}
                </div>

                {skill.level && <small>{skill.level}</small>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* =========================================
          Certifications
          ========================================= */}

      {isSectionVisible("certifications") && certifications.length > 0 && (
        <section className="portfolio-view-section">
          <h2>Certifications</h2>

          <div className="portfolio-view-list">
            {certifications.map((certification) => (
              <article key={certification.id} className="portfolio-view-card">
                <h3>{certification.name}</h3>

                <strong>
                  {certification.issuingOrganization || certification.issuer}
                </strong>

                {(certification.issueDate || certification.date) && (
                  <span>
                    Issued: {certification.issueDate || certification.date}
                  </span>
                )}

                {certification.description && (
                  <p>{certification.description}</p>
                )}

                {certification.credentialUrl && (
                  <a
                    href={certification.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Credential
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Projects and Social Links can be added here next. */}
    </main>
  );
}

export default PortfolioView;
