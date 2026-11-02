"use strict";

const fs = require("node:fs");

const target = process.argv[2];

if (!target) {
  throw new Error("Missing target file.");
}

const original = fs.readFileSync(target, "utf8");
let source = original;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function replaceOnce(text, before, after, label) {
  const first = text.indexOf(before);

  assert(first >= 0, `Missing expected code: ${label}`);
  assert(
    text.indexOf(before, first + before.length) === -1,
    `Ambiguous code: ${label}`
  );

  return text.slice(0, first) + after +
    text.slice(first + before.length);
}

function callbackSection(name) {
  const marker = `  const ${name} = useCallback(`;
  const start = source.indexOf(marker);

  assert(start >= 0, `Missing callback: ${name}`);

  const remaining = source.slice(start);

  const matches = [
    ...remaining.matchAll(/^  const [A-Za-z_$][\w$]*\s*=/gm)
  ];

  assert(matches.length >= 2,
    `Unable to locate callback boundary: ${name}`);

  const end = start + matches[1].index;

  return {
    start,
    end,
    text: source.slice(start, end)
  };
}

function updateCallback(name, transform) {
  const section = callbackSection(name);
  const updated = transform(section.text);

  assert(
    updated !== section.text,
    `No changes generated for ${name}`
  );

  source =
    source.slice(0, section.start) +
    updated +
    source.slice(section.end);

  console.log(`Updated: ${name}`);
}

function protectMutation(name, serviceResult, serviceName, errorName) {
  updateCallback(name, (section) => {
    let next = section;

    // Capture the authenticated session before starting work.
    next = replaceOnce(
      next,
      "    try {",
      "    const request = captureRequest();\n\n    try {",
      `${name} request capture`
    );

    // Find the exact service call assignment, including multiline calls.
    const assignmentPattern = new RegExp(
      `const ${serviceResult} = await ${serviceName}\\([\\s\\S]*?\\);`
    );

    const matches = [...next.matchAll(
      new RegExp(assignmentPattern.source, "g")
    )];

    assert(
      matches.length === 1,
      `Expected one service assignment in ${name}; found ${matches.length}`
    );

    const assignment = matches[0][0];

    next = replaceOnce(
      next,
      assignment,
      assignment +
        `\n\n      if (!isRequestCurrent(request)) {\n` +
        `        return ${serviceResult};\n` +
        `      }\n\n` +
        `      refreshGenerationRef.current += 1;`,
      `${name} stale response guard`
    );

    // Prevent an old session's error from changing current UI state.
    const catchMarker = `} catch (${errorName}) {`;
    const catchStart = next.indexOf(catchMarker);

    assert(catchStart >= 0, `Missing catch block: ${name}`);

    const throwMarker = `throw ${errorName};`;
    const throwStart = next.indexOf(
      throwMarker,
      catchStart + catchMarker.length
    );

    assert(throwStart >= 0, `Missing catch throw: ${name}`);

    const errorUpdates = next.slice(
      catchStart + catchMarker.length,
      throwStart
    );

    next =
      next.slice(0, catchStart + catchMarker.length) +
      "\n      if (isRequestCurrent(request)) {" +
      errorUpdates +
      "      }\n\n      " +
      next.slice(throwStart);

    // Include request helpers in the callback dependencies.
    next = replaceOnce(
      next,
      "}, []);",
      "}, [captureRequest, isRequestCurrent]);",
      `${name} dependencies`
    );

    return next;
  });
}

// ============================================================
// 4. Session-safe refresh
// ============================================================

updateCallback("refreshSkills", () => `
  const refreshSkills = useCallback(
    async ({ includeArchived = true, showLoading = true } = {}) => {
      const request = captureRequest();
      const refreshGeneration = ++refreshGenerationRef.current;

      const isCurrentRefresh = () =>
        isRequestCurrent(request) &&
        refreshGeneration === refreshGenerationRef.current;

      try {
        if (showLoading && isCurrentRefresh()) {
          setIsLoading(true);
          setLoadStatus("loading");
        }

        if (isCurrentRefresh()) {
          setError(null);
        }

        const loadedSkills = await getSkillsService({
          includeArchived,
        });

        const nextSkills = sortSkillLibrary(
          Array.isArray(loadedSkills) ? loadedSkills : [],
        );

        if (isCurrentRefresh()) {
          setSkills(nextSkills);
          setLoadStatus("success");
        }

        return nextSkills;
      } catch (loadError) {
        if (isCurrentRefresh()) {
          console.error("Unable to load skills:", loadError);
          setLoadStatus("error");
          setError(normalizeSkillContextError(loadError));
        }

        throw loadError;
      } finally {
        if (showLoading && isCurrentRefresh()) {
          setIsLoading(false);
        }
      }
    },
    [captureRequest, isRequestCurrent],
  );

`);

