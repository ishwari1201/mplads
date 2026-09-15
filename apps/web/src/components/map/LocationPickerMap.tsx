import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Navigation, CheckCircle2, Loader2 } from 'lucide-react';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerMapProps {
  selectedLat: number | null;
  selectedLng: number | null;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

// Built-in Indian Cities & Locations Gazetteer for instant zero-latency match
const INDIAN_GAZETTEER = [
  { name: 'Colaba, Fort, Mumbai South', lat: 18.9220, lng: 72.8347, address: 'Colaba, Ward 4, Fort, Mumbai South, Maharashtra 400001' },
  { name: 'Nariman Point, Mumbai South', lat: 18.9260, lng: 72.8229, address: 'Nariman Point, Ward 1, Mumbai South, Maharashtra 400021' },
  { name: 'Byculla, Mumbai South', lat: 18.9780, lng: 72.8330, address: 'Byculla East, Ward 7, Mumbai South, Maharashtra 400027' },
  { name: 'Worli, Mumbai South', lat: 19.0090, lng: 72.8150, address: 'Worli Sea Face, Ward 10, Mumbai South, Maharashtra 400030' },
  { name: 'Dadar, Mumbai', lat: 19.0178, lng: 72.8478, address: 'Dadar West, Mumbai, Maharashtra 400028' },
  { name: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295, address: 'Bandra West, Mumbai, Maharashtra 400050' },
  { name: 'Andheri East, Mumbai', lat: 19.1136, lng: 72.8697, address: 'Andheri East, Mumbai, Maharashtra 400069' },
  { name: 'Thane West, Thane', lat: 19.2183, lng: 72.9781, address: 'Thane West, Thane, Maharashtra 400601' },
  { name: 'Navi Mumbai, Panvel', lat: 19.0330, lng: 73.0297, address: 'CBD Belapur, Navi Mumbai, Maharashtra 400614' },
  { name: 'Pune Central, Pune', lat: 18.5204, lng: 73.8567, address: 'Shivajinagar, Pune, Maharashtra 411005' },
  { name: 'Nagpur Central, Nagpur', lat: 21.1458, lng: 79.0882, address: 'Civil Lines, Nagpur, Maharashtra 440001' },
  { name: 'Nashik Central, Nashik', lat: 20.0059, lng: 73.7898, address: 'Panchavati, Nashik, Maharashtra 422003' },
  { name: 'New Delhi, Connaught Place', lat: 28.6315, lng: 77.2167, address: 'Connaught Place, New Delhi 110001' },
  { name: 'Bengaluru, M.G. Road', lat: 12.9716, lng: 77.5946, address: 'M.G. Road, Bengaluru, Karnataka 560001' },
  { name: 'Hyderabad, Banjara Hills', lat: 17.4156, lng: 78.4347, address: 'Banjara Hills, Hyderabad, Telangana 500034' },
  { name: 'Chennai, T. Nagar', lat: 13.0418, lng: 80.2341, address: 'T. Nagar, Chennai, Tamil Nadu 600017' },
  { name: 'Kolkata, Park Street', lat: 22.5551, lng: 88.3516, address: 'Park Street, Kolkata, West Bengal 700016' },
  { name: 'Ahmedabad, Ashram Road', lat: 23.0225, lng: 72.5714, address: 'Ashram Road, Ahmedabad, Gujarat 380009' },
  { name: 'Jaipur, Pink City', lat: 26.9124, lng: 75.7873, address: 'Pink City, Jaipur, Rajasthan 302002' },
  { name: 'Lucknow, Hazratganj', lat: 26.8467, lng: 80.9462, address: 'Hazratganj, Lucknow, Uttar Pradesh 226001' },
];

// Inner component to handle map click events & reverse geocoding
const MapClickListener: React.FC<{ onSelect: (lat: number, lng: number, address?: string) => void }> = ({ onSelect }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useMapEvents({
    async click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      onSelect(lat, lng);

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          onSelect(lat, lng, data.display_name);
        }
      } catch (err) {
        // Fallback silently
      }
    },
  });
  return null;
};

