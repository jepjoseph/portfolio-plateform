import { useState } from "react";
import ProjectDisplaySettings from "./ProjectDisplaySettings.jsx";

import { useProjectData } from "../../../context/ProjectDataContext.jsx";
import { useExperienceData } from "../../../context/ExperienceDataContext.jsx";
import { useEducationData } from "../../../context/EducationDataContext.jsx";
import { useSkillData } from "../../../context/SkillDataContext.jsx";
import { useCertificationData } from "../../../context/CertificationDataContext.jsx";
import { useTrainingData } from "../../../context/TrainingDataContext.jsx";

import {
  SECTION_SOURCE_TYPES,
} from "../../../services/Portfolio/portfolioCompositionService.js";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function recordLabel(record, sectionKey) {
  const candidates = {
    projects: [
      record.title,
      record.name,
    ],
    experience: [
      record.position?.title,
      record.jobTitle,
      record.title,
      record.organization?.name,
    ],
    education: [
      record.credential?.name,
      record.institution?.name,
    ],
    skills: [
      record.name,
    ],
    certifications: [
      record.name,
      record.title,
    ],
    training: [
      record.title,
      record.name,
    ],
  };

  return (candidates[sectionKey] || [])
    .map(text)
    .find(Boolean) || record.id;
}

function recordKey(value) {
  return text(value).toLowerCase();
}

function normalizeLibrary(records) {
  const unique = new Map();

  for (const record of Array.isArray(records) ? records : []) {
    const id = recordKey(record?.id);

    if (id && !unique.has(id)) {
      unique.set(id, record);
    }
  }

  return [...unique.values()];
}

function LibrarySelector({
  sectionKey,
  label,
  library,
  records,
  items,
  disabled,
  onChange,
}) {
  const [query, setQuery] = useState("");

  const sourceType = SECTION_SOURCE_TYPES[sectionKey];

  const selected = items.filter(
    item => item.sectionKey === sectionKey,
  );

  const selectedIds = new Set(
    selected.map(item => recordKey(item.sourceRecordId)),
  );

  const available = normalizeLibrary(records);

  const availableIds = new Set(
    available.map(record => recordKey(record.id)),
  );

  const filtered = available.filter(record =>
    recordLabel(record, sectionKey)
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  const unavailable = selected.filter(
    item => !availableIds.has(recordKey(item.sourceRecordId)),
  );

  const libraryReady =
    !library.isLoading && !library.error;

  const locked = disabled || !libraryReady;

  const toggle = record => {
    if (locked) return;

    const id = recordKey(record.id);

    if (selectedIds.has(id)) {
      onChange(items.filter(item =>
        !(
          item.sectionKey === sectionKey &&
          recordKey(item.sourceRecordId) === id
        ),
      ));

      return;
    }

    if (items.length >= 200) return;

    onChange([
      ...items,
      {
        sectionKey,
        sourceType,
        sourceRecordId: record.id,
        sortOrder: selected.length,
        settings: {},
      },
    ]);
  };

  const selectFiltered = () => {
    if (locked) return;

    const additions = filtered
      .filter(record =>
        !selectedIds.has(recordKey(record.id)),
      )
      .slice(0, Math.max(0, 200 - items.length))
      .map((record, index) => ({
        sectionKey,
        sourceType,
        sourceRecordId: record.id,
        sortOrder: selected.length + index,
        settings: {},
      }));

    onChange([...items, ...additions]);
  };

  const clear = () => {
    if (locked) return;

    onChange(
      items.filter(item => item.sectionKey !== sectionKey),
    );
  };

  return (
    <details className="pm-source-library">
      <summary>
        <strong>{label}</strong>
        <span>{selected.length} selected</span>
      </summary>

      <div className="pm-source-content">

        {library.isLoading && (
          <p role="status">Loading library...</p>
        )}

        {library.error && (
          <p className="pm-error" role="alert">
            This library could not be loaded.
            Existing selections have been preserved.
          </p>
        )}

        <input
          type="search"
          className="pm-source-search"
          placeholder={`Search ${label.toLowerCase()}...`}
          aria-label={`Search ${label}`}
          value={query}
          onChange={event => setQuery(event.target.value)}
          disabled={locked}
        />

        <div className="pm-actions">
          <button
            type="button"
            className="pm-button"
            disabled={locked || items.length >= 200}
            onClick={selectFiltered}
          >
            Select matching records
          </button>

          <button
            type="button"
            className="pm-button"
            disabled={locked || selected.length === 0}
            onClick={clear}
          >
            Clear selection
          </button>
        </div>

        <div className="pm-source-records">
          {filtered.map(record => {
            const checked = selectedIds.has(
              recordKey(record.id),
            );

            return (
              <div key={record.id}>
              <label className="pm-source-record">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={
                    locked ||
                    (!checked && items.length >= 200)
                  }
                  onChange={() => toggle(record)}
                />

                <span>{recordLabel(record, sectionKey)}</span>

                {checked && (
                  <small className="pm-source-linked">
                    Linked
                  </small>
                )}
              </label>
              {checked && sectionKey === "projects" && <ProjectDisplaySettings record={record} disabled={locked} value={selected.find(item=>recordKey(item.sourceRecordId)===recordKey(record.id))?.settings?.projectDetails} onChange={value=>onChange(items.map(item=>item.sectionKey===sectionKey && recordKey(item.sourceRecordId)===recordKey(record.id)?{...item,settings:{...item.settings,projectDetails:value}}:item))}/>}
              </div>
            );
          })}

          {libraryReady && filtered.length === 0 && (
            <p>No matching records.</p>
          )}
        </div>

        {libraryReady && unavailable.length > 0 && (
          <div className="pm-source-unavailable">
            <strong>Unavailable linked records</strong>

            <p>
              These records may have been archived,
              deleted or removed from the active library.
            </p>

            {unavailable.map(item => (
              <div
                className="pm-source-record"
                key={item.sourceRecordId}
              >
                <span>{item.sourceRecordId}</span>

                <button
                  type="button"
                  className="pm-button"
                  disabled={disabled}
                  onClick={() => onChange(
                    items.filter(candidate =>
                      !(
                        candidate.sectionKey === sectionKey &&
                        recordKey(candidate.sourceRecordId) ===
                          recordKey(item.sourceRecordId)
                      ),
                    ),
                  )}
                >
                  Unlink
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

export default function PortfolioSourceSelector({
  items,
  sections,
  disabled,
  onChange,
}) {
  const projects = useProjectData();
  const experience = useExperienceData();
  const education = useEducationData();
  const skills = useSkillData();
  const certifications = useCertificationData();
  const training = useTrainingData();

  const libraries = {
    projects: {
      label: "Projects",
      library: projects,
      records: projects.activeProjects,
    },
    experience: {
      label: "Experience",
      library: experience,
      records: experience.activeExperiences,
    },
    education: {
      label: "Education",
      library: education,
      records: education.activeEducationRecords,
    },
    skills: {
      label: "Skills",
      library: skills,
      records: skills.activeSkills,
    },
    certifications: {
      label: "Certifications",
      library: certifications,
      records: certifications.certifications,
    },
    training: {
      label: "Training",
      library: training,
      records: training.activeTrainingRecords,
    },
  };

  return (
    <section className="pm-source-selector">
      <h3>Select Portfolio content</h3>

      <p>
        Link existing library records to this Portfolio.
        Unlinking does not delete the original record.
      </p>

      <p className="pm-section-meta">
        {items.length} of 200 records selected.
      </p>

      {sections
        .filter(section => libraries[section.sectionKey])
        .map(section => {
          const entry = libraries[section.sectionKey];

          return (
            <LibrarySelector
              key={section.sectionKey}
              sectionKey={section.sectionKey}
              label={
                entry.label +
                (section.isVisible ? "" : " (hidden)")
              }
              library={entry.library}
              records={entry.records}
              items={items}
              disabled={disabled}
              onChange={onChange}
            />
          );
        })}
    </section>
  );
}
