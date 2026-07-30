import React, { useEffect, useRef } from 'react';

export default function GoogleMap({ startLat, startLng, endLat, endLng, endLabel = 'Now', type = 'route' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // If Leaflet is not loaded on the window yet, don't run
    if (!window.L || !mapRef.current) return;

    const L = window.L;

    // Parse lat/lng to numbers
    const sLat = parseFloat(startLat);
    const sLng = parseFloat(startLng);
    const eLat = parseFloat(endLat);
    const eLng = parseFloat(endLng);

    const hasStart = !isNaN(sLat) && !isNaN(sLng);
    const hasEnd = !isNaN(eLat) && !isNaN(eLng);

    // Fallback coordinates if both start and end locations are invalid (null/undefined in database)
    let startPos = hasStart ? [sLat, sLng] : null;
    let endPos = hasEnd ? [eLat, eLng] : null;

    if (!startPos && !endPos) {
      // Default fallback (e.g. New Delhi) so that the map actually renders instead of returning early
      startPos = [28.6139, 77.2090];
    }

    // Clean up existing map instance to avoid "Map container already initialized" error
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const center = startPos || endPos;
    
    // Initialize map
    const map = L.map(mapRef.current, {
      center: center,
      zoom: 15,
      zoomControl: true,
      attributionControl: true
    });
    
    mapInstanceRef.current = map;

    // CartoDB Dark Matter tile layer for premium dark aesthetics
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    const bounds = [];

    // Custom circle markers for clean dark mode design
    // 1. Check-In Marker (Green Circle)
    if (startPos) {
      const checkInMarker = L.circleMarker(startPos, {
        radius: 7,
        fillColor: '#10b981', // Green
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 1
      }).addTo(map);
      
      checkInMarker.bindPopup('<b style="color: #1e293b;">Check-In Point</b>');
      bounds.push(startPos);
    }

    // 2. Check-Out / Live Marker (Red/Blue Circle)
    if (endPos) {
      const isLive = type === 'live';
      const checkOutMarker = L.circleMarker(endPos, {
        radius: isLive ? 8 : 7,
        fillColor: isLive ? '#06b6d4' : '#ef4444', // Cyan for live, Red for check-out
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 1
      }).addTo(map);

      checkOutMarker.bindPopup(`<b style="color: #1e293b;">${endLabel} Point</b>`);
      bounds.push(endPos);
    }

    // 3. Draw Polyline route connecting them
    if (startPos && endPos) {
      L.polyline([startPos, endPos], {
        color: type === 'live' ? '#06b6d4' : '#6366f1',
        weight: 2.5,
        dashArray: '5, 8',
        opacity: 0.8
      }).addTo(map);
    }

    // Fit Bounds
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 15);
      } else {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    // Crucial fix: Force Leaflet to recalculate container size.
    // This solves the issue where the map renders but tiles look grey/blank until window is resized.
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };

  }, [startLat, startLng, endLat, endLng, endLabel, type]);

  // If Leaflet global object is not available yet
  if (!window.L) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-800/60 rounded-xl flex flex-col items-center justify-center" style={{ minHeight: '320px' }}>
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[9px] text-slate-400 mt-2">Loading Map Components...</p>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-slate-800/60" style={{ minHeight: '320px' }} />
  );
}
