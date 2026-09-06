import "./AboutContextReadiness.css";

function AboutContextReadiness({ readiness }) {
  if (!readiness) {
    return null;
  }

  return (
    <section className="about-context-readiness">
      <header>
        <div>
          <span>Generation Context</span>

          <h4>About Readiness</h4>
        </div>

        <span
          className={`about-context-level about-context-level--${readiness.level}`}
        >
          {readiness.label}
        </span>
      </header>

      <p>{readiness.description}</p>

      <div className="about-context-details">
        {readiness.details.map((detail) => (
          <article key={detail.id}>
            <span>{detail.label}</span>

            <strong>{detail.value || detail.count}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AboutContextReadiness;
