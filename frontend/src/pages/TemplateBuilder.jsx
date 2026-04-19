import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import FieldBuilder from '../components/FieldBuilder';

export default function TemplateBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api
        .get(`/templates/${id}`)
        .then(({ data }) => {
          setName(data.template.name);
          setDescription(data.template.description || '');
          setFields(data.template.fields);
        })
        .catch(() => setError('Failed to load template'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Template name is required');
    if (fields.length === 0) return setError('At least one field is required');
    for (const f of fields) {
      if (!f.name.trim()) return setError('All fields must have a name');
    }

    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await api.put(`/templates/${id}`, { name, description, fields });
      } else {
        await api.post('/templates', { name, description, fields });
      }
      navigate('/templates');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Template' : 'New Template'}
      </h1>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-700">Template Info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Invoice, Customer, Inventory"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Fields</h2>
          <FieldBuilder fields={fields} onChange={setFields} />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/templates')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </form>
    </div>
  );
}
