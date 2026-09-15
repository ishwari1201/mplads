import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { WorkRecommendation } from '../../types/project';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface DistrictMapProps {
  points: WorkRecommendation[];
  center?: [number, number];
  zoom?: number;
}

export const DistrictMap: React.FC<DistrictMapProps> = ({
  points,
  center = [18.9220, 72.8347],
  zoom = 12,
}) => {
  return (
    <div className="w-full h-[450px] rounded-xl overflow-hidden border border-slate-800 shadow-xl relative z-0">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((pt) => {
          const lat = pt.latitude || 18.9067;
          const lng = pt.longitude || 72.8258;
          const daysRem = pt.days_remaining !== undefined ? Math.round(pt.days_remaining) : 30;

          return (
            <Marker key={pt.id} position={[lat, lng]}>
              <Popup>
                <div className="p-1 max-w-xs text-slate-900">
                  <div className="font-bold text-sm">{pt.title}</div>
                  <div className="text-xs text-slate-600 mt-1">{pt.address || pt.location_address || 'Mumbai City'}</div>
                  <div className="text-xs font-semibold text-sky-700 mt-1">
                    Estimate: ₹{Number(pt.estimated_cost).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs mt-1 inline-block px-2 py-0.5 rounded bg-slate-200 font-medium">
                    Status: {pt.status} | SLA: {daysRem} Days
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
