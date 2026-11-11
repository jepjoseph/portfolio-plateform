import TrainingPdfCard from "./TrainingPdfCard.jsx";
import { useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CertificationForm from "../../../Certifications/components/CertificationForm/CertificationForm.jsx";

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
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

/*
 * =========================================
 * Training Document Editor
 * =========================================
 */

function TrainingDocumentEditor({
  trainingId,
  documents = [],
  certifications = [],
  certificationRelationships = [],
  isCertificationDataLoading = false,
  fieldErrors = {},
  disabled = false,
  readOnly = false,
  onChange,
  onUploadDocument,
  onRemoveDocument,
  onCertificationChange,
  onUnlinkCertification,
  onCreateCertification,
}) {
  const sectionTitleId = useId();
  const sourceSelectId = useId();
  const certificationSelectId = useId();
  const certificationNameInputId = useId();
  const certificationIssuerInputId = useId();
  const certificationIssueDateInputId = useId();
  const certificationExpirationDateInputId = useId();
  const certificationCredentialIdInputId = useId();
  const certificationVerificationUrlInputId = useId();
  const certificationFileInputId = useId();
  const fileInputId = useId();
  const nameInputId = useId();
  const typeSelectId = useId();
  const visibilitySelectId = useId();
  const descriptionInputId = useId();

  const fileInputRef = useRef(null);
  const certificationFileInputRef = useRef(null);

  const [documentSource, setDocumentSource] = useState("manual");
  const [selectedCertificationId, setSelectedCertificationId] = useState("");

  const [certificationName, setCertificationName] = useState("");
  const [certificationIssuerName, setCertificationIssuerName] = useState("");
  const [certificationIssueDate, setCertificationIssueDate] = useState("");
  const [certificationExpirationDate, setCertificationExpirationDate] =
    useState("");
  const [certificationDoesNotExpire, setCertificationDoesNotExpire] =
    useState(false);
  const [certificationCredentialId, setCertificationCredentialId] =
    useState("");
  const [certificationVerificationUrl, setCertificationVerificationUrl] =
    useState("");
  const [certificationFile, setCertificationFile] = useState(null);
  const [isCreatingCertification, setIsCreatingCertification] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("other");
  const [visibility, setVisibility] = useState("private");
  const [description, setDescription] = useState("");

  const [editorError, setEditorError] = useState("");
  const [workingDocumentId, setWorkingDocumentId] = useState("");
  const [workingCertificationId, setWorkingCertificationId] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  /*
   * =========================================
   * Normalized Collections
   * =========================================
   */

  const safeDocuments = getArray(documents);
  const safeCertifications = getArray(certifications);
  const safeCertificationRelationships = getArray(certificationRelationships);

  const orderedDocuments = useMemo(
    () =>
      [...safeDocuments].sort(
        (first, second) => (first.order ?? 0) - (second.order ?? 0),
      ),
    [safeDocuments],
  );

  /*
   * =========================================
   * Certification Relationships
   * =========================================
   */

  const linkedCertificationIds = useMemo(
    () =>
      new Set(
        safeCertificationRelationships
          .map((relationship) =>
            getText(
              relationship?.certificationId ||
                relationship?.certificationRecordId,
            ),
          )
          .filter(Boolean),
      ),
    [safeCertificationRelationships],
  );

  const certificationById = useMemo(
    () =>
      new Map(
        safeCertifications
          .filter((certification) => getText(certification?.id))
          .map((certification) => [certification.id, certification]),
      ),
    [safeCertifications],
  );

  const availableCertifications = useMemo(
    () =>
      safeCertifications
        .filter(
          (certification) =>
            getText(certification?.id) &&
            certification.status !== "archived" &&
            !linkedCertificationIds.has(certification.id),
        )
        .sort((first, second) =>
          getText(first?.name).localeCompare(getText(second?.name), undefined, {
            sensitivity: "base",
          }),
        ),
    [safeCertifications, linkedCertificationIds],
  );

  const linkedCertifications = useMemo(
    () =>
      safeCertificationRelationships
        .map((relationship, index) => {
          const certificationId = getText(
            relationship?.certificationId ||
              relationship?.certificationRecordId,
          );

          const savedCertification =
            certificationById.get(certificationId) || null;

          const snapshot =
            relationship?.snapshot &&
            typeof relationship.snapshot === "object" &&
            !Array.isArray(relationship.snapshot)
              ? relationship.snapshot
              : {};

          return {
            relationship,
            certification: savedCertification,
            id: certificationId,
            order:
              Number.isInteger(relationship?.order) && relationship.order >= 0
                ? relationship.order
                : index,

            name:
              getText(savedCertification?.name) ||
              getText(snapshot.name) ||
              getText(relationship?.nameSnapshot) ||
              "Unnamed Certification",

            issuerName:
              getText(savedCertification?.issuingOrganization?.name) ||
              getText(snapshot.issuingOrganizationName) ||
              getText(snapshot.issuerName) ||
              getText(relationship?.issuerNameSnapshot) ||
              "Issuing organization not specified",

            credentialState:
              getText(savedCertification?.credential?.state) ||
              getText(snapshot.credentialState) ||
              getText(relationship?.credentialStateSnapshot) ||
              "",

            credentialId:
              getText(savedCertification?.credential?.credentialId) ||
              getText(savedCertification?.credential?.id) ||
              getText(snapshot.credentialId) ||
              getText(relationship?.credentialIdSnapshot) ||
              "",

            isArchived: savedCertification?.status === "archived",
            isMissing: !savedCertification,
          };
        })
        .filter((item) => item.id)
        .sort((first, second) => first.order - second.order),
    [safeCertificationRelationships, certificationById],
  );

  /*
   * =========================================
   * Limits and State
   * =========================================
   */

  const maximumDocuments =
    TRAINING_FIELD_LIMITS.maximumDocuments ||
    DOCUMENT_FILE_LIMITS.maximumDocumentsPerRecord;

  const maximumCertifications =
    TRAINING_FIELD_LIMITS.maximumRelatedCertifications ?? Infinity;

  const hasReachedDocumentMaximum = safeDocuments.length >= maximumDocuments;

  const hasReachedCertificationMaximum =
    linkedCertifications.length >= maximumCertifications;

  const isDisabled = disabled || readOnly || isUploading || isCreatingCertification;
  const manualDisabled = disabled || (!onUploadDocument && readOnly) || isUploading || isCreatingCertification;

  const certificationRelationshipError = useMemo(() => {
    if (fieldErrors.certificationRelationships) {
      return fieldErrors.certificationRelationships;
    }

    if (fieldErrors.relatedCertificationIds) {
      return fieldErrors.relatedCertificationIds;
    }

    const relationshipErrorField = Object.keys(fieldErrors).find((field) =>
      field.startsWith("certificationRelationships."),
    );

    return relationshipErrorField ? fieldErrors[relationshipErrorField] : "";
  }, [fieldErrors]);

  /*
   * =========================================
   * Reset Manual Editor
   * =========================================
   */

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
   * Reset Certification Creator
   * =========================================
   */

  const resetCertificationCreator = () => {
    setCertificationName("");
    setCertificationIssuerName("");
    setCertificationIssueDate("");
    setCertificationExpirationDate("");
    setCertificationDoesNotExpire(false);
    setCertificationCredentialId("");
    setCertificationVerificationUrl("");
    setCertificationFile(null);
    setEditorError("");

    if (certificationFileInputRef.current) {
      certificationFileInputRef.current.value = "";
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

    if (onUploadDocument && (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf") || file.size > 15 * 1024 * 1024)) {
      setSelectedFile(null); setEditorError("Select a PDF no larger than 15 MiB."); event.target.value = ""; return;
    }
    const validation = validateDocumentFile(file);

    if (!validation.isValid) {
      setSelectedFile(null);

      setEditorError(
        validation.errors?.[0]?.message || "The selected document is invalid.",
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    if (!documentName.trim()) {
      setDocumentName(file.name.replace(/\.[^.]+$/, ""));
    }
  };

  /*
   * =========================================
   * Certification File Selection
   * =========================================
   */

  const handleCertificationFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setEditorError("");

    if (!file) {
      setCertificationFile(null);
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ];

    const normalizedFileName = file.name.trim().toLocaleLowerCase();

    const hasSupportedExtension = allowedExtensions.some((extension) =>
      normalizedFileName.endsWith(extension),
    );

    if (!hasSupportedExtension) {
      setCertificationFile(null);

      setEditorError(
        "Select a PDF, Word document, JPG, PNG, or WebP certificate file.",
      );

      event.target.value = "";
      return;
    }

    if (file.size <= 0) {
      setCertificationFile(null);
      setEditorError("The selected certificate file is empty.");
      event.target.value = "";
      return;
    }

    /*
     * Certification validation currently limits
     * document files to 10 MB.
     */

    if (file.size > 10 * 1024 * 1024) {
      setCertificationFile(null);
      setEditorError("The certificate file cannot exceed 10 MB.");
      event.target.value = "";
      return;
    }

    setCertificationFile(file);

    if (!certificationName.trim()) {
      setCertificationName(file.name.replace(/\.[^.]+$/, ""));
    }
  };

  /*
   * =========================================
   * Add Manual Document
   * =========================================
   */

  const handleAddDocument = async () => {
    setEditorError("");

    if (hasReachedDocumentMaximum) {
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

    const duplicateFile = safeDocuments.some(
      (document) =>
        getText(document?.fileName).toLocaleLowerCase() === normalizedFileName,
    );

    if (duplicateFile) {
      setEditorError("A document with this file name has already been added.");
      return;
    }

    let storedFile = null;

    try {
      setIsUploading(true);

      if (onUploadDocument) {
        await onUploadDocument(selectedFile, {documentType, name:normalizedName, description:normalizedDescription, visibility});
        resetEditor(); return;
      }
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
        order: safeDocuments.length,
      });

      await onChange?.(
        normalizeDocumentOrder([...safeDocuments, trainingDocument]),
      );

      resetEditor();
    } catch (error) {
      if (storedFile?.storageKey) {
        try {
          await deleteStoredDocumentFile(storedFile.storageKey);
        } catch {
          /*
           * Preserve the original upload error.
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
   * Link Certification
   * =========================================
   */

  const handleLinkCertification = async () => {
    setEditorError("");

    if (typeof onCertificationChange !== "function") {
      setEditorError(
        "Certification linking is not available in this Training form.",
      );
      return;
    }

    if (!selectedCertificationId) {
      setEditorError("Select a Certification from the library.");
      return;
    }

    if (hasReachedCertificationMaximum) {
      setEditorError(
        `Link no more than ${maximumCertifications} Certifications.`,
      );
      return;
    }

    const certification = certificationById.get(selectedCertificationId);

    if (!certification) {
      setEditorError("The selected Certification could not be found.");
      return;
    }

    if (linkedCertificationIds.has(certification.id)) {
      setEditorError("This Certification is already linked.");
      return;
    }

    try {
      setWorkingCertificationId(certification.id);

      await onCertificationChange(certification, true);

      setSelectedCertificationId("");
    } catch (error) {
      setEditorError(
        error?.publicMessage ||
          error?.message ||
          "The Certification could not be linked.",
      );
    } finally {
      setWorkingCertificationId("");
    }
  };

  /*
   * =========================================
   * Create Certification
   * =========================================
   */

  const [isFullCertificationOpen, setIsFullCertificationOpen] = useState(false);
  const [createdCertificationAfterFailure, setCreatedCertificationAfterFailure] = useState("");

  const handleFullCertificationSubmit = async (certificationData, documentUploads) => {
    if (createdCertificationAfterFailure) {
      throw new Error("Certification already created. Close this dialog and use the existing Library record to finish its documents or retry linking.");
    }
    if (hasReachedCertificationMaximum) {
      throw new Error("Maximum linked Certifications reached.");
    }
    if (typeof onCreateCertification !== "function" || typeof onCertificationChange !== "function") {
      throw new Error("Certification creation or linking is unavailable.");
    }
    setEditorError("");
    setIsCreatingCertification(true);
    let created;
    try {
      created = await onCreateCertification({ certificationData, documentUploads });
      await onCertificationChange(created, true);
      setIsFullCertificationOpen(false);
      setDocumentSource("certification");
    } catch (error) {
      if (created?.id || error?.certificationId) {
        setCreatedCertificationAfterFailure(created?.id || error.certificationId);
      }
      const message = error?.publicMessage || error?.message || "Certification creation failed.";
      const detail = created?.id
        ? "The Certification was saved in your Library, but linking failed. Close this dialog and select that existing Certification to retry. " + message
        : message;
      setEditorError(detail);
      if (created?.id) {
        const linkError = new Error(detail, { cause: error });
        linkError.certificationId = created.id;
        throw linkError;
      }
      throw error;
    } finally {
      setIsCreatingCertification(false);
    }
  };

  /*
   * =========================================
   * Unlink Certification
   * =========================================
   */

  const handleUnlinkCertification = async (linkedCertification) => {
    if (typeof onUnlinkCertification !== "function" && typeof onCertificationChange !== "function") {
      setEditorError(
        "Certification unlinking is not available in this Training form.",
      );
      return;
    }

    const shouldUnlink = window.confirm(
      `Remove the link to "${linkedCertification.name}"?\n\n` +
        "The Certification record and its files will remain in the Certification Library.",
    );

    if (!shouldUnlink) {
      return;
    }

    try {
      setEditorError("");
      setWorkingCertificationId(linkedCertification.id);

      const certification = linkedCertification.certification || { id: linkedCertification.id };
      if (typeof onUnlinkCertification === "function") {
        await onUnlinkCertification(certification);
      } else {
        await onCertificationChange(certification, false);
      }
    } catch (error) {
      setEditorError(
        error?.publicMessage ||
          error?.message ||
          "The Certification could not be unlinked.",
      );
    } finally {
      setWorkingCertificationId("");
    }
  };

  /*
   * =========================================
   * Resolve Manual Document URL
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
   * Preview Manual Document
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
   * Download Manual Document
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
   * Remove Manual Document
   * =========================================
   */

  const handleRemove = async (trainingDocument) => {
    const shouldRemove = window.confirm(
      `Remove "${trainingDocument.name}"?\n\n` +
        "The uploaded file will also be removed from browser storage.",
    );

    if (!shouldRemove) {
      return;
    }

    try {
      setEditorError("");
      setWorkingDocumentId(trainingDocument.id);

      if (
        trainingDocument.storageProvider === "indexed-db" &&
        trainingDocument.storageKey
      ) {
        await deleteStoredDocumentFile(trainingDocument.storageKey);
      }

      const remainingDocuments = safeDocuments.filter(
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
   * Reorder Manual Documents
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

  return (
    <section
      className="training-form-section training-document-editor"
      aria-labelledby={sectionTitleId}
    >
      <header className="training-form-section-header">
        <span aria-hidden="true" />

        <div>
          <small>Supporting Evidence</small>

          <h3 id={sectionTitleId}>Documents and Certifications</h3>

          <p>
            Upload a Training document manually or link a Certification that
            already exists in your Certification Library.
          </p>
        </div>
      </header>

      <div className="training-document-editor-notice">
        <span aria-hidden="true">ⓘ</span>

        <p>
          Linked Certification files remain owned by the Certification Library.
          Linking a Certification does not create a duplicate file.
        </p>
      </div>

      <div className="training-document-editor-source">
        <label htmlFor={sourceSelectId}>Add Supporting Evidence</label>

        <select
          id={sourceSelectId}
          value={documentSource}
          onChange={(event) => {
            setDocumentSource(event.target.value);
            setEditorError("");
          }}
          disabled={isDisabled}
        >
          <option value="manual">Upload a document manually</option>
          <option value="certification">
            Choose from Certification Library
          </option>
          <option value="create-certification">
            Create a new Certification
          </option>
        </select>
      </div>

      {documentSource === "manual" && (
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
              accept={onUploadDocument ? ".pdf,application/pdf" : DOCUMENT_ACCEPT_VALUE}
              onChange={handleFileChange}
              disabled={manualDisabled || hasReachedDocumentMaximum}
            />

            <small>
              {onUploadDocument ? "PDF only. Maximum 15 MiB." : <>PDF, Word, OpenDocument, text, JPG, PNG, WebP, GIF, BMP, or HEIC. Maximum {formatFileSize(DOCUMENT_FILE_LIMITS.maximumFileSizeBytes)}.</>}
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
              disabled={manualDisabled}
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
              disabled={manualDisabled}
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
              disabled={manualDisabled}
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
              disabled={manualDisabled}
            />

            <small className="training-document-editor-character-count">
              {description.length}/{DOCUMENT_FILE_LIMITS.description}
            </small>
          </div>

          <footer className="training-document-editor-form-footer">
            <small>
              {safeDocuments.length}/{maximumDocuments} documents
            </small>

            <div>
              {selectedFile && (
                <button
                  type="button"
                  onClick={resetEditor}
                  disabled={manualDisabled}
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                className="training-document-editor-add"
                onClick={handleAddDocument}
                disabled={
                  manualDisabled || hasReachedDocumentMaximum || !selectedFile
                }
              >
                {isUploading ? "Uploading..." : "+ Add Document"}
              </button>
            </div>
          </footer>
        </div>
      )}

      {documentSource === "certification" && (
        <div className="training-document-editor-certification-picker">
          <div className="training-document-editor-field">
            <label htmlFor={certificationSelectId}>
              Saved Certification
              <small> Optional</small>
            </label>

            <select
              id={certificationSelectId}
              value={selectedCertificationId}
              onChange={(event) => {
                setSelectedCertificationId(event.target.value);
                setEditorError("");
              }}
              disabled={
                isDisabled ||
                isCertificationDataLoading ||
                availableCertifications.length === 0 ||
                hasReachedCertificationMaximum
              }
            >
              <option value="">
                {isCertificationDataLoading
                  ? "Loading Certifications..."
                  : hasReachedCertificationMaximum
                    ? "Maximum linked Certifications reached"
                    : availableCertifications.length === 0
                      ? "No available Certifications"
                      : "Select a saved Certification"}
              </option>

              {availableCertifications.map((certification) => (
                <option key={certification.id} value={certification.id}>
                  {certification.name || "Unnamed Certification"}
                  {" — "}
                  {certification.issuingOrganization?.name || "Unknown issuer"}
                </option>
              ))}
            </select>

            <small>
              Only active Certifications that are not already linked are
              available.
            </small>
          </div>

          <button
            type="button"
            className="training-document-editor-link-certification"
            onClick={handleLinkCertification}
            disabled={
              isDisabled ||
              isCertificationDataLoading ||
              hasReachedCertificationMaximum ||
              !selectedCertificationId ||
              Boolean(workingCertificationId)
            }
          >
            {workingCertificationId ? "Linking..." : "+ Link Certification"}
          </button>
        </div>
      )}

      {documentSource === "create-certification" && (
        <div className="training-document-editor-create-certification">
          <h4>Create a New Certification</h4>
          <p>Use the complete Certification form, including multiple supporting documents.</p>
          <button type="button" disabled={isDisabled || hasReachedCertificationMaximum || Boolean(createdCertificationAfterFailure)} onClick={() => setIsFullCertificationOpen(true)}>
            Open Full Certification Form
          </button>
          {createdCertificationAfterFailure && (
            <p role="alert">Certification {createdCertificationAfterFailure} was saved, but an upload or linking step failed. Do not create it again. Open the Certification Library to complete the documents.</p>
          )}
        </div>
      )}

      {isFullCertificationOpen && createPortal(
        <div role="presentation" style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.7)", overflowY: "auto", padding: "2rem" }}>
          <div role="dialog" aria-modal="true" aria-label="Create Certification" style={{ background: "#111827", color: "#f9fafb", border: "1px solid #374151", maxWidth: "1100px", margin: "auto", padding: "1.5rem", borderRadius: "12px" }}>
            <CertificationForm
              existingCertifications={safeCertifications}
              isSaving={isCreatingCertification || Boolean(createdCertificationAfterFailure)}
              onSubmit={handleFullCertificationSubmit}
              onCancel={() => { if (!isCreatingCertification) setIsFullCertificationOpen(false); }}
            />
          </div>
        </div>,
        document.body,
      )}

      {editorError && (
        <p className="training-document-editor-error" role="alert">
          {editorError}
        </p>
      )}

      {fieldErrors.supportingDocuments && (
        <p className="training-document-editor-error" role="alert">
          {fieldErrors.supportingDocuments}
        </p>
      )}

      {certificationRelationshipError && (
        <p className="training-document-editor-error" role="alert">
          {certificationRelationshipError}
        </p>
      )}

      {linkedCertifications.length > 0 && (
        <div className="training-document-editor-linked">
          <div className="training-document-editor-subheading">
            <div>
              <small>Certification Library</small>
              <h4>Linked Certifications</h4>
            </div>

            <span>{linkedCertifications.length}</span>
          </div>

          <div className="training-document-editor-certification-list">
            {linkedCertifications.map((linkedCertification) => {
              const relationshipError =
                fieldErrors[
                  `certificationRelationships.${linkedCertification.order}.certificationId`
                ] ||
                fieldErrors[
                  `certificationRelationships.${linkedCertification.order}.nameSnapshot`
                ];

              return (
                <article
                  key={linkedCertification.id}
                  className={`training-document-editor-certification-item ${
                    relationshipError
                      ? "training-document-editor-certification-item--error"
                      : ""
                  }`}
                >
                  <div className="training-document-editor-certification-icon">
                    ◇
                  </div>

                  <div className="training-document-editor-certification-content">
                    <div className="training-document-editor-labels">
                      <span>Certification</span>

                      {linkedCertification.credentialState && (
                        <span>{linkedCertification.credentialState}</span>
                      )}

                      {linkedCertification.isArchived && (
                        <span className="training-document-editor-label-warning">
                          Archived
                        </span>
                      )}

                      {linkedCertification.isMissing && (
                        <span className="training-document-editor-label-error">
                          Missing record
                        </span>
                      )}
                    </div>

                    <strong>{linkedCertification.name}</strong>

                    <small>{linkedCertification.issuerName}</small>

                    {linkedCertification.credentialId && (
                      <p>Credential ID: {linkedCertification.credentialId}</p>
                    )}

                    {relationshipError && (
                      <small
                        className="training-document-editor-field-error"
                        role="alert"
                      >
                        {relationshipError}
                      </small>
                    )}
                  </div>

                  <div className="training-document-editor-actions">
                    <button
                      type="button"
                      className="training-document-editor-remove"
                      onClick={() =>
                        handleUnlinkCertification(linkedCertification)
                      }
                      disabled={
                        disabled || isUploading || isCreatingCertification ||
                        (readOnly && typeof onUnlinkCertification !== "function") ||
                        Boolean(workingCertificationId)
                      }
                    >
                      {workingCertificationId === linkedCertification.id
                        ? "Removing..."
                        : "Unlink"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {onUploadDocument && orderedDocuments.length > 0 && (
        <div className="training-document-editor-documents">
          <h4>Uploaded Training PDFs ({orderedDocuments.length})</h4>
          {orderedDocuments.map(document => <TrainingPdfCard key={document.id} trainingId={trainingId} document={document} disabled={manualDisabled} onRemove={onRemoveDocument} />)}
        </div>
      )}
      {!onUploadDocument && orderedDocuments.length > 0 && (
        <div className="training-document-editor-documents">
          <div className="training-document-editor-subheading">
            <div>
              <small>Training Library</small>
              <h4>Uploaded Documents</h4>
            </div>

            <span>{orderedDocuments.length}</span>
          </div>

          <div className="training-document-editor-list">
            {orderedDocuments.map((trainingDocument, index) => {
              const documentError =
                fieldErrors[`supportingDocuments.${index}.name`] ||
                fieldErrors[`supportingDocuments.${index}.fileName`] ||
                fieldErrors[`supportingDocuments.${index}.storageKey`] ||
                fieldErrors[`supportingDocuments.${index}.documentType`] ||
                fieldErrors[`supportingDocuments.${index}.visibility`];

              const isDocumentWorking =
                workingDocumentId === trainingDocument.id;

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
                        disabled={
                          isDisabled || isDocumentWorking || index === 0
                        }
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
                        {getDocumentVisibilityLabel(
                          trainingDocument.visibility,
                        )}
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
                        disabled={disabled || isUploading || isCreatingCertification || isDocumentWorking}
                      >
                        Preview
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownload(trainingDocument)}
                      disabled={disabled || isUploading || isCreatingCertification || isDocumentWorking}
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
        </div>
      )}

      {orderedDocuments.length === 0 && linkedCertifications.length === 0 && (
        <div className="training-document-editor-empty">
          <span aria-hidden="true">◇</span>

          <h4>No supporting evidence</h4>

          <p>
            Upload a Training document or link an existing Certification from
            your Certification Library.
          </p>
        </div>
      )}
    </section>
  );
}

export default TrainingDocumentEditor;
