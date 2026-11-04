$ErrorActionPreference = 'Stop'
$root = 'D:\Documents\Project\Portfolio\portfolio-plateform'
$backend = Join-Path $root 'backend'
$working = Join-Path $backend 'scripts\importWEB101Certification.transactional.js'
$original = Join-Path $backend 'scripts\importWEB101Certification.js'
$backupJson = Join-Path $root 'Persistence\backups\Certification\WEB101-certification-migration-backup.json'
$backupPdf = Join-Path $root 'Persistence\backups\Certification\9b0c369a-69f0-4c4d-9079-2faad2a809b9 (1).pdf'
$reportDir = Join-Path $root 'Persistence\reports'
$runner = Join-Path $PSScriptRoot 'web101-isolated-tests.mjs'
$checks = @(
    @{Path=$working;Hash='706CBCB1E5605C7AEE6E0DFA52F4891E2F5E8B1633DDB3C9694427119B843646'},
    @{Path=$original;Hash='24F62972D6CB12A3D3B4995A7D6B7766D3AC2A44F0FEC7DFE5EAD494F824BFCE'},
    @{Path=$backupJson;Hash='00581D380C8EEAA564A59D64FB4C07D5AEB1CDB69F174EB5EDE754429B7A4562'},
    @{Path=$backupPdf;Hash='5435366AB3792A77AA4E84A3DAEFD72C127F20B0ABE1E024EC5E46BB5BDED67F'}
)
$results = New-Object System.Collections.Generic.List[string]
$failures = 0
function Record([string]$label,[string]$status,[string]$details='') {
    $line = "$status | $label | $details"
    $script:results.Add($line)
    if ($status -eq 'FAIL') { $script:failures++ }
    Write-Host $line
}
function Verify-Hashes {
    foreach ($entry in $checks) {
        if (-not (Test-Path -LiteralPath $entry.Path -PathType Leaf)) { throw "Missing: $($entry.Path)" }
        $actual = (Get-FileHash -LiteralPath $entry.Path -Algorithm SHA256).Hash
        if ($actual -ne $entry.Hash) { throw "Checksum mismatch: $($entry.Path)" }
    }
}
function Invoke-Node([string]$label,[string[]]$arguments,[string]$cwd) {
    $stdout = Join-Path $env:TEMP ("web101-out-" + [guid]::NewGuid().ToString('N') + '.txt')
    $stderr = Join-Path $env:TEMP ("web101-err-" + [guid]::NewGuid().ToString('N') + '.txt')
    try {
        $p = Start-Process -FilePath 'node.exe' -ArgumentList $arguments -WorkingDirectory $cwd -Wait -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
        $out = [System.IO.File]::ReadAllText($stdout)
        $err = [System.IO.File]::ReadAllText($stderr)
        if ($out) { Write-Host $out }
        if ($err) { Write-Host $err }
        if ($p.ExitCode -ne 0) { Record $label 'FAIL' "Exit code $($p.ExitCode)"; return $false }
        Record $label 'PASS'
        return $true
    }
    finally {
        Remove-Item -LiteralPath $stdout,$stderr -Force -ErrorAction SilentlyContinue
    }
}
if (-not (Test-Path -LiteralPath $reportDir -PathType Container)) { throw "Reports directory missing: $reportDir" }
$report = Join-Path $reportDir ('web101-consolidated-test-results-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.txt')
if (Test-Path -LiteralPath $report) { throw 'Report already exists.' }
try {
    Verify-Hashes
    Record 'Source files and backups SHA256' 'PASS'
    if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) { throw "Test runner missing: $runner" }
    Set-Location $backend
    $ok = Invoke-Node 'Importer syntax' @('--check',$working) $backend
    if (-not $ok) { throw 'Syntax check failed. Stop.' }
    $ok = Invoke-Node 'Actual-function filesystem and mocked SQL tests' @($runner,$working) $backend
    if (-not $ok) { throw 'Isolated function tests failed. Stop.' }
    $envFile = Join-Path $backend '.env'
    if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
        Record 'Azure SQL read-only dry run' 'SKIP' '.env not present'
    }
    else {
        $ok = Invoke-Node 'Azure SQL read-only dry run' @('--env-file=.env','scripts/importWEB101Certification.transactional.js','--dry-run') $backend
        if (-not $ok) { throw 'Azure SQL dry run failed. Stop.' }
    }
    Verify-Hashes
    Record 'Final source integrity' 'PASS'
}
catch {
    Record 'Suite execution' 'FAIL' $_.Exception.Message
}
finally {
    $lines = @('WEB101 CONSOLIDATED MIGRATION TEST REPORT',('Date: '+(Get-Date).ToString('o')),'Production migration: NOT EXECUTED','Apply mode: NOT ENABLED','SQL mock tests: no live writes','') + @($results)
    [System.IO.File]::WriteAllLines($report,[string[]]$lines,[System.Text.UTF8Encoding]::new($false))
    Write-Host "`nReport: $report"
    Write-Host "Failures: $failures"
}
if ($failures -gt 0) { exit 1 }
Write-Host 'SUITE COMPLETED: all executed checks passed.' -ForegroundColor Green
