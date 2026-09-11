import { useMemo, useState } from "react";

import { useEducationData } from "../../context/EducationDataContext.jsx";

import {
  formatEducationDateRange,
  getEducationCredentialName,
  getEducationCredentialTypeDisplay,
  getEducationInstitutionName,
  getEducationStatistics,
  sortEducation,
} from "../../services/Education/educationUtils.js";

import EducationDashboard from "./components/EducationDashboard/EducationDashboard.jsx";
import EducationPageHeader from "./components/EducationPageHeader/EducationPageHeader.jsx";
import EducationForm from "./components/EducationForm/EducationForm.jsx";
import EducationLibrary from "./components/EducationLibrary/EducationLibrary.jsx";

import "./Education.css";

/*
 * =========================================
 * Education Page
 * =========================================
 */

function Education() {
  const {
    educationRecords,
    activeEducationRecords,
    archivedEducationRecords,
    isLoading,
    loadStatus,
    saveStatus,
    operation,
    error,
    refreshEducation,
    createEducation,
    updateEducation,
    archiveEducation,
    restoreEducation,
    deleteEducation,
    clearError,
    resetSaveStatus,
  } = useEducationData();

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingEducationId, setEditingEducationId] = useState(null);

  const [showArchived, setShowArchived] = useState(false);

  /*
   * =========================================
   * Derived Information
   * =========================================
   */

  const statistics = useMemo(
    () => getEducationStatistics(educationRecords),
    [educationRecords],
  );

  const displayedEducation = useMemo(() => {
    const selectedCollection = showArchived
      ? archivedEducationRecords
      : activeEducationRecords;

    return sortEducation(selectedCollection, "newest");
  }, [showArchived, activeEducationRecords, archivedEducationRecords]);

  const editingEducation = useMemo(
    () =>
      editingEducationId
        ? educationRecords.find(
            (education) => education.id === editingEducationId,
          ) || null
        : null,
    [educationRecords, editingEducationId],
  );

  /*
   * =========================================
   * Form Actions
   * =========================================
   */

  const scrollToForm = () => {
    window.requestAnimationFrame(() => {
      document.querySelector(".education-page-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleAddEducation = () => {
    setEditingEducationId(null);
    setIsFormOpen(true);

    clearError();
    resetSaveStatus();

    scrollToForm();
  };

  const handleEditEducation = (education) => {
    setEditingEducationId(education.id);

    setIsFormOpen(true);

    clearError();
    resetSaveStatus();

    scrollToForm();
  };

  const handleCloseForm = () => {
    setEditingEducationId(null);
    setIsFormOpen(false);

    clearError();
    resetSaveStatus();
  };

  /*
   * =========================================
   * Save Education
   * =========================================
   */

  const handleSaveEducation = async (educationData) => {
    /*
     * editingEducationId identifies whether the
     * form is creating a record or editing one.
     */

    if (editingEducationId) {
      await updateEducation(editingEducationId, educationData);
    } else {
      await createEducation(educationData);
    }

    /*
     * These lines only run after a successful save.
     * If saving throws an error, EducationForm keeps
     * the form open and displays the error.
     */

    setEditingEducationId(null);
    setIsFormOpen(false);
  };

  /*
   * =========================================
   * Record Actions
   * =========================================
   */

  const handleArchiveEducation = async (education) => {
    try {
      await archiveEducation(education.id);

      if (editingEducationId === education.id) {
        handleCloseForm();
      }
    } catch {
      /*
       * Context displays the error.
       */
    }
  };

  const handleRestoreEducation = async (education) => {
    try {
      await restoreEducation(education.id);
    } catch {
      /*
       * Context displays the error.
       */
    }
  };

  const handleDeleteEducation = async (education) => {
    const credentialName = getEducationCredentialName(education);

    const institutionName = getEducationInstitutionName(education);

    const shouldDelete = window.confirm(
      `Permanently delete "${credentialName}" from "${institutionName}"?\n\nThis action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteEducation(education.id);

      if (editingEducationId === education.id) {
        handleCloseForm();
      }
    } catch {
      /*
       * Context displays the error.
       */
    }
  };

  /*
   * =========================================
   * Archive View
   * =========================================
   */

  const handleToggleArchived = () => {
    setShowArchived((current) => !current);

    setEditingEducationId(null);
    setIsFormOpen(false);

    clearError();
    resetSaveStatus();
  };

  /*
   * =========================================
   * Retry Loading
   * =========================================
   */

  const handleRetryLoading = () => {
    refreshEducation({
      includeArchived: true,
    }).catch(() => {
      /*
       * Context displays the error.
       */
    });
  };

  return (
    <main className="education-page">
      <EducationPageHeader
        totalEducation={educationRecords.length}
        activeCount={activeEducationRecords.length}
        archivedCount={archivedEducationRecords.length}
        showArchived={showArchived}
        isLoading={isLoading}
        onAddEducation={handleAddEducation}
        onToggleArchived={handleToggleArchived}
      />

      <EducationDashboard statistics={statistics} isLoading={isLoading} />

      {/* Global Error */}

      {error && (
        <section
          className="education-page-message education-page-message--error"
          role="alert"
        >
          <div>
            <strong>Unable to complete the education operation</strong>

            <p>{error.message}</p>
          </div>

          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </section>
      )}

      {/* Save Status */}

      {saveStatus === "success" && (
        <section
          className="education-page-message education-page-message--success"
          role="status"
        >
          <div>
            <strong>Education changes saved</strong>

            <p>Your Education Library has been updated successfully.</p>
          </div>

          <button type="button" onClick={resetSaveStatus}>
            Dismiss
          </button>
        </section>
      )}

      {saveStatus === "saving" && (
        <section
          className="education-page-message education-page-message--saving"
          role="status"
          aria-live="polite"
        >
          <span className="education-page-message-loader" aria-hidden="true" />

          <div>
            <strong>Saving education</strong>

            <p>Your education information is being updated.</p>
          </div>
        </section>
      )}

      {/* Temporary Form Area */}

      {isFormOpen && (
        <section className="education-page-form">
          <header className="education-page-form-header">
            <div>
              <span>Education Editor</span>

              <h2>
                {editingEducation
                  ? `Edit ${getEducationCredentialName(editingEducation)}`
                  : "Add Education"}
              </h2>

              <p>
                Complete the information below to create a reusable education
                record for résumés, portfolios, and future projects.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseForm}
              aria-label="Close education form"
            >
              ×
            </button>
          </header>

          <EducationForm
            initialEducation={editingEducation}
            isSaving={saveStatus === "saving"}
            onSubmit={handleSaveEducation}
            onCancel={handleCloseForm}
          />
        </section>
      )}

      {/* Temporary Education Library */}

      <EducationLibrary
        educationRecords={displayedEducation}
        showArchived={showArchived}
        isLoading={isLoading}
        loadStatus={loadStatus}
        operation={operation}
        onAddEducation={handleAddEducation}
        onRetry={handleRetryLoading}
        onEdit={handleEditEducation}
        onArchive={handleArchiveEducation}
        onRestore={handleRestoreEducation}
        onDelete={handleDeleteEducation}
      />
    </main>
  );
}

export default Education;
