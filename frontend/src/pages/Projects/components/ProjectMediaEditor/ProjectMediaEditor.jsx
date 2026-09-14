import { useEffect, useMemo, useState } from "react";

import {
  PROJECT_FIELD_LIMITS,
  PROJECT_MEDIA_ACCEPT,
  isProjectMediaWithinSizeLimit,
  isSupportedProjectMedia,
} from "../../../../config/projectConfig.js";

import { createProjectId } from "../../../../models/projectModel.js";

import {
  createProjectAssetUrl,
  revokeProjectAssetUrl,
} from "../../../../services/Project/projectAssetStorage.js";

import "./ProjectMediaEditor.css";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isActiveMedia(item) {
  return item?.status !== "archived";
}

function isPublicMedia(item) {
  return isActiveMedia(item) && item?.visibility !== "private";
}

/*
 * =========================================
 * Featured Media Normalization
 * =========================================
 */

function normalizeFeaturedMedia(
  media,
  uploads,
  preferredAssetId = "",
  preferredSource = "",
) {
  const existingMedia = Array.isArray(media) ? media : [];

  const stagedUploads = Array.isArray(uploads) ? uploads : [];

  let selectedSource = "";
  let selectedId = "";

  if (
    preferredSource === "stored" &&
    existingMedia.some(
      (item) => item.id === preferredAssetId && isPublicMedia(item),
    )
  ) {
    selectedSource = "stored";
    selectedId = preferredAssetId;
  } else if (
    preferredSource === "staged" &&
    stagedUploads.some(
      (item) => item.assetId === preferredAssetId && isPublicMedia(item),
    )
  ) {
    selectedSource = "staged";
    selectedId = preferredAssetId;
  } else {
    const existingFeatured = existingMedia.find(
      (item) => item.isFeatured && isPublicMedia(item),
    );

    const stagedFeatured = stagedUploads.find(
      (item) => item.isFeatured && isPublicMedia(item),
    );

    const fallbackExisting = existingMedia.find(isPublicMedia);

    const fallbackStaged = stagedUploads.find(isPublicMedia);

    if (existingFeatured) {
      selectedSource = "stored";
      selectedId = existingFeatured.id;
    } else if (stagedFeatured) {
      selectedSource = "staged";
      selectedId = stagedFeatured.assetId;
    } else if (fallbackExisting) {
      selectedSource = "stored";
      selectedId = fallbackExisting.id;
    } else if (fallbackStaged) {
      selectedSource = "staged";
      selectedId = fallbackStaged.assetId;
    }
  }

  return {
    media: existingMedia.map((item) => ({
      ...item,

      isFeatured: selectedSource === "stored" && item.id === selectedId,
    })),

    uploads: stagedUploads.map((item) => ({
      ...item,

      isFeatured: selectedSource === "staged" && item.assetId === selectedId,
    })),

    featuredId: selectedId,
  };
}

/*
 * =========================================
 * Stored Media Preview
 * =========================================
 */

function StoredMediaPreview({
  storageKey,
  externalUrl = "",
  type,
  name,
  altText,
}) {
  const [previewUrl, setPreviewUrl] = useState(externalUrl);

  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    let isActive = true;
    let objectUrl = "";

    setPreviewError("");

    if (!storageKey) {
      setPreviewUrl(externalUrl);

      return undefined;
    }

    setPreviewUrl("");

    createProjectAssetUrl(storageKey)
      .then((url) => {
        objectUrl = url;

        if (!isActive) {
          revokeProjectAssetUrl(url);

          return;
        }

        setPreviewUrl(url);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setPreviewUrl("");

        setPreviewError(error?.publicMessage || "Preview unavailable");
      });

    return () => {
      isActive = false;

      if (objectUrl) {
        revokeProjectAssetUrl(objectUrl);
      }
    };
  }, [storageKey, externalUrl]);

  if (!previewUrl) {
    return (
      <div className="project-media-preview-empty" title={previewError}>
        {previewError || "Loading preview…"}
      </div>
    );
  }

  if (type === "video") {
    return (
      <video
        src={previewUrl}
        muted
        playsInline
        preload="metadata"
        aria-label={altText || name || "Project video preview"}
      />
    );
  }

  return (
    <img src={previewUrl} alt={altText || name || "Project media preview"} />
  );
}

/*
 * =========================================
 * Staged Media Preview
 * =========================================
 */

