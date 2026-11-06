# "D:\Documents\Project\Portfolio\portfolio-plateform\Persistence\reports\database-schema-full-20261103-125131.txt

PS D:\Documents\Project\Portfolio\portfolio-plateform\backend> $ErrorActionPreference = "Stop"
>> 
>> Set-Location "D:\Documents\Project\Portfolio\portfolio-plateform\backend"
>> 
>> @'
>> import "dotenv/config";
>> import { getDatabasePool, closeDatabase } from "./src/config/database.js";
>> 
>> async function main() {
>>   try {
>>     const pool = await getDatabasePool();
>> 
>>     const tables = await pool.request().query(`
>>       SELECT
>>         TABLE_NAME
>>       FROM INFORMATION_SCHEMA.TABLES
>>       WHERE TABLE_SCHEMA = 'dbo'
>>         AND TABLE_NAME IN (
>>           'certifications',
>>           'certification_documents'
>>         )
>>       ORDER BY TABLE_NAME;
>>     `);
>> 
>>     console.log("\n=== CERTIFICATION TABLES ===");
>>     console.table(tables.recordset);
>> 
>>     const columns = await pool.request().query(`
>>       SELECT
>>         TABLE_NAME,
>>         COLUMN_NAME,
>>         DATA_TYPE,
>>         CHARACTER_MAXIMUM_LENGTH,
>>         IS_NULLABLE
>>       FROM INFORMATION_SCHEMA.COLUMNS
>>       WHERE TABLE_SCHEMA = 'dbo'
>>         AND TABLE_NAME IN (
>>           'certifications',
>>           'certification_documents'
>>         )
>>       ORDER BY TABLE_NAME, ORDINAL_POSITION;
>>     `);
>> 
>>     console.log("\n=== TABLE COLUMNS ===");
>>     console.table(columns.recordset);
>> 
>>     const migrations = await pool.request().query(`
>>       SELECT migration_id, applied_at
>>       FROM dbo.schema_migrations
>>       WHERE migration_id IN (
>>         '011_certifications.sql',
>>         '012_certification_documents.sql'
>>       )
>>       ORDER BY migration_id;
>>     `);
>> 
>>     console.log("\n=== MIGRATION HISTORY ===");
>>     console.table(migrations.recordset);
>> 
>>     const constraints = await pool.request().query(`
>>       SELECT
>>         OBJECT_NAME(parent_object_id) AS table_name,
>>         name AS constraint_name,
>>         type_desc
>>       FROM sys.objects
>>       WHERE parent_object_id IN (
>>         OBJECT_ID('dbo.certifications'),
>>         OBJECT_ID('dbo.certification_documents')
>>       )
>>         AND type IN ('PK', 'F', 'UQ', 'C')
>>       ORDER BY table_name, constraint_name;
>>     `);
>> 
>>     console.log("\n=== CONSTRAINTS ===");
>>     console.table(constraints.recordset);
>> 
>>   } finally {
>>     await closeDatabase();
>>   }
>> }
>> 
>> main().catch(error => {
>>   console.error(error);
>>   process.exitCode = 1;
>> });
>> '@ | node --input-type=module
>> 
>> if ($LASTEXITCODE -ne 0) {
>>     throw "Certification database verification failed."
>> }
Connected to SQL Server database "portfolio-platform-db" on portfolio-platform-sv.database.windows.net.

=== CERTIFICATION TABLES ===
┌─────────┬───────────────────────────┐
│ (index) │ TABLE_NAME                │
├─────────┼───────────────────────────┤
│ 0       │ 'certification_documents' │
│ 1       │ 'certifications'          │
└─────────┴───────────────────────────┘

