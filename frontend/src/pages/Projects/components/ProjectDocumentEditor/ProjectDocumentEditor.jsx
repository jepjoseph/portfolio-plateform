import { useEffect, useRef, useState } from "react";

import {
  PROJECT_DOCUMENT_ACCEPT,
  PROJECT_DOCUMENT_TYPE_OPTIONS,
  PROJECT_FIELD_LIMITS,
  isProjectDocumentWithinSizeLimit,
  isSupportedProjectDocument,
} from "../../../../config/projectConfig.js";

import { createProjectId } from "../../../../models/projectModel.js";

import {
  createProjectAssetUrl,
  revokeProjectAssetUrl,
} from "../../../../services/Project/projectAssetStorage.js";

import "./ProjectDocumentEditor.css";

/*
 * =========================================
 * Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isActiveDocument(document) {
  return document?.status !== "archived";
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

function getDocumentLabel(document) {
  return (
    getText(document?.name) ||
    getText(document?.fileName) ||
    getText(document?.file?.name) ||
    "Project document"
  );
}

/*
 * =========================================
 * Document Editor
 * =========================================
 */

function ProjectDocumentEditor({
  documents = [],
  uploads = [],
  disabled = false,
  error = "",
  onChange,
  onUploadsChange,
  onRemoveStoredAsset,
}) {
  const [localError, setLocalError] = useState("");

  const [preview, setPreview] = useState(null);

  const previewRef = useRef(null);
  const previewRequestRef = useRef(0);
  const mountedRef = useRef(true);

  const activeDocuments = documents.filter(isActiveDocument);

  /*
   * =========================================
   * Safe Preview Cleanup
   * =========================================
   */

  const revokePreviewUrl = (previewValue) => {
    if (previewValue?.ownsObjectUrl) {
      revokeProjectAssetUrl(previewValue.url);
    }
  };

  const closePreview = () => {
    previewRequestRef.current += 1;

    revokePreviewUrl(previewRef.current);

    previewRef.current = null;
    setPreview(null);
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      previewRequestRef.current += 1;

      revokePreviewUrl(previewRef.current);

      previewRef.current = null;
    };
  }, []);

  /*
   * =========================================
   * File Selection
   * =========================================
   */

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files || []);

    const availableSlots =
      PROJECT_FIELD_LIMITS.maximumDocuments -
      activeDocuments.length -
      uploads.length;

    if (availableSlots <= 0) {
      setLocalError(
        `This Project can contain no more than ${PROJECT_FIELD_LIMITS.maximumDocuments} documents.`,
      );

      event.target.value = "";

      return;
    }

    const acceptedUploads = [];

    let nextError = "";

    files.slice(0, availableSlots).forEach((file) => {
      if (!isSupportedProjectDocument(file)) {
        nextError =
          "Upload a supported PDF, Word, PowerPoint, JPG, PNG, or WebP document.";

        return;
      }

      if (!isProjectDocumentWithinSizeLimit(file)) {
        nextError =
          "Each supporting document must be non-empty and 20 MB or smaller.";

        return;
      }

      const normalizedFileName = getText(file.name).toLocaleLowerCase();

      const duplicate = [
        ...activeDocuments,
        ...uploads,
        ...acceptedUploads,
      ].some((item) => {
        const existingFileName = getText(
          item.file?.name || item.fileName || item.name,
        ).toLocaleLowerCase();

        return existingFileName && existingFileName === normalizedFileName;
      });

      if (duplicate) {
        nextError = `"${file.name}" has already been added.`;

        return;
      }

      acceptedUploads.push({
        assetId: createProjectId("project-document"),

        file,

        name: file.name,

        description: "",

        documentType: "supporting-evidence",

        visibility: "private",

        status: "active",
      });
    });

    if (files.length > availableSlots) {
      nextError = `Only ${availableSlots} additional ${
        availableSlots === 1 ? "document" : "documents"
      } can be added.`;
    }

    if (acceptedUploads.length > 0) {
      onUploadsChange?.([...uploads, ...acceptedUploads]);
    }

    setLocalError(nextError);

    event.target.value = "";
  };

  /*
   * =========================================
   * Document Updates
   * =========================================
   */

  const updateExistingDocument = (documentId, field, value) => {
    onChange?.(
      documents.map((document) =>
        document.id === documentId
          ? {
              ...document,
              [field]: value,
            }
          : document,
      ),
    );

    setLocalError("");
  };

  const updateStagedDocument = (assetId, field, value) => {
    onUploadsChange?.(
      uploads.map((upload) =>
        upload.assetId === assetId
          ? {
              ...upload,
              [field]: value,
            }
          : upload,
      ),
    );

    setLocalError("");
  };

  /*
   * =========================================
   * Removal
   * =========================================
   */

  const removeExistingDocument = (document) => {
    onChange?.(documents.filter((candidate) => candidate.id !== document.id));

    if (document.storageKey) {
      onRemoveStoredAsset?.(document.storageKey);
    }

    if (previewRef.current?.documentId === document.id) {
      closePreview();
    }

    setLocalError("");
  };

  const removeStagedDocument = (upload) => {
    onUploadsChange?.(
      uploads.filter((item) => item.assetId !== upload.assetId),
    );

    if (previewRef.current?.documentId === upload.assetId) {
      closePreview();
    }

    setLocalError("");
  };

  /*
   * =========================================
   * Preview
   * =========================================
   */

  const showPreview = (previewValue) => {
    revokePreviewUrl(previewRef.current);

    previewRef.current = previewValue;

    setPreview(previewValue);
  };

  const handleViewStoredDocument = async (document) => {
    const requestId = previewRequestRef.current + 1;

    previewRequestRef.current = requestId;

    setLocalError("");

    try {
      let url = "";
      let ownsObjectUrl = false;

      if (document.storageKey) {
        url = await createProjectAssetUrl(document.storageKey);

        ownsObjectUrl = true;
      } else {
        url = getText(document.externalUrl);
      }

      if (requestId !== previewRequestRef.current || !mountedRef.current) {
        if (ownsObjectUrl) {
          revokeProjectAssetUrl(url);
        }

        return;
      }

      if (!url) {
        throw new Error("The document does not have a preview address.");
      }

      showPreview({
        documentId: document.id,
        title: getDocumentLabel(document),
        url,
        mimeType: document.mimeType || "",
        ownsObjectUrl,
      });
    } catch (caughtError) {
      if (requestId !== previewRequestRef.current || !mountedRef.current) {
        return;
      }

      setLocalError(
        caughtError?.publicMessage ||
          caughtError?.message ||
          "The selected Project document could not be opened.",
      );
    }
  };

  const handleViewStagedDocument = (upload) => {
    if (
      !upload?.file ||
      typeof URL === "undefined" ||
      typeof URL.createObjectURL !== "function"
    ) {
      setLocalError("The selected Project document cannot be previewed.");

      return;
    }

    previewRequestRef.current += 1;

    const objectUrl = URL.createObjectURL(upload.file);

    showPreview({
      documentId: upload.assetId,
      title: getDocumentLabel(upload),
      url: objectUrl,
      mimeType: upload.file.type || "",
      ownsObjectUrl: true,
    });

    setLocalError("");
  };

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <section
      className="project-form-section project-document-editor"
      data-field="supportingDocuments"
    >
      <header className="project-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Supporting Evidence</small>

          <h3>Project Documents</h3>

          <p>
            Attach reports, presentations, diagrams, award evidence, source
            material, and technical documentation.
          </p>
        </div>
      </header>

      <label
        className={[
          "project-document-upload",
          disabled ? "project-document-upload--disabled" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          type="file"
          multiple
          accept={PROJECT_DOCUMENT_ACCEPT}
          onChange={handleFileSelection}
          disabled={
            disabled ||
            activeDocuments.length + uploads.length >=
              PROJECT_FIELD_LIMITS.maximumDocuments
          }
        />

        <span>
          <strong>Select supporting documents</strong>

          <small>
            PDF, Word, PowerPoint, JPG, PNG, or WebP · 20 MB maximum per
            document
          </small>

          <em>
            {activeDocuments.length + uploads.length}/
            {PROJECT_FIELD_LIMITS.maximumDocuments} documents
          </em>
        </span>
      </label>

      {(localError || error) && (
        <p className="project-document-error" role="alert">
          {localError || error}
        </p>
      )}

      {activeDocuments.length === 0 && uploads.length === 0 ? (
        <div className="project-document-empty">
          No supporting documents added.
        </div>
      ) : (
        <div className="project-document-list">
          {activeDocuments.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              disabled={disabled}
              onChange={(field, value) =>
                updateExistingDocument(document.id, field, value)
              }
              onView={() => handleViewStoredDocument(document)}
              onRemove={() => removeExistingDocument(document)}
            />
          ))}

          {uploads.map((upload) => (
            <DocumentRow
              key={upload.assetId}
              document={upload}
              staged
              disabled={disabled}
              onChange={(field, value) =>
                updateStagedDocument(upload.assetId, field, value)
              }
              onView={() => handleViewStagedDocument(upload)}
              onRemove={() => removeStagedDocument(upload)}
            />
          ))}
        </div>
      )}

      {preview && <DocumentPreview preview={preview} onClose={closePreview} />}
    </section>
  );
}

