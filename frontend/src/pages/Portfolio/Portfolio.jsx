import { useNavigate } from "react-router-dom";

import { usePortfolioDraft } from "../../context/PortfolioDraftContext";
import { useProfileData } from "../../context/ProfileDataContext";

import { buildSelectedProfile } from "../../services/Portfolio/profileSelectionUtils";
import { savePortfolio } from "../../services/Portfolio/portfolioService";

import PortfolioPageHeader from "./components/PortfolioPageHeader/PortfolioPageHeader";
import ProfileInformationSelector from "./components/ProfileInformationSelector/ProfileInformationSelector";


import ProfessionalSummary from "./components/ProfessionalSummary/ProfessionalSummary";
import Experience from "./components/Experience/Experience";
import Education from "./components/Education/Education";
import Skills from "./components/Skills/Skills";
import Certifications from "./components/Certifications/Certifications";

import "./Portfolio.css";

function Portfolio() {
  const navigate = useNavigate();

  const { profile } = useProfileData();

  const { portfolioDraft, updateDraftField, saveStatus, setSaveStatus } =
    usePortfolioDraft();

  const {
    profileSelections,
    summary,
    experiences,
    education,
    skills,
    certifications,
    sectionVisibility,
    isPublished,
  } = portfolioDraft;

  const buildCompletePortfolio = () => {
    const selectedProfile = buildSelectedProfile(profile, profileSelections);

    return {
      ...portfolioDraft,
      selectedProfile,
    };
  };

  /*
   * =========================================
   * Preview
   * =========================================
   */

  const handlePreview = () => {
    const completePortfolio = buildCompletePortfolio();

    try {
      sessionStorage.setItem(
        "portfolio-preview",
        JSON.stringify(completePortfolio),
      );

      navigate("/portfolio/preview");
    } catch (error) {
      console.error("Unable to create portfolio preview:", error);
    }
  };

  /*
   * =========================================
   * Save Changes
   * =========================================
   */

  const handleSave = async () => {
    try {
      setSaveStatus("saving");

      const completePortfolio = buildCompletePortfolio();

      const savedPortfolio = await savePortfolio(completePortfolio);

      updateDraftField("isPublished", savedPortfolio.isPublished);

      setSaveStatus("success");

      console.log("Portfolio saved:", savedPortfolio);
    } catch (error) {
      console.error("Unable to save portfolio:", error);

      setSaveStatus("error");
    }
  };

  return (
    <section className="portfolio-page">
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
          Portfolio changes saved successfully.
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
        {sectionVisibility.profile && (
          <ProfileInformationSelector
            profile={profile}
            selections={profileSelections}
            onChange={(valueOrUpdater) =>
              updateDraftField("profileSelections", valueOrUpdater)
            }
          />
        )}

        {sectionVisibility.summary && (
          <ProfessionalSummary
            summary={summary}
            onChange={(valueOrUpdater) =>
              updateDraftField("summary", valueOrUpdater)
            }
          />
        )}

        {sectionVisibility.experience && (
          <Experience
            experiences={experiences}
            onChange={(valueOrUpdater) =>
              updateDraftField("experiences", valueOrUpdater)
            }
          />
        )}

        {sectionVisibility.education && (
          <Education
            education={education}
            onChange={(valueOrUpdater) =>
              updateDraftField("education", valueOrUpdater)
            }
          />
        )}

        {sectionVisibility.skills && (
          <Skills
            skills={skills}
            onChange={(valueOrUpdater) =>
              updateDraftField("skills", valueOrUpdater)
            }
          />
        )}

        {sectionVisibility.certifications && (
          <Certifications
            certifications={certifications}
            onChange={(valueOrUpdater) =>
              updateDraftField("certifications", valueOrUpdater)
            }
          />
        )}
      </div>
    </section>
  );
}

export default Portfolio;
