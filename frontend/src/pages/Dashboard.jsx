import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { FiDatabase, FiLayers, FiArrowRight } from 'react-icons/fi';

export default function Dashboard() {
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({ totalRecords: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/templates');
        setTemplates(data.templates || []);

        let total = 0;
        await Promise.all(
          (data.templates || []).map(async t => {
            try {
              const r = await api.get(`/data/${t.id}?limit=1`);
              total += r.data.pagination?.total || 0;
            } catch (_) {}
          })
        );
        setStats({ totalRecords: total });
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4 border border-gray-100">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <FiLayers className="text-indigo-600 text-2xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Templates</p>
            <p className="text-3xl font-bold text-gray-800">{templates.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4 border border-gray-100">
          <div className="p-3 bg-green-100 rounded-lg">
            <FiDatabase className="text-green-600 text-2xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-3xl font-bold text-gray-800">{stats.totalRecords}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Recent Templates</h2>
          <Link to="/templates/new" className="text-sm text-indigo-600 hover:underline">
            + New Template
          </Link>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FiLayers className="mx-auto text-4xl mb-2" />
            <p>No templates yet.</p>
            <Link to="/templates/new" className="mt-2 inline-block text-indigo-600 hover:underline text-sm">
              Create your first template →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {templates.slice(0, 5).map(t => (
              <li key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.fields.length} fields &mdash; {t.description || 'No description'}</p>
                </div>
                <Link
                  to={`/templates/${t.id}/data`}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                >
                  View data <FiArrowRight />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
