import { useState } from "react";

import ExperienceCard from "../ExperienceCard/ExperienceCard.jsx";

import "./ExperienceList.css";

function ExperienceList({
  experiences = [],
  operation = {},
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const [expandedExperienceId, setExpandedExperienceId] = useState("");

  const handleToggleView = (experienceId) => {
    setExpandedExperienceId((currentId) =>
      currentId === experienceId ? "" : experienceId,
    );
  };

  return (
    <div className="experience-list">
      {experiences.map((experience) => {
        const isWorking =
          operation?.experienceId === experience.id &&
          operation?.status === "loading";

        return (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            isExpanded={expandedExperienceId === experience.id}
            isWorking={isWorking}
            onToggleView={handleToggleView}
            onEdit={onEdit}
            onArchive={onArchive}
            onRestore={onRestore}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}

export default ExperienceList;
