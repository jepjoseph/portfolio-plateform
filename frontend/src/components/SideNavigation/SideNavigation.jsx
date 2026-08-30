import { NavLink } from "react-router-dom";

const sideNavigation = [
  { label: "Dashboard", path: "/", icon: "⌂" },
  { label: "Profile", path: "/profile", icon: "👤" },
  { label: "Projects", path: "/projects", icon: "▣" },
  { label: "Experience", path: "/experience", icon: "◷" },
  { label: "Education", path: "/education", icon: "◇" },
  { label: "Skills", path: "/skills", icon: "✦" },
  { label: "My Portfolio", path: "/portfolio", icon: "◈" },
  { label: "Resumes", path: "/resumes", icon: "📋" },
];

function SideNavigation({ onClose }) {
  return (
    <nav className="sidebar-navigation">
      <p className="sidebar-section-title">Workspace</p>

      {sideNavigation.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-link-icon">{item.icon}</span>
          <span className="sidebar-link-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default SideNavigation;