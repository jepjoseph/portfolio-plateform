import "./SkillsItem.css";

function SkillsItem({ name, category, level = "Intermediate" }) {
  return (
    <article className="skills-item">
      <div className="skills-item-main">
        <div className="skills-item-icon">✦</div>

        <div className="skills-item-info">
          <h4>{name}</h4>

          {category && <span className="skills-item-category">{category}</span>}
        </div>
      </div>

      <span className="skills-item-level">{level}</span>
    </article>
  );
}

export default SkillsItem;
