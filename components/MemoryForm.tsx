
import React, { useState, useEffect, useRef } from 'react';
import type { LatLngTuple } from 'leaflet';
import { MAX_TOTAL_SIZE_MB } from '../lib/constants';

interface MemoryFormProps {
    position: LatLngTuple | null;
    onSubmit: (formData: { title: string; description: string; files: File[] }) => void;
    onClose: () => void;
}

const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


const MemoryForm: React.FC<MemoryFormProps> = ({ position, onSubmit, onClose }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (position) {
            setTitle('');
            setDescription('');
            setFiles([]);
            setError('');
            setIsLoading(false);
        }
    }, [position]);

    const isVisible = !!position;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }
        setIsLoading(true);
        try {
            await onSubmit({ title, description, files });
        } catch (err) {
            // Error handling is likely in the parent, but we can catch here too if needed
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const allFiles = [...files, ...newFiles];
            const totalSize = allFiles.reduce((acc, file) => acc + file.size, 0);

            if (totalSize > MAX_TOTAL_SIZE_BYTES) {
                setError(`Total file size cannot exceed ${MAX_TOTAL_SIZE_MB}MB.`);
                return;
            }
            setFiles(allFiles);
        }
    };

    const removeFile = (fileName: string) => {
        setFiles(files.filter(f => f.name !== fileName));
    };

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    return (
        <div className={`fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div ref={panelRef} className={`relative bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl w-full max-w-md m-4 transform transition-all duration-300 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <CloseIcon />
                </button>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create a New Memory</h2>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="A day to remember..."
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="What happened here?"
                        />
                    </div>
                     <div>
                        <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attach Media</label>
                        <label className="w-full flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg shadow-sm tracking-wide border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white">
                             <svg className="w-6 h-6 mr-2" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4 4-4-4h3v-4h2v4z" />
                             </svg>
                             <span className="text-sm">Add files...</span>
                             <input type='file' id="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,audio/*" multiple />
                         </label>
                         <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total size: {(totalSize / 1024 / 1024).toFixed(2)}MB / {MAX_TOTAL_SIZE_MB}MB</div>
                    </div>
                    {files.length > 0 && (
                        <div className="space-y-2">
                           {files.map(f => (
                               <div key={f.name} className="flex justify-between items-center text-sm p-2 rounded-md bg-gray-100 dark:bg-gray-700">
                                   <span className="truncate pr-2">{f.name}</span>
                                   <button type="button" onClick={() => removeFile(f.name)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                               </div>
                           ))}
                        </div>
                    )}
                     {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-emerald-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!title.trim() || isLoading}>
                            {isLoading ? 'Saving...' : 'Save Memory'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MemoryForm;
