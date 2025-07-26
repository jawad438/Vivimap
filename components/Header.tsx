import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import type { Session, Theme } from '../types';

interface HeaderProps {
    session: Session | null;
    onLoginClick: () => void;
    onLogout: () => void;
}

const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const SystemIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>;

const ThemeToggle: React.FC = () => {
    const context = useContext(ThemeContext);
    if (!context) return null;
    const { theme, setTheme } = context;

    const themes: {name: Theme, icon: React.ReactNode}[] = [
        { name: 'light', icon: <SunIcon /> },
        { name: 'dark', icon: <MoonIcon /> },
        { name: 'system', icon: <SystemIcon /> },
    ];

    return (
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-full">
            {themes.map(t => (
                <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className={`p-1.5 rounded-full transition-colors ${theme === t.name ? 'bg-emerald-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                    aria-label={`Set theme to ${t.name}`}
                >
                    {t.icon}
                </button>
            ))}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ session, onLoginClick, onLogout }) => {
    const user = session?.user;
    const displayName = user?.fullName || user?.email;

    return (
        <header className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center pointer-events-none">
            <div className="bg-white/70 dark:bg-black/50 backdrop-blur-md p-2 px-4 rounded-full shadow-lg pointer-events-auto">
                <h1 className="text-lg font-bold tracking-wider text-gray-900 dark:text-white">Vivimap</h1>
            </div>

            <div className="flex items-center gap-4 pointer-events-auto">
                 <ThemeToggle />
                 <div className="bg-white/70 dark:bg-black/50 backdrop-blur-md p-2 px-4 rounded-full shadow-lg">
                    {session ? (
                        <div className="flex items-center gap-3">
                            <span className="font-medium text-sm text-gray-900 dark:text-white truncate max-w-xs" title={session.user.email}>{displayName}</span>
                            <button onClick={onLogout} className="text-sm text-red-600 dark:text-red-400 hover:underline">Logout</button>
                        </div>
                    ) : (
                        <button onClick={onLoginClick} className="font-medium text-sm text-gray-900 dark:text-white">
                            Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;