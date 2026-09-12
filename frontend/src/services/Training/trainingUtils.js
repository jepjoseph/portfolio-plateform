import {
  getTrainingCompletionStatusLabel,
  getTrainingDeliveryFormatLabel,
  getTrainingProviderTypeLabel,
  getTrainingSourceLabel,
  getTrainingStatusLabel,
  getTrainingTypeLabel,
} from "../../config/trainingConfig.js";

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

export function isActiveTraining(training) {
  return training?.status !== "archived";
}

export function isArchivedTraining(training) {
  return training?.status === "archived";
}

export function getActiveTraining(records = []) {
  return getArray(records).filter(isActiveTraining);
}

export function getArchivedTraining(records = []) {
  return getArray(records).filter(isArchivedTraining);
}

export function getTrainingTitle(training) {
  return getText(training?.title) || "Unnamed Training";
}

export function getTrainingProviderName(training) {
  return getText(training?.provider?.name) || "Provider not provided";
}

export function getTrainingTypeDisplay(training) {
  return getTrainingTypeLabel(training?.trainingType);
}

export function getTrainingProviderTypeDisplay(training) {
  return getTrainingProviderTypeLabel(training?.provider?.type);
}

export function getTrainingDeliveryFormatDisplay(training) {
  return getTrainingDeliveryFormatLabel(training?.delivery?.format);
}

export function getTrainingCompletionStatusDisplay(training) {
  return getTrainingCompletionStatusLabel(training?.completion?.status);
}

export function getTrainingSourceDisplay(training) {
  return getTrainingSourceLabel(training?.source);
}

export function getTrainingStatusDisplay(training) {
  return getTrainingStatusLabel(training?.status);
}

export function formatTrainingDate(
  value,
  { locale = "en-US", fallback = "" } = {},
) {
  const text = getText(value);

  const match = text.match(
    /^(\d{4})-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/,
  );

  if (!match) {
    return fallback;
  }

  const date = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      match[3] ? Number(match[3]) : 1,
    ),
  );

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatTrainingDateRange(training) {
  const startDate = formatTrainingDate(training?.dates?.startDate);

  const endDate = training?.dates?.isCurrent
    ? "Present"
    : formatTrainingDate(training?.dates?.endDate);

  if (startDate && endDate) {
    return `${startDate} – ${endDate}`;
  }

  return startDate || endDate || "Dates not provided";
}

export function formatTrainingLocation(training) {
  const location = training?.delivery?.location || {};

  if (getText(location.displayValue)) {
    return getText(location.displayValue);
  }

  return [
    getText(location.city),
    getText(location.stateRegion),
    getText(location.country),
  ]
    .filter(Boolean)
    .join(", ");
}

export function formatTrainingDuration(training) {
  const duration = Number(training?.completion?.durationHours);

  if (!Number.isFinite(duration) || duration < 0) {
    return "";
  }

  return `${duration} ${duration === 1 ? "hour" : "hours"}`;
}

export function createTrainingSearchText(training) {
  return [
    training?.title,
    training?.trainingType,
    training?.provider?.name,
    training?.provider?.type,
    training?.description,
    training?.completion?.status,
    training?.completion?.credentialId,
    formatTrainingLocation(training),
    getTrainingTypeDisplay(training),
    getTrainingProviderTypeDisplay(training),
    getTrainingDeliveryFormatDisplay(training),
    ...getArray(training?.instructors).flatMap((item) => [
      item?.name,
      item?.title,
      item?.organization,
    ]),
    ...getArray(training?.topics).flatMap((item) => [
      item?.name,
      item?.description,
    ]),
    ...getArray(training?.learningOutcomes).map((item) => item?.text),
    ...getArray(training?.skillRelationships).map(
      (item) => item?.nameSnapshot,
    ),
  ]
    .map(getText)
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC")
    .toLocaleLowerCase();
}

export function searchTraining(records = [], query = "") {
  const terms = getText(query)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    return [...getArray(records)];
  }

  return getArray(records).filter((training) => {
    const searchText = createTrainingSearchText(training);

    return terms.every((term) => searchText.includes(term));
  });
}

export function filterTraining(records = [], filters = {}) {
  const {
    trainingType = "all",
    providerType = "all",
    deliveryFormat = "all",
    completionStatus = "all",
    hasCredential = false,
    hasSkills = false,
  } = filters;

  return getArray(records).filter((training) => {
    if (
      trainingType !== "all" &&
      training?.trainingType !== trainingType
    ) {
      return false;
    }

    if (
      providerType !== "all" &&
      training?.provider?.type !== providerType
    ) {
      return false;
    }

    if (
      deliveryFormat !== "all" &&
      training?.delivery?.format !== deliveryFormat
    ) {
      return false;
    }

    if (
      completionStatus !== "all" &&
      training?.completion?.status !== completionStatus
    ) {
      return false;
    }

    if (
      hasCredential &&
      !training?.completion?.certificateEarned &&
      !getText(training?.completion?.credentialId) &&
      !getText(training?.completion?.credentialUrl)
    ) {
      return false;
    }

    if (
      hasSkills &&
      getArray(training?.skillRelationships).length === 0
    ) {
      return false;
    }

    return true;
  });
}

