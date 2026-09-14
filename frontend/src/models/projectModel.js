import {
  PROJECT_FIELD_LIMITS,
  isValidProjectAwardPlacement,
  isValidProjectCategory,
  isValidProjectDocumentType,
  isValidProjectLifecycleStatus,
  isValidProjectMediaType,
  isValidProjectOwnership,
  isValidProjectRecognitionType,
  isValidProjectRecordStatus,
  isValidProjectSkillProficiency,
  isValidProjectSource,
} from "../config/projectConfig.js";

/*
 * =========================================
 * Model Version
 * =========================================
 */

export const PROJECT_MODEL_VERSION = 2;

/*
 * =========================================
 * ID Creation
 * =========================================
 */

export function createProjectId(prefix = "project") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/*
 * =========================================
 * Primitive Normalization
 * =========================================
 */

function normalizeText(value, maximumLength = Infinity) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maximumLength);
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeNullableFileSize(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return Math.max(0, numberValue);
}

/*
 * =========================================
 * Date Normalization
 * =========================================
 */

function normalizeDate(value) {
  const normalizedValue = normalizeText(value, 10);

  if (
    !/^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/.test(normalizedValue)
  ) {
    return "";
  }

  return normalizedValue;
}

/*
 * =========================================
 * Identifier Collection
 * =========================================
 */

function normalizeIdentifierList(values, maximumItems = Infinity) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedIdentifiers = values
    .map((value) => {
      if (typeof value === "string") {
        return normalizeText(value, 200);
      }

      return normalizeText(value?.id, 200);
    })
    .filter(Boolean);

  return [...new Set(normalizedIdentifiers)].slice(0, maximumItems);
}

/*
 * =========================================
 * Ordered Text Items
 * =========================================
 */

function normalizeOrderedTextItems(values, prefix, maximumItems) {
  return normalizeArray(values)
    .map((value) => {
      const source =
        typeof value === "string"
          ? {
              text: value,
            }
          : value && typeof value === "object"
            ? value
            : {};

      return {
        id: normalizeText(source.id, 200) || createProjectId(prefix),

        text: normalizeText(
          source.text || source.name || source.value,
          PROJECT_FIELD_LIMITS.orderedItemText,
        ),

        order: 0,
      };
    })
    .filter((item) => item.text)
    .slice(0, maximumItems)
    .map((item, order) => ({
      ...item,
      order,
    }));
}

/*
 * =========================================
 * Related Record Relationships
 * =========================================
 */

function normalizeRecordRelationships(values, type) {
  const idField = `${type}Id`;

  const seenIdentifiers = new Set();

  return normalizeArray(values).reduce((relationships, value) => {
    const source =
      typeof value === "string"
        ? {
            [idField]: value,
          }
        : value && typeof value === "object"
          ? value
          : {};

    const recordId = normalizeText(
      source[idField] || source.recordId || source.id,
      200,
    );

    const identity = recordId.toLocaleLowerCase();

    if (
      !recordId ||
      seenIdentifiers.has(identity) ||
      relationships.length >= PROJECT_FIELD_LIMITS.maximumRelationshipsPerType
    ) {
      return relationships;
    }

    seenIdentifiers.add(identity);

    const snapshot =
      source.snapshot &&
      typeof source.snapshot === "object" &&
      !Array.isArray(source.snapshot)
        ? source.snapshot
        : {};

    relationships.push({
      id:
        normalizeText(
          source.relationshipId || (source[idField] ? source.id : ""),
          200,
        ) || createProjectId(`project-${type}`),

      [idField]: recordId,

      description: normalizeText(
        source.description,
        PROJECT_FIELD_LIMITS.relationshipDescription,
      ),

      order: relationships.length,

      snapshot: {
        name: normalizeText(
          snapshot.name || snapshot.title || source.name || source.title,
          PROJECT_FIELD_LIMITS.relationshipName,
        ),

        secondaryLabel: normalizeText(
          snapshot.secondaryLabel ||
            source.secondaryLabel ||
            source.organization?.name ||
            source.provider?.name ||
            source.institution?.name ||
            source.issuingOrganization?.name,
          PROJECT_FIELD_LIMITS.relationshipName,
        ),

        status: normalizeText(
          snapshot.status || source.lifecycleStatus || source.status,
          100,
        ),
      },
    });

    return relationships;
  }, []);
}

