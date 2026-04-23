import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import EXIF from 'exif-js';
import { MapPin, Navigation, Layers, Loader2 } from 'lucide-react';

// --- Configuration ---
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const LocationVerifier = ({ file, onLocationVerified, className }) => {
    const [viewState, setViewState] = useState({
        latitude: 20.5937,
        longitude: 78.9629,
        zoom: 4
    });
    const [marker, setMarker] = useState(null); // { lat, lng }
    const [address, setAddress] = useState('');
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
    const [isLocating, setIsLocating] = useState(false);
    const mapRef = useRef(null);

    // --- 4. Reverse Geocoding ---
    const fetchAddress = useCallback(async (lat, lng) => {
        setLoadingAddress(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const addr = res.data.display_name || "Address not found";
            setAddress(addr);
            if (onLocationVerified) onLocationVerified({ lat, lng, address: addr });
        } catch (error) {
            setAddress("Error fetching address");
        } finally {
            setLoadingAddress(false);
        }
    }, [onLocationVerified]);

    // --- 2. Update Location Helper ---
    const updateLocation = useCallback((lat, lng) => {
        setMarker({ lat, lng });
        setViewState(prev => ({ ...prev, latitude: lat, longitude: lng, zoom: 16 }));
        fetchAddress(lat, lng);
    }, [fetchAddress]);

    const convertDMSToDD = (dms, ref) => {
        let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
        if (ref === 'S' || ref === 'W') {
            dd = dd * -1;
        }
        return dd;
    };

    // --- 1. Smart Source Priority: Check EXIF ---
    useEffect(() => {
        if (file) {
            setIsLocating(true);
            EXIF.getData(file, function () {
                const lat = EXIF.getTag(this, 'GPSLatitude');
                const lng = EXIF.getTag(this, 'GPSLongitude');
                const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
                const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');

                if (lat && lng && latRef && lngRef) {
                    const ddLat = convertDMSToDD(lat, latRef);
                    const ddLng = convertDMSToDD(lng, lngRef);

                    updateLocation(ddLat, ddLng);
                    setMapStyle('mapbox://styles/mapbox/satellite-streets-v12');
                }
                setIsLocating(false);
            });
        }
    }, [file, updateLocation]);

    // --- 3. Use Current Location ---
    const handleUseCurrentLocation = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    updateLocation(pos.coords.latitude, pos.coords.longitude);
                    setMapStyle('mapbox://styles/mapbox/satellite-streets-v12');
                    setIsLocating(false);
                },
                (err) => {
                    alert("Could not fetch location. Please enable GPS.");
                    setIsLocating(false);
                },
                { enableHighAccuracy: true }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
            setIsLocating(false);
        }
    };

    // --- 5. Marker Drag Handler ---
    const onMarkerDragEnd = useCallback((event) => {
        const { lng, lat } = event.lngLat;
        updateLocation(lat, lng);
    }, [updateLocation]);

    return (
        <div className={`w-full h-full ${className || ''} relative bg-gray-900 overflow-hidden rounded-xl`}>

            {/* Compact Address Pill (Overlay) */}


            {/* Pulse Animation (while locating) */}
            {isLocating && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-auto">
                    <Loader2 className="animate-spin text-white drop-shadow-lg" size={32} />
                </div>
            )}

            {/* Layer Toggle (Compact) */}
            <button
                onClick={() => setMapStyle(prev => prev.includes('streets') ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/streets-v12')}
                className="absolute top-4 right-4 z-[10] bg-white/90 text-gray-700 p-1.5 rounded-lg shadow-sm hover:bg-white transition-colors"
                title="Toggle View"
            >
                <Layers size={16} />
            </button>

            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
                mapboxAccessToken={MAPBOX_TOKEN}
                ref={mapRef}
            >
                {marker && (
                    <Marker
                        longitude={marker.lng}
                        latitude={marker.lat}
                        anchor="bottom"
                        draggable
                        onDragEnd={onMarkerDragEnd}
                    >
                        <MapPin size={40} className="text-[#e879f9] drop-shadow-lg -translate-y-1/2" fill="white" />
                    </Marker>
                )}

                <NavigationControl position="bottom-right" showCompass={false} />
            </Map>

            {/* --- "Locate Me" Button (Tiny Pill) --- */}
            {!marker && !isLocating && (
                <div className="absolute inset-0 z-[10] flex items-center justify-center bg-black/5 pointer-events-auto">
                    <button
                        onClick={handleUseCurrentLocation}
                        className="bg-[#e879f9] text-white font-bold py-2 px-4 rounded-full shadow-lg shadow-fuchsia-500/30 transform transition hover:scale-105 flex items-center gap-2 text-xs animate-bounce"
                    >
                        <MapPin size={14} />
                        Locate Me
                    </button>
                </div>
            )}
        </div>
    );
};

export default LocationVerifier;
