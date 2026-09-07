/*
 * =========================================
 * Skill Categories
 * =========================================
 */

export const SKILL_CATEGORY_OPTIONS = [
  {
    value: "programming-languages",
    label: "Programming Languages",
    description:
      "Languages used to develop software, scripts, systems, or applications.",
  },
  {
    value: "software-development",
    label: "Software Development",
    description:
      "Software engineering, architecture, testing, debugging, and development practices.",
  },
  {
    value: "web-development",
    label: "Web Development",
    description:
      "Frontend, backend, full-stack, web API, and browser-based development.",
  },
  {
    value: "mobile-development",
    label: "Mobile Development",
    description: "Mobile application development and related technologies.",
  },
  {
    value: "databases",
    label: "Databases",
    description:
      "Database administration, modeling, querying, and data management.",
  },
  {
    value: "data-ai",
    label: "Data and Artificial Intelligence",
    description:
      "Data analysis, machine learning, artificial intelligence, and automation.",
  },
  {
    value: "cloud-devops",
    label: "Cloud and DevOps",
    description:
      "Cloud platforms, deployment, automation, containers, and delivery pipelines.",
  },
  {
    value: "cybersecurity",
    label: "Cybersecurity",
    description:
      "Security operations, access control, risk management, and system protection.",
  },
  {
    value: "networking",
    label: "Networking",
    description:
      "Network configuration, routing, switching, monitoring, and troubleshooting.",
  },
  {
    value: "it-infrastructure",
    label: "IT Infrastructure",
    description:
      "Servers, operating systems, virtualization, directories, and enterprise systems.",
  },
  {
    value: "hardware-electronics",
    label: "Hardware and Electronics",
    description:
      "Computer hardware, electronics, circuits, equipment, and technical maintenance.",
  },
  {
    value: "embedded-iot",
    label: "Embedded Systems and IoT",
    description:
      "Microcontrollers, sensors, firmware, connected devices, and embedded systems.",
  },
  {
    value: "tools-platforms",
    label: "Tools and Platforms",
    description:
      "Professional software, technical platforms, development tools, and systems.",
  },
  {
    value: "project-management",
    label: "Project Management",
    description:
      "Planning, coordination, delivery, documentation, and project leadership.",
  },
  {
    value: "leadership",
    label: "Leadership",
    description:
      "Team leadership, supervision, mentoring, training, and decision-making.",
  },
  {
    value: "communication",
    label: "Communication",
    description:
      "Written, verbal, technical, interpersonal, and presentation communication.",
  },
  {
    value: "business",
    label: "Business",
    description:
      "Business operations, customer service, sales, finance, and organizational skills.",
  },
  {
    value: "design",
    label: "Design",
    description:
      "Visual design, product design, user experience, drafting, and modeling.",
  },
  {
    value: "research-academic",
    label: "Research and Academic",
    description:
      "Research, instruction, academic methods, laboratory work, and scholarly skills.",
  },
  {
    value: "language",
    label: "Languages",
    description: "Spoken, written, or signed human-language proficiency.",
  },
  {
    value: "industry-knowledge",
    label: "Industry Knowledge",
    description:
      "Specialized knowledge associated with a profession or industry.",
  },
  {
    value: "interpersonal",
    label: "Interpersonal Skills",
    description:
      "Collaboration, adaptability, conflict resolution, and relationship-building.",
  },
  {
    value: "other",
    label: "Other",
    description:
      "Another relevant skill that does not fit an existing category.",
  },
];

/*
 * =========================================
 * Skill Types
 * =========================================
 */

export const SKILL_TYPE_OPTIONS = [
  {
    value: "technical",
    label: "Technical Skill",
    description:
      "A practical skill involving systems, tools, technologies, or technical methods.",
  },
  {
    value: "professional",
    label: "Professional Skill",
    description: "A transferable skill used in professional work.",
  },
  {
    value: "interpersonal",
    label: "Interpersonal Skill",
    description:
      "A skill involving communication, collaboration, or relationships.",
  },
  {
    value: "leadership",
    label: "Leadership Skill",
    description:
      "A skill involving supervision, mentoring, coordination, or decision-making.",
  },
  {
    value: "language",
    label: "Language Skill",
    description: "A spoken, written, or signed human language.",
  },
  {
    value: "domain",
    label: "Domain Knowledge",
    description:
      "Knowledge associated with a particular profession or industry.",
  },
  {
    value: "tool",
    label: "Tool or Platform",
    description:
      "A named application, platform, service, system, or piece of equipment.",
  },
  {
    value: "other",
    label: "Other",
    description: "Another type of relevant professional skill.",
  },
];

/*
 * =========================================
 * Proficiency Levels
 * =========================================
 */

