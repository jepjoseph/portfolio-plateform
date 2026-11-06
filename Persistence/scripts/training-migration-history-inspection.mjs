import "node:process";
import fs from "node:fs/promises";
import path from "node:path";

import "../../backend/node_modules/dotenv/config.js";

import {
  getDatabasePool,
  closeDatabase,
} from "../../backend/src/config/database.js";

const reportDirectory = path.resolve(
  import.meta.dirname,
  "../reports",
);

async function main() {
  const pool = await getDatabasePool();

  try {
    const databaseInfo = await pool.request().query(`
      SELECT
        DB_NAME() AS database_name,
        @@SERVERNAME AS server_name,
        SYSTEM_USER AS sql_login,
        SYSUTCDATETIME() AS inspected_at_utc;
    `);

    const migrationTable = await pool.request().query(`
      SELECT
        CASE
          WHEN OBJECT_ID(N'dbo.schema_migrations', N'U') IS NULL
          THEN 0
          ELSE 1
        END AS migration_table_exists;
    `);

    const trainingTable = await pool.request().query(`
      SELECT
        CASE
          WHEN OBJECT_ID(N'dbo.trainings', N'U') IS NULL
          THEN 0
          ELSE 1
        END AS training_table_exists;
    `);

    const hasMigrationTable =
      migrationTable.recordset[0]?.migration_table_exists === 1;

    let migrations = [];

    if (hasMigrationTable) {
      const result = await pool.request().query(`
        SELECT
          migration_id,
          checksum,
          applied_at
        FROM dbo.schema_migrations
        ORDER BY migration_id;
      `);

      migrations = result.recordset;
    }

    const report = {
      inspectedAt: new Date().toISOString(),
      database: databaseInfo.recordset[0],
      migrationTableExists: hasMigrationTable,
      trainingTableExists:
        trainingTable.recordset[0]?.training_table_exists === 1,
      appliedMigrationCount: migrations.length,
      migrations,
    };

    const outputPath = path.join(
      reportDirectory,
      "training-migration-history-inspection.json",
    );

    await fs.writeFile(
      outputPath,
      JSON.stringify(report, null, 2),
      { encoding: "utf8", flag: "wx" },
    );

    console.log("=== SQL DATABASE ===");
    console.log("Database:", report.database.database_name);
    console.log("Server:", report.database.server_name);

    console.log("\n=== MIGRATION STATUS ===");
    console.log(
      "Migration history table exists:",
      report.migrationTableExists,
    );
    console.log(
      "Training table exists:",
      report.trainingTableExists,
    );
    console.log(
      "Applied migrations:",
      report.appliedMigrationCount,
    );

    console.log("\n=== APPLIED MIGRATION IDS ===");

    for (const migration of migrations) {
      console.log(migration.migration_id);
    }

    console.log("\nReport:", outputPath);
  } finally {
    await closeDatabase();
  }
}

main().catch((error) => {
  console.error("Inspection failed:", error.message);
  process.exitCode = 1;
});