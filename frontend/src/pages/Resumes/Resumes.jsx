import { useEffect, useState } from "react";

import { useProfileData } from "../../context/ProfileDataContext";
import { useResumeData } from "../../context/ResumeDataContext";

import { buildSelectedResumeHeader } from "../../services/Resume/resumeSelectionUtils";

import ResumeHeaderBuilder from "./components/ResumeHeaderBuilder/ResumeHeaderBuilder";

import ProfessionalSummaryBuilder from "./components/ProfessionalSummaryBuilder/ProfessionalSummaryBuilder";

import ResumeDocument from "./components/ResumeDocument/ResumeDocument";

import ResumePreviewModal from "./components/ResumePreviewModal/ResumePreviewModal";

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

  summaryMeta: {
    source: "manual",
    status: "empty", //"draft"
    generatedAt: null,
    contextFingerprint: "",
    isStale: false,
  },

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

    summaryMeta: {
      ...EMPTY_RESUME_DRAFT.summaryMeta,
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

/*
 * =========================================
 * Print Resume in an Isolated Document
 * =========================================
 */

async function printResumeDocument(resumeElement, fileName) {
  if (!resumeElement) {
    throw new Error("The printable resume could not be found.");
  }

  const printFrame = document.createElement("iframe");

  printFrame.setAttribute("title", "Resume PDF export");
  printFrame.setAttribute("aria-hidden", "true");
  printFrame.tabIndex = -1;

  Object.assign(printFrame.style, {
    position: "fixed",
    top: "0",
    left: "-100000px",
    width: "816px",
    height: "1056px",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  document.body.appendChild(printFrame);

  const frameWindow = printFrame.contentWindow;
  const frameDocument = printFrame.contentDocument;

  if (!frameWindow || !frameDocument) {
    printFrame.remove();

    throw new Error("The PDF document could not be created.");
  }

  /*
   * Copy the application's stylesheets so
   * ResumeDocument keeps its normal design.
   */

  const applicationStyles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style'),
  )
    .map((styleElement) => styleElement.outerHTML)
    .join("\n");

  const safeTitle =
    String(fileName || "Resume")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-") || "Resume";

  const previousPageTitle = document.title;

  /*
   * Chrome often uses the parent page title as
   * the suggested Save as PDF filename, even
   * when an iframe is being printed.
   */

  document.title = safeTitle;

  const resumeMarkup = resumeElement.outerHTML;

  const frameLoaded = new Promise((resolve) => {
    printFrame.addEventListener("load", resolve, {
      once: true,
    });

    /*
     * Fallback in case the browser does not
     * dispatch a second iframe load event.
     */

    window.setTimeout(resolve, 700);
  });

  frameDocument.open();

  frameDocument.write(`
    <!doctype html>

    <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>${safeTitle}</title>

        ${applicationStyles}

        <style>
          @page {
            size: Letter;
            margin: 0;
          }

          html,
          body {
            width: 8.5in;
            min-height: 11in;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          body {
            overflow: visible;
          }

          *,
          *::before,
          *::after {
            box-sizing: border-box;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .resume-document {
            width: 8.5in !important;
            max-width: none !important;
            min-height: 11in !important;
            margin: 0 !important;
            padding: 0.5in 0.6in !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }

          .resume-document-header {
            flex-direction: row !important;
          }

          .resume-document-section,
          .resume-document-entry {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .resume-document-section > h3 {
            break-after: avoid;
            page-break-after: avoid;
          }
        </style>
      </head>

      <body>
        ${resumeMarkup}
      </body>
    </html>
  `);

  frameDocument.close();

  await frameLoaded;

  /*
   * Wait for fonts and pictures before opening
   * the browser print dialog.
   */

  if (frameDocument.fonts?.ready) {
    try {
      await frameDocument.fonts.ready;
    } catch {
      // The browser can still print with fallback fonts.
    }
  }

  const images = Array.from(frameDocument.images);

  await Promise.all(
    images.map((image) => {
      if (image.complete) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        image.addEventListener("load", resolve, {
          once: true,
        });

        image.addEventListener("error", resolve, {
          once: true,
        });
      });
    }),
  );

  frameWindow.focus();

  const restorePageAfterPrint = () => {
    document.title = previousPageTitle;

    window.setTimeout(() => {
      printFrame.remove();
    }, 300);
  };

  frameWindow.addEventListener("afterprint", restorePageAfterPrint, {
    once: true,
  });

  try {
    frameWindow.print();
  } finally {
    /*
     * In most browsers, print() returns after the
     * print dialog closes. This also handles browsers
     * that do not dispatch the iframe afterprint event.
     */

    window.setTimeout(() => {
      if (document.title === safeTitle) {
        restorePageAfterPrint();
      }
    }, 500);
  }
}

