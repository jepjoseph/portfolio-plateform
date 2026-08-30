import ProfessionalTitleItem from "./ProfessionalTitleItem/ProfessionalTitleItem";

import "./ProfessionalTitle.css";

function ProfessionalTitle({
  titles = [],
  title = "Professional Titles",
  description = "Professional roles and areas of expertise.",
}) {
  if (!titles.length) {
    return null;
  }

  return (
    <section
      className="professional-title"
      aria-labelledby="professional-title-heading"
    >
      <header className="professional-title-header">
        <div>
          <span className="professional-title-eyebrow">Career Identity</span>

          <h4 id="professional-title-heading">{title}</h4>

          {description && <p>{description}</p>}
        </div>

        <span className="professional-title-count">
          {titles.length} {titles.length === 1 ? "Title" : "Titles"}
        </span>
      </header>

      <div className="professional-title-list">
        {titles.map((professionalTitle, index) => (
          <ProfessionalTitleItem
            key={professionalTitle.id}
            title={professionalTitle.name}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

export default ProfessionalTitle;
