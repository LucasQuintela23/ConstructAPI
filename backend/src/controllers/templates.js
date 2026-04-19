const { db, createDataTable, dropDataTable, sanitizeFieldName } = require('../database');
const { v4: uuidv4 } = require('uuid');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateId(id) {
  return UUID_RE.test(id);
}

function validateFields(fields) {
  for (const f of fields) {
    if (!f.name || typeof f.name !== 'string') return 'Each field must have a name';
    try {
      sanitizeFieldName(f.name);
    } catch (e) {
      return e.message;
    }
  }
  return null;
}

function list(req, res) {
  try {
    const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all();
    const parsed = templates.map(t => ({ ...t, fields: JSON.parse(t.fields) }));
    res.json({ templates: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function create(req, res) {
  try {
    const { name, description, fields } = req.body;
    if (!name || !fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'name and at least one field are required' });
    }
    const fieldError = validateFields(fields);
    if (fieldError) return res.status(400).json({ error: fieldError });
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO templates (id, name, description, fields, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, name, description || '', JSON.stringify(fields), now, now);
    createDataTable(id, fields);
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    res.status(201).json({ template: { ...template, fields: JSON.parse(template.fields) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function get(req, res) {
  try {
    if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid template ID' });
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ template: { ...template, fields: JSON.parse(template.fields) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function update(req, res) {
  try {
    const { id } = req.params;
    if (!validateId(id)) return res.status(400).json({ error: 'Invalid template ID' });
    const existing = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    const { name, description, fields } = req.body;
    if (!name || !fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'name and at least one field are required' });
    }
    const fieldError = validateFields(fields);
    if (fieldError) return res.status(400).json({ error: fieldError });

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE templates SET name = ?, description = ?, fields = ?, updated_at = ? WHERE id = ?`
    ).run(name, description || '', JSON.stringify(fields), now, id);

    // Recreate data table on field changes
    const oldFields = JSON.parse(existing.fields);
    const fieldsChanged = JSON.stringify(oldFields) !== JSON.stringify(fields);
    if (fieldsChanged) {
      dropDataTable(id);
      createDataTable(id, fields);
    }

    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    res.json({ template: { ...template, fields: JSON.parse(template.fields) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function remove(req, res) {
  try {
    const { id } = req.params;
    if (!validateId(id)) return res.status(400).json({ error: 'Invalid template ID' });
    const existing = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    db.prepare('DELETE FROM templates WHERE id = ?').run(id);
    dropDataTable(id);
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list, create, get, update, remove };
