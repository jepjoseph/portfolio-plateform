import "./ExperienceOverviewSuggestions.css";

function getWordCount(value) {
  return value?.trim() ? value.trim().split(/\s+/).length : 0;
}

function ExperienceOverviewSuggestions({
  suggestions = [],
  disabled = false,
  onAccept,
  onDismiss,
}) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section
      className="experience-overview-suggestions"
      aria-labelledby="experience-overview-suggestions-title"
    >
      <header>
        <div>
          <span>AI Suggestions</span>

          <h4 id="experience-overview-suggestions-title">
            Choose an Experience Overview
          </h4>

          <p>
            Review each suggestion carefully before adding it to your
            professional record.
          </p>
        </div>

        <button type="button" onClick={onDismiss} disabled={disabled}>
          Dismiss
        </button>
      </header>

      <div className="experience-overview-suggestions-list">
        {suggestions.map((suggestion, index) => (
          <article key={suggestion.id}>
            <header>
              <div>
                <span>Option {index + 1}</span>

                <h5>{suggestion.label}</h5>
              </div>

              <span>{getWordCount(suggestion.text)} words</span>
            </header>

            <p>{suggestion.text}</p>

            <button
              type="button"
              onClick={() => onAccept?.(suggestion)}
              disabled={disabled}
            >
              Use This Overview
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ExperienceOverviewSuggestions;
