
import React, { useState, useEffect, useRef } from 'react';
import type { SearchResult } from '../types';
import { countryCoordinates } from './data/countries';

interface SearchBarProps {
    onSearch: (result: SearchResult) => void;
}

const SearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const LoadingSpinner: React.FC = () => (
     <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
);

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggestionsVisible, setSuggestionsVisible] = useState(false);
    const debounceTimeout = useRef<number | null>(null);

    // This effect ensures that any pending timeout is cleared when the component unmounts.
    useEffect(() => {
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, []);
    
    useEffect(() => {
        // Clear the previous timeout whenever the query changes.
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        if (query.length < 3) {
            setSuggestions([]);
            setIsLoading(false);
            return; // Exit early if the query is too short.
        }

        setIsLoading(true);
        
        // Set a new timeout to fetch suggestions.
        debounceTimeout.current = window.setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`);
                if (!response.ok) throw new Error("Network response was not ok.");
                const data = await response.json();
                setSuggestions(data || []);
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

    }, [query]);

    const getZoomFromType = (osmClass: string, osmType: string, addresstype?: string): number => {
        if (addresstype === 'country' || osmType === 'country') {
            return 4;
        }
        if (addresstype === 'state' || osmType === 'state') {
            return 6;
        }
    
        switch (osmClass) {
            case 'place':
                switch(osmType) {
                    case 'city': return 10;
                    case 'town': return 12;
                    case 'village': return 14;
                    default: return 13;
                }
            case 'boundary':
                // This is for other administrative boundaries (e.g., county, region)
                return 8;
            case 'highway': return 16;
            case 'amenity': return 17;
            case 'building': return 18;
            case 'tourism': return 17;
            case 'historic': return 17;
            default: return 15;
        }
    };
    
    const handleSelectSuggestion = (item: any) => {
        setQuery(item.display_name);
        setSuggestions([]);
        setSuggestionsVisible(false);
        
        const result: SearchResult = {
            name: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            bounds: item.boundingbox 
                ? (() => {
                    const [s, n, w, e] = item.boundingbox.map(parseFloat);
                    return [[s, w], [n, e]];
                  })()
                : null,
            zoom: getZoomFromType(item.class, item.type, item.addresstype)
        };
        onSearch(result);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const searchTerm = query.trim();
        if (!searchTerm) return;
    
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        setIsLoading(true);
        setSuggestions([]);
        setSuggestionsVisible(false);
    
        try {
            const normalizedSearchTerm = searchTerm.toLowerCase();
            const localCountryCoords = countryCoordinates[normalizedSearchTerm];
    
            if (localCountryCoords) {
                // It's a country from our curated list.
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&addressdetails=1&limit=5`);
                if (!response.ok) throw new Error("Network response was not ok.");
                const data = await response.json();
                
                const countryApiResult = data.find((item: any) => item.addresstype === 'country' || item.type === 'country');
                
                let resultToSend: SearchResult;
    
                if (countryApiResult && countryApiResult.boundingbox) {
                    const [s, n, w, e] = countryApiResult.boundingbox.map(parseFloat);
                    resultToSend = {
                        name: countryApiResult.display_name,
                        latitude: localCountryCoords[0],
                        longitude: localCountryCoords[1],
                        bounds: [[s, w], [n, e]],
                        zoom: getZoomFromType(countryApiResult.class, countryApiResult.type, countryApiResult.addresstype)
                    };
                } else {
                    resultToSend = {
                        name: searchTerm,
                        latitude: localCountryCoords[0],
                        longitude: localCountryCoords[1],
                        bounds: null,
                        zoom: 4
                    };
                }
                onSearch(resultToSend);
            } else {
                // Not a country from our list, perform a standard search.
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&addressdetails=1&limit=1`);
                if (!response.ok) throw new Error("Network response was not ok.");
                const data = await response.json();
    
                if (!data || data.length === 0) {
                    throw new Error("Location not found.");
                }
                const topResult = data[0];
                
                const resultToSend: SearchResult = {
                    name: topResult.display_name,
                    latitude: parseFloat(topResult.lat),
                    longitude: parseFloat(topResult.lon),
                    bounds: topResult.boundingbox ? (() => {
                        const [s, n, w, e] = topResult.boundingbox.map(parseFloat);
                        return [[s, w], [n, e]];
                      })() : null,
                    zoom: getZoomFromType(topResult.class, topResult.type, topResult.addresstype)
                };
                onSearch(resultToSend);
            }
    
        } catch (error: any) {
            console.error("Failed to perform search:", error);
            alert(error.message || "An error occurred while searching. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-xs sm:max-w-md px-4 pointer-events-auto">
            <form onSubmit={handleFormSubmit} className="relative" autoComplete="off">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                   {isLoading ? <LoadingSpinner /> : <SearchIcon />}
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setSuggestionsVisible(true);
                    }}
                    onFocus={() => setSuggestionsVisible(true)}
                    onBlur={() => setTimeout(() => setSuggestionsVisible(false), 150)}
                    placeholder="Search for a country, city, or place..."
                    className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-transparent dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full shadow-lg transition-colors"
                />
            </form>
            {isSuggestionsVisible && suggestions.length > 0 && (
                <div className="mt-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden">
                    <ul>
                        {suggestions.map((item) => (
                            <li key={item.osm_id}>
                                <button
                                    onMouseDown={() => handleSelectSuggestion(item)}
                                    className="w-full text-left px-4 py-3 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
                                >
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{item.display_name.split(',')[0]}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.display_name.substring(item.display_name.indexOf(',') + 1).trim()}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchBar;