import { useEffect, useState } from "react";
import PortfolioLinkActions from "./PortfolioLinkActions.jsx";

import { useAuth } from "../../../context/AuthContext.jsx";

import {
  getProviderUrlPreview,
} from "../../../services/Portfolio/portfolioProviderUrlUtils.js";

import {
  portfolioBackendService as api,
} from "../../../services/Portfolio/portfolioBackendService.js";

// Enable only after authorized live SQL validation.
const URL_MUTATIONS_ENABLED =
  import.meta.env.VITE_PORTFOLIO_PUBLIC_ENABLED === "true";

export default function PortfolioUrlManager({
  portfolioId,
  onSaved,
  externalRevision = 0,
}) {
  const { user, isAuthenticated } = useAuth();

  const providerPreview = getProviderUrlPreview(
    isAuthenticated ? user : null,
  );

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;

    api.getSlugs(portfolioId)
      .then(result => {
        if (!active) return;

        if (
          !Array.isArray(result.slugs) ||
          !result.rowVersion
        ) {
          throw new Error("Invalid URL configuration.");
        }

        setState(result);
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

  const reload = () => {
    setState(null);
    setLoading(true);
    setError("");
    setMessage("");
    setRevision(value => value + 1);
  };

  const mutate = async operation => {
    if (
      !URL_MUTATIONS_ENABLED ||
      saving ||
      !state?.rowVersion
    ) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const latest = await api.getSlugs(portfolioId);

      if (latest.rowVersion !== state.rowVersion) {
        setState(latest);
        throw new Error(
          "Portfolio URLs changed. Review the updated list and retry.",
        );
      }

      const result = await operation(latest.rowVersion);

      if (
        !Array.isArray(result.slugs) ||
        !result.rowVersion
      ) {
        throw new Error(
          "URL operation was not confirmed. Reload.",
        );
      }

      setState(result);
      setSlug("");
      setConsent(false);
      setMessage("Portfolio URLs updated.");

      try {
        await onSaved?.(result.rowVersion);
      } catch {
        setMessage(
          "URLs updated. Refresh the Portfolio list.",
        );
      }
    } catch (failure) {
      setError(
        failure.publicMessage ||
        failure.message ||
        "Unable to update Portfolio URLs.",
      );
    } finally {
      setSaving(false);
    }
  };

  const locked =
    !URL_MUTATIONS_ENABLED ||
    loading ||
    saving ||
    !state;

  const normalizedSlug = slug.trim().toLowerCase();

  const validSlug =
    /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/
      .test(normalizedSlug) &&
    !normalizedSlug.includes("..") &&
    normalizedSlug.length <= 200;

  return (
    <section className="pm-builder">
      <div className="pm-section-header">
        <h3>Portfolio URLs</h3>

        <button
          type="button"
          className="pm-button"
          disabled={loading || saving}
          onClick={reload}
        >
          Reload URLs
        </button>
      </div>

      {!URL_MUTATIONS_ENABLED && (
        <p className="pm-notice">
          URL reservation is prepared but remains disabled
          pending live database validation.
        </p>
      )}

      {error && (
        <p className="pm-error" role="alert">{error}</p>
      )}

      {message && (
        <p role="status">{message}</p>
      )}

      {loading && <p>Loading reserved URLs...</p>}

      {state && (
        <>
          <p>
            {state.slugs.length} of 10 URLs reserved.
            Reserving a URL does not publish your Portfolio.
          </p>

          <div className="pm-url-list">
            {state.slugs.map(item => (
              <article
                className="pm-url-card"
                key={item.id}
              >
                <PortfolioLinkActions routeKey={item.routeKey} />

                <small>
                  {item.routeType}
                  {item.isPrimary ? " - Primary URL" : ""}
                </small>

                <div className="pm-actions">
                  {!item.isPrimary && (
                    <button
                      type="button"
                      className="pm-button"
                      disabled={locked}
                      onClick={() => mutate(version =>
                        api.setPrimarySlug(
                          portfolioId,
                          item.id,
                          version,
                        ),
                      )}
                    >
                      Make primary
                    </button>
                  )}

                  <button
                    type="button"
                    className="pm-button pm-danger"
                    disabled={
                      locked ||
                      (item.isPrimary && state.slugs.length > 1)
                    }
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this reserved Portfolio URL?",
                        )
                      ) {
                        mutate(version =>
                          api.deleteSlug(
                            portfolioId,
                            item.id,
                            version,
                          ),
                        );
                      }
                    }}
                  >
                    Remove URL
                  </button>
                </div>
              </article>
            ))}
          </div>

          <form
            className="pm-url-card"
            onSubmit={event => {
              event.preventDefault();

              if (!validSlug || locked) return;

              mutate(version =>
                api.reserveCustomSlug(
                  portfolioId,
                  normalizedSlug,
                  version,
                ),
              );
            }}
          >
            <h4>Custom URL</h4>

            <label className="pm-field">
              <span>Custom address</span>

              <input
                value={slug}
                maxLength={200}
                placeholder="your-professional-name"
                onChange={event =>
                  setSlug(event.target.value)
                }
              />
            </label>

            <small>
              {window.location.origin}/
              {normalizedSlug || "your-name"}
            </small>

            <button
              className="pm-button pm-primary"
              type="submit"
              disabled={
                locked ||
                !validSlug ||
                state.slugs.length >= 10
              }
            >
              Reserve custom URL
            </button>
          </form>

          <div className="pm-url-card">
            <h4>Email-provider URL</h4>

            <p>
              Supported providers include Gmail, Yahoo,
              iCloud and Outlook.
            </p>

            <p>
              Your email username may become publicly
              visible in the Portfolio address.
            </p>

            <label className="pm-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={event =>
                  setConsent(event.target.checked)
                }
              />

              I consent to using my verified email username
              in my public Portfolio URL.
            </label>

            {consent && (
              <div
                className="pm-notice"
                role="status"
                aria-live="polite"
              >
                {providerPreview.url ? (
                  <>
                    <strong>Proposed public Portfolio URL</strong>

                    <p style={{ overflowWrap: "anywhere" }}>
                      {providerPreview.url}
                    </p>

                    <small>
                      Subject to availability. The final URL may
                      include a numeric suffix.
                    </small>
                  </>
                ) : (
                  <p>{providerPreview.error}</p>
                )}
              </div>
            )}

            <button
              type="button"
              className="pm-button pm-primary"
              disabled={
                locked ||
                !consent ||
                !providerPreview.url ||
                state.slugs.length >= 10
              }
              onClick={() => mutate(version =>
                api.reserveProviderSlug(
                  portfolioId,
                  consent,
                  version,
                ),
              )}
            >
              Reserve provider URL
            </button>
          </div>
        </>
      )}
    </section>
  );
}
