import { useState } from "react";

export default function PortfolioLinkActions({ routeKey }) {
  const [message, setMessage] = useState("");
  const url = `${window.location.origin}/${routeKey}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch {
      setMessage("Unable to copy automatically. Select and copy the URL above.");
    }
  };

  const shareLink = async () => {
    setMessage("");
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Portfolio", url });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    await copyLink();
  };

  return (
    <div className="pm-link-group">
      <span className="pm-link-address">
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ textDecoration: "underline" }}>{url}</a>
      </span>
      <div className="pm-link-buttons">
        <button type="button" className="pm-button" onClick={copyLink}>Copy link</button>
        <button type="button" className="pm-button" onClick={shareLink}>Share</button>
      </div>
      {message && <small role="status">{message}</small>}
    </div>
  );
}
