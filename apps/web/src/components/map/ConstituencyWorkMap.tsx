import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { WorkRecommendation } from '../../types/project';
import { MOCK_CONSTITUENCY_WORKS, MOCK_CONSTITUENCIES } from '../../data/mockConstituencyWorks';
import {
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Landmark,
  Layers,
  Sparkles,
  Maximize2,
  Navigation,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to create color-coded div icons for different sectors
const createSectorIcon = (sector: string = '', status: string = '') => {
  let color = '#0284c7'; // default blue
  let symbol = '🏛️';

  const sec = sector.toLowerCase();
  if (sec.includes('education') || sec.includes('school') || sec.includes('library')) {
    color = '#2563eb'; // blue
    symbol = '🏫';
  } else if (sec.includes('health') || sec.includes('hospital') || sec.includes('icu')) {
    color = '#059669'; // emerald
    symbol = '🏥';
  } else if (sec.includes('water') || sec.includes('ro') || sec.includes('drinking')) {
    color = '#0284c7'; // sky
    symbol = '💧';
  } else if (sec.includes('road') || sec.includes('bridge') || sec.includes('light')) {
    color = '#d97706'; // amber
    symbol = '🛣️';
  } else if (sec.includes('sanitation') || sec.includes('toilet') || sec.includes('sewage')) {
    color = '#7c3aed'; // purple
    symbol = '🚽';
  } else if (sec.includes('solar') || sec.includes('energy') || sec.includes('power')) {
    color = '#ca8a04'; // yellow
    symbol = '⚡';
  }

  if (status === 'COMPLETED') {
    color = '#16a34a'; // strong green
  } else if (status === 'RECOMMENDED') {
    color = '#e11d48'; // rose
  }

  return L.divIcon({
    className: 'custom-sector-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: white;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

interface ConstituencyWorkMapProps {
  works?: WorkRecommendation[];
  center?: [number, number];
  zoom?: number;
  constituencyName?: string;
  onSelectWork?: (work: WorkRecommendation) => void;
  heightClass?: string;
}

// Controller component to center map smoothly and ensure Leaflet renders immediately
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 0.8 });
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    const t3 = setTimeout(() => map.invalidateSize(), 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [center, zoom, map]);
  return null;
};

export const ConstituencyWorkMap: React.FC<ConstituencyWorkMapProps> = ({
  works,
  center = [18.9400, 72.8300],
  zoom = 13,
  constituencyName = 'Mumbai South Constituency',
  onSelectWork,
  heightClass = 'h-full min-h-[400px]'
}) => {
  // Use provided works or default to rich mock dataset
  const initialWorks = (works && works.length > 0) ? works : MOCK_CONSTITUENCY_WORKS;
  
  const [displayedWorks, setDisplayedWorks] = useState<WorkRecommendation[]>(initialWorks);
  const [activeConstituency, setActiveConstituency] = useState<string>('MUMBAI_SOUTH');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [currentCenter, setCurrentCenter] = useState<[number, number]>(center);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const [activeTileLayer, setActiveTileLayer] = useState<'osm' | 'dark' | 'light'>('osm');

  // Sync state if works prop updates
  useEffect(() => {
    if (works && works.length > 0) {
      setDisplayedWorks(works);
    }
  }, [works]);

  // Sync center and zoom if props update from CitizenPortal
  useEffect(() => {
    if (center && (center[0] !== currentCenter[0] || center[1] !== currentCenter[1])) {
      setCurrentCenter(center);
    }
  }, [center]);

  useEffect(() => {
    if (zoom && zoom !== currentZoom) {
      setCurrentZoom(zoom);
    }
  }, [zoom]);

  // Handle Constituency Preset Switcher
  const handleConstituencyChange = (constituencyId: string) => {
    setActiveConstituency(constituencyId);
    const target = MOCK_CONSTITUENCIES.find(c => c.id === constituencyId);
    if (target) {
      setCurrentCenter(target.center);
      setCurrentZoom(target.zoom);
    }
  };

  // Filter works by search and status
  const filteredWorks = displayedWorks.filter((w) => {
    const matchesStatus =
      selectedStatusFilter === 'ALL' ||
      w.status === selectedStatusFilter;

    const matchesQuery =
      !searchQuery.trim() ||
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.location_address && w.location_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.sector && w.sector.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.implementing_agency && w.implementing_agency.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesQuery;
  });

  // Calculate statistics for map summary bar
  const totalCost = filteredWorks.reduce((acc, curr) => acc + Number(curr.sanctioned_amount || curr.estimated_cost || 0), 0);
  const completedCount = filteredWorks.filter(w => w.status === 'COMPLETED').length;
  const executionCount = filteredWorks.filter(w => w.status === 'IN_PROGRESS').length;

  return (
    <div className="w-full h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      
      {/* 1. MAP TOOLBAR & CONTROLS HEADER */}
      <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 z-10 shrink-0">
        
        {/* Left: Title & Constituency Preset Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
            <Landmark size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Constituency Work Locations Map</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-semibold">
                {filteredWorks.length} Plotted
              </span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-600 font-medium truncate max-w-[130px] sm:max-w-none">{constituencyName}</span>
              <span className="text-slate-400">•</span>
              {/* Preset Selector */}
              <select
                value={activeConstituency}
                onChange={(e) => handleConstituencyChange(e.target.value)}
                className="bg-white text-slate-800 text-[11px] font-semibold rounded-lg border border-slate-300 px-2 py-0.5 focus:outline-none focus:border-sky-500 shadow-2xs"
              >
                {MOCK_CONSTITUENCIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter pins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-300 focus:border-sky-500 rounded-lg pl-7 pr-2 py-1 text-xs text-slate-900 placeholder-slate-400 outline-none w-28 sm:w-36 shadow-2xs"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold">
            <button
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedStatusFilter === 'ALL' ? 'bg-sky-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({displayedWorks.length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('COMPLETED')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedStatusFilter === 'COMPLETED' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Done ({displayedWorks.filter(w => w.status === 'COMPLETED').length})
            </button>
          </div>

          {/* Tile Layer Selector */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold">
            <button
              onClick={() => setActiveTileLayer('osm')}
              className={`px-2 py-1 rounded ${activeTileLayer === 'osm' ? 'bg-white text-sky-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              title="Streets View"
            >
              Streets
            </button>
            <button
              onClick={() => setActiveTileLayer('light')}
              className={`px-2 py-1 rounded ${activeTileLayer === 'light' ? 'bg-white text-sky-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              title="Light View"
            >
              Light
            </button>
            <button
              onClick={() => setActiveTileLayer('dark')}
              className={`px-2 py-1 rounded ${activeTileLayer === 'dark' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              title="Dark View"
            >
              Dark
            </button>
          </div>
        </div>

      </div>

      {/* 2. MAIN INTERACTIVE LEAFLET CONTAINER */}
      <div className="flex-1 w-full relative z-0 min-h-[350px]" style={{ minHeight: '350px', height: '100%', width: '100%' }}>
        <MapContainer
          center={currentCenter}
          zoom={currentZoom}
          scrollWheelZoom={false}
          className="w-full h-full"
          style={{ height: '100%', width: '100%', minHeight: '350px' }}
        >
          <MapController center={currentCenter} zoom={currentZoom} />

          {/* Tile Layers based on selected theme */}
          {activeTileLayer === 'dark' ? (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          ) : activeTileLayer === 'light' ? (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}

          {/* Plotted Work Location Markers */}
          {filteredWorks.map((work) => {
            const lat = Number(work.latitude);
            const lng = Number(work.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            const icon = createSectorIcon(work.sector, work.status);

            return (
              <Marker key={work.id} position={[lat, lng]} icon={icon}>
                <Popup className="custom-mplads-popup">
                  <div className="p-2 max-w-sm text-slate-900 font-sans">
                    {/* Sector Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {work.sector || 'Public Works'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        work.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : work.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {work.status === 'COMPLETED' ? 'Marked Completed' : work.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {work.title}
                    </h4>

                    {/* Location Address */}
                    <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>{work.location_address || work.address || 'Constituency Work Site'}</span>
                    </p>

                    {/* Financial & Agency Info */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase">Sanctioned Amount</span>
                        <span className="font-extrabold text-blue-700">
                          ₹{Number(work.sanctioned_amount || work.estimated_cost || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase">Executing Agency</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {work.implementing_agency || 'District PWD'}
                        </span>
                      </div>
                    </div>

                    {/* Lat/Long & Inspection Button */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-500">
                        {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                      </span>

                      {onSelectWork && (
                        <button
                          type="button"
                          onClick={() => onSelectWork(work)}
                          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-1 px-3 rounded shadow transition-all flex items-center gap-1"
                        >
                          <span>Inspect Work</span>
                          <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* 3. MAP LEGEND & SUMMARY OVERLAY */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 border border-slate-200 p-3 rounded-xl backdrop-blur-md text-xs text-slate-800 max-w-xs shadow-lg">
          <div className="font-bold text-slate-900 flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span>Constituency Financial Summary</span>
            <ShieldCheck size={14} className="text-emerald-600" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <span className="text-[10px] text-slate-500 block font-semibold">Total Plotted Cost</span>
              <span className="font-mono font-bold text-emerald-700 text-xs">
                ₹{(totalCost / 100000).toFixed(2)} Lakhs
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-semibold">Completed Works</span>
              <span className="font-mono font-bold text-blue-700 text-xs">
                {completedCount} of {filteredWorks.length}
              </span>
            </div>
          </div>
          
          {/* Sector Symbols Legend */}
          <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600 font-medium">
            <span className="flex items-center gap-1">🏫 Education</span>
            <span className="flex items-center gap-1">🏥 Health</span>
            <span className="flex items-center gap-1">💧 Water</span>
            <span className="flex items-center gap-1">⚡ Solar</span>
          </div>
        </div>

      </div>

      {/* 4. FOOTER INFORMATIONAL BAR */}
      <div className="bg-slate-50 p-3 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span>All locations are verified with WGS84 EXIF geotags & MoSPI SLA tracking.</span>
        </div>
        <div className="text-[11px] font-mono text-slate-600">
          Showing {filteredWorks.length} of {displayedWorks.length} constituency locations
        </div>
      </div>

    </div>
  );
};
