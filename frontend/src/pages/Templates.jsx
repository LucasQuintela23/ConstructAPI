import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiUpload, FiFileText, FiDatabase } from 'react-icons/fi';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const { data } = await api.get('/templates');
      setTemplates(data.templates || []);
    } catch (e) {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete template "${name}"? This will also delete all associated data.`)) return;
    try {
      await api.delete(`/templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      alert('Failed to delete template');
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Templates</h1>
        <Link
          to="/templates/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <FiPlus /> New Template
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow text-center py-16 text-gray-400">
          <FiDatabase className="mx-auto text-5xl mb-3" />
          <p className="text-lg font-medium">No templates yet</p>
          <p className="text-sm mb-4">Create a template to start managing your data</p>
          <Link
            to="/templates/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <FiPlus /> Create Template
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map(t => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-gray-100 shadow p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-800">{t.name}</h2>
                {t.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.fields.map(f => (
                    <span
                      key={f.name}
                      className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
                    >
                      {f.label || f.name} ({f.type})
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to={`/templates/${t.id}/data`}
                  title="View Data"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700"
                >
                  <FiEye /> Data
                </Link>
                <Link
                  to={`/templates/${t.id}/form`}
                  title="Open Form"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 rounded-lg hover:bg-green-100 text-green-700"
                >
                  <FiFileText /> Form
                </Link>
                <Link
                  to={`/templates/${t.id}/upload`}
                  title="Upload"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 rounded-lg hover:bg-blue-100 text-blue-700"
                >
                  <FiUpload /> Upload
                </Link>
                <Link
                  to={`/templates/${t.id}/edit`}
                  title="Edit"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-50 rounded-lg hover:bg-yellow-100 text-yellow-700"
                >
                  <FiEdit /> Edit
                </Link>
                <button
                  onClick={() => handleDelete(t.id, t.name)}
                  title="Delete"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 rounded-lg hover:bg-red-100 text-red-600"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
