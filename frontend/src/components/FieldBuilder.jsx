import { useState } from 'react';
import { FiPlus, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const FIELD_TYPES = ['text', 'number', 'date', 'boolean', 'select', 'email', 'textarea'];

const emptyField = () => ({
  name: '',
  label: '',
  type: 'text',
  required: false,
  options: [],
});

export default function FieldBuilder({ fields, onChange }) {
  const [optionInputs, setOptionInputs] = useState({});

  function addField() {
    onChange([...fields, emptyField()]);
  }

  function removeField(index) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function updateField(index, key, value) {
    const updated = fields.map((f, i) => (i === index ? { ...f, [key]: value } : f));
    onChange(updated);
  }

  function moveField(index, direction) {
    const newFields = [...fields];
    const target = index + direction;
    if (target < 0 || target >= newFields.length) return;
    [newFields[index], newFields[target]] = [newFields[target], newFields[index]];
    onChange(newFields);
  }

  function addOption(index) {
    const val = (optionInputs[index] || '').trim();
    if (!val) return;
    const field = fields[index];
    updateField(index, 'options', [...(field.options || []), val]);
    setOptionInputs(prev => ({ ...prev, [index]: '' }));
  }

  function removeOption(fieldIndex, optIndex) {
    const field = fields[fieldIndex];
    updateField(fieldIndex, 'options', field.options.filter((_, i) => i !== optIndex));
  }

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">Field {index + 1}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveField(index, -1)}
                className="p-1 text-gray-400 hover:text-gray-600"
                disabled={index === 0}
              >
                <FiChevronUp />
              </button>
              <button
                type="button"
                onClick={() => moveField(index, 1)}
                className="p-1 text-gray-400 hover:text-gray-600"
                disabled={index === fields.length - 1}
              >
                <FiChevronDown />
              </button>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="p-1 text-red-400 hover:text-red-600"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Field Name *</label>
              <input
                type="text"
                value={field.name}
                onChange={e => updateField(index, 'name', e.target.value.replace(/\s+/g, '_').toLowerCase())}
                placeholder="field_name"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
              <input
                type="text"
                value={field.label}
                onChange={e => updateField(index, 'label', e.target.value)}
                placeholder="Human Readable Label"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={field.type}
                onChange={e => updateField(index, 'type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {FIELD_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id={`required-${index}`}
                checked={field.required}
                onChange={e => updateField(index, 'required', e.target.checked)}
                className="w-4 h-4 text-indigo-600"
              />
              <label htmlFor={`required-${index}`} className="text-sm text-gray-600">Required</label>
            </div>
          </div>

          {field.type === 'select' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Options</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(field.options || []).map((opt, oi) => (
                  <span
                    key={oi}
                    className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs"
                  >
                    {opt}
                    <button type="button" onClick={() => removeOption(index, oi)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={optionInputs[index] || ''}
                  onChange={e => setOptionInputs(prev => ({ ...prev, [index]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption(index))}
                  placeholder="Add option..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => addOption(index)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-2 w-full justify-center py-2.5 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm font-medium"
      >
        <FiPlus /> Add Field
      </button>
    </div>
  );
}
