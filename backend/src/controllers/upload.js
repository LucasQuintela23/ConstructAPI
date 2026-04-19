const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const { db, sanitizeTableName } = require('../database');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function upload(req, res) {
  try {
    const { templateId } = req.params;
    if (!UUID_RE.test(templateId)) return res.status(400).json({ error: 'Invalid template ID' });
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    const fields = JSON.parse(template.fields);

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (rows.length === 0) {
      return res.json({ imported: 0, skipped: 0, errors: [] });
    }

    // Build a case-insensitive mapping from spreadsheet header -> field name
    const headerMap = {};
    const firstRowKeys = Object.keys(rows[0]);
    for (const key of firstRowKeys) {
      const normalized = key.trim().toLowerCase();
      for (const field of fields) {
        if (
          normalized === field.name.toLowerCase() ||
          normalized === (field.label || '').toLowerCase()
        ) {
          headerMap[key] = field.name;
          break;
        }
      }
    }

    const tableName = sanitizeTableName(templateId);
    const columns = fields.map(f => `"${f.name}"`).join(', ');
    const placeholders = fields.map(() => '?').join(', ');
    const insertStmt = db.prepare(
      `INSERT INTO "${tableName}" (id, ${columns}, created_at) VALUES (?, ${placeholders}, ?)`
    );

    let imported = 0;
    let skipped = 0;
    const errors = [];

    const insertMany = db.transaction(rowsToInsert => {
      for (const { index, row } of rowsToInsert) {
        try {
          const record = {};
          for (const [header, fieldName] of Object.entries(headerMap)) {
            record[fieldName] = row[header];
          }

          const missingRequired = fields.find(
            f => f.required && (record[f.name] === undefined || record[f.name] === '')
          );
          if (missingRequired) {
            errors.push({ row: index + 2, error: `Missing required field: ${missingRequired.name}` });
            skipped++;
            continue;
          }

          const id = uuidv4();
          const now = new Date().toISOString();
          const values = fields.map(f => {
            const v = record[f.name];
            if (v === undefined || v === '') return null;
            if (f.type === 'boolean') return v ? 1 : 0;
            if (f.type === 'number') return isNaN(Number(v)) ? null : Number(v);
            return String(v);
          });

          insertStmt.run(id, ...values, now);
          imported++;
        } catch (e) {
          errors.push({ row: index + 2, error: e.message });
          skipped++;
        }
      }
    });

    insertMany(rows.map((row, index) => ({ index, row })));

    res.json({ imported, skipped, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { upload };
