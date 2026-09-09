import { useMemo, useState } from "react";

import { useExperienceData } from "../../context/ExperienceDataContext.jsx";

import {
  getExperienceOrganizationName,
  getExperiencePositionTitle,
  getExperienceStatistics,
  sortExperiences,
} from "../../services/Experience/experienceUtils.js";

import ExperienceDashboard from "./components/ExperienceDashboard/ExperienceDashboard.jsx";
import ExperiencePageHeader from "./components/ExperiencePageHeader/ExperiencePageHeader.jsx";
import ExperienceForm from "./components/ExperienceForm/ExperienceForm.jsx";
import ExperienceList from "./components/ExperienceList/ExperienceList.jsx";

import "./Experience.css";

function Experience() {
  const {
    experiences,
    activeExperiences,
    archivedExperiences,
    isLoading,
    loadStatus,
    saveStatus,
    operation,
    error,
    refreshExperiences,
    createExperience,
    updateExperience,
    archiveExperience,
    restoreExperience,
    deleteExperience,
    clearError,
    resetSaveStatus,
  } = useExperienceData();

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingExperienceId, setEditingExperienceId] = useState(null);

  const [showArchived, setShowArchived] = useState(false);

  /*
   * =========================================
   * Derived Information
   * =========================================
   */

  const statistics = useMemo(
    () => getExperienceStatistics(experiences),
    [experiences],
  );

  const displayedExperiences = useMemo(() => {
    const selectedCollection = showArchived
      ? archivedExperiences
      : activeExperiences;

    return sortExperiences(selectedCollection, "newest");
  }, [showArchived, activeExperiences, archivedExperiences]);

  const editingExperience = useMemo(
    () =>
      editingExperienceId
        ? experiences.find(
            (experience) => experience.id === editingExperienceId,
          ) || null
        : null,
    [experiences, editingExperienceId],
  );

  /*
   * =========================================
   * Form Actions
   * =========================================
   */

  const handleAddExperience = () => {
    setEditingExperienceId(null);
    setIsFormOpen(true);
    clearError();
    resetSaveStatus();
  };

  const handleCloseForm = () => {
    setEditingExperienceId(null);
    setIsFormOpen(false);
    clearError();
    resetSaveStatus();
  };

  /*
   * =========================================
   * Save Experience
   * =========================================
   */

  const handleSaveExperience = async (experienceData) => {
    if (editingExperienceId) {
      await updateExperience(editingExperienceId, experienceData);
    } else {
      await createExperience(experienceData);
    }

    setEditingExperienceId(null);
    setIsFormOpen(false);
  };

  /*
   * =========================================
   * Library Actions
   * =========================================
   */

  const handleEditExperience = (experience) => {
    setEditingExperienceId(experience.id);
    setIsFormOpen(true);

    clearError();
    resetSaveStatus();

    window.requestAnimationFrame(() => {
      document.querySelector(".experience-page-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleArchiveExperience = async (experience) => {
    try {
      await archiveExperience(experience.id);

      if (editingExperienceId === experience.id) {
        handleCloseForm();
      }
    } catch {
      /*
       * ExperienceDataContext displays the error.
       */
    }
  };

  const handleRestoreExperience = async (experience) => {
    try {
      await restoreExperience(experience.id);
    } catch {
      /*
       * ExperienceDataContext displays the error.
       */
    }
  };

  const handleDeleteExperience = async (experience) => {
    const positionTitle = getExperiencePositionTitle(experience);

    const organizationName = getExperienceOrganizationName(experience);

    const shouldDelete = window.confirm(
      `Permanently delete "${positionTitle}" at "${organizationName}"?\n\nThis action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteExperience(experience.id);

      if (editingExperienceId === experience.id) {
        handleCloseForm();
      }
    } catch {
      /*
       * ExperienceDataContext displays the error.
       */
    }
  };

  /*
   * =========================================
   * Archive View
   * =========================================
   */

  const handleToggleArchived = () => {
    setShowArchived((currentValue) => !currentValue);

    clearError();
  };

  /*
   * =========================================
   * Retry Loading
   * =========================================
   */

  const handleRetryLoading = () => {
    refreshExperiences({
      includeArchived: true,
    }).catch(() => {
      /*
       * The context already records and displays
       * the loading error.
       */
    });
  };

  return (
    <main className="experience-page">
      <ExperiencePageHeader
        totalExperiences={experiences.length}
        archivedCount={archivedExperiences.length}
        showArchived={showArchived}
        isLoading={isLoading}
        onAddExperience={handleAddExperience}
        onToggleArchived={handleToggleArchived}
      />

      <ExperienceDashboard statistics={statistics} isLoading={isLoading} />

      {/* =====================================
          Global Error
          ===================================== */}

      {error && (
        <section
          className="experience-page-message experience-page-message--error"
          role="alert"
        >
          <div>
            <strong>Unable to complete the experience operation</strong>

            <p>{error.message}</p>
          </div>

          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </section>
      )}

      {/* =====================================
          Save Status
          ===================================== */}

      {saveStatus === "success" && (
        <section
          className="experience-page-message experience-page-message--success"
          role="status"
        >
          <div>
            <strong>Experience changes saved</strong>

            <p>
              The professional experience library has been updated successfully.
            </p>
          </div>

          <button type="button" onClick={resetSaveStatus}>
            Dismiss
          </button>
        </section>
      )}

      {saveStatus === "saving" && (
        <section
          className="experience-page-message experience-page-message--saving"
          role="status"
          aria-live="polite"
        >
          <span className="experience-page-message-loader" aria-hidden="true" />

          <div>
            <strong>Saving experience</strong>

            <p>Your experience information is being updated.</p>
          </div>
        </section>
      )}

      {/* =====================================
          Form Area
          ===================================== */}

      {isFormOpen && (
        <section className="experience-page-form">
          <header>
            <div>
              <span>Experience Editor</span>

              <h2>
                {editingExperienceId
                  ? "Edit Experience"
                  : "Add Professional Experience"}
              </h2>

              <p>
                Complete the information below to create a reusable professional
                experience record.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseForm}
              aria-label="Close experience form"
            >
              ×
            </button>
          </header>

          <ExperienceForm
            initialExperience={editingExperience}
            isSaving={saveStatus === "saving"}
            onSubmit={handleSaveExperience}
            onCancel={handleCloseForm}
          />
        </section>
      )}

      {/* =====================================
          Experience Library
          ===================================== */}

      <section
        className="experience-page-library"
        aria-labelledby="experience-library-title"
      >
        <header className="experience-page-library-header">
          <div>
            <span>
              {showArchived ? "Archived Records" : "Experience Library"}
            </span>

            <h2 id="experience-library-title">
              {showArchived ? "Archived Experiences" : "Saved Experiences"}
            </h2>

            <p>
              {showArchived
                ? "Archived records are preserved but unavailable to normal résumé and portfolio selection."
                : "Manage the professional records available to your résumés and portfolios."}
            </p>
          </div>

          <span className="experience-page-library-count">
            {displayedExperiences.length}{" "}
            {displayedExperiences.length === 1 ? "Experience" : "Experiences"}
          </span>
        </header>

        {isLoading && (
          <div
            className="experience-page-loading"
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true" />

            <div>
              <strong>Loading experiences</strong>

              <p>Retrieving your professional experience library.</p>
            </div>
          </div>
        )}

        {!isLoading && loadStatus === "error" && (
          <div className="experience-page-load-error">
            <span aria-hidden="true">!</span>

            <h3>Experiences could not be loaded</h3>

            <p>Check the browser storage and try loading the records again.</p>

            <button type="button" onClick={handleRetryLoading}>
              Try Again
            </button>
          </div>
        )}

        {!isLoading &&
          loadStatus !== "error" &&
          displayedExperiences.length === 0 && (
            <div className="experience-page-empty">
              <div aria-hidden="true">{showArchived ? "□" : "✦"}</div>

              <h3>
                {showArchived
                  ? "No archived experiences"
                  : "No experiences saved yet"}
              </h3>

              <p>
                {showArchived
                  ? "Experiences you archive will appear here."
                  : "Add your first professional experience to make it available for résumés and portfolios."}
              </p>

              {!showArchived && (
                <button type="button" onClick={handleAddExperience}>
                  Add Your First Experience
                </button>
              )}
            </div>
          )}

        {!isLoading &&
          loadStatus !== "error" &&
          displayedExperiences.length > 0 && (
            <ExperienceList
              experiences={displayedExperiences}
              operation={operation}
              onEdit={handleEditExperience}
              onArchive={handleArchiveExperience}
              onRestore={handleRestoreExperience}
              onDelete={handleDeleteExperience}
            />
          )}
      </section>
    </main>
  );
}

export default Experience;
