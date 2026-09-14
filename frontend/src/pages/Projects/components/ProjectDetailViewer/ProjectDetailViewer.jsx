import { useEffect, useMemo, useRef, useState } from "react";

import {
  getProjectAwardPlacementLabel,
  getProjectCategoryLabel,
  getProjectLifecycleStatusLabel,
  getProjectOwnershipLabel,
  getProjectRecognitionTypeLabel,
  getProjectSkillProficiencyLabel,
  getProjectTechnologyCategoryLabel,
} from "../../../../config/projectConfig.js";

import { createPublicProject } from "../../../../models/projectModel.js";

import {
  createProjectAssetUrl,
  revokeProjectAssetUrl,
} from "../../../../services/Project/projectAssetStorage.js";

import {
  formatProjectDate,
  getProjectDateRange,
  getProjectFeaturedMedia,
} from "../../../../services/Project/projectUtils.js";

import ProjectMediaViewer from "../ProjectMediaViewer/ProjectMediaViewer.jsx";

import "./ProjectDetailViewer.css";

/*
 * =========================================
 * Helpers
 * =========================================
 */

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

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

function formatFileSize(value) {
  const size = Number(value);

  if (!Number.isFinite(size) || size <= 0) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

/*
 * =========================================
 * Project Detail Viewer
 * =========================================
 */

function ProjectDetailViewer({ project, onClose, onEdit }) {
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  const publicProject = useMemo(
    () => (project ? createPublicProject(project) : null),
    [project],
  );

  const featuredMedia = useMemo(
    () => getProjectFeaturedMedia(publicProject),
    [publicProject],
  );

  const [featuredMediaUrl, setFeaturedMediaUrl] = useState("");

  const [featuredMediaError, setFeaturedMediaError] = useState(false);

  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);

  /*
   * =========================================
   * Featured Media
   * =========================================
   */

  useEffect(() => {
    let isActive = true;
    let createdObjectUrl = "";

    setFeaturedMediaUrl("");
    setFeaturedMediaError(false);

    if (!featuredMedia?.storageKey) {
      return undefined;
    }

    createProjectAssetUrl(featuredMedia.storageKey)
      .then((url) => {
        createdObjectUrl = url;

        if (isActive) {
          setFeaturedMediaUrl(url);
        } else {
          revokeProjectAssetUrl(url);
        }
      })
      .catch(() => {
        if (isActive) {
          setFeaturedMediaError(true);
        }
      });

    return () => {
      isActive = false;

      if (createdObjectUrl) {
        revokeProjectAssetUrl(createdObjectUrl);
      }
    };
  }, [
    featuredMedia?.id,
    featuredMedia?.storageKey,
    featuredMedia?.externalUrl,
  ]);

  /*
   * =========================================
   * Focus and Scrolling
   * =========================================
   */

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;

      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === "function"
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  /*
   * =========================================
   * Keyboard
   * =========================================
   */

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isMediaViewerOpen && !selectedDocument) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMediaViewerOpen, selectedDocument, onClose]);

  if (!publicProject) {
    return null;
  }

  /*
   * =========================================
   * Display Data
   * =========================================
   */

  const featuredSource = featuredMediaUrl || featuredMedia?.externalUrl || "";

  const featuredIsVideo =
    featuredMedia?.type === "video" ||
    featuredMedia?.mimeType?.startsWith("video/");

  const hasOrganization = Boolean(
    publicProject.organization?.name || publicProject.organization?.clientName,
  );

  const hasDates = Boolean(
    publicProject.dates?.startDate ||
    publicProject.dates?.endDate ||
    publicProject.dates?.isCurrent,
  );

  const hasLinks = Object.values(publicProject.links || {}).some(Boolean);

  const hasProblem = Boolean(
    publicProject.problem &&
    (publicProject.problem.statement ||
      publicProject.problem.context ||
      publicProject.problem.importance ||
      publicProject.problem.targetAudience ||
      publicProject.problem.objectives?.length ||
      publicProject.problem.constraints?.length),
  );

  const hasSolution = Boolean(
    publicProject.solution &&
    (publicProject.solution.overview ||
      publicProject.solution.approach ||
      publicProject.solution.architecture ||
      publicProject.solution.features?.length ||
      publicProject.solution.contributions?.length),
  );

  const hasResults = Boolean(
    publicProject.results &&
    (publicProject.results.outcome ||
      publicProject.results.problemsSolved ||
      publicProject.results.impact ||
      publicProject.results.beneficiariesAffected ||
      publicProject.results.metrics?.length ||
      publicProject.results.lessonsLearned ||
      publicProject.results.futureImprovements),
  );

  const relatedRecordGroups = [
    {
      key: "experienceRelationships",
      label: "Experience",
    },
    {
      key: "educationRelationships",
      label: "Education",
    },
    {
      key: "trainingRelationships",
      label: "Training",
    },
    {
      key: "certificationRelationships",
      label: "Certification",
    },
  ];

  const hasRelatedRecords = relatedRecordGroups.some(
    (group) => getArray(publicProject.relatedRecords?.[group.key]).length > 0,
  );

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <>
      <div
        className="project-detail-viewer"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose?.();
          }
        }}
      >
        <article
          className="project-detail-viewer-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-detail-viewer-title"
        >
          <header className="project-detail-viewer-toolbar">
            <div>
              <small>Portfolio Project</small>

              <strong>Professional Case Study</strong>
            </div>

            <div>
              {onEdit && (
                <button type="button" onClick={() => onEdit(project)}>
                  Edit Project
                </button>
              )}

              <button
                ref={closeButtonRef}
                type="button"
                className="project-detail-viewer-close"
                onClick={onClose}
                aria-label="Close Project viewer"
              >
                ×
              </button>
            </div>
          </header>

          <div className="project-detail-viewer-scroll">
            <section className="project-detail-viewer-hero">
              <div className="project-detail-viewer-hero-content">
                <div className="project-detail-viewer-labels">
                  <span>{getProjectCategoryLabel(publicProject.category)}</span>

                  <span>
                    {getProjectLifecycleStatusLabel(
                      publicProject.lifecycleStatus,
                    )}
                  </span>

                  {publicProject.presentation?.isFeatured && (
                    <span>Featured Project</span>
                  )}
                </div>

                <h1 id="project-detail-viewer-title">
                  {publicProject.title || "Untitled Project"}
                </h1>

                <p className="project-detail-viewer-role">
                  {publicProject.role || "Role not specified"}

                  {hasOrganization && (
                    <>
                      <span aria-hidden="true"> · </span>

                      {publicProject.organization.name ||
                        publicProject.organization.clientName}
                    </>
                  )}
                </p>

                {publicProject.presentation?.shortSummary && (
                  <p className="project-detail-viewer-summary">
                    {publicProject.presentation.shortSummary}
                  </p>
                )}

                <div className="project-detail-viewer-overview">
                  {hasDates && (
                    <span>
                      <small>Timeline</small>

                      <strong>{getProjectDateRange(publicProject)}</strong>
                    </span>
                  )}

                  <span>
                    <small>Ownership</small>

                    <strong>
                      {getProjectOwnershipLabel(publicProject.ownership)}
                    </strong>
                  </span>

                  {publicProject.location?.displayValue && (
                    <span>
                      <small>Location</small>

                      <strong>{publicProject.location.displayValue}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="project-detail-viewer-featured">
                {featuredSource && !featuredMediaError && featuredIsVideo && (
                  <video
                    src={featuredSource}
                    muted
                    playsInline
                    preload="metadata"
                    aria-label={
                      featuredMedia.altText ||
                      featuredMedia.caption ||
                      featuredMedia.name ||
                      `${publicProject.title} featured video`
                    }
                    onClick={() => setIsMediaViewerOpen(true)}
                    onError={() => setFeaturedMediaError(true)}
                  />
                )}

                {featuredSource && !featuredMediaError && !featuredIsVideo && (
                  <img
                    src={featuredSource}
                    alt={
                      featuredMedia.altText ||
                      featuredMedia.caption ||
                      featuredMedia.name ||
                      `${publicProject.title} featured media`
                    }
                    onClick={() => setIsMediaViewerOpen(true)}
                    onError={() => setFeaturedMediaError(true)}
                  />
                )}

                {(!featuredSource || featuredMediaError) && (
                  <div className="project-detail-viewer-placeholder">
                    <small>Project</small>

                    <strong>
                      {publicProject.title?.slice(0, 1).toUpperCase() || "P"}
                    </strong>
                  </div>
                )}

                {featuredMedia && (
                  <button
                    type="button"
                    onClick={() => setIsMediaViewerOpen(true)}
                  >
                    View Project Media
                  </button>
                )}
              </div>
            </section>

            {hasLinks && (
              <nav
                className="project-detail-viewer-links"
                aria-label="Project links"
              >
                <ProjectLink
                  href={publicProject.links.liveUrl}
                  label="Live Project"
                />

                <ProjectLink
                  href={publicProject.links.repositoryUrl}
                  label="Repository"
                />

                <ProjectLink
                  href={publicProject.links.documentationUrl}
                  label="Documentation"
                />

                <ProjectLink
                  href={publicProject.links.caseStudyUrl}
                  label="External Case Study"
                />

                <ProjectLink
                  href={publicProject.links.videoUrl}
                  label="Demo Video"
                />
              </nav>
            )}

            <div className="project-detail-viewer-story">
              {hasProblem && (
                <DetailSection
                  number="01"
                  label="Problem"
                  title="Problem and Purpose"
                >
                  <DetailText
                    title="Problem or Opportunity"
                    value={publicProject.problem.statement}
                  />

                  <DetailText
                    title="Background and Context"
                    value={publicProject.problem.context}
                  />

                  <DetailText
                    title="Why This Project Mattered"
                    value={publicProject.problem.importance}
                  />

                  <DetailText
                    title="Target Users or Beneficiaries"
                    value={publicProject.problem.targetAudience}
                  />

                  <OrderedList
                    title="Project Objectives"
                    values={publicProject.problem.objectives}
                  />

                  <OrderedList
                    title="Constraints and Requirements"
                    values={publicProject.problem.constraints}
                  />
                </DetailSection>
              )}

              {hasSolution && (
                <DetailSection
                  number="02"
                  label="Approach"
                  title="Solution and Implementation"
                >
                  <DetailText
                    title="Solution Overview"
                    value={publicProject.solution.overview}
                  />

                  <DetailText
                    title="Implementation Approach"
                    value={publicProject.solution.approach}
                  />

                  <DetailText
                    title="Architecture and Technical Design"
                    value={publicProject.solution.architecture}
                  />

                  <OrderedList
                    title="Main Features"
                    values={publicProject.solution.features}
                  />

                  <OrderedList
                    title="My Contributions"
                    values={publicProject.solution.contributions}
                  />
                </DetailSection>
              )}

              {hasResults && (
                <DetailSection
                  number="03"
                  label="Result"
                  title="Results and Professional Impact"
                >
                  <DetailText
                    title="Final Outcome"
                    value={publicProject.results.outcome}
                  />

                  <DetailText
                    title="Problems Solved"
                    value={publicProject.results.problemsSolved}
                  />

                  <DetailText
                    title="Professional or User Impact"
                    value={publicProject.results.impact}
                  />

                  <DetailText
                    title="People or Organizations Affected"
                    value={publicProject.results.beneficiariesAffected}
                  />

                  <MetricList values={publicProject.results.metrics} />

                  <DetailText
                    title="Lessons Learned"
                    value={publicProject.results.lessonsLearned}
                  />

                  <DetailText
                    title="Future Improvements"
                    value={publicProject.results.futureImprovements}
                  />
                </DetailSection>
              )}

              {(publicProject.skillRelationships.length > 0 ||
                publicProject.technologies.length > 0) && (
                <DetailSection
                  number="04"
                  label="Capabilities"
                  title="Skills and Technologies"
                >
                  {publicProject.skillRelationships.length > 0 && (
                    <div className="project-detail-viewer-records">
                      {publicProject.skillRelationships.map((relationship) => (
                        <div key={relationship.id}>
                          <small>Skill</small>

                          <strong>
                            {relationship.nameSnapshot || "Related Skill"}
                          </strong>

                          {relationship.categorySnapshot && (
                            <span>{relationship.categorySnapshot}</span>
                          )}

                          {relationship.demonstratedProficiency && (
                            <span>
                              Demonstrated proficiency:{" "}
                              {getProjectSkillProficiencyLabel(
                                relationship.demonstratedProficiency,
                              )}
                            </span>
                          )}

                          {relationship.usageDescription && (
                            <p>{relationship.usageDescription}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {publicProject.technologies.length > 0 && (
                    <div className="project-detail-viewer-tags">
                      {publicProject.technologies.map((technology) => (
                        <span key={technology.id || technology.name}>
                          <strong>{technology.name}</strong>

                          {technology.category && (
                            <small>
                              {getProjectTechnologyCategoryLabel(
                                technology.category,
                              )}
                            </small>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </DetailSection>
              )}

              {hasRelatedRecords && (
                <DetailSection
                  number="05"
                  label="Evidence"
                  title="Related Professional Records"
                >
                  <div className="project-detail-viewer-records">
                    {relatedRecordGroups.flatMap((group) =>
                      getArray(publicProject.relatedRecords?.[group.key]).map(
                        (relationship) => (
                          <div key={relationship.id}>
                            <small>{group.label}</small>

                            <strong>
                              {relationship.snapshot?.name ||
                                `Related ${group.label}`}
                            </strong>

                            {relationship.snapshot?.secondaryLabel && (
                              <span>
                                {relationship.snapshot.secondaryLabel}
                              </span>
                            )}

                            {relationship.snapshot?.status && (
                              <span>
                                Status:{" "}
                                {formatValue(relationship.snapshot.status)}
                              </span>
                            )}

                            {relationship.description && (
                              <p>{relationship.description}</p>
                            )}
                          </div>
                        ),
                      ),
                    )}
                  </div>
                </DetailSection>
              )}

              {publicProject.awards.length > 0 && (
                <DetailSection
                  number="06"
                  label="Recognition"
                  title="Awards and Recognition"
                >
                  <div className="project-detail-viewer-records">
                    {publicProject.awards.map((award) => (
                      <div key={award.id}>
                        <small>
                          {award.recognitionType
                            ? getProjectRecognitionTypeLabel(
                                award.recognitionType,
                              )
                            : "Recognition"}
                        </small>

                        <strong>{award.name}</strong>

                        {award.organization && (
                          <span>{award.organization}</span>
                        )}

                        <span>
                          {[
                            award.placement
                              ? getProjectAwardPlacementLabel(award.placement)
                              : "",

                            award.date ? formatProjectDate(award.date) : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>

                        {award.description && <p>{award.description}</p>}

                        {award.url && (
                          <a
                            href={award.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Recognition
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {publicProject.supportingDocuments.length > 0 && (
                <DetailSection
                  number="07"
                  label="Documents"
                  title="Project Evidence and Documents"
                >
                  <div className="project-detail-viewer-documents">
                    {publicProject.supportingDocuments.map((documentRecord) => (
                      <div key={documentRecord.id}>
                        <div>
                          <small>
                            {formatValue(documentRecord.documentType)}
                          </small>

                          <strong>
                            {documentRecord.name ||
                              documentRecord.fileName ||
                              "Project Document"}
                          </strong>

                          <span>
                            {[
                              documentRecord.fileName,
                              formatFileSize(documentRecord.fileSize),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>

                          {documentRecord.description && (
                            <p>{documentRecord.description}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedDocument(documentRecord)}
                        >
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {publicProject.presentation?.caseStudy && (
                <DetailSection
                  number="08"
                  label="Case Study"
                  title="Detailed Project Story"
                >
                  <div className="project-detail-viewer-case-study">
                    {publicProject.presentation.caseStudy
                      .split(/\n{2,}/)
                      .map((paragraph) => paragraph.trim())
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={`${index}-${paragraph.slice(0, 20)}`}>
                          {paragraph}
                        </p>
                      ))}
                  </div>
                </DetailSection>
              )}
            </div>
          </div>
        </article>
      </div>

      {isMediaViewerOpen && (
        <ProjectMediaViewer
          project={publicProject}
          initialMediaId={publicProject.presentation?.featuredMediaId}
          publicOnly
          onClose={() => setIsMediaViewerOpen(false)}
        />
      )}

      {selectedDocument && (
        <ProjectDocumentPreview
          documentRecord={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </>
  );
}

/*
 * =========================================
 * Detail Section
 * =========================================
 */

function DetailSection({ number, label, title, children }) {
  return (
    <section className="project-detail-viewer-section">
      <header>
        <span aria-hidden="true">{number}</span>

        <div>
          <small>{label}</small>

          <h2>{title}</h2>
        </div>
      </header>

      <div className="project-detail-viewer-section-content">{children}</div>
    </section>
  );
}

/*
 * =========================================
 * Detail Text
 * =========================================
 */

function DetailText({ title, value }) {
  if (!getText(value)) {
    return null;
  }

  return (
    <div className="project-detail-viewer-text">
      <h3>{title}</h3>

      <p>{value}</p>
    </div>
  );
}

/*
 * =========================================
 * Ordered List
 * =========================================
 */

function OrderedList({ title, values = [] }) {
  const items = getArray(values).filter((item) => getText(item?.text));

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="project-detail-viewer-list">
      <h3>{title}</h3>

      <ol>
        {items.map((item, index) => (
          <li key={item.id || `${title}-${index}`}>{item.text}</li>
        ))}
      </ol>
    </div>
  );
}

/*
 * =========================================
 * Metrics
 * =========================================
 */

function MetricList({ values = [] }) {
  const metrics = getArray(values).filter(
    (metric) => getText(metric?.label) || getText(metric?.value),
  );

  if (metrics.length === 0) {
    return null;
  }

  return (
    <div className="project-detail-viewer-metrics">
      {metrics.map((metric, index) => (
        <div key={metric.id || `metric-${index}`}>
          <strong>{metric.value || "Result"}</strong>

          <span>{metric.label || "Metric"}</span>

          {metric.description && <p>{metric.description}</p>}
        </div>
      ))}
    </div>
  );
}

/*
 * =========================================
 * External Link
 * =========================================
 */

function ProjectLink({ href, label }) {
  if (!getText(href)) {
    return null;
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}

      <span aria-hidden="true">↗</span>
    </a>
  );
}

/*
 * =========================================
 * Document Preview
 * =========================================
 */

function ProjectDocumentPreview({ documentRecord, onClose }) {
  const closeButtonRef = useRef(null);

  const [documentUrl, setDocumentUrl] = useState("");

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isActive = true;
    let createdObjectUrl = "";

    setDocumentUrl("");
    setLoadError("");

    const externalUrl = getText(documentRecord?.externalUrl);

    if (externalUrl) {
      setDocumentUrl(externalUrl);

      return undefined;
    }

    if (!documentRecord?.storageKey) {
      setLoadError(
        "This document does not have a stored file or external address.",
      );

      return undefined;
    }

    createProjectAssetUrl(documentRecord.storageKey)
      .then((url) => {
        createdObjectUrl = url;

        if (isActive) {
          setDocumentUrl(url);
        } else {
          revokeProjectAssetUrl(url);
        }
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setLoadError(
          error?.publicMessage ||
            error?.message ||
            "The Project document could not be loaded.",
        );
      });

    return () => {
      isActive = false;

      if (createdObjectUrl) {
        revokeProjectAssetUrl(createdObjectUrl);
      }
    };
  }, [
    documentRecord?.id,
    documentRecord?.storageKey,
    documentRecord?.externalUrl,
  ]);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const title =
    documentRecord?.name || documentRecord?.fileName || "Project Document";

  const isImage = documentRecord?.mimeType?.startsWith("image/");

  return (
    <div
      className="project-detail-document-viewer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        className="project-detail-document-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-detail-document-title"
      >
        <header>
          <div>
            <small>Project Document</small>

            <h2 id="project-detail-document-title">{title}</h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close document preview"
          >
            ×
          </button>
        </header>

        <div className="project-detail-document-content">
          {!documentUrl && !loadError && (
            <div role="status">Loading document…</div>
          )}

          {loadError && (
            <div className="project-detail-document-error" role="alert">
              <strong>Document unavailable</strong>

              <p>{loadError}</p>
            </div>
          )}

          {documentUrl && !loadError && isImage && (
            <img
              src={documentUrl}
              alt={title}
              onError={() =>
                setLoadError("This image document could not be displayed.")
              }
            />
          )}

          {documentUrl && !loadError && !isImage && (
            <iframe src={documentUrl} title={title} />
          )}
        </div>

        {documentUrl && (
          <footer>
            <a href={documentUrl} target="_blank" rel="noopener noreferrer">
              Open in New Tab
            </a>

            <a href={documentUrl} download={documentRecord.fileName || title}>
              Download
            </a>
          </footer>
        )}
      </section>
    </div>
  );
}

export default ProjectDetailViewer;
