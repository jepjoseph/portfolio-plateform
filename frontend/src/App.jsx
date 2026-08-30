import { useRoutes } from "react-router-dom";
import { ProfileDataProvider } from "./context/ProfileDataContext";
import { PortfolioDraftProvider } from "./context/PortfolioDraftContext";

import DashboardLayout from "./layouts/DashboardLayout/DashboardLayout";

import Dashboard from "./pages/Dashboard/Dashboard";
import Portfolio from "./pages/Portfolio/Portfolio";
import PortfolioPreview from "./pages/Portfolio/PortfolioPreview/PortfolioPreview";
import PublicPortfolio from "./pages/Portfolio/PortfolioPublic/PortfolioPublic";
import Projects from "./pages/Projects/Projects";
import Experience from "./pages/Experience/Experience";
import Education from "./pages/Education/Education";
import Skills from "./pages/skills/Skills";
import Resumes from "./pages/Resumes/Resumes";
import Profile from "./pages/Profile/Profile";

function App() {
  /*
   * =========================================
   * Private Dashboard Routes
   * =========================================
   */
  const routes = useRoutes([
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {
          index: true,
          element: <Dashboard />,
        },
        {
          path: "dashboard",
          element: <Dashboard />,
        },
        {
          path: "portfolio",
          element: <Portfolio />,
        },
        {
          path: "projects",
          element: <Projects />,
        },
        {
          path: "experience",
          element: <Experience />,
        },
        {
          path: "education",
          element: <Education />,
        },
        {
          path: "skills",
          element: <Skills />,
        },
        {
          path: "resumes",
          element: <Resumes />,
        },
        {
          path: "profile",
          element: <Profile />,
        },
      ],
    },

    /*
     * =========================================
     * Portfolio Preview
     * =========================================
     *
     * This route does not use DashboardLayout.
     * It displays the portfolio like a public page.
     */

    {
      path: "/portfolio/preview",
      element: <PortfolioPreview />,
    },

    /*
     * =========================================
     * Public Portfolio
     * =========================================
     *
     * Example:
     * /portfolio/jean-pierre-joseph/software-engineer
     */

    {
      path: "/portfolio/:username/:portfolioSlug",
      element: <PublicPortfolio />,
    },
  ]);

  return (
    <ProfileDataProvider>
      <PortfolioDraftProvider>{routes}</PortfolioDraftProvider>
    </ProfileDataProvider>
  );
}

export default App;
