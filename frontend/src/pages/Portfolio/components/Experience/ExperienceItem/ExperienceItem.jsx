import "./ExperienceItem.css";

function ExperienceItem({
  jobTitle,
  company,
  location,
  startDate,
  endDate,
  description,
  current = false,
}) {
  return (
    <article className="experience-item">
      <div className="experience-item-marker">
        <span />
      </div>

      <div className="experience-item-content">
        <div className="experience-item-header">
          <div>
            <h4 className="experience-item-title">{jobTitle}</h4>

            <div className="experience-item-company">
              <span>{company}</span>

              {location && (
                <>
                  <span className="experience-separator">•</span>

                  <span>{location}</span>
                </>
              )}
            </div>
          </div>

          {current && <span className="experience-current">Current</span>}
        </div>

        <div className="experience-item-date">
          <span>{startDate}</span>

          <span className="experience-date-separator">—</span>

          <span>{current ? "Present" : endDate}</span>
        </div>

        {description && (
          <p className="experience-item-description">{description}</p>
        )}
      </div>
    </article>
  );
}

export default ExperienceItem;
