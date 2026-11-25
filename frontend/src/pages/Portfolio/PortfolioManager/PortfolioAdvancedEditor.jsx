import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useProfileData } from "../../../context/ProfileDataContext";
import { useResumeData } from "../../../context/ResumeDataContext";
import { useProjectData } from "../../../context/ProjectDataContext.jsx";
import { useExperienceData } from "../../../context/ExperienceDataContext.jsx";
import { useEducationData } from "../../../context/EducationDataContext.jsx";
import { useSkillData } from "../../../context/SkillDataContext.jsx";
import { useCertificationData } from "../../../context/CertificationDataContext.jsx";
import { useTrainingData } from "../../../context/TrainingDataContext.jsx";
import { portfolioBackendService as api } from "../../../services/Portfolio/portfolioBackendService.js";
import { createDefaultSections, portfolioCompositionService } from "../../../services/Portfolio/portfolioCompositionService.js";
import { buildSelectedProfile } from "../../../services/Portfolio/profileSelectionUtils";
import { applyProjectDisplay } from "../../../services/Portfolio/projectDisplaySettings.js";
import { createPublicProject } from "../../../models/projectModel.js";
import ProfileInformationSelector from "../components/ProfileInformationSelector/ProfileInformationSelector";
import PortfolioHeroSettings from "../components/PortfolioHeroSettings/PortfolioHeroSettings";
import PortfolioAboutBuilder from "../components/PortfolioAboutBuilder/PortfolioAboutBuilder";
import PortfolioView from "../PortfolioView/PortfolioView";
import "../Portfolio.css";
import PortfolioSourceSelector from "./PortfolioSourceSelector";
import "./PortfolioManager.css";

import PortfolioUrlManager from "./PortfolioUrlManager.jsx";
import PortfolioPublicationManager from "./PortfolioPublicationManager.jsx";

