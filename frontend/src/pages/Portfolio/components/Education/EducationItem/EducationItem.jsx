import "./EducationItem.css";

function EducationItem({
  institution,
  degree,
  field,
  startYear,
  endYear,
  description,
}) {
  return (
    <article className="education-item">
      <div className="education-item-timeline">
        <div className="education-item-dot" />

        <div className="education-item-line" />
      </div>

      <div className="education-item-content">
        <div className="education-item-header">
          <div>
            <span className="education-item-degree">{degree}</span>

            <h4>{field}</h4>

            <span className="education-item-institution">{institution}</span>
          </div>

          <span className="education-item-period">
            {startYear} – {endYear}
          </span>
        </div>

        {description && (
          <p className="education-item-description">{description}</p>
        )}
      </div>
    </article>
  );
}

export default EducationItem;
