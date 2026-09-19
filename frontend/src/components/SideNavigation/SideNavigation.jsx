import { NavLink } from "react-router-dom";

import { workspaceNavigationItems } from "../../config/navigationConfig";

import "./SideNavigation.css";

function SideNavigation({ onClose }) {
  return (
    <nav className="workspace-navigation" aria-label="Workspace navigation">
      <p className="sidebar-section-title">Workspace</p>

      {workspaceNavigationItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-link-icon" aria-hidden="true">
            {item.icon}
          </span>

          <span className="sidebar-link-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default SideNavigation;
