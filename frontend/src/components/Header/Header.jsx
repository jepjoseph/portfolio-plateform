import { useAuth } from "../../context/AuthContext";

import PublicNavigation from "../PublicNavigation/PublicNavigation";

import "./Header.css";

/*
 * =========================================
 * User Presentation
 * =========================================
 */

function getUserDisplayName(user) {
  const configuredName = user?.displayName || user?.fullName || user?.name;

  if (typeof configuredName === "string" && configuredName.trim()) {
    return configuredName.trim();
  }

  if (typeof user?.email === "string" && user.email.trim()) {
    return user.email.trim();
  }

  return "My Account";
}

function getUserInitials(user) {
  const displayName = getUserDisplayName(user);

  if (displayName.includes("@")) {
    return (
      displayName
        .split("@")[0]
        .split(/[._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "U"
    );
  }

  return (
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

function getUserRole(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return "Portfolio Owner";
  }

  if (roles.includes("admin")) {
    return "Administrator";
  }

  return roles
    .map((role) => role.charAt(0).toUpperCase() + role.slice(1))
    .join(", ");
}

/*
 * =========================================
 * Dashboard Header
 * =========================================
 */

function Header({ onMenuClick }) {
  const { user, roles } = useAuth();

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const roleLabel = getUserRole(roles);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button
          type="button"
          className="header-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          title="Open navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <NavBrand />
      </div>

      <div className="header-center">
        <PublicNavigation variant="header" />
      </div>

      <div className="header-right">
        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          🔔
        </button>

        <div className="header-profile">
          <div className="header-avatar" aria-hidden="true">
            {initials}
          </div>

          <div className="header-user">
            <span className="header-user-name">{displayName}</span>

            <span className="header-user-role">{roleLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/*
 * Header branding replaces the previous
 * hardcoded "Dashboard" heading.
 */

function NavBrand() {
  return (
    <div className="header-brand">
      <span className="header-brand-name">PortAncest</span>

      <span className="header-brand-subtitle">Portfolio Platform</span>
    </div>
  );
}

export default Header;
