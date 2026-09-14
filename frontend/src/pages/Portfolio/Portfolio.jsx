import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { usePortfolioDraft } from "../../context/PortfolioDraftContext";
import { useProfileData } from "../../context/ProfileDataContext";
import { useResumeData } from "../../context/ResumeDataContext";
import { useProjectData } from "../../context/ProjectDataContext.jsx";

import { createPublicProject } from "../../models/projectModel.js";

import { buildSelectedProfile } from "../../services/Portfolio/profileSelectionUtils";
import { savePortfolio } from "../../services/Portfolio/portfolioService";

import { sortProjects } from "../../services/Project/projectUtils.js";

import PortfolioAboutBuilder from "./components/PortfolioAboutBuilder/PortfolioAboutBuilder";

import Certifications from "./components/Certifications/Certifications";
import Education from "./components/Education/Education";
import Experience from "./components/Experience/Experience";
import PortfolioPageHeader from "./components/PortfolioPageHeader/PortfolioPageHeader";
import ProfileInformationSelector from "./components/ProfileInformationSelector/ProfileInformationSelector";
import Skills from "./components/Skills/Skills";
import PortfolioHeroSettings from "./components/PortfolioHeroSettings/PortfolioHeroSettings";
import PortfolioProjects from "./components/Projects/Projects";

import "./Portfolio.css";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/*
 * =========================================
 * Selected Project IDs
 * =========================================
 *
 * New portfolio drafts store only Project IDs.
 * Older drafts may contain complete Project
 * objects, so both formats are supported.
 */

function getSelectedProjectIds(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const projectIds = values
    .map((value) =>
      typeof value === "string" ? getText(value) : getText(value?.id),
    )
    .filter(Boolean);

  return [...new Set(projectIds)];
}

/*
 * =========================================
 * Portfolio Editor
 * =========================================
 */

