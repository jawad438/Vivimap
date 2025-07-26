import React, { useEffect, useRef } from 'react';
import type { Memory, MemoryFile } from '../types';

interface MemoryViewPanelProps {
    memory: Memory | null;
    onClose: () => void;
}

const CloseIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500 dark:text-gray-400">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
);


const MediaItem: React.FC<{ file: MemoryFile }> = ({ file }) => {
    // If the file URL isn't available (e.g., for memories fetched from the server),
    // display a placeholder with the file name.
    if (!file.url) {
        return (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-3">
                <FileIcon />
                <span className="text-sm font-medium truncate text-gray-700 dark:text-gray-300">{file.name}</span>
            </div>
        );
    }

    switch (file.type) {
        case 'image':
            return <img src={file.url} alt={file.name} className="w-full h-auto rounded-lg object-cover" />;
        case 'video':
            return <video src={file.url} controls className="w-full h-auto rounded-lg bg-black" />;
        case 'audio':
            return (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm font-medium truncate mb-2">{file.name}</p>
                    <audio src={file.url} controls className="w-full" />
                </div>
            );
        default:
            return null;
    }
};

const MemoryViewPanel: React.FC<MemoryViewPanelProps> = ({ memory, onClose }) => {
    const isVisible = !!memory;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
            
            <div className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] m-4 flex flex-col transform transition-all duration-300 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                {memory && (
                    <>
                        <header className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                           <div>
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{memory.title}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">by {memory.author}</p>
                           </div>
                           <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <CloseIcon className="w-7 h-7" />
                           </button>
                        </header>

                        <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
                            <div className="prose prose-lg dark:prose-invert max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{memory.description}</p>
                            </div>
                            
                            {memory.files.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">Attached Media</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {memory.files.map((file, index) => (
                                            <MediaItem key={index} file={file} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MemoryViewPanel;
