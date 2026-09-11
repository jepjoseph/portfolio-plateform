/*
 * =========================================
 * Employment Types
 * =========================================
 */

export const EMPLOYMENT_TYPE_OPTIONS = [
  {
    value: "full-time",
    label: "Full-time",
  },
  {
    value: "part-time",
    label: "Part-time",
  },
  {
    value: "contract",
    label: "Contract",
  },
  {
    value: "temporary",
    label: "Temporary",
  },
  {
    value: "internship",
    label: "Internship",
  },
  {
    value: "apprenticeship",
    label: "Apprenticeship",
  },
  {
    value: "freelance",
    label: "Freelance",
  },
  {
    value: "self-employed",
    label: "Self-employed",
  },
  {
    value: "volunteer",
    label: "Volunteer",
  },
  {
    value: "seasonal",
    label: "Seasonal",
  },
  {
    value: "other",
    label: "Other",
  },
];

/*
 * =========================================
 * Work Arrangements
 * =========================================
 */

export const WORK_ARRANGEMENT_OPTIONS = [
  {
    value: "on-site",
    label: "On-site",
  },
  {
    value: "remote",
    label: "Remote",
  },
  {
    value: "hybrid",
    label: "Hybrid",
  },
  {
    value: "field-based",
    label: "Field-based",
  },
  {
    value: "travel-based",
    label: "Travel-based",
  },
  {
    value: "other",
    label: "Other",
  },
];

/*
 * =========================================
 * Experience Categories
 * =========================================
 */

export const EXPERIENCE_CATEGORY_OPTIONS = [
  {
    value: "employment",
    label: "Employment",
    description: "A paid position with an employer.",
  },
  {
    value: "internship",
    label: "Internship",
    description: "A professional internship or cooperative experience.",
  },
  {
    value: "freelance",
    label: "Freelance",
    description: "Independent work completed for one or more clients.",
  },
  {
    value: "self-employment",
    label: "Self-employment",
    description: "Professional work completed through your own business.",
  },
  {
    value: "volunteer",
    label: "Volunteer",
    description: "Unpaid professional or community service.",
  },
  {
    value: "leadership",
    label: "Leadership",
    description: "A leadership position in an organization or program.",
  },
  {
    value: "research",
    label: "Research",
    description: "Academic, scientific, or industry research experience.",
  },
  {
    value: "teaching",
    label: "Teaching or Mentoring",
    description: "Teaching, tutoring, training, or mentoring experience.",
  },
  {
    value: "military",
    label: "Military Service",
    description: "Military or public service experience.",
  },
  {
    value: "other",
    label: "Other Experience",
    description: "Another form of relevant professional experience.",
  },
];

/*
 * =========================================
 * Record Status
 * =========================================
 */

export const EXPERIENCE_STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
    description: "Available for use in résumés and portfolios.",
  },
  {
    value: "archived",
    label: "Archived",
    description: "Retained but hidden from normal selection lists.",
  },
];

/*
 * =========================================
 * Proficiency or Usage Levels
 * =========================================
 */

export const EXPERIENCE_SKILL_LEVEL_OPTIONS = [
  {
    value: "",
    label: "Not specified",
  },
  {
    value: "foundational",
    label: "Foundational",
  },
  {
    value: "intermediate",
    label: "Intermediate",
  },
  {
    value: "advanced",
    label: "Advanced",
  },
];

/*
 * =========================================
 * Field Limits
 * =========================================
 *
 * These limits should later be mirrored in
 * backend validation and SQL column sizes.
 */

