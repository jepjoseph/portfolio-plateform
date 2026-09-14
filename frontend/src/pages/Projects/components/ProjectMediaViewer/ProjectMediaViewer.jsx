import { useEffect, useMemo, useRef, useState } from "react";

import {
  createProjectAssetUrl,
  revokeProjectAssetUrl,
} from "../../../../services/Project/projectAssetStorage.js";

import "./ProjectMediaViewer.css";

/*
 * =========================================
 * Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasMediaSource(item) {
  return Boolean(getText(item?.storageKey) || getText(item?.externalUrl));
}

function isVideoMedia(item) {
  return Boolean(
    item?.type === "video" || item?.mimeType?.startsWith("video/"),
  );
}

/*
 * =========================================
 * Project Media Viewer
 * =========================================
 */

function ProjectMediaViewer({
  project,
  initialMediaId = "",
  publicOnly = false,
  onClose,
}) {
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  /*
   * =========================================
   * Available Media
   * =========================================
   */

  const media = useMemo(
    () =>
      (Array.isArray(project?.media) ? project.media : []).filter(
        (item) =>
          item?.status !== "archived" &&
          hasMediaSource(item) &&
          (!publicOnly || item?.visibility !== "private"),
      ),
    [project?.media, publicOnly],
  );

  /*
   * =========================================
   * Selected Media
   * =========================================
   */

  const getInitialIndex = () => {
    const requestedIndex = media.findIndex(
      (item) => item.id === initialMediaId,
    );

    return requestedIndex >= 0 ? requestedIndex : 0;
  };

  const [selectedIndex, setSelectedIndex] = useState(getInitialIndex);

  const [assetUrl, setAssetUrl] = useState("");

  const [loadError, setLoadError] = useState("");

  const selectedMedia = media[selectedIndex] || null;

  /*
   * =========================================
   * Reset Selection
   * =========================================
   */

  useEffect(() => {
    const requestedIndex = media.findIndex(
      (item) => item.id === initialMediaId,
    );

    setSelectedIndex(requestedIndex >= 0 ? requestedIndex : 0);
  }, [initialMediaId, media, project?.id]);

  /*
   * =========================================
   * Keep Index Within Bounds
   * =========================================
   */

  useEffect(() => {
    if (media.length === 0) {
      setSelectedIndex(0);

      return;
    }

    if (selectedIndex >= media.length) {
      setSelectedIndex(media.length - 1);
    }
  }, [media.length, selectedIndex]);

  /*
   * =========================================
   * Load IndexedDB Asset
   * =========================================
   */

  useEffect(() => {
    let isActive = true;
    let createdObjectUrl = "";

    setAssetUrl("");
    setLoadError("");

    if (!selectedMedia?.storageKey) {
      return undefined;
    }

    createProjectAssetUrl(selectedMedia.storageKey)
      .then((url) => {
        createdObjectUrl = url;

        if (isActive) {
          setAssetUrl(url);
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
            "The Project media could not be loaded.",
        );
      });

    return () => {
      isActive = false;

      if (createdObjectUrl) {
        revokeProjectAssetUrl(createdObjectUrl);
      }
    };
  }, [
    selectedMedia?.id,
    selectedMedia?.storageKey,
    selectedMedia?.externalUrl,
  ]);

  /*
   * =========================================
   * Navigation
   * =========================================
   */

  const showPreviousMedia = () => {
    if (media.length <= 1) {
      return;
    }

    setSelectedIndex(
      (currentIndex) => (currentIndex - 1 + media.length) % media.length,
    );
  };

  const showNextMedia = () => {
    if (media.length <= 1) {
      return;
    }

    setSelectedIndex((currentIndex) => (currentIndex + 1) % media.length);
  };

  const selectMedia = (mediaId) => {
    const nextIndex = media.findIndex((item) => item.id === mediaId);

    if (nextIndex >= 0) {
      setSelectedIndex(nextIndex);
    }
  };

  /*
   * =========================================
   * Keyboard Navigation
   * =========================================
   */

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();

        return;
      }

      if (media.length <= 1) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousMedia();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextMedia();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [media.length, onClose]);

  /*
   * =========================================
   * Focus and Background Scrolling
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
   * Empty Viewer
   * =========================================
   */

  if (!selectedMedia) {
    return (
      <div
        className="project-media-viewer"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose?.();
          }
        }}
      >
        <section
          className="project-media-viewer-panel project-media-viewer-panel--empty"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-media-viewer-empty-title"
        >
          <header className="project-media-viewer-header">
            <div>
              <small>Project Media</small>

              <h2 id="project-media-viewer-empty-title">
                {project?.title || "Project"}
              </h2>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close project media viewer"
            >
              ×
            </button>
          </header>

          <div className="project-media-viewer-empty">
            <strong>No media available</strong>

            <p>
              Add an image or video with a valid stored file or external URL
              before opening the media viewer.
            </p>
          </div>
        </section>
      </div>
    );
  }

  /*
   * =========================================
   * Media Details
   * =========================================
   */

  const mediaSource = assetUrl || selectedMedia.externalUrl || "";

  const isVideo = isVideoMedia(selectedMedia);

  const mediaTitle =
    selectedMedia.name ||
    selectedMedia.caption ||
    project?.title ||
    "Project media";

  const alternativeText =
    selectedMedia.altText ||
    selectedMedia.caption ||
    selectedMedia.name ||
    project?.title ||
    "Project media";

  const handleDisplayedMediaError = () => {
    setLoadError(
      "This Project media could not be displayed. The file may be unavailable or the external address may no longer work.",
    );
  };

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <div
      className="project-media-viewer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        className="project-media-viewer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-media-viewer-title"
      >
        <header className="project-media-viewer-header">
          <div>
            <small>Project Media</small>

            <h2 id="project-media-viewer-title">{mediaTitle}</h2>

            {project?.title && mediaTitle !== project.title && (
              <p>{project.title}</p>
            )}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close project media viewer"
          >
            ×
          </button>
        </header>

        <div className="project-media-viewer-stage">
          {!mediaSource && !loadError && (
            <div className="project-media-viewer-state" role="status">
              <span className="project-media-viewer-loader" />

              <p>Loading Project media…</p>
            </div>
          )}

          {loadError && (
            <div
              className="project-media-viewer-state project-media-viewer-state--error"
              role="alert"
            >
              <strong>Media unavailable</strong>

              <p>{loadError}</p>
            </div>
          )}

          {mediaSource && !loadError && isVideo && (
            <video
              key={mediaSource}
              src={mediaSource}
              controls
              playsInline
              preload="metadata"
              onError={handleDisplayedMediaError}
              aria-label={alternativeText}
            >
              Your browser does not support the video element.
            </video>
          )}

          {mediaSource && !loadError && !isVideo && (
            <img
              key={mediaSource}
              src={mediaSource}
              alt={alternativeText}
              onError={handleDisplayedMediaError}
            />
          )}

          {media.length > 1 && (
            <>
              <button
                type="button"
                className="project-media-viewer-navigation project-media-viewer-navigation--previous"
                onClick={showPreviousMedia}
                aria-label="View previous Project media"
              >
                ‹
              </button>

              <button
                type="button"
                className="project-media-viewer-navigation project-media-viewer-navigation--next"
                onClick={showNextMedia}
                aria-label="View next Project media"
              >
                ›
              </button>
            </>
          )}
        </div>

        {media.length > 1 && (
          <div
            className="project-media-viewer-thumbnails"
            aria-label="Project media gallery"
          >
            {media.map((mediaItem, index) => {
              const selected = index === selectedIndex;

              return (
                <button
                  key={mediaItem.id}
                  type="button"
                  className={
                    selected ? "project-media-viewer-thumbnail--selected" : ""
                  }
                  onClick={() => selectMedia(mediaItem.id)}
                  aria-current={selected ? "true" : undefined}
                  aria-label={`View ${mediaItem.name || `media ${index + 1}`}`}
                >
                  <span>{isVideoMedia(mediaItem) ? "▶" : "IMG"}</span>

                  <strong>{mediaItem.name || `Media ${index + 1}`}</strong>

                  {mediaItem.visibility === "private" && <small>Private</small>}
                </button>
              );
            })}
          </div>
        )}

        <footer className="project-media-viewer-footer">
          <div className="project-media-viewer-description">
            <strong>
              {selectedMedia.caption || selectedMedia.name || "Project media"}
            </strong>

            {selectedMedia.caption &&
              selectedMedia.name &&
              selectedMedia.caption !== selectedMedia.name && (
                <p>{selectedMedia.caption}</p>
              )}

            <small>
              {selectedIndex + 1} of {media.length}
              {isVideo ? " · Video" : " · Image"}
              {selectedMedia.visibility === "private"
                ? " · Private"
                : " · Public"}
            </small>
          </div>

          {media.length > 1 && (
            <div className="project-media-viewer-actions">
              <button type="button" onClick={showPreviousMedia}>
                Previous
              </button>

              <button type="button" onClick={showNextMedia}>
                Next
              </button>
            </div>
          )}
        </footer>
      </section>
    </div>
  );
}

export default ProjectMediaViewer;
