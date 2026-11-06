/*
 * Portfolio Platform
 * Training Schema Verification
 *
 * Read-only inspection for migration 013.
 */

-- 1. Database and table existence
SELECT
    DB_NAME() AS database_name,
    OBJECT_ID(N'dbo.trainings', N'U') AS training_table_id;

-- 2. Training table columns
SELECT
    c.column_id,
    c.name AS column_name,
    TYPE_NAME(c.user_type_id) AS data_type,
    c.max_length,
    c.is_nullable
FROM sys.columns AS c
WHERE c.object_id = OBJECT_ID(N'dbo.trainings', N'U')
ORDER BY c.column_id;

-- 3. Training table indexes
SELECT
    i.name AS index_name,
    i.type_desc,
    i.is_unique
FROM sys.indexes AS i
WHERE i.object_id = OBJECT_ID(N'dbo.trainings', N'U')
  AND i.name IS NOT NULL
ORDER BY i.index_id;

-- 4. Training check constraints
SELECT
    cc.name AS constraint_name,
    cc.definition
FROM sys.check_constraints AS cc
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.trainings', N'U');

-- 5. Applied migration record
SELECT
    migration_id,
    applied_at
FROM dbo.schema_migrations
WHERE migration_id = N'013_trainings.sql';