import { useMemo, useState } from "react";

import { useEducationData } from "../../context/EducationDataContext.jsx";
import { useExperienceData } from "../../context/ExperienceDataContext.jsx";
import { useSkillData } from "../../context/SkillDataContext.jsx";
import { useTrainingData } from "../../context/TrainingDataContext.jsx";

import {
  createEmptySkillUsage,
  createSkillUsageMap,
  getSkillStatistics,
} from "../../services/Skill/skillUtils.js";

import SkillForm from "./components/SkillForm/SkillForm.jsx";
import SkillsDashboard from "./components/SkillsDashboard/SkillsDashboard.jsx";
import SkillsLibrary from "./components/SkillsLibrary/SkillsLibrary.jsx";
import SkillsPageHeader from "./components/SkillsPageHeader/SkillsPageHeader.jsx";

import "./Skills.css";

function Skills() {
  const {
    skills,
    activeSkills,
    archivedSkills,
    isLoading,
    loadStatus,
    saveStatus,
    operation,
    error,
    refreshSkills,
    createSkill,
    updateSkill,
    archiveSkill,
    restoreSkill,
    deleteSkill,
    clearError,
    resetSaveStatus,
  } = useSkillData();

  const { experiences, isLoading: areExperiencesLoading } = useExperienceData();

  const { educationRecords, isLoading: isEducationLoading } =
    useEducationData();

  const { trainingRecords, isLoading: isTrainingLoading } = useTrainingData();

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingSkillId, setEditingSkillId] = useState(null);

  const [showArchived, setShowArchived] = useState(false);

  const statistics = useMemo(() => getSkillStatistics(skills), [skills]);

  const usageBySkillId = useMemo(
    () =>
      createSkillUsageMap({
        skills,
        experiences,
        educationRecords,
        trainingRecords,
      }),
    [skills, experiences, educationRecords, trainingRecords],
  );

  const isUsageLoading =
    areExperiencesLoading || isEducationLoading || isTrainingLoading;

  const selectedSkills = showArchived ? archivedSkills : activeSkills;

  const editingSkill = useMemo(
    () =>
      editingSkillId
        ? skills.find((skill) => skill.id === editingSkillId) || null
        : null,
    [skills, editingSkillId],
  );

  const scrollToForm = () => {
    window.requestAnimationFrame(() => {
      document.querySelector(".skills-page-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleAddSkill = () => {
    setEditingSkillId(null);
    setIsFormOpen(true);
    clearError();
    resetSaveStatus();
    scrollToForm();
  };

  const handleEditSkill = (skill) => {
    setEditingSkillId(skill.id);
    setIsFormOpen(true);
    clearError();
    resetSaveStatus();
    scrollToForm();
  };

  const handleCloseForm = () => {
    setEditingSkillId(null);
    setIsFormOpen(false);
    clearError();
    resetSaveStatus();
  };

  const handleSaveSkill = async (skillData) => {
    if (editingSkillId) {
      await updateSkill(editingSkillId, skillData);
    } else {
      await createSkill(skillData);
    }

    setEditingSkillId(null);
    setIsFormOpen(false);
  };

  const handleArchiveSkill = async (skill) => {
    try {
      await archiveSkill(skill.id);

      if (editingSkillId === skill.id) {
        handleCloseForm();
      }
    } catch {
      // Context displays the error.
    }
  };

  const handleRestoreSkill = async (skill) => {
    try {
      await restoreSkill(skill.id);
    } catch {
      // Context displays the error.
    }
  };

  const handleDeleteSkill = async (skill) => {
    const usage = usageBySkillId[skill.id] || createEmptySkillUsage(skill.id);

    /*
     * The page already knows the skill is referenced,
     * but it still sends the delete request through the
     * service so the structured SKILL_IN_USE conflict
     * is created from storage and displayed consistently.
     */

    if (usage.isUsed) {
      try {
        await deleteSkill(skill.id, {
          usage,
        });
      } catch {
        // Context displays the conflict.
      }

      return;
    }

    const shouldDelete = window.confirm(
      `Permanently delete "${skill.name}"?\n\nThis action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteSkill(skill.id, {
        usage,
      });

      if (editingSkillId === skill.id) {
        handleCloseForm();
      }
    } catch {
      // Context displays the error.
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((current) => !current);

    setEditingSkillId(null);
    setIsFormOpen(false);
    clearError();
    resetSaveStatus();
  };

  const handleRetryLoading = () => {
    refreshSkills({
      includeArchived: true,
    }).catch(() => {});
  };

  return (
    <main className="skills-page">
      <SkillsPageHeader
        totalSkills={skills.length}
        activeCount={activeSkills.length}
        archivedCount={archivedSkills.length}
        showArchived={showArchived}
        isLoading={isLoading}
        onAddSkill={handleAddSkill}
        onToggleArchived={handleToggleArchived}
      />

      <SkillsDashboard statistics={statistics} isLoading={isLoading} />

      {error && error.code !== "SKILL_IN_USE" && (
        <section
          className="skills-page-message skills-page-message--error"
          role="alert"
        >
          <div>
            <strong>Unable to complete the Skill Library operation</strong>

            <p>{error.message}</p>
          </div>

          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </section>
      )}

      {saveStatus === "success" && (
        <section
          className="skills-page-message skills-page-message--success"
          role="status"
        >
          <div>
            <strong>Skill Library changes saved</strong>

            <p>The central Skill Library has been updated successfully.</p>
          </div>

          <button type="button" onClick={resetSaveStatus}>
            Dismiss
          </button>
        </section>
      )}

      {saveStatus === "saving" && (
        <section
          className="skills-page-message skills-page-message--saving"
          role="status"
          aria-live="polite"
        >
          <span className="skills-page-message-loader" aria-hidden="true" />

          <div>
            <strong>Saving skill</strong>

            <p>Your Skill Library is being updated.</p>
          </div>
        </section>
      )}

      {isFormOpen && (
        <section className="skills-page-form">
          <header className="skills-page-form-header">
            <div>
              <span>Skill Editor</span>

              <h2>
                {editingSkill
                  ? `Edit ${editingSkill.name}`
                  : "Add Professional Skill"}
              </h2>

              <p>
                Create a reusable Skill Library record for Experiences,
                Education, Training, Resumes, and Portfolios.
              </p>
            </div>

            <button
              type="button"
              className="skills-page-form-close"
              onClick={handleCloseForm}
              aria-label="Close skill form"
            >
              ×
            </button>
          </header>

          <SkillForm
            initialSkill={editingSkill}
            existingSkills={skills}
            isSaving={saveStatus === "saving"}
            onSubmit={handleSaveSkill}
            onCancel={handleCloseForm}
          />
        </section>
      )}

      <SkillsLibrary
        skills={selectedSkills}
        showArchived={showArchived}
        isLoading={isLoading}
        isUsageLoading={isUsageLoading}
        loadStatus={loadStatus}
        operation={operation}
        usageBySkillId={usageBySkillId}
        conflictError={error?.code === "SKILL_IN_USE" ? error : null}
        onDismissConflict={clearError}
        onAddSkill={handleAddSkill}
        onRetry={handleRetryLoading}
        onEdit={handleEditSkill}
        onArchive={handleArchiveSkill}
        onRestore={handleRestoreSkill}
        onDelete={handleDeleteSkill}
      />
    </main>
  );
}

export default Skills;
