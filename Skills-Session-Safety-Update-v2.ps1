#requires -Version 5.1
$ErrorActionPreference = "Stop"

# ============================================================
# SKILLS SESSION SAFETY - PATCH REPAIR V2
#
# Repairs the callback-boundary defect in the existing
# Skills-Session-Safety-Update.ps1 script.
#
# Does not modify the original update script.
# Does not directly modify application source files.
#
# The repaired script performs its own:
# - Source verification
# - Backup
# - Skills context update
# - Tests, lint, and build
# - Rollback on failure
# ============================================================

# ------------------------------------------------------------
# 1. Project paths
# ------------------------------------------------------------

$root = "D:\Documents\Project\Portfolio\portfolio-plateform"

$originalScript = Join-Path `
    $root "Skills-Session-Safety-Update.ps1"

$repairedScript = Join-Path `
    $root "Skills-Session-Safety-Update-v2-generated.ps1"

$skillFile = Join-Path `
    $root "frontend\src\context\SkillDataContext.jsx"

$reportDir = Join-Path `
    $root "Persistence\reports"

$expectedHash = "B42E672A7204FF77A49E480F5A68EB41DC8A8BC448D27FE30B8209D130D8DA53"

# ------------------------------------------------------------
# 2. Verify required files
# ------------------------------------------------------------

foreach ($file in @($originalScript, $skillFile)) {

    if (!(Test-Path -LiteralPath $file -PathType Leaf)) {
        throw "Required file not found: $file"
    }
}

New-Item -ItemType Directory `
    -Path $reportDir `
    -Force | Out-Null

# ------------------------------------------------------------
# 3. Verify Skills context source version
# ------------------------------------------------------------

function Get-NormalizedHash {
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    $content = [System.IO.File]::ReadAllText($Path)

    $normalized = $content.Replace(
        "`r`n", "`n"
    ).Replace(
        "`r", "`n"
    )

    $bytes = [System.Text.Encoding]::UTF8.GetBytes(
        $normalized
    )

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

$currentHash = Get-NormalizedHash -Path $skillFile

Write-Host "`n=== SOURCE VERIFICATION ===" `
    -ForegroundColor Cyan

Write-Host "Expected: $expectedHash"
Write-Host "Actual:   $currentHash"

if ($currentHash -ne $expectedHash) {
    throw @"
Skills source does not match the verified original version.

No changes have been made.

Do not run the patch against an unexpected source version.
"@
}

Write-Host "PASS: Source version verified." `
    -ForegroundColor Green

# ------------------------------------------------------------
# 4. Load original update script
# ------------------------------------------------------------

$scriptContent = [System.IO.File]::ReadAllText(
    $originalScript
)

# Normalize line endings for predictable matching.
$scriptContent = $scriptContent.Replace(
    "`r`n", "`n"
).Replace(
    "`r", "`n"
)

# ------------------------------------------------------------
# 5. Correct callback-boundary detection
# ------------------------------------------------------------

# OLD:
# Only detects top-level const declarations.
#
# PROBLEM:
# refreshSkills is followed by useEffect, not another const.
# Therefore the patcher accidentally removes the effect.
#
# NEW:
# Detects both top-level const declarations and useEffect.
# This preserves the initial Skills loading effect.

$oldBoundary = @'
    ...remaining.matchAll(/^  const [A-Za-z_$][\w$]*\s*=/gm)
'@

$newBoundary = @'
    ...remaining.matchAll(/^  (?:const [A-Za-z_$][\w$]*\s*=|useEffect\s*\()/gm)
'@

$occurrences = [regex]::Matches(
    $scriptContent,
    [regex]::Escape($oldBoundary)
).Count

if ($occurrences -ne 1) {
    throw @"
Expected exactly one callback-boundary expression.

Found: $occurrences

The existing update script differs from the version
being repaired. No files have been modified.
"@
}

$scriptContent = $scriptContent.Replace(
    $oldBoundary,
    $newBoundary
)

# ------------------------------------------------------------
# 6. Verify the repair before saving
# ------------------------------------------------------------

if ($scriptContent.Contains($oldBoundary)) {
    throw "Old callback-boundary expression remains."
}

if (!$scriptContent.Contains($newBoundary)) {
    throw "New callback-boundary expression was not installed."
}

$requiredMarkers = @(
    'function callbackSection(name)',
    'updateCallback("refreshSkills"',
    'updateCallback("getSkillById"',
    'protectMutation(',
    'initial load generation',
    'Rollback verification failed'
)

foreach ($marker in $requiredMarkers) {

    if (!$scriptContent.Contains($marker)) {
        throw "Expected update-script marker missing: $marker"
    }
}

# ------------------------------------------------------------
# 7. Save corrected script
# ------------------------------------------------------------

# Do not overwrite a previously generated V2 script.
if (Test-Path -LiteralPath $repairedScript) {
    throw @"
A generated V2 script already exists:

$repairedScript

Review or rename that file before generating another copy.
"@
}

$utf8 = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
    $repairedScript,
    $scriptContent,
    $utf8
)

Write-Host "`n=== PATCH REPAIR COMPLETED ===" `
    -ForegroundColor Green

Write-Host "Original script: $originalScript"
Write-Host "Corrected copy: $repairedScript"

# ------------------------------------------------------------
# 8. Run corrected update
# ------------------------------------------------------------

Write-Host "`n=== RUNNING CORRECTED UPDATE ===" `
    -ForegroundColor Cyan

Write-Host "The corrected script will now:"
Write-Host "  - Verify the source"
Write-Host "  - Back up SkillDataContext.jsx"
Write-Host "  - Apply the session-safety patch"
Write-Host "  - Run validation"
Write-Host "  - Restore the backup if validation fails"

# The caller must have enabled script execution for this
# PowerShell session, as done previously.

& $repairedScript

# ------------------------------------------------------------
# 9. Verify script completion
# ------------------------------------------------------------

Write-Host "`n=== FINAL STATUS ===" `
    -ForegroundColor Cyan

$finalHash = Get-NormalizedHash -Path $skillFile

Write-Host "Original hash: $expectedHash"
Write-Host "Current hash:  $finalHash"

if ($finalHash -eq $expectedHash) {

    Write-Host @"

The Skills source is unchanged.

This can indicate a rollback or an update that made
no changes. Review the update script output above.

"@ -ForegroundColor Yellow

}
else {

    Write-Host @"

The Skills source differs from the original.

Review the validation output above to confirm that
all tests, lint, and build checks passed.

"@ -ForegroundColor Green

}

Write-Host "Do not commit until browser testing is complete." `
    -ForegroundColor Cyan