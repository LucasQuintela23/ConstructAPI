const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/constructapi.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    fields TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function getColumnType(fieldType) {
  switch (fieldType) {
    case 'number':
      return 'REAL';
    case 'boolean':
      return 'INTEGER';
    case 'date':
      return 'TEXT';
    default:
      return 'TEXT';
  }
}

// Only allow alphanumeric + underscore for identifiers to prevent SQL injection
const SAFE_IDENTIFIER_RE = /^[a-zA-Z0-9_]+$/;

function sanitizeTableName(templateId) {
  // templateId is a UUID — replace hyphens with underscores (safe chars only)
  const safe = templateId.replace(/-/g, '_');
  if (!SAFE_IDENTIFIER_RE.test(safe)) {
    throw new Error(`Invalid template ID: ${templateId}`);
  }
  return `data_${safe}`;
}

function sanitizeFieldName(name) {
  if (!SAFE_IDENTIFIER_RE.test(name)) {
    throw new Error(`Invalid field name "${name}": only alphanumeric characters and underscores are allowed`);
  }
  return name;
}

function createDataTable(templateId, fields) {
  const tableName = sanitizeTableName(templateId);
  const columns = fields
    .map(f => `"${sanitizeFieldName(f.name)}" ${getColumnType(f.type)}`)
    .join(', ');
  db.exec(
    `CREATE TABLE IF NOT EXISTS "${tableName}" (` +
    `id TEXT PRIMARY KEY, ${columns}, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`
  );
}

function dropDataTable(templateId) {
  const tableName = sanitizeTableName(templateId);
  db.exec(`DROP TABLE IF EXISTS "${tableName}"`);
}

module.exports = { db, createDataTable, dropDataTable, getColumnType, sanitizeTableName, sanitizeFieldName };
