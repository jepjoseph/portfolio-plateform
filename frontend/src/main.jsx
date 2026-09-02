import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { ProfileDataProvider } from "./context/ProfileDataContext";
import { PortfolioDraftProvider } from "./context/PortfolioDraftContext";
import { ResumeDataProvider } from "./context/ResumeDataContext";

import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ProfileDataProvider>
        <PortfolioDraftProvider>
          <ResumeDataProvider>
            <App />
          </ResumeDataProvider>
        </PortfolioDraftProvider>
      </ProfileDataProvider>
    </BrowserRouter>
  </StrictMode>,
);
