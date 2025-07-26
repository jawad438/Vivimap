
import React, { useState, useCallback, useEffect } from 'react';
import L, { type LatLngTuple } from 'leaflet';
import type { Session, Memory, MemoryFile, Theme, MemoryFileType, MapStyle, SearchResult, User } from './types';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import MapWrapper from './components/MapWrapper';
import MemoryForm from './components/MemoryForm';
import MemoryViewPanel from './components/MemoryViewPanel';
import AuthModal from './components/AuthModal';
import SearchBar from './components/SearchBar';
import MapControls from './components/MapControls';
import LegalPage from './components/LegalPage';
import { ThemeContext } from './context/ThemeContext';

const API_URL = '/api';

const App: React.FC = () => {
    const [view, setView] = useState<'landing' | 'map' | 'legal'>('landing');
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
    const [session, setSession] = useState<Session | null>(null);
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);

    const [memories, setMemories] = useState<Memory[]>([]);
    const [newMemoryLocation, setNewMemoryLocation] = useState<LatLngTuple | null>(null);
    const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
    
    const [mapCenter, setMapCenter] = useState<LatLngTuple>([20, 0]);
    const [mapZoom, setMapZoom] = useState<number>(3);
    const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | null>(null);
    const [mapStyle, setMapStyle] = useState<MapStyle>('street');

    // Load initial theme from localStorage
    useEffect(() => {
        const savedTheme = (localStorage.getItem('theme') as Theme) || 'system';
        setThemeState(savedTheme);
    }, []);
    
    // Fetch initial data (memories and session) on app load
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch memories
                const memoriesResponse = await fetch(`${API_URL}/memories`, { credentials: 'include' });
                if (!memoriesResponse.ok) {
                    const errorText = await memoriesResponse.text();
                    throw new Error(`Failed to fetch memories. Status: ${memoriesResponse.status}. Response: ${errorText}`);
                }
                const memoriesData: Memory[] = await memoriesResponse.json();
                setMemories(memoriesData);

                // Check for existing session
                const sessionResponse = await fetch(`${API_URL}/auth/session`, { credentials: 'include' });
                if (sessionResponse.ok) {
                    const sessionData = await sessionResponse.json();
                    setSession({ user: sessionData.user });
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);


    const setTheme = (newTheme: Theme) => {
        localStorage.setItem('theme', newTheme);
        setThemeState(newTheme);
    };
    
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = () => {
            if (theme === 'system') {
                setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
            }
        };

        if (theme === 'system') {
            setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
            mediaQuery.addEventListener('change', handleSystemThemeChange);
        } else {
            setResolvedTheme(theme);
        }

        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, [theme]);

    useEffect(() => {
        if (resolvedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        }
    }, [resolvedTheme]);

    useEffect(() => {
        document.body.classList.remove('map-style-street', 'map-style-satellite');
        document.body.classList.add(`map-style-${mapStyle}`);
    }, [mapStyle]);

    const handleEnterMap = () => setView('map');
    const handleViewLegal = () => setView('legal');
    const handleCloseLegal = () => setView(session ? 'map' : 'landing');

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setSession(null);
        }
    };
    
    const handleAuthSuccess = (user: User) => {
        setSession({ user });
        setAuthModalOpen(false);
    };

    const handleMapClick = useCallback((latlng: LatLngTuple) => {
        if (!session) {
            setAuthModalOpen(true);
            return;
        }
        
        const EXCLUSIVITY_RADIUS_METERS = 10;
        const isTooClose = memories.some(memory => {
            const memoryPosition = L.latLng(memory.position as LatLngTuple);
            const clickPosition = L.latLng(latlng);
            const distance = clickPosition.distanceTo(memoryPosition);
            return distance < EXCLUSIVITY_RADIUS_METERS;
        });

        if (isTooClose) {
            alert("This area is too close to an existing memory. Please choose a spot further away.");
            return;
        }

        setSelectedMemory(null);
        setNewMemoryLocation(latlng);
    }, [session, memories]);

    const handlePinClick = useCallback((memory: Memory) => {
        setNewMemoryLocation(null);
        setSelectedMemory(memory);
    }, []);

    const handleClosePanels = useCallback(() => {
        setNewMemoryLocation(null);
        setSelectedMemory(null);
    }, []);

    const handleFormSubmit = useCallback(async (formData: { title: string; description: string; files: File[] }) => {
        if (!newMemoryLocation || !session) return;

        const memoryFiles = formData.files.map(file => {
            let fileType: MemoryFileType = 'image';
            if (file.type.startsWith('video/')) fileType = 'video';
            else if (file.type.startsWith('audio/')) fileType = 'audio';
            return { name: file.name, type: fileType };
        });

        const newMemoryData = {
            position: newMemoryLocation,
            title: formData.title,
            description: formData.description,
            files: memoryFiles,
        };

        try {
            const response = await fetch(`${API_URL}/memories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newMemoryData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save memory');
            }

            const savedMemory: Memory = await response.json();
            
            setMemories(prev => [...prev, savedMemory]);
            handleClosePanels();
        } catch (error: any) {
            console.error("Error saving memory:", error);
            alert(`Could not save memory: ${error.message}`);
        }
    }, [newMemoryLocation, session, handleClosePanels]);

    const handleSearch = (result: SearchResult) => {
        setMapCenter([result.latitude, result.longitude]);
        if (result.bounds) {
            setMapBounds(result.bounds);
        } else {
            setMapBounds(null);
            setMapZoom(result.zoom);
        }
    };


    if (view === 'landing') {
        return <LandingPage onEnter={handleEnterMap} />;
    }
    
    if (view === 'legal') {
        return <LegalPage onClose={handleCloseLegal} />;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            <div className="relative w-screen h-screen overflow-hidden">
                <Header session={session} onLoginClick={() => setAuthModalOpen(true)} onLogout={handleLogout} />
                <SearchBar onSearch={handleSearch} />
                <MapWrapper
                    memories={memories}
                    onMapClick={handleMapClick}
                    onPinClick={handlePinClick}
                    center={mapCenter}
                    zoom={mapZoom}
                    bounds={mapBounds}
                    mapStyle={mapStyle}
                />
                <MapControls mapStyle={mapStyle} setMapStyle={setMapStyle} />
                <MemoryForm
                    position={newMemoryLocation}
                    onSubmit={handleFormSubmit}
                    onClose={handleClosePanels}
                />
                <MemoryViewPanel
                    memory={selectedMemory}
                    onClose={handleClosePanels}
                />
                <AuthModal 
                    isOpen={isAuthModalOpen}
                    onClose={() => setAuthModalOpen(false)}
                    onViewLegal={handleViewLegal}
                    onAuthSuccess={handleAuthSuccess}
                />
            </div>
        </ThemeContext.Provider>
    );
};

export default App;
