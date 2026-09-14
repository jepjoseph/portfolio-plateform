import { useId, useMemo, useState } from "react";

import {
  PROJECT_FIELD_LIMITS,
  PROJECT_SKILL_PROFICIENCY_OPTIONS,
} from "../../../../config/projectConfig.js";

import {
  createProjectId,
  createProjectSkillRelationship,
} from "../../../../models/projectModel.js";

import "./ProjectRelationshipEditor.css";

/*
 * =========================================
 * Relationship Groups
 * =========================================
 */

const RELATIONSHIP_GROUPS = [
  {
    key: "skills",
    label: "Skills",
    title: "Related Skills",
    description:
      "Connect capabilities demonstrated through the project, record how each skill was applied, and select the proficiency demonstrated.",
    collectionKey: "skills",
    relationshipKey: "skillRelationships",
    idField: "skillId",
  },
  {
    key: "experiences",
    label: "Experience",
    title: "Related Experience",
    description:
      "Connect professional roles, employers, or client work associated with this project.",
    collectionKey: "experiences",
    relationshipKey: "experienceRelationships",
    idField: "experienceId",
  },
  {
    key: "education",
    label: "Education",
    title: "Related Education",
    description:
      "Connect academic programs, coursework, or institutions that supported the project.",
    collectionKey: "educationRecords",
    relationshipKey: "educationRelationships",
    idField: "educationId",
  },
  {
    key: "training",
    label: "Training",
    title: "Related Training",
    description:
      "Connect professional courses or training programs applied during the project.",
    collectionKey: "trainingRecords",
    relationshipKey: "trainingRelationships",
    idField: "trainingId",
  },
  {
    key: "certifications",
    label: "Certifications",
    title: "Related Certifications",
    description:
      "Connect credentials that validate knowledge or capabilities demonstrated by the project.",
    collectionKey: "certifications",
    relationshipKey: "certificationRelationships",
    idField: "certificationId",
  },
];

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatValue(value) {
  const normalizedValue = getText(value);

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isArchivedRecord(record) {
  return record?.recordStatus === "archived" || record?.status === "archived";
}

/*
 * =========================================
 * Record Display
 * =========================================
 */

function getRecordDisplay(groupKey, record) {
  switch (groupKey) {
    case "skills":
      return {
        name: getText(record?.name) || "Unnamed Skill",

        secondary:
          formatValue(record?.category) || formatValue(record?.type) || "Skill",

        status: formatValue(record?.status),
      };

    case "experiences":
      return {
        name:
          getText(record?.position?.title) ||
          getText(record?.jobTitle) ||
          getText(record?.title) ||
          "Untitled Position",

        secondary:
          getText(record?.organization?.name) ||
          getText(record?.company?.name) ||
          getText(record?.employer) ||
          "Organization not specified",

        status: record?.dates?.isCurrent
          ? "Current"
          : formatValue(record?.recordStatus || record?.status),
      };

    case "education":
      return {
        name:
          getText(record?.credential?.name) ||
          getText(record?.degree?.name) ||
          getText(record?.program?.name) ||
          getText(record?.title) ||
          "Unnamed Credential",

        secondary:
          getText(record?.institution?.name) ||
          getText(record?.school?.name) ||
          "Institution not specified",

        status: record?.dates?.isCurrent
          ? "Current"
          : formatValue(record?.recordStatus || record?.status),
      };

    case "training":
      return {
        name:
          getText(record?.title) ||
          getText(record?.name) ||
          "Untitled Training",

        secondary: getText(record?.provider?.name) || "Provider not specified",

        status:
          formatValue(record?.completion?.status) ||
          formatValue(record?.recordStatus || record?.status),
      };

    case "certifications":
      return {
        name:
          getText(record?.name) ||
          getText(record?.title) ||
          "Unnamed Certification",

        secondary:
          getText(record?.issuingOrganization?.name) ||
          getText(record?.issuer?.name) ||
          "Issuer not specified",

        status:
          formatValue(record?.credential?.state) ||
          formatValue(record?.recordStatus || record?.status),
      };

    default:
      return {
        name: "Unnamed Record",
        secondary: "",
        status: "",
      };
  }
}

/*
 * =========================================
 * Relationship Snapshot
 * =========================================
 */

function createRecordRelationship(group, record, order) {
  const display = getRecordDisplay(group.key, record);

  return {
    id: createProjectId(`project-${group.key}-relationship`),

    [group.idField]: getText(record?.id),

    description: "",

    order,

    snapshot: {
      name: display.name,
      secondaryLabel: display.secondary,
      status: display.status,
    },
  };
}

/*
 * =========================================
 * Relationship Editor
 * =========================================
 */

function ProjectRelationshipEditor({
  project,
  collections = {},
  isLoading = false,
  disabled = false,
  fieldErrors = {},
  onSkillRelationshipsChange,
  onRelatedRecordsChange,
}) {
  const editorId = useId();

  const [activeGroup, setActiveGroup] = useState("skills");

  const [queries, setQueries] = useState({});

  const group =
    RELATIONSHIP_GROUPS.find((item) => item.key === activeGroup) ||
    RELATIONSHIP_GROUPS[0];

  const records = Array.isArray(collections[group.collectionKey])
    ? collections[group.collectionKey].filter((record) => getText(record?.id))
    : [];

  const relationships =
    group.key === "skills"
      ? Array.isArray(project?.skillRelationships)
        ? project.skillRelationships
        : []
      : Array.isArray(project?.relatedRecords?.[group.relationshipKey])
        ? project.relatedRecords[group.relationshipKey]
        : [];

  const query = queries[group.key] || "";

  const maximumForGroup =
    group.key === "skills"
      ? PROJECT_FIELD_LIMITS.maximumSkills
      : PROJECT_FIELD_LIMITS.maximumRelationshipsPerType;

  const errorPrefix =
    group.key === "skills"
      ? "skillRelationships"
      : `relatedRecords.${group.relationshipKey}`;

  const groupError = Object.entries(fieldErrors).find(
    ([field]) => field === errorPrefix || field.startsWith(`${errorPrefix}.`),
  )?.[1];

  /*
   * =========================================
   * Search
   * =========================================
   */

  const filteredRecords = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

    if (terms.length === 0) {
      return records;
    }

    return records.filter((record) => {
      const display = getRecordDisplay(group.key, record);

      const searchableText = [
        display.name,
        display.secondary,
        display.status,
        group.key,
      ]
        .map(getText)
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return terms.every((term) => searchableText.includes(term));
    });
  }, [group.key, query, records]);

  /*
   * =========================================
   * Selected Records
   * =========================================
   */

  const selectedIds = useMemo(
    () =>
      new Set(
        relationships
          .map((relationship) => relationship?.[group.idField])
          .filter(Boolean),
      ),
    [group.idField, relationships],
  );

  /*
   * Keep all selected relationships here,
   * including snapshot-only relationships
   * whose source record was later removed.
   */

  const selectedRelationships = relationships;

  /*
   * =========================================
   * Relationship Updates
   * =========================================
   */

  const updateRelationships = (nextRelationships) => {
    const orderedRelationships = nextRelationships.map(
      (relationship, order) => ({
        ...relationship,
        order,
      }),
    );

    if (group.key === "skills") {
      onSkillRelationshipsChange?.(orderedRelationships);

      return;
    }

    onRelatedRecordsChange?.(group.relationshipKey, orderedRelationships);
  };

  const handleToggle = (record, checked) => {
    const recordId = getText(record?.id);

    if (!recordId) {
      return;
    }

    if (!checked) {
      updateRelationships(
        relationships.filter(
          (relationship) => relationship?.[group.idField] !== recordId,
        ),
      );

      return;
    }

    if (
      isArchivedRecord(record) ||
      relationships.length >= maximumForGroup ||
      selectedIds.has(recordId)
    ) {
      return;
    }

    const relationship =
      group.key === "skills"
        ? createProjectSkillRelationship(record, relationships.length)
        : createRecordRelationship(group, record, relationships.length);

    updateRelationships([...relationships, relationship]);
  };

  const updateRelationshipField = (relationshipId, field, value) => {
    updateRelationships(
      relationships.map((relationship) =>
        relationship.id === relationshipId
          ? {
              ...relationship,
              [field]: value,
            }
          : relationship,
      ),
    );
  };

  const removeRelationship = (relationshipId) => {
    updateRelationships(
      relationships.filter(
        (relationship) => relationship.id !== relationshipId,
      ),
    );
  };

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <section className="project-form-section project-relationship-editor">
      <header className="project-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Professional Relationships</small>

          <h3>Connected Skills and Professional Records</h3>

          <p>
            Connect the evidence behind this project and preserve readable
            snapshots for long-term portfolio history.
          </p>
        </div>
      </header>

      <div
        className="project-relationship-tabs"
        role="tablist"
        aria-label="Project relationship types"
      >
        {RELATIONSHIP_GROUPS.map((relationshipGroup) => {
          const count =
            relationshipGroup.key === "skills"
              ? project?.skillRelationships?.length || 0
              : project?.relatedRecords?.[relationshipGroup.relationshipKey]
                  ?.length || 0;

          const selected = group.key === relationshipGroup.key;

          return (
            <button
              id={`${editorId}-${relationshipGroup.key}-tab`}
              key={relationshipGroup.key}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${editorId}-${relationshipGroup.key}-panel`}
              tabIndex={selected ? 0 : -1}
              className={selected ? "project-relationship-tab--active" : ""}
              onClick={() => setActiveGroup(relationshipGroup.key)}
              disabled={disabled}
            >
              <span>{relationshipGroup.label}</span>

              <small>{count}</small>
            </button>
          );
        })}
      </div>

      <div
        id={`${editorId}-${group.key}-panel`}
        className="project-relationship-panel"
        role="tabpanel"
        aria-labelledby={`${editorId}-${group.key}-tab`}
      >
        <header>
          <div>
            <h4>{group.title}</h4>

            <p>{group.description}</p>
          </div>

          <strong>
            {relationships.length}/{maximumForGroup}
          </strong>
        </header>

        <label className="project-relationship-search">
          <span>Search {group.label}</span>

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQueries((current) => ({
                ...current,
                [group.key]: event.target.value,
              }))
            }
            placeholder={`Search available ${group.label.toLocaleLowerCase()}`}
            disabled={disabled || isLoading}
          />
        </label>

        {isLoading ? (
          <div className="project-relationship-state" role="status">
            Loading available records…
          </div>
        ) : records.length === 0 ? (
          <div className="project-relationship-state">
            No {group.label.toLocaleLowerCase()} records are available.
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="project-relationship-state">
            No records match this search.
          </div>
        ) : (
          <div className="project-relationship-options">
            {filteredRecords.map((record) => {
              const display = getRecordDisplay(group.key, record);

              const checked = selectedIds.has(record.id);

              const archived = isArchivedRecord(record);

              const selectionLimitReached =
                !checked && relationships.length >= maximumForGroup;

              return (
                <label
                  key={record.id}
                  className={[
                    "project-relationship-option",
                    checked ? "project-relationship-option--selected" : "",
                    archived ? "project-relationship-option--archived" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      handleToggle(record, event.target.checked)
                    }
                    disabled={
                      disabled ||
                      (!checked && (archived || selectionLimitReached))
                    }
                  />

                  <span>
                    <strong>{display.name}</strong>

                    <small>{display.secondary}</small>
                  </span>

                  {archived ? (
                    <em>Archived</em>
                  ) : display.status ? (
                    <em>{display.status}</em>
                  ) : null}
                </label>
              );
            })}
          </div>
        )}

        {groupError && (
          <p className="project-relationship-error" role="alert">
            {groupError}
          </p>
        )}

        {selectedRelationships.length > 0 && (
          <div className="project-relationship-selected">
            <header>
              <h5>Relationship Context</h5>

              <p>
                Explain how every selected record contributed to the project or
                was demonstrated by the work.
              </p>
            </header>

            {selectedRelationships.map((relationship, index) => {
              const sourceRecord = records.find(
                (record) => record.id === relationship?.[group.idField],
              );

              const snapshotName =
                group.key === "skills"
                  ? relationship.nameSnapshot
                  : relationship.snapshot?.name;

              const relationshipName =
                snapshotName ||
                getRecordDisplay(group.key, sourceRecord).name ||
                "Related record";

              const sourceUnavailable = !sourceRecord;

              const relationshipError = fieldErrors[`${errorPrefix}.${index}`];

              return (
                <article
                  className="project-relationship-context"
                  key={relationship.id || `${group.key}-${index}`}
                >
                  <header>
                    <div>
                      <strong>{relationshipName}</strong>

                      {sourceUnavailable && (
                        <small>
                          Historical snapshot — source record is no longer
                          available
                        </small>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRelationship(relationship.id)}
                      disabled={disabled}
                      aria-label={`Remove relationship with ${relationshipName}`}
                    >
                      Remove
                    </button>
                  </header>

                  {group.key === "skills" && (
                    <label>
                      <span>Demonstrated Proficiency</span>

                      <select
                        value={relationship.demonstratedProficiency || ""}
                        onChange={(event) =>
                          updateRelationshipField(
                            relationship.id,
                            "demonstratedProficiency",
                            event.target.value,
                          )
                        }
                        disabled={disabled}
                      >
                        {PROJECT_SKILL_PROFICIENCY_OPTIONS.map((option) => (
                          <option
                            key={option.value || "not-specified"}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label>
                    <span>
                      {group.key === "skills"
                        ? "How This Skill Was Applied"
                        : "Relationship Description"}
                    </span>

                    <textarea
                      rows={3}
                      value={
                        group.key === "skills"
                          ? relationship.usageDescription || ""
                          : relationship.description || ""
                      }
                      onChange={(event) =>
                        updateRelationshipField(
                          relationship.id,
                          group.key === "skills"
                            ? "usageDescription"
                            : "description",
                          event.target.value,
                        )
                      }
                      maxLength={PROJECT_FIELD_LIMITS.relationshipDescription}
                      placeholder={
                        group.key === "skills"
                          ? "Explain where and how this skill was used in the project."
                          : "Explain how this professional record supports the project."
                      }
                      disabled={disabled}
                    />
                  </label>

                  {relationshipError && (
                    <p className="project-relationship-error" role="alert">
                      {relationshipError}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProjectRelationshipEditor;
