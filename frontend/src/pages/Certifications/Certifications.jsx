import { useMemo, useState } from "react";

import { useCertificationData } from "../../context/CertificationDataContext.jsx";
import { useEducationData } from "../../context/EducationDataContext.jsx";
import { useSkillData } from "../../context/SkillDataContext.jsx";
import { useTrainingData } from "../../context/TrainingDataContext.jsx";

import {
  getCertificationDisplayName,
  getCertificationIssuerName,
} from "../../models/certificationModel.js";

import { getCertificationStatistics } from "../../services/Certification/certificationUtils.js";

import CertificationDashboard from "./components/CertificationDashboard/CertificationDashboard.jsx";
import CertificationForm from "./components/CertificationForm/CertificationForm.jsx";
import CertificationLibrary from "./components/CertificationLibrary/CertificationLibrary.jsx";
import CertificationPageHeader from "./components/CertificationPageHeader/CertificationPageHeader.jsx";

import "./Certifications.css";

function Certifications() {
  const {
    certifications,
    activeCertifications,
    archivedCertifications,
    isLoading,
    loadStatus,
    saveStatus,
    operation,
    error,
    warnings,
    refreshCertifications,
    createCertification,
    updateCertification,
    archiveCertification,
    restoreCertification,
    deleteCertification,
    clearError,
    clearWarnings,
    resetSaveStatus,
  } = useCertificationData();

  const { skills, isLoading: areSkillsLoading } = useSkillData();

  const { trainingRecords, isLoading: isTrainingLoading } = useTrainingData();

  const { educationRecords, isLoading: isEducationLoading } =
    useEducationData();

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingCertificationId, setEditingCertificationId] = useState(null);

  const [showArchived, setShowArchived] = useState(false);

  /*
   * =========================================
   * Derived Information
   * =========================================
   */

  const statistics = useMemo(
    () => getCertificationStatistics(certifications),
    [certifications],
  );

  const editingCertification = useMemo(
    () =>
      editingCertificationId
        ? certifications.find(
            (certification) => certification.id === editingCertificationId,
          ) || null
        : null,
    [certifications, editingCertificationId],
  );

  const displayedCertifications = showArchived
    ? archivedCertifications
    : activeCertifications;

  const areRelationshipsLoading =
    areSkillsLoading || isTrainingLoading || isEducationLoading;

  const validationCollections = useMemo(
    () => ({
      skills,
      trainingRecords,
      educationRecords,
    }),
    [skills, trainingRecords, educationRecords],
  );

  /*
   * =========================================
   * Form Navigation
   * =========================================
   */

  const scrollToForm = () => {
    window.requestAnimationFrame(() => {
      document.querySelector(".certifications-page-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleAddCertification = () => {
    setEditingCertificationId(null);
    setIsFormOpen(true);

    clearError();
    clearWarnings();
    resetSaveStatus();

    scrollToForm();
  };

  const handleEditCertification = (certification) => {
    setEditingCertificationId(certification.id);

    setIsFormOpen(true);

    clearError();
    clearWarnings();
    resetSaveStatus();

    scrollToForm();
  };

  const handleCloseForm = () => {
    setEditingCertificationId(null);
    setIsFormOpen(false);

    clearError();
    clearWarnings();
    resetSaveStatus();
  };

  /*
   * =========================================
   * Save Certification
   * =========================================
   */

  const handleSaveCertification = async (
    certificationData,
    documentUploads = [],
  ) => {
    const options = {
      ...validationCollections,
      documentUploads,
    };

    if (editingCertificationId) {
      await updateCertification(
        editingCertificationId,
        certificationData,
        options,
      );
    } else {
      await createCertification(certificationData, options);
    }

    setEditingCertificationId(null);
    setIsFormOpen(false);
  };

  /*
   * =========================================
   * Archive Certification
   * =========================================
   */

  const handleArchiveCertification = async (certification) => {
    try {
      await archiveCertification(certification.id);

      if (editingCertificationId === certification.id) {
        handleCloseForm();
      }
    } catch {
      /*
       * CertificationDataContext displays
       * the operation error.
       */
    }
  };

  /*
   * =========================================
   * Restore Certification
   * =========================================
   */

  const handleRestoreCertification = async (certification) => {
    try {
      await restoreCertification(certification.id);
    } catch {
      /*
       * CertificationDataContext displays
       * the operation error.
       */
    }
  };

  /*
   * =========================================
   * Delete Certification
   * =========================================
   */

  const handleDeleteCertification = async (certification) => {
    const certificationName = getCertificationDisplayName(certification);

    const issuerName = getCertificationIssuerName(certification);

    const shouldDelete = window.confirm(
      `Permanently delete "${certificationName}" issued by "${issuerName}"?\n\nThe uploaded certificate documents will also be deleted. This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteCertification(certification.id);

      if (editingCertificationId === certification.id) {
        handleCloseForm();
      }
    } catch {
      /*
       * CertificationDataContext displays
       * the operation error.
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

    setEditingCertificationId(null);
    setIsFormOpen(false);

    clearError();
    clearWarnings();
    resetSaveStatus();
  };

  /*
   * =========================================
   * Retry Loading
   * =========================================
   */

  const handleRetryLoading = () => {
    refreshCertifications({
      includeArchived: true,
    }).catch(() => {
      /*
       * CertificationDataContext displays
       * the loading error.
       */
    });
  };

  return (
    <main className="certifications-page">
      <CertificationPageHeader
        totalCertifications={certifications.length}
        activeCount={activeCertifications.length}
        archivedCount={archivedCertifications.length}
        showArchived={showArchived}
        isLoading={isLoading}
        onAddCertification={handleAddCertification}
        onToggleArchived={handleToggleArchived}
      />

      <CertificationDashboard statistics={statistics} isLoading={isLoading} />

      {/* =====================================
          Error Message
          ===================================== */}

      {error && (
        <section
          className="certifications-page-message certifications-page-message--error"
          role="alert"
        >
          <div>
            <strong>
              Unable to complete the Certification Library operation
            </strong>

            <p>{error.message}</p>
          </div>

          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </section>
      )}

      {/* =====================================
          Success Message
          ===================================== */}

      {saveStatus === "success" && (
        <section
          className="certifications-page-message certifications-page-message--success"
          role="status"
        >
          <div>
            <strong>Certification Library changes saved</strong>

            <p>The Certification Library has been updated successfully.</p>
          </div>

          <button type="button" onClick={resetSaveStatus}>
            Dismiss
          </button>
        </section>
      )}

      {/* =====================================
          Saving Message
          ===================================== */}

      {saveStatus === "saving" && (
        <section
          className="certifications-page-message certifications-page-message--saving"
          role="status"
          aria-live="polite"
        >
          <span
            className="certifications-page-message-loader"
            aria-hidden="true"
          />

          <div>
            <strong>Saving certification</strong>

            <p>
              Certification information and document changes are being saved.
            </p>
          </div>
        </section>
      )}

      {/* =====================================
          Validation Warnings
          ===================================== */}

      {warnings.length > 0 && (
        <section
          className="certifications-page-message certifications-page-message--warning"
          role="status"
        >
          <div>
            <strong>Certification saved with suggestions</strong>

            <ul>
              {warnings.map((warning, index) => (
                <li key={warning.code || `${warning.field}-${index}`}>
                  {warning.message}
                </li>
              ))}
            </ul>
          </div>

          <button type="button" onClick={clearWarnings}>
            Dismiss
          </button>
        </section>
      )}

      {/* =====================================
          Certification Form
          ===================================== */}

      {isFormOpen && (
        <section className="certifications-page-form">
          <header className="certifications-page-form-header">
            <div>
              <span>Certification Editor</span>

              <h2>
                {editingCertification
                  ? `Edit ${getCertificationDisplayName(editingCertification)}`
                  : "Add Professional Certification"}
              </h2>

              <p>
                Create a reusable credential record, connect it to Training,
                Education, and Skills, and upload certificate documentation.
              </p>
            </div>

            <button
              type="button"
              className="certifications-page-form-close"
              onClick={handleCloseForm}
              aria-label="Close Certification form"
            >
              ×
            </button>
          </header>

          <CertificationForm
            initialCertification={editingCertification}
            existingCertifications={certifications}
            skills={skills}
            trainingRecords={trainingRecords}
            educationRecords={educationRecords}
            isSaving={saveStatus === "saving"}
            isRelationshipDataLoading={areRelationshipsLoading}
            onSubmit={handleSaveCertification}
            onCancel={handleCloseForm}
          />
        </section>
      )}

      {/* =====================================
          Certification Library
          ===================================== */}

      <CertificationLibrary
        certifications={displayedCertifications}
        showArchived={showArchived}
        isLoading={isLoading}
        loadStatus={loadStatus}
        operation={operation}
        onAddCertification={handleAddCertification}
        onRetry={handleRetryLoading}
        onEdit={handleEditCertification}
        onArchive={handleArchiveCertification}
        onRestore={handleRestoreCertification}
        onDelete={handleDeleteCertification}
      />
    </main>
  );
}

export default Certifications;
