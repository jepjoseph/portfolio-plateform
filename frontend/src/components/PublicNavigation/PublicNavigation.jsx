import { NavLink } from "react-router-dom";

import { publicNavigationItems } from "../../config/navigationConfig";

import "./PublicNavigation.css";

function PublicNavigation({ variant = "header", onNavigate }) {
  return (
    <nav
      className={`public-navigation public-navigation-${variant}`}
      aria-label="Public website navigation"
    >
      {publicNavigationItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          onClick={(event) => {
            onNavigate?.(event, item);
          }}
          className={({ isActive }) =>
            ["public-navigation-link", isActive ? "active" : ""]
              .filter(Boolean)
              .join(" ")
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default PublicNavigation;
