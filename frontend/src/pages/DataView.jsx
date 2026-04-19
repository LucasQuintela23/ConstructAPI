import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import DataTable from '../components/DataTable';
import { FiPlus, FiUpload, FiSearch, FiArrowLeft } from 'react-icons/fi';

export default function DataView() {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(
    async (page = 1, searchVal = search) => {
      try {
        setLoading(true);
        const { data: res } = await api.get(
          `/data/${id}?page=${page}&limit=20&search=${encodeURIComponent(searchVal)}`
        );
        setData(res.data);
        setPagination(res.pagination);
      } catch (e) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    },
    [id, search]
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const { data: res } = await api.get(`/templates/${id}`);
        if (!cancelled) {
          setTemplate(res.template);
          await fetchData(1, '');
        }
      } catch (e) {
        if (!cancelled) {
          setError('Failed to load template');
          setLoading(false);
        }
      }
    }
    init();
    return () => { cancelled = true; };
  }, [id, fetchData]);

  async function handleDelete(recordId) {
    if (!window.confirm('Delete this record?')) return;
    try {
      await api.delete(`/data/${id}/${recordId}`);
      fetchData(pagination.page);
    } catch {
      alert('Failed to delete record');
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchData(1, search);
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>;
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/templates" className="text-gray-400 hover:text-gray-600">
            <FiArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{template.name}</h1>
            <p className="text-sm text-gray-400">{pagination.total} records</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/templates/${id}/upload`}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <FiUpload /> Upload
          </Link>
          <Link
            to={`/templates/${id}/form`}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <FiPlus /> Add Record
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow p-5">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); fetchData(1, ''); }}
              className="px-3 py-2 text-sm border rounded-lg text-gray-500 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </form>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <DataTable
            fields={template.fields}
            data={data}
            pagination={pagination}
            onPageChange={page => fetchData(page)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
