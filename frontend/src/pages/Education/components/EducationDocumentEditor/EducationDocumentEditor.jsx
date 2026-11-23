import { useId, useMemo, useRef, useState } from "react";
import EducationDocumentPreviewModal from "../EducationDocumentPreviewModal/EducationDocumentPreviewModal.jsx";

import {
  DOCUMENT_ACCEPT_VALUE,
  DOCUMENT_FILE_LIMITS,
  DOCUMENT_VISIBILITY_OPTIONS,
  EDUCATION_DOCUMENT_TYPE_OPTIONS,
  getDocumentVisibilityLabel,
  getEducationDocumentTypeLabel,
} from "../../../../config/documentConfig.js";

import { uploadEducationPdf, loadEducationPdf, fetchEducationDocuments, deleteEducationPdf } from "../../../../services/Education/educationApiService.js";

import { createStoredDocumentUrl, revokeDocumentUrl } from "../../../../services/Documents/documentStorage.js";

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
  const [previewDocument, setPreviewDocument] = useState(null);

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
    if (!educationId) {
      setEditorError("Save the Education record before uploading a PDF.");
      return;
    }
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

    if (!/\.pdf$/i.test(selectedFile.name) || (selectedFile.type && selectedFile.type !== "application/pdf") || selectedFile.size > 15 * 1024 * 1024) {
      setEditorError("Only PDF files up to 15 MiB can be uploaded to the Education backend.");
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
      const uploaded = await uploadEducationPdf(educationId, selectedFile);
      if (!uploaded?.id) throw new Error("Backend upload did not return a document ID.");
      const { ownedDocuments } = await fetchEducationDocuments(educationId);
      onChange?.(ownedDocuments.map((doc, index) => ({
        id: doc.id,
        name: doc.name || doc.originalFileName || doc.fileName || "Document",
        fileName: doc.originalFileName || doc.fileName || doc.name || "Document.pdf",
        fileSize: Number(doc.fileSize ?? doc.sizeBytes ?? 0),
        mimeType: "application/pdf", documentType: doc.documentType || "other",
        visibility: doc.visibility || "private", description: doc.description || "",
        storageProvider: "education-api", storageKey: "", fileUrl: "education-api-document",
        uploadedAt: doc.uploadedAt || doc.createdAt || "", order: index,
      })));
      window.dispatchEvent(new CustomEvent("education:documents-changed", { detail: { educationId } }));
      resetEditor();    } catch (error) {
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
    if (document.storageProvider === "education-api") {
      const blob = await loadEducationPdf(educationId, document.id);
      return { url: URL.createObjectURL(blob), temporary: true };
    }
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

  const handlePreview = (document) => {
    setEditorError("");
    setPreviewDocument(document);
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
    if (!educationId || !document?.id || document.storageProvider !== "education-api") {
      setEditorError("Only Education-owned PDFs can be removed here.");
      return;
    }
    const name = document.fileName || document.name || "this PDF";
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    setEditorError("");
    setWorkingDocumentId(document.id);
    try {
      await deleteEducationPdf(educationId, document.id);
      const { ownedDocuments } = await fetchEducationDocuments(educationId);
      onChange?.(ownedDocuments.map((doc, index) => ({
        id: doc.id,
        name: doc.name || doc.originalFileName || doc.fileName || "Document",
        fileName: doc.originalFileName || doc.fileName || doc.name || "Document.pdf",
        fileSize: Number(doc.fileSize ?? doc.sizeBytes ?? 0),
        mimeType: "application/pdf", documentType: doc.documentType || "other",
        visibility: doc.visibility || "private", description: doc.description || "",
        storageProvider: "education-api", storageKey: "", fileUrl: "education-api-document",
        uploadedAt: doc.uploadedAt || doc.createdAt || "", order: index,
      })));
      window.dispatchEvent(new CustomEvent("education:documents-changed", { detail: { educationId } }));
    } catch (error) {
      setEditorError(error?.publicMessage || error?.message || "The PDF could not be deleted.");
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

  const isDisabled = disabled || isUploading || !educationId;

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
          Education documents are stored on the backend. Only PDF files are supported;
          owned PDFs can be permanently removed after confirmation.
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
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={isDisabled || hasReachedMaximum}
          />

          <small>
            PDF only.
            Maximum 15 MiB. Save the Education record before uploading.
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
                    disabled={isDisabled || isWorking || document.storageProvider !== "education-api"}
                    title="Permanently delete this Education-owned PDF"
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
      {previewDocument && (
        <EducationDocumentPreviewModal
          educationId={educationId}
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </section>
  );
}

export default EducationDocumentEditor;
