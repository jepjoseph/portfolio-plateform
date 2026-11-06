import "../../backend/node_modules/dotenv/config.js";
import fs from "node:fs";
import path from "node:path";

import {
  getDatabasePool,
  closeDatabase,
} from "../../backend/src/config/database.js";

const reportDirectory = path.resolve(
  import.meta.dirname,
  "../reports"
);

function writeReport(filename, data) {
  const filepath = path.join(reportDirectory, filename);

  fs.writeFileSync(
    filepath,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  console.log(`Saved: ${filepath}`);
}

async function main() {
  let pool;

  try {
    fs.mkdirSync(reportDirectory, { recursive: true });

    console.log("\nConnecting to SQL Server...");

    pool = await getDatabasePool();

    console.log("Connected successfully.");

    // Query 1: SQL Server and database identification

    const databaseInfo = await pool.request().query(`
      SELECT
        @@SERVERNAME AS ServerName,
        DB_NAME() AS CurrentDatabase,
        @@VERSION AS SQLServerVersion;
    `);

    const info = databaseInfo.recordset[0];

    console.log("\n=== DATABASE INFORMATION ===");
    console.log("Server:", info.ServerName);
    console.log("Database:", info.CurrentDatabase);
    console.log("SQL Server:", info.SQLServerVersion);

    writeReport(
      "training-sql-database-info.json",
      databaseInfo.recordset
    );

    // Query 2: All existing tables

    const tables = await pool.request().query(`
      SELECT
        s.name AS SchemaName,
        t.name AS TableName,
        COUNT(c.column_id) AS ColumnCount
      FROM sys.tables AS t
      INNER JOIN sys.schemas AS s
        ON t.schema_id = s.schema_id
      LEFT JOIN sys.columns AS c
        ON t.object_id = c.object_id
      GROUP BY
        s.name,
        t.name
      ORDER BY
        s.name,
        t.name;
    `);

    console.log("\n=== DATABASE TABLES ===");
    console.table(tables.recordset);

    writeReport(
      "training-sql-tables.json",
      tables.recordset
    );

    // Query 3: Training, Certification, Skill,
    // and Document table columns

    const columns = await pool.request().query(`
      SELECT
        s.name AS SchemaName,
        t.name AS TableName,
        c.column_id AS ColumnPosition,
        c.name AS ColumnName,
        ty.name AS DataType,
        c.max_length AS MaxLengthBytes,
        c.is_nullable AS IsNullable,
        c.is_identity AS IsIdentity
      FROM sys.tables AS t
      INNER JOIN sys.schemas AS s
        ON t.schema_id = s.schema_id
      INNER JOIN sys.columns AS c
        ON t.object_id = c.object_id
      INNER JOIN sys.types AS ty
        ON c.user_type_id = ty.user_type_id
      WHERE
        t.name LIKE '%Training%'
        OR t.name LIKE '%Certification%'
        OR t.name LIKE '%Skill%'
        OR t.name LIKE '%Document%'
      ORDER BY
        s.name,
        t.name,
        c.column_id;
    `);

    console.log("\n=== RELEVANT TABLE COLUMNS ===");
    console.table(columns.recordset);

    writeReport(
      "training-sql-columns.json",
      columns.recordset
    );

    // Query 4: Relevant foreign-key relationships

    const foreignKeys = await pool.request().query(`
      SELECT
        fk.name AS ForeignKeyName,
        OBJECT_SCHEMA_NAME(fk.parent_object_id) AS ParentSchema,
        OBJECT_NAME(fk.parent_object_id) AS ParentTable,
        pc.name AS ParentColumn,
        OBJECT_SCHEMA_NAME(fk.referenced_object_id) AS ReferencedSchema,
        OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
        rc.name AS ReferencedColumn,
        fk.delete_referential_action_desc AS OnDelete
      FROM sys.foreign_keys AS fk
      INNER JOIN sys.foreign_key_columns AS fkc
        ON fk.object_id = fkc.constraint_object_id
      INNER JOIN sys.columns AS pc
        ON pc.object_id = fkc.parent_object_id
        AND pc.column_id = fkc.parent_column_id
      INNER JOIN sys.columns AS rc
        ON rc.object_id = fkc.referenced_object_id
        AND rc.column_id = fkc.referenced_column_id
      WHERE
        OBJECT_NAME(fk.parent_object_id) LIKE '%Training%'
        OR OBJECT_NAME(fk.parent_object_id) LIKE '%Certification%'
        OR OBJECT_NAME(fk.parent_object_id) LIKE '%Skill%'
        OR OBJECT_NAME(fk.referenced_object_id) LIKE '%Training%'
        OR OBJECT_NAME(fk.referenced_object_id) LIKE '%Certification%'
        OR OBJECT_NAME(fk.referenced_object_id) LIKE '%Skill%'
      ORDER BY
        ParentTable,
        ForeignKeyName;
    `);

    console.log("\n=== FOREIGN KEY RELATIONSHIPS ===");
    console.table(foreignKeys.recordset);

    writeReport(
      "training-sql-foreign-keys.json",
      foreignKeys.recordset
    );

    console.log("\n=== INSPECTION SUMMARY ===");

    console.table([
      {
        Inspection: "Database information",
        Results: databaseInfo.recordset.length,
      },
      {
        Inspection: "Database tables",
        Results: tables.recordset.length,
      },
      {
        Inspection: "Relevant columns",
        Results: columns.recordset.length,
      },
      {
        Inspection: "Foreign key relationships",
        Results: foreignKeys.recordset.length,
      },
    ]);

    console.log("\nInspection completed successfully.");
    console.log("All SQL operations were read-only.");

  } catch (error) {
    console.error("\nInspection failed:", error.message);
    process.exitCode = 1;
  } finally {
    try {
      await closeDatabase();
    } catch (error) {
      console.error("Database cleanup failed:", error.message);
      process.exitCode = 1;
    }
  }
}

main();
