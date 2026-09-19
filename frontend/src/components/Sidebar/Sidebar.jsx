import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import PublicNavigation from "../PublicNavigation/PublicNavigation";
import SideNavigation from "../SideNavigation/SideNavigation";

import "./Sidebar.css";

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

/*
 * =========================================
 * Sidebar
 * =========================================
 */

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [logoutError, setLogoutError] = useState("");

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await logout();

      onClose?.();

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      setLogoutError(
        error?.message || "Sign out could not be completed. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <aside
      className={`sidebar ${isOpen ? "sidebar-open" : ""}`}
      aria-label="Main navigation"
    >
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          P
        </div>

        <div className="brand-text">
          <span className="brand-name">PortAncest</span>

          <span className="brand-subtitle">Portfolio Platform</span>
        </div>

        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          ×
        </button>
      </div>

      <div className="sidebar-scroll-area">
        <section className="sidebar-public-section">
          <p className="sidebar-section-title">Public website</p>

          <PublicNavigation variant="sidebar" onNavigate={onClose} />
        </section>

        <SideNavigation onClose={onClose} />
      </div>

      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-link-icon" aria-hidden="true">
            ⚙
          </span>

          <span className="sidebar-link-label">Settings</span>
        </NavLink>

        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <span className="sidebar-link-icon" aria-hidden="true">
            ↪
          </span>

          <span className="sidebar-link-label">
            {isLoggingOut ? "Signing Out..." : "Log Out"}
          </span>
        </button>

        {logoutError && (
          <p className="sidebar-logout-error" role="alert">
            {logoutError}
          </p>
        )}

        <div className="sidebar-user">
          <div className="sidebar-user-avatar" aria-hidden="true">
            {initials}
          </div>

          <div className="sidebar-user-info">
            <strong title={displayName}>{displayName}</strong>

            <span>My Account</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
