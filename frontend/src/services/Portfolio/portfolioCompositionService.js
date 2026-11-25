import {
  portfolioBackendService as api,
} from "./portfolioBackendService.js";

export const PORTFOLIO_SECTIONS = Object.freeze([
  { key: "profile", label: "Profile" },
  { key: "summary", label: "About / Summary" },
  { key: "projects", label: "Projects" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
  { key: "certifications", label: "Certifications" },
  { key: "training", label: "Training" },
  { key: "resume", label: "Resume" },
]);

export const SECTION_SOURCE_TYPES = Object.freeze({
  projects: "project",
  experience: "experience",
  education: "education",
  skills: "skill",
  certifications: "certification",
  training: "training",
});

export function createDefaultSections() {
  return PORTFOLIO_SECTIONS.map((section, index) => ({
    sectionKey: section.key,
    sortOrder: index,
    isVisible: section.key !== "resume",
    settings: {},
  }));
}

export function normalizeSections(sections) {
  if (!Array.isArray(sections)) {
    throw new TypeError("Sections must be an array.");
  }

  const allowed = new Set(
    PORTFOLIO_SECTIONS.map(section => section.key),
  );

  const seen = new Set();

  return [...sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section, index) => {
      if (
        !allowed.has(section.sectionKey) ||
        seen.has(section.sectionKey)
      ) {
        throw new Error("Invalid or duplicate section.");
      }

      seen.add(section.sectionKey);

      return {
        sectionKey: section.sectionKey,
        sortOrder: index,
        isVisible: section.isVisible === true,
        settings: section.settings || {},
      };
    });
}

export function moveSection(sections, index, direction) {
  const result = normalizeSections(sections);
  const target = index + direction;

  if (
    index < 0 ||
    index >= result.length ||
    target < 0 ||
    target >= result.length
  ) {
    return result;
  }

  [result[index], result[target]] = [
    result[target],
    result[index],
  ];

  return result.map((section, order) => ({
    ...section,
    sortOrder: order,
  }));
}

export function createPortfolioCompositionService(client) {
  return Object.freeze({

    async load(portfolioId) {
      const initial = await client.getPortfolio(portfolioId);

      const sections = await client.getSections(portfolioId);
      const items = await client.getItems(portfolioId);

      const latest = await client.getPortfolio(portfolioId);

      if (
        initial.portfolio.rowVersion !==
        latest.portfolio.rowVersion
      ) {
        throw new Error(
          "Portfolio changed during loading. Refresh and retry.",
        );
      }

      if (
        !Array.isArray(sections.sections) ||
        !Array.isArray(items.items)
      ) {
        throw new Error("Invalid Portfolio composition.");
      }

      const configured = normalizeSections(sections.sections);

      const missing = createDefaultSections()
        .filter(section =>
          !configured.some(
            item => item.sectionKey === section.sectionKey,
          ),
        )
        .map((section, index) => ({
          ...section,
          sortOrder: configured.length + index,
          isVisible: configured.length === 0
            ? section.isVisible
            : false,
        }));

      return {
        portfolio: latest.portfolio,
        sections: [...configured, ...missing],
        items: items.items,
        rowVersion: latest.portfolio.rowVersion,
      };
    },

    async saveSections(portfolioId, sections, rowVersion) {
      const result = await client.saveSections(
        portfolioId,
        normalizeSections(sections),
        rowVersion,
      );

      if (
        !result.rowVersion ||
        !Array.isArray(result.sections)
      ) {
        throw new Error("Section save was not confirmed.");
      }

      return result;
    },

    async saveItems(portfolioId, items, rowVersion) {
      if (!Array.isArray(items) || items.length > 200) {
        throw new Error("Invalid Portfolio item collection.");
      }

      const counters = new Map();
      const seen = new Set();

      const normalized = items.map(item => {
        const expected = SECTION_SOURCE_TYPES[item.sectionKey];

        if (
          !expected ||
          expected !== item.sourceType ||
          typeof item.sourceRecordId !== "string" ||
          !item.sourceRecordId.trim()
        ) {
          throw new Error("Invalid source record selection.");
        }

        const key = JSON.stringify([
          item.sectionKey,
          item.sourceType,
          item.sourceRecordId.toLowerCase(),
        ]);

        if (seen.has(key)) {
          throw new Error("Duplicate source record.");
        }

        seen.add(key);

        const order = counters.get(item.sectionKey) || 0;
        counters.set(item.sectionKey, order + 1);

        return {
          sectionKey: item.sectionKey,
          sourceType: item.sourceType,
          sourceRecordId: item.sourceRecordId,
          sortOrder: order,
          settings: item.settings || {},
        };
      });

      const result = await client.saveItems(
        portfolioId,
        normalized,
        rowVersion,
      );

      if (!result.rowVersion || !Array.isArray(result.items)) {
        throw new Error("Source selection save was not confirmed.");
      }

      return result;
    },
  });
}

export const portfolioCompositionService =
  createPortfolioCompositionService(api);