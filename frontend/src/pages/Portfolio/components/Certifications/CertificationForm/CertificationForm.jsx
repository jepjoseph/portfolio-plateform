import { useState } from "react";
import "./CertificationForm.css";

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function CertificationForm({ certification = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: certification?.name ?? "",
    issuingOrganization:
      certification?.issuingOrganization ?? certification?.issuer ?? "",
    issueDate: certification?.issueDate?.slice(0, 7) ?? "",
    expirationDate: certification?.expirationDate?.slice(0, 7) ?? "",
    credentialId: certification?.credentialId ?? "",
    credentialUrl: certification?.credentialUrl ?? "",
    description: certification?.description ?? "",
    file: null,
    removeExistingFile: false,
  });
  const [fileError, setFileError] = useState("");

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      setFileError("Upload a PDF, Word, JPG, PNG, or WEBP file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("The certificate file must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setFileError("");
    setFormData((current) => ({ ...current, file, removeExistingFile: false }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (
      formData.expirationDate &&
      formData.issueDate &&
      formData.expirationDate < formData.issueDate
    )
      return;

    onSubmit?.({
      ...formData,
      name: formData.name.trim(),
      issuingOrganization: formData.issuingOrganization.trim(),
      credentialId: formData.credentialId.trim(),
      credentialUrl: formData.credentialUrl.trim(),
      description: formData.description.trim(),
    });
  };

  const hasExistingFile = Boolean(
    certification?.fileName && !formData.removeExistingFile && !formData.file,
  );

  return (
    <form className="certification-form" onSubmit={handleSubmit}>
      <header className="certification-form-header">
        <span className="certification-form-eyebrow">Certification</span>
        <h3>{certification ? "Edit Certification" : "Add Certification"}</h3>
        <p>Add the credential details and an optional supporting document.</p>
      </header>

      <div className="certification-form-grid">
        <div className="certification-form-field">
          <label htmlFor="certification-name">Certification Name</label>
          <input
            id="certification-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="CompTIA A+"
            autoComplete="off"
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
            value={formData.issuingOrganization}
            onChange={handleChange}
            placeholder="CompTIA"
            autoComplete="organization"
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
            min={formData.issueDate || undefined}
            value={formData.expirationDate}
            onChange={handleChange}
          />
        </div>
        <div className="certification-form-field">
          <label htmlFor="certification-credential-id">Credential ID</label>
          <input
            id="certification-credential-id"
            name="credentialId"
            value={formData.credentialId}
            onChange={handleChange}
            placeholder="ABC123456"
            autoComplete="off"
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
            autoComplete="url"
          />
        </div>
        <div className="certification-form-field certification-form-field--full">
          <label htmlFor="certification-description">Description</label>
          <textarea
            id="certification-description"
            name="description"
            rows="4"
            maxLength="500"
            value={formData.description}
            onChange={handleChange}
            placeholder="What knowledge or skills does this certification demonstrate?"
          />
          <small>{formData.description.length}/500</small>
        </div>
      </div>

      <div className="certification-file-section">
        <label htmlFor="certification-file">Certificate Document</label>
        <label
          className="certification-file-upload"
          htmlFor="certification-file"
        >
          <strong>Choose a certificate file</strong>
          <span>PDF, Word, JPG, PNG, or WEBP · Maximum 10 MB</span>
        </label>
        <input
          className="certification-file-input"
          id="certification-file"
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
        />

        {hasExistingFile && (
          <div className="certification-file-summary">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>{certification.fileName}</strong>
              <small>Current certificate document</small>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData((current) => ({
                  ...current,
                  removeExistingFile: true,
                }))
              }
            >
              Remove
            </button>
          </div>
        )}

        {formData.file && (
          <div className="certification-file-summary">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>{formData.file.name}</strong>
              <small>{(formData.file.size / 1024 / 1024).toFixed(2)} MB</small>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData((current) => ({ ...current, file: null }))
              }
            >
              Remove
            </button>
          </div>
        )}

        {fileError && (
          <p className="certification-file-error" role="alert">
            {fileError}
          </p>
        )}
      </div>

      <div className="certification-form-actions">
        <button
          type="button"
          className="certification-cancel-button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="certification-save-button">
          {certification ? "Save Changes" : "Add Certification"}
        </button>
      </div>
    </form>
  );
}

export default CertificationForm;
