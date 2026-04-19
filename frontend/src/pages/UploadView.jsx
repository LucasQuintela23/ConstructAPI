import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { FiUpload, FiArrowLeft, FiFile, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function UploadView() {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api
      .get(`/templates/${id}`)
      .then(({ data }) => setTemplate(data.template))
      .catch(() => setError('Failed to load template'));
  }, [id]);

  function handleFile(f) {
    if (!f) return;
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
    ];
    if (!allowed.includes(f.type) && !f.name.match(/\.(xlsx|csv)$/i)) {
      setError('Please upload an Excel (.xlsx) or CSV file');
      return;
    }
    setFile(f);
    setResult(null);
    setError('');
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/upload/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setFile(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/templates/${id}/data`} className="text-gray-400 hover:text-gray-600">
          <FiArrowLeft className="text-xl" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{template?.name || 'Upload'}</h1>
          <p className="text-sm text-gray-400">Import data from spreadsheet</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
          <FiAlertCircle /> {error}
        </div>
      )}

      {template && (
        <div className="bg-white rounded-xl border border-gray-100 shadow p-6 mb-4">
          <p className="text-sm text-gray-600 mb-2 font-medium">Expected columns:</p>
          <div className="flex flex-wrap gap-1">
            {template.fields.map(f => (
              <span
                key={f.name}
                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
              >
                {f.label || f.name}
                {f.required && <span className="text-red-400 ml-0.5">*</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow p-6">
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
        >
          <FiUpload className="mx-auto text-4xl text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-600">
            Drag & drop a file here, or <span className="text-indigo-600">click to select</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .csv</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between bg-gray-50 border rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FiFile className="text-indigo-500" />
              <span className="font-medium">{file.name}</span>
              <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-red-500 text-lg"
            >
              ×
            </button>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Uploading...
            </>
          ) : (
            <>
              <FiUpload /> Upload & Import
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
            <FiCheckCircle /> Import Complete
          </div>
          <ul className="text-sm text-green-700 space-y-1">
            <li>✓ {result.imported} records imported</li>
            {result.skipped > 0 && <li>⚠ {result.skipped} records skipped</li>}
          </ul>
          {result.errors?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
              <ul className="text-xs text-red-500 space-y-0.5 max-h-32 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i}>Row {e.row}: {e.error}</li>
                ))}
              </ul>
            </div>
          )}
          <Link
            to={`/templates/${id}/data`}
            className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
          >
            View imported data →
          </Link>
        </div>
      )}
    </div>
  );
}
