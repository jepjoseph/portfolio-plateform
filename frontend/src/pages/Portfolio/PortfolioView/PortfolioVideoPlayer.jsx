import { useEffect, useRef, useState } from "react";
import "./PortfolioVideoPlayer.css";

export default function PortfolioVideoPlayer(props) {
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const supported = typeof document !== "undefined" &&
    document.pictureInPictureEnabled &&
    typeof HTMLVideoElement.prototype.requestPictureInPicture === "function";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const enter = () => setActive(true);
    const leave = () => setActive(false);
    video.addEventListener("enterpictureinpicture", enter);
    video.addEventListener("leavepictureinpicture", leave);
    return () => {
      video.removeEventListener("enterpictureinpicture", enter);
      video.removeEventListener("leavepictureinpicture", leave);
    };
  }, []);

  async function togglePictureInPicture() {
    const video = videoRef.current;
    if (!video) return;
    setMessage("");
    try {
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
        if (video.paused) await video.play();
      }
    } catch {
      setMessage("Picture-in-Picture unavailable. Try the browser video controls.");
    }
  }

  return (
    <div className="portfolio-pip-player">
      <video {...props} ref={videoRef}
        onLoadedMetadata={() => setReady(true)}
        onEmptied={() => setReady(false)}
      />
      {supported && ready && (
        <button type="button" className="portfolio-pip-toggle"
          title={active ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
          aria-label={active ? "Exit Picture-in-Picture" : "Open Picture-in-Picture"}
          aria-pressed={active} onClick={togglePictureInPicture}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="2" y="3" width="20" height="16" rx="2" />
            <rect x="12" y="11" width="8" height="6" fill="currentColor" />
          </svg>
        </button>
      )}
      {message && <span className="portfolio-pip-message" role="status">{message}</span>}
    </div>
  );
}
