import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { ProfileDataProvider } from "./context/ProfileDataContext";
import { PortfolioDraftProvider } from "./context/PortfolioDraftContext";
import { ResumeDataProvider } from "./context/ResumeDataContext";
import { ExperienceDataProvider } from "./context/ExperienceDataContext.jsx";
import { SkillDataProvider } from "./context/SkillDataContext.jsx";
import { EducationDataProvider } from "./context/EducationDataContext.jsx";

import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ProfileDataProvider>
        <SkillDataProvider>
          <PortfolioDraftProvider>
            <ResumeDataProvider>
              <ExperienceDataProvider>
                <EducationDataProvider>
                  <App />
                </EducationDataProvider>
              </ExperienceDataProvider>
            </ResumeDataProvider>
          </PortfolioDraftProvider>
        </SkillDataProvider>
      </ProfileDataProvider>
    </BrowserRouter>
  </StrictMode>,
);
