import { useState } from "react";

import CertificationItem from "./CertificationItem/CertificationItem";
import CertificationForm from "./CertificationForm/CertificationForm";

import "./Certifications.css";

function Certifications() {
  const [certifications, setCertifications] = useState([
    {
      id: "cert-1",
      name: "CompTIA A+",
      issuer: "CompTIA",
      issueDate: "2026-05-15",
      expirationDate: "",
      credentialId: "ABC123456",
      credentialUrl: "",
      description:
        "Professional certification covering IT fundamentals, hardware, operating systems, networking, and troubleshooting.",
      file: null,
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);

  const handleAddCertification = (certification) => {
    const newCertification = {
      ...certification,
      id: `cert-${Date.now()}`,
    };

    setCertifications((current) => [...current, newCertification]);

    setIsAdding(false);
  };

  const handleDeleteCertification = (id) => {
    setCertifications((current) =>
      current.filter((certification) => certification.id !== id),
    );
  };

  return (
    <section className="certifications-section">
      {/* =========================================
          Section Header
          ========================================= */}

      <div className="certifications-header">
        <div>
          <span className="certifications-eyebrow">
            Professional Credentials
          </span>

          <h3>Certifications</h3>

          <p>
            Add professional certifications, licenses, and credentials to
            strengthen your portfolio.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            className="certifications-add-button"
            onClick={() => setIsAdding(true)}
          >
            + Add Certification
          </button>
        )}
      </div>

      {/* =========================================
          Add Certification Form
          ========================================= */}

      {isAdding && (
        <CertificationForm
          onSave={handleAddCertification}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* =========================================
          Certification List
          ========================================= */}

      {certifications.length > 0 ? (
        <div className="certifications-list">
          {certifications.map((certification) => (
            <CertificationItem
              key={certification.id}
              certification={certification}
              onDelete={handleDeleteCertification}
            />
          ))}
        </div>
      ) : (
        <div className="certifications-empty">
          <span className="certifications-empty-icon">✦</span>

          <h4>No certifications yet</h4>

          <p>
            Add your professional certifications and credentials to display them
            on your portfolio.
          </p>
        </div>
      )}
    </section>
  );
}

export default Certifications;