function Resumes() {
  const { profile } = useProfileData();

  const {
    savedResumes,
    persistenceError,
    saveResume,
    deleteResume,
    duplicateResume,
    toggleResumeSetting,
  } = useResumeData();

  const [resumeDraft, setResumeDraft] = useState(createEmptyResumeDraft);

  const [saveStatus, setSaveStatus] = useState("idle");

  const [previewResume, setPreviewResume] = useState(null);

  const [pdfResume, setPdfResume] = useState(null);

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
   * Professional Summary
   * =========================================
   */

  const handleSummaryChange = ({ summary, summaryMeta }) => {
    setResumeDraft((currentDraft) => ({
      ...currentDraft,

      summary,

      summaryMeta: {
        ...EMPTY_RESUME_DRAFT.summaryMeta,
        ...summaryMeta,
      },
    }));

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

      window.requestAnimationFrame(() => {
        const errorMessage = document.getElementById("resume-builder-error");

        errorMessage?.scrollIntoView({
          behavior: "auto",
          block: "center",
        });

        errorMessage?.focus({
          preventScroll: true,
        });
      });

      return;
    }

    const savedResume = saveResume({
      ...resumeDraft,
      resumeName,
      targetRole,
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

      summaryMeta: {
        ...EMPTY_RESUME_DRAFT.summaryMeta,
        ...resume.summaryMeta,
      },

      experiences: [...(resume.experiences || [])],
      education: [...(resume.education || [])],
      skills: [...(resume.skills || [])],
      projects: [...(resume.projects || [])],
      certifications: [...(resume.certifications || [])],

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
    const duplicatedResume = duplicateResume(resume);

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
    deleteResume(resumeId);

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

  const handlePreviewResume = (resume = resumeDraft) => {
    const completeResume = buildCompleteResume(resume);

    setPreviewResume(completeResume);
  };

  const handleClosePreview = () => {
    setPreviewResume(null);
  };

  /*
   * =========================================
   * PDF Export
   * =========================================
   */

  const handleExportPdf = (resume = resumeDraft) => {
    const completeResume = resume.selectedHeader
      ? resume
      : buildCompleteResume(resume);

    setPdfResume(completeResume);
  };

  /*
   * =========================================
   * Sharing Settings
   * =========================================
   */

  /*
   * =========================================
   * Sharing Settings
   * =========================================
   */

  const handleToggleSetting = (resumeId, settingName) => {
    toggleResumeSetting(resumeId, settingName);
  };

  /*
   * =========================================
   * Invalid Form Field
   * =========================================
   */

  const handleInvalidField = (event) => {
    const form = event.currentTarget;
    const firstInvalidField = form.querySelector(":invalid");

    /*
     * Several fields may be invalid, but we only
     * want to scroll to the first invalid field.
     */

    if (!firstInvalidField || event.target !== firstInvalidField) {
      return;
    }

    window.requestAnimationFrame(() => {
      firstInvalidField.scrollIntoView({
        behavior: "auto",
        block: "center",
        inline: "nearest",
      });

      firstInvalidField.focus({
        preventScroll: true,
      });
    });
  };

  /*
   * =========================================
   * Print PDF Document
   * =========================================
   */

  /*
   * =========================================
   * Print PDF Document
   * =========================================
   */

  useEffect(() => {
    if (!pdfResume) {
      return undefined;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      const printableResume = document.querySelector(
        ".resume-pdf-print-root .resume-document",
      );

      if (!printableResume || cancelled) {
        return;
      }

      try {
        await printResumeDocument(printableResume, pdfResume.resumeName);
      } catch (error) {
        console.error("Unable to export resume PDF:", error);
      } finally {
        if (!cancelled) {
          setPdfResume(null);
        }
      }
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pdfResume]);

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

      {persistenceError && (
        <div className="resume-persistence-error" role="alert">
          {persistenceError}
        </div>
      )}

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

        <form
          className="resume-builder-form"
          onSubmit={handleSaveResume}
          onInvalid={handleInvalidField}
        >
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
            Professional Summary
            ===================================== */}

          <section className="resume-builder-section">
            <header className="resume-builder-section-header">
              <div>
                <span>Summary</span>
              </div>

              <span aria-hidden="true">03</span>
            </header>

            <ProfessionalSummaryBuilder
              profile={profile}
              resumeDraft={resumeDraft}
              summary={resumeDraft.summary}
              summaryMeta={resumeDraft.summaryMeta}
              documentType="resume"
              onChange={handleSummaryChange}
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
                "Professional Experience",
                "Skills",
                "Projects",
                "Education",
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
              onClick={() => handlePreviewResume(resumeDraft)}
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
                    onClick={() => handlePreviewResume(resume)}
                  >
                    Preview
                  </button>

                  <button type="button" onClick={() => handleExportPdf(resume)}>
                    PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateResume(resume)}
                  >
                    Duplicate
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditResume(resume)}
                  >
                    Edit
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
      {previewResume && (
        <ResumePreviewModal
          resume={previewResume}
          onClose={handleClosePreview}
          onExportPdf={() => handleExportPdf(previewResume)}
        />
      )}
      {pdfResume && (
        <div className="resume-pdf-print-root" aria-hidden="true">
          <ResumeDocument resume={pdfResume} />
        </div>
      )}
    </main>
  );
}

export default Resumes;
