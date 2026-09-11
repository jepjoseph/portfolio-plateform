import { useId, useMemo, useRef, useState } from "react";

import {
  DOCUMENT_ACCEPT_VALUE,
  DOCUMENT_FILE_LIMITS,
  DOCUMENT_VISIBILITY_OPTIONS,
  EDUCATION_DOCUMENT_TYPE_OPTIONS,
  getDocumentVisibilityLabel,
  getEducationDocumentTypeLabel,
} from "../../../../config/documentConfig.js";

import { createEducationDocument } from "../../../../models/educationModel.js";

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

import "./EducationDocumentEditor.css";

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
 * Education Document Editor
 * =========================================
 */

function EducationDocumentEditor({
  educationId,
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

  const maximumDocuments = DOCUMENT_FILE_LIMITS.maximumDocumentsPerRecord;

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
   * Upload
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

    if (description.trim().length > DOCUMENT_FILE_LIMITS.description) {
      setEditorError(
        `Document description cannot exceed ${DOCUMENT_FILE_LIMITS.description} characters.`,
      );

      return;
    }

    const duplicateFile = documents.some(
      (document) =>
        document.fileName?.trim().toLocaleLowerCase() ===
        selectedFile.name.trim().toLocaleLowerCase(),
    );

    if (duplicateFile) {
      setEditorError("A document with this file name has already been added.");

      return;
    }

    try {
      setIsUploading(true);

      const storedFile = await saveDocumentFile(selectedFile, {
        recordId: educationId || "",

        category: "education",
      });

      const document = createEducationDocument({
        documentType,

        name: normalizedName,

        description: description.trim(),

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

      onChange?.(normalizeDocumentOrder([...documents, document]));

      resetEditor();
    } catch (error) {
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
   * Preview or Download
   * =========================================
   */

  const getDocumentObjectUrl = async (document) => {
    if (document.fileUrl) {
      return {
        url: document.fileUrl,
        temporary: false,
      };
    }

    if (!document.storageKey) {
      throw new Error("This document does not have a storage location.");
    }

    const url = await createStoredDocumentUrl(document.storageKey);

    return {
      url,
      temporary: true,
    };
  };

  const handlePreview = async (document) => {
    try {
      setWorkingDocumentId(document.id);

      const { url, temporary } = await getDocumentObjectUrl(document);

      const previewWindow = window.open(url, "_blank", "noopener,noreferrer");

      if (!previewWindow) {
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

  const handleDownload = async (educationDocument) => {
    try {
      setWorkingDocumentId(educationDocument.id);

      const { url, temporary } = await getDocumentObjectUrl(educationDocument);

      const link = window.document.createElement("a");

      link.href = url;

      link.download =
        educationDocument.fileName || educationDocument.name || "document";

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
   * Remove
   * =========================================
   */

  const handleRemove = async (document) => {
    const shouldRemove = window.confirm(
      `Remove "${document.name}"?\n\nThe uploaded file will also be removed from browser storage.`,
    );

    if (!shouldRemove) {
      return;
    }

    try {
      setWorkingDocumentId(document.id);

      if (document.storageProvider === "indexed-db" && document.storageKey) {
        await deleteStoredDocumentFile(document.storageKey);
      }

      const remainingDocuments = documents.filter(
        (candidate) => candidate.id !== document.id,
      );

      onChange?.(normalizeDocumentOrder(remainingDocuments));
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
   * Reorder
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
      className="education-form-section education-document-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="education-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Supporting Evidence</small>

          <h3 id={sectionTitleId}>Supporting Documents</h3>

          <p>
            Upload diplomas, transcripts, academic certificates, credential
            evaluations, Word documents, PDFs, or images.
          </p>
        </div>
      </header>

      <div className="education-document-editor-notice">
        <span aria-hidden="true">ⓘ</span>

        <p>
          Documents are stored privately in this browser. PDF, image, and text
          files can be previewed. Word files are downloaded for viewing.
        </p>
      </div>

      <div className="education-document-editor-form">
        <div className="education-document-editor-field education-document-editor-wide">
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
          <div className="education-document-editor-selected education-document-editor-wide">
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

        <div className="education-document-editor-field">
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
            placeholder="Bachelor’s Degree Diploma"
            disabled={isDisabled}
          />
        </div>

        <div className="education-document-editor-field">
          <label htmlFor={typeSelectId}>Document Type</label>

          <select
            id={typeSelectId}
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
            disabled={isDisabled}
          >
            {EDUCATION_DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="education-document-editor-field">
          <label htmlFor={visibilitySelectId}>Visibility</label>

          <select
            id={visibilitySelectId}
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
            disabled={isDisabled}
          >
            {DOCUMENT_VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="education-document-editor-field education-document-editor-wide">
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

          <small className="education-document-editor-character-count">
            {description.length}/{DOCUMENT_FILE_LIMITS.description}
          </small>
        </div>

        {editorError && (
          <p
            className="education-document-editor-error education-document-editor-wide"
            role="alert"
          >
            {editorError}
          </p>
        )}

        <footer className="education-document-editor-form-footer education">
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
              className="education-document-editor-add"
              onClick={handleAddDocument}
              disabled={isDisabled || hasReachedMaximum}
            >
              {isUploading ? "Uploading..." : "+ Add Document"}
            </button>
          </div>
        </footer>
      </div>

      {fieldErrors.supportingDocuments && (
        <p className="education-document-editor-error" role="alert">
          {fieldErrors.supportingDocuments}
        </p>
      )}

      {orderedDocuments.length > 0 ? (
        <div className="education-document-editor-list">
          {orderedDocuments.map((document, index) => {
            const documentError =
              fieldErrors[`supportingDocuments.${index}.name`] ||
              fieldErrors[`supportingDocuments.${index}.fileName`] ||
              fieldErrors[`supportingDocuments.${index}.storageKey`];

            const isWorking = workingDocumentId === document.id;

            return (
              <article
                key={document.id}
                className={`education-document-editor-item ${
                  documentError ? "education-document-editor-item--error" : ""
                }`}
              >
                <div className="education-document-editor-order">
                  <span>{String(index + 1).padStart(2, "0")}</span>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleMove(document.id, "up")}
                      disabled={isDisabled || isWorking || index === 0}
                      aria-label={`Move ${document.name} up`}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(document.id, "down")}
                      disabled={
                        isDisabled ||
                        isWorking ||
                        index === orderedDocuments.length - 1
                      }
                      aria-label={`Move ${document.name} down`}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="education-document-editor-content">
                  <div className="education-document-editor-labels">
                    <span>
                      {getEducationDocumentTypeLabel(document.documentType)}
                    </span>

                    <span>{getDocumentFormatLabel(document)}</span>

                    <span>
                      {getDocumentVisibilityLabel(document.visibility)}
                    </span>
                  </div>

                  <strong>{document.name}</strong>

                  <small>
                    {document.fileName}
                    {" · "}
                    {formatFileSize(document.fileSize)}
                  </small>

                  {document.description && <p>{document.description}</p>}

                  {documentError && <small role="alert">{documentError}</small>}
                </div>

                <div className="education-document-editor-actions">
                  {canPreviewDocument(document) && (
                    <button
                      type="button"
                      onClick={() => handlePreview(document)}
                      disabled={isDisabled || isWorking}
                    >
                      Preview
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDownload(document)}
                    disabled={isDisabled || isWorking}
                  >
                    Download
                  </button>

                  <button
                    type="button"
                    className="education-document-editor-remove"
                    onClick={() => handleRemove(document)}
                    disabled={isDisabled || isWorking}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="education-document-editor-empty">
          <span aria-hidden="true">◇</span>

          <h4>No supporting documents</h4>

          <p>
            Upload a diploma, transcript, certificate, evaluation, Word
            document, PDF, or image.
          </p>
        </div>
      )}
    </section>
  );
}

export default EducationDocumentEditor;