export const EXPERIENCE_FIELD_LIMITS = {
  positionTitle: 200,
  organizationName: 200,
  organizationWebsite: 500,
  industry: 150,

  city: 120,
  stateRegion: 120,
  country: 120,
  locationDisplayValue: 300,

  overview: 3000,

  responsibilityText: 1500,

  achievementText: 1500,
  achievementMetric: 300,

  skillName: 150,
  skillCategory: 100,
  skillType: 100,
  skillLevel: 50,
  skillUsageDescription: 500,

  technologyName: 150,
  technologyCategory: 100,
  technologyProficiency: 50,
  technologyUsageDescription: 500,

  leadershipDescription: 1500,
  reasonForLeaving: 1000,
  privateNotes: 3000,

  maximumResponsibilities: 30,
  maximumAchievements: 30,
  maximumSkills: 50,
  maximumTechnologies: 50,
  maximumRelatedProjects: 30,
};

/*
 * =========================================
 * Required Fields
 * =========================================
 */

export const EXPERIENCE_REQUIRED_FIELDS = [
  "position.title",
  "organization.name",
  "dates.startDate",
];

/*
 * =========================================
 * Form Sections
 * =========================================
 *
 * The ExperienceForm can use this configuration
 * to organize its interface consistently.
 */

export const EXPERIENCE_FORM_SECTIONS = [
  {
    id: "position",
    number: "01",
    label: "Position",
    title: "Role and Organization",
    description:
      "Enter the position, organization, employment type, and working arrangement.",
  },
  {
    id: "dates-location",
    number: "02",
    label: "Timeline",
    title: "Dates and Location",
    description:
      "Describe when and where this professional experience occurred.",
  },
  {
    id: "overview",
    number: "03",
    label: "Overview",
    title: "Experience Overview",
    description:
      "Provide a concise explanation of the role, its purpose, and its scope.",
  },
  {
    id: "responsibilities",
    number: "04",
    label: "Responsibilities",
    title: "Primary Responsibilities",
    description:
      "Record the important duties and ongoing responsibilities of the role.",
  },
  {
    id: "achievements",
    number: "05",
    label: "Impact",
    title: "Achievements and Results",
    description: "Document meaningful accomplishments and measurable outcomes.",
  },
  {
    id: "skills-tools",
    number: "06",
    label: "Capabilities",
    title: "Skills and Technologies",
    description:
      "Identify the skills, tools, technologies, systems, and methods used.",
  },
  {
    id: "leadership",
    number: "07",
    label: "Leadership",
    title: "Leadership and Collaboration",
    description:
      "Describe team leadership, mentoring, supervision, or collaboration.",
  },
  {
    id: "settings",
    number: "08",
    label: "Management",
    title: "Record Settings",
    description: "Manage visibility, private career notes, and record status.",
  },
];

/*
 * =========================================
 * Option Helpers
 * =========================================
 */

function findOption(options, value) {
  return options.find((option) => option.value === value) || null;
}

export function getEmploymentTypeOption(value) {
  return findOption(EMPLOYMENT_TYPE_OPTIONS, value);
}

export function getEmploymentTypeLabel(value) {
  return getEmploymentTypeOption(value)?.label || "";
}

export function getWorkArrangementOption(value) {
  return findOption(WORK_ARRANGEMENT_OPTIONS, value);
}

export function getWorkArrangementLabel(value) {
  return getWorkArrangementOption(value)?.label || "";
}

export function getExperienceCategoryOption(value) {
  return findOption(EXPERIENCE_CATEGORY_OPTIONS, value);
}

export function getExperienceCategoryLabel(value) {
  return getExperienceCategoryOption(value)?.label || "";
}

export function getExperienceStatusOption(value) {
  return findOption(EXPERIENCE_STATUS_OPTIONS, value);
}

export function getExperienceStatusLabel(value) {
  return getExperienceStatusOption(value)?.label || "";
}

export function isValidEmploymentType(value) {
  return Boolean(getEmploymentTypeOption(value));
}

export function isValidWorkArrangement(value) {
  return Boolean(getWorkArrangementOption(value));
}

export function isValidExperienceCategory(value) {
  return Boolean(getExperienceCategoryOption(value));
}

export function isValidExperienceStatus(value) {
  return Boolean(getExperienceStatusOption(value));
}
