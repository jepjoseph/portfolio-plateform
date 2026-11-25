import PortfolioView from "../PortfolioView/PortfolioView.jsx";
import { adaptPublicSnapshot } from "../../../services/Portfolio/portfolioSnapshotAdapter.js";
export default function PortfolioSnapshotPreview({ snapshot, routeKey = "" }) {
  const portfolio = adaptPublicSnapshot(snapshot);
  if (!portfolio) return <p role="alert">No supported Portfolio snapshot is available.</p>;
  return <PortfolioView portfolio={portfolio} snapshotMode projectRoute={routeKey} />;
}
