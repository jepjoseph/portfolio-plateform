import { NavLink } from "react-router-dom";
import SideNavigation from "../SideNavigation/SideNavigation";

import "./Sidebar.css";

function Sidebar({ isOpen, onClose }) {

  return (
    <aside
      className={`sidebar ${isOpen ? "sidebar-open" : ""}`}
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-mark">P</div>

        <div className="brand-text">
          <span className="brand-name">Portify</span>

          <span className="brand-subtitle">Portfolio Platform</span>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          ×
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-navigation">
        <p className="sidebar-section-title">Workspace</p>

        <SideNavigation onClose={onClose} />
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-link-icon">⚙</span>

          <span className="sidebar-link-label">Settings</span>
        </NavLink>

        <button type="button" className="sidebar-link sidebar-logout">
          <span className="sidebar-link-icon">↪</span>

          <span className="sidebar-link-label">Log Out</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">JP</div>

          <div className="sidebar-user-info">
            <strong>Jean Pierre</strong>

            <span>My Account</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