/*
 * =========================================
 * Document Row
 * =========================================
 */

function DocumentRow({
  document,
  staged = false,
  disabled,
  onChange,
  onView,
  onRemove,
}) {
  const label = getDocumentLabel(document);

  const fileName = getText(document.fileName) || getText(document.file?.name);

  const fileSize = document.fileSize ?? document.file?.size;

  return (
    <article className="project-document-row">
      <div className="project-document-icon" aria-hidden="true">
        {staged ? "NEW" : "DOC"}
      </div>

      <div className="project-document-content">
        <div className="project-document-file">
          <strong>{fileName || label}</strong>

          <small>
            {[
              staged ? "Ready to upload" : "Saved document",
              formatFileSize(fileSize),
            ]
              .filter(Boolean)
              .join(" · ")}
          </small>
        </div>

        <div className="project-document-fields">
          <label>
            <span>Document Name</span>

            <input
              type="text"
              value={document.name || ""}
              onChange={(event) => onChange("name", event.target.value)}
              maxLength={PROJECT_FIELD_LIMITS.documentName}
              placeholder="Document name"
              disabled={disabled}
            />
          </label>

          <label>
            <span>Description</span>

            <textarea
              rows={2}
              value={document.description || ""}
              onChange={(event) => onChange("description", event.target.value)}
              maxLength={PROJECT_FIELD_LIMITS.documentDescription}
              placeholder="Explain what this document demonstrates."
              disabled={disabled}
            />
          </label>
        </div>
      </div>

      <div className="project-document-controls">
        <label>
          <span>Document Type</span>

          <select
            value={document.documentType || "supporting-evidence"}
            onChange={(event) => onChange("documentType", event.target.value)}
            disabled={disabled}
            aria-label={`Document type for ${label}`}
          >
            {PROJECT_DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Visibility</span>

          <select
            value={document.visibility || "private"}
            onChange={(event) => onChange("visibility", event.target.value)}
            disabled={disabled}
            aria-label={`Visibility for ${label}`}
          >
            <option value="private">Private</option>

            <option value="public">Public</option>
          </select>
        </label>

        <button
          type="button"
          onClick={onView}
          disabled={disabled}
          aria-label={`View ${label}`}
        >
          View
        </button>

        <button
          type="button"
          className="project-document-remove"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${label}`}
        >
          Remove
        </button>
      </div>
    </article>
  );
}

/*
 * =========================================
 * Document Preview
 * =========================================
 */

function DocumentPreview({ preview, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const isImage = preview.mimeType.startsWith("image/");

  return (
    <div
      className="project-document-preview-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="project-document-preview"
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${preview.title}`}
      >
        <header>
          <div>
            <small>Project Document</small>

            <h4>{preview.title}</h4>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close document preview"
          >
            ×
          </button>
        </header>

        <div className="project-document-preview-content">
          {isImage ? (
            <img src={preview.url} alt={preview.title} />
          ) : (
            <iframe src={preview.url} title={preview.title} />
          )}
        </div>

        <footer>
          <a href={preview.url} target="_blank" rel="noopener noreferrer">
            Open in New Tab
          </a>

          <a href={preview.url} download={preview.title}>
            Download
          </a>
        </footer>
      </section>
    </div>
  );
}

export default ProjectDocumentEditor;
