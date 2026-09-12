import { useMemo, useState } from "react";

import { useTrainingData } from "../../context/TrainingDataContext.jsx";
import TrainingForm from "./components/TrainingForm/TrainingForm.jsx";
import TrainingLibrary from "./components/TrainingLibrary/TrainingLibrary.jsx";

import {
  getTrainingProviderName,
  getTrainingStatistics,
  getTrainingTitle,
} from "../../services/Training/trainingUtils.js";

import TrainingDashboard from "./components/TrainingDashboard/TrainingDashboard.jsx";
import TrainingPageHeader from "./components/TrainingPageHeader/TrainingPageHeader.jsx";

import "./Training.css";

function Training() {
  const {
    trainingRecords,
    activeTrainingRecords,
    archivedTrainingRecords,
    isLoading,
    loadStatus,
    saveStatus,
    operation,
    error,
    refreshTraining,
    createTraining,
    updateTraining,
    archiveTraining,
    restoreTraining,
    deleteTraining,
    clearError,
    resetSaveStatus,
  } = useTrainingData();

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingTrainingId, setEditingTrainingId] = useState(null);

  const [showArchived, setShowArchived] = useState(false);

  /*
   * =========================================
   * Derived Information
   * =========================================
   */

  const statistics = useMemo(
    () => getTrainingStatistics(trainingRecords),
    [trainingRecords],
  );

  const selectedTraining = showArchived
    ? archivedTrainingRecords
    : activeTrainingRecords;

  const editingTraining = useMemo(
    () =>
      editingTrainingId
        ? trainingRecords.find(
            (training) => training.id === editingTrainingId,
          ) || null
        : null,
    [trainingRecords, editingTrainingId],
  );

  /*
   * =========================================
   * Form Actions
   * =========================================
   */

  const scrollToForm = () => {
    window.requestAnimationFrame(() => {
      document.querySelector(".training-page-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleAddTraining = () => {
    setEditingTrainingId(null);
    setIsFormOpen(true);

    clearError();
    resetSaveStatus();

    scrollToForm();
  };

  const handleEditTraining = (training) => {
    setEditingTrainingId(training.id);
    setIsFormOpen(true);

    clearError();
    resetSaveStatus();

    scrollToForm();
  };

  const handleCloseForm = () => {
    setEditingTrainingId(null);
    setIsFormOpen(false);

    clearError();
    resetSaveStatus();
  };

  /*
   * =========================================
   * Save Training
   * =========================================
   */

  const handleSaveTraining = async (trainingData) => {
    /*
     * editingTrainingId determines whether the form
     * creates a new record or updates an existing one.
     */

    if (editingTrainingId) {
      await updateTraining(editingTrainingId, trainingData);
    } else {
      await createTraining(trainingData);
    }

    /*
     * These lines run only after a successful save.
     * If the operation throws, TrainingForm catches
     * the error and keeps the form open.
     */

    setEditingTrainingId(null);
    setIsFormOpen(false);
  };

  /*
   * =========================================
   * Archive
   * =========================================
   */

  const handleArchiveTraining = async (training) => {
    try {
      await archiveTraining(training.id);

      if (editingTrainingId === training.id) {
        handleCloseForm();
      }
    } catch {
      /*
       * TrainingDataContext displays the error.
       */
    }
  };

  /*
   * =========================================
   * Restore
   * =========================================
   */

  const handleRestoreTraining = async (training) => {
    try {
      await restoreTraining(training.id);
    } catch {
      /*
       * TrainingDataContext displays the error.
       */
    }
  };

  /*
   * =========================================
   * Delete
   * =========================================
   */

  const handleDeleteTraining = async (training) => {
    const trainingTitle = getTrainingTitle(training);

    const providerName = getTrainingProviderName(training);

    const shouldDelete = window.confirm(
      `Permanently delete "${trainingTitle}" from "${providerName}"?\n\n` +
        "Its supporting document files will also be removed. This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteTraining(training.id);

      if (editingTrainingId === training.id) {
        handleCloseForm();
      }
    } catch {
      /*
       * TrainingDataContext displays the error.
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

    setEditingTrainingId(null);
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
    refreshTraining({
      includeArchived: true,
    }).catch(() => {
      /*
       * TrainingDataContext displays the error.
       */
    });
  };

  return (
    <main className="training-page">
      <TrainingPageHeader
        totalTraining={trainingRecords.length}
        activeCount={activeTrainingRecords.length}
        archivedCount={archivedTrainingRecords.length}
        showArchived={showArchived}
        isLoading={isLoading}
        onAddTraining={handleAddTraining}
        onToggleArchived={handleToggleArchived}
      />

      <TrainingDashboard statistics={statistics} isLoading={isLoading} />

      {/* Global Error */}

      {error && (
        <section
          className="training-page-message training-page-message--error"
          role="alert"
        >
          <div>
            <strong>Unable to complete the training operation</strong>

            <p>{error.message}</p>

            {error.code === "TRAINING_DELETE_PARTIAL" && (
              <small>
                The supporting files were removed, but the saved record may
                still appear. Try deleting the record again.
              </small>
            )}
          </div>

          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </section>
      )}

      {/* Save Status */}

      {saveStatus === "success" && (
        <section
          className="training-page-message training-page-message--success"
          role="status"
        >
          <div>
            <strong>Training changes saved</strong>

            <p>Your Training Library has been updated successfully.</p>
          </div>

          <button type="button" onClick={resetSaveStatus}>
            Dismiss
          </button>
        </section>
      )}

      {saveStatus === "saving" && (
        <section
          className="training-page-message training-page-message--saving"
          role="status"
          aria-live="polite"
        >
          <span className="training-page-message-loader" aria-hidden="true" />

          <div>
            <strong>Saving training</strong>

            <p>Your training information is being updated.</p>
          </div>
        </section>
      )}

      {/* Temporary Form Shell */}

      {isFormOpen && (
        <section className="training-page-form">
          <header className="training-page-form-header">
            <div>
              <span>Training Editor</span>

              <h2>
                {editingTraining
                  ? `Edit ${getTrainingTitle(editingTraining)}`
                  : "Add Training"}
              </h2>

              <p>
                Create a reusable training record for résumés, portfolios,
                certifications, experiences, and future projects.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseForm}
              aria-label="Close training form"
            >
              ×
            </button>
          </header>

          <TrainingForm
            initialTraining={editingTraining}
            isSaving={saveStatus === "saving"}
            onSubmit={handleSaveTraining}
            onCancel={handleCloseForm}
          />
        </section>
      )}

      {/* Temporary Training Library */}

      <TrainingLibrary
        trainingRecords={selectedTraining}
        showArchived={showArchived}
        isLoading={isLoading}
        loadStatus={loadStatus}
        operation={operation}
        onAddTraining={handleAddTraining}
        onRetry={handleRetryLoading}
        onEdit={handleEditTraining}
        onArchive={handleArchiveTraining}
        onRestore={handleRestoreTraining}
        onDelete={handleDeleteTraining}
      />
    </main>
  );
}

export default Training;
