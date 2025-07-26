
import React, { useContext, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L, { type LatLngTuple } from 'leaflet';
import type { Memory, MapStyle } from '../types';
import { ThemeContext } from '../context/ThemeContext';

interface MapWrapperProps {
    memories: Memory[];
    onMapClick: (latlng: LatLngTuple) => void;
    onPinClick: (memory: Memory) => void;
    center: LatLngTuple;
    zoom: number;
    bounds: L.LatLngBoundsExpression | null;
    mapStyle: MapStyle;
}

const pinIcon = new L.DivIcon({
    className: 'custom-pin-container',
    html: `<div class="custom-pin-icon"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

const MapClickHandler: React.FC<{ onClick: (latlng: LatLngTuple) => void }> = ({ onClick }) => {
    useMapEvents({
        click(e) {
            onClick([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

const ChangeView: React.FC<{ center: LatLngTuple; zoom: number, bounds: L.LatLngBoundsExpression | null }> = ({ center, zoom, bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            const MIN_ZOOM = 4;
            const targetZoom = map.getBoundsZoom(bounds, false);

            // If the area is very large (like a big country), fly to the curated center point
            // instead of the bounding box's center, which can be inaccurate for vast regions.
            if (targetZoom < MIN_ZOOM) {
                map.flyTo(center, MIN_ZOOM, { // Use the 'center' prop here to ensure accuracy
                    animate: true,
                    duration: 1.5
                });
            } else {
                map.flyToBounds(bounds, { animate: true, duration: 1.5, padding: [50, 50] });
            }
        } else {
            map.flyTo(center, zoom, {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, zoom, bounds, map]);
    return null;
};

const MapEffect: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        if (!map.getPane('labels')) {
            map.createPane('labels');
            const labelsPane = map.getPane('labels');
            if (labelsPane) {
                labelsPane.style.zIndex = '650';
                labelsPane.style.pointerEvents = 'none';
            }
        }
    }, [map]);
    return null;
}


const MapWrapper: React.FC<MapWrapperProps> = ({ memories, onMapClick, onPinClick, center, zoom, bounds, mapStyle }) => {
    const themeContext = useContext(ThemeContext);
    const resolvedTheme = themeContext?.resolvedTheme || 'light';
    const isDark = resolvedTheme === 'dark';

    // Street map URLs
    const lightStreetUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    const darkStreetUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    const streetAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    
    // Satellite and label URLs for hybrid view
    const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    const satelliteAttribution = '&copy; <a href="https://www.esri.com/en-us/home">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    const darkLabelsUrl = "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"; // Light text for dark backgrounds

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            zoomControl={false}
            attributionControl={false}
            maxZoom={19}
        >
            <MapEffect />
            <ChangeView center={center} zoom={zoom} bounds={bounds} />

            {mapStyle === 'satellite' ? (
                <>
                    <TileLayer url={satelliteUrl} attribution={satelliteAttribution} />
                    {/* Use light-colored text labels on satellite imagery for best contrast */}
                    <TileLayer url={darkLabelsUrl} attribution="" pane="labels"/>
                </>
            ) : (
                 <TileLayer 
                    key={resolvedTheme} 
                    url={isDark ? darkStreetUrl : lightStreetUrl} 
                    attribution={streetAttribution} 
                />
            )}

            <MapClickHandler onClick={onMapClick} />
            {memories.map((memory) => (
                <Marker
                    key={memory.id}
                    position={memory.position}
                    icon={pinIcon}
                >
                    <Popup>
                        <div className="text-base font-bold mb-1">{memory.title}</div>
                        <p className="text-sm mb-2">by {memory.author}</p>
                        <button 
                            onClick={() => onPinClick(memory)}
                            className="w-full text-center px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-emerald-500 transition-colors text-sm"
                        >
                            View Details
                        </button>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapWrapper;