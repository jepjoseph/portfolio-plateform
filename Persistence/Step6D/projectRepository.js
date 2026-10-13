import { getDatabasePool, sql } from "../config/database.js";

const PROJECT_COLUMNS = `
  id,
  user_id,
  title,
  category,
  lifecycle_status,
  record_status,
  is_featured,
  project_data,
  created_at,
  updated_at,
  row_version
`;

function mapProjectRow(row) {
  if (!row) {
    return null;
  }

  const projectData =
    typeof row.project_data === "string"
      ? JSON.parse(row.project_data)
      : row.project_data;

  return {
    ...projectData,
    id: row.id,
    title: row.title,
    category: row.category,
    lifecycleStatus: row.lifecycle_status,
    recordStatus: row.record_status,
    presentation: {
      ...(projectData.presentation || {}),
      isFeatured: Boolean(row.is_featured),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rowVersion: Buffer.from(row.row_version).toString("base64"),
  };
}

function bindProjectParameters(request, userId, project) {
  return request
    .input("id", sql.NVarChar(200), project.id)
    .input("userId", sql.UniqueIdentifier, userId)
    .input("title", sql.NVarChar(500), project.title)
    .input("category", sql.NVarChar(100), project.category)
    .input("lifecycleStatus", sql.NVarChar(50), project.lifecycleStatus)
    .input("recordStatus", sql.NVarChar(20), project.recordStatus)
    .input("isFeatured", sql.Bit, Boolean(project.presentation?.isFeatured))
    .input("projectData", sql.NVarChar(sql.MAX), JSON.stringify(project));
}

export async function listProjectsByUser(userId) {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId).query(`
      SELECT ${PROJECT_COLUMNS}
      FROM dbo.projects
      WHERE user_id = @userId
      ORDER BY updated_at DESC, id ASC;
    `);

  return result.recordset.map(mapProjectRow);
}

export async function findProjectById(userId, projectId) {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("id", sql.NVarChar(200), projectId).query(`
      SELECT ${PROJECT_COLUMNS}
      FROM dbo.projects
      WHERE user_id = @userId
        AND id = @id;
    `);

  return mapProjectRow(result.recordset[0]);
}

export async function createProject(userId, project) {
  const pool = await getDatabasePool();

  await bindProjectParameters(pool.request(), userId, project).query(`
    INSERT INTO dbo.projects (
      id,
      user_id,
      title,
      category,
      lifecycle_status,
      record_status,
      is_featured,
      project_data
    )
    VALUES (
      @id,
      @userId,
      @title,
      @category,
      @lifecycleStatus,
      @recordStatus,
      @isFeatured,
      @projectData
    );
  `);

  return findProjectById(userId, project.id);
}

export async function updateProject(userId, project, expectedRowVersion) {
  const pool = await getDatabasePool();

  const request = bindProjectParameters(pool.request(), userId, project).input(
    "expectedRowVersion",
    sql.Binary(8),
    Buffer.from(expectedRowVersion, "base64"),
  );

  const result = await request.query(`
    UPDATE dbo.projects
    SET
      title = @title,
      category = @category,
      lifecycle_status = @lifecycleStatus,
      record_status = @recordStatus,
      is_featured = @isFeatured,
      project_data = @projectData,
      updated_at = SYSUTCDATETIME()
    WHERE id = @id
      AND user_id = @userId
      AND row_version = @expectedRowVersion;
  `);

  if (result.rowsAffected[0] === 0) {
    return null;
  }

  return findProjectById(userId, project.id);
}

export async function deleteProject(userId, projectId) {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("id", sql.NVarChar(200), projectId).query(`
      DELETE FROM dbo.projects
      WHERE id = @id
        AND user_id = @userId;
    `);

  return result.rowsAffected[0] > 0;
}
