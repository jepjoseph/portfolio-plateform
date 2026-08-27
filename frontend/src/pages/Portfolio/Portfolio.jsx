import { useState } from "react";
import PortfolioPageHeader from "./components/PortfolioPageHeader/PortfolioPageHeader";
import ProfileHeader from "./components/ProfileHeader/ProfileHeader";
import PersonalInformation from "./components/PersonalInformation/PersonalInformation";
import ProfessionalSummary from "./components/ProfessionalSummary/ProfessionalSummary";
import Experience from "./components/Experience/Experience";
import Education from "./components/Education/Education";
import Skills from "./components/Skills/Skills";
import Certifications from "./components/Certifications/Certifications";

import "./Portfolio.css";

function Portfolio() {
  const handlePreview = () => {
    console.log("Preview portfolio");
  };

  const handleSave = () => {
    console.log("Save portfolio");
  };

  const [summary, setSummary] = useState("");

  const experiences = [
    {
      id: "experience-1",
      jobTitle: "Founder",
      company: "MOTICH",
      location: "Coconut Creek, FL",
      startDate: "Fall 2023",
      endDate: "",
      current: true,
      description: "CEO, CTO",
    },
    {
      id: "experience-2",
      jobTitle: "Learning Assistant",
      company: "Florida Atlantic University",
      location: "Boca Raton, FL",
      startDate: "Fall 2025",
      endDate: "Fall 2025",
      current: false,
      description:
        "Support students with Python programming concepts, technical problem-solving, and course-related learning activities.",
    },
    {
      id: "experience-3",
      jobTitle: "Sales Associate",
      company: "The Home Depot",
      location: "Coconut Creek, FL",
      startDate: "August 2023",
      endDate: "january 2025",
      current: false,
      description:
        "Provide customer support and product expertise while assisting customers with lumber and building materials, problem-solving, and department operations.",
    },
  ];

  const education = [
    {
      id: "education-1",
      institution: "Florida Atlantic University",
      degree: "Bachelor of Science",
      field: "Computer Engineering",
      startYear: "2025",
      endYear: "Present",
      description:
        "Second bachelor's degree focused on computer engineering, software development, hardware systems, and embedded technologies.",
    },
    {
      id: "education-2",
      institution: "University Name",
      degree: "Bachelor's Degree",
      field: "Electronic Engineering",
      startYear: "2009",
      endYear: "2015",
      description:
        "Academic foundation in electronics, electrical systems, embedded technology, and engineering principles.",
    },
  ];

  const skills = [
    {
      id: "skill-python",
      name: "Python",
      category: "Programming",
      level: "Advanced",
    },
    {
      id: "skill-java",
      name: "Java",
      category: "Programming",
      level: "Advanced",
    },
    {
      id: "skill-javascript",
      name: "JavaScript",
      category: "Web Development",
      level: "Intermediate",
    },
    {
      id: "skill-react",
      name: "React",
      category: "Web Development",
      level: "Intermediate",
    },
    {
      id: "skill-windows",
      name: "Windows Administration",
      category: "Systems Administration",
      level: "Advanced",
    },
    {
      id: "skill-linux",
      name: "Linux Administration",
      category: "Systems Administration",
      level: "Intermediate",
    },
    {
      id: "skill-networking",
      name: "Network Administration",
      category: "Networking",
      level: "Advanced",
    },
    {
      id: "skill-azure",
      name: "Microsoft Azure",
      category: "Cloud",
      level: "Intermediate",
    },
  ];

  const certifications = [
    {
      id: "cert-1",
      name: "CompTIA A+",
      issuer: "CompTIA",
      date: "2026",
      credentialId: "A+ Certified",
      credentialUrl: "https://www.comptia.org/",
    },
    {
      id: "cert-2",
      name: "AI110 Coding Calibration",
      issuer: "CodePath",
      date: "2026",
      credentialId: "",
      credentialUrl: "",
    },
  ];

  return (
    <section className="portfolio-page">
      {/* =========================================
          Page Header
          ========================================= */}
      <PortfolioPageHeader
        onPreview={handlePreview}
        onSave={handleSave}
        isLive={true}
      />

      {/* =========================================
          Portfolio Editor
          ========================================= */}

      <div className="portfolio-editor">
        {/* Profile Header */}
        <ProfileHeader />

        <PersonalInformation />

        <ProfessionalSummary summary={summary} onChange={setSummary} />

        <Experience experiences={experiences} />

        <Education education={education} />

        <Skills skills={skills} />

        <Certifications certifications={certifications}/>
      </div>
    </section>
  );
}

export default Portfolio;
