const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('./config');

let dbInstance = null;

function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getDb() {
  if (!dbInstance) {
    ensureDataDir();
    dbInstance = new sqlite3.Database(DB_PATH);
  }
  return dbInstance;
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function initDb() {
  await run(
    `CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      industry TEXT NOT NULL,
      project_type TEXT NOT NULL,
      project_scale TEXT NOT NULL,
      budget_range TEXT NOT NULL,
      primary_region TEXT NOT NULL,
      active_users TEXT NOT NULL,
      traffic_pattern TEXT NOT NULL,
      database_needed TEXT NOT NULL,
      file_storage_needed TEXT NOT NULL,
      ai_requirement TEXT NOT NULL,
      microsoft_integration TEXT NOT NULL,
      ease_vs_control TEXT NOT NULL,
      existing_provider TEXT NOT NULL,
      compliance_requirement TEXT NOT NULL,
      support_requirement TEXT NOT NULL,
      deployment_preference TEXT NOT NULL,
      aws_score INTEGER NOT NULL,
      azure_score INTEGER NOT NULL,
      gcp_score INTEGER NOT NULL,
      final_recommendation TEXT NOT NULL,
      confidence_score INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      reasons_json TEXT DEFAULT '[]',
      services_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  );

  const columns = await all('PRAGMA table_info(submissions)');
  const columnNames = columns.map((col) => col.name);
  if (!columnNames.includes('deployment_preference')) {
    await run(
      "ALTER TABLE submissions ADD COLUMN deployment_preference TEXT NOT NULL DEFAULT 'Unspecified'"
    );
  }
  if (!columnNames.includes('reasons_json')) {
    await run("ALTER TABLE submissions ADD COLUMN reasons_json TEXT DEFAULT '[]'");
  }
  if (!columnNames.includes('services_json')) {
    await run("ALTER TABLE submissions ADD COLUMN services_json TEXT DEFAULT '[]'");
  }
}

async function insertSubmission(record) {
  const sql = `
    INSERT INTO submissions (
      name, email, industry, project_type, project_scale, budget_range, primary_region,
      active_users, traffic_pattern, database_needed, file_storage_needed, ai_requirement,
      microsoft_integration, ease_vs_control, existing_provider, compliance_requirement,
      support_requirement, deployment_preference, aws_score, azure_score, gcp_score, final_recommendation,
      confidence_score, explanation, reasons_json, services_json
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `;

  const params = [
    record.name,
    record.email,
    record.industry,
    record.project_type,
    record.project_scale,
    record.budget_range,
    record.primary_region,
    record.active_users,
    record.traffic_pattern,
    record.database_needed,
    record.file_storage_needed,
    record.ai_requirement,
    record.microsoft_integration,
    record.ease_vs_control,
    record.existing_provider,
    record.compliance_requirement,
    record.support_requirement,
    record.deployment_preference,
    record.aws_score,
    record.azure_score,
    record.gcp_score,
    record.final_recommendation,
    record.confidence_score,
    record.explanation,
    record.reasons_json,
    record.services_json,
  ];

  const result = await run(sql, params);
  return result?.lastID;
}

async function insertFeedback(record) {
  const sql = `
    INSERT INTO feedback (submission_id, rating, comment)
    VALUES (?, ?, ?)
  `;
  const params = [record.submission_id || null, record.rating, record.comment || null];
  const result = await run(sql, params);
  return result?.lastID;
}

async function listSubmissions(limit = 50) {
  return all(
    `SELECT id, name, email, industry, project_type, project_scale, budget_range,
            primary_region, active_users, traffic_pattern, database_needed,
            file_storage_needed, ai_requirement, ease_vs_control, existing_provider,
            support_requirement, deployment_preference, aws_score, azure_score,
            gcp_score, final_recommendation, confidence_score, explanation,
            reasons_json, services_json, created_at
     FROM submissions
     ORDER BY datetime(created_at) DESC
     LIMIT ?`,
    [limit]
  );
}

async function clearSubmissions() {
  await run('DELETE FROM submissions');
}

module.exports = {
  initDb,
  insertSubmission,
  insertFeedback,
  listSubmissions,
  clearSubmissions,
};
