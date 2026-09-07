import { useId, useMemo, useState } from "react";

import { EXPERIENCE_FIELD_LIMITS } from "../../../../config/experienceConfig.js";

import { createAchievement } from "../../../../models/experienceModel.js";

import "./AchievementEditor.css";

/*
 * =========================================
 * Helpers
 * =========================================
 */

function normalizeAchievementOrder(achievements) {
  return achievements.map((achievement, index) => ({
    ...achievement,
    order: index,
  }));
}

function getAchievementText(achievement) {
  if (typeof achievement === "string") {
    return achievement.trim();
  }

  return achievement?.text?.trim() || "";
}

/*
 * =========================================
 * Achievement Editor
 * =========================================
 */

function AchievementEditor({
  achievements = [],
  fieldErrors = {},
  disabled = false,
  onChange,
}) {
  const sectionTitleId = useId();
  const textId = useId();
  const metricId = useId();

  const [draftText, setDraftText] = useState("");

  const [draftMetric, setDraftMetric] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [editorError, setEditorError] = useState("");

  const isEditing = Boolean(editingId);

  const maximumItems = EXPERIENCE_FIELD_LIMITS.maximumAchievements;

  const maximumTextLength = EXPERIENCE_FIELD_LIMITS.achievementText;

  const maximumMetricLength = EXPERIENCE_FIELD_LIMITS.achievementMetric;

  const hasReachedMaximum = achievements.length >= maximumItems;

  /*
   * =========================================
   * Ordered Achievements
   * =========================================
   */

  const orderedAchievements = useMemo(
    () =>
      [...achievements].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      ),
    [achievements],
  );

  /*
   * =========================================
   * Reset Editor
   * =========================================
   */

  const resetEditor = () => {
    setDraftText("");
    setDraftMetric("");
    setEditingId(null);
    setEditorError("");
  };

  /*
   * =========================================
   * Duplicate Check
   * =========================================
   */

  const isDuplicateAchievement = (text) => {
    const normalizedText = text.trim().toLocaleLowerCase();

    return achievements.some((achievement) => {
      if (achievement.id === editingId) {
        return false;
      }

      return (
        getAchievementText(achievement).toLocaleLowerCase() === normalizedText
      );
    });
  };

  /*
   * =========================================
   * Add or Update
   * =========================================
   */

  const handleSaveAchievement = () => {
    const normalizedText = draftText.trim();

    const normalizedMetric = draftMetric.trim();

    if (!normalizedText) {
      setEditorError("Enter an achievement before adding it.");

      return;
    }

    if (normalizedText.length > maximumTextLength) {
      setEditorError(
        `An achievement cannot exceed ${maximumTextLength} characters.`,
      );

      return;
    }

    if (normalizedMetric.length > maximumMetricLength) {
      setEditorError(
        `The measurable result cannot exceed ${maximumMetricLength} characters.`,
      );

      return;
    }

    if (!isEditing && hasReachedMaximum) {
      setEditorError(`You can add no more than ${maximumItems} achievements.`);

      return;
    }

    if (isDuplicateAchievement(normalizedText)) {
      setEditorError("This achievement has already been added.");

      return;
    }

    if (isEditing) {
      const updatedAchievements = achievements.map((achievement) =>
        achievement.id === editingId
          ? {
              ...achievement,
              text: normalizedText,
              metric: normalizedMetric,
            }
          : achievement,
      );

      onChange?.(normalizeAchievementOrder(updatedAchievements));
    } else {
      const newAchievement = createAchievement({
        text: normalizedText,
        metric: normalizedMetric,
        order: achievements.length,
      });

      onChange?.(normalizeAchievementOrder([...achievements, newAchievement]));
    }

    resetEditor();
  };

  /*
   * =========================================
   * Edit
   * =========================================
   */

  const handleEdit = (achievement) => {
    setEditingId(achievement.id);
    setDraftText(achievement.text || "");
    setDraftMetric(achievement.metric || "");
    setEditorError("");
  };

  /*
   * =========================================
   * Remove
   * =========================================
   */

  const handleRemove = (achievementId) => {
    const remainingAchievements = achievements.filter(
      (achievement) => achievement.id !== achievementId,
    );

    onChange?.(normalizeAchievementOrder(remainingAchievements));

    if (editingId === achievementId) {
      resetEditor();
    }
  };

  /*
   * =========================================
   * Reorder
   * =========================================
   */

  const handleMove = (achievementId, direction) => {
    const currentIndex = orderedAchievements.findIndex(
      (achievement) => achievement.id === achievementId,
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedAchievements.length) {
      return;
    }

    const reorderedAchievements = [...orderedAchievements];

    const [movedAchievement] = reorderedAchievements.splice(currentIndex, 1);

    reorderedAchievements.splice(targetIndex, 0, movedAchievement);

    onChange?.(normalizeAchievementOrder(reorderedAchievements));
  };

  return (
    <section
      className="experience-form-section achievement-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="experience-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Professional Impact</small>

          <h3 id={sectionTitleId}>Achievements and Results</h3>

          <p>
            Record accomplishments, improvements, completed initiatives, and
            measurable results from this experience.
          </p>
        </div>
      </header>

      {/* =====================================
          Writing Guidance
          ===================================== */}

      <div className="achievement-editor-guidance">
        <article>
          <span>1</span>

          <div>
            <strong>Start with an action</strong>

            <p>
              Use words such as improved, developed, implemented, reduced,
              coordinated, or delivered.
            </p>
          </div>
        </article>

        <article>
          <span>2</span>

          <div>
            <strong>Explain what changed</strong>

            <p>
              Describe the problem solved, improvement made, or value delivered.
            </p>
          </div>
        </article>

        <article>
          <span>3</span>

          <div>
            <strong>Add evidence when available</strong>

            <p>
              Include accurate percentages, quantities, time savings, or other
              supported results.
            </p>
          </div>
        </article>
      </div>

      {/* =====================================
          Achievement Editor Fields
          ===================================== */}

      <div className="achievement-editor-form">
        <div className="achievement-editor-field">
          <div className="achievement-editor-label-row">
            <label htmlFor={textId}>
              {isEditing ? "Edit Achievement" : "Achievement"}
            </label>

            <span>
              {draftText.length}/{maximumTextLength}
            </span>
          </div>

          <textarea
            id={textId}
            value={draftText}
            onChange={(event) => {
              setDraftText(event.target.value);

              setEditorError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();

                handleSaveAchievement();
              }
            }}
            rows={4}
            maxLength={maximumTextLength}
            disabled={disabled}
            placeholder={`Describe one professional accomplishment and its value.

Example: Implemented a standardized user-account provisioning process that improved consistency and reduced configuration errors.`}
          />
        </div>

        <div className="achievement-editor-field">
          <div className="achievement-editor-label-row">
            <label htmlFor={metricId}>
              Measurable Result
              <small> Optional</small>
            </label>

            <span>
              {draftMetric.length}/{maximumMetricLength}
            </span>
          </div>

          <input
            id={metricId}
            type="text"
            value={draftMetric}
            onChange={(event) => {
              setDraftMetric(event.target.value);

              setEditorError("");
            }}
            maxLength={maximumMetricLength}
            disabled={disabled}
            placeholder="Example: Reduced average setup time by 30%"
          />

          <small className="achievement-editor-help">
            Enter only metrics you can support. Do not estimate or invent a
            result.
          </small>
        </div>

        {editorError && (
          <p className="achievement-editor-error" role="alert">
            {editorError}
          </p>
        )}

        <div className="achievement-editor-form-footer">
          <small>
            {achievements.length}/{maximumItems} achievements
          </small>

          <div>
            {isEditing && (
              <button
                type="button"
                className="achievement-editor-cancel-button"
                onClick={resetEditor}
                disabled={disabled}
              >
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              className="achievement-editor-add-button"
              onClick={handleSaveAchievement}
              disabled={disabled || (!isEditing && hasReachedMaximum)}
            >
              {isEditing ? "Save Achievement" : "+ Add Achievement"}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================
          Achievement List
          ===================================== */}

      <div className="achievement-editor-list">
        {orderedAchievements.length > 0 ? (
          orderedAchievements.map((achievement, index) => {
            const textError = fieldErrors[`achievements.${index}.text`];

            const metricError = fieldErrors[`achievements.${index}.metric`];

            return (
              <article
                key={achievement.id}
                className={`achievement-editor-item ${
                  textError || metricError
                    ? "achievement-editor-item--error"
                    : ""
                } ${
                  editingId === achievement.id
                    ? "achievement-editor-item--editing"
                    : ""
                }`}
              >
                <div className="achievement-editor-order">
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleMove(achievement.id, "up")}
                      disabled={disabled || index === 0}
                      aria-label={`Move achievement ${index + 1} up`}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(achievement.id, "down")}
                      disabled={
                        disabled || index === orderedAchievements.length - 1
                      }
                      aria-label={`Move achievement ${index + 1} down`}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="achievement-editor-content">
                  <span>Achievement</span>

                  <p>{achievement.text}</p>

                  {achievement.metric && (
                    <div className="achievement-editor-metric">
                      <strong>Result:</strong> {achievement.metric}
                    </div>
                  )}

                  {textError && <small role="alert">{textError}</small>}

                  {metricError && <small role="alert">{metricError}</small>}
                </div>

                <div className="achievement-editor-actions">
                  <button
                    type="button"
                    className="achievement-editor-edit-button"
                    onClick={() => handleEdit(achievement)}
                    disabled={disabled}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="achievement-editor-delete-button"
                    onClick={() => handleRemove(achievement.id)}
                    disabled={disabled}
                    aria-label={`Remove achievement ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="achievement-editor-empty">
            <span aria-hidden="true">★</span>

            <h4>No achievements added</h4>

            <p>
              Add accomplishments that demonstrate the professional impact and
              value of your work.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default AchievementEditor;
