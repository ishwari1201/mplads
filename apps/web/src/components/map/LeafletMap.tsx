import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { WorkRecommendation } from '../../types/project';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom pulse marker for Citizen Current GPS Location
const citizenIcon = L.divIcon({
  className: 'custom-citizen-pin',
  html: `<div style="
    width: 20px;
    height: 20px;
    background-color: #0284c7;
    border: 3px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(2, 132, 199, 0.8);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

interface LeafletMapProps {
  points: WorkRecommendation[];
  center?: [number, number];
  zoom?: number;
  citizenLocation?: [number, number] | null;
  onWorkSelect?: (work: WorkRecommendation) => void;
}

// Controller component to smoothly change map view when center prop updates
const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  points,
  center = [18.9220, 72.8347],
  zoom = 13,
  citizenLocation,
  onWorkSelect
}) => {
  return (
    <div className="w-full h-[450px] rounded-xl overflow-hidden border border-slate-800 shadow-xl relative z-0">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="w-full h-full">
        <MapRecenter center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Citizen Current GPS Position Marker */}
        {citizenLocation && (
          <Marker position={citizenLocation} icon={citizenIcon}>
            <Popup>
              <div className="p-1 text-slate-900 text-xs font-bold text-center">
                Your Current GPS Location
                <div className="text-[10px] text-slate-600 font-normal mt-0.5">
                  ({citizenLocation[0].toFixed(4)}°, {citizenLocation[1].toFixed(4)}°)
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby MPLADS Work Markers */}
        {points.map((pt: any) => {
          const lat = Number(pt.latitude);
          const lng = Number(pt.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={pt.id} position={[lat, lng]}>
              <Popup>
                <div className="p-1 max-w-xs text-slate-900">
                  <div className="font-bold text-sm">{pt.title}</div>
                  <div className="text-xs text-slate-600 mt-1">{pt.address || 'Location Unspecified'}</div>
                  {pt.distance_meters !== undefined && pt.distance_meters !== null && (
                    <div className="text-xs text-emerald-700 font-semibold mt-1">
                      Distance from you: {pt.distance_meters >= 1000 ? `${(pt.distance_meters / 1000).toFixed(2)} km` : `${Math.round(pt.distance_meters)} m`}
                    </div>
                  )}
                  <div className="text-xs font-semibold text-sky-700 mt-1">
                    Sanctioned: ₹{Number(pt.sanctioned_amount || pt.estimated_cost || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs mt-1 inline-block px-2 py-0.5 rounded bg-slate-200 font-medium">
                    Status: {pt.status === 'COMPLETED' ? 'Marked as Completed' : pt.status}
                  </div>
                  {onWorkSelect && (
                    <button
                      onClick={() => onWorkSelect(pt)}
                      className="mt-2.5 w-full bg-sky-600 hover:bg-sky-700 text-white text-xs py-1 px-2 rounded font-medium transition-colors"
                    >
                      Inspect / Report Ground Issue
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
