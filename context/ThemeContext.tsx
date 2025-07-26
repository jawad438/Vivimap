import React from 'react';
import type { Theme } from '../types';

export const ThemeContext = React.createContext<{
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
} | null>(null);