function Portfolio() {
  const navigate = useNavigate();

  const { profile } = useProfileData();

  const { savedResumes } = useResumeData();

  const { projects: projectLibrary, isLoading: areProjectsLoading } =
    useProjectData();

  const { portfolioDraft, updateDraftField, saveStatus, setSaveStatus } =
    usePortfolioDraft();

  const {
    profileSelections = [],

    heroSettings = {},

    about = {
      text: "",
      meta: {},
    },

    experiences = [],
    education = [],
    skills = [],
    certifications = [],
    projects = [],

    sectionVisibility = {},

    isPublished = false,
  } = portfolioDraft;

  /*
   * =========================================
   * Selected Project Identifiers
   * =========================================
   */

  const selectedProjectIds = useMemo(
    () => getSelectedProjectIds(projects),
    [projects],
  );

  /*
   * =========================================
   * Section Visibility
   * =========================================
   */

  const isSectionVisible = (sectionName) =>
    sectionVisibility[sectionName] !== false;

  /*
   * =========================================
   * Public Project Selection
   * =========================================
   *
   * Deleted, missing, and archived Projects
   * must not appear in preview or public output.
   *
   * createPublicProject removes private fields,
   * private media, private documents, and any
   * sections disabled by Project visibility.
   */

  const buildPublicProjectSelection = () => {
    const selectedIdSet = new Set(selectedProjectIds);

    const selectedProjects = (
      Array.isArray(projectLibrary) ? projectLibrary : []
    ).filter(
      (project) =>
        selectedIdSet.has(project.id) && project.recordStatus !== "archived",
    );

    const orderedProjects = sortProjects(selectedProjects, "newest-started");

    return orderedProjects.map((project) => createPublicProject(project));
  };

  /*
   * =========================================
   * Complete Portfolio
   * =========================================
   */

  const buildCompletePortfolio = () => {
    const selectedProfile = buildSelectedProfile(profile, profileSelections);

    const featuredResume =
      savedResumes.find(
        (resume) => resume.id === heroSettings.featuredResumeId,
      ) || null;

    const publicProjects = buildPublicProjectSelection();

    return {
      ...portfolioDraft,

      selectedProfile,

      /*
       * The editor draft contains IDs, while
       * preview and published output contain
       * public-safe Project snapshots.
       */

      projects: publicProjects,

      featuredResume: featuredResume?.isShownOnPortfolio
        ? featuredResume
        : null,
    };
  };

  /*
   * =========================================
   * Preview
   * =========================================
   */

  const handlePreview = () => {
    try {
      const completePortfolio = buildCompletePortfolio();

      sessionStorage.setItem(
        "portfolio-preview",
        JSON.stringify(completePortfolio),
      );

      navigate("/portfolio/preview");
    } catch (error) {
      console.error("Unable to create portfolio preview:", error);

      setSaveStatus("error");
    }
  };

  /*
   * =========================================
   * Save Changes
   * =========================================
   */

  const handleSave = async () => {
    if (saveStatus === "saving") {
      return;
    }

    try {
      setSaveStatus("saving");

      const completePortfolio = buildCompletePortfolio();

      const savedPortfolio = await savePortfolio(completePortfolio);

      updateDraftField("isPublished", savedPortfolio.isPublished);

      setSaveStatus("success");
    } catch (error) {
      console.error("Unable to save portfolio:", error);

      setSaveStatus("error");
    }
  };

  /*
   * =========================================
   * Update Selected Projects
   * =========================================
   */

  const handleSelectedProjectsChange = (projectIds) => {
    updateDraftField("projects", getSelectedProjectIds(projectIds));
  };

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <main className="portfolio-page">
      <PortfolioPageHeader
        onPreview={handlePreview}
        onSave={handleSave}
        isLive={isPublished}
        isSaving={saveStatus === "saving"}
        saveStatus={saveStatus}
      />

      {saveStatus === "success" && (
        <div
          className="portfolio-save-message portfolio-save-message--success"
          role="status"
        >
          <span>Portfolio changes saved successfully.</span>

          <a
            href={`/portfolio/${portfolioDraft.username}/${portfolioDraft.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Public Portfolio
          </a>
        </div>
      )}

      {saveStatus === "error" && (
        <div
          className="portfolio-save-message portfolio-save-message--error"
          role="alert"
        >
          The portfolio could not be saved. Please try again.
        </div>
      )}

      <div className="portfolio-editor">
        {isSectionVisible("profile") && (
          <ProfileInformationSelector
            profile={profile}
            selections={profileSelections}
            onChange={(valueOrUpdater) =>
              updateDraftField("profileSelections", valueOrUpdater)
            }
          />
        )}

        <PortfolioHeroSettings
          profile={profile}
          portfolioDraft={portfolioDraft}
          heroSettings={heroSettings}
          savedResumes={savedResumes}
          onChange={(valueOrUpdater) =>
            updateDraftField("heroSettings", valueOrUpdater)
          }
        />

        {isSectionVisible("summary") && (
          <PortfolioAboutBuilder
            profile={profile}
            portfolioDraft={portfolioDraft}
            about={about}
            onChange={(valueOrUpdater) =>
              updateDraftField("about", valueOrUpdater)
            }
          />
        )}

        {isSectionVisible("experience") && (
          <Experience
            experiences={experiences}
            onChange={(valueOrUpdater) =>
              updateDraftField("experiences", valueOrUpdater)
            }
          />
        )}

        {isSectionVisible("skills") && (
          <Skills
            skills={skills}
            onChange={(valueOrUpdater) =>
              updateDraftField("skills", valueOrUpdater)
            }
          />
        )}

        {isSectionVisible("projects") && (
          <PortfolioProjects
            projects={Array.isArray(projectLibrary) ? projectLibrary : []}
            selectedProjectIds={selectedProjectIds}
            isLoading={areProjectsLoading}
            disabled={saveStatus === "saving"}
            onChange={handleSelectedProjectsChange}
          />
        )}

        {isSectionVisible("education") && (
          <Education
            education={education}
            onChange={(valueOrUpdater) =>
              updateDraftField("education", valueOrUpdater)
            }
          />
        )}

        {isSectionVisible("certifications") && (
          <Certifications
            certifications={certifications}
            onChange={(valueOrUpdater) =>
              updateDraftField("certifications", valueOrUpdater)
            }
          />
        )}
      </div>
    </main>
  );
}

export default Portfolio;
