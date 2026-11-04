$ErrorActionPreference = 'Stop'
$root = 'D:\Documents\Project\Portfolio\portfolio-plateform'
$migrations = Join-Path $root 'backend\src\database\migrations'
$backupDir = Join-Path $root 'Persistence\backups'
$reportDir = Join-Path $root 'Persistence\reports'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
foreach ($dir in @($migrations, $backupDir, $reportDir)) {
    if (-not (Test-Path -LiteralPath $dir -PathType Container)) { throw "Missing required directory: $dir" }
}
$required = @('006_projects.sql','008_project_documents.sql','010_skills.sql')
foreach ($name in $required) {
    if (-not (Test-Path -LiteralPath (Join-Path $migrations $name) -PathType Leaf)) { throw "Missing reference migration: $name" }
}
$definitions = [ordered]@{}
$definitions['011_certifications.sql'] = @'
/*
 * Portfolio Platform - Certification Persistence Foundation
 * Migration 011. Do not add GO statements.
 * Stores metadata and versioned Certification JSON, not document bytes.
 */
CREATE TABLE dbo.certifications
(
    id NVARCHAR(200) NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(500) NOT NULL,
    certification_type NVARCHAR(100) NOT NULL,
    issuing_organization_name NVARCHAR(500) NOT NULL,
    status NVARCHAR(100) NOT NULL,
    certification_data NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2(3) NOT NULL
        CONSTRAINT DF_certifications_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL
        CONSTRAINT DF_certifications_updated_at DEFAULT SYSUTCDATETIME(),
    row_version ROWVERSION NOT NULL,
    CONSTRAINT PK_certifications PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_certifications_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT UQ_certifications_id_user UNIQUE (id, user_id),
    CONSTRAINT CK_certifications_id_not_blank CHECK (LEN(LTRIM(RTRIM(id))) > 0),
    CONSTRAINT CK_certifications_name_not_blank CHECK (LEN(LTRIM(RTRIM(name))) > 0),
    CONSTRAINT CK_certifications_type_not_blank CHECK (LEN(LTRIM(RTRIM(certification_type))) > 0),
    CONSTRAINT CK_certifications_status_not_blank CHECK (LEN(LTRIM(RTRIM(status))) > 0),
    CONSTRAINT CK_certifications_data_json CHECK (ISJSON(certification_data) = 1),
    CONSTRAINT CK_certifications_dates CHECK (updated_at >= created_at)
);
CREATE INDEX IX_certifications_user_status_updated
    ON dbo.certifications (user_id, status, updated_at DESC)
    INCLUDE (name, certification_type, issuing_organization_name);
CREATE INDEX IX_certifications_user_issuer
    ON dbo.certifications (user_id, issuing_organization_name)
    INCLUDE (name, certification_type, status);
'@
$definitions['012_certification_documents.sql'] = @'
/*
 * Portfolio Platform - Certification Document Metadata
 * Migration 012. Do not add GO statements.
 * Document bytes remain in private filesystem storage.
 */
CREATE TABLE dbo.certification_documents
(
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_certification_documents_id DEFAULT NEWID(),
    certification_id NVARCHAR(200) NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    storage_key NVARCHAR(500) NOT NULL,
    original_file_name NVARCHAR(255) NOT NULL,
    mime_type NVARCHAR(150) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at DATETIME2(3) NOT NULL
        CONSTRAINT DF_certification_documents_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_certification_documents PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_certification_documents_certification_owner
        FOREIGN KEY (certification_id, user_id)
        REFERENCES dbo.certifications(id, user_id),
    CONSTRAINT UQ_certification_documents_storage_key UNIQUE (storage_key),
    CONSTRAINT CK_certification_documents_storage_key
        CHECK (LEN(LTRIM(RTRIM(storage_key))) > 0),
    CONSTRAINT CK_certification_documents_original_file_name
        CHECK (LEN(LTRIM(RTRIM(original_file_name))) > 0),
    CONSTRAINT CK_certification_documents_file_size
        CHECK (file_size BETWEEN 1 AND 20971520),
    CONSTRAINT CK_certification_documents_mime_type
        CHECK (mime_type IN (
            N'application/pdf',
            N'application/msword',
            N'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            N'application/vnd.ms-powerpoint',
            N'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            N'application/vnd.ms-excel',
            N'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            N'text/plain', N'text/markdown', N'text/csv',
            N'application/json', N'application/zip',
            N'image/jpeg', N'image/png', N'image/webp'
        ))
);
CREATE INDEX IX_certification_documents_certification_created
    ON dbo.certification_documents (certification_id, created_at DESC);
CREATE INDEX IX_certification_documents_user_certification
    ON dbo.certification_documents (user_id, certification_id);
'@
$utf8 = New-Object System.Text.UTF8Encoding($false)
$created = New-Object System.Collections.Generic.List[string]
try {
    foreach ($entry in $definitions.GetEnumerator()) {
        $target = Join-Path $migrations $entry.Key
        if (Test-Path -LiteralPath $target) {
            $existing = [System.IO.File]::ReadAllText($target)
            if ($existing.Trim() -ne $entry.Value.Trim()) {
                throw "Existing migration differs. No overwrite permitted: $target"
            }
            Write-Host "Already exists and matches: $($entry.Key)" -ForegroundColor Yellow
            continue
        }
        [System.IO.File]::WriteAllText($target, $entry.Value.Trim() + "`r`n", $utf8)
        $created.Add($target)
        Write-Host "Created: $target" -ForegroundColor Green
    }
    foreach ($entry in $definitions.GetEnumerator()) {
        $target = Join-Path $migrations $entry.Key
        $content = [System.IO.File]::ReadAllText($target)
        if ($content -match '(?m)^\s*GO\s*$') { throw "GO batch separator found: $target" }
        if ($content -notmatch 'CREATE TABLE dbo\.') { throw "Missing CREATE TABLE: $target" }
    }
    $report = Join-Path $reportDir "certification-migrations-$stamp.txt"
    $lines = @("Created/validated at $(Get-Date -Format o)", 'Migration execution: NOT RUN', 'Database changes: NONE')
    foreach ($entry in $definitions.GetEnumerator()) {
        $target = Join-Path $migrations $entry.Key
        $hash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
        $lines += "$($entry.Key) SHA256 $hash"
    }
    [System.IO.File]::WriteAllLines($report, $lines, $utf8)
    Write-Host "Validation passed. Report: $report" -ForegroundColor Cyan
    Write-Host 'SQL migrations have NOT been executed.' -ForegroundColor Yellow
} catch {
    foreach ($path in $created) {
        if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
    }
    throw
}
