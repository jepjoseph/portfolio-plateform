import { useId, useMemo, useRef, useState } from "react";

import {
  DOCUMENT_ACCEPT_VALUE,
  DOCUMENT_FILE_LIMITS,
  DOCUMENT_VISIBILITY_OPTIONS,
  getDocumentVisibilityLabel,
} from "../../../../config/documentConfig.js";

import {
  TRAINING_DOCUMENT_TYPE_OPTIONS,
  TRAINING_FIELD_LIMITS,
  getTrainingDocumentTypeLabel,
} from "../../../../config/trainingConfig.js";

import { createTrainingDocument } from "../../../../models/trainingModel.js";

import {
  createStoredDocumentUrl,
  deleteStoredDocumentFile,
  revokeDocumentUrl,
  saveDocumentFile,
} from "../../../../services/Documents/documentStorage.js";

import {
  canPreviewDocument,
  formatFileSize,
  getDocumentFormatLabel,
  validateDocumentFile,
} from "../../../../services/Documents/documentUtils.js";

import "./TrainingDocumentEditor.css";

/*
 * =========================================
 * Order Normalization
 * =========================================
 */

function normalizeDocumentOrder(documents) {
  return documents.map((document, index) => ({
    ...document,
    order: index,
  }));
}

/*
 * =========================================
 * Training Document Editor
 * =========================================
 */

