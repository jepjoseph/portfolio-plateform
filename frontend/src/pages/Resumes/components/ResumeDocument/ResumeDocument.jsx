import "./ResumeDocument.css";

function ResumeDocument({ resume }) {
  if (!resume) {
    return null;
  }

  const {
    selectedHeader = {},
    targetRole = "",
    summary = "",
    experiences = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    sectionVisibility = {},
  } = resume;

  const contactItems = [
    selectedHeader.email,
    selectedHeader.phone,
    selectedHeader.location,
    selectedHeader.linkedin,
    selectedHeader.website,
  ].filter(Boolean);

  return (
    <article
      id="printable-resume"
      className={`resume-document resume-document--${
        resume.template || "professional"
      }`}
    >
      {/* =====================================
          Resume Header
          ===================================== */}

      {sectionVisibility.header !== false && (
        <header className="resume-document-header">
          {selectedHeader.picture?.imageUrl && (
            <div className="resume-document-picture">
              <img
                src={selectedHeader.picture.imageUrl}
                alt={
                  selectedHeader.picture.description ||
                  selectedHeader.name ||
                  "Resume profile"
                }
              />
            </div>
          )}

          <div className="resume-document-identity">
            <h1>{selectedHeader.name || "Your Name"}</h1>

            <h2>
              {selectedHeader.professionalTitle ||
                targetRole ||
                "Professional Title"}
            </h2>

            {contactItems.length > 0 && (
              <div className="resume-document-contact">
                {contactItems.map((item, index) => (
                  <span key={`${item}-${index}`}>{item}</span>
                ))}
              </div>
            )}
          </div>
        </header>
      )}

      {/* =====================================
          Resume Content
          ===================================== */}

      <div className="resume-document-body">
        {sectionVisibility.summary !== false && summary && (
          <ResumeSection title="Professional Summary">
            <p className="resume-document-summary">{summary}</p>
          </ResumeSection>
        )}

        {sectionVisibility.experience !== false && experiences.length > 0 && (
          <ResumeSection title="Professional Experience">
            <div className="resume-document-list">
              {experiences.map((experience, index) => (
                <ResumeEntry
                  key={experience.id || `experience-${index}`}
                  title={
                    experience.position ||
                    experience.title ||
                    experience.role ||
                    "Position"
                  }
                  subtitle={
                    experience.company ||
                    experience.organization ||
                    experience.employer
                  }
                  location={experience.location}
                  startDate={experience.startDate}
                  endDate={experience.endDate}
                  isCurrent={experience.isCurrent}
                  description={experience.description}
                  bullets={experience.responsibilities || experience.highlights}
                />
              ))}
            </div>
          </ResumeSection>
        )}

        {sectionVisibility.education !== false && education.length > 0 && (
          <ResumeSection title="Education">
            <div className="resume-document-list">
              {education.map((educationItem, index) => (
                <ResumeEntry
                  key={educationItem.id || `education-${index}`}
                  title={
                    educationItem.degree || educationItem.program || "Education"
                  }
                  subtitle={educationItem.school || educationItem.institution}
                  location={educationItem.location}
                  startDate={educationItem.startDate}
                  endDate={educationItem.endDate}
                  isCurrent={educationItem.isCurrent}
                  description={
                    educationItem.description || educationItem.fieldOfStudy
                  }
                />
              ))}
            </div>
          </ResumeSection>
        )}

        {sectionVisibility.skills !== false && skills.length > 0 && (
          <ResumeSection title="Skills">
            <div className="resume-document-skills">
              {skills.map((skill, index) => (
                <span key={skill.id || skill.name || `skill-${index}`}>
                  {skill.name || skill.value || skill}
                </span>
              ))}
            </div>
          </ResumeSection>
        )}

        {sectionVisibility.projects !== false && projects.length > 0 && (
          <ResumeSection title="Projects">
            <div className="resume-document-list">
              {projects.map((project, index) => (
                <ResumeEntry
                  key={project.id || `project-${index}`}
                  title={project.name || project.title || "Project"}
                  subtitle={project.organization}
                  description={project.description}
                  bullets={project.highlights}
                />
              ))}
            </div>
          </ResumeSection>
        )}

        {sectionVisibility.certifications !== false &&
          certifications.length > 0 && (
            <ResumeSection title="Certifications">
              <div className="resume-document-list">
                {certifications.map((certification, index) => (
                  <ResumeEntry
                    key={certification.id || `certification-${index}`}
                    title={
                      certification.name ||
                      certification.title ||
                      "Certification"
                    }
                    subtitle={
                      certification.issuingOrganization ||
                      certification.organization
                    }
                    startDate={certification.issueDate}
                    description={certification.description}
                  />
                ))}
              </div>
            </ResumeSection>
          )}

        {!summary &&
          experiences.length === 0 &&
          education.length === 0 &&
          skills.length === 0 &&
          projects.length === 0 &&
          certifications.length === 0 && (
            <div className="resume-document-empty">
              <p>
                Your resume header is ready. Resume content sections have not
                been configured yet.
              </p>
            </div>
          )}
      </div>
    </article>
  );
}

function ResumeSection({ title, children }) {
  return (
    <section className="resume-document-section">
      <h3>{title}</h3>

      {children}
    </section>
  );
}

function ResumeEntry({
  title,
  subtitle,
  location,
  startDate,
  endDate,
  isCurrent,
  description,
  bullets,
}) {
  const dateRange = formatDateRange(startDate, endDate, isCurrent);

  return (
    <article className="resume-document-entry">
      <header>
        <div>
          <h4>{title}</h4>

          {subtitle && <p>{subtitle}</p>}
        </div>

        {dateRange && <span>{dateRange}</span>}
      </header>

      {location && <small>{location}</small>}

      {description && <p>{description}</p>}

      {Array.isArray(bullets) && bullets.length > 0 && (
        <ul>
          {bullets.map((bullet, index) => (
            <li key={`${bullet}-${index}`}>
              {typeof bullet === "string"
                ? bullet
                : bullet.value || bullet.description}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function formatDateRange(startDate, endDate, isCurrent) {
  const start = formatDate(startDate);
  const end = isCurrent ? "Present" : formatDate(endDate);

  if (start && end) {
    return `${start} – ${end}`;
  }

  return start || end;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export default ResumeDocument;