/*
 * =========================================
 * Skill Relationship
 * =========================================
 */

export function createProjectSkillRelationship(value = {}, order = 0) {
  const source =
    typeof value === "string"
      ? {
          nameSnapshot: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  const proficiency =
    source.demonstratedProficiency || source.proficiency || source.level || "";

  return {
    id:
      normalizeText(
        source.relationshipId || (source.skillId ? source.id : ""),
        200,
      ) || createProjectId("project-skill"),

    skillId: normalizeText(
      source.skillId ||
        source.profileSkillId ||
        (!source.skillId ? source.id : ""),
      200,
    ),

    nameSnapshot: normalizeText(
      source.nameSnapshot || source.name || source.label || source.value,
      PROJECT_FIELD_LIMITS.relationshipName,
    ),

    categorySnapshot: normalizeText(
      source.categorySnapshot || source.category,
      100,
    ),

    demonstratedProficiency: isValidProjectSkillProficiency(proficiency)
      ? proficiency
      : "",

    usageDescription: normalizeText(
      source.usageDescription || source.description,
      PROJECT_FIELD_LIMITS.relationshipDescription,
    ),

    order:
      Number.isInteger(Number(order)) && Number(order) >= 0 ? Number(order) : 0,
  };
}

/*
 * =========================================
 * Project Media
 * =========================================
 */

export function createProjectMedia(value = {}, order = 0) {
  const source = value && typeof value === "object" ? value : {};

  const type = isValidProjectMediaType(source.type)
    ? source.type
    : source.mimeType?.startsWith("video/")
      ? "video"
      : "image";

  return {
    id: normalizeText(source.id, 200) || createProjectId("project-media"),

    type,

    name: normalizeText(
      source.name || source.fileName,
      PROJECT_FIELD_LIMITS.mediaName,
    ),

    caption: normalizeText(source.caption, PROJECT_FIELD_LIMITS.mediaCaption),

    altText: normalizeText(
      source.altText || source.alternativeText || source.imageDescription,
      PROJECT_FIELD_LIMITS.mediaAltText,
    ),

    fileName: normalizeText(source.fileName, 500),

    mimeType: normalizeText(source.mimeType || source.fileType, 200),

    fileSize: normalizeNullableFileSize(source.fileSize ?? source.size),

    storageProvider:
      normalizeText(source.storageProvider, 100) ||
      (source.storageKey ? "indexed-db" : ""),

    storageKey: normalizeText(source.storageKey, 500),

    externalUrl: normalizeText(
      source.externalUrl || source.url,
      PROJECT_FIELD_LIMITS.url,
    ),

    previewMode: type === "video" ? "video" : "image",

    isFeatured: normalizeBoolean(source.isFeatured, false),

    visibility: source.visibility === "private" ? "private" : "public",

    status: source.status === "archived" ? "archived" : "active",

    uploadedAt: normalizeText(source.uploadedAt, 100),

    order:
      Number.isInteger(Number(order)) && Number(order) >= 0 ? Number(order) : 0,
  };
}

/*
 * =========================================
 * Project Document
 * =========================================
 */

export function createProjectDocument(value = {}, order = 0) {
  const source = value && typeof value === "object" ? value : {};

  return {
    id: normalizeText(source.id, 200) || createProjectId("project-document"),

    documentType: isValidProjectDocumentType(source.documentType)
      ? source.documentType
      : "supporting-evidence",

    name: normalizeText(
      source.name || source.fileName,
      PROJECT_FIELD_LIMITS.documentName,
    ),

    description: normalizeText(
      source.description,
      PROJECT_FIELD_LIMITS.documentDescription,
    ),

    fileName: normalizeText(source.fileName, 500),

    mimeType: normalizeText(source.mimeType || source.fileType, 200),

    fileSize: normalizeNullableFileSize(source.fileSize ?? source.size),

    storageProvider:
      normalizeText(source.storageProvider, 100) ||
      (source.storageKey ? "indexed-db" : ""),

    storageKey: normalizeText(source.storageKey, 500),

    externalUrl: normalizeText(
      source.externalUrl || source.url,
      PROJECT_FIELD_LIMITS.url,
    ),

    visibility: source.visibility === "public" ? "public" : "private",

    status: source.status === "archived" ? "archived" : "active",

    uploadedAt: normalizeText(source.uploadedAt, 100),

    order:
      Number.isInteger(Number(order)) && Number(order) >= 0 ? Number(order) : 0,
  };
}

/*
 * =========================================
 * Project Metric
 * =========================================
 */

function createProjectMetric(value = {}, order = 0) {
  const source = value && typeof value === "object" ? value : {};

  return {
    id: normalizeText(source.id, 200) || createProjectId("project-metric"),

    label: normalizeText(
      source.label || source.name,
      PROJECT_FIELD_LIMITS.metricLabel,
    ),

    value: normalizeText(
      source.value || source.result,
      PROJECT_FIELD_LIMITS.metricValue,
    ),

    description: normalizeText(
      source.description || source.context,
      PROJECT_FIELD_LIMITS.metricDescription,
    ),

    order,
  };
}

/*
 * =========================================
 * Project Technology
 * =========================================
 */

function createProjectTechnology(value = {}, order = 0) {
  const source =
    typeof value === "string"
      ? {
          name: value,
        }
      : value && typeof value === "object"
        ? value
        : {};

  return {
    id: normalizeText(source.id, 200) || createProjectId("project-technology"),

    name: normalizeText(
      source.name || source.nameSnapshot || source.label || source.value,
      PROJECT_FIELD_LIMITS.technologyName,
    ),

    /*
     * Category remains a normalized snapshot.
     * This preserves older free-text categories
     * while the form transitions to configured
     * technology-category options.
     */

    category: normalizeText(
      source.category || source.categorySnapshot,
      PROJECT_FIELD_LIMITS.technologyCategory,
    ),

    order,
  };
}

/*
 * =========================================
 * Project Award
 * =========================================
 */

function createProjectAward(value = {}, order = 0) {
  const source = value && typeof value === "object" ? value : {};

  const recognitionType = source.recognitionType || source.type || "";

  const placement = source.placement || source.result || "";

  return {
    id: normalizeText(source.id, 200) || createProjectId("project-award"),

    name: normalizeText(
      source.name || source.title,
      PROJECT_FIELD_LIMITS.awardName,
    ),

    organization: normalizeText(
      source.organization || source.awardingOrganization || source.issuer,
      PROJECT_FIELD_LIMITS.awardOrganization,
    ),

    recognitionType: isValidProjectRecognitionType(recognitionType)
      ? recognitionType
      : "",

    placement: isValidProjectAwardPlacement(placement) ? placement : "",

    date: normalizeDate(source.date || source.awardDate),

    url: normalizeText(
      source.url || source.verificationUrl,
      PROJECT_FIELD_LIMITS.url,
    ),

    description: normalizeText(
      source.description,
      PROJECT_FIELD_LIMITS.awardDescription,
    ),

    supportingDocumentIds: normalizeIdentifierList(
      source.supportingDocumentIds || source.documentIds,
      PROJECT_FIELD_LIMITS.maximumAwardDocuments,
    ),

    order,
  };
}

/*
 * =========================================
 * Empty Project
 * =========================================
 */

export function createEmptyProject() {
  const timestamp = new Date().toISOString();

  return {
    modelVersion: PROJECT_MODEL_VERSION,

    id: createProjectId(),

    title: "",

    category: "software",

    lifecycleStatus: "planned",

    role: "",

    ownership: "individual",

    organization: {
      name: "",
      clientName: "",
      website: "",
    },

    dates: {
      startDate: "",
      endDate: "",
      isCurrent: false,
    },

    location: {
      displayValue: "",
    },

    links: {
      liveUrl: "",
      repositoryUrl: "",
      documentationUrl: "",
      caseStudyUrl: "",
      videoUrl: "",
    },

    problem: {
      statement: "",
      targetAudience: "",
      context: "",
      importance: "",
      constraints: [],
      objectives: [],
    },

    solution: {
      overview: "",
      approach: "",
      architecture: "",
      features: [],
      contributions: [],
    },

    results: {
      outcome: "",
      problemsSolved: "",
      impact: "",
      beneficiariesAffected: "",
      metrics: [],
      lessonsLearned: "",
      futureImprovements: "",
    },

    skillRelationships: [],

    technologies: [],

    relatedRecords: {
      experienceRelationships: [],
      educationRelationships: [],
      trainingRelationships: [],
      certificationRelationships: [],
    },

    awards: [],

    media: [],

    supportingDocuments: [],

    presentation: {
      shortSummary: "",
      caseStudy: "",
      featuredMediaId: "",
      isFeatured: false,
    },

    visibility: {
      showOrganization: true,
      showLocation: true,
      showDates: true,
      showLinks: true,
      showProblem: true,
      showSolution: true,
      showResults: true,
      showSkills: true,
      showTechnologies: true,
      showRelatedRecords: true,
      showAwards: true,
      showMedia: true,
      showSupportingDocuments: false,
    },

    privateInformation: {
      notes: "",
    },

    source: "manual",

    sourceContext: "",

    recordStatus: "active",

    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/*
 * =========================================
 * Featured Media Eligibility
 * =========================================
 */

function isEligibleFeaturedMedia(mediaItem) {
  return Boolean(
    mediaItem &&
    mediaItem.status !== "archived" &&
    mediaItem.visibility !== "private" &&
    (normalizeText(mediaItem.storageKey, 500) ||
      normalizeText(mediaItem.externalUrl, PROJECT_FIELD_LIMITS.url)),
  );
}

/*
 * =========================================
 * Project Normalization
 * =========================================
 */

export function normalizeProject(value = {}) {
  const defaults = createEmptyProject();

  const source =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  const getObject = (fieldName) =>
    source[fieldName] &&
    typeof source[fieldName] === "object" &&
    !Array.isArray(source[fieldName])
      ? source[fieldName]
      : {};

  const organization = getObject("organization");
  const dates = getObject("dates");
  const location = getObject("location");
  const links = getObject("links");
  const problem = getObject("problem");
  const solution = getObject("solution");
  const results = getObject("results");
  const relatedRecords = getObject("relatedRecords");
  const presentation = getObject("presentation");
  const visibility = getObject("visibility");
  const privateInformation = getObject("privateInformation");

  const lifecycleStatus = isValidProjectLifecycleStatus(
    source.lifecycleStatus || source.projectStatus,
  )
    ? source.lifecycleStatus || source.projectStatus
    : defaults.lifecycleStatus;

  const isCurrent = normalizeBoolean(
    dates.isCurrent,
    ["in-progress", "maintained"].includes(lifecycleStatus),
  );

  /*
   * =========================================
   * Media Normalization
   * =========================================
   */

  const media = normalizeArray(source.media)
    .map((item, order) => createProjectMedia(item, order))
    .filter((item) => item.name || item.storageKey || item.externalUrl)
    .slice(0, PROJECT_FIELD_LIMITS.maximumMedia)
    .map((item, order) => ({
      ...item,
      order,
    }));

  const requestedFeaturedMediaId = normalizeText(
    presentation.featuredMediaId,
    200,
  );

  const featuredMedia =
    media.find(
      (item) =>
        item.id === requestedFeaturedMediaId && isEligibleFeaturedMedia(item),
    ) ||
    media.find((item) => item.isFeatured && isEligibleFeaturedMedia(item)) ||
    media.find(isEligibleFeaturedMedia) ||
    null;

  /*
   * =========================================
   * Skill Relationship Normalization
   * =========================================
   */

  const seenSkills = new Set();

  const skillRelationships = normalizeArray(source.skillRelationships)
    .map((relationship, order) =>
      createProjectSkillRelationship(relationship, order),
    )
    .filter((relationship) => {
      const identity = (relationship.skillId || relationship.nameSnapshot)
        .normalize("NFKC")
        .toLocaleLowerCase();

      if (!identity || seenSkills.has(identity)) {
        return false;
      }

      seenSkills.add(identity);

      return true;
    })
    .slice(0, PROJECT_FIELD_LIMITS.maximumSkills)
    .map((relationship, order) => ({
      ...relationship,
      order,
    }));

  /*
   * =========================================
   * Supporting Documents
   * =========================================
   */

  const supportingDocuments = normalizeArray(source.supportingDocuments)
    .map((documentRecord, order) =>
      createProjectDocument(documentRecord, order),
    )
    .filter(
      (documentRecord) =>
        documentRecord.name ||
        documentRecord.storageKey ||
        documentRecord.externalUrl,
    )
    .slice(0, PROJECT_FIELD_LIMITS.maximumDocuments)
    .map((documentRecord, order) => ({
      ...documentRecord,
      order,
    }));

  const validDocumentIds = new Set(
    supportingDocuments.map((documentRecord) => documentRecord.id),
  );

  /*
   * =========================================
   * Normalized Project
   * =========================================
   */

  return {
    modelVersion: PROJECT_MODEL_VERSION,

    id: normalizeText(source.id, 200) || defaults.id,

    title: normalizeText(
      source.title || source.name,
      PROJECT_FIELD_LIMITS.title,
    ),

    category: isValidProjectCategory(source.category)
      ? source.category
      : defaults.category,

    lifecycleStatus,

    role: normalizeText(source.role, PROJECT_FIELD_LIMITS.role),

    ownership: isValidProjectOwnership(source.ownership)
      ? source.ownership
      : defaults.ownership,

    organization: {
      name: normalizeText(
        organization.name,
        PROJECT_FIELD_LIMITS.organizationName,
      ),

      clientName: normalizeText(
        organization.clientName,
        PROJECT_FIELD_LIMITS.clientName,
      ),

      website: normalizeText(
        organization.website,
        PROJECT_FIELD_LIMITS.website,
      ),
    },

    dates: {
      startDate: normalizeDate(dates.startDate || source.startDate),

      endDate: isCurrent ? "" : normalizeDate(dates.endDate || source.endDate),

      isCurrent,
    },

    location: {
      displayValue: normalizeText(
        location.displayValue ||
          source.locationValue ||
          (typeof source.location === "string" ? source.location : ""),
        PROJECT_FIELD_LIMITS.locationDisplayValue,
      ),
    },

    links: {
      liveUrl: normalizeText(links.liveUrl, PROJECT_FIELD_LIMITS.url),

      repositoryUrl: normalizeText(
        links.repositoryUrl,
        PROJECT_FIELD_LIMITS.url,
      ),

      documentationUrl: normalizeText(
        links.documentationUrl,
        PROJECT_FIELD_LIMITS.url,
      ),

      caseStudyUrl: normalizeText(links.caseStudyUrl, PROJECT_FIELD_LIMITS.url),

      videoUrl: normalizeText(links.videoUrl, PROJECT_FIELD_LIMITS.url),
    },

    problem: {
      statement: normalizeText(
        problem.statement,
        PROJECT_FIELD_LIMITS.problemStatement,
      ),

      targetAudience: normalizeText(
        problem.targetAudience,
        PROJECT_FIELD_LIMITS.targetAudience,
      ),

      context: normalizeText(problem.context, PROJECT_FIELD_LIMITS.context),

      importance: normalizeText(
        problem.importance || problem.whyImportant,
        PROJECT_FIELD_LIMITS.importance,
      ),

      constraints: normalizeOrderedTextItems(
        problem.constraints,
        "project-constraint",
        PROJECT_FIELD_LIMITS.maximumConstraints,
      ),

      objectives: normalizeOrderedTextItems(
        problem.objectives,
        "project-objective",
        PROJECT_FIELD_LIMITS.maximumObjectives,
      ),
    },

    solution: {
      overview: normalizeText(
        solution.overview || source.description,
        PROJECT_FIELD_LIMITS.overview,
      ),

      approach: normalizeText(
        solution.approach || solution.proposedSolution,
        PROJECT_FIELD_LIMITS.approach,
      ),

      architecture: normalizeText(
        solution.architecture || solution.implementationSummary,
        PROJECT_FIELD_LIMITS.architecture,
      ),

      features: normalizeOrderedTextItems(
        solution.features,
        "project-feature",
        PROJECT_FIELD_LIMITS.maximumFeatures,
      ),

      contributions: normalizeOrderedTextItems(
        solution.contributions,
        "project-contribution",
        PROJECT_FIELD_LIMITS.maximumContributions,
      ),
    },

    results: {
      outcome: normalizeText(results.outcome, PROJECT_FIELD_LIMITS.outcome),

      problemsSolved: normalizeText(
        results.problemsSolved || results.solutionImpact,
        PROJECT_FIELD_LIMITS.problemsSolved,
      ),

      impact: normalizeText(results.impact, PROJECT_FIELD_LIMITS.impact),

      beneficiariesAffected: normalizeText(
        results.beneficiariesAffected ||
          results.peopleAffected ||
          results.organizationsAffected,
        PROJECT_FIELD_LIMITS.beneficiariesAffected,
      ),

      metrics: normalizeArray(results.metrics)
        .map((metric, order) => createProjectMetric(metric, order))
        .filter((metric) => metric.label || metric.value)
        .slice(0, PROJECT_FIELD_LIMITS.maximumMetrics)
        .map((metric, order) => ({
          ...metric,
          order,
        })),

      lessonsLearned: normalizeText(
        results.lessonsLearned,
        PROJECT_FIELD_LIMITS.lessonsLearned,
      ),

      futureImprovements: normalizeText(
        results.futureImprovements,
        PROJECT_FIELD_LIMITS.futureImprovements,
      ),
    },

    skillRelationships,

    technologies: normalizeArray(source.technologies)
      .map((technology, order) => createProjectTechnology(technology, order))
      .filter((technology) => technology.name)
      .slice(0, PROJECT_FIELD_LIMITS.maximumTechnologies)
      .map((technology, order) => ({
        ...technology,
        order,
      })),

    relatedRecords: {
      experienceRelationships: normalizeRecordRelationships(
        relatedRecords.experienceRelationships || source.relatedExperienceIds,
        "experience",
      ),

      educationRelationships: normalizeRecordRelationships(
        relatedRecords.educationRelationships || source.relatedEducationIds,
        "education",
      ),

      trainingRelationships: normalizeRecordRelationships(
        relatedRecords.trainingRelationships || source.relatedTrainingIds,
        "training",
      ),

      certificationRelationships: normalizeRecordRelationships(
        relatedRecords.certificationRelationships ||
          source.relatedCertificationIds,
        "certification",
      ),
    },

    awards: normalizeArray(source.awards)
      .map((award, order) => createProjectAward(award, order))
      .filter((award) => award.name)
      .slice(0, PROJECT_FIELD_LIMITS.maximumAwards)
      .map((award, order) => ({
        ...award,

        supportingDocumentIds: award.supportingDocumentIds.filter(
          (documentId) => validDocumentIds.has(documentId),
        ),

        order,
      })),

    media: media.map((item) => ({
      ...item,

      isFeatured: item.id === featuredMedia?.id,
    })),

    supportingDocuments,

    presentation: {
      shortSummary: normalizeText(
        presentation.shortSummary,
        PROJECT_FIELD_LIMITS.shortSummary,
      ),

      caseStudy: normalizeText(
        presentation.caseStudy,
        PROJECT_FIELD_LIMITS.caseStudy,
      ),

      featuredMediaId: featuredMedia?.id || "",

      isFeatured: normalizeBoolean(presentation.isFeatured, false),
    },

    visibility: Object.fromEntries(
      Object.entries(defaults.visibility).map(([fieldName, fallback]) => [
        fieldName,

        normalizeBoolean(visibility[fieldName], fallback),
      ]),
    ),

    privateInformation: {
      notes: normalizeText(
        privateInformation.notes || source.privateNotes,
        PROJECT_FIELD_LIMITS.privateNotes,
      ),
    },

    source: isValidProjectSource(source.source)
      ? source.source
      : defaults.source,

    sourceContext: normalizeText(
      source.sourceContext,
      PROJECT_FIELD_LIMITS.sourceContext,
    ),

    recordStatus: isValidProjectRecordStatus(source.recordStatus)
      ? source.recordStatus
      : defaults.recordStatus,

    createdAt: normalizeText(source.createdAt, 100) || defaults.createdAt,

    updatedAt: normalizeText(source.updatedAt, 100) || defaults.updatedAt,
  };
}

/*
 * =========================================
 * Create Project
 * =========================================
 */

export function createProject(values = {}) {
  const timestamp = new Date().toISOString();

  return normalizeProject({
    ...values,

    id: normalizeText(values.id, 200) || createProjectId(),

    createdAt: normalizeText(values.createdAt, 100) || timestamp,

    updatedAt: timestamp,
  });
}

/*
 * =========================================
 * Update Project
 * =========================================
 */

export function updateProjectModel(currentProject, updates = {}) {
  const mergeNested = (fieldName) => ({
    ...currentProject?.[fieldName],
    ...updates?.[fieldName],
  });

  return normalizeProject({
    ...currentProject,
    ...updates,

    organization: mergeNested("organization"),
    dates: mergeNested("dates"),
    location: mergeNested("location"),
    links: mergeNested("links"),
    problem: mergeNested("problem"),
    solution: mergeNested("solution"),
    results: mergeNested("results"),
    relatedRecords: mergeNested("relatedRecords"),
    presentation: mergeNested("presentation"),
    visibility: mergeNested("visibility"),
    privateInformation: mergeNested("privateInformation"),

    id: currentProject?.id,

    createdAt: currentProject?.createdAt,

    updatedAt: new Date().toISOString(),
  });
}

/*
 * =========================================
 * Normalize Project Collection
 * =========================================
 */

export function normalizeProjectCollection(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const seenIdentifiers = new Set();

  return values.map(normalizeProject).filter((project) => {
    if (seenIdentifiers.has(project.id)) {
      return false;
    }

    seenIdentifiers.add(project.id);

    return true;
  });
}

/*
 * =========================================
 * Public Project Transformation
 * =========================================
 *
 * This function removes private and internal
 * career-management information before the
 * Project is displayed publicly.
 */

export function createPublicProject(value) {
  const project = normalizeProject(value);

  /*
   * Only active, public media can appear in a
   * public portfolio.
   */

  const publicMedia = project.visibility.showMedia
    ? project.media
        .filter(
          (item) => item.visibility === "public" && item.status !== "archived",
        )
        .map(({ visibility, status, ...publicMediaItem }, order) => ({
          ...publicMediaItem,
          order,
        }))
    : [];

  /*
   * A private or archived featured item must
   * not remain referenced publicly.
   */

  const publicFeaturedMedia =
    publicMedia.find(
      (item) => item.id === project.presentation.featuredMediaId,
    ) ||
    publicMedia.find((item) => item.isFeatured) ||
    publicMedia[0] ||
    null;

  const normalizedPublicMedia = publicMedia.map((item) => ({
    ...item,

    isFeatured: item.id === publicFeaturedMedia?.id,
  }));

  /*
   * Only active, explicitly public documents
   * can appear in public output.
   */

  const publicDocuments = project.visibility.showSupportingDocuments
    ? project.supportingDocuments
        .filter(
          (item) => item.visibility === "public" && item.status !== "archived",
        )
        .map(({ visibility, status, ...publicDocument }, order) => ({
          ...publicDocument,
          order,
        }))
    : [];

  const publicDocumentIds = new Set(
    publicDocuments.map((documentRecord) => documentRecord.id),
  );

  const publicAwards = project.visibility.showAwards
    ? project.awards.map((award) => ({
        ...award,

        supportingDocumentIds: award.supportingDocumentIds.filter(
          (documentId) => publicDocumentIds.has(documentId),
        ),
      }))
    : [];

  return {
    modelVersion: project.modelVersion,

    id: project.id,

    title: project.title,

    category: project.category,

    lifecycleStatus: project.lifecycleStatus,

    role: project.role,

    ownership: project.ownership,

    organization: project.visibility.showOrganization
      ? project.organization
      : null,

    location: project.visibility.showLocation ? project.location : null,

    dates: project.visibility.showDates ? project.dates : null,

    links: project.visibility.showLinks ? project.links : null,

    problem: project.visibility.showProblem ? project.problem : null,

    solution: project.visibility.showSolution ? project.solution : null,

    results: project.visibility.showResults ? project.results : null,

    skillRelationships: project.visibility.showSkills
      ? project.skillRelationships
      : [],

    technologies: project.visibility.showTechnologies
      ? project.technologies
      : [],

    relatedRecords: project.visibility.showRelatedRecords
      ? project.relatedRecords
      : {
          experienceRelationships: [],
          educationRelationships: [],
          trainingRelationships: [],
          certificationRelationships: [],
        },

    awards: publicAwards,

    media: normalizedPublicMedia,

    supportingDocuments: publicDocuments,

    presentation: {
      shortSummary: project.presentation.shortSummary,

      caseStudy: project.presentation.caseStudy,

      featuredMediaId: publicFeaturedMedia?.id || "",

      isFeatured: project.presentation.isFeatured,
    },

    updatedAt: project.updatedAt,
  };
}
