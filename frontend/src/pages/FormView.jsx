import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import FormRenderer from '../components/FormRenderer';
import { FiArrowLeft } from 'react-icons/fi';

export default function FormView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api
      .get(`/templates/${id}`)
      .then(({ data }) => {
        setTemplate(data.template);
      })
      .catch(() => setError('Failed to load template'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post(`/data/${id}`, values);
      setSuccess('Record saved successfully!');
      setValues({});
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save record');
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

  if (!template) {
    return <div className="text-red-500">Template not found</div>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/templates/${id}/data`} className="text-gray-400 hover:text-gray-600">
          <FiArrowLeft className="text-xl" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{template.name}</h1>
          <p className="text-sm text-gray-400">Data Entry Form</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormRenderer fields={template.fields} values={values} onChange={setValues} />
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving...' : 'Submit'}
            </button>
            <Link
              to={`/templates/${id}/data`}
              className="px-4 py-2.5 border border-gray-300 text-sm rounded-lg text-gray-600 hover:bg-gray-50"
            >
              View Data
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