function getDateTime(value) {
  const time = new Date(value || 0).getTime();

  return Number.isFinite(time) ? time : 0;
}

export function sortTraining(records = [], sortOption = "newest") {
  const sorted = [...getArray(records)];

  sorted.sort((first, second) => {
    switch (sortOption) {
      case "oldest":
        return (
          getDateTime(first?.dates?.startDate) -
          getDateTime(second?.dates?.startDate)
        );

      case "title-ascending":
        return getTrainingTitle(first).localeCompare(
          getTrainingTitle(second),
          undefined,
          { sensitivity: "base" },
        );

      case "provider-ascending":
        return getTrainingProviderName(first).localeCompare(
          getTrainingProviderName(second),
          undefined,
          { sensitivity: "base" },
        );

      case "recently-updated":
        return (
          getDateTime(second?.updatedAt) -
          getDateTime(first?.updatedAt)
        );

      case "newest":
      default:
        if (
          first?.dates?.isCurrent !== second?.dates?.isCurrent
        ) {
          return first?.dates?.isCurrent ? -1 : 1;
        }

        return (
          getDateTime(
            second?.dates?.endDate || second?.dates?.startDate,
          ) -
          getDateTime(
            first?.dates?.endDate || first?.dates?.startDate,
          )
        );
    }
  });

  return sorted;
}

export function prepareTrainingCollection({
  trainingRecords = [],
  query = "",
  filters = {},
  sortOption = "newest",
} = {}) {
  return sortTraining(
    filterTraining(searchTraining(trainingRecords, query), filters),
    sortOption,
  );
}

export function getTrainingCompleteness(training) {
  const checks = [
    {
      id: "title",
      label: "Training title",
      complete: Boolean(getText(training?.title)),
      weight: 2,
    },
    {
      id: "provider",
      label: "Provider",
      complete: Boolean(getText(training?.provider?.name)),
      weight: 2,
    },
    {
      id: "dates",
      label: "Training dates",
      complete: Boolean(
        getText(training?.dates?.startDate) &&
          (training?.dates?.isCurrent ||
            getText(training?.dates?.endDate)),
      ),
      weight: 2,
    },
    {
      id: "description",
      label: "Description",
      complete: Boolean(getText(training?.description)),
      weight: 1,
    },
    {
      id: "topics",
      label: "Topics",
      complete: getArray(training?.topics).length > 0,
      weight: 1,
    },
    {
      id: "outcomes",
      label: "Learning outcomes",
      complete: getArray(training?.learningOutcomes).length > 0,
      weight: 1,
    },
    {
      id: "skills",
      label: "Related skills",
      complete: getArray(training?.skillRelationships).length > 0,
      weight: 1,
    },
    {
      id: "evidence",
      label: "Credential or supporting document",
      complete: Boolean(
        training?.completion?.certificateEarned ||
          getText(training?.completion?.credentialId) ||
          getText(training?.completion?.credentialUrl) ||
          getArray(training?.supportingDocuments).length > 0,
      ),
      weight: 1,
    },
  ];

  const maximumScore = checks.reduce(
    (total, check) => total + check.weight,
    0,
  );

  const score = checks.reduce(
    (total, check) => total + (check.complete ? check.weight : 0),
    0,
  );

  const percentage = Math.round((score / maximumScore) * 100);

  let level = "basic";
  let label = "Basic";

  if (percentage >= 90) {
    level = "excellent";
    label = "Excellent";
  } else if (percentage >= 70) {
    level = "strong";
    label = "Strong";
  } else if (percentage >= 50) {
    level = "developing";
    label = "Developing";
  }

  return {
    score,
    maximumScore,
    percentage,
    level,
    label,
    checks,
    completedChecks: checks.filter((check) => check.complete),
    missingChecks: checks.filter((check) => !check.complete),
  };
}

export function getTrainingStatistics(trainingRecords = []) {
  const collection = getArray(trainingRecords);

  const active = getActiveTraining(collection);

  const archived = getArchivedTraining(collection);

  return {
    total: collection.length,
    active: active.length,
    archived: archived.length,

    planned: active.filter(
      (training) => training.completion?.status === "planned",
    ).length,

    inProgress: active.filter(
      (training) => training.completion?.status === "in-progress",
    ).length,

    completed: active.filter(
      (training) => training.completion?.status === "completed",
    ).length,

    withCredentials: active.filter(
      (training) =>
        training.completion?.certificateEarned === true ||
        Boolean(getText(training.completion?.credentialId)) ||
        Boolean(getText(training.completion?.credentialUrl)),
    ).length,

    withSkills: active.filter(
      (training) =>
        getArray(training.skillRelationships).length > 0,
    ).length,

    withDocuments: active.filter(
      (training) =>
        getArray(training.supportingDocuments).length > 0,
    ).length,
  };
}