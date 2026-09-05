import { useEffect, useState } from "react";

import "./PortfolioNavigation.css";

function getInitials(name) {
  if (!name) {
    return "P";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function PortfolioNavigation({
  portfolio,
  selectedName = "",
  mode = "public",
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    summary = "",
    experiences = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    sectionVisibility = {},
  } = portfolio;

  const isVisible = (sectionName) => sectionVisibility[sectionName] !== false;

  const links = [
    {
      id: "about",
      label: "About",
      visible: isVisible("summary") && Boolean(summary),
    },
    {
      id: "experience",
      label: "Experience",
      visible: isVisible("experience") && experiences.length > 0,
    },
    {
      id: "skills",
      label: "Skills",
      visible: isVisible("skills") && skills.length > 0,
    },
    {
      id: "projects",
      label: "Projects",
      visible: isVisible("projects") && projects.length > 0,
    },
    {
      id: "education",
      label: "Education",
      visible: isVisible("education") && education.length > 0,
    },
    {
      id: "certifications",
      label: "Certifications",
      visible: isVisible("certifications") && certifications.length > 0,
    },
    {
      id: "resume",
      label: "Résumé",
      visible: Boolean(portfolio.heroSettings?.featuredResumeId),
    },
    {
      id: "contact",
      label: "Contact",
      visible: true,
    },
  ].filter((link) => link.visible);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleNavigation = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`portfolio-navigation portfolio-navigation--${mode}`}>
      <a
        href="#top"
        className="portfolio-navigation-brand"
        onClick={handleNavigation}
        aria-label="Go to portfolio introduction"
      >
        <span aria-hidden="true">{getInitials(selectedName)}</span>

        <strong>{selectedName || "Portfolio"}</strong>
      </a>

      <button
        type="button"
        className="portfolio-navigation-toggle"
        aria-expanded={isMenuOpen}
        aria-controls="portfolio-navigation-links"
        aria-label={
          isMenuOpen
            ? "Close portfolio navigation"
            : "Open portfolio navigation"
        }
        onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav
        id="portfolio-navigation-links"
        className={`portfolio-navigation-links ${
          isMenuOpen ? "portfolio-navigation-links--open" : ""
        }`}
        aria-label="Portfolio sections"
      >
        {links.map((link) => (
          <a key={link.id} href={`#${link.id}`} onClick={handleNavigation}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export default PortfolioNavigation;
