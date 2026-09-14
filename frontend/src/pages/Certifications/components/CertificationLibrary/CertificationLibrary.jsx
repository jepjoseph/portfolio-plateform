import { useMemo, useState } from "react";

import { prepareCertificationCollection } from "../../../../services/Certification/certificationUtils.js";

import CertificationItem from "../CertificationItem/CertificationItem.jsx";

import "./CertificationLibrary.css";

function CertificationLibrary({
  certifications = [],
  showArchived = false,
  isLoading = false,
  loadStatus = "idle",
  operation = null,
  onAddCertification,
  onRetry,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const [query, setQuery] = useState("");

  const [credentialState, setCredentialState] = useState("all");

  const [documentFilter, setDocumentFilter] = useState("all");

  const [trainingFilter, setTrainingFilter] = useState("all");

  const [sortOption, setSortOption] = useState("issue-newest");

  const displayedCertifications = useMemo(
    () =>
      prepareCertificationCollection({
        certifications,
        query,

        filters: {
          credentialState,
          document: documentFilter,
          training: trainingFilter,
        },

        sortOption,
      }),
    [
      certifications,
      query,
      credentialState,
      documentFilter,
      trainingFilter,
      sortOption,
    ],
  );

  return (
    <section
      className="certification-library"
      aria-labelledby="certification-library-title"
    >
      <header className="certification-library-header">
        <div>
          <span>
            {showArchived ? "Archived Records" : "Credential Collection"}
          </span>

          <h2 id="certification-library-title">
            {showArchived ? "Archived Certifications" : "Saved Certifications"}
          </h2>

          <p>
            Search credentials, review certificate previews, and manage
            professional verification records.
          </p>
        </div>

        <strong className="certification-library-count">
          {displayedCertifications.length}{" "}
          {displayedCertifications.length === 1
            ? "Certification"
            : "Certifications"}
        </strong>
      </header>

      <div className="certification-library-controls">
        <label className="certification-library-search">
          <span>Search</span>

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search certifications, issuers, skills, or Training…"
          />
        </label>

        <label>
          <span>Credential State</span>

          <select
            value={credentialState}
            onChange={(event) => setCredentialState(event.target.value)}
          >
            <option value="all">All states</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="planned">Planned</option>
          </select>
        </label>

        <label>
          <span>Document</span>

          <select
            value={documentFilter}
            onChange={(event) => setDocumentFilter(event.target.value)}
          >
            <option value="all">All records</option>
            <option value="with-document">With document</option>
            <option value="without-document">Without document</option>
          </select>
        </label>

        <label>
          <span>Training</span>

          <select
            value={trainingFilter}
            onChange={(event) => setTrainingFilter(event.target.value)}
          >
            <option value="all">All records</option>
            <option value="linked">Linked</option>
            <option value="not-linked">Not linked</option>
          </select>
        </label>

        <label>
          <span>Sort</span>

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
          >
            <option value="name-ascending">Name A–Z</option>
            <option value="name-descending">Name Z–A</option>
            <option value="issuer-ascending">Issuer A–Z</option>
            <option value="issue-newest">Newest issued</option>
            <option value="expiration-soonest">Expiration soonest</option>
            <option value="recently-updated">Recently updated</option>
          </select>
        </label>
      </div>

      {isLoading && (
        <div
          className="certification-library-state"
          role="status"
          aria-live="polite"
        >
          <span className="certification-library-loader" aria-hidden="true" />

          <strong>Loading certifications</strong>

          <p>Retrieving your Certification Library.</p>
        </div>
      )}

      {!isLoading && loadStatus === "error" && (
        <div className="certification-library-state">
          <strong>Certifications could not be loaded</strong>

          <p>
            Check the browser storage and try loading the Certification Library
            again.
          </p>

          <button type="button" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}

      {!isLoading && loadStatus !== "error" && certifications.length === 0 && (
        <div className="certification-library-state">
          <strong>
            {showArchived
              ? "No archived certifications"
              : "No certifications saved yet"}
          </strong>

          <p>
            {showArchived
              ? "Archived Certification records will appear here."
              : "Add your first professional credential and certificate document."}
          </p>

          {!showArchived && (
            <button type="button" onClick={onAddCertification}>
              Add Your First Certification
            </button>
          )}
        </div>
      )}

      {!isLoading &&
        loadStatus !== "error" &&
        certifications.length > 0 &&
        displayedCertifications.length === 0 && (
          <div className="certification-library-state">
            <strong>No matching certifications</strong>

            <p>Change the search text or filter selections and try again.</p>
          </div>
        )}

      {!isLoading &&
        loadStatus !== "error" &&
        displayedCertifications.length > 0 && (
          <div className="certification-library-list">
            {displayedCertifications.map((certification) => (
              <CertificationItem
                key={certification.id}
                certification={certification}
                operation={operation}
                onEdit={onEdit}
                onArchive={onArchive}
                onRestore={onRestore}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
    </section>
  );
}

export default CertificationLibrary;
