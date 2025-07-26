
import React from 'react';
import { legalContent } from '../lib/legalContent';

interface LegalPageProps {
  onClose: () => void;
}

const LegalPage: React.FC<LegalPageProps> = ({ onClose }) => {
  return (
    <div className="w-screen h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <header className="flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vivimap - Legal Information</h1>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-emerald-500 transition-colors"
        >
          Back to App
        </button>
      </header>
      <main className="flex-grow overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-10 prose dark:prose-invert prose-h2:text-emerald-500 prose-h2:border-b prose-h2:border-gray-300 dark:prose-h2:border-gray-600 prose-h2:pb-2">
          {legalContent.map((section, index) => (
            <section key={index} className="mb-12">
              <h2 className="text-3xl font-extrabold tracking-tight">{section.title}</h2>
              <p className="italic text-gray-500 dark:text-gray-400">Last Updated: {section.lastUpdated}</p>
              <div className="mt-4 space-y-4" dangerouslySetInnerHTML={{ __html: section.content }} />
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LegalPage;
