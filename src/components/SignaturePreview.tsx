import React from 'react';
import { Copy } from 'lucide-react';

interface SignaturePreviewProps {
  signature: string;
}

const SignaturePreview: React.FC<SignaturePreviewProps> = ({ signature }) => {
  const copySignature = () => {
    navigator.clipboard.writeText(signature);
    alert('Signature copied to clipboard!');
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Preview</h2>
      <div className="border border-gray-300 rounded-md p-4 flex-grow mb-4 overflow-auto">
        {signature ? (
          <div dangerouslySetInnerHTML={{ __html: signature }} />
        ) : (
          <p className="text-gray-400">Your signature preview will appear here...</p>
        )}
      </div>
      <button
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center"
        onClick={copySignature}
      >
        <Copy className="mr-2 h-4 w-4" /> Copy Signature
      </button>
    </div>
  );
};

export default SignaturePreview;