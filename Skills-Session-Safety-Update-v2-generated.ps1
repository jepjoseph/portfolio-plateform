#requires -Version 5.1
$ErrorActionPreference = "Stop"

# ============================================================
# SKILLS SESSION SAFETY UPDATE
# Portfolio Platform
#
# - Verifies original source
# - Creates backup
# - Updates Skills callbacks
# - Protects asynchronous session state
# - Validates tests, lint, and build
# - Restores original source on failure
# ============================================================

$root = "D:\Documents\Project\Portfolio\portfolio-plateform"
$frontend = Join-Path $root "frontend"
$target = Join-Path $frontend "src\context\SkillDataContext.jsx"

$backupRoot = Join-Path $root "Persistence\backups\Skills"
$reportRoot = Join-Path $root "Persistence\reports"

$expectedHash = "B42E672A7204FF77A49E480F5A68EB41DC8A8BC448D27FE30B8209D130D8DA53"

# ============================================================
# 1. Verify prerequisites
# ============================================================

if (!(Test-Path -LiteralPath $target -PathType Leaf)) {
    throw "Skills context not found: $target"
}

if (!(Test-Path -LiteralPath (Join-Path $frontend "package.json"))) {
    throw "Frontend package.json not found."
}

foreach ($command in @("node.exe", "npm.cmd")) {
    if (!(Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $command"
    }
}

function Get-NormalizedHash {
    param([string]$Value)

    $normalized = $Value.Replace("`r`n", "`n").Replace("`r", "`n")
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($normalized)

    $sha = [System.Security.Cryptography.SHA256]::Create()

    try {
        return [BitConverter]::ToString(
            $sha.ComputeHash($bytes)
        ).Replace("-", "")
    }
    finally {
        $sha.Dispose()
    }
}

$original = [System.IO.File]::ReadAllText($target)
$originalHash = Get-NormalizedHash $original

if ($originalHash -ne $expectedHash) {
    throw @"
Source version mismatch.

Expected: $expectedHash
Actual:   $originalHash

No application files were modified.
Do not run this patch against a different source version.
"@
}

# ============================================================
# 2. Create verified backup
# ============================================================

New-Item -ItemType Directory -Force `
    -Path $backupRoot, $reportRoot | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $backupRoot "session-safety-$stamp"

New-Item -ItemType Directory -Force `
    -Path $backupDir | Out-Null

$backup = Join-Path $backupDir "SkillDataContext.jsx"
$patcher = Join-Path $backupDir "apply-skills-session-safety.cjs"
$report = Join-Path $reportRoot "skills-session-safety-$stamp.txt"

Copy-Item -LiteralPath $target -Destination $backup

$backupHash = Get-NormalizedHash (
    [System.IO.File]::ReadAllText($backup)
)

if ($backupHash -ne $originalHash) {
    throw "Backup verification failed. No changes made."
}

Write-Host "Backup verified: $backup" -ForegroundColor Green

# ============================================================
# 3. Generate targeted JavaScript patcher
# ============================================================

$patcherCode = @'
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
    ...remaining.matchAll(/^  (?:const [A-Za-z_$][\w$]*\s*=|useEffect\s*\()/gm)
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
'@

[System.IO.File]::WriteAllText(
    $patcher,
    $patcherCode,
    [System.Text.UTF8Encoding]::new($false)
)

# ============================================================
# 9. Apply patch and validate
# ============================================================

$changed = $false
$reportLines = [System.Collections.Generic.List[string]]::new()

$reportLines.Add("Target: $target")
$reportLines.Add("Backup: $backup")
$reportLines.Add("Original normalized SHA256: $originalHash")

try {
    Write-Host "`n=== Applying Skills session-safety patch ===" `
        -ForegroundColor Cyan

    # Mark as potentially changed before executing the patcher.
    $changed = $true

    & node.exe $patcher $target

    if ($LASTEXITCODE -ne 0) {
        throw "Skills patcher failed."
    }

    $updated = [System.IO.File]::ReadAllText($target)

    if ((Get-NormalizedHash $updated) -eq $originalHash) {
        throw "Source was not updated."
    }

    Write-Host "`n=== Running validation ===" `
        -ForegroundColor Cyan

    Push-Location $frontend

    try {
        $checks = @(
            @{
                Name = "Skills API and remote service tests"
                Command = "node.exe"
                Arguments = @(
                    "--test",
                    "tests/Skill/skillApiService.test.mjs",
                    "tests/Skill/skillRemoteService.test.mjs"
                )
            },
            @{
                Name = "ESLint"
                Command = "npm.cmd"
                Arguments = @("run", "lint")
            },
            @{
                Name = "Production build"
                Command = "npm.cmd"
                Arguments = @("run", "build")
            }
        )

        foreach ($check in $checks) {
            Write-Host "`n=== $($check.Name) ===" `
                -ForegroundColor Cyan

            & $check.Command @($check.Arguments)

            $exitCode = $LASTEXITCODE

            $reportLines.Add(
                "$($check.Name): exit code $exitCode"
            )

            if ($exitCode -ne 0) {
                throw "$($check.Name) failed with exit code $exitCode"
            }
        }
    }
    finally {
        Pop-Location
    }

    $finalHash = Get-NormalizedHash (
        [System.IO.File]::ReadAllText($target)
    )

    $reportLines.Add("Updated normalized SHA256: $finalHash")
    $reportLines.Add("RESULT: PASS")

    Write-Host "`n========================================" `
        -ForegroundColor Green
    Write-Host "SKILLS UPDATE VALIDATION PASSED" `
        -ForegroundColor Green
    Write-Host "========================================" `
        -ForegroundColor Green

    Write-Host "Updated: $target"
    Write-Host "Backup: $backup"
}
catch {
    $reportLines.Add("RESULT: FAILED")
    $reportLines.Add("Error: $($_.Exception.Message)")

    if ($changed) {
        Copy-Item -LiteralPath $backup `
            -Destination $target -Force

        $restoredHash = Get-NormalizedHash (
            [System.IO.File]::ReadAllText($target)
        )

        if ($restoredHash -ne $originalHash) {
            throw "Rollback verification failed. Check backup: $backup"
        }

        $reportLines.Add("Rollback: VERIFIED")

        Write-Host "`nOriginal Skills context restored." `
            -ForegroundColor Yellow
    }

    throw
}
finally {
    $reportLines | Set-Content `
        -LiteralPath $report `
        -Encoding UTF8

    Write-Host "`nReport: $report" -ForegroundColor Cyan
}

Write-Host "`nNext: Browser session and Skills CRUD verification." `
    -ForegroundColor Green