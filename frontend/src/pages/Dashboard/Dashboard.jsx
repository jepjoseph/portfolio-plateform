import { useEffect, useMemo, useState } from "react";

import { useProfileData } from "../../context/ProfileDataContext.jsx";
import { useExperienceData } from "../../context/ExperienceDataContext.jsx";
import { useEducationData } from "../../context/EducationDataContext.jsx";
import { useTrainingData } from "../../context/TrainingDataContext.jsx";
import { useSkillData } from "../../context/SkillDataContext.jsx";
import { useCertificationData } from "../../context/CertificationDataContext.jsx";
import { useProjectData } from "../../context/ProjectDataContext.jsx";
import { useResumeData } from "../../context/ResumeDataContext.jsx";
import { usePortfolioDraft } from "../../context/PortfolioDraftContext.jsx";

import { getPublicPortfolio } from "../../services/Portfolio/portfolioService.js";

import WelcomeCard from "./components/WelcomeCard/WelcomeCard";
import Statistics from "./components/Statistics/Statistics";
import ProfileCompletion from "./components/ProfileCompletion/ProfileCompletion";
import QuickActions from "./components/QuickActions/QuickActions";
import PublicPortfolioCard from "./components/PublicPortfolioCard/PublicPortfolioCard";
import RecentActivity from "./components/RecentActivity/RecentActivity";

import "./Dashboard.css";

