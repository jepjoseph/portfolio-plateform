import { useId, useState } from "react";

import { PROFILE_PICTURE_UPLOAD_CONFIG } from "../../../../../config/profileConfig.js";

import {
  getProfilePictureName,
  getProfilePictureUrl,
} from "../../../../../services/Profile/profileUtils.js";

import "./ProfilePictureEditor.css";

/*
 * =========================================
 * Helpers
 * =========================================
 */

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("The selected picture could not be read."));
    };

    reader.readAsDataURL(file);
  });
}

function formatFileSize(fileSize) {
  const numericFileSize = Number(fileSize);

  if (!Number.isFinite(numericFileSize) || numericFileSize <= 0) {
    return "";
  }

  if (numericFileSize < 1024) {
    return `${numericFileSize} bytes`;
  }

  if (numericFileSize < 1024 * 1024) {
    return `${(numericFileSize / 1024).toFixed(1)} KB`;
  }

  return `${(numericFileSize / 1024 / 1024).toFixed(2)} MB`;
}

function getMaximumFileSizeLabel() {
  const maximumFileSize =
    Number(PROFILE_PICTURE_UPLOAD_CONFIG.maxFileSize) || 0;

  if (!maximumFileSize) {
    return "";
  }

  return `${Math.round(maximumFileSize / 1024 / 1024)} MB`;
}

function getFieldError(fieldErrors, picture, index, field) {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return "";
  }

  return (
    fieldErrors[`profilePictures.${index}.${field}`] ||
    fieldErrors[`profilePictures.${picture.id}.${field}`] ||
    ""
  );
}

/*
 * =========================================
 * Profile Picture Editor
 * =========================================
 */

