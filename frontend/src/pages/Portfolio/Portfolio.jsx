import { useNavigate } from "react-router-dom";

import { usePortfolioDraft } from "../../context/PortfolioDraftContext";
import { useProfileData } from "../../context/ProfileDataContext";
import { useResumeData } from "../../context/ResumeDataContext";

import { buildSelectedProfile } from "../../services/Portfolio/profileSelectionUtils";
import { savePortfolio } from "../../services/Portfolio/portfolioService";

import PortfolioAboutBuilder from "./components/PortfolioAboutBuilder/PortfolioAboutBuilder";

import Certifications from "./components/Certifications/Certifications";
import Education from "./components/Education/Education";
import Experience from "./components/Experience/Experience";
import PortfolioPageHeader from "./components/PortfolioPageHeader/PortfolioPageHeader";
import ProfileInformationSelector from "./components/ProfileInformationSelector/ProfileInformationSelector";
import Skills from "./components/Skills/Skills";
import PortfolioHeroSettings from "./components/PortfolioHeroSettings/PortfolioHeroSettings";

import "./Portfolio.css";

function Portfolio() {
  const navigate = useNavigate();

  const { profile } = useProfileData();

  const { savedResumes } = useResumeData();

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
    sectionVisibility = {},
    isPublished = false,
  } = portfolioDraft;

  const isSectionVisible = (sectionName) =>
    sectionVisibility[sectionName] !== false;

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

    return {
      ...portfolioDraft,

      selectedProfile,

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
