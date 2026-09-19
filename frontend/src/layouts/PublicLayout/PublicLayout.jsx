import { Outlet } from "react-router-dom";

import PublicHeader from "../../components/PublicHeader/PublicHeader.jsx";
import PublicFooter from "../../components/PublicFooter/PublicFooter.jsx";

import "./PublicLayout.css";

function PublicLayout() {
  return (
    <div className="public-layout">
      <PublicHeader />

      <main className="public-layout-main">
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}

export default PublicLayout;