function ProfilePictureEditor({
  profilePictures = [],
  defaultAvatarText = "P",
  fieldErrors = {},
  disabled = false,
  onAdd,
  onChange,
  onRemove,
}) {
  const sectionTitleId = useId();

  const [fileErrors, setFileErrors] = useState({});

  const [processingPictureId, setProcessingPictureId] = useState("");

  const activePictures = Array.isArray(profilePictures)
    ? profilePictures.filter((picture) => picture?.status !== "archived")
    : [];

  const allowedFileTypes = PROFILE_PICTURE_UPLOAD_CONFIG.allowedFileTypes || [];

  const accept =
    PROFILE_PICTURE_UPLOAD_CONFIG.accept || ".gif,.jpg,.jpeg,.png,.webp,.avif";

  const maximumFileSize =
    Number(PROFILE_PICTURE_UPLOAD_CONFIG.maxFileSize) || 0;

  const maximumFileSizeLabel = getMaximumFileSizeLabel();

  /*
   * This is the location for the configured-picture
   * count. It must be inside the component and before
   * the return statement.
   */

  const configuredPictureCount = activePictures.filter(
    (picture) =>
      Boolean(getProfilePictureUrl(picture)) ||
      picture.useDefaultAvatar === true,
  ).length;

  const clearFileError = (pictureId) => {
    setFileErrors((currentErrors) => {
      if (!currentErrors[pictureId]) {
        return currentErrors;
      }

      const nextErrors = {
        ...currentErrors,
      };

      delete nextErrors[pictureId];

      return nextErrors;
    });
  };

  const setPictureFileError = (pictureId, message) => {
    setFileErrors((currentErrors) => ({
      ...currentErrors,
      [pictureId]: message,
    }));
  };

  /*
   * =========================================
   * File Selection
   * =========================================
   */

  const handlePictureChange = async (event, pictureId) => {
    const file = event.target.files?.[0];

    if (!file || disabled) {
      return;
    }

    clearFileError(pictureId);

    if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(file.type)) {
      setPictureFileError(
        pictureId,
        "Upload a GIF, JPG, PNG, WEBP, or AVIF picture.",
      );

      event.target.value = "";

      return;
    }

    if (maximumFileSize > 0 && file.size > maximumFileSize) {
      setPictureFileError(
        pictureId,
        `The picture must be ${maximumFileSizeLabel} or smaller.`,
      );

      event.target.value = "";

      return;
    }

    try {
      setProcessingPictureId(pictureId);

      const imageUrl = await readFileAsDataUrl(file);

      onChange?.(pictureId, "imageUrl", imageUrl);
      onChange?.(pictureId, "fileName", file.name);
      onChange?.(pictureId, "fileType", file.type);
      onChange?.(pictureId, "fileSize", file.size);

      /*
       * Uploading a picture disables the default-avatar
       * state for this record.
       */

      onChange?.(pictureId, "useDefaultAvatar", false);

      clearFileError(pictureId);
    } catch (error) {
      setPictureFileError(
        pictureId,
        error?.message || "The selected picture could not be processed.",
      );
    } finally {
      setProcessingPictureId("");

      /*
       * This permits selecting the same file again.
       */

      event.target.value = "";
    }
  };

  /*
   * =========================================
   * Default Avatar
   * =========================================
   */

  const handleUseDefaultAvatar = (pictureId) => {
    if (disabled) {
      return;
    }

    onChange?.(pictureId, "imageUrl", "");
    onChange?.(pictureId, "blobName", "");
    onChange?.(pictureId, "fileName", "");
    onChange?.(pictureId, "fileType", "");
    onChange?.(pictureId, "fileSize", 0);
    onChange?.(pictureId, "width", null);
    onChange?.(pictureId, "height", null);
    onChange?.(pictureId, "useDefaultAvatar", true);

    clearFileError(pictureId);
  };

  const handleCancelDefaultAvatar = (pictureId) => {
    if (disabled) {
      return;
    }

    onChange?.(pictureId, "useDefaultAvatar", false);

    clearFileError(pictureId);
  };

  /*
   * =========================================
   * Clear Uploaded Picture
   * =========================================
   *
   * Clearing an uploaded image keeps the picture
   * record and changes it to the default avatar.
   */

  const handleClearPicture = (pictureId) => {
    handleUseDefaultAvatar(pictureId);
  };

  return (
    <section
      className="profile-picture-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="profile-picture-editor-header">
        <div>
          <span>Media</span>

          <h3 id={sectionTitleId}>Profile Pictures</h3>

          <p>
            Add reusable pictures that can later be assigned as a profile
            picture, headshot, avatar, logo, icon, or portfolio background.
          </p>
        </div>

        <button
          type="button"
          className="profile-picture-editor-add-button"
          onClick={onAdd}
          disabled={disabled}
        >
          + Add Picture
        </button>
      </header>

      {/* =====================================
          Configured Picture Count
          ===================================== */}

      <div className="profile-picture-editor-summary">
        <span>
          <strong>{configuredPictureCount}</strong> configured{" "}
          {configuredPictureCount === 1 ? "picture" : "pictures"}
        </span>

        <small>
          Uploaded image or default avatar
          {maximumFileSizeLabel
            ? ` · Upload maximum ${maximumFileSizeLabel}`
            : ""}
        </small>
      </div>

      {activePictures.length > 0 ? (
        <div className="profile-picture-editor-list">
          {activePictures.map((picture, index) => {
            const fileInputId = `profile-picture-file-${picture.id}`;

            const descriptionInputId = `profile-picture-description-${picture.id}`;

            const pictureUrl = getProfilePictureUrl(picture);

            const usesDefaultAvatar =
              picture.useDefaultAvatar === true && !pictureUrl;

            const pictureName = getProfilePictureName(
              picture,
              `Picture ${index + 1}`,
            );

            const imageError =
              getFieldError(fieldErrors, picture, index, "imageUrl") ||
              getFieldError(fieldErrors, picture, index, "fileType") ||
              getFieldError(fieldErrors, picture, index, "fileSize") ||
              getFieldError(fieldErrors, picture, index, "useDefaultAvatar");

            const descriptionError = getFieldError(
              fieldErrors,
              picture,
              index,
              "description",
            );

            const fileError = fileErrors[picture.id] || "";

            const itemHasError = Boolean(
              imageError || descriptionError || fileError,
            );

            const isProcessing = processingPictureId === picture.id;

            return (
              <article
                key={picture.id}
                className={`profile-picture-editor-item ${
                  itemHasError ? "profile-picture-editor-item--error" : ""
                }`}
              >
                <header className="profile-picture-editor-item-header">
                  <div>
                    <span>Picture {index + 1}</span>

                    {index === 0 && <small>Primary</small>}
                  </div>

                  <button
                    type="button"
                    className="profile-picture-editor-remove-button"
                    onClick={() => onRemove?.(picture.id)}
                    disabled={disabled || isProcessing}
                    aria-label={`Remove picture record ${index + 1}`}
                    title="Remove picture record"
                  >
                    Remove
                  </button>
                </header>

                <div className="profile-picture-editor-content">
                  {/* =====================================
                      Preview
                      ===================================== */}

                  <div className="profile-picture-editor-preview">
                    {pictureUrl ? (
                      <img
                        src={pictureUrl}
                        alt={
                          picture.description?.trim() ||
                          picture.fileName ||
                          `Profile picture ${index + 1}`
                        }
                      />
                    ) : usesDefaultAvatar ? (
                      <div
                        className="profile-picture-editor-default-avatar"
                        role="img"
                        aria-label={
                          picture.description?.trim() ||
                          "Default profile avatar"
                        }
                      >
                        <strong>{defaultAvatarText}</strong>

                        <small>Default Avatar</small>
                      </div>
                    ) : (
                      <div className="profile-picture-editor-placeholder">
                        <span aria-hidden="true">▧</span>

                        <small>No picture selected</small>
                      </div>
                    )}
                  </div>

                  {/* =====================================
                      Fields
                      ===================================== */}

                  <div className="profile-picture-editor-fields">
                    <div className="profile-picture-editor-field">
                      <label htmlFor={fileInputId}>Picture File</label>

                      <label
                        className={`profile-picture-editor-upload ${
                          disabled || isProcessing
                            ? "profile-picture-editor-upload--disabled"
                            : ""
                        }`}
                        htmlFor={
                          disabled || isProcessing ? undefined : fileInputId
                        }
                      >
                        <span>
                          {isProcessing
                            ? "Processing Picture..."
                            : pictureUrl
                              ? "Replace Picture"
                              : "Choose Picture"}
                        </span>

                        <small>
                          {maximumFileSizeLabel
                            ? `Maximum ${maximumFileSizeLabel}`
                            : "Select a supported image"}
                        </small>
                      </label>

                      <input
                        id={fileInputId}
                        className="profile-picture-editor-file-input"
                        type="file"
                        accept={accept}
                        onChange={(event) =>
                          handlePictureChange(event, picture.id)
                        }
                        disabled={disabled || isProcessing}
                      />

                      {!pictureUrl && !usesDefaultAvatar && (
                        <button
                          type="button"
                          className="profile-picture-editor-default-button"
                          onClick={() => handleUseDefaultAvatar(picture.id)}
                          disabled={disabled || isProcessing}
                        >
                          Use Default Avatar
                        </button>
                      )}

                      {(fileError || imageError) && (
                        <small role="alert">{fileError || imageError}</small>
                      )}
                    </div>

                    <div className="profile-picture-editor-field">
                      <label htmlFor={descriptionInputId}>
                        Picture Description
                        <span>Optional</span>
                      </label>

                      <input
                        id={descriptionInputId}
                        type="text"
                        value={picture.description || ""}
                        onChange={(event) =>
                          onChange?.(
                            picture.id,
                            "description",
                            event.target.value,
                          )
                        }
                        placeholder="Describe this picture for accessibility"
                        maxLength="150"
                        disabled={disabled || isProcessing}
                        aria-invalid={Boolean(descriptionError)}
                        aria-describedby={
                          descriptionError
                            ? `${descriptionInputId}-error`
                            : undefined
                        }
                      />

                      {descriptionError && (
                        <small id={`${descriptionInputId}-error`} role="alert">
                          {descriptionError}
                        </small>
                      )}
                    </div>

                    {/* =====================================
                        Default Avatar Status
                        ===================================== */}

                    {usesDefaultAvatar && (
                      <div
                        className="profile-picture-editor-avatar-status"
                        role="status"
                      >
                        <div>
                          <strong>Default avatar selected</strong>

                          <p>
                            This picture record will be saved without an
                            uploaded image.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCancelDefaultAvatar(picture.id)}
                          disabled={disabled || isProcessing}
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* =====================================
                        Uploaded File Information
                        ===================================== */}

                    {pictureUrl && (
                      <div className="profile-picture-editor-file-information">
                        <div>
                          <span>File</span>
                          <strong>{pictureName}</strong>
                        </div>

                        <div>
                          <span>Format</span>
                          <strong>{picture.fileType || "Image"}</strong>
                        </div>

                        <div>
                          <span>Size</span>
                          <strong>
                            {formatFileSize(picture.fileSize) || "Unknown"}
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleClearPicture(picture.id)}
                          disabled={disabled || isProcessing}
                        >
                          Use Default Avatar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="profile-picture-editor-empty">
          <span aria-hidden="true">▧</span>

          <h4>No profile pictures added</h4>

          <p>
            Add a reusable picture for your résumés, portfolios, and
            professional profile.
          </p>

          <button type="button" onClick={onAdd} disabled={disabled}>
            Add Picture
          </button>
        </div>
      )}
    </section>
  );
}

export default ProfilePictureEditor;
