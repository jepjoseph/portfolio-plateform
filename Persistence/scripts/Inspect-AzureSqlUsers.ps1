
# Inspect-AzureSqlUsers.ps1
# Purpose: Read-only inspection of Azure SQL user records.
# Uses the backend's existing .env and database connection.

$ErrorActionPreference = "Stop"

$backend = "D:\Documents\Project\Portfolio\portfolio-plateform\backend"

if (-not (Test-Path -LiteralPath "$backend\src\config\database.js")) {
    throw "Backend database configuration not found."
}

Push-Location $backend

try {
    @'
import "dotenv/config";
import { getDatabasePool, closeDatabase } from "./src/config/database.js";

async function main() {
  try {
    const pool = await getDatabasePool();

    const columns = await pool.request().query(`
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION;
    `);

    console.log("\n=== USERS TABLE COLUMNS ===");
    console.table(columns.recordset);

    const availableColumns = new Set(
      columns.recordset.map(row => row.COLUMN_NAME)
    );

    const requestedColumns = [
      "id",
      "email",
      "account_status",
      "created_at",
      "last_login_at"
    ];

    const missingColumns = requestedColumns.filter(
      column => !availableColumns.has(column)
    );

    if (missingColumns.length > 0) {
      console.log(
        "\nSome requested columns do not exist:",
        missingColumns.join(", ")
      );

      console.log(
        "User query skipped. Review the actual column names above."
      );

      return;
    }

    const users = await pool.request().query(`
      SELECT
        CONVERT(VARCHAR(36), id) AS user_id,
        email,
        account_status,
        created_at,
        last_login_at
      FROM dbo.users
      WHERE id IN (
        'FF77EA0E-B0B3-F111-A6A9-0022484597A2',
        '4CD8FF00-72B1-F111-A6A9-0022484A15B1'
      )
      ORDER BY created_at;
    `);

    console.log("\n=== AZURE SQL USER RECORDS ===");
    console.table(users.recordset);

    console.log("\nUsers found:", users.recordset.length);
    console.log("Read-only inspection completed.");

  } finally {
    await closeDatabase();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
'@ | node --input-type=module

    if ($LASTEXITCODE -ne 0) {
        throw "Azure SQL user inspection failed."
    }

    Write-Host "`nInspection completed successfully." -ForegroundColor Green
}
finally {
    Pop-Location
}
