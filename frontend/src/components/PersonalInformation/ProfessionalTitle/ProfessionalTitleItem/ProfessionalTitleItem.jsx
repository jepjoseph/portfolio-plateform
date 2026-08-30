import "./ProfessionalTitleItem.css";

const POSITION_NAMES = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
];

function getPositionName(index) {
  return POSITION_NAMES[index] || `Title ${index + 1}`;
}

function ProfessionalTitleItem({ title, index }) {
  const isPrimary = index === 0;

  return (
    <article className="professional-title-item">
      <div className="professional-title-item-icon" aria-hidden="true">
        ✦
      </div>

      <div className="professional-title-item-information">
        <div className="professional-title-item-label">
          <span>{getPositionName(index)} Title</span>

          {isPrimary && <small>Primary</small>}
        </div>

        <h5>{title}</h5>
      </div>
    </article>
  );
}

export default ProfessionalTitleItem;
