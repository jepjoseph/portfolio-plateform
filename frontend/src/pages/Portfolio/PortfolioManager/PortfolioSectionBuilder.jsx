import { useEffect, useState } from "react";
import PortfolioSourceSelector from "./PortfolioSourceSelector.jsx";

import {
  PORTFOLIO_SECTIONS,
  moveSection,
  portfolioCompositionService as composition,
} from "../../../services/Portfolio/portfolioCompositionService.js";

export default function PortfolioSectionBuilder({
  portfolioId,
  onSaved,
  onActivityChange,
}) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [itemsDirty, setItemsDirty] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    onActivityChange?.({
      dirty: dirty || itemsDirty,
      busy: loading || saving,
    });
  }, [
    dirty,
    itemsDirty,
    loading,
    saving,
    onActivityChange,
  ]);

  useEffect(() => {
    let active = true;

    composition.load(portfolioId)
      .then(result => {
        if (!active) return;

        setState(result);
        setDirty(false);
        setItemsDirty(false);
      })
      .catch(failure => {
        if (active) {
          setError(failure.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [portfolioId, revision]);

  const toggle = sectionKey => {
    setState(current => ({
      ...current,
      sections: current.sections.map(section =>
        section.sectionKey === sectionKey
          ? {
              ...section,
              isVisible: !section.isVisible,
            }
          : section,
      ),
    }));

    setDirty(true);
    setMessage("");
  };

  const move = (index, direction) => {
    setState(current => ({
      ...current,
      sections: moveSection(
        current.sections,
        index,
        direction,
      ),
    }));

    setDirty(true);
    setMessage("");
  };

  const reload = () => {
    if (
      (dirty || itemsDirty) &&
      !window.confirm("Discard unsaved section changes?")
    ) {
      return;
    }

    setState(null);
    setLoading(true);
    setError("");
    setMessage("");
    setRevision(current => current + 1);
  };

  const changeItems = items => {
    setState(current => ({
      ...current,
      items,
    }));

    setItemsDirty(true);
    setMessage("");
  };

  const save = async () => {
    if (!state || saving || (!dirty && !itemsDirty)) return;

    setSaving(true);
    setError("");
    setMessage("");

    let currentVersion = state.rowVersion;
    let sectionsSaved = false;

    try {
      // Sections must exist before linking source records.
      if (dirty || itemsDirty) {
        const result = await composition.saveSections(
          portfolioId,
          state.sections,
          currentVersion,
        );

        currentVersion = result.rowVersion;
        sectionsSaved = true;

        setState(current => ({
          ...current,
          sections: result.sections,
          rowVersion: currentVersion,
        }));

        setDirty(false);
      }

      if (itemsDirty) {
        const result = await composition.saveItems(
          portfolioId,
          state.items,
          currentVersion,
        );

        currentVersion = result.rowVersion;

        setState(current => ({
          ...current,
          items: result.items,
          rowVersion: currentVersion,
        }));

        setItemsDirty(false);
      }

      setMessage("Portfolio configuration saved.");

      try {
        await onSaved?.();
      } catch {
        setMessage(
          "Configuration saved. Refresh the Portfolio list.",
        );
      }
    } catch (failure) {
      const detail =
        failure.status === 409
          ? "Portfolio changed elsewhere. Reload before retrying."
          : failure.publicMessage || failure.message;

      setError(
        sectionsSaved
          ? `Sections saved, but record selection was not saved. ${detail}`
          : detail,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pm-builder">
      <div className="pm-section-header">
        <h3>Portfolio sections</h3>

        <button
          type="button"
          className="pm-button"
          onClick={reload}
          disabled={loading || saving}
        >
          Reload configuration
        </button>
      </div>

      <p>
        Choose which sections appear in this Portfolio
        and arrange their display order.
      </p>

      {error && (
        <p className="pm-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="pm-message" role="status">
          {message}
        </p>
      )}

      {loading ? (
        <p role="status">Loading section configuration...</p>
      ) : state && (
        <>
          <div className="pm-section-list">
            {state.sections.map((section, index) => {
              const label = PORTFOLIO_SECTIONS.find(
                item => item.key === section.sectionKey,
              )?.label || section.sectionKey;

              const count = state.items.filter(
                item => item.sectionKey === section.sectionKey,
              ).length;

              return (
                <div
                  className="pm-section-row"
                  key={section.sectionKey}
                >
                  <span className="pm-section-number">
                    {index + 1}
                  </span>

                  <label className="pm-section-toggle">
                    <input
                      type="checkbox"
                      checked={section.isVisible}
                      disabled={saving}
                      onChange={() => toggle(section.sectionKey)}
                    />

                    <strong>{label}</strong>
                  </label>

                  <span className="pm-section-meta">
                    {section.isVisible ? "Visible" : "Hidden"}
                    {" · "}
                    {count} linked
                  </span>

                  <div className="pm-order-actions">
                    <button
                      type="button"
                      className="pm-button"
                      aria-label={`Move ${label} up`}
                      disabled={saving || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      Up
                    </button>

                    <button
                      type="button"
                      className="pm-button"
                      aria-label={`Move ${label} down`}
                      disabled={
                        saving ||
                        index === state.sections.length - 1
                      }
                      onClick={() => move(index, 1)}
                    >
                      Down
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="pm-section-meta">
            Hiding a section preserves its linked records.
            Resume publication is not supported yet.
          </p>

          <PortfolioSourceSelector
            items={state.items}
            sections={state.sections}
            disabled={saving}
            onChange={changeItems}
          />

          <div className="pm-actions">
            <button
              type="button"
              className="pm-button pm-primary"
              disabled={saving || (!dirty && !itemsDirty)}
              onClick={save}
            >
              {saving ? "Saving..." : "Save configuration"}
            </button>

            {(dirty || itemsDirty) && <span>Unsaved changes</span>}
          </div>
        </>
      )}
    </div>
  );
}