import { useState } from "react";

import { CONTACT_INFORMATION_CONFIG } from "../../../../services/PersonalInformation/contactInformationConfig";

import "./RepeatableInformationSection.css";

function formatFileSize(fileSize) {
  if (!fileSize) {
    return "";
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / 1024 / 1024).toFixed(2)} MB`;
}

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

function RepeatableInformationSection({
  category,
  items,
  onAdd,
  onChange,
  onRemove,
}) {
  const [fileErrors, setFileErrors] = useState({});

  const config = CONTACT_INFORMATION_CONFIG[category];

  if (!config) {
    return null;
  }

  const isPictureCategory = config.kind === "image";

  const handlePictureChange = async (event, itemId) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!config.allowedFileTypes.includes(file.type)) {
      setFileErrors((currentErrors) => ({
        ...currentErrors,
        [itemId]: "Upload a JPG, PNG, WEBP, or AVIF picture.",
      }));

      event.target.value = "";

      return;
    }

    if (file.size > config.maxFileSize) {
      setFileErrors((currentErrors) => ({
        ...currentErrors,
        [itemId]: `The picture must be ${Math.round(
          config.maxFileSize / 1024 / 1024,
        )} MB or smaller.`,
      }));

      event.target.value = "";

      return;
    }

    try {
      const imageUrl = await readFileAsDataUrl(file);

      onChange(category, itemId, "imageUrl", imageUrl);

      onChange(category, itemId, "fileName", file.name);

      onChange(category, itemId, "fileType", file.type);

      onChange(category, itemId, "fileSize", file.size);

      setFileErrors((currentErrors) => {
        const updatedErrors = {
          ...currentErrors,
        };

        delete updatedErrors[itemId];

        return updatedErrors;
      });
    } catch (error) {
      setFileErrors((currentErrors) => ({
        ...currentErrors,
        [itemId]:
          error.message || "The selected picture could not be processed.",
      }));
    }
  };

  const handleRemovePicture = (itemId) => {
    onChange(category, itemId, "imageUrl", "");
    onChange(category, itemId, "fileName", "");
    onChange(category, itemId, "fileType", "");
    onChange(category, itemId, "fileSize", 0);

    setFileErrors((currentErrors) => {
      const updatedErrors = {
        ...currentErrors,
      };

      delete updatedErrors[itemId];

      return updatedErrors;
    });
  };

  return (
    <section className="repeatable-information-section">
      <header className="repeatable-information-header">
        <div>
          <span>{config.eyebrow}</span>

          <h4>{config.plural}</h4>

          <p>
            Add the {config.plural.toLowerCase()} available to your portfolios
            and resumes.
          </p>
        </div>

        <button
          type="button"
          className="repeatable-information-add-button"
          onClick={() => onAdd(category)}
        >
          + Add {config.singular}
        </button>
      </header>

      <div className="repeatable-information-list">
        {items.map((item, index) => (
          <article key={item.id} className="repeatable-information-item">
            <div className="repeatable-information-item-header">
              <div>
                <span>
                  {config.singular} {index + 1}
                </span>

                {index === 0 && <small>Primary</small>}
              </div>

              <button
                type="button"
                className="repeatable-information-remove-button"
                onClick={() => onRemove(category, item.id)}
                aria-label={`Remove ${config.singular} ${index + 1}`}
                title={`Remove ${config.singular.toLowerCase()}`}
              >
                ×
              </button>
            </div>

            <div className="repeatable-information-fields">
              {/* Type */}

              <div className="repeatable-information-field">
                <label htmlFor={`${category}-type-${item.id}`}>Type</label>

                <select
                  id={`${category}-type-${item.id}`}
                  value={item.type}
                  onChange={(event) =>
                    onChange(category, item.id, "type", event.target.value)
                  }
                >
                  {config.typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Picture Upload */}

              {isPictureCategory ? (
                <div className="repeatable-information-field">
                  <label htmlFor={`${category}-file-${item.id}`}>Picture</label>

                  <label
                    className="repeatable-picture-upload"
                    htmlFor={`${category}-file-${item.id}`}
                  >
                    <span>
                      {item.imageUrl ? "Replace Picture" : "Choose Picture"}
                    </span>

                    <small>
                      JPG, PNG, WEBP or AVIF · Maximum{" "}
                      {Math.round(config.maxFileSize / 1024 / 1024)} MB
                    </small>
                  </label>

                  <input
                    className="repeatable-picture-file-input"
                    id={`${category}-file-${item.id}`}
                    type="file"
                    accept={config.accept}
                    onChange={(event) => handlePictureChange(event, item.id)}
                  />
                </div>
              ) : (
                <div className="repeatable-information-field">
                  <label htmlFor={`${category}-value-${item.id}`}>
                    {config.singular}
                  </label>

                  <input
                    id={`${category}-value-${item.id}`}
                    type={config.inputType}
                    inputMode={config.inputMode}
                    autoComplete={config.autoComplete}
                    value={item.value}
                    onChange={(event) =>
                      onChange(category, item.id, "value", event.target.value)
                    }
                    placeholder={config.placeholder}
                  />
                </div>
              )}

              {/* Picture Preview */}

              {isPictureCategory && item.imageUrl && (
                <div className="repeatable-picture-preview repeatable-information-field--full">
                  <img
                    src={item.imageUrl}
                    alt={
                      item.description || item.fileName || "Selected preview"
                    }
                  />

                  <div>
                    <strong>{item.fileName || "Selected picture"}</strong>

                    <span>{formatFileSize(item.fileSize)}</span>

                    <button
                      type="button"
                      onClick={() => handleRemovePicture(item.id)}
                    >
                      Remove Picture
                    </button>
                  </div>
                </div>
              )}

              {fileErrors[item.id] && (
                <p
                  className="repeatable-picture-error repeatable-information-field--full"
                  role="alert"
                >
                  {fileErrors[item.id]}
                </p>
              )}

              {/* Description */}

              <div className="repeatable-information-field repeatable-information-field--full">
                <label htmlFor={`${category}-description-${item.id}`}>
                  {isPictureCategory ? "Picture Description" : "Description"}

                  <span>Optional</span>
                </label>

                <input
                  id={`${category}-description-${item.id}`}
                  type="text"
                  value={item.description}
                  onChange={(event) =>
                    onChange(
                      category,
                      item.id,
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder={
                    isPictureCategory
                      ? "Describe this picture for accessibility"
                      : `Add a short description for this ${config.singular.toLowerCase()}`
                  }
                  maxLength="150"
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default RepeatableInformationSection;