// Inner component to programmatically fly map view when selection changes
const ChangeView: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { animate: true, duration: 1 });
    setTimeout(() => map.invalidateSize(), 250);
  }, [center, map]);
  return null;
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  selectedLat,
  selectedLng,
  onLocationSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const currentLat = selectedLat !== null ? selectedLat : 18.9220;
  const currentLng = selectedLng !== null ? selectedLng : 72.8347;

  // Filter local gazetteer as user types
  const localMatches = searchQuery.trim().length >= 2
    ? INDIAN_GAZETTEER.filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.address.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    let results: any[] = [];

    // 1. Try Photon OpenStreetMap Geocoding API (Fast CORS-friendly API)
    try {
      const pRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}`);
      const pData = await pRes.json();
      if (pData?.features && pData.features.length > 0) {
        results = pData.features.slice(0, 5).map((f: any) => {
          const props = f.properties;
          const name = [props.name, props.city, props.state, props.country].filter(Boolean).join(', ');
          return {
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
            display_name: name || searchQuery,
          };
        });
      }
    } catch (err) {
      console.warn('Photon API fallback:', err);
    }

    // 2. Try Nominatim API if Photon had no results
    if (results.length === 0) {
      try {
        const nRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const nData = await nRes.json();
        if (nData && nData.length > 0) {
          results = nData.map((d: any) => ({
            lat: parseFloat(d.lat),
            lon: parseFloat(d.lon),
            display_name: d.display_name,
          }));
        }
      } catch (err) {
        console.warn('Nominatim API fallback:', err);
      }
    }

    // 3. Fallback to Local Gazetteer matches if external API calls returned empty
    if (results.length === 0 && localMatches.length > 0) {
      results = localMatches.map((m) => ({
        lat: m.lat,
        lon: m.lng,
        display_name: m.address,
      }));
    }

    setSearchResults(results);

    // Auto select first match if found
    if (results.length > 0) {
      const top = results[0];
      onLocationSelect(top.lat, top.lon, top.display_name);
    }

    setSearching(false);
  };

  const selectItem = (lat: number, lon: number, displayName: string) => {
    onLocationSelect(lat, lon, displayName);
    setSearchResults([]);
  };

  return (
    <div className="space-y-3">
      {/* SEARCH LOCATION BAR */}
      <form onSubmit={handleSearch} className="relative flex items-center space-x-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search city, ward, area, or landmark (e.g. Fort, Mumbai, Pune, Colaba)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5"
        >
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          <span>{searching ? 'Searching...' : 'Search Map'}</span>
        </button>
      </form>

      {/* LIVE SUGGESTIONS DROPDOWN (GAZETTEER & ONLINE API RESULTS) */}
      {(localMatches.length > 0 || searchResults.length > 0) && (
        <div className="p-2 bg-slate-900 border border-sky-500/40 rounded-xl max-h-48 overflow-y-auto space-y-1 text-xs shadow-2xl relative z-20">
          <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider px-2 py-1">
            Matching Map Locations (Click to Pan Pin & Auto-Fill Coordinates)
          </div>
          {localMatches.slice(0, 4).map((item, idx) => (
            <button
              key={`local-${idx}`}
              type="button"
              onClick={() => selectItem(item.lat, item.lng, item.address)}
              className="w-full text-left p-2 hover:bg-sky-950/60 rounded-lg text-slate-200 flex items-start space-x-2 text-[11px] transition-colors border border-transparent hover:border-sky-500/30"
            >
              <MapPin size={14} className="text-sky-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-100">{item.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{item.lat}° N, {item.lng}° E</div>
              </div>
            </button>
          ))}

          {searchResults.map((item, idx) => (
            <button
              key={`api-${idx}`}
              type="button"
              onClick={() => selectItem(item.lat, item.lon, item.display_name)}
              className="w-full text-left p-2 hover:bg-sky-950/60 rounded-lg text-slate-200 flex items-start space-x-2 text-[11px] transition-colors border border-transparent hover:border-sky-500/30"
            >
              <MapPin size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200 line-clamp-1">{item.display_name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{item.lat.toFixed(4)}° N, {item.lon.toFixed(4)}° E</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* INTERACTIVE LEAFLET MAP */}
      <div className="w-full h-[300px] rounded-xl overflow-hidden border border-slate-800 relative z-0 shadow-lg">
        <MapContainer center={[currentLat, currentLng]} zoom={13} scrollWheelZoom={false} className="w-full h-full">
          <ChangeView center={[currentLat, currentLng]} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickListener onSelect={onLocationSelect} />
          {selectedLat !== null && selectedLng !== null && (
            <Marker position={[selectedLat, selectedLng]}>
              <Popup>
                <div className="p-1 text-xs font-bold text-slate-900">
                  Selected Work Site Location
                  <div className="font-mono text-[10px] text-sky-700 font-normal">
                    {selectedLat.toFixed(6)}° N, {selectedLng.toFixed(6)}° E
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* COORDINATE AUTO-FILL CONFIRMATION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] bg-slate-950 p-3 rounded-xl border border-sky-500/30">
        <span className="flex items-center space-x-1.5 text-slate-300">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>Searching location or clicking map pin auto-fills Latitude & Longitude in inputs below.</span>
        </span>
        {selectedLat !== null && selectedLng !== null && (
          <span className="font-mono font-bold text-sky-300 px-2.5 py-1 rounded bg-sky-950 border border-sky-500/40 shrink-0">
            Lat: {selectedLat.toFixed(6)}° N | Lng: {selectedLng.toFixed(6)}° E
          </span>
        )}
      </div>
    </div>
  );
};
