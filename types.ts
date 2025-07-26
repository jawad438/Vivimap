import type { LatLngExpression } from 'leaflet';

export type MemoryFileType = 'image' | 'video' | 'audio';
export type Theme = 'light' | 'dark' | 'system';
export type MapStyle = 'street' | 'satellite';

export interface MemoryFile {
  url?: string; // Optional: for client-side previews
  type: MemoryFileType;
  name: string;
  file?: File; // Optional: for client-side handling
}

export interface Memory {
  id: string;
  position: LatLngExpression;
  title: string;
  description: string;
  files: MemoryFile[];
  author: string;
}

// Types for the custom backend JWT authentication
export interface User {
  id: string;
  email: string;
  fullName: string;
  username: string;
}

export interface Session {
  user: User;
}

export interface SearchSuggestion {
  name: string;
  description: string;
}

// Leaflet's LatLngBoundsLiteral is a tuple of two LatLngs: [[south, west], [north, east]]
export type LatLngBoundsLiteral = [[number, number], [number, number]];

export interface SearchResult {
    name: string;
    latitude: number;
    longitude: number;
    zoom: number;
    bounds?: LatLngBoundsLiteral | null; 
}