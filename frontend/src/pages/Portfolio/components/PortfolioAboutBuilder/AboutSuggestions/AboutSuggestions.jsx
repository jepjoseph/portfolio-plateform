import { useId } from "react";

import "./AboutSuggestions.css";

function AboutSuggestions({
  suggestions = [],
  onAccept,
  onEdit,
  onRegenerate,
  onDismiss,
  isGenerating = false,
}) {
  const titleId = useId();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="about-suggestions" aria-labelledby={titleId}>
      <header className="about-suggestions-header">
        <div>
          <span>AI Suggestions</span>

          <h4 id={titleId}>Choose Your Professional Story</h4>

          <p>
            Review every version carefully. Accept one directly or load it into
            the editor for customization.
          </p>
        </div>

        <div>
          <button type="button" onClick={onRegenerate} disabled={isGenerating}>
            Regenerate
          </button>

          <button type="button" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </header>

      <div className="about-suggestions-list">
        {suggestions.map((suggestion, index) => {
          const wordCount = suggestion.text.trim().split(/\s+/).length;

          return (
            <article key={suggestion.id} className="about-suggestion">
              <header>
                <div>
                  <span>Option {index + 1}</span>

                  <h5>{suggestion.label}</h5>
                </div>

                <span>{wordCount} words</span>
              </header>

              <p>{suggestion.text}</p>

              <div className="about-suggestion-actions">
                <button type="button" onClick={() => onEdit?.(suggestion)}>
                  Edit This Version
                </button>

                <button
                  type="button"
                  className="about-suggestion-accept"
                  onClick={() => onAccept?.(suggestion)}
                >
                  Use This About
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default AboutSuggestions;
