import ExperienceItem from "./ExperienceItem/ExperienceItem";

import "./Experience.css";

function Experience({ experiences = [] }) {
  return (
    <section className="experience-section dashboard-card">
      <div className="experience-header">
        <div>
          <span className="experience-eyebrow">Career</span>

          <h3>Professional Experience</h3>

          <p>
            Highlight your professional experience, responsibilities, and career
            progression.
          </p>
        </div>

        <button type="button" className="experience-add-button">
          <span>+</span>
          <span>Add Experience</span>
        </button>
      </div>

      {experiences.length > 0 ? (
        <div className="experience-list">
          {experiences.map((experience) => (
            <ExperienceItem
              key={experience.id}
              jobTitle={experience.jobTitle}
              company={experience.company}
              location={experience.location}
              startDate={experience.startDate}
              endDate={experience.endDate}
              description={experience.description}
              current={experience.current}
            />
          ))}
        </div>
      ) : (
        <div className="experience-empty">
          <div className="experience-empty-icon">◷</div>

          <h4>No experience added yet</h4>

          <p>
            Add your professional experience to help visitors understand your
            career journey.
          </p>

          <button type="button" className="experience-empty-button">
            Add Your First Experience
          </button>
        </div>
      )}
    </section>
  );
}

export default Experience;
