import WelcomeCard from "./components/WelcomeCard/WelcomeCard";
import Statistics from "./components/Statistics/Statistics";
import ProfileCompletion from "./components/ProfileCompletion/ProfileCompletion";
import QuickActions from "./components/QuickActions/QuickActions";
import PublicPortfolioCard from "./components/PublicPortfolioCard/PublicPortfolioCard";
import RecentActivity from "./components/RecentActivity/RecentActivity";

import "./Dashboard.css";

function Dashboard() {
  const statistics = [
    {
      id: "projects",
      label: "Projects",
      value: 4,
      icon: "◈",
    },
    {
      id: "experience",
      label: "Experience",
      value: 3,
      icon: "◷",
    },
    {
      id: "skills",
      label: "Skills",
      value: 12,
      icon: "✦",
    },
    {
      id: "views",
      label: "Profile Views",
      value: 128,
      icon: "◉",
    },
  ];

  const quickActions = [
    {
      id: "edit-portfolio",
      label: "Edit Portfolio",
      icon: "✎",
      onClick: () => {},
    },
    {
      id: "add-project",
      label: "Add Project",
      icon: "+",
      onClick: () => {},
    },
    {
      id: "add-experience",
      label: "Add Experience",
      icon: "◷",
      onClick: () => {},
    },
  ];

  const completedItems = ["Professional information", "Experience", "Projects"];

  const remainingItems = ["Add professional photo"];

  const activities = [
    {
      id: "activity-1",
      title: "Portfolio created",
      description: "Your professional portfolio was created.",
      time: "Today",
    },
    {
      id: "activity-2",
      title: "Project added",
      description: "A new project was added to your portfolio.",
      time: "Yesterday",
    },
    {
      id: "activity-3",
      title: "Profile updated",
      description: "Your professional information was updated.",
      time: "3 days ago",
    },
  ];

  return (
    <section className="dashboard-page">
      <WelcomeCard firstName="Jean Pierre" initials="JP" />

      <Statistics statistics={statistics} />

      <div className="dashboard-grid">
        <ProfileCompletion
          percentage={75}
          completedItems={completedItems}
          remainingItems={remainingItems}
        />

        <QuickActions actions={quickActions} />

        <PublicPortfolioCard username="jeanjoseph56" />

        <RecentActivity activities={activities} />
      </div>
    </section>
  );
}

export default Dashboard;