export const SKILL_PROFICIENCY_OPTIONS = [
  {
    value: "",
    label: "Not specified",
    description: "Do not assign a proficiency level.",
  },
  {
    value: "foundational",
    label: "Foundational",
    description:
      "Understands the fundamentals and can complete basic tasks with guidance.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description:
      "Can use the skill independently for common professional tasks.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description:
      "Can handle complex work, troubleshoot problems, and guide others.",
  },
  {
    value: "expert",
    label: "Expert",
    description:
      "Has deep, extensive knowledge and can lead highly complex work.",
  },
];

/*
 * =========================================
 * Language Proficiency
 * =========================================
 */

export const LANGUAGE_PROFICIENCY_OPTIONS = [
  {
    value: "",
    label: "Not specified",
  },
  {
    value: "basic",
    label: "Basic",
  },
  {
    value: "conversational",
    label: "Conversational",
  },
  {
    value: "professional-working",
    label: "Professional Working",
  },
  {
    value: "full-professional",
    label: "Full Professional",
  },
  {
    value: "native-bilingual",
    label: "Native or Bilingual",
  },
];

/*
 * =========================================
 * Skill Sources
 * =========================================
 */

export const SKILL_SOURCE_OPTIONS = [
  {
    value: "manual",
    label: "Added Manually",
  },
  {
    value: "ai-suggested",
    label: "AI Suggested",
  },
  {
    value: "imported",
    label: "Imported",
  },
  {
    value: "migration",
    label: "Migrated",
  },
];

/*
 * =========================================
 * Skill Statuses
 * =========================================
 */

export const SKILL_STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
    description: "Available for experiences, résumés, and portfolios.",
  },
  {
    value: "archived",
    label: "Archived",
    description: "Saved but unavailable in normal selection lists.",
  },
];

/*
 * =========================================
 * Field Limits
 * =========================================
 *
 * These limits should later be reproduced in
 * backend validation and the database design.
 */

export const SKILL_FIELD_LIMITS = {
  name: 150,
  description: 1500,
  category: 100,
  type: 100,
  proficiency: 50,
  languageProficiency: 50,

  alias: 150,
  maximumAliases: 20,

  yearsOfExperience: 80,
  notes: 2000,
};

/*
 * =========================================
 * Default Skill Values
 * =========================================
 */

export const DEFAULT_SKILL_VALUES = {
  category: "other",
  type: "professional",
  proficiency: "",
  languageProficiency: "",
  source: "manual",
  status: "active",
};

/*
 * =========================================
 * Option Helpers
 * =========================================
 */

function findOption(options, value) {
  return options.find((option) => option.value === value) || null;
}

export function getSkillCategoryOption(value) {
  return findOption(SKILL_CATEGORY_OPTIONS, value);
}

export function getSkillCategoryLabel(value) {
  return getSkillCategoryOption(value)?.label || "Other";
}

export function getSkillTypeOption(value) {
  return findOption(SKILL_TYPE_OPTIONS, value);
}

export function getSkillTypeLabel(value) {
  return getSkillTypeOption(value)?.label || "Professional Skill";
}

export function getSkillProficiencyOption(value) {
  return findOption(SKILL_PROFICIENCY_OPTIONS, value);
}

export function getSkillProficiencyLabel(value) {
  return getSkillProficiencyOption(value)?.label || "Not specified";
}

export function getLanguageProficiencyOption(value) {
  return findOption(LANGUAGE_PROFICIENCY_OPTIONS, value);
}

export function getLanguageProficiencyLabel(value) {
  return getLanguageProficiencyOption(value)?.label || "Not specified";
}

export function getSkillSourceOption(value) {
  return findOption(SKILL_SOURCE_OPTIONS, value);
}

export function getSkillSourceLabel(value) {
  return getSkillSourceOption(value)?.label || "Added Manually";
}

export function getSkillStatusOption(value) {
  return findOption(SKILL_STATUS_OPTIONS, value);
}

export function getSkillStatusLabel(value) {
  return getSkillStatusOption(value)?.label || "Active";
}

/*
 * =========================================
 * Option Validation
 * =========================================
 */

export function isValidSkillCategory(value) {
  return Boolean(getSkillCategoryOption(value));
}

export function isValidSkillType(value) {
  return Boolean(getSkillTypeOption(value));
}

export function isValidSkillProficiency(value) {
  return Boolean(getSkillProficiencyOption(value));
}

export function isValidLanguageProficiency(value) {
  return Boolean(getLanguageProficiencyOption(value));
}

export function isValidSkillSource(value) {
  return Boolean(getSkillSourceOption(value));
}

export function isValidSkillStatus(value) {
  return Boolean(getSkillStatusOption(value));
}
