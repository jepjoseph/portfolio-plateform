import { useId } from "react";

import {
  getPortfolioStyleOption,
  PORTFOLIO_STYLE_OPTIONS,
} from "../../../../services/Portfolio/portfolioStyleUtils.js";

import PortfolioTaglineGenerator from "./PortfolioTaglineGenerator/PortfolioTaglineGenerator";

import "./PortfolioHeroSettings.css";

const DEFAULT_HERO_SETTINGS = {
  portfolioStyle: "professional",
  showEyebrow: true,
  tagline: "",

  taglineMeta: {
    source: "manual",
    status: "empty",
    generatedAt: null,
    contextFingerprint: "",
    isStale: false,
  },

  availability: {
    isAvailable: false,
    label: "",
  },

  showLocation: true,
  showSocialLinks: true,
  showProjectsButton: true,
  showResumeButton: true,
  showContactButton: true,
  showWebsiteButton: true,

  featuredResumeId: "",
};

function PortfolioHeroSettings({
  profile = {},
  portfolioDraft = {},
  heroSettings = DEFAULT_HERO_SETTINGS,
  savedResumes = [],
  onChange,
}) {
  const titleId = useId();

  const settings = {
    ...DEFAULT_HERO_SETTINGS,
    ...heroSettings,

    availability: {
      ...DEFAULT_HERO_SETTINGS.availability,
      ...heroSettings.availability,
    },
  };

  const selectedResume =
    savedResumes.find((resume) => resume.id === settings.featuredResumeId) ||
    null;

  /*
   * =========================================
   * Settings Update
   * =========================================
   */

  const updateSettings = (updates) => {
    onChange?.((currentSettings = {}) => ({
      ...DEFAULT_HERO_SETTINGS,
      ...currentSettings,

      availability: {
        ...DEFAULT_HERO_SETTINGS.availability,
        ...currentSettings.availability,
      },

      ...updates,
    }));
  };

  const updateAvailability = (updates) => {
    onChange?.((currentSettings = {}) => ({
      ...DEFAULT_HERO_SETTINGS,
      ...currentSettings,

      availability: {
        ...DEFAULT_HERO_SETTINGS.availability,
        ...currentSettings.availability,
        ...updates,
      },
    }));
  };

  /*
   * =========================================
   * Field Changes
   * =========================================
   */

  const handleTextChange = (event) => {
    const { name, value } = event.target;

    updateSettings({
      [name]: value,
    });
  };

  const handleVisibilityChange = (event) => {
    const { name, checked } = event.target;

    updateSettings({
      [name]: checked,
    });
  };

  const handleAvailabilityChange = (event) => {
    const { name, value, checked, type } = event.target;

    updateAvailability({
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleReset = () => {
    onChange?.({
      ...DEFAULT_HERO_SETTINGS,

      availability: {
        ...DEFAULT_HERO_SETTINGS.availability,
      },
    });
  };

  const handleTaglineChange = (event) => {
    const nextTagline = event.target.value;

    updateSettings({
      tagline: nextTagline,

      taglineMeta: {
        source: "manual",
        status: nextTagline.trim() ? "draft" : "empty",
        generatedAt: null,
        contextFingerprint: "",
        isStale: false,
      },
    });
  };
  return (
    <section
      className="portfolio-hero-settings portfolio-editor-card"
      aria-labelledby={titleId}
    >
      {/* =====================================
          Header
          ===================================== */}

      <header className="portfolio-hero-settings-header">
        <div>
          <span>Portfolio Introduction</span>

          <h3 id={titleId}>Hero Settings</h3>

          <p>
            Customize the professional introduction, availability message,
            featured résumé, and actions shown at the top of your public
            portfolio.
          </p>
        </div>

        <button
          type="button"
          className="portfolio-hero-settings-reset"
          onClick={handleReset}
        >
          Reset
        </button>
      </header>

      {/* =====================================
          Hero Content
          ===================================== */}

      <section className="portfolio-hero-settings-group">
        <header>
          <div>
            <span>Content</span>

            <h4>Introduction</h4>

            <p>
              Keep the tagline concise. Your complete professional story belongs
              in the About section.
            </p>
          </div>

          <span aria-hidden="true">01</span>
        </header>

        <div className="portfolio-hero-settings-fields">
          <div className="portfolio-hero-settings-field">
            <label htmlFor="portfolio-style">Portfolio Style</label>

            <select
              id="portfolio-style"
              name="portfolioStyle"
              value={settings.portfolioStyle}
              onChange={handleTextChange}
            >
              {PORTFOLIO_STYLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <small>
              {getPortfolioStyleOption(settings.portfolioStyle).description}
            </small>
          </div>

          <label className="portfolio-hero-settings-switch">
            <input
              name="showEyebrow"
              type="checkbox"
              checked={settings.showEyebrow}
              onChange={handleVisibilityChange}
            />

            <span>Show the portfolio-style label above my name</span>
          </label>

          <div className="portfolio-hero-settings-field portfolio-hero-settings-field--full">
            <div className="portfolio-hero-settings-label-row">
              <label htmlFor="portfolio-hero-tagline">
                Professional Tagline
              </label>

              <span>{settings.tagline.length}/180</span>
            </div>

            <textarea
              id="portfolio-hero-tagline"
              name="tagline"
              value={settings.tagline || ""}
              onChange={handleTaglineChange}
              rows={3}
              maxLength={180}
              placeholder={
                "Write a short tagline describing what you do and the professional value you provide.\nExample: Creating thoughtful solutions that combine professional expertise, practical skills, and meaningful results."
              }
            />

            <PortfolioTaglineGenerator
              profile={profile}
              portfolioDraft={portfolioDraft}
              tagline={settings.tagline}
              taglineMeta={settings.taglineMeta}
              onChange={(taglineUpdate) => {
                updateSettings(taglineUpdate);
              }}
            />

            <small>Recommended length: 8–20 words.</small>
          </div>
        </div>
      </section>

      {/* =====================================
          Availability
          ===================================== */}

      <section className="portfolio-hero-settings-group">
        <header>
          <div>
            <span>Opportunities</span>

            <h4>Availability</h4>

            <p>
              Tell recruiters, employers, or clients what kinds of opportunities
              you currently welcome.
            </p>
          </div>

          <span aria-hidden="true">02</span>
        </header>

        <label className="portfolio-hero-settings-switch">
          <input
            name="isAvailable"
            type="checkbox"
            checked={settings.availability.isAvailable}
            onChange={handleAvailabilityChange}
          />

          <span>Show an availability message</span>
        </label>

        <div className="portfolio-hero-settings-field">
          <div className="portfolio-hero-settings-label-row">
            <label htmlFor="portfolio-availability-label">
              Availability Message
            </label>

            <span>{settings.availability.label.length}/100</span>
          </div>

          <input
            id="portfolio-availability-label"
            name="label"
            type="text"
            value={settings.availability.label}
            onChange={handleAvailabilityChange}
            disabled={!settings.availability.isAvailable}
            maxLength={100}
            placeholder="Open to internships and technical opportunities"
          />

          <small>
            Avoid publishing availability that is no longer accurate.
          </small>
        </div>
      </section>

      {/* =====================================
          Featured Resume
          ===================================== */}

      <section className="portfolio-hero-settings-group">
        <header>
          <div>
            <span>Featured Document</span>

            <h4>Portfolio Résumé</h4>

            <p>
              Choose which saved résumé visitors can access from the portfolio.
            </p>
          </div>

          <span aria-hidden="true">03</span>
        </header>

        <div className="portfolio-hero-settings-field">
          <label htmlFor="portfolio-featured-resume">Featured Résumé</label>

          <select
            id="portfolio-featured-resume"
            name="featuredResumeId"
            value={settings.featuredResumeId}
            onChange={handleTextChange}
          >
            <option value="">Do not feature a résumé</option>

            {savedResumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.resumeName || "Untitled Résumé"}
                {resume.targetRole ? ` — ${resume.targetRole}` : ""}
              </option>
            ))}
          </select>

          {savedResumes.length === 0 && (
            <small>
              Save a résumé from the Resumes page before selecting one here.
            </small>
          )}
        </div>

        {selectedResume && (
          <article className="portfolio-hero-selected-resume">
            <div aria-hidden="true">CV</div>

            <div>
              <span>Selected Résumé</span>

              <strong>{selectedResume.resumeName || "Untitled Résumé"}</strong>

              <small>{selectedResume.targetRole || "No target position"}</small>
            </div>

            <div className="portfolio-hero-selected-resume-status">
              {selectedResume.isSharedOnline && <span>Public</span>}

              {selectedResume.isShownOnPortfolio && <span>Portfolio</span>}
            </div>
          </article>
        )}

        {selectedResume && !selectedResume.isShownOnPortfolio && (
          <p className="portfolio-hero-resume-warning" role="status">
            This résumé is selected, but “Show on portfolio” is currently
            disabled on the Resumes page.
          </p>
        )}
      </section>

      {/* =====================================
          Visibility
          ===================================== */}

      <section className="portfolio-hero-settings-group">
        <header>
          <div>
            <span>Presentation</span>

            <h4>Visible Information and Actions</h4>

            <p>
              Choose which supporting information and buttons are displayed in
              the hero.
            </p>
          </div>

          <span aria-hidden="true">04</span>
        </header>

        <div className="portfolio-hero-settings-options">
          <HeroVisibilityOption
            name="showLocation"
            label="Location"
            description="Show the selected primary location."
            checked={settings.showLocation}
            onChange={handleVisibilityChange}
          />

          <HeroVisibilityOption
            name="showSocialLinks"
            label="Social Links"
            description="Show selected professional profiles."
            checked={settings.showSocialLinks}
            onChange={handleVisibilityChange}
          />

          <HeroVisibilityOption
            name="showProjectsButton"
            label="Projects Button"
            description="Show View Projects when projects exist."
            checked={settings.showProjectsButton}
            onChange={handleVisibilityChange}
          />

          <HeroVisibilityOption
            name="showResumeButton"
            label="Résumé Button"
            description="Show View Résumé when one is selected."
            checked={settings.showResumeButton}
            onChange={handleVisibilityChange}
          />

          <HeroVisibilityOption
            name="showContactButton"
            label="Contact Button"
            description="Show Contact Me when an email is selected."
            checked={settings.showContactButton}
            onChange={handleVisibilityChange}
          />

          <HeroVisibilityOption
            name="showWebsiteButton"
            label="Website Button"
            description="Show Visit Website when one is selected."
            checked={settings.showWebsiteButton}
            onChange={handleVisibilityChange}
          />
        </div>
      </section>
    </section>
  );
}

function HeroVisibilityOption({ name, label, description, checked, onChange }) {
  return (
    <label className="portfolio-hero-settings-option">
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />

      <span>
        <strong>{label}</strong>

        <small>{description}</small>
      </span>
    </label>
  );
}

export default PortfolioHeroSettings;
