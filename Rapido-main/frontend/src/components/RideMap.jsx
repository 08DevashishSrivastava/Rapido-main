import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * RideMap — Leaflet + OpenStreetMap interactive ride map.
 * No API key needed; uses Nominatim for geocoding & OSRM for routing.
 */

let leafletLoaded = false;

async function geocode(query) {
  if (!query || query.trim().length < 3) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
    }
  } catch (_) {}
  return null;
}

async function getRoute(from, to) {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return {
        coords: data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distance: (data.routes[0].distance / 1000).toFixed(1),
        duration: Math.round(data.routes[0].duration / 60)
      };
    }
  } catch (_) {}
  return null;
}

// Default center: New Delhi
const DELHI_CENTER = [28.6139, 77.2090];

export default function RideMap({ pickup, destination, className = '' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error

  const initMap = useCallback(async () => {
    if (mapInstanceRef.current) return; // Already initialized

    // Dynamically load Leaflet CSS if not already loaded
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const L = await import('leaflet');

    // Fix default icon paths broken by bundlers
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: DELHI_CENTER,
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    return map;
  }, []);

  const updateMapMarkers = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    const L = await import('leaflet');
    const map = mapInstanceRef.current;

    setStatus('loading');

    // Geocode both locations in parallel
    const [pickupCoords, destCoords] = await Promise.all([
      pickup ? geocode(pickup) : Promise.resolve(null),
      destination ? geocode(destination) : Promise.resolve(null),
    ]);

    // Remove old markers
    if (pickupMarkerRef.current) { map.removeLayer(pickupMarkerRef.current); pickupMarkerRef.current = null; }
    if (destinationMarkerRef.current) { map.removeLayer(destinationMarkerRef.current); destinationMarkerRef.current = null; }
    if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }

    const pickupIcon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;background:#2563eb;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(37,99,235,0.5)"></div>`,
      iconAnchor: [16, 32],
      iconSize: [32, 32],
    });

    const destIcon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;background:#ef4444;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(239,68,68,0.5)"></div>`,
      iconAnchor: [16, 32],
      iconSize: [32, 32],
    });

    if (pickupCoords) {
      pickupMarkerRef.current = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<b>📍 Pickup</b><br/>${pickup}`);
    }

    if (destCoords) {
      destinationMarkerRef.current = L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>🏁 Destination</b><br/>${destination}`);
    }

    if (pickupCoords && destCoords) {
      // Draw route via OSRM
      const route = await getRoute(pickupCoords, destCoords);
      if (route && route.coords.length > 0) {
        routeLayerRef.current = L.polyline(route.coords, {
          color: '#2563eb',
          weight: 5,
          opacity: 0.8,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);
      }

      // Fit map bounds to show both markers
      const bounds = L.latLngBounds(
        [pickupCoords.lat, pickupCoords.lng],
        [destCoords.lat, destCoords.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      setStatus('ready');
    } else if (pickupCoords) {
      map.setView([pickupCoords.lat, pickupCoords.lng], 14);
      setStatus('ready');
    } else if (destCoords) {
      map.setView([destCoords.lat, destCoords.lng], 14);
      setStatus('ready');
    } else {
      map.setView(DELHI_CENTER, 11);
      setStatus(pickup || destination ? 'error' : 'idle');
    }
  }, [pickup, destination]);

  // Initialize map once on mount
  useEffect(() => {
    const setup = async () => {
      await initMap();
      await updateMapMarkers();
    };
    setup();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        pickupMarkerRef.current = null;
        destinationMarkerRef.current = null;
        routeLayerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when pickup/destination change (debounced)
  const debounceTimer = useRef(null);
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      updateMapMarkers();
    }, 900);
    return () => clearTimeout(debounceTimer.current);
  }, [pickup, destination, updateMapMarkers]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm ${className}`}>
      {/* Map container */}
      <div ref={mapRef} style={{ height: '100%', minHeight: '320px', width: '100%' }} />

      {/* Status overlays */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-[999] pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-blue-700">Finding route…</span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute bottom-3 left-3 z-[999] px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-800 font-semibold shadow">
          ⚠ Could not locate address — try a more specific location
        </div>
      )}

      {status === 'ready' && pickup && destination && (
        <div className="absolute top-3 left-3 z-[999] flex gap-2">
          <span className="px-2.5 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-lg shadow">
            📍 {pickup.split(',')[0]}
          </span>
          <span className="px-2.5 py-1 bg-red-500 text-white text-[11px] font-bold rounded-lg shadow">
            🏁 {destination.split(',')[0]}
          </span>
        </div>
      )}

      {/* Attribution spacer */}
      <div className="absolute bottom-0 left-0 right-0 h-6 z-[998] pointer-events-none" />
    </div>
  );
}
