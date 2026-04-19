import { FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';

export default function DataTable({ fields, data, pagination, onPageChange, onDelete }) {
  const { page, pages, total } = pagination;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {fields.map(f => (
                <th
                  key={f.name}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {f.label || f.name}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={fields.length + 2}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No records found
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {fields.map(f => (
                    <td key={f.name} className="px-4 py-3 text-gray-700 max-w-xs truncate">
                      {f.type === 'boolean'
                        ? row[f.name] ? 'Yes' : 'No'
                        : row[f.name] ?? '—'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onDelete(row.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Delete record"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Page {page} of {pages} &mdash; {total} total records
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-gray-100"
            >
              <FiChevronLeft /> Prev
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="flex items-center gap-1 px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-gray-100"
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
