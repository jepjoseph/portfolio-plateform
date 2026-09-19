import { useMemo } from "react";

import { Navigate, useRoutes } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout/PublicLayout";
import AuthLayout from "./layouts/AuthLayout/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout/DashboardLayout";

import GuestRoute from "./routes/GuestRoute";
import ProtectedRoute from "./routes/ProtectedRoute";

import Home from "./pages/Public/Home/Home";
import About from "./pages/Public/About/About";
import HowItWorks from "./pages/Public/HowItWorks/HowItWorks";
import Opportunities from "./pages/Public/Opportunities/Opportunities";
import Support from "./pages/Public/Support/Support";
import Contact from "./pages/Public/Contact/Contact";

import Login from "./pages/Auth/Login/Login";
import LoginVerify from "./pages/Auth/LoginVerify/LoginVerify";
import Register from "./pages/Auth/Register/Register";
import RegisterVerify from "./pages/Auth/RegisterVerify/RegisterVerify";
import SetPassword from "./pages/Auth/SetPassword/SetPassword";

import Dashboard from "./pages/Dashboard/Dashboard";
import Portfolio from "./pages/Portfolio/Portfolio";
import PortfolioPreview from "./pages/Portfolio/PortfolioPreview/PortfolioPreview";
import PublicPortfolio from "./pages/Portfolio/PortfolioPublic/PortfolioPublic";
import Projects from "./pages/Projects/Projects";
import Experience from "./pages/Experience/Experience";
import Education from "./pages/Education/Education";
import Training from "./pages/Training/Training";
import Skills from "./pages/skills/Skills";
import Resumes from "./pages/Resumes/Resumes";
import Profile from "./pages/Profile/Profile";
import Certifications from "./pages/Certifications/Certifications";

import { useSkillData } from "./context/SkillDataContext.jsx";

import { useExperienceData } from "./context/ExperienceDataContext.jsx";

import { useEducationData } from "./context/EducationDataContext.jsx";

import { useTrainingData } from "./context/TrainingDataContext.jsx";

import { useCertificationData } from "./context/CertificationDataContext.jsx";

/*
 * =========================================
 * Projects Route Integration
 * =========================================
 */

function ProjectsRoute() {
  const { skills, isLoading: areSkillsLoading } = useSkillData();

  const { experiences, isLoading: areExperiencesLoading } = useExperienceData();

  const { educationRecords, isLoading: isEducationLoading } =
    useEducationData();

  const { trainingRecords, isLoading: isTrainingLoading } = useTrainingData();

  const { certifications, isLoading: areCertificationsLoading } =
    useCertificationData();

  const relationshipCollections = useMemo(
    () => ({
      skills: Array.isArray(skills) ? skills : [],

      experiences: Array.isArray(experiences) ? experiences : [],

      educationRecords: Array.isArray(educationRecords) ? educationRecords : [],

      trainingRecords: Array.isArray(trainingRecords) ? trainingRecords : [],

      certifications: Array.isArray(certifications) ? certifications : [],

      isLoading:
        areSkillsLoading ||
        areExperiencesLoading ||
        isEducationLoading ||
        isTrainingLoading ||
        areCertificationsLoading,
    }),
    [
      skills,
      experiences,
      educationRecords,
      trainingRecords,
      certifications,
      areSkillsLoading,
      areExperiencesLoading,
      isEducationLoading,
      isTrainingLoading,
      areCertificationsLoading,
    ],
  );

  return <Projects relationshipCollections={relationshipCollections} />;
}

/*
 * =========================================
 * Application
 * =========================================
 */

function App() {
  const routes = useRoutes([
    /*
     * =====================================
     * Public Home
     * =====================================
     */

    {
      path: "/",
      element: <PublicLayout />,

      children: [
        {
          index: true,
          element: <Home />,
        },

        {
          path: "about",
          element: <About />,
        },

        {
          path: "how-it-works",
          element: <HowItWorks />,
        },

        {
          path: "opportunities",
          element: <Opportunities />,
        },

        {
          path: "support",
          element: <Support />,
        },

        {
          path: "contact",
          element: <Contact />,
        },

        /*
         * Future public routes:
         *
         * about
         * how-it-works
         * opportunities
         * support
         * contact
         * privacy
         * terms
         */
      ],
    },

    /*
     * =====================================
     * Authentication Routes
     * =====================================
     */

    {
      element: <GuestRoute />,

      children: [
        {
          path: "auth",

          element: <AuthLayout />,

          children: [
            {
              index: true,

              element: <Navigate to="/auth/login" replace />,
            },

            {
              path: "login",
              element: <Login />,
            },

            {
              path: "login/verify",
              element: <LoginVerify />,
            },

            {
              path: "register",
              element: <Register />,
            },

            {
              path: "register/verify",
              element: <RegisterVerify />,
            },

            {
              path: "set-password",
              element: <SetPassword />,
            },
          ],
        },
      ],
    },

    /*
     * =====================================
     * Protected Application
     * =====================================
     */

    {
      element: <ProtectedRoute />,

      children: [
        {
          element: <DashboardLayout />,

          children: [
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
              element: <ProjectsRoute />,
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
              path: "training",
              element: <Training />,
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

            {
              path: "certifications",
              element: <Certifications />,
            },
          ],
        },

        /*
         * Preview contains private draft
         * information and must be protected,
         * but does not use DashboardLayout.
         */

        {
          path: "portfolio/preview",
          element: <PortfolioPreview />,
        },
      ],
    },

    /*
     * =====================================
     * Public Portfolio
     * =====================================
     */

    {
      path: "/portfolio/:username/:portfolioSlug",

      element: <PublicPortfolio />,
    },
  ]);

  return routes;
}

export default App;
