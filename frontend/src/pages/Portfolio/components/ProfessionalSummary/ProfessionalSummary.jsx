import "./ProfessionalSummary.css";

function ProfessionalSummary({ summary = "", onChange }) {
  return (
    <article className="professional-summary dashboard-card">
      <div className="professional-summary-header">
        <div>
          <span className="professional-summary-eyebrow">About Me</span>

          <h3>Professional Summary</h3>

          <p>
            Introduce yourself professionally and highlight your background,
            strengths, and career goals.
          </p>
        </div>
      </div>

      <div className="professional-summary-form">
        <label
          htmlFor="professional-summary"
          className="professional-summary-label"
        >
          Summary
        </label>

        <textarea
          id="professional-summary"
          className="professional-summary-textarea"
          value={summary}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder="Write a professional summary about yourself..."
          rows={7}
          maxLength={1000}
        />

        <div className="professional-summary-footer">
          <span>
            Keep your summary clear, professional, and focused on your
            experience and strengths.
          </span>

          <span className="professional-summary-counter">
            {summary.length}/1000
          </span>
        </div>
      </div>
    </article>
  );
}

export default ProfessionalSummary;
