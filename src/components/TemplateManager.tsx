import React, { useState } from 'react';
import { Save, Trash2, Download, Eye } from 'lucide-react';

interface TemplateManagerProps {
  templates: { [key: string]: string };
  saveTemplate: (name: string, content: string) => void;
  loadTemplate: (name: string) => void;
  deleteTemplate: (name: string) => void;
  currentSignature: string;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  saveTemplate,
  loadTemplate,
  deleteTemplate,
  currentSignature,
}) => {
  const [newTemplateName, setNewTemplateName] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleSave = () => {
    if (newTemplateName.trim()) {
      saveTemplate(newTemplateName.trim(), currentSignature);
      setNewTemplateName('');
    }
  };

  const exportTemplate = (name: string, fileType: 'html' | 'txt') => {
    const templateContent = templates[name];
    const blob = new Blob([templateContent], { type: fileType === 'html' ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.${fileType}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpenDropdown(null);
  };

  const handleDeleteTemplate = (name: string) => {
    if (window.confirm(`Are you sure you want to delete the template "${name}"?`)) {
      deleteTemplate(name);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-8">
      <h2 className="text-lg font-semibold mb-4">Template Manager</h2>
      <div className="flex mb-4">
        <input
          type="text"
          value={newTemplateName}
          onChange={(e) => setNewTemplateName(e.target.value)}
          placeholder="New template name"
          className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
        >
          <Save className="mr-2 h-4 w-4" /> Save
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto">
        <ul className="space-y-2">
          {Object.entries(templates).map(([name, _]) => (
            <li key={name} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span>{name}</span>
              <div className="flex items-center">
                <button
                  onClick={() => loadTemplate(name)}
                  className="mr-2 text-indigo-600 hover:text-indigo-800"
                  title="Load template"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === name ? null : name)}
                    className="mr-2 text-green-600 hover:text-green-800 focus:outline-none"
                    title="Export template"
                  >
                    <Download className="lucide lucide-download h-4 w-4" />
                  </button>
                  {openDropdown === name && (
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10">
                      <button
                        onClick={() => exportTemplate(name, 'html')}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Export as HTML
                      </button>
                      <button
                        onClick={() => exportTemplate(name, 'txt')}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Export as Text
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTemplate(name)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete template"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TemplateManager;