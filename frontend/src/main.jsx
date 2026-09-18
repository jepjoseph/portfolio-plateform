import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { AuthProvider } from "./context/AuthContext.jsx";

import { ProfileDataProvider } from "./context/ProfileDataContext.jsx";

import { PortfolioDraftProvider } from "./context/PortfolioDraftContext.jsx";

import { ResumeDataProvider } from "./context/ResumeDataContext.jsx";

import { ExperienceDataProvider } from "./context/ExperienceDataContext.jsx";

import { SkillDataProvider } from "./context/SkillDataContext.jsx";

import { EducationDataProvider } from "./context/EducationDataContext.jsx";

import { TrainingDataProvider } from "./context/TrainingDataContext.jsx";

import { CertificationDataProvider } from "./context/CertificationDataContext.jsx";

import { ProjectDataProvider } from "./context/ProjectDataContext.jsx";

import "./styles/global.css";

/*
 * =========================================
 * Application Root
 * =========================================
 */

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {/*
       * Authentication is outside the current
       * platform-data providers so identity
       * can eventually determine whether
       * private data providers should mount.
       */}

      <AuthProvider>
        {/*
         * These existing providers remain in
         * their original order for now. This
         * prevents current pages and context
         * dependencies from breaking.
         */}

        <ProfileDataProvider>
          <SkillDataProvider>
            <PortfolioDraftProvider>
              <ResumeDataProvider>
                <ExperienceDataProvider>
                  <EducationDataProvider>
                    <TrainingDataProvider>
                      <CertificationDataProvider>
                        <ProjectDataProvider>
                          <App />
                        </ProjectDataProvider>
                      </CertificationDataProvider>
                    </TrainingDataProvider>
                  </EducationDataProvider>
                </ExperienceDataProvider>
              </ResumeDataProvider>
            </PortfolioDraftProvider>
          </SkillDataProvider>
        </ProfileDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
