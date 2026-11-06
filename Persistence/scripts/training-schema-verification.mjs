import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "../../backend/node_modules/dotenv/config.js";

import {
  getDatabasePool,
  closeDatabase,
} from "../../backend/src/config/database.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

const sqlFile = path.join(
  scriptDirectory,
  "training-schema-verification.sql",
);

const reportFile = path.resolve(
  scriptDirectory,
  "../reports/training-schema-verification.json",
);

async function main() {
  const sqlText = await fs.readFile(sqlFile, "utf8");

  const pool = await getDatabasePool();

  try {
    // The SQL script contains five SELECT statements.
    // A batch returns their result sets in order.
    const result = await pool.request().batch(sqlText);

    const recordsets = result.recordsets ?? [];

    const report = {
      verifiedAt: new Date().toISOString(),
      database: recordsets[0] ?? [],
      columns: recordsets[1] ?? [],
      indexes: recordsets[2] ?? [],
      checkConstraints: recordsets[3] ?? [],
      migrationHistory: recordsets[4] ?? [],
    };

    await fs.writeFile(
      reportFile,
      JSON.stringify(report, null, 2),
      { encoding: "utf8", flag: "wx" },
    );

    console.log("\n=== TRAINING SCHEMA VERIFICATION ===");

    console.log("\nDatabase:");
    console.table(report.database);

    console.log("\nColumns:");
    console.table(report.columns);

    console.log("\nIndexes:");
    console.table(report.indexes);

    console.log("\nCheck constraints:");
    console.table(report.checkConstraints);

    console.log("\nMigration history:");
    console.table(report.migrationHistory);

    console.log("\nReport saved:");
    console.log(reportFile);
  } finally {
    await closeDatabase();
  }
}

main().catch((error) => {
  console.error("Verification failed:", error.message);
  process.exitCode = 1;
});