function TrainingDocumentEditor({
  trainingId,
  documents = [],
  fieldErrors = {},
  disabled = false,
  onChange,
}) {
  const sectionTitleId = useId();
  const fileInputId = useId();
  const nameInputId = useId();
  const typeSelectId = useId();
  const visibilitySelectId = useId();
  const descriptionInputId = useId();

  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const [documentName, setDocumentName] = useState("");

  const [documentType, setDocumentType] = useState("other");

  const [visibility, setVisibility] = useState("private");

  const [description, setDescription] = useState("");

  const [editorError, setEditorError] = useState("");

  const [workingDocumentId, setWorkingDocumentId] = useState("");

  const [isUploading, setIsUploading] = useState(false);

  const orderedDocuments = useMemo(
    () =>
      [...documents].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      ),
    [documents],
  );

  const maximumDocuments =
    TRAINING_FIELD_LIMITS.maximumDocuments ||
    DOCUMENT_FILE_LIMITS.maximumDocumentsPerRecord;

  const hasReachedMaximum = documents.length >= maximumDocuments;

  const resetEditor = () => {
    setSelectedFile(null);
    setDocumentName("");
    setDocumentType("other");
    setVisibility("private");
    setDescription("");
    setEditorError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
   * =========================================
   * File Selection
   * =========================================
   */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setEditorError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validation = validateDocumentFile(file);

    if (!validation.isValid) {
      setSelectedFile(null);

      setEditorError(
        validation.errors[0]?.message || "The selected document is invalid.",
      );

      event.target.value = "";

      return;
    }

    setSelectedFile(file);

    if (!documentName.trim()) {
      const nameWithoutExtension = file.name.replace(/\.[^.]+$/, "");

      setDocumentName(nameWithoutExtension);
    }
  };

  /*
   * =========================================
   * Add Document
   * =========================================
   */

  const handleAddDocument = async () => {
    setEditorError("");

    if (hasReachedMaximum) {
      setEditorError(
        `Add no more than ${maximumDocuments} supporting documents.`,
      );

      return;
    }

    if (!selectedFile) {
      setEditorError("Select a document to upload.");
      return;
    }

    const normalizedName = documentName.trim();

    const normalizedDescription = description.trim();

    if (!normalizedName) {
      setEditorError("Enter a document name.");
      return;
    }

    if (normalizedName.length > DOCUMENT_FILE_LIMITS.documentName) {
      setEditorError(
        `Document name cannot exceed ${DOCUMENT_FILE_LIMITS.documentName} characters.`,
      );

      return;
    }

    if (normalizedDescription.length > DOCUMENT_FILE_LIMITS.description) {
      setEditorError(
        `Document description cannot exceed ${DOCUMENT_FILE_LIMITS.description} characters.`,
      );

      return;
    }

    const normalizedFileName = selectedFile.name.trim().toLocaleLowerCase();

    const duplicateFile = documents.some(
      (document) =>
        String(document.fileName || "")
          .trim()
          .toLocaleLowerCase() === normalizedFileName,
    );

    if (duplicateFile) {
      setEditorError("A document with this file name has already been added.");
      return;
    }

    let storedFile = null;

    try {
      setIsUploading(true);

      storedFile = await saveDocumentFile(selectedFile, {
        recordId: trainingId || "",
        category: "training",
      });

      const trainingDocument = createTrainingDocument({
        documentType,

        name: normalizedName,

        description: normalizedDescription,

        fileName: storedFile.fileName,

        mimeType: storedFile.mimeType,

        fileSize: storedFile.fileSize,

        storageProvider: "indexed-db",

        storageKey: storedFile.storageKey,

        fileUrl: "",

        uploadedAt: storedFile.uploadedAt,

        visibility,

        order: documents.length,
      });

      /*
       * onChange is normally synchronous, but awaiting
       * it also supports an asynchronous parent handler.
       */

      await onChange?.(
        normalizeDocumentOrder([...documents, trainingDocument]),
      );

      resetEditor();
    } catch (error) {
      /*
       * If the binary was saved but metadata could not
       * be attached to the form, remove the new binary
       * so it does not become an orphaned IndexedDB file.
       */

      if (storedFile?.storageKey) {
        try {
          await deleteStoredDocumentFile(storedFile.storageKey);
        } catch {
          /*
           * Preserve the original upload/form error.
           */
        }
      }

      setEditorError(
        error?.publicMessage ||
          error?.message ||
          "The document could not be uploaded.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  /*
   * =========================================
   * Resolve Document URL
   * =========================================
   */

  const getDocumentUrl = async (trainingDocument) => {
    if (trainingDocument.fileUrl) {
      return {
        url: trainingDocument.fileUrl,
        temporary: false,
      };
    }

    if (!trainingDocument.storageKey) {
      const error = new Error(
        "The document does not have a valid storage location.",
      );

      error.publicMessage = "The document file is unavailable.";

      throw error;
    }

    const url = await createStoredDocumentUrl(trainingDocument.storageKey);

    return {
      url,
      temporary: true,
    };
  };

  /*
   * =========================================
   * Preview Document
   * =========================================
   */

  const handlePreview = async (trainingDocument) => {
    try {
      setEditorError("");
      setWorkingDocumentId(trainingDocument.id);

      const { url, temporary } = await getDocumentUrl(trainingDocument);

      const previewWindow = window.open(url, "_blank", "noopener,noreferrer");

      if (!previewWindow) {
        if (temporary) {
          revokeDocumentUrl(url);
        }

        throw new Error("The browser blocked the document preview window.");
      }

      if (temporary) {
        window.setTimeout(() => {
          revokeDocumentUrl(url);
        }, 60000);
      }
    } catch (error) {
      setEditorError(
        error?.publicMessage ||
          error?.message ||
          "The document could not be opened.",
      );
    } finally {
      setWorkingDocumentId("");
    }
  };

  /*
   * =========================================
   * Download Document
   * =========================================
   */

  const handleDownload = async (trainingDocument) => {
    try {
      setEditorError("");
      setWorkingDocumentId(trainingDocument.id);

      const { url, temporary } = await getDocumentUrl(trainingDocument);

      const link = window.document.createElement("a");

      link.href = url;

      link.download =
        trainingDocument.fileName || trainingDocument.name || "document";

      link.rel = "noopener";

      window.document.body.appendChild(link);

      link.click();
      link.remove();

      if (temporary) {
        window.setTimeout(() => {
          revokeDocumentUrl(url);
        }, 1000);
      }
    } catch (error) {
      setEditorError(
        error?.publicMessage ||
          error?.message ||
          "The document could not be downloaded.",
      );
    } finally {
      setWorkingDocumentId("");
    }
  };

  /*
   * =========================================
   * Remove Document
   * =========================================
   */

  const handleRemove = async (trainingDocument) => {
    const shouldRemove = window.confirm(
      `Remove "${trainingDocument.name}"?\n\nThe uploaded file will also be removed from browser storage.`,
    );

    if (!shouldRemove) {
      return;
    }

    try {
      setEditorError("");
      setWorkingDocumentId(trainingDocument.id);

      /*
       * Delete the binary first. If this operation
       * fails, preserve the metadata in the form.
       */

      if (
        trainingDocument.storageProvider === "indexed-db" &&
        trainingDocument.storageKey
      ) {
        await deleteStoredDocumentFile(trainingDocument.storageKey);
      }

      const remainingDocuments = documents.filter(
        (candidate) => candidate.id !== trainingDocument.id,
      );

      await onChange?.(normalizeDocumentOrder(remainingDocuments));
    } catch (error) {
      setEditorError(
        error?.publicMessage ||
          error?.message ||
          "The document could not be removed.",
      );
    } finally {
      setWorkingDocumentId("");
    }
  };

  /*
   * =========================================
   * Reorder Documents
   * =========================================
   */

  const handleMove = (documentId, direction) => {
    const currentIndex = orderedDocuments.findIndex(
      (document) => document.id === documentId,
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedDocuments.length) {
      return;
    }

    const reorderedDocuments = [...orderedDocuments];

    const [movedDocument] = reorderedDocuments.splice(currentIndex, 1);

    reorderedDocuments.splice(targetIndex, 0, movedDocument);

    onChange?.(normalizeDocumentOrder(reorderedDocuments));
  };

  const isDisabled = disabled || isUploading;

  return (
    <section
      className="training-form-section training-document-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="training-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Supporting Evidence</small>

          <h3 id={sectionTitleId}>Supporting Documents</h3>

          <p>
            Upload certificates, completion records, course materials,
            evaluations, PDFs, Word documents, text files, or images.
          </p>
        </div>
      </header>

      <div className="training-document-editor-notice">
        <span aria-hidden="true">ⓘ</span>

        <p>
          Documents are stored privately in this browser. PDF, image, and text
          files can be previewed. Word files are downloaded for viewing.
        </p>
      </div>

      <div className="training-document-editor-form">
        <div className="training-document-editor-field training-document-editor-wide">
          <label htmlFor={fileInputId}>
            Select Document
            <small> Required</small>
          </label>

          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept={DOCUMENT_ACCEPT_VALUE}
            onChange={handleFileChange}
            disabled={isDisabled || hasReachedMaximum}
          />

          <small>
            PDF, Word, OpenDocument, text, JPG, PNG, WebP, GIF, BMP, or HEIC.
            Maximum {formatFileSize(DOCUMENT_FILE_LIMITS.maximumFileSizeBytes)}.
          </small>
        </div>

        {selectedFile && (
          <div className="training-document-editor-selected training-document-editor-wide">
            <span aria-hidden="true">◇</span>

            <div>
              <strong>{selectedFile.name}</strong>

              <small>
                {getDocumentFormatLabel(selectedFile)} ·{" "}
                {formatFileSize(selectedFile.size)}
              </small>
            </div>
          </div>
        )}

        <div className="training-document-editor-field">
          <label htmlFor={nameInputId}>
            Document Name
            <small> Required</small>
          </label>

          <input
            id={nameInputId}
            type="text"
            value={documentName}
            onChange={(event) => {
              setDocumentName(event.target.value);
              setEditorError("");
            }}
            maxLength={DOCUMENT_FILE_LIMITS.documentName}
            placeholder="Training Completion Certificate"
            disabled={isDisabled}
          />
        </div>

        <div className="training-document-editor-field">
          <label htmlFor={typeSelectId}>Document Type</label>

          <select
            id={typeSelectId}
            value={documentType}
            onChange={(event) => {
              setDocumentType(event.target.value);
              setEditorError("");
            }}
            disabled={isDisabled}
          >
            {TRAINING_DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="training-document-editor-field">
          <label htmlFor={visibilitySelectId}>Visibility</label>

          <select
            id={visibilitySelectId}
            value={visibility}
            onChange={(event) => {
              setVisibility(event.target.value);
              setEditorError("");
            }}
            disabled={isDisabled}
          >
            {DOCUMENT_VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="training-document-editor-field training-document-editor-wide">
          <label htmlFor={descriptionInputId}>
            Description
            <small> Optional</small>
          </label>

          <textarea
            id={descriptionInputId}
            rows={3}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setEditorError("");
            }}
            maxLength={DOCUMENT_FILE_LIMITS.description}
            placeholder="Describe what this document verifies."
            disabled={isDisabled}
          />

          <small className="training-document-editor-character-count">
            {description.length}/{DOCUMENT_FILE_LIMITS.description}
          </small>
        </div>

        {editorError && (
          <p
            className="training-document-editor-error training-document-editor-wide"
            role="alert"
          >
            {editorError}
          </p>
        )}

        <footer className="training-document-editor-form-footer">
          <small>
            {documents.length}/{maximumDocuments} documents
          </small>

          <div>
            {selectedFile && (
              <button type="button" onClick={resetEditor} disabled={isDisabled}>
                Clear
              </button>
            )}

            <button
              type="button"
              className="training-document-editor-add"
              onClick={handleAddDocument}
              disabled={isDisabled || hasReachedMaximum || !selectedFile}
            >
              {isUploading ? "Uploading..." : "+ Add Document"}
            </button>
          </div>
        </footer>
      </div>

      {fieldErrors.supportingDocuments && (
        <p className="training-document-editor-error" role="alert">
          {fieldErrors.supportingDocuments}
        </p>
      )}

      {orderedDocuments.length > 0 ? (
        <div className="training-document-editor-list">
          {orderedDocuments.map((trainingDocument, index) => {
            const documentError =
              fieldErrors[`supportingDocuments.${index}.name`] ||
              fieldErrors[`supportingDocuments.${index}.fileName`] ||
              fieldErrors[`supportingDocuments.${index}.storageKey`] ||
              fieldErrors[`supportingDocuments.${index}.documentType`] ||
              fieldErrors[`supportingDocuments.${index}.visibility`];

            const isDocumentWorking = workingDocumentId === trainingDocument.id;

            return (
              <article
                key={trainingDocument.id}
                className={`training-document-editor-item ${
                  documentError ? "training-document-editor-item--error" : ""
                }`}
              >
                <div className="training-document-editor-order">
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleMove(trainingDocument.id, "up")}
                      disabled={isDisabled || isDocumentWorking || index === 0}
                      aria-label={`Move ${trainingDocument.name} up`}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(trainingDocument.id, "down")}
                      disabled={
                        isDisabled ||
                        isDocumentWorking ||
                        index === orderedDocuments.length - 1
                      }
                      aria-label={`Move ${trainingDocument.name} down`}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="training-document-editor-content">
                  <div className="training-document-editor-labels">
                    <span>
                      {getTrainingDocumentTypeLabel(
                        trainingDocument.documentType,
                      )}
                    </span>

                    <span>{getDocumentFormatLabel(trainingDocument)}</span>

                    <span>
                      {getDocumentVisibilityLabel(trainingDocument.visibility)}
                    </span>
                  </div>

                  <strong>{trainingDocument.name}</strong>

                  <small>
                    {trainingDocument.fileName}
                    {" · "}
                    {formatFileSize(trainingDocument.fileSize)}
                  </small>

                  {trainingDocument.description && (
                    <p>{trainingDocument.description}</p>
                  )}

                  {documentError && (
                    <small
                      className="training-document-editor-field-error"
                      role="alert"
                    >
                      {documentError}
                    </small>
                  )}
                </div>

                <div className="training-document-editor-actions">
                  {canPreviewDocument(trainingDocument) && (
                    <button
                      type="button"
                      onClick={() => handlePreview(trainingDocument)}
                      disabled={isDisabled || isDocumentWorking}
                    >
                      Preview
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDownload(trainingDocument)}
                    disabled={isDisabled || isDocumentWorking}
                  >
                    {isDocumentWorking ? "Opening..." : "Download"}
                  </button>

                  <button
                    type="button"
                    className="training-document-editor-remove"
                    onClick={() => handleRemove(trainingDocument)}
                    disabled={isDisabled || isDocumentWorking}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="training-document-editor-empty">
          <span aria-hidden="true">◇</span>

          <h4>No supporting documents</h4>

          <p>
            Upload a completion certificate, course document, evaluation, PDF,
            Word document, or image.
          </p>
        </div>
      )}
    </section>
  );
}

export default TrainingDocumentEditor;
