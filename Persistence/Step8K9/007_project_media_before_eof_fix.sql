/*
 * Portfolio Platform
 * Project Media Metadata
 * Migration 007
 *
 * Stores metadata only. Uploaded file bytes remain
 * in private filesystem storage.
 *
 * Do not add GO statements to migration files.
 */

ALTER TABLE dbo.projects
ADD CONSTRAINT UQ_projects_id_user
UNIQUE (id, user_id);

CREATE TABLE dbo.project_media
(
    id UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_project_media_id DEFAULT NEWID(),

    project_id NVARCHAR(200) NOT NULL,

    user_id UNIQUEIDENTIFIER NOT NULL,

    storage_key NVARCHAR(500) NOT NULL,

    original_file_name NVARCHAR(255) NOT NULL,

    mime_type NVARCHAR(100) NOT NULL,

    file_size BIGINT NOT NULL,

    created_at DATETIME2(3) NOT NULL
        CONSTRAINT DF_project_media_created_at
        DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_project_media
        PRIMARY KEY CLUSTERED (id),

    CONSTRAINT FK_project_media_project_owner
        FOREIGN KEY (project_id, user_id)
        REFERENCES dbo.projects(id, user_id),

    CONSTRAINT UQ_project_media_storage_key
        UNIQUE (storage_key),

    CONSTRAINT CK_project_media_file_size
        CHECK (
            (mime_type IN (
                N'image/jpeg',
                N'image/png',
                N'image/webp',
                N'image/avif',
                N'image/gif'
            ) AND file_size BETWEEN 1 AND 20971520)
            OR
            (mime_type IN (
                N'video/mp4',
                N'video/webm'
            ) AND file_size BETWEEN 1 AND 104857600)
        ),

    CONSTRAINT CK_project_media_mime_type
        CHECK (
            mime_type IN (
                N'image/jpeg',
                N'image/png',
                N'image/webp',
                N'image/avif',
                N'image/gif',
                N'video/mp4',
                N'video/webm'
            )
        ),

    CONSTRAINT CK_project_media_storage_key
        CHECK (
            LEN(LTRIM(RTRIM(storage_key))) > 0
        ),

    CONSTRAINT CK_project_media_original_file_name
        CHECK (
            LEN(LTRIM(RTRIM(original_file_name))) > 0
        )
);

CREATE INDEX IX_project_media_project_created
    ON dbo.project_media (project_id, created_at DESC);

CREATE INDEX IX_project_media_user_project
    ON dbo.project_media (user_id, project_id);


