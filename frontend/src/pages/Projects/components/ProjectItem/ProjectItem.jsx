import { useEffect, useMemo, useState } from "react";

import {
  getProjectCategoryLabel,
  getProjectLifecycleStatusLabel,
  getProjectOwnershipLabel,
} from "../../../../config/projectConfig.js";

import {
  createProjectAssetUrl,
  revokeProjectAssetUrl,
} from "../../../../services/Project/projectAssetStorage.js";

import {
  getProjectDateRange,
  getProjectFeaturedMedia,
} from "../../../../services/Project/projectUtils.js";

import ProjectMediaViewer from "../ProjectMediaViewer/ProjectMediaViewer.jsx";

import "./ProjectItem.css";

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

function isActiveMedia(item) {
  return (
    item?.status !== "archived" &&
    Boolean(getText(item?.storageKey) || getText(item?.externalUrl))
  );
}

/*
 * =========================================
 * Project Item
 * =========================================
 */

function ProjectItem({
  project,
  listPosition = 1,
  showArchived = false,
  isSaving = false,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [thumbnailError, setThumbnailError] = useState(false);

  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);

  /*
   * =========================================
   * Featured Media
   * =========================================
   */

  const featuredMedia = useMemo(
    () => getProjectFeaturedMedia(project),
    [project],
  );

  const mediaCollection = useMemo(
    () => getArray(project?.media).filter(isActiveMedia),
    [project?.media],
  );

  const hasMedia = mediaCollection.length > 0;

  const isVideo = Boolean(
    featuredMedia?.type === "video" ||
    featuredMedia?.mimeType?.startsWith("video/"),
  );

  /*
   * =========================================
   * Load IndexedDB Thumbnail
   * =========================================
   */

  useEffect(() => {
    let isActive = true;
    let createdObjectUrl = "";

    setThumbnailUrl("");
    setThumbnailError(false);

    if (!featuredMedia?.storageKey) {
      return undefined;
    }

    createProjectAssetUrl(featuredMedia.storageKey)
      .then((url) => {
        createdObjectUrl = url;

        if (isActive) {
          setThumbnailUrl(url);
        } else {
          revokeProjectAssetUrl(url);
        }
      })
      .catch(() => {
        if (isActive) {
          setThumbnailError(true);
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

  const mediaSource = thumbnailUrl || featuredMedia?.externalUrl || "";

  /*
   * =========================================
   * Project Information
   * =========================================
   */

  const title = getText(project?.title) || "Untitled Project";

  const role = getText(project?.role) || "Role not specified";

  const organizationName =
    getText(project?.organization?.name) ||
    getText(project?.organization?.clientName);

  const portfolioSummary =
    getText(project?.presentation?.shortSummary) ||
    getText(project?.solution?.overview) ||
    getText(project?.problem?.statement) ||
    "Add a portfolio summary to explain the purpose and results of this project.";

  const problemPreview = getText(project?.problem?.statement);

  const solutionPreview = getText(project?.solution?.overview);

  const technologies = getArray(project?.technologies)
    .filter((technology) => getText(technology?.name))
    .slice(0, 5);

  const totalTechnologyCount = getArray(project?.technologies).filter(
    (technology) => getText(technology?.name),
  ).length;

  const additionalTechnologyCount = Math.max(
    0,
    totalTechnologyCount - technologies.length,
  );

  const skillCount = getArray(project?.skillRelationships).length;

  const awardCount = getArray(project?.awards).length;

  const documentCount = getArray(project?.supportingDocuments).filter(
    (document) => document?.status !== "archived",
  ).length;

  const relationshipCount = Object.values(project?.relatedRecords || {}).reduce(
    (total, relationships) => total + getArray(relationships).length,
    0,
  );

  const displayedPosition = String(listPosition).padStart(2, "0");

  const isArchived = showArchived || project?.recordStatus === "archived";

  /*
   * =========================================
   * Actions
   * =========================================
   */

  const openProjectDetails = () => {
    onView?.(project);
  };

  const openMediaViewer = () => {
    if (!hasMedia) {
      return;
    }

    setIsMediaViewerOpen(true);
  };

  const handleMediaError = () => {
    setThumbnailError(true);
  };

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <>
      <article
        className={[
          "project-item",
          isArchived ? "project-item--archived" : "",
          project?.presentation?.isFeatured ? "project-item--featured" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="project-item-preview">
          {mediaSource && !thumbnailError && isVideo && (
            <video
              src={mediaSource}
              muted
              playsInline
              preload="metadata"
              onError={handleMediaError}
              aria-label={
                featuredMedia?.altText || `Video preview for ${title}`
              }
            />
          )}

          {mediaSource && !thumbnailError && !isVideo && (
            <img
              src={mediaSource}
              alt={
                featuredMedia?.altText ||
                featuredMedia?.caption ||
                featuredMedia?.name ||
                `${title} preview`
              }
              onError={handleMediaError}
            />
          )}

          {(!mediaSource || thumbnailError) && (
            <div
              className="project-item-placeholder"
              aria-label={
                thumbnailError
                  ? "Project media preview unavailable"
                  : "No project media"
              }
            >
              <small>Project</small>

              <strong>{title.slice(0, 1).toUpperCase()}</strong>

              <span>{displayedPosition}</span>
            </div>
          )}

          {project?.presentation?.isFeatured && (
            <span className="project-item-featured-label">Featured</span>
          )}

          {isVideo && mediaSource && !thumbnailError && (
            <span className="project-item-video-label" aria-label="Video media">
              ▶ Video
            </span>
          )}

          {hasMedia && (
            <button
              type="button"
              className="project-item-media-button"
              onClick={openMediaViewer}
              disabled={isSaving}
              aria-label={`View media gallery for ${title}`}
            >
              View Media
            </button>
          )}
        </div>

        <div className="project-item-content">
          <header className="project-item-header">
            <div className="project-item-labels">
              <span>{getProjectCategoryLabel(project?.category)}</span>

              <span>
                {getProjectLifecycleStatusLabel(project?.lifecycleStatus)}
              </span>

              {awardCount > 0 && (
                <span className="project-item-award-label">
                  {awardCount === 1
                    ? "Recognized"
                    : `${awardCount} Recognitions`}
                </span>
              )}

              {isArchived && (
                <span className="project-item-archived-label">Archived</span>
              )}
            </div>

            <div className="project-item-title-row">
              <div>
                <h3>{title}</h3>

                <p className="project-item-role">
                  {role}

                  {organizationName && (
                    <>
                      <span aria-hidden="true"> · </span>

                      {organizationName}
                    </>
                  )}
                </p>
              </div>

              <span
                className="project-item-position"
                aria-label={`Project ${listPosition}`}
              >
                {displayedPosition}
              </span>
            </div>
          </header>

          <p className="project-item-summary">{portfolioSummary}</p>

          {(problemPreview || solutionPreview) && (
            <div className="project-item-story">
              {problemPreview && (
                <div>
                  <strong>Problem</strong>

                  <p>{problemPreview}</p>
                </div>
              )}

              {solutionPreview && (
                <div>
                  <strong>Solution</strong>

                  <p>{solutionPreview}</p>
                </div>
              )}
            </div>
          )}

          <div className="project-item-metadata">
            <span>
              <strong>Timeline</strong>

              {getProjectDateRange(project)}
            </span>

            <span>
              <strong>Ownership</strong>

              {getProjectOwnershipLabel(project?.ownership)}
            </span>

            {skillCount > 0 && (
              <span>
                <strong>Skills</strong>

                {skillCount}
              </span>
            )}

            {relationshipCount > 0 && (
              <span>
                <strong>Related Records</strong>

                {relationshipCount}
              </span>
            )}

            {mediaCollection.length > 0 && (
              <span>
                <strong>Media</strong>

                {mediaCollection.length}
              </span>
            )}

            {documentCount > 0 && (
              <span>
                <strong>Documents</strong>

                {documentCount}
              </span>
            )}
          </div>

          {technologies.length > 0 && (
            <div
              className="project-item-technologies"
              aria-label="Project technologies"
            >
              {technologies.map((technology) => (
                <span key={technology.id || technology.name}>
                  {technology.name}
                </span>
              ))}

              {additionalTechnologyCount > 0 && (
                <span>+{additionalTechnologyCount} more</span>
              )}
            </div>
          )}

          <footer className="project-item-actions">
            {onView && (
              <button
                type="button"
                className="project-item-view-button"
                onClick={openProjectDetails}
                disabled={isSaving}
              >
                View
              </button>
            )}

            {hasMedia && (
              <button
                type="button"
                onClick={openMediaViewer}
                disabled={isSaving}
              >
                View Media
              </button>
            )}

            {!isArchived && (
              <>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(project)}
                    disabled={isSaving}
                  >
                    Edit
                  </button>
                )}

                {onArchive && (
                  <button
                    type="button"
                    className="project-item-archive-button"
                    onClick={() => onArchive(project)}
                    disabled={isSaving}
                  >
                    Archive
                  </button>
                )}
              </>
            )}

            {isArchived && (
              <>
                {onRestore && (
                  <button
                    type="button"
                    className="project-item-restore-button"
                    onClick={() => onRestore(project)}
                    disabled={isSaving}
                  >
                    Restore
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    className="project-item-delete-button"
                    onClick={() => onDelete(project)}
                    disabled={isSaving}
                  >
                    Delete Permanently
                  </button>
                )}
              </>
            )}
          </footer>
        </div>
      </article>

      {isMediaViewerOpen && (
        <ProjectMediaViewer
          project={project}
          initialMediaId={featuredMedia?.id}
          onClose={() => setIsMediaViewerOpen(false)}
        />
      )}
    </>
  );
}

export default ProjectItem;
