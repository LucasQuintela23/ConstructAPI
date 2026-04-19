export default function FormRenderer({ fields, values, onChange }) {
  function handleChange(name, value) {
    onChange({ ...values, [name]: value });
  }

  return (
    <div className="space-y-4">
      {fields.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label || field.name}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.type === 'textarea' && (
            <textarea
              value={values[field.name] || ''}
              onChange={e => handleChange(field.name, e.target.value)}
              required={field.required}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          {field.type === 'select' && (
            <select
              value={values[field.name] || ''}
              onChange={e => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select --</option>
              {(field.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {field.type === 'boolean' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`field-${field.name}`}
                checked={!!values[field.name]}
                onChange={e => handleChange(field.name, e.target.checked)}
                className="w-4 h-4 text-indigo-600"
              />
              <label htmlFor={`field-${field.name}`} className="text-sm text-gray-600">
                {field.label || field.name}
              </label>
            </div>
          )}

          {!['textarea', 'select', 'boolean'].includes(field.type) && (
            <input
              type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              value={values[field.name] || ''}
              onChange={e => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>
      ))}
    </div>
  );
}