function StagedMediaPreview({ file, type, name, altText }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (
      !file ||
      typeof URL === "undefined" ||
      typeof URL.createObjectURL !== "function"
    ) {
      setPreviewUrl("");

      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!previewUrl) {
    return (
      <div className="project-media-preview-empty">Preview unavailable</div>
    );
  }

  if (type === "video" || file?.type?.startsWith("video/")) {
    return (
      <video
        src={previewUrl}
        muted
        playsInline
        preload="metadata"
        aria-label={altText || name || file?.name || "New project video"}
      />
    );
  }

  return (
    <img
      src={previewUrl}
      alt={altText || name || file?.name || "New project image"}
    />
  );
}

/*
 * =========================================
 * Media Actions
 * =========================================
 */

function MediaActions({
  item,
  isFeatured,
  disabled,
  onFeatured,
  onVisibility,
  onRemove,
}) {
  const isPrivate = item.visibility === "private";

  return (
    <div className="project-media-actions">
      <label className="project-media-item-selection">
        <input
          type="radio"
          name="project-item-media"
          checked={isFeatured}
          onChange={onFeatured}
          disabled={disabled || isPrivate}
        />

        <span>
          <strong>Show by default</strong>

          <small>Use this media as the default Project thumbnail.</small>
        </span>
      </label>

      <label className="project-media-visibility">
        <span>Visibility</span>

        <select
          value={item.visibility || "public"}
          onChange={(event) => onVisibility(event.target.value)}
          disabled={disabled}
          aria-label={`Visibility for ${item.name || "project media"}`}
        >
          <option value="public">Public</option>

          <option value="private">Private</option>
        </select>
      </label>

      <button
        type="button"
        className="project-media-remove"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${item.name || "project media"}`}
      >
        Remove
      </button>
    </div>
  );
}

/*
 * =========================================
 * Project Media Editor
 * =========================================
 */

function ProjectMediaEditor({
  media = [],
  uploads = [],
  featuredMediaId = "",
  disabled = false,
  error = "",
  onChange,
  onUploadsChange,
  onFeaturedMediaChange,
  onRemoveStoredAsset,
}) {
  const [localError, setLocalError] = useState("");

  const activeMedia = useMemo(() => media.filter(isActiveMedia), [media]);

  const featuredId = useMemo(() => {
    const storedSelectionExists = activeMedia.some(
      (item) => item.id === featuredMediaId,
    );

    const stagedSelectionExists = uploads.some(
      (item) => item.assetId === featuredMediaId,
    );

    const preferredSource = storedSelectionExists
      ? "stored"
      : stagedSelectionExists
        ? "staged"
        : "";

    const normalized = normalizeFeaturedMedia(
      activeMedia,
      uploads,
      featuredMediaId,
      preferredSource,
    );

    return normalized.featuredId;
  }, [activeMedia, uploads, featuredMediaId]);

  /*
   * =========================================
   * Commit Both Media Collections
   * =========================================
   */

  const commitCollections = (
    nextMedia,
    nextUploads,
    preferredAssetId = "",
    preferredSource = "",
  ) => {
    const normalized = normalizeFeaturedMedia(
      nextMedia,
      nextUploads,
      preferredAssetId,
      preferredSource,
    );

    onChange?.(normalized.media);

    onUploadsChange?.(normalized.uploads);

    onFeaturedMediaChange?.(normalized.featuredId);

    setLocalError("");
  };

  /*
   * =========================================
   * File Selection
   * =========================================
   */

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files || []);

    const availableSlots =
      PROJECT_FIELD_LIMITS.maximumMedia - activeMedia.length - uploads.length;

    if (availableSlots <= 0) {
      setLocalError(
        `This Project can contain no more than ${PROJECT_FIELD_LIMITS.maximumMedia} media items.`,
      );

      event.target.value = "";

      return;
    }

    const acceptedUploads = [];

    let nextError = "";

    files.slice(0, availableSlots).forEach((file) => {
      if (!isSupportedProjectMedia(file)) {
        nextError = "Upload JPG, PNG, WebP, GIF, MP4, or WebM files.";

        return;
      }

      if (!isProjectMediaWithinSizeLimit(file)) {
        nextError = file.type.startsWith("video/")
          ? "Videos must be 150 MB or smaller and cannot be empty."
          : "Images must be 12 MB or smaller and cannot be empty.";

        return;
      }

      const normalizedFileName = getText(file.name).toLocaleLowerCase();

      const duplicate = [...activeMedia, ...uploads, ...acceptedUploads].some(
        (item) => {
          const existingFileName = getText(
            item.file?.name || item.fileName || item.name,
          ).toLocaleLowerCase();

          return existingFileName && existingFileName === normalizedFileName;
        },
      );

      if (duplicate) {
        nextError = `"${file.name}" has already been added.`;

        return;
      }

      const isVideo = file.type.startsWith("video/");

      acceptedUploads.push({
        assetId: createProjectId("project-media"),

        file,

        type: isVideo ? "video" : "image",

        name: file.name,

        caption: "",

        altText: isVideo ? `Video demonstration for ${file.name}` : "",

        visibility: "public",

        status: "active",

        isFeatured: false,
      });
    });

    if (files.length > availableSlots) {
      nextError = `Only ${availableSlots} additional ${
        availableSlots === 1 ? "media item" : "media items"
      } can be added.`;
    }

    if (acceptedUploads.length > 0) {
      commitCollections(media, [...uploads, ...acceptedUploads]);
    }

    setLocalError(nextError);

    event.target.value = "";
  };

  /*
   * =========================================
   * Existing Media Updates
   * =========================================
   */

  const updateExistingMedia = (mediaId, field, value) => {
    const nextMedia = media.map((item) =>
      item.id === mediaId
        ? {
            ...item,
            [field]: value,
          }
        : item,
    );

    commitCollections(nextMedia, uploads);
  };

  /*
   * =========================================
   * Staged Media Updates
   * =========================================
   */

  const updateStagedMedia = (assetId, field, value) => {
    const nextUploads = uploads.map((item) =>
      item.assetId === assetId
        ? {
            ...item,
            [field]: value,
          }
        : item,
    );

    commitCollections(media, nextUploads);
  };

  /*
   * =========================================
   * Featured Media
   * =========================================
   */

  const setFeaturedMedia = (assetId, source) => {
    commitCollections(media, uploads, assetId, source);
  };

  /*
   * =========================================
   * Visibility
   * =========================================
   */

  const updateExistingVisibility = (mediaId, visibility) => {
    const nextMedia = media.map((item) =>
      item.id === mediaId
        ? {
            ...item,
            visibility,
            isFeatured: visibility === "private" ? false : item.isFeatured,
          }
        : item,
    );

    commitCollections(nextMedia, uploads);
  };

  const updateStagedVisibility = (assetId, visibility) => {
    const nextUploads = uploads.map((item) =>
      item.assetId === assetId
        ? {
            ...item,
            visibility,
            isFeatured: visibility === "private" ? false : item.isFeatured,
          }
        : item,
    );

    commitCollections(media, nextUploads);
  };

  /*
   * =========================================
   * Removal
   * =========================================
   */

  const removeExistingMedia = (item) => {
    const nextMedia = media.filter((candidate) => candidate.id !== item.id);

    commitCollections(nextMedia, uploads);

    if (item.storageKey) {
      onRemoveStoredAsset?.(item.storageKey);
    }
  };

  const removeStagedMedia = (assetId) => {
    const nextUploads = uploads.filter((item) => item.assetId !== assetId);

    commitCollections(media, nextUploads);
  };

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <section
      className="project-form-section project-media-editor"
      data-field="media"
    >
      <header className="project-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Media Gallery</small>

          <h3>Project Images and Videos</h3>

          <p>
            Upload images and videos, then select “Show on Project Item” for the
            media that should appear as the Project’s default thumbnail.
          </p>
        </div>
      </header>

      <label
        className={[
          "project-media-upload",
          disabled ? "project-media-upload--disabled" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          type="file"
          multiple
          accept={PROJECT_MEDIA_ACCEPT}
          onChange={handleFileSelection}
          disabled={
            disabled ||
            activeMedia.length + uploads.length >=
              PROJECT_FIELD_LIMITS.maximumMedia
          }
        />

        <span>
          <strong>Select project images or videos</strong>

          <small>
            JPG, PNG, WebP, GIF, MP4, or WebM · Images up to 12 MB · Videos up
            to 150 MB
          </small>

          <em>
            {activeMedia.length + uploads.length}/
            {PROJECT_FIELD_LIMITS.maximumMedia} media items
          </em>
        </span>
      </label>

      {(localError || error) && (
        <p className="project-media-error" role="alert">
          {localError || error}
        </p>
      )}

      {activeMedia.length === 0 && uploads.length === 0 ? (
        <div className="project-media-empty">
          No project media added. A professional featured visual is recommended.
        </div>
      ) : (
        <div className="project-media-list">
          {activeMedia.map((item) => (
            <article
              key={item.id}
              className={[
                "project-media-item",
                item.id === featuredId ? "project-media-item--featured" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="project-media-thumbnail">
                <StoredMediaPreview
                  storageKey={item.storageKey}
                  externalUrl={item.externalUrl}
                  type={item.type}
                  name={item.name}
                  altText={item.altText}
                />

                <span>{item.type}</span>
              </div>

              <div className="project-media-fields">
                <label>
                  <span>Media Name</span>

                  <input
                    type="text"
                    value={item.name}
                    onChange={(event) =>
                      updateExistingMedia(item.id, "name", event.target.value)
                    }
                    maxLength={PROJECT_FIELD_LIMITS.mediaName}
                    placeholder="Media name"
                    disabled={disabled}
                  />
                </label>

                <label>
                  <span>Alternative Text</span>

                  <input
                    type="text"
                    value={item.altText || ""}
                    onChange={(event) =>
                      updateExistingMedia(
                        item.id,
                        "altText",
                        event.target.value,
                      )
                    }
                    maxLength={PROJECT_FIELD_LIMITS.mediaAltText}
                    placeholder="Describe what is visible for accessibility"
                    disabled={disabled}
                  />
                </label>

                <label>
                  <span>Caption</span>

                  <textarea
                    rows={2}
                    value={item.caption || ""}
                    onChange={(event) =>
                      updateExistingMedia(
                        item.id,
                        "caption",
                        event.target.value,
                      )
                    }
                    maxLength={PROJECT_FIELD_LIMITS.mediaCaption}
                    placeholder="Explain what this visual demonstrates"
                    disabled={disabled}
                  />
                </label>
              </div>

              <MediaActions
                item={item}
                isFeatured={item.id === featuredId}
                disabled={disabled}
                onFeatured={() => setFeaturedMedia(item.id, "stored")}
                onVisibility={(value) =>
                  updateExistingVisibility(item.id, value)
                }
                onRemove={() => removeExistingMedia(item)}
              />
            </article>
          ))}

          {uploads.map((upload) => (
            <article
              key={upload.assetId}
              className={[
                "project-media-item",
                upload.assetId === featuredId
                  ? "project-media-item--featured"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="project-media-thumbnail">
                <StagedMediaPreview
                  file={upload.file}
                  type={upload.type}
                  name={upload.name}
                  altText={upload.altText}
                />

                <span>New {upload.type}</span>
              </div>

              <div className="project-media-fields">
                <label>
                  <span>Media Name</span>

                  <input
                    type="text"
                    value={upload.name || ""}
                    onChange={(event) =>
                      updateStagedMedia(
                        upload.assetId,
                        "name",
                        event.target.value,
                      )
                    }
                    maxLength={PROJECT_FIELD_LIMITS.mediaName}
                    placeholder="Media name"
                    disabled={disabled}
                  />
                </label>

                <label>
                  <span>Alternative Text</span>

                  <input
                    type="text"
                    value={upload.altText || ""}
                    onChange={(event) =>
                      updateStagedMedia(
                        upload.assetId,
                        "altText",
                        event.target.value,
                      )
                    }
                    maxLength={PROJECT_FIELD_LIMITS.mediaAltText}
                    placeholder="Describe what is visible for accessibility"
                    disabled={disabled}
                  />
                </label>

                <label>
                  <span>Caption</span>

                  <textarea
                    rows={2}
                    value={upload.caption || ""}
                    onChange={(event) =>
                      updateStagedMedia(
                        upload.assetId,
                        "caption",
                        event.target.value,
                      )
                    }
                    maxLength={PROJECT_FIELD_LIMITS.mediaCaption}
                    placeholder="Explain what this visual demonstrates"
                    disabled={disabled}
                  />
                </label>
              </div>

              <MediaActions
                item={upload}
                isFeatured={upload.assetId === featuredId}
                disabled={disabled}
                onFeatured={() => setFeaturedMedia(upload.assetId, "staged")}
                onVisibility={(value) =>
                  updateStagedVisibility(upload.assetId, value)
                }
                onRemove={() => removeStagedMedia(upload.assetId)}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProjectMediaEditor;
