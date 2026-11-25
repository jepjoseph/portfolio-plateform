import PortfolioVideoPlayer from "./PortfolioVideoPlayer.jsx";
import { useEffect, useState } from "react";

import {
  resolveProjectAssetUrl,
  releaseProjectAssetUrl,
} from "../../../services/Project/projectAssetResolver.js";

import "./PortfolioProjectAssets.css";

function safeAssetUrl(value) {
  if (typeof value !== "string" || !value) return "";

  try {
    const url = new URL(value);

    return ["http:", "https:", "blob:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function useAssetUrl(projectId, asset, kind) {
  const [state, setState] = useState({
    url: "",
    loading: true,
    error: false,
  });

  useEffect(() => {
    let active = true;
    let resolvedUrl = "";

    const controller = new AbortController();

    setState({
      url: "",
      loading: true,
      error: false,
    });

    resolveProjectAssetUrl({
      projectId,
      asset,
      kind,
      signal: controller.signal,
    })
      .then(value => {
        const url = safeAssetUrl(value);

        if (!active) {
          releaseProjectAssetUrl(value);
          return;
        }

        resolvedUrl = value;

        setState({
          url,
          loading: false,
          error: !url,
        });
      })
      .catch(() => {
        if (active) {
          setState({
            url: "",
            loading: false,
            error: true,
          });
        }
      });

    return () => {
      active = false;
      controller.abort();

      releaseProjectAssetUrl(resolvedUrl);
    };
  }, [projectId, asset, kind]);

  return state;
}

function AssetMessage({ loading }) {
  return (
    <p className="ppa-message" role="status">
      {loading
        ? "Loading file..."
        : "This file is currently unavailable."}
    </p>
  );
}

function ProjectMediaItem({ projectId, asset }) {
  const { url, loading, error } =
    useAssetUrl(projectId, asset, "media");

  const [failed, setFailed] = useState(false);

  const isVideo =
    asset.type === "video" ||
    asset.mimeType?.startsWith("video/");

  const isImage =
    asset.type === "image" ||
    asset.mimeType?.startsWith("image/");

  const title =
    asset.name ||
    asset.caption ||
    (isVideo ? "Project video" : "Project image");

  return (
    <figure className="ppa-media-card">
      <div className="ppa-media-content">
        {loading || error || failed ? (
          <AssetMessage loading={loading} />
        ) : isVideo ? (
          <PortfolioVideoPlayer
            src={url}
            controls
            playsInline
            preload="metadata"
            aria-label={title}
            onError={() => setFailed(true)}
          />
        ) : isImage ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View full image: ${title}`}
          >
            <img
              src={url}
              alt={asset.altText || title}
              loading="lazy"
              onError={() => setFailed(true)}
            />
          </a>
        ) : (
          <a
            className="ppd-button"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Media
          </a>
        )}
      </div>

      <figcaption>
        <strong>{title}</strong>

        {asset.isFeatured && (
          <span className="ppa-featured">Featured</span>
        )}

        {asset.caption && asset.caption !== title && (
          <p>{asset.caption}</p>
        )}
      </figcaption>
    </figure>
  );
}

export function PortfolioProjectMedia({ project }) {
  const media = Array.isArray(project.media)
    ? project.media
    : [];

  if (!media.length) return null;

  const ordered = [...media].sort(
    (a, b) =>
      Number(Boolean(b.isFeatured)) -
      Number(Boolean(a.isFeatured))
  );

  return (
    <section className="portfolio-view-section ppa-section">
      <header className="portfolio-view-section-header">
        <h2>Project Media</h2>
        <p>Images, screenshots and videos</p>
      </header>

      <div className="ppa-gallery">
        {ordered.map(asset => (
          <ProjectMediaItem
            key={asset.id}
            projectId={project.id}
            asset={asset}
          />
        ))}
      </div>
    </section>
  );
}

function ProjectDocumentItem({ projectId, asset, allowDownload }) {
  const { url, loading, error } =
    useAssetUrl(projectId, asset, "document");

  const name =
    asset.name ||
    asset.fileName ||
    asset.title ||
    "Supporting document";

  const fileName =
    asset.fileName ||
    asset.name ||
    "project-document";

  const isPdf =
    asset.mimeType === "application/pdf" ||
    /\.pdf$/i.test(fileName);

  const isImage =
    asset.mimeType?.startsWith("image/");

  const canPreview = isPdf || isImage;

  return (
    <article className="ppa-document">
      <div className="ppa-document-icon" aria-hidden="true">
        {isPdf ? "PDF" : "FILE"}
      </div>

      <div className="ppa-document-info">
        <h3>{name}</h3>

        {asset.description && (
          <p>{asset.description}</p>
        )}

        {asset.mimeType && (
          <small>{asset.mimeType}</small>
        )}

        {(loading || error) && (
          <AssetMessage loading={loading} />
        )}
      </div>

      {url && !error && (
        <div className="ppa-document-actions">
          {canPreview && (
            <a
              className="ppd-button"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview
            </a>
          )}

          {allowDownload && (url.startsWith("blob:") ? (
            <a
              className="ppd-button"
              href={url}
              download={fileName}
            >
              Download
            </a>
          ) : (
            <a
              className="ppd-button"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open File
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

export function PortfolioProjectDocuments({ project }) {
  const documents = Array.isArray(project.supportingDocuments)
    ? project.supportingDocuments
    : [];

  if (!documents.length) return null;

  return (
    <section className="portfolio-view-section ppa-section">
      <header className="portfolio-view-section-header">
        <h2>Supporting Documents</h2>
        <p>Project documentation and supporting materials</p>
      </header>

      <div className="ppa-documents">
        {documents.map(asset => (
          <ProjectDocumentItem
            allowDownload={project.displaySettings?.documents.allowDownload !== false}
            key={asset.id}
            projectId={project.id}
            asset={asset}
          />
        ))}
      </div>
    </section>
  );
}
