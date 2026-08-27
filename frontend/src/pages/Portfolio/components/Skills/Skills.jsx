import SkillsItem from "./SkillsItem/SkillsItem";

import "./Skills.css";

function Skills({ skills }) {
  return (
    <section
      className="skills-section portfolio-editor-card"
      aria-labelledby="skills-title"
    >
      <div className="skills-header">
        <div>
          <span className="skills-eyebrow">Professional Capabilities</span>

          <h3 id="skills-title">Skills</h3>

          <p>
            Technical and professional skills that represent your experience and
            capabilities.
          </p>
        </div>
      </div>

      <div className="skills-list">
        {skills.map((skill) => (
          <SkillsItem
            key={skill.id}
            name={skill.name}
            category={skill.category}
            level={skill.level}
          />
        ))}
      </div>
    </section>
  );
}

export default Skills;