/*
 * =========================================
 * Primitive Helpers
 * =========================================
 */

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function getTimestamp(value) {
  const timestamp = new Date(value || "").getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getRecordTimestamp(record) {
  return record?.updatedAt || record?.createdAt || "";
}

function isRecordArchived(record) {
  return record?.recordStatus === "archived" || record?.status === "archived";
}

function getSelectedRecordIds(values) {
  return [
    ...new Set(
      getArray(values)
        .map((value) =>
          typeof value === "string" ? getText(value) : getText(value?.id),
        )
        .filter(Boolean),
    ),
  ];
}

function createInitials(firstName, lastName) {
  const firstInitial = getText(firstName).slice(0, 1);

  const lastInitial = getText(lastName).slice(0, 1);

  return `${firstInitial}${lastInitial}`.toUpperCase() || "JP";
}

/*
 * =========================================
 * Activity Creation
 * =========================================
 */

function createRecordActivities(records, { type, label, path, icon, getName }) {
  return getArray(records)
    .filter((record) => getRecordTimestamp(record))
    .map((record, index) => {
      const name = getText(getName?.(record)) || `${label} record`;

      const archived = isRecordArchived(record);

      const createdTimestamp = getTimestamp(record?.createdAt);

      const updatedTimestamp = getTimestamp(record?.updatedAt);

      const wasCreated =
        createdTimestamp > 0 &&
        Math.abs(updatedTimestamp - createdTimestamp) < 2000;

      return {
        id: `${type}-${record?.id || index}`,

        type,

        icon,

        path,

        title: archived
          ? `${label} archived`
          : wasCreated
            ? `${label} added`
            : `${label} updated`,

        description: archived
          ? `${name} was moved to the archive.`
          : wasCreated
            ? `${name} was added to your professional records.`
            : `${name} was recently updated.`,

        timestamp: getRecordTimestamp(record),
      };
    });
}

/*
 * =========================================
 * Dashboard
 * =========================================
 */

function Dashboard() {
  const {
    profile,
    activeCollections,
    statistics: profileStatistics,
    isLoading: isProfileLoading,
  } = useProfileData();

  const {
    experiences,
    activeExperiences,
    isLoading: areExperiencesLoading,
  } = useExperienceData();

  const {
    educationRecords,
    activeEducationRecords,
    isLoading: isEducationLoading,
  } = useEducationData();

  const {
    trainingRecords,
    activeTrainingRecords,
    isLoading: isTrainingLoading,
  } = useTrainingData();

  const { skills, activeSkills, isLoading: areSkillsLoading } = useSkillData();

  const {
    certifications,
    activeCertifications,
    isLoading: areCertificationsLoading,
  } = useCertificationData();

  const { projects, isLoading: areProjectsLoading } = useProjectData();

  const { savedResumes, portfolioResumes, sharedResumes } = useResumeData();

  const { portfolioDraft } = usePortfolioDraft();

  const [publishedPortfolio, setPublishedPortfolio] = useState(null);

  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);

  /*
   * =========================================
   * Profile Identity
   * =========================================
   */

  const firstName = getText(profile?.firstName);

  const middleName = getText(profile?.middleName);

  const lastName = getText(profile?.lastName);

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const initials = createInitials(firstName, lastName);

  const primaryProfessionalTitle =
    activeCollections?.professionalTitles?.find((title) => title.isPrimary) ||
    activeCollections?.professionalTitles?.[0] ||
    null;

  const primaryLocation =
    activeCollections?.locations?.find((location) => location.isPrimary) ||
    activeCollections?.locations?.[0] ||
    null;

  const profilePicture =
    activeCollections?.profilePictures?.find((picture) => picture.isPrimary) ||
    activeCollections?.profilePictures?.find((picture) =>
      ["profile", "headshot", "avatar"].includes(picture.type),
    ) ||
    activeCollections?.profilePictures?.[0] ||
    null;

  const profileImageUrl =
    profilePicture?.imageUrl ||
    profilePicture?.fileUrl ||
    profilePicture?.externalUrl ||
    profilePicture?.url ||
    "";

  /*
   * =========================================
   * Active Project Collection
   * =========================================
   */

  const activeProjects = useMemo(
    () =>
      getArray(projects).filter(
        (project) => project.recordStatus !== "archived",
      ),
    [projects],
  );

  /*
   * =========================================
   * Portfolio Information
   * =========================================
   */

  const portfolioUsername = getText(portfolioDraft?.username);

  const portfolioSlug = getText(portfolioDraft?.slug);

  const isPortfolioPublished = portfolioDraft?.isPublished === true;

  const selectedProjectIds = useMemo(
    () => getSelectedRecordIds(portfolioDraft?.projects),
    [portfolioDraft?.projects],
  );

  useEffect(() => {
    let isActive = true;

    if (!isPortfolioPublished || !portfolioUsername || !portfolioSlug) {
      setPublishedPortfolio(null);
      setIsPortfolioLoading(false);

      return undefined;
    }

    setIsPortfolioLoading(true);

    getPublicPortfolio(portfolioUsername, portfolioSlug)
      .then((portfolio) => {
        if (isActive) {
          setPublishedPortfolio(portfolio);
        }
      })
      .catch(() => {
        if (isActive) {
          setPublishedPortfolio(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsPortfolioLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isPortfolioPublished, portfolioUsername, portfolioSlug]);

  /*
   * =========================================
   * Combined Loading State
   * =========================================
   */

  const isDashboardLoading =
    isProfileLoading ||
    areExperiencesLoading ||
    isEducationLoading ||
    isTrainingLoading ||
    areSkillsLoading ||
    areCertificationsLoading ||
    areProjectsLoading;

  /*
   * =========================================
   * Completion Requirements
   * =========================================
   */

  const completionRequirements = useMemo(
    () => [
      {
        id: "identity",
        label: "Professional identity",
        description: "Add your full name and at least one professional title.",
        href: "/profile",
        completed: Boolean(
          firstName &&
          lastName &&
          activeCollections?.professionalTitles?.length,
        ),
      },
      {
        id: "contact",
        label: "Contact information",
        description: "Add an email address or professional phone number.",
        href: "/profile",
        completed: Boolean(
          activeCollections?.emails?.length ||
          activeCollections?.phones?.length,
        ),
      },
      {
        id: "picture",
        label: "Professional picture",
        description: "Add a professional profile or headshot image.",
        href: "/profile",
        completed: Boolean(activeCollections?.profilePictures?.length),
      },
      {
        id: "experience",
        label: "Professional experience",
        description: "Add at least one active Experience record.",
        href: "/experience",
        completed: activeExperiences.length > 0,
      },
      {
        id: "education",
        label: "Education history",
        description: "Add at least one Education record.",
        href: "/education",
        completed: activeEducationRecords.length > 0,
      },
      {
        id: "skills",
        label: "Professional skills",
        description: "Add skills that demonstrate your capabilities.",
        href: "/skills",
        completed: activeSkills.length >= 3,
      },
      {
        id: "project",
        label: "Portfolio project",
        description: "Add at least one professional Project case study.",
        href: "/projects",
        completed: activeProjects.length > 0,
      },
      {
        id: "resume",
        label: "Professional résumé",
        description: "Create at least one saved résumé.",
        href: "/resumes",
        completed: savedResumes.length > 0,
      },
      {
        id: "portfolio",
        label: "Published portfolio",
        description: "Publish a shareable professional portfolio.",
        href: "/portfolio",
        completed: Boolean(isPortfolioPublished && publishedPortfolio),
      },
    ],
    [
      firstName,
      lastName,
      activeCollections,
      activeExperiences.length,
      activeEducationRecords.length,
      activeSkills.length,
      activeProjects.length,
      savedResumes.length,
      isPortfolioPublished,
      publishedPortfolio,
    ],
  );

  const completedItems = completionRequirements.filter(
    (requirement) => requirement.completed,
  );

  const remainingItems = completionRequirements.filter(
    (requirement) => !requirement.completed,
  );

  const completionPercentage =
    completionRequirements.length > 0
      ? Math.round(
          (completedItems.length / completionRequirements.length) * 100,
        )
      : 0;

  /*
   * =========================================
   * Statistics
   * =========================================
   */

  const dashboardStatistics = useMemo(
    () => [
      {
        id: "profile",
        label: "Profile",
        value: `${completionPercentage}%`,
        icon: "◎",
        description: `${profileStatistics?.activeItems || 0} active profile items`,
        status: completionPercentage === 100 ? "Ready" : "In Progress",
        href: "/profile",
        tone: completionPercentage === 100 ? "success" : "information",
        isLoading: isProfileLoading,
      },
      {
        id: "experience",
        label: "Experience",
        value: activeExperiences.length,
        icon: "◷",
        description: "Professional roles and work history",
        href: "/experience",
        tone: "information",
        isLoading: areExperiencesLoading,
      },
      {
        id: "education",
        label: "Education",
        value: activeEducationRecords.length,
        icon: "◇",
        description: "Degrees, programs, and academic records",
        href: "/education",
        isLoading: isEducationLoading,
      },
      {
        id: "training",
        label: "Training",
        value: activeTrainingRecords.length,
        icon: "△",
        description: "Courses and professional development",
        href: "/training",
        tone: "warning",
        isLoading: isTrainingLoading,
      },
      {
        id: "skills",
        label: "Skills",
        value: activeSkills.length,
        icon: "✦",
        description: "Technical and professional capabilities",
        href: "/skills",
        tone: "success",
        isLoading: areSkillsLoading,
      },
      {
        id: "certifications",
        label: "Certifications",
        value: activeCertifications.length,
        icon: "◆",
        description: "Professional credentials and evidence",
        href: "/certifications",
        tone: "resume",
        isLoading: areCertificationsLoading,
      },
      {
        id: "projects",
        label: "Projects",
        value: activeProjects.length,
        icon: "◈",
        description: "Professional portfolio case studies",
        href: "/projects",
        status: `${selectedProjectIds.length} Selected`,
        isLoading: areProjectsLoading,
      },
      {
        id: "resumes",
        label: "Résumés",
        value: savedResumes.length,
        icon: "CV",
        description: `${sharedResumes.length} shared online`,
        href: "/resumes",
        status: `${portfolioResumes.length} Featured`,
        tone: "resume",
      },
    ],
    [
      completionPercentage,
      profileStatistics,
      activeExperiences.length,
      activeEducationRecords.length,
      activeTrainingRecords.length,
      activeSkills.length,
      activeCertifications.length,
      activeProjects.length,
      selectedProjectIds.length,
      savedResumes.length,
      sharedResumes.length,
      portfolioResumes.length,
      isProfileLoading,
      areExperiencesLoading,
      isEducationLoading,
      isTrainingLoading,
      areSkillsLoading,
      areCertificationsLoading,
      areProjectsLoading,
    ],
  );

  /*
   * =========================================
   * Quick Actions
   * =========================================
   */

  const quickActions = [
    {
      id: "profile",
      label: "Update Profile",
      description: "Manage identity, contact details, and pictures.",
      icon: "◎",
      path: "/profile",
      tone: "information",
    },
    {
      id: "experience",
      label: "Manage Experience",
      description: "Add and update professional work records.",
      icon: "◷",
      path: "/experience",
    },
    {
      id: "skills",
      label: "Manage Skills",
      description: "Organize technical and professional capabilities.",
      icon: "✦",
      path: "/skills",
      tone: "success",
    },
    {
      id: "projects",
      label: "Manage Projects",
      description: "Build professional case studies and evidence.",
      icon: "◈",
      path: "/projects",
      badge: "Portfolio",
    },
    {
      id: "certifications",
      label: "Add Credentials",
      description: "Manage certifications and supporting documents.",
      icon: "◆",
      path: "/certifications",
      tone: "warning",
    },
    {
      id: "resumes",
      label: "Build Résumé",
      description: "Create and manage targeted résumés.",
      icon: "CV",
      path: "/resumes",
      badge: "Career",
      tone: "resume",
    },
    {
      id: "portfolio",
      label: "Edit Portfolio",
      description: "Select professional records and publish your work.",
      icon: "▣",
      path: "/portfolio",
      badge: isPortfolioPublished ? "Published" : "Draft",
    },
    {
      id: "training",
      label: "Manage Training",
      description: "Track courses and professional development.",
      icon: "△",
      path: "/training",
      tone: "information",
    },
  ];

  /*
   * =========================================
   * Recent Activity
   * =========================================
   */

  const recentActivities = useMemo(() => {
    const activities = [
      ...createRecordActivities(experiences, {
        type: "experience",
        label: "Experience",
        path: "/experience",
        icon: "◷",
        getName: (experience) =>
          experience?.position?.title ||
          experience?.jobTitle ||
          experience?.title,
      }),

      ...createRecordActivities(educationRecords, {
        type: "education",
        label: "Education",
        path: "/education",
        icon: "◇",
        getName: (education) =>
          education?.credential?.name || education?.degree || education?.title,
      }),

      ...createRecordActivities(trainingRecords, {
        type: "training",
        label: "Training",
        path: "/training",
        icon: "△",
        getName: (training) => training?.title,
      }),

      ...createRecordActivities(skills, {
        type: "skill",
        label: "Skill",
        path: "/skills",
        icon: "✦",
        getName: (skill) => skill?.name,
      }),

      ...createRecordActivities(certifications, {
        type: "certification",
        label: "Certification",
        path: "/certifications",
        icon: "◆",
        getName: (certification) => certification?.name,
      }),

      ...createRecordActivities(projects, {
        type: "project",
        label: "Project",
        path: "/projects",
        icon: "◈",
        getName: (project) => project?.title,
      }),

      ...createRecordActivities(savedResumes, {
        type: "resume",
        label: "Résumé",
        path: "/resumes",
        icon: "CV",
        getName: (resume) => resume?.resumeName,
      }),
    ];

    if (profile?.updatedAt || profile?.createdAt) {
      activities.push({
        id: "profile-main",
        type: "profile",
        icon: "◎",
        path: "/profile",
        title: "Profile updated",
        description: "Your professional identity information was updated.",
        timestamp: profile.updatedAt || profile.createdAt,
      });
    }

    if (publishedPortfolio?.updatedAt) {
      activities.push({
        id: "portfolio-published",
        type: "portfolio",
        icon: "▣",
        path: "/portfolio",
        title: "Portfolio published",
        description: "Your public professional portfolio was published.",
        timestamp: publishedPortfolio.updatedAt,
      });
    }

    return activities.sort(
      (firstActivity, secondActivity) =>
        getTimestamp(secondActivity.timestamp) -
        getTimestamp(firstActivity.timestamp),
    );
  }, [
    experiences,
    educationRecords,
    trainingRecords,
    skills,
    certifications,
    projects,
    savedResumes,
    profile,
    publishedPortfolio,
  ]);

  /*
   * =========================================
   * Render
   * =========================================
   */

  return (
    <section className="dashboard-page">
      <WelcomeCard
        firstName={firstName}
        fullName={fullName}
        initials={initials}
        professionalTitle={primaryProfessionalTitle?.name || ""}
        location={primaryLocation?.value || ""}
        profileImageUrl={profileImageUrl}
        isProfileComplete={completionPercentage === 100}
      />

      <Statistics
        statistics={dashboardStatistics}
        isLoading={isDashboardLoading}
      />

      <div className="dashboard-grid">
        <ProfileCompletion
          percentage={completionPercentage}
          completedItems={completedItems}
          remainingItems={remainingItems}
          isLoading={isDashboardLoading}
        />

        <QuickActions actions={quickActions} />

        <PublicPortfolioCard
          username={portfolioUsername}
          portfolioSlug={portfolioSlug}
          portfolioName={portfolioDraft?.portfolioName}
          isLive={Boolean(isPortfolioPublished && publishedPortfolio)}
          updatedAt={publishedPortfolio?.updatedAt || portfolioDraft?.updatedAt}
          projectCount={
            publishedPortfolio?.projects?.length ?? selectedProjectIds.length
          }
          resumeCount={portfolioResumes.length}
          isLoading={isPortfolioLoading}
        />

        <RecentActivity
          activities={recentActivities}
          isLoading={isDashboardLoading}
          maximumItems={8}
        />
      </div>
    </section>
  );
}

export default Dashboard;
