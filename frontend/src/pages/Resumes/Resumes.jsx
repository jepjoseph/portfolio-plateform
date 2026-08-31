import { useState } from "react";
import { useProfileData } from "../../context/ProfileDataContext";
import { buildSelectedResumeHeader } from "../../services/Resume/resumeSelectionUtils";

import ResumeHeaderBuilder from "./components/ResumeHeaderBuilder/ResumeHeaderBuilder";

import "./Resumes.css";

const EMPTY_RESUME_DRAFT = {
  id: null,

  resumeName: "",
  targetRole: "",
  template: "professional",

  headerSelections: {
    nameOptionId: "",
    professionalTitleId: "",
    emailId: "",
    phoneId: "",
    locationId: "",
    linkedinId: "",
    websiteId: "",
    pictureId: "",
  },

  summary: "",
  experiences: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],

  sectionVisibility: {
    header: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
  },

  isSharedOnline: false,
  isShownOnPortfolio: false,
  publicSlug: "",
};

function createEmptyResumeDraft() {
  return {
    ...EMPTY_RESUME_DRAFT,

    headerSelections: {
      ...EMPTY_RESUME_DRAFT.headerSelections,
    },

    experiences: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],

    sectionVisibility: {
      ...EMPTY_RESUME_DRAFT.sectionVisibility,
    },
  };
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `resume-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not saved";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue));
}

function Resumes() {
  const { profile } = useProfileData();

  const [resumeDraft, setResumeDraft] = useState(createEmptyResumeDraft);

  const [savedResumes, setSavedResumes] = useState([]);

  const [saveStatus, setSaveStatus] = useState("idle");

  const isEditingSavedResume = Boolean(resumeDraft.id);

  /*
   * =========================================
   * A complete-resume builder
   * =========================================
   */

  const buildCompleteResume = (draft = resumeDraft) => {
    const selectedHeader = buildSelectedResumeHeader(
      profile,
      draft.headerSelections,
    );

    return {
      ...draft,
      selectedHeader,
    };
  };

  /*
   * =========================================
   * Draft Changes
   * =========================================
   */

  const handleDraftChange = (event) => {
    const { name, value } = event.target;

    setResumeDraft((currentDraft) => ({
      ...currentDraft,
      [name]: value,
    }));

    setSaveStatus("idle");
  };

  /*
   * =========================================
   * New Resume
   * =========================================
   */

  const handleNewResume = () => {
    setResumeDraft(createEmptyResumeDraft());

    setSaveStatus("idle");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * =========================================
   * Header-selection updater
   * =========================================
   */

  const handleHeaderSelectionsChange = (valueOrUpdater) => {
    setResumeDraft((currentDraft) => {
      const currentSelections = currentDraft.headerSelections || {};

      const nextSelections =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(currentSelections)
          : valueOrUpdater;

      return {
        ...currentDraft,
        headerSelections: nextSelections,
      };
    });

    setSaveStatus("idle");
  };

  /*
   * =========================================
   * Save Resume
   * =========================================
   */

  const handleSaveResume = (event) => {
    event.preventDefault();

    const resumeName = resumeDraft.resumeName.trim();

    const targetRole = resumeDraft.targetRole.trim();

    const selectedHeader = buildSelectedResumeHeader(
      profile,
      resumeDraft.headerSelections,
    );

    if (
      !resumeName ||
      !targetRole ||
      !selectedHeader.name ||
      !selectedHeader.professionalTitle ||
      !selectedHeader.email
    ) {
      setSaveStatus("error");

      return;
    }

    const now = new Date().toISOString();

    const savedResume = {
      ...resumeDraft,

      id: resumeDraft.id || createId(),

      resumeName,
      targetRole,

      publicSlug: resumeDraft.publicSlug || createSlug(resumeName),

      createdAt: resumeDraft.createdAt || now,

      updatedAt: now,
    };

    setSavedResumes((currentResumes) => {
      const resumeExists = currentResumes.some(
        (resume) => resume.id === savedResume.id,
      );

      if (resumeExists) {
        return currentResumes.map((resume) =>
          resume.id === savedResume.id ? savedResume : resume,
        );
      }

      return [savedResume, ...currentResumes];
    });

    setResumeDraft(savedResume);
    setSaveStatus("success");
  };

  /*
   * =========================================
   * Edit Resume
   * =========================================
   */

  const handleEditResume = (resume) => {
    setResumeDraft({
      ...EMPTY_RESUME_DRAFT,
      ...resume,

      headerSelections: {
        ...EMPTY_RESUME_DRAFT.headerSelections,
        ...resume.headerSelections,
      },

      sectionVisibility: {
        ...EMPTY_RESUME_DRAFT.sectionVisibility,
        ...resume.sectionVisibility,
      },
    });

    setSaveStatus("idle");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * =========================================
   * Duplicate Resume
   * =========================================
   */

  const handleDuplicateResume = (resume) => {
    const now = new Date().toISOString();

    const duplicatedResume = {
      ...resume,

      id: createId(),

      resumeName: `${resume.resumeName} Copy`,

      publicSlug: `${createSlug(resume.resumeName)}-copy`,

      isSharedOnline: false,
      isShownOnPortfolio: false,

      createdAt: now,
      updatedAt: now,
    };

    setSavedResumes((currentResumes) => [duplicatedResume, ...currentResumes]);

    setResumeDraft(duplicatedResume);
    setSaveStatus("success");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * =========================================
   * Delete Resume
   * =========================================
   */

  const handleDeleteResume = (resumeId) => {
    setSavedResumes((currentResumes) =>
      currentResumes.filter((resume) => resume.id !== resumeId),
    );

    if (resumeDraft.id === resumeId) {
      setResumeDraft(createEmptyResumeDraft());

      setSaveStatus("idle");
    }
  };

  /*
   * =========================================
   * Preview Resume
   * =========================================
   */

  const handlePreviewResume = () => {
    const completeResume = buildCompleteResume();

    try {
      sessionStorage.setItem("resume-preview", JSON.stringify(completeResume));

      console.log("Resume preview:", completeResume);

      /*
       * Enable this when the preview route exists:
       *
       * navigate("/resumes/preview");
       */
    } catch (error) {
      console.error("Unable to create resume preview:", error);
    }
  };

  /*
   * =========================================
   * Sharing Settings
   * =========================================
   */

  const handleToggleSetting = (resumeId, settingName) => {
    setSavedResumes((currentResumes) =>
      currentResumes.map((resume) =>
        resume.id === resumeId
          ? {
              ...resume,
              [settingName]: !resume[settingName],
              updatedAt: new Date().toISOString(),
            }
          : resume,
      ),
    );
  };

  return (
    <main className="resumes-page">
      {/* =========================================
          Page Header
          ========================================= */}

      <header className="resumes-page-header">
        <div>
          <span className="resumes-page-eyebrow">Career Documents</span>

          <h2>My Resumes</h2>

          <p>
            Build targeted resumes, manage saved versions, share selected
            resumes online, and choose which resumes appear on your portfolio.
          </p>
        </div>

        <button
          type="button"
          className="resumes-new-button"
          onClick={handleNewResume}
        >
          + New Resume
        </button>
      </header>

      {/* =========================================
          Resume Builder
          ========================================= */}

      <section
        className="resume-builder"
        aria-labelledby="resume-builder-title"
      >
        <header className="resume-builder-header">
          <div>
            <span>Resume Builder</span>

            <h3 id="resume-builder-title">
              {isEditingSavedResume
                ? `Editing ${resumeDraft.resumeName}`
                : "Create a Resume"}
            </h3>

            <p>
              Start with the resume setup, then choose reusable information for
              each resume section.
            </p>
          </div>

          <span className="resume-builder-status">
            {isEditingSavedResume ? "Saved Resume" : "New Draft"}
          </span>
        </header>

        <form className="resume-builder-form" onSubmit={handleSaveResume}>
          {/* =====================================
              Resume Setup
              ===================================== */}

          <section className="resume-builder-section">
            <header className="resume-builder-section-header">
              <div>
                <span>Setup</span>

                <h4>Resume Information</h4>

                <p>
                  These fields help you organize your resumes and are not
                  printed on the resume.
                </p>
              </div>

              <span aria-hidden="true">01</span>
            </header>

            <div className="resume-builder-fields">
              <div className="resume-builder-field">
                <label htmlFor="resume-name">Resume Name</label>

                <input
                  id="resume-name"
                  name="resumeName"
                  type="text"
                  value={resumeDraft.resumeName}
                  onChange={handleDraftChange}
                  placeholder="Software Engineer Resume"
                  required
                />
              </div>

              <div className="resume-builder-field">
                <label htmlFor="resume-target-role">Target Position</label>

                <input
                  id="resume-target-role"
                  name="targetRole"
                  type="text"
                  value={resumeDraft.targetRole}
                  onChange={handleDraftChange}
                  placeholder="Software Engineer"
                  required
                />
              </div>

              <div className="resume-builder-field">
                <label htmlFor="resume-template">Template</label>

                <select
                  id="resume-template"
                  name="template"
                  value={resumeDraft.template}
                  onChange={handleDraftChange}
                >
                  <option value="professional">Professional</option>

                  <option value="modern">Modern</option>

                  <option value="technical">Technical</option>

                  <option value="academic">Academic</option>
                </select>
              </div>
            </div>
          </section>

          {/* =====================================
              Resume Header
              ===================================== */}

          <section className="resume-builder-section">
            <header className="resume-builder-section-header">
              <div>
                <span>Header</span>

                <h4>Resume Header</h4>

                <p>
                  Select the name, professional title, location, email, phone,
                  LinkedIn, and website displayed at the top of this resume.
                </p>
              </div>

              <span aria-hidden="true">02</span>
            </header>

            <ResumeHeaderBuilder
              profile={profile}
              selections={resumeDraft.headerSelections}
              onChange={handleHeaderSelectionsChange}
            />
          </section>

          {/* =====================================
              Remaining Sections
              ===================================== */}

          <section className="resume-builder-section">
            <header className="resume-builder-section-header">
              <div>
                <span>Content</span>

                <h4>Resume Sections</h4>

                <p>
                  Build each section using information already managed by your
                  platform.
                </p>
              </div>

              <span aria-hidden="true">03</span>
            </header>

            <div className="resume-section-overview">
              {[
                "Professional Summary",
                "Experience",
                "Education",
                "Skills",
                "Projects",
                "Certifications",
              ].map((sectionName) => (
                <article
                  key={sectionName}
                  className="resume-section-overview-item"
                >
                  <span aria-hidden="true">✦</span>

                  <strong>{sectionName}</strong>

                  <small>Not configured</small>
                </article>
              ))}
            </div>
          </section>

          {/* =====================================
              Save Status
              ===================================== */}

          {saveStatus === "success" && (
            <p
              className="resume-builder-message resume-builder-message--success"
              role="status"
            >
              Resume saved successfully.
            </p>
          )}

          {saveStatus === "error" && (
            <p
              className="resume-builder-message resume-builder-message--error"
              role="alert"
            >
              Enter a resume name and target position, then select a name,
              professional title, and email address.
            </p>
          )}

          {/* =====================================
              Actions
              ===================================== */}

          <div className="resume-builder-actions">
            <button
              type="button"
              className="resume-builder-preview-button"
              onClick={handlePreviewResume}
            >
              Preview Resume
            </button>

            <button type="submit" className="resume-builder-save-button">
              {isEditingSavedResume ? "Save Changes" : "Save Resume"}
            </button>
          </div>
        </form>
      </section>

      {/* =========================================
          Saved Resumes
          ========================================= */}

      <section className="saved-resumes" aria-labelledby="saved-resumes-title">
        <header className="saved-resumes-header">
          <div>
            <span>Resume Library</span>

            <h3 id="saved-resumes-title">Saved Resumes</h3>

            <p>
              Manage resume versions for different positions, applications, and
              public portfolio uses.
            </p>
          </div>

          <span className="saved-resumes-count">{savedResumes.length}</span>
        </header>

        {savedResumes.length > 0 ? (
          <div className="saved-resumes-grid">
            {savedResumes.map((resume) => (
              <article key={resume.id} className="saved-resume-card">
                <header className="saved-resume-card-header">
                  <div className="saved-resume-card-icon" aria-hidden="true">
                    CV
                  </div>

                  <div>
                    <span>{resume.template}</span>

                    <h4>{resume.resumeName}</h4>
                  </div>
                </header>

                <p className="saved-resume-role">{resume.targetRole}</p>

                <div className="saved-resume-meta">
                  <span>Updated {formatDate(resume.updatedAt)}</span>

                  {resume.isSharedOnline && <small>Public</small>}

                  {resume.isShownOnPortfolio && <small>Portfolio</small>}
                </div>

                <div className="saved-resume-settings">
                  <label>
                    <input
                      type="checkbox"
                      checked={resume.isShownOnPortfolio}
                      onChange={() =>
                        handleToggleSetting(resume.id, "isShownOnPortfolio")
                      }
                    />

                    <span>Show on portfolio</span>
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={resume.isSharedOnline}
                      onChange={() =>
                        handleToggleSetting(resume.id, "isSharedOnline")
                      }
                    />

                    <span>Share online</span>
                  </label>
                </div>

                <div className="saved-resume-actions">
                  <button
                    type="button"
                    onClick={() => handleEditResume(resume)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateResume(resume)}
                  >
                    Duplicate
                  </button>

                  <button
                    type="button"
                    className="saved-resume-delete"
                    onClick={() => handleDeleteResume(resume.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="saved-resumes-empty">
            <span aria-hidden="true">CV</span>

            <h4>No saved resumes yet</h4>

            <p>
              Complete the builder above and save your first targeted resume.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default Resumes;
