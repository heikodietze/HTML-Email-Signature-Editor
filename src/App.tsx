import React, { useState, useEffect } from 'react';
import SignatureEditor from './components/SignatureEditor';
import SignaturePreview from './components/SignaturePreview';
import TemplateManager from './components/TemplateManager';
import { ArrowUpRight } from 'lucide-react';

const APP_VERSION = '1.3.1';

function App() {
  const [signature, setSignature] = useState<string>('');
  const [versionDisplay, setVersionDisplay] = useState<string>('1.0.0');
  const [templates, setTemplates] = useState<{ [key: string]: string }>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    // Version count-up effect
    const targetVersion = APP_VERSION.split('.').map(Number);
    const currentVersion = [1, 0, 0];
    const interval = setInterval(() => {
      if (currentVersion.join('.') === APP_VERSION) {
        clearInterval(interval);
        return;
      }
      for (let i = 2; i >= 0; i--) {
        if (currentVersion[i] < targetVersion[i]) {
          currentVersion[i]++;
          break;
        }
      }
      setVersionDisplay(currentVersion.join('.'));
    }, 100);

    // Load templates from local storage
    const storedTemplates = localStorage.getItem('signatureTemplates');
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    }

    return () => clearInterval(interval);
  }, []);

  const saveTemplate = (name: string, content: string) => {
    const newTemplates = { ...templates, [name]: content };
    setTemplates(newTemplates);
    localStorage.setItem('signatureTemplates', JSON.stringify(newTemplates));
  };

  const loadTemplate = (name: string) => {
    setSignature(templates[name]);
    setSelectedTemplate(name);
  };

  const deleteTemplate = (name: string) => {
    const newTemplates = { ...templates };
    delete newTemplates[name];
    setTemplates(newTemplates);
    localStorage.setItem('signatureTemplates', JSON.stringify(newTemplates));
    if (selectedTemplate === name) {
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Email Signature Editor <span className="text-sm font-normal text-gray-500">v{versionDisplay}</span>
          </h1>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 flex items-center"
          >
            View on GitHub <ArrowUpRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </header>
      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2 flex flex-col">
          <SignatureEditor
            signature={signature}
            setSignature={setSignature}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            saveTemplate={saveTemplate}
            loadTemplate={loadTemplate}
          />
          <TemplateManager
            templates={templates}
            saveTemplate={saveTemplate}
            loadTemplate={loadTemplate}
            deleteTemplate={deleteTemplate}
            currentSignature={signature}
          />
        </div>
        <div className="w-full md:w-1/2">
          <SignaturePreview signature={signature} />
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          &copy; 2024 Email Signature Editor v{APP_VERSION}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;