import React from 'react';
import type { MapStyle } from '../types';

interface MapControlsProps {
    mapStyle: MapStyle;
    setMapStyle: (style: MapStyle) => void;
}

const StreetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"></path><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>;
const SatelliteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.95.55a1 1 0 0 0-1.5-1.5L16 3l-1.5-1.5a1 1 0 0 0-1.4 0L12 3l-1.5-1.5a1 1 0 0 0-1.4 0L7.5 3 6 1.5a1 1 0 0 0-1.4 0L3 3 1.5 1.5a1 1 0 0 0-1.4 0L.55 2.05a1 1 0 0 0 0 1.4L2 5l-1.5 1.5a1 1 0 0 0 0 1.4L2 9.5l-1.5 1.5a1 1 0 0 0 0 1.4L2 14l-1.5 1.5a1 1 0 0 0 0 1.4L2 18.5l-1.5 1.5a1 1 0 0 0 0 1.4l.45.45a1 1 0 0 0 1.5-1.5L3 19.5l1.5 1.5a1 1 0 0 0 1.4 0L7.5 19.5l1.5 1.5a1 1 0 0 0 1.4 0L12 19.5l1.5 1.5a1 1 0 0 0 1.4 0L16.5 19.5l1.5 1.5a1 1 0 0 0 1.4 0l1.5-1.5 1.5 1.5a1 1 0 0 0 1.4 0l1.5-1.5 1.5 1.5a1 1 0 0 0 1.4 0l1.5-1.5.05-.05a1 1 0 0 0-1.5-1.5L19.5 18l1.5-1.5a1 1 0 0 0 0-1.4L19.5 15l1.5-1.5a1 1 0 0 0 0-1.4L19.5 10.5l1.5-1.5a1 1 0 0 0 0-1.4L19.5 6l1.5-1.5a1 1 0 0 0 0-1.4L19.5 2l2.45-2.45z"/><circle cx="12" cy="12" r="3"/></svg>;

const MapControls: React.FC<MapControlsProps> = ({ mapStyle, setMapStyle }) => {
    
    const controlOptions = [
        { name: 'street', icon: <StreetIcon />, label: 'Street' },
        { name: 'satellite', icon: <SatelliteIcon />, label: 'Satellite' }
    ];

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:left-4 md:-translate-x-0 z-10 p-1 bg-white/70 dark:bg-black/50 backdrop-blur-md rounded-full shadow-lg pointer-events-auto">
            <div className="flex items-center gap-1">
                {controlOptions.map(option => (
                    <button
                        key={option.name}
                        onClick={() => setMapStyle(option.name as MapStyle)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${mapStyle === option.name ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-900/40'}`}
                        aria-label={`Switch to ${option.label} view`}
                    >
                        {option.icon}
                        <span className="hidden sm:inline">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MapControls;