const ExcelJS = require('exceljs');
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');
const { db, sanitizeTableName } = require('../database');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Parse an uploaded .xlsx or .csv buffer into an array of plain objects.
 * Row 1 is treated as the header row; subsequent rows become objects keyed by
 * the header values.  .xls (legacy binary format) is not supported by exceljs;
 * callers should reject that extension before reaching this function.
 */
async function parseSpreadsheet(buffer, originalName) {
  const workbook = new ExcelJS.Workbook();

  if (originalName && /\.csv$/i.test(originalName)) {
    // exceljs CSV reader requires a readable stream
    const stream = Readable.from(buffer.toString('utf8'));
    await workbook.csv.read(stream);
  } else {
    await workbook.xlsx.load(buffer);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows = [];
  let headers = [];

  worksheet.eachRow((row, rowNumber) => {
    // row.values is 1-indexed: index 0 is undefined
    const values = row.values.slice(1);
    if (rowNumber === 1) {
      headers = values.map(h => (h != null ? String(h).trim() : ''));
    } else {
      const obj = {};
      headers.forEach((h, i) => {
        const v = values[i];
        obj[h] = v != null ? v : '';
      });
      rows.push(obj);
    }
  });

  return rows;
}

async function upload(req, res) {
  try {
    const { templateId } = req.params;
    if (!UUID_RE.test(templateId)) return res.status(400).json({ error: 'Invalid template ID' });
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    const fields = JSON.parse(template.fields);

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Reject legacy .xls (not supported by exceljs)
    if (/\.xls$/i.test(req.file.originalname)) {
      return res.status(400).json({
        error: 'Legacy .xls format is not supported. Please convert the file to .xlsx or .csv.',
      });
    }

    let rows;
    try {
      rows = await parseSpreadsheet(req.file.buffer, req.file.originalname);
    } catch (parseErr) {
      return res.status(400).json({ error: `Failed to parse file: ${parseErr.message}` });
    }

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
