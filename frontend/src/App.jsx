import { useRoutes } from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout/DashboardLayout";

import Dashboard from "./pages/Dashboard/Dashboard";
import Portfolio from "./pages/Portfolio/Portfolio";
import Projects from "./pages/Projects/Projects";
import Experience from "./pages/Experience/Experience";
import Education from "./pages/Education/Education";
import Skills from "./pages/skills/Skills";
import Resumes from "./pages/Resumes/Resumes";
import Profile from "./pages/Profile/Profile";

function App() {
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

    // Public portfolio will be added here later.
  ]);

  return routes;
}

export default App;
