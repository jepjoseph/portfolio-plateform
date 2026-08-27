import EducationItem from "./EducationItem/EducationItem";

import "./Education.css";

function Education({ education }) {
  return (
    <section
      className="education-section portfolio-editor-card"
      aria-labelledby="education-title"
    >
      <div className="education-header">
        <div>
          <span className="education-eyebrow">Academic Background</span>

          <h3 id="education-title">Education</h3>

          <p>Your academic background and educational achievements.</p>
        </div>
      </div>

      <div className="education-list">
        {education.map((item) => (
          <EducationItem
            key={item.id}
            institution={item.institution}
            degree={item.degree}
            field={item.field}
            startYear={item.startYear}
            endYear={item.endYear}
            description={item.description}
          />
        ))}
      </div>
    </section>
  );
}

export default Education;
