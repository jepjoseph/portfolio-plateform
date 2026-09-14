import { useMemo, useState } from "react";

import { useTrainingData } from "../../context/TrainingDataContext.jsx";
import { useCertificationData } from "../../context/CertificationDataContext.jsx";

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

  const {
    certifications,
    isLoading: areCertificationsLoading,
    createCertification,
    synchronizeCertifications,
  } = useCertificationData();

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
   * Create Certification from Training
   * =========================================
   */

  const handleCreateCertificationFromTraining = async ({
    certificationData,
    file = null,
  }) => {
    const documentUploads = file
      ? [
          {
            file,

            documentType: "certificate",

            name: certificationData.name || file.name.replace(/\.[^.]+$/, ""),

            description: "Certificate added from the Training editor.",

            isPrimary: true,

            metadata: {
              documentType: "certificate",

              name: certificationData.name || file.name.replace(/\.[^.]+$/, ""),

              description: "Certificate added from the Training editor.",

              isPrimary: true,
            },
          },
        ]
      : [];

    /*
     * Do not add the draft Training relationship here.
     *
     * A new Training has not been saved yet, so the
     * relationship transaction service would not be
     * able to find it in Training storage.
     *
     * TrainingForm links the returned Certification to
     * its draft. Saving the Training then creates the
     * reciprocal relationship.
     */

    const createdCertification = await createCertification(certificationData, {
      documentUploads,

      /*
       * The new Certification has no Training
       * relationships yet, so validation does not need
       * to resolve the unsaved Training draft.
       */

      trainingRecords: null,
    });

    if (!createdCertification?.id) {
      const error = new Error(
        "The Certification was created without a valid identifier.",
      );

      error.publicMessage =
        "The Certification was created, but it could not be linked to the Training.";

      throw error;
    }

    return createdCertification;
  };

  /*
   * =========================================
   * Save Training
   * =========================================
   */

  const handleSaveTraining = async (trainingData) => {
    if (editingTrainingId) {
      await updateTraining(editingTrainingId, trainingData);
    } else {
      await createTraining(trainingData);
    }

    await Promise.resolve(synchronizeCertifications());

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

      await Promise.resolve(synchronizeCertifications());

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

      await Promise.resolve(synchronizeCertifications());
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

      await Promise.resolve(synchronizeCertifications());

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
            certifications={certifications}
            isCertificationDataLoading={areCertificationsLoading}
            isSaving={saveStatus === "saving"}
            onSubmit={handleSaveTraining}
            onCancel={handleCloseForm}
            onCreateCertification={handleCreateCertificationFromTraining}
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
