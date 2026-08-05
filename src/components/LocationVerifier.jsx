import { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import EXIF from 'exif-js';
import { MapPin, Layers, Loader2, Heart } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim() ?? '';
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

const convertDMSToDD = (dms, ref) => {
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') dd *= -1;
  return dd;
};

function LocationVerifier({ file, onLocationVerified, className = '', initialLat, initialLng }) {
  const [viewState, setViewState] = useState({
    latitude: initialLat || DEFAULT_CENTER.lat,
    longitude: initialLng || DEFAULT_CENTER.lng,
    zoom: initialLat ? 16 : 4,
  });
  const [marker, setMarker] = useState(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
  );
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const mapRef = useRef(null);

  const fetchAddress = useCallback(async (lat, lng) => {
    setLoadingAddress(true);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const addr = res.data.display_name || 'Address not found';
      onLocationVerified?.({ lat, lng, address: addr });
    } catch {
      onLocationVerified?.({ lat, lng, address: 'Address not found' });
    } finally {
      setLoadingAddress(false);
    }
  }, [onLocationVerified]);

  const updateLocation = useCallback((lat, lng) => {
    setMarker({ lat, lng });
    setLocationError('');
    setViewState((prev) => ({ ...prev, latitude: lat, longitude: lng, zoom: 16 }));
    fetchAddress(lat, lng);
  }, [fetchAddress]);

  useEffect(() => {
    if (initialLat && initialLng && (!marker || marker.lat !== initialLat)) {
      setMarker({ lat: initialLat, lng: initialLng });
      setViewState((prev) => ({
        ...prev,
        latitude: initialLat,
        longitude: initialLng,
        zoom: 16,
      }));
    }
  }, [initialLat, initialLng, marker]);

  useEffect(() => {
    if (!file) return;

    setIsLocating(true);
    EXIF.getData(file, function () {
      const lat = EXIF.getTag(this, 'GPSLatitude');
      const lng = EXIF.getTag(this, 'GPSLongitude');
      const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
      const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');

      if (lat && lng && latRef && lngRef) {
        updateLocation(convertDMSToDD(lat, latRef), convertDMSToDD(lng, lngRef));
        setMapStyle('mapbox://styles/mapbox/satellite-streets-v12');
      }
      setIsLocating(false);
    });
  }, [file, updateLocation]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported on this device.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
        setMapStyle('mapbox://styles/mapbox/satellite-streets-v12');
        setIsLocating(false);
      },
      () => {
        setLocationError('Could not access your location. Enable GPS and try again.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const onMarkerDragEnd = useCallback((event) => {
    const { lng, lat } = event.lngLat;
    updateLocation(lat, lng);
  }, [updateLocation]);

  const toggleMapStyle = () => {
    setMapStyle((prev) =>
      prev.includes('streets')
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/streets-v12',
    );
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div role="alert" className={`flex h-full w-full items-center justify-center bg-muted p-6 text-center text-sm text-muted-foreground ${className}`}>
        Location picking is temporarily unavailable. You can still choose a location manually.
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-xl bg-gray-900 ${className}`}>
      {(isLocating || loadingAddress) && (
        <div role="status" aria-busy="true" aria-atomic="true" aria-label={loadingAddress ? 'Finding address' : 'Finding your location'} className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Loader2 className="animate-spin text-white drop-shadow-lg" size={32} aria-hidden />
          <span className="sr-only">Locating…</span>
        </div>
      )}

      <button
        type="button"
        onClick={toggleMapStyle}
        aria-label="Toggle map style"
        className="absolute top-4 right-4 z-10 rounded-lg bg-white/90 p-1.5 text-gray-700 shadow-sm transition-colors hover:bg-white"
      >
        <Layers size={16} aria-hidden />
      </button>

      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onError={(event) => {
          setLocationError(event?.error?.status === 401
            ? 'The map is temporarily unavailable. You can still choose a location manually.'
            : 'The location map could not load right now.');
        }}
        onClick={(evt) => {
          const { lng, lat } = evt.lngLat;
          updateLocation(lat, lng);
        }}
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
            <div className="group relative cursor-grab active:cursor-grabbing">
              <div className="flex h-12 w-12 animate-bounce items-center justify-center rounded-full border-4 border-foreground bg-accent shadow-pop">
                <Heart size={24} className="fill-current text-white" strokeWidth={3} aria-hidden />
              </div>
              <div className="absolute -bottom-1 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-foreground" aria-hidden />
            </div>
          </Marker>
        )}

        <NavigationControl position="bottom-right" showCompass={false} />
      </Map>

      {!marker && !isLocating && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/5 p-4">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="pointer-events-auto flex animate-bounce items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:scale-105"
          >
            <MapPin size={14} aria-hidden />
            Locate Me
          </button>
          {locationError && (
            <p role="alert" className="pointer-events-none max-w-xs rounded-full bg-white/95 px-4 py-2 text-center text-xs font-medium text-red-600">
              {locationError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default LocationVerifier;
