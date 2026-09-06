import { useId } from "react";

import "./AboutEditor.css";

function AboutEditor({
  value = "",
  wordCount = 0,
  characterCount = 0,
  canGenerate = false,
  isGenerating = false,
  hasSuggestions = false,
  source = "manual",
  status = "empty",
  onChange,
  onGenerate,
}) {
  const textareaId = useId();

  const isRecommendedLength = wordCount >= 100 && wordCount <= 250;

  return (
    <section className="about-editor">
      <div className="about-editor-label">
        <label htmlFor={textareaId}>About Me</label>

        <span>
          {wordCount} {wordCount === 1 ? "word" : "words"}
          {" · "}
          {characterCount}/2200 characters
        </span>
      </div>

      <textarea
        id={textareaId}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        rows={10}
        maxLength={2200}
        placeholder="Introduce your professional background, experience, interests, strengths, values, and goals..."
      />

      <div className="about-editor-footer">
        <div>
          <span
            className={
              isRecommendedLength
                ? "about-editor-length about-editor-length--ready"
                : "about-editor-length"
            }
          >
            {isRecommendedLength
              ? "Recommended length reached"
              : "Recommended: 100–250 words"}
          </span>

          <small>
            {source === "ai" && status === "editing"
              ? "AI suggestion loaded. Edit it until it accurately represents you."
              : "Use a professional first-person voice and support claims with saved information."}
          </small>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
        >
          {isGenerating
            ? "Generating..."
            : hasSuggestions
              ? "Regenerate"
              : "Generate with AI"}
        </button>
      </div>

      {!canGenerate && (
        <p className="about-editor-help">
          Add a professional title, experience, projects, or skills before
          generating an About section.
        </p>
      )}
    </section>
  );
}

export default AboutEditor;
