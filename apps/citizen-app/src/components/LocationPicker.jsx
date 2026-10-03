import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, Badge } from '@streetpaw/ui';
import { MapPin, Navigation, Search, AlertCircle, CheckCircle2, RefreshCw, Crosshair, Globe } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationPicker.css';

// Fix default Leaflet icon paths in Vite monorepo
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Cache for Nominatim queries to respect usage policy
const nominatimCache = new Map();

export function LocationPicker({
  initialLocation = { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, Karnataka', area: 'Central Bengaluru', city: 'Bengaluru', state: 'Karnataka' },
  onSelectLocation,
  onCancel,
  confirmLabel = "Save Location"
}) {
  const [activeMode, setActiveMode] = useState('pin'); // 'current' | 'search' | 'pin'
  const [coords, setCoords] = useState({ lat: initialLocation.lat || 12.9716, lng: initialLocation.lng || 77.5946 });
  const [addressFields, setAddressFields] = useState({
    address: initialLocation.address || '',
    area: initialLocation.area || '',
    city: initialLocation.city || 'Bengaluru',
    state: initialLocation.state || 'Karnataka'
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // GPS geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [geoPermissionRequested, setGeoPermissionRequested] = useState(false);

  // India boundary validation
  const [validationError, setValidationError] = useState(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Leaflet map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  // Validate coordinates in India: lat ~[6.0, 37.5], lng ~[68.0, 98.0]
  const isWithinIndia = (latitude, longitude) => {
    return latitude >= 6.0 && latitude <= 37.5 && longitude >= 68.0 && longitude <= 98.0;
  };

  // Reverse geocode lat/lng to address fields
  const reverseGeocode = async (lat, lng) => {
    const cacheKey = `rev_${lat.toFixed(4)}_${lng.toFixed(4)}`;
    if (nominatimCache.has(cacheKey)) {
      setAddressFields(nominatimCache.get(cacheKey));
      return;
    }

    setIsReverseGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&countrycodes=in`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'StreetPaw-AnimalRegistry/2.0 (welfare@streetpaw.ai)',
        }
      });
      const data = await res.json();
      if (data && data.address) {
        const parsed = {
          address: data.display_name || '',
          area: data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.road || '',
          city: data.address.city || data.address.town || data.address.county || 'Bengaluru',
          state: data.address.state || 'Karnataka'
        };
        nominatimCache.set(cacheKey, parsed);
        setAddressFields(parsed);
      }
    } catch (e) {
      console.warn('Reverse geocode warning:', e);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Update coords and run validation + reverse geocode
  const handleLocationUpdate = (lat, lng, skipReverse = false) => {
    if (!isWithinIndia(lat, lng)) {
      setValidationError("Location must be within India boundaries (Lat: 6.0° to 37.5°, Lng: 68.0° to 98.0°).");
      return false;
    }
    setValidationError(null);
    setCoords({ lat, lng });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true });
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([lat, lng]);
      }
    }

    if (!skipReverse) {
      reverseGeocode(lat, lng);
    }
    return true;
  };

  // Initialize interactive Leaflet map when mode is 'pin'
  useEffect(() => {
    if (activeMode === 'pin' && mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 14,
        maxBounds: [[6.0, 68.0], [37.5, 98.0]],
        minZoom: 5,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Custom pulse marker icon
      const customIcon = L.divIcon({
        className: 'location-picker-marker-pin',
        html: `<div class="pulse-marker"><span class="marker-dot">📍</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      const marker = L.marker([coords.lat, coords.lng], {
        draggable: true,
        icon: customIcon
      }).addTo(map);

      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        handleLocationUpdate(newPos.lat, newPos.lng);
      });

      map.on('click', (e) => {
        handleLocationUpdate(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [activeMode]);

  // Handle GPS location click
  const requestCurrentLocation = () => {
    setGeoPermissionRequested(true);
    setGeoError(null);
    setIsLocating(true);

    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const success = handleLocationUpdate(latitude, longitude);
        setIsLocating(false);
        if (success) {
          setActiveMode('pin');
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = "Could not access location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "GPS permission was denied by user. Please select address or drop a pin on the map.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "GPS location unavailable. Please pick a location manually.";
        } else if (err.code === err.TIMEOUT) {
          msg = "GPS location request timed out.";
        }
        setGeoError(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Debounced Nominatim search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const cacheKey = `search_${searchQuery.trim().toLowerCase()}`;
      if (nominatimCache.has(cacheKey)) {
        setSearchResults(nominatimCache.get(cacheKey));
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=6&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'StreetPaw-AnimalRegistry/2.0 (welfare@streetpaw.ai)',
          }
        });
        const data = await res.json();
        nominatimCache.set(cacheKey, data || []);
        setSearchResults(data || []);
      } catch (err) {
        setSearchError("Address lookup failed. Check network connection.");
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (handleLocationUpdate(lat, lng, true)) {
      setAddressFields({
        address: item.display_name || '',
        area: item.address?.suburb || item.address?.neighbourhood || item.address?.road || '',
        city: item.address?.city || item.address?.town || item.address?.county || 'Bengaluru',
        state: item.address?.state || 'Karnataka'
      });
      setSearchResults([]);
      setActiveMode('pin');
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (!isWithinIndia(coords.lat, coords.lng)) {
      setValidationError("Selected point is outside India. Please choose a location within India.");
      return;
    }

    if (onSelectLocation) {
      onSelectLocation({
        lat: coords.lat,
        lng: coords.lng,
        address: addressFields.address || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        area: addressFields.area || addressFields.city,
        city: addressFields.city || 'Bengaluru',
        state: addressFields.state || 'Karnataka'
      });
    }
  };

  return (
    <div className="location-picker-container">
      {/* Mode Selector Tabs */}
      <div className="location-picker-tabs">
        <button
          type="button"
          className={`picker-tab ${activeMode === 'current' ? 'active' : ''}`}
          onClick={() => setActiveMode('current')}
        >
          <Crosshair size={16} />
          <span>Use My GPS</span>
        </button>

        <button
          type="button"
          className={`picker-tab ${activeMode === 'search' ? 'active' : ''}`}
          onClick={() => setActiveMode('search')}
        >
          <Search size={16} />
          <span>Search Address</span>
        </button>

        <button
          type="button"
          className={`picker-tab ${activeMode === 'pin' ? 'active' : ''}`}
          onClick={() => setActiveMode('pin')}
        >
          <MapPin size={16} />
          <span>Drop Pin on Map</span>
        </button>
      </div>

      {/* Mode 1: Current Location */}
      {activeMode === 'current' && (
        <Card variant="glass" className="picker-card-body">
          <div className="gps-request-box">
            <Globe size={32} color="var(--primary-coral)" />
            <h4>GPS Automatic Location Access</h4>
            <p className="text-muted">
              Antigravity StreetPaw will ask for browser permission to detect your live latitude & longitude. Your location is processed locally for animal welfare mapping.
            </p>

            {geoError && (
              <div className="geo-error-banner">
                <AlertCircle size={18} />
                <span>{geoError}</span>
              </div>
            )}

            <Button
              type="button"
              variant="emerald"
              icon={Navigation}
              loading={isLocating}
              onClick={requestCurrentLocation}
            >
              {isLocating ? "Fetching Coordinates..." : "Locate Me Now"}
            </Button>
          </div>
        </Card>
      )}

      {/* Mode 2: Search Address / Landmark */}
      {activeMode === 'search' && (
        <Card variant="glass" className="picker-card-body">
          <div className="search-address-box">
            <Input
              icon={Search}
              placeholder="Search area, landmark or street in India (e.g. DSU Gate 2, Koramangala, Indiranagar)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />

            {isSearching && (
              <div className="search-loading">
                <RefreshCw size={16} className="spin" />
                <span>Searching OpenStreetMap India database...</span>
              </div>
            )}

            {searchError && (
              <div className="geo-error-banner">
                <AlertCircle size={16} />
                <span>{searchError}</span>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="search-results-list">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="search-result-item"
                    onClick={() => selectSearchResult(item)}
                  >
                    <MapPin size={18} color="var(--primary-coral)" style={{ flexShrink: 0 }} />
                    <div className="result-text">
                      <div className="result-title">{item.display_name}</div>
                      <div className="result-coords">
                        Lat: {parseFloat(item.lat).toFixed(4)}, Lng: {parseFloat(item.lon).toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Mode 3: Drop Pin Interactive Map Canvas */}
      {activeMode === 'pin' && (
        <div className="picker-map-wrapper">
          <div className="map-canvas-container" ref={mapContainerRef} />
          <div className="map-instruction-overlay">
            <span>Drag pin or click map to move location</span>
          </div>
        </div>
      )}

      {/* Validation Banner */}
      {validationError && (
        <div className="geo-error-banner mt-3">
          <AlertCircle size={18} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Editable Fields Summary Card */}
      <form onSubmit={handleFinalSubmit} className="editable-location-fields">
        <div className="coords-badge-row">
          <Badge variant="emerald">
            GPS: {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
          </Badge>
          {isReverseGeocoding && (
            <span className="text-muted text-xs flex items-center gap-1">
              <RefreshCw size={12} className="spin" /> Fetching address details...
            </span>
          )}
        </div>

        <div className="grid-2-col">
          <div>
            <label className="field-label">Address / Landmark</label>
            <Input
              value={addressFields.address}
              onChange={(e) => setAddressFields({ ...addressFields, address: e.target.value })}
              placeholder="Street name, landmark, gate number..."
              required
            />
          </div>

          <div>
            <label className="field-label">Sub-Area / Locality</label>
            <Input
              value={addressFields.area}
              onChange={(e) => setAddressFields({ ...addressFields, area: e.target.value })}
              placeholder="e.g. Koramangala 4th Block"
            />
          </div>

          <div>
            <label className="field-label">City / District</label>
            <Input
              value={addressFields.city}
              onChange={(e) => setAddressFields({ ...addressFields, city: e.target.value })}
              placeholder="e.g. Bengaluru"
              required
            />
          </div>

          <div>
            <label className="field-label">State</label>
            <Input
              value={addressFields.state}
              onChange={(e) => setAddressFields({ ...addressFields, state: e.target.value })}
              placeholder="e.g. Karnataka"
              required
            />
          </div>
        </div>

        <div className="location-picker-actions">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}

          <Button type="submit" variant="emerald" icon={CheckCircle2}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
