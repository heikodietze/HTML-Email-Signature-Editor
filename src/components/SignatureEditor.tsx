import React, { useRef, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism.css';

interface SignatureEditorProps {
  signature: string;
  setSignature: (signature: string) => void;
  selectedTemplate: string | null;
  setSelectedTemplate: (template: string | null) => void;
  saveTemplate: (name: string, content: string) => void;
  loadTemplate: (name: string) => void;
}

const SignatureEditor: React.FC<SignatureEditorProps> = ({ 
  signature, 
  setSignature, 
  selectedTemplate, 
  setSelectedTemplate,
  saveTemplate,
  loadTemplate
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      const textarea = editorRef.current.querySelector('textarea');
      if (textarea) {
        textarea.style.height = '100%';
        textarea.style.minHeight = '16rem';
      }
    }
  }, []);

  const handleClearEditor = () => {
    if (signature.trim()) {
      const shouldSave = window.confirm("Do you want to save the current content before clearing?");
      if (shouldSave) {
        const templateName = prompt("Enter a name for this template:");
        if (templateName) {
          saveTemplate(templateName, signature);
        }
      }
    }
    setSignature('');
    setSelectedTemplate(null);
  };

  const handleImportTemplate = () => {
    const templateName = prompt("Enter the name of the template to import:");
    if (templateName) {
      if (signature.trim()) {
        const shouldSave = window.confirm("Do you want to save the current content before importing?");
        if (shouldSave) {
          const currentTemplateName = prompt("Enter a name for the current template:");
          if (currentTemplateName) {
            saveTemplate(currentTemplateName, signature);
          }
        }
      }
      loadTemplate(templateName);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {selectedTemplate ? `Editing: ${selectedTemplate}` : 'Edit Your Signature'}
        </h2>
        <div>
          <button
            onClick={handleImportTemplate}
            className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 mr-2"
          >
            Import Template
          </button>
          <button
            onClick={handleClearEditor}
            className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Clear Editor
          </button>
        </div>
      </div>
      <div 
        ref={editorRef}
        className="border border-gray-300 rounded-md overflow-hidden"
        style={{ height: 'calc(100% - 4rem)', minHeight: '16rem' }}
      >
        <Editor
          value={signature}
          onValueChange={(code) => {
            setSignature(code);
            if (selectedTemplate) {
              setSelectedTemplate(null);
            }
          }}
          highlight={code => highlight(code, languages.markup, 'html')}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: '14px',
            height: '100%',
            minHeight: '16rem',
            overflowY: 'auto',
          }}
          className="w-full h-full"
          placeholder="Enter your HTML signature here..."
        />
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Tips:</p>
        <ul className="list-disc list-inside">
          <li>Use &lt;table&gt; for consistent layout across email clients</li>
          <li>Keep images under 50KB and host them online</li>
          <li>Use inline CSS for styling</li>
          <li>Test your signature in multiple email clients</li>
        </ul>
      </div>
    </div>
  );
};

export default SignatureEditor;