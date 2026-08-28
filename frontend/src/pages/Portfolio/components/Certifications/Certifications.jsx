import { useEffect, useRef, useState } from "react";

import CertificationForm from "./CertificationForm/CertificationForm";
import CertificationItem from "./CertificationItem/CertificationItem";

import "./Certifications.css";

const INITIAL_CERTIFICATIONS = [
  {
    id: "cert-1",
    name: "CompTIA A+",
    issuingOrganization: "CompTIA",
    issueDate: "2026-01",
    expirationDate: "",
    credentialId: "",
    credentialUrl: "",
    description:
      "Professional certification covering foundational IT support, hardware, networking, operating systems, and troubleshooting.",
    file: null,
    fileName: "",
    fileUrl: "",
    fileType: "",
  },
];

function Certifications() {
  const [certifications, setCertifications] = useState(INITIAL_CERTIFICATIONS);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingCertification, setEditingCertification] = useState(null);

  const objectUrlsRef = useRef(new Set());

  /*
   * =========================================
   * Object URL Cleanup
   * =========================================
   */

  const revokeObjectUrl = (url) => {
    if (!url?.startsWith("blob:")) {
      return;
    }

    URL.revokeObjectURL(url);

    objectUrlsRef.current.delete(url);
  };

  /*
   * =========================================
   * Add
   * =========================================
   */

  const handleAddCertification = () => {
    setEditingCertification(null);

    setIsFormOpen(true);
  };

  /*
   * =========================================
   * Edit
   * =========================================
   */

  const handleEditCertification = (certification) => {
    setEditingCertification(certification);

    setIsFormOpen(true);
  };

  /*
   * =========================================
   * Save
   * =========================================
   */

  const handleSaveCertification = (values) => {
    let fileData;

    if (values.file) {
      const fileUrl = URL.createObjectURL(values.file);

      objectUrlsRef.current.add(fileUrl);

      revokeObjectUrl(editingCertification?.fileUrl);

      fileData = {
        file: values.file,
        fileName: values.file.name,
        fileUrl,
        fileType: values.file.type,
      };
    } else if (values.removeExistingFile) {
      revokeObjectUrl(editingCertification?.fileUrl);

      fileData = {
        file: null,
        fileName: "",
        fileUrl: "",
        fileType: "",
      };
    } else {
      fileData = {
        file: editingCertification?.file ?? null,
        fileName: editingCertification?.fileName ?? "",
        fileUrl: editingCertification?.fileUrl ?? "",
        fileType: editingCertification?.fileType ?? "",
      };
    }

    const certificationData = {
      name: values.name,
      issuingOrganization: values.issuingOrganization,
      issueDate: values.issueDate,
      expirationDate: values.expirationDate,
      credentialId: values.credentialId,
      credentialUrl: values.credentialUrl,
      description: values.description,
      ...fileData,
    };

    setCertifications((currentCertifications) => {
      if (editingCertification) {
        return currentCertifications.map((certification) =>
          certification.id === editingCertification.id
            ? {
                ...certification,
                ...certificationData,
              }
            : certification,
        );
      }

      const newCertification = {
        id: crypto.randomUUID(),
        ...certificationData,
      };

      return [...currentCertifications, newCertification];
    });

    setIsFormOpen(false);

    setEditingCertification(null);
  };

  /*
   * =========================================
   * Cancel
   * =========================================
   */

  const handleCancelForm = () => {
    setIsFormOpen(false);

    setEditingCertification(null);
  };

  /*
   * =========================================
   * Delete
   * =========================================
   */

  const handleDeleteCertification = (id) => {
    const certification = certifications.find((item) => item.id === id);

    revokeObjectUrl(certification?.fileUrl);

    setCertifications((currentCertifications) =>
      currentCertifications.filter(
        (certificationItem) => certificationItem.id !== id,
      ),
    );
  };

  /*
   * =========================================
   * Component Cleanup
   * =========================================
   */

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;

    return () => {
      objectUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      objectUrls.clear();
    };
  }, []);

  return (
    <section
      className="certifications-section portfolio-editor-card"
      aria-labelledby="certifications-title"
    >
      {/* =========================================
          Header
          ========================================= */}

      <header className="certifications-header">
        <div className="certifications-header-content">
          <span className="certifications-eyebrow">
            Professional Credentials
          </span>

          <h3 id="certifications-title">Certifications</h3>

          <p>
            Add and manage your professional certifications and supporting
            documents.
          </p>
        </div>

        <button
          type="button"
          className="certifications-add-button"
          onClick={handleAddCertification}
        >
          + Add Certification
        </button>
      </header>

      {/* =========================================
          Form
          ========================================= */}

      {isFormOpen && (
        <div className="certifications-form-wrapper">
          <CertificationForm
            key={editingCertification?.id ?? "new"}
            certification={editingCertification}
            onSubmit={handleSaveCertification}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {/* =========================================
          Certifications List
          ========================================= */}

      <div className="certifications-list" aria-live="polite">
        {certifications.length > 0 ? (
          certifications.map((certification) => (
            <CertificationItem
              key={certification.id}
              certification={certification}
              onEdit={handleEditCertification}
              onDelete={handleDeleteCertification}
            />
          ))
        ) : (
          <div className="certifications-empty">
            <span className="certifications-empty-icon" aria-hidden="true">
              ✦
            </span>

            <h4>No certifications yet</h4>

            <p>
              Add your professional certifications and supporting documents.
            </p>

            <button
              type="button"
              className="certifications-empty-button"
              onClick={handleAddCertification}
            >
              + Add Certification
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default Certifications;
