import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { Link } from 'react-router-dom';
import { MapPin, Navigation } from 'lucide-react';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;

const createCustomIcon = (priorityBand = 'Medium') => {
  let color = '#f59e0b'; // Medium (amber)
  if (priorityBand === 'Critical') color = '#dc2626'; // Red
  else if (priorityBand === 'High') color = '#ea580c'; // Orange
  else if (priorityBand === 'Low') color = '#64748b'; // Slate

  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export function MapView({
  problems = [],
  center = [23.3441, 85.3096], // Default Ranchi, Jharkhand
  zoom = 11,
  height = '450px',
  onLocationSelect = null,
  selectedLocation = null
}) {
  return (
    <div style={{ height }} className="relative w-full rounded-2xl overflow-hidden shadow-md border border-slate-200">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Selected location marker if picking GPS */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={L.divIcon({
              className: 'current-gps-pin',
              html: `
                <div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: center; color: white;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          >
            <Popup>
              <div className="text-xs font-semibold p-1">Selected Location for New Report</div>
            </Popup>
          </Marker>
        )}

        {/* Problem markers */}
        {problems.map((p) => {
          if (!p.lat || !p.lng) return null;
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={createCustomIcon(p.priority_band)}
            >
              <Popup className="custom-popup">
                <div className="p-1 max-w-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{p.category}</span>
                    <PriorityBadge band={p.priority_band} score={p.priority_score} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{p.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{p.description_en || p.raw_description}</p>
                  
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {p.district}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/problems/${p.id}`}
                      className="block text-center w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      View Full Challenge & Solutions
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Floating Tag */}
      <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1.5">
        <div className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Priority Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
          <span className="text-slate-600 font-medium">Critical (80+)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <span className="text-slate-600 font-medium">High (60-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span className="text-slate-600 font-medium">Medium (35-59)</span>
        </div>
      </div>
    </div>
  );
}
