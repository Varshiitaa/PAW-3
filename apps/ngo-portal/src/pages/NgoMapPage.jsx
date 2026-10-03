import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge } from '@streetpaw/ui';
import { Map as MapIcon, Ambulance, PawPrint, PhoneCall, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function NgoMapPage({ authToken }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [complaints, setComplaints] = useState([]);
  const [dogs, setDogs] = useState([]);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      const cRes = await fetch('http://localhost:8000/api/rescues/');
      const cData = await cRes.json();
      setComplaints(Array.isArray(cData) ? cData : []);

      const dRes = await fetch('http://localhost:8000/api/dogs/');
      const dData = await dRes.json();
      setDogs(Array.isArray(dData) ? dData : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (mapContainerRef.current) {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([12.9716, 77.5946], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 18
        }).addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      // Add Complaint Markers (Red)
      complaints.forEach((c) => {
        const icon = L.divIcon({
          className: 'custom-cmp-pin',
          html: `<div style="background:#ef4444; width:26px; height:26px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px;">🚨</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        const marker = L.marker([c.lat || 12.9081, c.lng || 77.5653], { icon }).addTo(map);
        marker.bindPopup(`<strong>${c.public_id}</strong><br/>${c.title}<br/>📍 ${c.address}`);
      });

      // Add Dog Markers (Green)
      dogs.forEach((d) => {
        const icon = L.divIcon({
          className: 'custom-dog-pin',
          html: `<div style="background:#22c55e; width:26px; height:26px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px;">🐶</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        const marker = L.marker([d.location_lat || 12.9716, d.location_lng || 77.5946], { icon }).addTo(map);
        marker.bindPopup(`<strong>${d.public_code}</strong> (${d.name})<br/>${d.breed}<br/>📍 ${d.location}`);
      });
    }
  }, [complaints, dogs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapIcon size={28} color="#60a5fa" /> Live NGO Operations Map
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Real-time GIS radar of active distress complaints and registered dog sightings
        </span>
      </div>

      <Card variant="glass" style={{ padding: 0, overflow: 'hidden', height: '620px', position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      </Card>
    </div>
  );
}