=== TABLE COLUMNS ===
┌─────────┬───────────────────────────┬─────────────────────────────┬────────────────────┬──────────────────────────┬─────────────┐
│ (index) │ TABLE_NAME                │ COLUMN_NAME                 │ DATA_TYPE          │ CHARACTER_MAXIMUM_LENGTH │ IS_NULLABLE │
├─────────┼───────────────────────────┼─────────────────────────────┼────────────────────┼──────────────────────────┼─────────────┤
│ 0       │ 'certification_documents' │ 'id'                        │ 'nvarchar'         │ 200                      │ 'NO'        │
│ 1       │ 'certification_documents' │ 'certification_id'          │ 'nvarchar'         │ 200                      │ 'NO'        │
│ 2       │ 'certification_documents' │ 'user_id'                   │ 'uniqueidentifier' │ null                     │ 'NO'        │
│ 3       │ 'certification_documents' │ 'storage_key'               │ 'nvarchar'         │ 500                      │ 'NO'        │
│ 4       │ 'certification_documents' │ 'original_file_name'        │ 'nvarchar'         │ 255                      │ 'NO'        │
│ 5       │ 'certification_documents' │ 'mime_type'                 │ 'nvarchar'         │ 150                      │ 'NO'        │
│ 6       │ 'certification_documents' │ 'file_size'                 │ 'bigint'           │ null                     │ 'NO'        │
│ 7       │ 'certification_documents' │ 'created_at'                │ 'datetime2'        │ null                     │ 'NO'        │
│ 8       │ 'certifications'          │ 'id'                        │ 'nvarchar'         │ 200                      │ 'NO'        │
│ 9       │ 'certifications'          │ 'user_id'                   │ 'uniqueidentifier' │ null                     │ 'NO'        │
│ 10      │ 'certifications'          │ 'name'                      │ 'nvarchar'         │ 500                      │ 'NO'        │
│ 11      │ 'certifications'          │ 'certification_type'        │ 'nvarchar'         │ 100                      │ 'NO'        │
│ 12      │ 'certifications'          │ 'issuing_organization_name' │ 'nvarchar'         │ 500                      │ 'NO'        │
│ 13      │ 'certifications'          │ 'status'                    │ 'nvarchar'         │ 100                      │ 'NO'        │
│ 14      │ 'certifications'          │ 'certification_data'        │ 'nvarchar'         │ -1                       │ 'NO'        │
│ 15      │ 'certifications'          │ 'created_at'                │ 'datetime2'        │ null                     │ 'NO'        │
│ 16      │ 'certifications'          │ 'updated_at'                │ 'datetime2'        │ null                     │ 'NO'        │
│ 17      │ 'certifications'          │ 'row_version'               │ 'timestamp'        │ null                     │ 'NO'        │
└─────────┴───────────────────────────┴─────────────────────────────┴────────────────────┴──────────────────────────┴─────────────┘

=== MIGRATION HISTORY ===
┌─────────┬───────────────────────────────────┬──────────────────────────┐
│ (index) │ migration_id                      │ applied_at               │
├─────────┼───────────────────────────────────┼──────────────────────────┤
│ 0       │ '011_certifications.sql'          │ 2026-11-03T17:44:52.852Z │
│ 1       │ '012_certification_documents.sql' │ 2026-11-03T17:44:53.001Z │
└─────────┴───────────────────────────────────┴──────────────────────────┘

=== CONSTRAINTS ===
┌─────────┬───────────────────────────┬──────────────────────────────────────────────────┬──────────────────────────┐
│ (index) │ table_name                │ constraint_name                                  │ type_desc                │
├─────────┼───────────────────────────┼──────────────────────────────────────────────────┼──────────────────────────┤
│ 0       │ 'certification_documents' │ 'CK_certification_documents_file_size'           │ 'CHECK_CONSTRAINT'       │
│ 1       │ 'certification_documents' │ 'CK_certification_documents_mime_type'           │ 'CHECK_CONSTRAINT'       │
│ 2       │ 'certification_documents' │ 'CK_certification_documents_original_file_name'  │ 'CHECK_CONSTRAINT'       │
│ 3       │ 'certification_documents' │ 'CK_certification_documents_storage_key'         │ 'CHECK_CONSTRAINT'       │
│ 4       │ 'certification_documents' │ 'FK_certification_documents_certification_owner' │ 'FOREIGN_KEY_CONSTRAINT' │
│ 5       │ 'certification_documents' │ 'PK_certification_documents'                     │ 'PRIMARY_KEY_CONSTRAINT' │
│ 6       │ 'certification_documents' │ 'UQ_certification_documents_storage_key'         │ 'UNIQUE_CONSTRAINT'      │
│ 7       │ 'certifications'          │ 'CK_certifications_data_json'                    │ 'CHECK_CONSTRAINT'       │
│ 8       │ 'certifications'          │ 'CK_certifications_dates'                        │ 'CHECK_CONSTRAINT'       │
│ 9       │ 'certifications'          │ 'CK_certifications_id_not_blank'                 │ 'CHECK_CONSTRAINT'       │
│ 10      │ 'certifications'          │ 'CK_certifications_name_not_blank'               │ 'CHECK_CONSTRAINT'       │
│ 11      │ 'certifications'          │ 'CK_certifications_status_not_blank'             │ 'CHECK_CONSTRAINT'       │
│ 12      │ 'certifications'          │ 'CK_certifications_type_not_blank'               │ 'CHECK_CONSTRAINT'       │
│ 13      │ 'certifications'          │ 'FK_certifications_user'                         │ 'FOREIGN_KEY_CONSTRAINT' │
│ 14      │ 'certifications'          │ 'PK_certifications'                              │ 'PRIMARY_KEY_CONSTRAINT' │
│ 15      │ 'certifications'          │ 'UQ_certifications_id_user'                      │ 'UNIQUE_CONSTRAINT'      │
└─────────┴───────────────────────────┴──────────────────────────────────────────────────┴──────────────────────────┘


flowchart TD
    U["dbo.users"]
    T["dbo.trainings"]
    D["dbo.training_documents"]
    C["dbo.certifications"]
    S["dbo.skills"]
    R["Training relationships"]
    F["Backend document storage"]

    U --> T
    T --> D
    D --> F
    T --> R
    R --> C
    R --> S