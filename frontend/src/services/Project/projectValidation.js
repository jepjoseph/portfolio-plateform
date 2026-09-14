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
} from "../../config/projectConfig.js";

import { normalizeProject } from "../../models/projectModel.js";

/*
 * =========================================
 * Validation Result Helpers
 * =========================================
 */

function addError(errors, fieldErrors, field, code, message) {
  errors.push({
    field,
    code,
    message,
  });

  if (!fieldErrors[field]) {
    fieldErrors[field] = message;
  }
}

function addWarning(warnings, field, code, message) {
  warnings.push({
    field,
    code,
    message,
  });
}

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

function getObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

/*
 * =========================================
 * URL Validation
 * =========================================
 */

function isValidUrl(value) {
  const normalizedValue = getText(value);

  if (!normalizedValue) {
    return true;
  }

  try {
    const url = new URL(normalizedValue);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/*
 * =========================================
 * Date Validation
 * =========================================
 */

function parseProjectDate(value) {
  const normalizedValue = getText(value);

  if (!normalizedValue) {
    return null;
  }

  const match = normalizedValue.match(
    /^(\d{4})-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/,
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : 1;

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    match[3] &&
    (parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day)
  ) {
    return null;
  }

  return parsedDate.getTime();
}

/*
 * =========================================
 * Length Validation
 * =========================================
 */

function validateMaximumLength({
  value,
  maximumLength,
  field,
  label,
  errors,
  fieldErrors,
}) {
  if (typeof value === "string" && value.trim().length > maximumLength) {
    addError(
      errors,
      fieldErrors,
      field,
      "PROJECT_FIELD_TOO_LONG",
      `${label} cannot exceed ${maximumLength} characters.`,
    );
  }
}

/*
 * =========================================
 * Project Validation
 * =========================================
 */

export function validateProject(value, collections = {}) {
  const source = getObject(value);

  const project = normalizeProject(source);

  const errors = [];
  const warnings = [];
  const fieldErrors = {};

  const sourceOrganization = getObject(source.organization);

  const sourceDates = getObject(source.dates);

  const sourceLinks = getObject(source.links);

  const sourceProblem = getObject(source.problem);

  const sourceSolution = getObject(source.solution);

  const sourceResults = getObject(source.results);

  const sourcePresentation = getObject(source.presentation);

  const sourcePrivateInformation = getObject(source.privateInformation);

  /*
   * =========================================
   * Required Fields
   * =========================================
   */

  if (!project.title) {
    addError(
      errors,
      fieldErrors,
      "title",
      "PROJECT_TITLE_REQUIRED",
      "Enter a project title.",
    );
  }

  if (!project.role) {
    addError(
      errors,
      fieldErrors,
      "role",
      "PROJECT_ROLE_REQUIRED",
      "Describe your role in this project.",
    );
  }

  if (!project.dates.startDate) {
    addError(
      errors,
      fieldErrors,
      "dates.startDate",
      "PROJECT_START_DATE_REQUIRED",
      "Enter the project start date.",
    );
  }

  /*
   * =========================================
   * Option Validation
   * =========================================
   */

  if (source.category && !isValidProjectCategory(source.category)) {
    addError(
      errors,
      fieldErrors,
      "category",
      "PROJECT_CATEGORY_INVALID",
      "Select a valid project category.",
    );
  }

  const suppliedLifecycleStatus =
    source.lifecycleStatus || source.projectStatus;

  if (
    suppliedLifecycleStatus &&
    !isValidProjectLifecycleStatus(suppliedLifecycleStatus)
  ) {
    addError(
      errors,
      fieldErrors,
      "lifecycleStatus",
      "PROJECT_LIFECYCLE_INVALID",
      "Select a valid project lifecycle status.",
    );
  }

  if (source.ownership && !isValidProjectOwnership(source.ownership)) {
    addError(
      errors,
      fieldErrors,
      "ownership",
      "PROJECT_OWNERSHIP_INVALID",
      "Select a valid project ownership type.",
    );
  }

  if (source.source && !isValidProjectSource(source.source)) {
    addError(
      errors,
      fieldErrors,
      "source",
      "PROJECT_SOURCE_INVALID",
      "Select a valid record source.",
    );
  }

  if (source.recordStatus && !isValidProjectRecordStatus(source.recordStatus)) {
    addError(
      errors,
      fieldErrors,
      "recordStatus",
      "PROJECT_RECORD_STATUS_INVALID",
      "Select a valid Project record status.",
    );
  }

  /*
   * =========================================
   * Date Validation
   * =========================================
   */

  const startDateValue = parseProjectDate(sourceDates.startDate);

  const endDateValue = parseProjectDate(sourceDates.endDate);

  if (sourceDates.startDate && startDateValue === null) {
    addError(
      errors,
      fieldErrors,
      "dates.startDate",
      "PROJECT_START_DATE_INVALID",
      "Enter a valid project start date.",
    );
  }

  if (sourceDates.endDate && endDateValue === null) {
    addError(
      errors,
      fieldErrors,
      "dates.endDate",
      "PROJECT_END_DATE_INVALID",
      "Enter a valid project end date.",
    );
  }

  if (
    !project.dates.isCurrent &&
    ["completed", "cancelled"].includes(project.lifecycleStatus) &&
    !project.dates.endDate
  ) {
    addError(
      errors,
      fieldErrors,
      "dates.endDate",
      "PROJECT_END_DATE_REQUIRED",
      "Enter the project completion or cancellation date.",
    );
  }

  if (
    startDateValue !== null &&
    endDateValue !== null &&
    endDateValue < startDateValue
  ) {
    addError(
      errors,
      fieldErrors,
      "dates.endDate",
      "PROJECT_DATE_ORDER_INVALID",
      "The end date cannot be earlier than the start date.",
    );
  }

  if (project.dates.isCurrent && project.dates.endDate) {
    addError(
      errors,
      fieldErrors,
      "dates.endDate",
      "PROJECT_CURRENT_END_DATE_CONFLICT",
      "An ongoing project cannot have an end date.",
    );
  }

  if (
    project.dates.isCurrent &&
    !["in-progress", "maintained"].includes(project.lifecycleStatus)
  ) {
    addError(
      errors,
      fieldErrors,
      "lifecycleStatus",
      "PROJECT_CURRENT_LIFECYCLE_CONFLICT",
      "An ongoing project must be In Progress or Maintained.",
    );
  }

  if (
    ["in-progress", "maintained"].includes(project.lifecycleStatus) &&
    !project.dates.isCurrent
  ) {
    addWarning(
      warnings,
      "dates.isCurrent",
      "PROJECT_CURRENT_STATUS_RECOMMENDED",
      "Consider marking an In Progress or Maintained project as ongoing.",
    );
  }

  /*
   * =========================================
   * URL Validation
   * =========================================
   */

  Object.entries(sourceLinks).forEach(([fieldName, urlValue]) => {
    if (!isValidUrl(urlValue)) {
      addError(
        errors,
        fieldErrors,
        `links.${fieldName}`,
        "PROJECT_URL_INVALID",
        "Enter a complete HTTP or HTTPS address.",
      );
    }
  });

  if (!isValidUrl(sourceOrganization.website)) {
    addError(
      errors,
      fieldErrors,
      "organization.website",
      "PROJECT_ORGANIZATION_URL_INVALID",
      "Enter a complete HTTP or HTTPS organization address.",
    );
  }

  /*
   * =========================================
   * Maximum Field Lengths
   * =========================================
   */

  [
    [source.title, PROJECT_FIELD_LIMITS.title, "title", "Project title"],
    [source.role, PROJECT_FIELD_LIMITS.role, "role", "Project role"],
    [
      sourceOrganization.name,
      PROJECT_FIELD_LIMITS.organizationName,
      "organization.name",
      "Organization name",
    ],
    [
      sourceOrganization.clientName,
      PROJECT_FIELD_LIMITS.clientName,
      "organization.clientName",
      "Client name",
    ],
    [
      sourceProblem.statement,
      PROJECT_FIELD_LIMITS.problemStatement,
      "problem.statement",
      "Problem statement",
    ],
    [
      sourceProblem.targetAudience,
      PROJECT_FIELD_LIMITS.targetAudience,
      "problem.targetAudience",
      "Target audience",
    ],
    [
      sourceProblem.context,
      PROJECT_FIELD_LIMITS.context,
      "problem.context",
      "Project context",
    ],
    [
      sourceProblem.importance,
      PROJECT_FIELD_LIMITS.importance,
      "problem.importance",
      "Project importance",
    ],
    [
      sourceSolution.overview,
      PROJECT_FIELD_LIMITS.overview,
      "solution.overview",
      "Solution overview",
    ],
    [
      sourceSolution.approach,
      PROJECT_FIELD_LIMITS.approach,
      "solution.approach",
      "Implementation approach",
    ],
    [
      sourceSolution.architecture,
      PROJECT_FIELD_LIMITS.architecture,
      "solution.architecture",
      "Architecture summary",
    ],
    [
      sourceResults.outcome,
      PROJECT_FIELD_LIMITS.outcome,
      "results.outcome",
      "Project outcome",
    ],
    [
      sourceResults.problemsSolved,
      PROJECT_FIELD_LIMITS.problemsSolved,
      "results.problemsSolved",
      "Problems solved",
    ],
    [
      sourceResults.impact,
      PROJECT_FIELD_LIMITS.impact,
      "results.impact",
      "Project impact",
    ],
    [
      sourceResults.beneficiariesAffected,
      PROJECT_FIELD_LIMITS.beneficiariesAffected,
      "results.beneficiariesAffected",
      "Affected beneficiaries",
    ],
    [
      sourcePresentation.shortSummary,
      PROJECT_FIELD_LIMITS.shortSummary,
      "presentation.shortSummary",
      "Portfolio summary",
    ],
    [
      sourcePresentation.caseStudy,
      PROJECT_FIELD_LIMITS.caseStudy,
      "presentation.caseStudy",
      "Detailed case study",
    ],
    [
      sourcePrivateInformation.notes,
      PROJECT_FIELD_LIMITS.privateNotes,
      "privateInformation.notes",
      "Private notes",
    ],
  ].forEach(([fieldValue, limit, field, label]) => {
    validateMaximumLength({
      value: fieldValue,
      maximumLength: limit,
      field,
      label,
      errors,
      fieldErrors,
    });
  });

  /*
   * =========================================
   * Collection Limits
   * =========================================
   */

  const collectionLimits = [
    [
      sourceProblem.objectives,
      PROJECT_FIELD_LIMITS.maximumObjectives,
      "problem.objectives",
      "objectives",
    ],
    [
      sourceProblem.constraints,
      PROJECT_FIELD_LIMITS.maximumConstraints,
      "problem.constraints",
      "constraints",
    ],
    [
      sourceSolution.features,
      PROJECT_FIELD_LIMITS.maximumFeatures,
      "solution.features",
      "features",
    ],
    [
      sourceSolution.contributions,
      PROJECT_FIELD_LIMITS.maximumContributions,
      "solution.contributions",
      "contributions",
    ],
    [
      sourceResults.metrics,
      PROJECT_FIELD_LIMITS.maximumMetrics,
      "results.metrics",
      "metrics",
    ],
    [
      source.skillRelationships,
      PROJECT_FIELD_LIMITS.maximumSkills,
      "skillRelationships",
      "related Skills",
    ],
    [
      source.technologies,
      PROJECT_FIELD_LIMITS.maximumTechnologies,
      "technologies",
      "technologies",
    ],
    [source.awards, PROJECT_FIELD_LIMITS.maximumAwards, "awards", "awards"],
    [source.media, PROJECT_FIELD_LIMITS.maximumMedia, "media", "media items"],
    [
      source.supportingDocuments,
      PROJECT_FIELD_LIMITS.maximumDocuments,
      "supportingDocuments",
      "documents",
    ],
  ];

  collectionLimits.forEach(([collection, maximum, field, label]) => {
    if (Array.isArray(collection) && collection.length > maximum) {
      addError(
        errors,
        fieldErrors,
        field,
        "PROJECT_COLLECTION_LIMIT_EXCEEDED",
        `Add no more than ${maximum} ${label}.`,
      );
    }
  });

  /*
   * =========================================
   * Skills
   * =========================================
   */

  const availableSkillIds = Array.isArray(collections.skills)
    ? new Set(collections.skills.map((skill) => skill?.id).filter(Boolean))
    : null;

  project.skillRelationships.forEach((relationship, index) => {
    if (!relationship.skillId && !relationship.nameSnapshot) {
      addError(
        errors,
        fieldErrors,
        `skillRelationships.${index}`,
        "PROJECT_SKILL_IDENTITY_REQUIRED",
        "A related Skill must have an identifier or readable snapshot.",
      );
    }

    if (
      relationship.demonstratedProficiency &&
      !isValidProjectSkillProficiency(relationship.demonstratedProficiency)
    ) {
      addError(
        errors,
        fieldErrors,
        `skillRelationships.${index}.demonstratedProficiency`,
        "PROJECT_SKILL_PROFICIENCY_INVALID",
        "Select a valid demonstrated proficiency.",
      );
    }

    /*
     * A missing central record is a warning.
     * The snapshot keeps the Project readable.
     */

    if (
      availableSkillIds &&
      relationship.skillId &&
      !availableSkillIds.has(relationship.skillId)
    ) {
      addWarning(
        warnings,
        `skillRelationships.${index}`,
        "PROJECT_SKILL_NOT_FOUND",
        `The Skill “${
          relationship.nameSnapshot || relationship.skillId
        }” is no longer available in the Skill Library. Its snapshot will be preserved.`,
      );
    }
  });

  /*
   * =========================================
   * Related Professional Records
   * =========================================
   */

  const relationshipCollections = [
    {
      relationshipName: "experienceRelationships",
      idField: "experienceId",
      records: collections.experiences,
      label: "Experience",
    },
    {
      relationshipName: "educationRelationships",
      idField: "educationId",
      records: collections.educationRecords,
      label: "Education",
    },
    {
      relationshipName: "trainingRelationships",
      idField: "trainingId",
      records: collections.trainingRecords,
      label: "Training",
    },
    {
      relationshipName: "certificationRelationships",
      idField: "certificationId",
      records: collections.certifications,
      label: "Certification",
    },
  ];

  relationshipCollections.forEach(
    ({ relationshipName, idField, records, label }) => {
      if (!Array.isArray(records)) {
        return;
      }

      const availableIds = new Set(
        records.map((record) => record?.id).filter(Boolean),
      );

      project.relatedRecords[relationshipName].forEach(
        (relationship, index) => {
          if (!relationship[idField]) {
            addError(
              errors,
              fieldErrors,
              `relatedRecords.${relationshipName}.${index}`,
              "PROJECT_RELATIONSHIP_ID_REQUIRED",
              `A related ${label} record must have an identifier.`,
            );

            return;
          }

          if (!availableIds.has(relationship[idField])) {
            addWarning(
              warnings,
              `relatedRecords.${relationshipName}.${index}`,
              "PROJECT_RELATIONSHIP_NOT_FOUND",
              `A related ${label} record is no longer available. Its readable snapshot will be preserved.`,
            );
          }
        },
      );
    },
  );

  /*
   * =========================================
   * Awards and Recognition
   * =========================================
   */

  const documentIds = new Set(
    project.supportingDocuments.map((documentRecord) => documentRecord.id),
  );

  project.awards.forEach((award, index) => {
    if (
      award.recognitionType &&
      !isValidProjectRecognitionType(award.recognitionType)
    ) {
      addError(
        errors,
        fieldErrors,
        `awards.${index}.recognitionType`,
        "PROJECT_RECOGNITION_TYPE_INVALID",
        "Select a valid recognition type.",
      );
    }

    if (award.placement && !isValidProjectAwardPlacement(award.placement)) {
      addError(
        errors,
        fieldErrors,
        `awards.${index}.placement`,
        "PROJECT_AWARD_PLACEMENT_INVALID",
        "Select a valid award placement.",
      );
    }

    if (!isValidUrl(award.url)) {
      addError(
        errors,
        fieldErrors,
        `awards.${index}.url`,
        "PROJECT_AWARD_URL_INVALID",
        "Enter a complete HTTP or HTTPS award address.",
      );
    }

    award.supportingDocumentIds.forEach((documentId) => {
      if (!documentIds.has(documentId)) {
        addError(
          errors,
          fieldErrors,
          `awards.${index}.supportingDocumentIds`,
          "PROJECT_AWARD_DOCUMENT_NOT_FOUND",
          "An award references a Project document that is no longer available.",
        );
      }
    });
  });

  /*
   * =========================================
   * Media
   * =========================================
   */

  project.media.forEach((mediaItem, index) => {
    if (!isValidProjectMediaType(mediaItem.type)) {
      addError(
        errors,
        fieldErrors,
        `media.${index}.type`,
        "PROJECT_MEDIA_TYPE_INVALID",
        "Select a valid project media type.",
      );
    }

    if (!mediaItem.storageKey && !mediaItem.externalUrl) {
      addError(
        errors,
        fieldErrors,
        `media.${index}`,
        "PROJECT_MEDIA_SOURCE_REQUIRED",
        "Project media must have a stored file or external address.",
      );
    }

    if (!isValidUrl(mediaItem.externalUrl)) {
      addError(
        errors,
        fieldErrors,
        `media.${index}.externalUrl`,
        "PROJECT_MEDIA_URL_INVALID",
        "Enter a complete HTTP or HTTPS media address.",
      );
    }

    if (mediaItem.type !== "video" && !mediaItem.altText) {
      addWarning(
        warnings,
        `media.${index}.altText`,
        "PROJECT_MEDIA_ALT_TEXT_RECOMMENDED",
        `Add alternative text for “${
          mediaItem.name || "this image"
        }” to improve accessibility.`,
      );
    }
  });

  const activeMedia = project.media.filter(
    (mediaItem) => mediaItem.status !== "archived",
  );

  const featuredMediaId = project.presentation.featuredMediaId;

  if (
    featuredMediaId &&
    !activeMedia.some((mediaItem) => mediaItem.id === featuredMediaId)
  ) {
    addError(
      errors,
      fieldErrors,
      "presentation.featuredMediaId",
      "PROJECT_FEATURED_MEDIA_NOT_FOUND",
      "The selected featured media is no longer available.",
    );
  }

  /*
   * =========================================
   * Supporting Documents
   * =========================================
   */

  project.supportingDocuments.forEach((documentRecord, index) => {
    if (!isValidProjectDocumentType(documentRecord.documentType)) {
      addError(
        errors,
        fieldErrors,
        `supportingDocuments.${index}.documentType`,
        "PROJECT_DOCUMENT_TYPE_INVALID",
        "Select a valid Project document type.",
      );
    }

    if (!documentRecord.storageKey && !documentRecord.externalUrl) {
      addError(
        errors,
        fieldErrors,
        `supportingDocuments.${index}`,
        "PROJECT_DOCUMENT_SOURCE_REQUIRED",
        "A Project document must have a stored file or external address.",
      );
    }

    if (!isValidUrl(documentRecord.externalUrl)) {
      addError(
        errors,
        fieldErrors,
        `supportingDocuments.${index}.externalUrl`,
        "PROJECT_DOCUMENT_URL_INVALID",
        "Enter a complete HTTP or HTTPS document address.",
      );
    }
  });

  /*
   * =========================================
   * Professional Completeness Warnings
   * =========================================
   */

  if (!project.problem.statement) {
    addWarning(
      warnings,
      "problem.statement",
      "PROJECT_PROBLEM_RECOMMENDED",
      "Add the problem or opportunity the project addressed.",
    );
  }

  if (!project.problem.importance) {
    addWarning(
      warnings,
      "problem.importance",
      "PROJECT_IMPORTANCE_RECOMMENDED",
      "Explain why this project was professionally important.",
    );
  }

  if (!project.solution.overview) {
    addWarning(
      warnings,
      "solution.overview",
      "PROJECT_SOLUTION_RECOMMENDED",
      "Add a concise explanation of the solution.",
    );
  }

  if (project.solution.contributions.length === 0) {
    addWarning(
      warnings,
      "solution.contributions",
      "PROJECT_CONTRIBUTIONS_RECOMMENDED",
      "Describe your personal contributions to the project.",
    );
  }

  if (project.lifecycleStatus === "completed" && !project.results.outcome) {
    addWarning(
      warnings,
      "results.outcome",
      "PROJECT_OUTCOME_RECOMMENDED",
      "Add the completed Project’s final outcome.",
    );
  }

  if (
    project.lifecycleStatus === "completed" &&
    !project.results.problemsSolved
  ) {
    addWarning(
      warnings,
      "results.problemsSolved",
      "PROJECT_PROBLEMS_SOLVED_RECOMMENDED",
      "Explain which problems the completed project solved.",
    );
  }

  if (
    project.lifecycleStatus === "completed" &&
    project.results.metrics.length === 0
  ) {
    addWarning(
      warnings,
      "results.metrics",
      "PROJECT_METRICS_RECOMMENDED",
      "Add measurable evidence of the project’s result when available.",
    );
  }

  if (!project.presentation.shortSummary) {
    addWarning(
      warnings,
      "presentation.shortSummary",
      "PROJECT_SUMMARY_RECOMMENDED",
      `Add a portfolio summary of up to ${PROJECT_FIELD_LIMITS.shortSummary} characters.`,
    );
  }

  if (activeMedia.length === 0) {
    addWarning(
      warnings,
      "media",
      "PROJECT_MEDIA_RECOMMENDED",
      "Add a featured image or video to strengthen the portfolio presentation.",
    );
  }

  if (project.presentation.isFeatured && activeMedia.length === 0) {
    addWarning(
      warnings,
      "presentation.isFeatured",
      "PROJECT_FEATURED_MEDIA_RECOMMENDED",
      "A featured Project should have a strong public image or video.",
    );
  }

  return {
    isValid: errors.length === 0,

    project,

    errors,

    warnings,

    fieldErrors,
  };
}

/*
 * =========================================
 * Validation Summary
 * =========================================
 */

export function getProjectValidationSummary(value) {
  const project = normalizeProject(value);

  const activePublicMedia = project.media.filter(
    (mediaItem) =>
      mediaItem.status !== "archived" && mediaItem.visibility === "public",
  );

  const checks = [
    {
      id: "identity",
      complete: Boolean(project.title && project.role),
    },
    {
      id: "timeline",
      complete: Boolean(
        project.dates.startDate &&
        (project.dates.isCurrent ||
          project.dates.endDate ||
          !["completed", "cancelled"].includes(project.lifecycleStatus)),
      ),
    },
    {
      id: "problem",
      complete: Boolean(project.problem.statement),
    },
    {
      id: "importance",
      complete: Boolean(project.problem.importance),
    },
    {
      id: "solution",
      complete: Boolean(project.solution.overview),
    },
    {
      id: "contributions",
      complete: project.solution.contributions.length > 0,
    },
    {
      id: "results",
      complete: Boolean(
        project.results.outcome || project.lifecycleStatus !== "completed",
      ),
    },
    {
      id: "evidence",
      complete:
        project.results.metrics.length > 0 ||
        project.supportingDocuments.length > 0,
    },
    {
      id: "skills",
      complete: project.skillRelationships.length > 0,
    },
    {
      id: "technologies",
      complete: project.technologies.length > 0,
    },
    {
      id: "summary",
      complete: Boolean(project.presentation.shortSummary),
    },
    {
      id: "media",
      complete: activePublicMedia.length > 0,
    },
  ];

  const completedCount = checks.filter((check) => check.complete).length;

  const percentage = Math.round((completedCount / checks.length) * 100);

  let level = "Basic";

  if (percentage >= 90) {
    level = "Portfolio Ready";
  } else if (percentage >= 70) {
    level = "Strong";
  } else if (percentage >= 50) {
    level = "Developing";
  }

  return `${completedCount} of ${checks.length} professional elements completed · ${level}`;
}
