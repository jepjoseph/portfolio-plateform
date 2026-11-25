import { useEffect, useState } from "react";
import PortfolioLinkActions from "./PortfolioLinkActions.jsx";

import {
  portfolioBackendService as api,
} from "../../../services/Portfolio/portfolioBackendService.js";

import PortfolioSnapshotPreview
  from "./PortfolioSnapshotPreview.jsx";

// Keep disabled until security and live SQL tests pass.
const PUBLICATION_ENABLED =
  import.meta.env.VITE_PORTFOLIO_PUBLIC_ENABLED === "true";

export default function PortfolioPublicationManager({
  portfolioId,
  onSaved,
  externalRevision = 0,
}) {
  const [state, setState] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;

    api.getPublication(portfolioId)
      .then(result => {
        if (active) setState(result);
      })
      .catch(failure => {
        if (active) {
          setError(
            failure.publicMessage || failure.message,
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [portfolioId, revision, externalRevision]);

  useEffect(() => {
    setSnapshot(null);
    setConsent(false);
  }, [externalRevision]);

  const reload = () => {
    setState(null);
    setSnapshot(null);
    setConsent(false);
    setLoading(true);
    setError("");
    setRevision(value => value + 1);
  };

  const generatePreview = async () => {
    if (loading || saving) return;

    setSaving(true);
    setSnapshot(null);
    setConsent(false);
    setError("");
    setMessage("");

    try {
      const result = await api.getPreview(portfolioId);
      const status = await api.getPublication(portfolioId);

      if (
        !result.snapshot ||
        result.snapshot.schemaVersion !== 1 ||
        !result.rowVersion ||
        result.rowVersion !== status.rowVersion
      ) {
        throw new Error(
          "Portfolio changed during preview. Generate it again.",
        );
      }

      setState(status);
      setSnapshot(result.snapshot);
      setMessage("Server preview generated.");
    } catch (failure) {
      setError(
        failure.publicMessage || failure.message,
      );
    } finally {
      setSaving(false);
    }
  };

  const mutate = async action => {
    if (
      !PUBLICATION_ENABLED ||
      saving ||
      !state?.rowVersion
    ) return;

    if (
      action === "publish" &&
      (!snapshot || !consent || !state.primaryRoute)
    ) return;

    if (
      action === "unpublish" &&
      !window.confirm("Unpublish this Portfolio?")
    ) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      let result;

      if (action === "publish") {
        result = await api.publishPortfolio(
          portfolioId,
          true,
          state.rowVersion,
        );
      } else {
        result = await api.unpublishPortfolio(
          portfolioId,
          state.rowVersion,
        );
      }

      setMessage(
        action === "publish"
          ? "Portfolio publication saved."
          : "Portfolio unpublished.",
      );

      reload();

      try {
        await onSaved?.(result.rowVersion);
      } catch {
        setMessage(
          "Publication updated. Refresh the Portfolio list.",
        );
      }
    } catch (failure) {
      setSnapshot(null);
      setConsent(false);

      setError(
        failure.publicMessage ||
        failure.message ||
        "Unable to update Portfolio publication.",
      );
    } finally {
      setSaving(false);
    }
  };

  const published =
    state?.publication?.isPublished === true;

  return (
    <section className="pm-builder">
      <div className="pm-section-header">
        <h3>Preview and publication</h3>

        <button
          type="button"
          className="pm-button"
          disabled={loading || saving}
          onClick={reload}
        >
          Reload status
        </button>
      </div>

      {!PUBLICATION_ENABLED && (
        <p className="pm-notice">
          Publishing remains disabled pending security
          and live database validation.
          Server preview is available.
        </p>
      )}

      {error && (
        <p className="pm-error" role="alert">{error}</p>
      )}

      {message && <p role="status">{message}</p>}

      {loading && <p>Loading publication status...</p>}

      {state && (
        <div className="pm-url-card">
          <strong>
            Publication status: {published
              ? "Published in database"
              : "Unpublished"}
          </strong>

          <small>Primary URL:</small>
          {state.primaryRoute ? (
            <PortfolioLinkActions routeKey={state.primaryRoute} />
          ) : <small>Not reserved</small>}

          <small>
            Version: {state.publication?.version || 0}
          </small>

          <small>
            Public accessibility is not verified.
          </small>
        </div>
      )}

      <div className="pm-actions">
        <button
          type="button"
          className="pm-button pm-primary"
          disabled={loading || saving || !state}
          onClick={generatePreview}
        >
          {saving ? "Processing..." : "Generate server preview"}
        </button>
      </div>

      {snapshot && (
        <>
          <p className="pm-section-meta">
            Preview of saved, sanitized server data.
            Unsaved changes are not included.
          </p>

          <PortfolioSnapshotPreview snapshot={snapshot} />

          <label className="pm-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={event =>
                setConsent(event.target.checked)
              }
            />

            I have reviewed the preview and consent
            to publishing this Portfolio.
          </label>
        </>
      )}

      <div className="pm-actions">
        <button
          type="button"
          className="pm-button pm-primary"
          disabled={
            !PUBLICATION_ENABLED ||
            saving ||
            loading ||
            !snapshot ||
            !consent ||
            !state?.primaryRoute
          }
          onClick={() => mutate("publish")}
        >
          {published ? "Republish Portfolio" : "Publish Portfolio"}
        </button>

        {published && (
          <button
            type="button"
            className="pm-button pm-danger"
            disabled={
              !PUBLICATION_ENABLED ||
              saving ||
              loading
            }
            onClick={() => mutate("unpublish")}
          >
            Unpublish
          </button>
        )}
      </div>
    </section>
  );
}
