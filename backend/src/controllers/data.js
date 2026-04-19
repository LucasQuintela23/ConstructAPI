const { db, sanitizeTableName } = require('../database');
const { v4: uuidv4 } = require('uuid');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateId(id) {
  return UUID_RE.test(id);
}

function getTemplate(templateId) {
  if (!validateId(templateId)) return null;
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  if (!template) return null;
  return { ...template, fields: JSON.parse(template.fields) };
}

function list(req, res) {
  try {
    const { templateId } = req.params;
    const template = getTemplate(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    const tableName = sanitizeTableName(templateId);

    let whereClause = '';
    let params = [];

    if (search) {
      const textFields = template.fields.filter(f =>
        ['text', 'email', 'textarea', 'select'].includes(f.type)
      );
      if (textFields.length > 0) {
        const conditions = textFields.map(f => `"${f.name}" LIKE ?`).join(' OR ');
        whereClause = `WHERE ${conditions}`;
        params = textFields.map(() => `%${search}%`);
      }
    }

    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM "${tableName}" ${whereClause}`)
      .get(...params);
    const total = countRow.count;

    const rows = db
      .prepare(
        `SELECT * FROM "${tableName}" ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    res.json({
      data: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function create(req, res) {
  try {
    const { templateId } = req.params;
    const template = getTemplate(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const record = req.body;
    for (const field of template.fields) {
      if (field.required && (record[field.name] === undefined || record[field.name] === '')) {
        return res.status(400).json({ error: `Field "${field.label || field.name}" is required` });
      }
    }

    const tableName = sanitizeTableName(templateId);
    const id = uuidv4();
    const now = new Date().toISOString();
    const columns = template.fields.map(f => `"${f.name}"`).join(', ');
    const placeholders = template.fields.map(() => '?').join(', ');
    const values = template.fields.map(f => {
      const v = record[f.name];
      if (v === undefined || v === '') return null;
      if (f.type === 'boolean') return v ? 1 : 0;
      return v;
    });

    db.prepare(
      `INSERT INTO "${tableName}" (id, ${columns}, created_at) VALUES (?, ${placeholders}, ?)`
    ).run(id, ...values, now);

    const row = db.prepare(`SELECT * FROM "${tableName}" WHERE id = ?`).get(id);
    res.status(201).json({ record: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function getOne(req, res) {
  try {
    const { templateId, id } = req.params;
    if (!validateId(id)) return res.status(400).json({ error: 'Invalid record ID' });
    const template = getTemplate(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const tableName = sanitizeTableName(templateId);
    const row = db.prepare(`SELECT * FROM "${tableName}" WHERE id = ?`).get(id);
    if (!row) return res.status(404).json({ error: 'Record not found' });
    res.json({ record: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function update(req, res) {
  try {
    const { templateId, id } = req.params;
    if (!validateId(id)) return res.status(400).json({ error: 'Invalid record ID' });
    const template = getTemplate(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const tableName = sanitizeTableName(templateId);
    const existing = db.prepare(`SELECT * FROM "${tableName}" WHERE id = ?`).get(id);
    if (!existing) return res.status(404).json({ error: 'Record not found' });

    const record = req.body;
    const setClauses = template.fields.map(f => `"${f.name}" = ?`).join(', ');
    const values = template.fields.map(f => {
      const v = record[f.name];
      if (v === undefined || v === '') return null;
      if (f.type === 'boolean') return v ? 1 : 0;
      return v;
    });

    db.prepare(`UPDATE "${tableName}" SET ${setClauses} WHERE id = ?`).run(...values, id);
    const row = db.prepare(`SELECT * FROM "${tableName}" WHERE id = ?`).get(id);
    res.json({ record: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function remove(req, res) {
  try {
    const { templateId, id } = req.params;
    if (!validateId(id)) return res.status(400).json({ error: 'Invalid record ID' });
    const template = getTemplate(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const tableName = sanitizeTableName(templateId);
    const existing = db.prepare(`SELECT * FROM "${tableName}" WHERE id = ?`).get(id);
    if (!existing) return res.status(404).json({ error: 'Record not found' });

    db.prepare(`DELETE FROM "${tableName}" WHERE id = ?`).run(id);
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list, create, getOne, update, remove };
