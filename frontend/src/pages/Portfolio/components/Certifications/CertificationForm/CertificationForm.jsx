import { useState } from "react";

import "./CertificationForm.css";

function CertificationForm({ certification = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: certification?.name || "",
    issuingOrganization: certification?.issuingOrganization || "",
    issueDate: certification?.issueDate || "",
    expirationDate: certification?.expirationDate || "",
    credentialId: certification?.credentialId || "",
    credentialUrl: certification?.credentialUrl || "",
    file: null,
  });

  const [fileError, setFileError] = useState("");

  const allowedFileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedFileTypes.includes(file.type)) {
      setFileError(
        "Please upload a PDF, Word document, JPG, PNG, or WEBP file.",
      );

      event.target.value = "";
      return;
    }

    setFileError("");

    setFormData((currentData) => ({
      ...currentData,
      file,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit?.(formData);
  };

  return (
    <form className="certification-form" onSubmit={handleSubmit}>
      <div className="certification-form-header">
        <div>
          <span className="certification-form-eyebrow">Certification</span>

          <h3>{certification ? "Edit Certification" : "Add Certification"}</h3>

          <p>Add your professional certification and supporting document.</p>
        </div>
      </div>

      <div className="certification-form-grid">
        <div className="certification-form-field">
          <label htmlFor="certification-name">Certification Name</label>

          <input
            id="certification-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="CompTIA A+"
            required
          />
        </div>

        <div className="certification-form-field">
          <label htmlFor="certification-organization">
            Issuing Organization
          </label>

          <input
            id="certification-organization"
            name="issuingOrganization"
            type="text"
            value={formData.issuingOrganization}
            onChange={handleChange}
            placeholder="CompTIA"
            required
          />
        </div>

        <div className="certification-form-field">
          <label htmlFor="certification-issue-date">Issue Date</label>

          <input
            id="certification-issue-date"
            name="issueDate"
            type="month"
            value={formData.issueDate}
            onChange={handleChange}
          />
        </div>

        <div className="certification-form-field">
          <label htmlFor="certification-expiration-date">Expiration Date</label>

          <input
            id="certification-expiration-date"
            name="expirationDate"
            type="month"
            value={formData.expirationDate}
            onChange={handleChange}
          />
        </div>

        <div className="certification-form-field">
          <label htmlFor="certification-credential-id">Credential ID</label>

          <input
            id="certification-credential-id"
            name="credentialId"
            type="text"
            value={formData.credentialId}
            onChange={handleChange}
            placeholder="ABC123456"
          />
        </div>

        <div className="certification-form-field">
          <label htmlFor="certification-credential-url">Credential URL</label>

          <input
            id="certification-credential-url"
            name="credentialUrl"
            type="url"
            value={formData.credentialUrl}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="certification-file-section">
        <label htmlFor="certification-file">Certificate Document</label>

        <div className="certification-file-upload">
          <input
            id="certification-file"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
          />

          <span>PDF, Word, JPG, PNG, or WEBP</span>
        </div>

        {formData.file && (
          <div className="certification-selected-file">
            <span className="selected-file-icon">✓</span>

            <div>
              <strong>{formData.file.name}</strong>

              <span>{(formData.file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        )}

        {fileError && <p className="certification-file-error">{fileError}</p>}
      </div>

      <div className="certification-form-actions">
        {onCancel && (
          <button
            type="button"
            className="certification-cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}

        <button type="submit" className="certification-save-button">
          {certification ? "Save Certification" : "Add Certification"}
        </button>
      </div>
    </form>
  );
}

export default CertificationForm;
