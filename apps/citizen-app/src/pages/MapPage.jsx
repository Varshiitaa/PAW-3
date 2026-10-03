import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Badge, Modal } from '@streetpaw/ui';
import { MapPin, Navigation, AlertCircle, ShieldCheck, Heart, Search, Filter, Plus, Flame, Building2, Compass, Crosshair, Users, PhoneCall, CheckCircle2, History, Edit3, ArrowRight, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationPicker } from '../components/LocationPicker';
import './MapPage.css';

// Fix default Leaflet icon paths in Vite monorepo
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Major Indian Cities Preset coordinates
const INDIAN_CITIES = [
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
];

export function MapPage() {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'dog' | 'emergency' | 'ngo' | 'shg'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(INDIAN_CITIES[0]);
  const [pins, setPins] = useState([]);
  const [isLoadingPins, setIsLoadingPins] = useState(true);
  const [selectedPin, setSelectedPin] = useState(null);

  // Modals state
  const [isNewSightingModalOpen, setIsNewSightingModalOpen] = useState(false);
  const [isEditLocationModalOpen, setIsEditLocationModalOpen] = useState(false);
  const [editModeType, setEditModeType] = useState('new'); // 'new' | 'correct'

  // Location timeline for selected dog
  const [dogTimeline, setDogTimeline] = useState([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Mobile Bottom Sheet state
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Leaflet Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerGroupRef = useRef(null);

  // Fetch Pins from Backend API
  const fetchPins = async (cityObj = selectedCity) => {
    setIsLoadingPins(true);
    try {
      // Bounding box approximate calculation for city view
      const delta = 0.15;
      const bboxStr = `${cityObj.lng - delta},${cityObj.lat - delta},${cityObj.lng + delta},${cityObj.lat + delta}`;
      const url = `http://localhost:8000/api/dogs/pins?bbox=${bboxStr}&status=${activeFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPins(data);
        if (data.length > 0 && !selectedPin) {
          setSelectedPin(data[0]);
        }
      }
    } catch (e) {
      console.error('Pins API fetch error:', e);
    } finally {
      setIsLoadingPins(false);
    }
  };

  useEffect(() => {
    fetchPins(selectedCity);
  }, [selectedCity, activeFilter]);

  // Initialize Map Engine
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [selectedCity.lat, selectedCity.lng],
        zoom: 12,
        maxBounds: [[6.0, 68.0], [37.5, 98.0]],
        minZoom: 5,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      const markerGroup = L.layerGroup().addTo(map);
      markerGroupRef.current = markerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerGroupRef.current = null;
      }
    };
  }, []);

  // Update map center when city changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedCity.lat, selectedCity.lng], 12, { animate: true, duration: 1.2 });
    }
  }, [selectedCity]);

  // Render colored Leaflet markers
  useEffect(() => {
    if (!markerGroupRef.current || !mapInstanceRef.current) return;

    markerGroupRef.current.clearLayers();

    filteredPins.forEach((pin) => {
      let pinColor = '#10b981'; // Green active care
      let iconSymbol = '🐶';

      if (pin.type === 'dog') {
        if (pin.status === 'under_observation') {
          pinColor = '#f59e0b'; // Amber
        } else if (pin.status === 'rescue_clinic') {
          pinColor = '#ef4444'; // Red
        }
      } else if (pin.type === 'emergency') {
        pinColor = '#dc2626'; // SOS Red
        iconSymbol = '🚨';
      } else if (pin.type === 'ngo') {
        pinColor = '#3b82f6'; // NGO Blue
        iconSymbol = '🏥';
      } else if (pin.type === 'shg') {
        pinColor = '#059669'; // Feeder Emerald
        iconSymbol = '🤝';
      }

      const isSelected = selectedPin?.id === pin.id;

      const customDivIcon = L.divIcon({
        className: 'leaflet-custom-marker-wrapper',
        html: `
          <div class="custom-map-pin ${isSelected ? 'selected' : ''}" style="background-color: ${pinColor}">
            <span class="pin-symbol">${iconSymbol}</span>
            <span class="pin-label">${pin.public_code || pin.animal_id}</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      const marker = L.marker([pin.lat, pin.lng], { icon: customDivIcon });
      marker.on('click', () => {
        setSelectedPin(pin);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([pin.lat, pin.lng], 15, { animate: true });
        }
      });

      markerGroupRef.current.addLayer(marker);
    });
  }, [pins, selectedPin, searchQuery, activeFilter]);

  // Fetch timeline when a dog pin is selected
  useEffect(() => {
    if (selectedPin && selectedPin.type === 'dog') {
      fetchDogTimeline(selectedPin.public_code || selectedPin.animal_id || selectedPin.db_id);
    } else {
      setDogTimeline([]);
    }
  }, [selectedPin]);

  const fetchDogTimeline = async (dogCode) => {
    setIsLoadingTimeline(true);
    try {
      const res = await fetch(`http://localhost:8000/api/dogs/${dogCode}/locations`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDogTimeline(data);
      }
    } catch (e) {
      console.warn('Timeline fetch failed:', e);
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  const filteredPins = pins.filter((p) => {
    const matchesSearch =
      (p.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.public_code || p.animal_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'all') return true;
    return p.type === activeFilter;
  });

  // Handle Location Picker submission
  const handleSaveLocation = async (locData) => {
    if (!selectedPin || selectedPin.type !== 'dog') return;

    const dogIdentifier = selectedPin.public_code || selectedPin.animal_id || selectedPin.db_id;

    try {
      if (editModeType === 'new') {
        // Add new sighting row
        await fetch(`http://localhost:8000/api/dogs/${dogIdentifier}/locations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: locData.lat,
            lng: locData.lng,
            address: locData.address,
            area: locData.area,
            city: locData.city,
            state: locData.state,
            note: 'Updated via Interactive Pin Map'
          })
        });
      } else if (editModeType === 'correct' && dogTimeline.length > 0) {
        // Correct latest entry
        const locId = dogTimeline[0].id;
        await fetch(`http://localhost:8000/api/dogs/${dogIdentifier}/locations/${locId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: locData.lat,
            lng: locData.lng,
            address: locData.address,
            area: locData.area,
            city: locData.city,
            state: locData.state,
            note: 'Corrected mistaken location entry'
          })
        });
      }

      setIsEditLocationModalOpen(false);
      fetchPins();
      fetchDogTimeline(dogIdentifier);
    } catch (err) {
      console.error('Save location error:', err);
    }
  };

  return (
    <div className="map-page-layout">
      {/* Page Header */}
      <div className="map-page-header">
        <div>
          <Badge variant="brand">STRAY MAP & REUSABLE PIN ENGINE v6.5</Badge>
          <h2 className="map-title">Interactive Stray Animal Map</h2>
          <p className="map-subtitle">
            Live OpenStreetMap sightings for Stray Dogs (🐶), Emergency SOS (🚨), NGO Shelters (🏥), and SHG Feeders (🤝).
          </p>
        </div>

        <div className="header-actions-row">
          {/* City Selector Dropdown */}
          <div className="city-selector-wrapper">
            <MapPin size={16} color="var(--primary-coral)" />
            <select
              className="city-select-dropdown"
              value={selectedCity.name}
              onChange={(e) => {
                const found = INDIAN_CITIES.find(c => c.name === e.target.value);
                if (found) setSelectedCity(found);
              }}
            >
              {INDIAN_CITIES.map(c => (
                <option key={c.name} value={c.name}>
                  📍 {c.name}, {c.state}
                </option>
              ))}
            </select>
          </div>

          <Button variant="emerald" icon={Plus} size="md" onClick={() => setIsNewSightingModalOpen(true)}>
            Pin Sighting
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar Card */}
      <Card variant="glass" className="filter-bar-card">
        <div className="filter-buttons-group">
          <Button
            variant={activeFilter === 'all' ? 'primary' : 'secondary'}
            size="sm"
            icon={Compass}
            onClick={() => setActiveFilter('all')}
          >
            All Pins ({pins.length})
          </Button>

          <Button
            variant={activeFilter === 'dog' ? 'emerald' : 'secondary'}
            size="sm"
            icon={ShieldCheck}
            onClick={() => setActiveFilter('dog')}
          >
            🐶 Stray Dogs
          </Button>

          <Button
            variant={activeFilter === 'emergency' ? 'danger' : 'secondary'}
            size="sm"
            icon={AlertCircle}
            onClick={() => setActiveFilter('emergency')}
          >
            🚨 Emergency SOS
          </Button>

          <Button
            variant={activeFilter === 'ngo' ? 'glass' : 'secondary'}
            size="sm"
            icon={Building2}
            onClick={() => setActiveFilter('ngo')}
          >
            🏥 NGO Shelters
          </Button>

          <Button
            variant={activeFilter === 'shg' ? 'glass' : 'secondary'}
            size="sm"
            icon={Users}
            onClick={() => setActiveFilter('shg')}
          >
            🤝 SHG & Feeders
          </Button>
        </div>

        <div className="search-input-wrapper">
          <Input
            placeholder="Search location, PAW code or landmark..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Main Grid: Interactive Leaflet Map + Inspection Sidebar */}
      <div className="map-content-grid">
        {/* Leaflet Map Canvas */}
        <Card variant="glow" className="leaflet-map-card">
          <div className="map-top-status-bar">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin size={18} color="var(--primary-coral)" />
              <span>Viewing Area: {selectedCity.name} ({selectedCity.lat.toFixed(4)}° N, {selectedCity.lng.toFixed(4)}° E)</span>
            </div>
            <Badge variant="emerald">Live Map Engine</Badge>
          </div>

          <div className="leaflet-canvas-container" ref={mapContainerRef} />
        </Card>

        {/* Selected Marker Details Sidebar */}
        <Card variant="glass" className="map-inspection-sidebar">
          <h3 className="sidebar-title">Map Pin Inspection</h3>

          {selectedPin ? (
            <div className="pin-detail-box">
              <div className="pin-image-wrapper">
                <img
                  src={selectedPin.image}
                  alt={selectedPin.title}
                  className="pin-image"
                />
                <Badge className="pin-status-badge" variant={selectedPin.type === 'emergency' ? 'critical' : 'normal'}>
                  {selectedPin.type.toUpperCase()} • {selectedPin.severity}
                </Badge>
              </div>

              <div className="pin-header-row">
                <span className="public-code-highlight">
                  {selectedPin.public_code || selectedPin.animal_id}
                </span>
                <span className="pin-time-text">{selectedPin.time}</span>
              </div>

              <div>
                <h4 className="pin-main-title">{selectedPin.title}</h4>
                <p className="pin-location-text">📍 {selectedPin.location}</p>
              </div>

              <div className="pin-info-card">
                <div className="info-label">Status & Health Record:</div>
                <div className="info-value">{selectedPin.health}</div>
                <div className="info-coords">
                  GPS: {selectedPin.lat.toFixed(4)}° N, {selectedPin.lng.toFixed(4)}° E
                </div>
              </div>

              {/* Dog Location Timeline Preview */}
              {selectedPin.type === 'dog' && (
                <div className="location-timeline-section">
                  <div className="timeline-header">
                    <History size={16} color="var(--primary-coral)" />
                    <span>Sighting Timeline ({dogTimeline.length})</span>
                  </div>

                  {isLoadingTimeline ? (
                    <div className="text-xs text-muted">Loading sighting history...</div>
                  ) : (
                    <div className="timeline-items-list">
                      {dogTimeline.map((t, idx) => (
                        <div key={t.id || idx} className="timeline-item">
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <div className="timeline-address">{t.address || t.area || 'Sighting Point'}</div>
                            <div className="timeline-date">{t.recorded_at ? new Date(t.recorded_at).toLocaleDateString() : 'Initial Registration'} • {t.note || 'Sighting'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions Button Row */}
              <div className="pin-action-buttons">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedPin.lat},${selectedPin.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full"
                >
                  <Button variant="emerald" icon={Navigation} style={{ width: '100%' }}>
                    Open GPS Navigation
                  </Button>
                </a>

                {selectedPin.type === 'dog' && (
                  <Button
                    variant="primary"
                    icon={Edit3}
                    onClick={() => {
                      setEditModeType('new');
                      setIsEditLocationModalOpen(true);
                    }}
                  >
                    Edit / Update Location
                  </Button>
                )}

                {/* Report distress prefilled */}
                <Button
                  variant="danger"
                  icon={AlertCircle}
                  onClick={() => alert(`Redirecting to distress report for ${selectedPin.public_code} at ${selectedPin.location}...`)}
                >
                  Report Distress Here
                </Button>
              </div>
            </div>
          ) : (
            <div className="empty-inspection-state">
              <Compass size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <p>Click any pin marker on the map to inspect photo, health history, and update location.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Mobile Responsive Bottom Sheet */}
      <div className={`mobile-bottom-sheet ${isBottomSheetOpen ? 'open' : ''}`}>
        <div className="bottom-sheet-drag-handle" onClick={() => setIsBottomSheetOpen(!isBottomSheetOpen)}>
          <div className="drag-bar" />
          <span>{isBottomSheetOpen ? 'Hide Visible Dogs List' : `Show Dogs in View (${filteredPins.length})`}</span>
          {isBottomSheetOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>

        {isBottomSheetOpen && (
          <div className="bottom-sheet-content">
            {filteredPins.map((p) => (
              <div key={p.id} className="bottom-sheet-item" onClick={() => { setSelectedPin(p); setIsBottomSheetOpen(false); }}>
                <img src={p.image} alt={p.title} className="sheet-thumb" />
                <div className="sheet-info">
                  <div className="sheet-code">{p.public_code || p.animal_id}</div>
                  <div className="sheet-title">{p.title}</div>
                  <div className="sheet-loc">{p.location}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Edit Dog Location */}
      {selectedPin && (
        <Modal
          isOpen={isEditLocationModalOpen}
          onClose={() => setIsEditLocationModalOpen(false)}
          title={`Update Location for ${selectedPin.public_code || selectedPin.animal_id}`}
          maxWidth="640px"
        >
          <div className="edit-location-choice-bar">
            <button
              type="button"
              className={`choice-btn ${editModeType === 'new' ? 'active' : ''}`}
              onClick={() => setEditModeType('new')}
            >
              📍 Add New Sighting
            </button>
            <button
              type="button"
              className={`choice-btn ${editModeType === 'correct' ? 'active' : ''}`}
              onClick={() => setEditModeType('correct')}
            >
              ✏️ Correct Mistaken Entry
            </button>
          </div>

          <LocationPicker
            initialLocation={{
              lat: selectedPin.lat,
              lng: selectedPin.lng,
              address: selectedPin.location,
              city: selectedCity.name,
              state: selectedCity.state
            }}
            onSelectLocation={handleSaveLocation}
            onCancel={() => setIsEditLocationModalOpen(false)}
            confirmLabel={editModeType === 'new' ? 'Add Sighting Entry' : 'Save Location Correction'}
          />
        </Modal>
      )}

      {/* Modal: Pin New Sighting */}
      <Modal
        isOpen={isNewSightingModalOpen}
        onClose={() => setIsNewSightingModalOpen(false)}
        title="Pin New Stray Sighting / Landmark"
        maxWidth="640px"
      >
        <LocationPicker
          initialLocation={{
            lat: selectedCity.lat,
            lng: selectedCity.lng,
            address: `${selectedCity.name}, ${selectedCity.state}`,
            city: selectedCity.name,
            state: selectedCity.state
          }}
          onSelectLocation={async (loc) => {
            // Call Backend API to create new dog profile with location
            try {
              await fetch('http://localhost:8000/api/dogs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  breed: 'Indian Pariah / Desi Sighting',
                  location: loc.address,
                  location_lat: loc.lat,
                  location_lng: loc.lng,
                  area: loc.area,
                  city: loc.city,
                  state: loc.state,
                  status: 'Healthy / Sterilized'
                })
              });
              setIsNewSightingModalOpen(false);
              fetchPins();
            } catch (err) {
              console.error(err);
            }
          }}
          onCancel={() => setIsNewSightingModalOpen(false)}
          confirmLabel="Pin Sighting to Central Database"
        />
      </Modal>
    </div>
  );
}