// ============================================================
// 5. Session-safe getSkillById
// ============================================================

updateCallback("getSkillById", (section) => {
  let next = section;

  next = replaceOnce(
    next,
    "      const existingSkill = skills.find(",
    "      const request = captureRequest();\n\n" +
      "      const existingSkill = skills.find(",
    "getSkillById request capture"
  );

  next = replaceOnce(
    next,
    "        setError(null);\n\n        return await getSkillByIdService(skillId);",
    `        if (isRequestCurrent(request)) {
          setError(null);
        }

        return await getSkillByIdService(skillId);`,
    "getSkillById request handling"
  );

  next = replaceOnce(
    next,
    "        setError(normalizeSkillContextError(getError));",
    `        if (isRequestCurrent(request)) {
          setError(normalizeSkillContextError(getError));
        }`,
    "getSkillById error guard"
  );

  next = replaceOnce(
    next,
    "[skills],",
    "[skills, captureRequest, isRequestCurrent],",
    "getSkillById dependencies"
  );

  return next;
});

// ============================================================
// 6. Session-safe mutations
// ============================================================

protectMutation(
  "createSkill",
  "createdSkill",
  "createSkillService",
  "createError"
);

protectMutation(
  "findOrCreateSkill",
  "result",
  "findOrCreateSkillService",
  "operationError"
);

protectMutation(
  "archiveSkill",
  "archivedSkill",
  "archiveSkillService",
  "archiveError"
);

protectMutation(
  "restoreSkill",
  "restoredSkill",
  "restoreSkillService",
  "restoreError"
);

protectMutation(
  "deleteSkill",
  "deletionResult",
  "deleteSkillService",
  "deleteError"
);

protectMutation(
  "replaceSkills",
  "replaced",
  "replaceSkillsService",
  "replaceError"
);

// ============================================================
// 7. Coordinate initial load with refreshes
// ============================================================

source = replaceOnce(
  source,
  "    const generation = ++requestGenerationRef.current;",
  `    const generation = ++requestGenerationRef.current;
    const refreshGeneration = ++refreshGenerationRef.current;`,
  "initial load generation"
);

const initialLoadStart = source.indexOf("  useEffect(() => {");
const initialLoadEnd = source.indexOf(
  "  const getSkillById = useCallback(",
  initialLoadStart
);

assert(initialLoadStart >= 0 && initialLoadEnd > initialLoadStart,
  "Unable to locate initial Skills loading effect.");

let initialLoad = source.slice(initialLoadStart, initialLoadEnd);

const oldCheck =
  "generation !== requestGenerationRef.current";

const newCheck =
  "(generation !== requestGenerationRef.current || " +
  "refreshGeneration !== refreshGenerationRef.current)";

const oldChecks = initialLoad.split(oldCheck).length - 1;

assert(
  oldChecks === 2,
  `Expected two initial-load stale checks; found ${oldChecks}`
);

initialLoad = initialLoad.split(oldCheck).join(newCheck);

initialLoad = replaceOnce(
  initialLoad,
  "generation === requestGenerationRef.current",
  "(generation === requestGenerationRef.current && " +
    "refreshGeneration === refreshGenerationRef.current)",
  "initial load finally guard"
);

source =
  source.slice(0, initialLoadStart) +
  initialLoad +
  source.slice(initialLoadEnd);

// ============================================================
// 8. Additional source integrity checks
// ============================================================

const required = [
  "const captureRequest = useCallback(",
  "const isRequestCurrent = useCallback(",
  "const refreshSkills = useCallback(",
  "const getSkillById = useCallback(",
  "const createSkill = useCallback(",
  "const updateSkill = useCallback(",
  "const findOrCreateSkill = useCallback(",
  "const archiveSkill = useCallback(",
  "const restoreSkill = useCallback(",
  "const deleteSkill = useCallback(",
  "const replaceSkills = useCallback(",
  "export function useSkillData()"
];

for (const item of required) {
  assert(source.includes(item), `Required code missing: ${item}`);
}

assert(source !== original, "No source changes generated.");

// Only write after all source checks pass.
fs.writeFileSync(target, source, "utf8");

console.log("Skills context patch written successfully.");