function Editor({ portfolioId, previewOnly }) {
  const navigate = useNavigate();
  const [createdId, setCreatedId] = useState(null);
  const id = portfolioId || createdId;
  const [creationUncertain, setCreationUncertain] = useState(false);
  const { profile } = useProfileData();
  const { savedResumes = [] } = useResumeData();
  const { projects = [] } = useProjectData();
  const experienceLibrary = useExperienceData();
  const educationLibrary = useEducationData();
  const skillLibrary = useSkillData();
  const certificationLibrary = useCertificationData();
  const trainingLibrary = useTrainingData();
  const [record, setRecord] = useState(null);
  const [urlRevision, setUrlRevision] = useState(0);
  const [publicationRevision, setPublicationRevision] = useState(0);

  const synchronizeVersion = version => {
    if (!version) return;

    setRecord(current => current ? {
      ...current,
      rowVersion: version,
      portfolio: {
        ...current.portfolio,
        rowVersion: version,
      },
    } : current);
  };
  const [configuration, setConfiguration] = useState(null);
  const [draft, setDraft] = useState(null);
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(previewOnly);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    const load = portfolioId ? portfolioCompositionService.load(portfolioId) : Promise.resolve({ portfolio: { title: "", purpose: "professional", professionalField: "technology_engineering", style: "technical", draftData: {} }, sections: createDefaultSections(), items: [], rowVersion: null });
    load.then(result => {
      if (!active) return;
      const p = result.portfolio;
      const data = p.draftData || {};
      const initial = { ...data, profileSelections: data.profileSelections || [],
        heroSettings: { ...data.heroSettings, portfolioStyle: p.style },
        about: { text: "", meta: {}, ...data.about } };
      setRecord({ ...result, baseline: initial });
      setDraft(initial);
      setSections(result.sections);
      setItems(result.items);
      setConfiguration({
        title: p.title,
        purpose: p.purpose,
        professionalField: p.professionalField
      });
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [portfolioId]);
  const dirty = !!record && !!draft && !!configuration && (
    JSON.stringify(draft) !== JSON.stringify(record.baseline) ||
    configuration.title !== record.portfolio.title ||
    configuration.purpose !== record.portfolio.purpose ||
    configuration.professionalField !== record.portfolio.professionalField ||
    JSON.stringify(sections) !== JSON.stringify(record.sections) ||
    JSON.stringify(items) !== JSON.stringify(record.items)
  );
  useEffect(() => {
    if (!dirty) return;
    const warn = e => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const change = (key, value) => {
    if (lock.current) return;
    setMessage("");
    setDraft(current => ({ ...current, [key]: typeof value === "function" ? value(current[key]) : value }));
  };
  async function save() {
    if (lock.current || !record || !draft || !configuration || previewOnly || creationUncertain) return;
    if (!configuration.title.trim()) {
      setError("Portfolio name is required.");
      return;
    }
    lock.current = true; setSaving(true); setError(""); setMessage("");
    try {
      const values = {
        ...configuration,
        title: configuration.title.trim(),
        draftData: draft,
        style: draft.heroSettings.portfolioStyle
      };
      let result;
      if (id) { result = await api.updatePortfolio(id, values, record.rowVersion); }
      else {
        setCreationUncertain(true);
        result = await api.createPortfolio(values);
        if (!result.portfolio?.id || !result.portfolio?.rowVersion) throw new Error("Creation not confirmed. Return to the library and check before retrying.");
        setCreatedId(result.portfolio.id);
        setCreationUncertain(false);
      }
      if (!result.portfolio?.rowVersion) throw new Error("Save not confirmed; reload before retrying.");
      setRecord(current => ({ ...current, portfolio: result.portfolio, rowVersion: result.portfolio.rowVersion, baseline: draft, sections: current.rowVersion ? current.sections : [] }));
      setConfiguration({
        title: result.portfolio.title,
        purpose: result.portfolio.purpose,
        professionalField: result.portfolio.professionalField
      });
      let version = result.portfolio.rowVersion;

      const sectionsChanged =
        JSON.stringify(sections) !== JSON.stringify(record.sections);

      const itemsChanged =
        JSON.stringify(items) !== JSON.stringify(record.items);

      if (!record.rowVersion || sectionsChanged || itemsChanged) {
        const savedSections = await portfolioCompositionService.saveSections(
          result.portfolio.id, sections, version
        );

        version = savedSections.rowVersion;

        setSections(savedSections.sections);

        setRecord(current => ({
          ...current,
          sections: savedSections.sections,
          rowVersion: version
        }));
      }

      if (itemsChanged) {
        const savedItems = await portfolioCompositionService.saveItems(
          result.portfolio.id, items, version
        );

        setItems(savedItems.items);

        setRecord(current => ({
          ...current,
          items: savedItems.items,
          rowVersion: savedItems.rowVersion
        }));
      }

      setMessage("Private draft saved.");
      if (!portfolioId) navigate(`/portfolio/manage/${result.portfolio.id}/edit`, { replace: true });
    } catch (e) { setError(e.status === 409 ? "Another browser changed this Portfolio. Your edits remain here; copy them before reloading." : e.message); }
    finally { lock.current = false; setSaving(false); }
  }
  if (!draft || !record || !configuration) return <main className="pm-page"><Link to="/portfolio">Back to Portfolios</Link><p role="status">{error || "Loading Portfolio..."}</p></main>;
  const selectRecords = (sectionKey, records) => {
    const available = new Map(
      (Array.isArray(records) ? records : [])
        .filter(item =>
          item?.id &&
          item.status !== "archived" &&
          item.recordStatus !== "archived"
        )
        .map(item => [String(item.id).toLowerCase(), item])
    );

    return items
      .filter(item => item.sectionKey === sectionKey)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(item =>
        available.get(String(item.sourceRecordId).toLowerCase())
      )
      .filter(Boolean);
  };

  const selectedProjects = selectRecords("projects", projects);
  const ids = new Set(selectedProjects.map(item => item.id));

  const selectedExperiences = selectRecords(
    "experience", experienceLibrary.activeExperiences
  );

  const selectedEducation = selectRecords(
    "education", educationLibrary.activeEducationRecords
  );

  const selectedSkills = selectRecords(
    "skills", skillLibrary.activeSkills
  );

  const selectedCertifications = selectRecords(
    "certifications", certificationLibrary.certifications
  );

  const selectedTrainings = selectRecords(
    "training", trainingLibrary.activeTrainingRecords
  );

  const libraries = [
    experienceLibrary,
    educationLibrary,
    skillLibrary,
    certificationLibrary,
    trainingLibrary
  ];

  const librariesLoading = libraries.some(item => item.isLoading);
  const librariesFailed = libraries.some(item => item.error);
  const visibility = Object.fromEntries(sections.map(s => [s.sectionKey, s.isVisible]));
  const context = { ...draft, id: id || "unsaved", portfolioName: configuration.title, projects: [...ids], sectionVisibility: visibility };
  const resume = savedResumes.find(r => r.id === draft.heroSettings.featuredResumeId && r.isShownOnPortfolio);
  const previewData = { ...context, purpose: configuration.purpose, professionalField: configuration.professionalField, style: draft.heroSettings.portfolioStyle, selectedProfile: buildSelectedProfile(profile, draft.profileSelections), projects: selectedProjects.map(project => applyProjectDisplay(createPublicProject(project), items.find(item => item.sectionKey === "projects" && String(item.sourceRecordId).toLowerCase() === String(project.id).toLowerCase())?.settings?.projectDetails)),
    featuredResume: resume || null,
    experiences: selectedExperiences,
    education: selectedEducation,
    skills: selectedSkills,
    certifications: selectedCertifications,
    trainings: selectedTrainings };
  return <main className="portfolio-page">
    <header className="pm-header"><div><h1>{configuration.title || "Untitled Portfolio"}</h1><p>Portfolio Editor</p></div><Link to="/portfolio" onClick={e => { if (saving || (dirty && !window.confirm("Leave without saving changes?"))) e.preventDefault(); }}>Back to Portfolios</Link></header>
    {!previewOnly && <div className="pm-actions"><button className="pm-button pm-primary" disabled={saving || creationUncertain} onClick={save}>{saving ? "Saving..." : "Save Draft"}</button><button className="pm-button" disabled={saving} onClick={() => setPreview(v => !v)}>{preview ? "Back to editing" : "Private preview"}</button></div>}
    {error && <p role="alert" className="pm-error">{error}</p>}{message && <p role="status">{message}</p>}
    {preview ? <><p>Private owner preview. Public publication applies separate visibility and security rules.</p>
      {librariesLoading && <p role="status">Loading selected records...</p>}
      {librariesFailed && <p role="alert">Some selected records could not be loaded.</p>}<PortfolioView portfolio={previewData} mode="preview" /></> : <fieldset disabled={saving} style={{border:0,padding:0,minWidth:0}} className="portfolio-editor">
      <section className="pm-unified-configuration">
        <h2>Portfolio Configuration</h2>
        <div className="pm-unified-fields">
          <label>
            Portfolio Name
            <input
              maxLength={200}
              required
              value={configuration.title}
              onChange={e => setConfiguration(c => ({
                ...c, title: e.target.value
              }))}
            />
          </label>
          <label>
            Purpose
            <select
              value={configuration.purpose}
              onChange={e => setConfiguration(c => ({
                ...c, purpose: e.target.value
              }))}
            >
              <option value="professional">Professional</option>
              <option value="student">Student</option>
              <option value="researcher">Researcher</option>
              <option value="creative">Creative</option>
              <option value="developer_engineer">Developer / Engineer</option>
              <option value="entrepreneur">Entrepreneur</option>
              <option value="educator">Educator</option>
              <option value="freelancer">Freelancer</option>
            </select>
          </label>
          <label>
            Professional Field
            <select
              value={configuration.professionalField}
              onChange={e => setConfiguration(c => ({
                ...c, professionalField: e.target.value
              }))}
            >
              <option value="technology_engineering">Technology / Engineering</option>
              <option value="corporate_business">Corporate / Business</option>
              <option value="academic_research">Academic / Research</option>
              <option value="art_design">Art / Design</option>
              <option value="architecture_product_design">Architecture / Product Design</option>
              <option value="healthcare_science">Healthcare / Science</option>
            </select>
          </label>
          <label>
            Visual Style
            <select
              value={draft.heroSettings.portfolioStyle}
              onChange={e => {
                const style = e.target.value;
                change("heroSettings", current => ({
                  ...current, portfolioStyle: style
                }));
              }}
            >
              <option value="professional">Professional</option>
              <option value="technical">Technical</option>
              <option value="modern">Modern</option>
              <option value="academic">Academic</option>
            </select>
          </label>
        </div>
        <div className="pm-actions">
          <h3>Live Portfolio Preview</h3>
          <button
            type="button"
            className="pm-button"
            onClick={() => setPreview(true)}
          >
            Full Preview
          </button>
        </div>
        <p>Changes appear immediately. Save Draft to keep them.</p>
        <div className="pm-unified-live-preview">
          <PortfolioView portfolio={previewData} mode="preview" />
        </div>
      </section>
      <ProfileInformationSelector profile={profile} selections={draft.profileSelections} onChange={v => change("profileSelections", v)} />
      <PortfolioHeroSettings profile={profile} portfolioDraft={context} heroSettings={draft.heroSettings} savedResumes={savedResumes} onChange={v => change("heroSettings", v)} />
      <PortfolioAboutBuilder profile={profile} portfolioDraft={context} about={draft.about} onChange={v => change("about", v)} />
    <section className="pm-unified-configuration">
        <h2>Portfolio Sections</h2>
        <p>Select the sections and records to include.</p>

        <div className="pm-unified-fields">
          {sections.map(section => (
            <label key={section.sectionKey}
              style={{flexDirection:"row", alignItems:"center"}}>
              <input
                type="checkbox"
                style={{width:"18px", minHeight:"18px"}}
                checked={section.isVisible}
                onChange={event => {
                  const visible = event.target.checked;
                  setSections(current => current.map(item =>
                    item.sectionKey === section.sectionKey
                      ? {...item, isVisible: visible}
                      : item
                  ));
                }}
              />
              {({
                profile:"Profile",
                summary:"About Me",
                experience:"Experience",
                education:"Education",
                skills:"Skills",
                projects:"Projects",
                certifications:"Certifications",
                training:"Training",
                resume:"Resume"
              })[section.sectionKey] || section.sectionKey}
            </label>
          ))}
        </div>

        <PortfolioSourceSelector
          sections={sections}
          items={items}
          onChange={setItems}
          disabled={saving}
        />
      </section>
    </fieldset>}
    {!previewOnly && !preview && id && !dirty && !saving && <section className="pm-panel"><h2>URLs and publication</h2><PortfolioUrlManager
  portfolioId={id}
  externalRevision={publicationRevision}
  onSaved={version => {
    synchronizeVersion(version);
    setUrlRevision(current => current + 1);
  }}
/>
<PortfolioPublicationManager
  portfolioId={id}
  externalRevision={urlRevision}
  onSaved={version => {
    synchronizeVersion(version);
    setPublicationRevision(current => current + 1);
  }}
/></section>}
  </main>;
}
export default function PortfolioAdvancedEditor({ previewOnly = false }) {
  const { portfolioId } = useParams();
  return <Editor key={`${portfolioId || "create"}-${previewOnly}`} portfolioId={portfolioId} previewOnly={previewOnly} />;
}
