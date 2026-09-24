import React, { useEffect, useState } from 'react';
import {
  publicService,
  StateItem,
  DistrictItem,
  ConstituencyItem,
  PortalConfig
} from '../../services/publicService';
import { WorkRecommendation } from '../../types/project';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConstituencyWorkMap } from '../../components/map/ConstituencyWorkMap';
import { ReportIssueModal } from './ReportIssueModal';
import {
  MapPin,
  Search,
  AlertTriangle,
  Navigation,
  RefreshCw,
  Globe,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck,
  Building,
  Info
} from 'lucide-react';

export const CitizenPortal: React.FC = () => {
  // Config state
  const [config, setConfig] = useState<PortalConfig>({
    nearby_radius_meters: 5000,
    nearby_radius_km: 5,
    max_nearby_results: 50,
    allowed_photo_types: ['image/jpeg', 'image/png'],
    max_photo_size_mb: 10
  });

  // Geolocation & Mode A State
  const [activeTab, setActiveTab] = useState<'NEARBY' | 'MANUAL_SEARCH'>('NEARBY');
  const [citizenCoords, setCitizenCoords] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<'IDLE' | 'LOCATING' | 'GRANTED' | 'DENIED' | 'ERROR'>('IDLE');
  const [geoErrorMessage, setGeoErrorMessage] = useState<string | null>(null);
  const [nearbyWorks, setNearbyWorks] = useState<(WorkRecommendation & { distance_meters?: number })[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Mode B Manual Area Search State
  const [states, setStates] = useState<StateItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [constituencies, setConstituencies] = useState<ConstituencyItem[]>([]);

  const [selectedStateId, setSelectedStateId] = useState<string>('all');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');
  const [selectedConstituencyId, setSelectedConstituencyId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [keywordQuery, setKeywordQuery] = useState<string>('');

  const [searchResults, setSearchResults] = useState<WorkRecommendation[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Map view center & zoom
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.9220, 72.8347]);
  const [mapZoom, setMapZoom] = useState<number>(13);

  // Work Detail Modal & Issue Report Modal
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkRecommendation | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedWorkForReport, setSelectedWorkForReport] = useState<WorkRecommendation | null>(null);

  // Initialize portal config and geography data
  useEffect(() => {
    loadPortalConfig();
    loadStates();
    // Default initial search to load active public works
    handleManualSearch();
    // Prompt browser geolocation for MODE A or load default coordinates
    requestBrowserGeolocation();
  }, []);

  const loadPortalConfig = async () => {
    try {
      const res = await publicService.getConfig();
      if (res.config) setConfig(res.config);
    } catch (e) {
      console.warn('Failed to load system portal config:', e);
    }
  };

  const loadStates = async () => {
    try {
      const res = await publicService.getStates();
      if (res.states) setStates(res.states);
    } catch (e) {
      console.warn('Failed to fetch states:', e);
    }
  };

  const handleStateChange = async (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedDistrictId('all');
    setSelectedConstituencyId('all');
    setDistricts([]);
    setConstituencies([]);

    if (stateId !== 'all') {
      try {
        const res = await publicService.getDistricts(stateId);
        if (res.districts) setDistricts(res.districts);
      } catch (e) {
        console.warn('Failed to fetch districts:', e);
      }
    }
  };

  const handleDistrictChange = async (districtId: string) => {
    setSelectedDistrictId(districtId);
    setSelectedConstituencyId('all');
    setConstituencies([]);

    if (districtId !== 'all' || selectedStateId !== 'all') {
      try {
        const res = await publicService.getConstituencies(selectedStateId !== 'all' ? Number(selectedStateId) : undefined, districtId);
        if (res.constituencies) setConstituencies(res.constituencies);
      } catch (e) {
        console.warn('Failed to fetch constituencies:', e);
      }
    }
  };

  // Helper to load nearby works for given coordinates
  const loadNearbyWorksForLocation = async (lat: number, lng: number) => {
    setLoadingNearby(true);
    try {
      const res = await publicService.getNearbyWorks(lat, lng, config.nearby_radius_meters);
      if (res.nearby_works) {
        setNearbyWorks(res.nearby_works);
      }
    } catch (err) {
      console.error('Error fetching nearby works:', err);
    } finally {
      setLoadingNearby(false);
    }
  };

  // Browser Geolocation API Execution (Mode A)
  const requestBrowserGeolocation = () => {
    setGeoStatus('LOCATING');
    setGeoErrorMessage(null);
    setLoadingNearby(true);

    if (!navigator.geolocation) {
      setGeoStatus('ERROR');
      setGeoErrorMessage('Geolocation is not supported by your browser. Displaying default constituency works in Mumbai South.');
      loadNearbyWorksForLocation(18.9220, 72.8347);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCitizenCoords([lat, lng]);
        setGeoStatus('GRANTED');
        setMapCenter([lat, lng]);
        setMapZoom(14);
        loadNearbyWorksForLocation(lat, lng);
      },
      (error) => {
        console.warn('Browser Geolocation error/denied:', error.message);
        setGeoStatus('DENIED');
        if (error.code === error.PERMISSION_DENIED) {
          setGeoErrorMessage('Location access was denied. Showing prominent constituency works in Mumbai South. Search works by area to explore other regions.');
        } else if (error.code === error.TIMEOUT) {
          setGeoErrorMessage('Location request timed out. Showing constituency works nearby.');
        } else {
          setGeoErrorMessage('Position unavailable. Showing constituency works nearby.');
        }
        // Load fallback works around Mumbai South center
        loadNearbyWorksForLocation(18.9220, 72.8347);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Manual Search Handler (Mode B)
  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingSearch(true);

    try {
      const res = await publicService.searchWorks({
        q: keywordQuery,
        state_id: selectedStateId,
        district_id: selectedDistrictId,
        constituency_id: selectedConstituencyId,
        status: selectedStatus
      });

      if (res.works) {
        setSearchResults(res.works);
        // If results exist, update map center to first work coordinate if available
        if (res.works.length > 0 && res.works[0].latitude && res.works[0].longitude) {
          const firstLat = Number(res.works[0].latitude);
          const firstLng = Number(res.works[0].longitude);
          if (!isNaN(firstLat) && !isNaN(firstLng)) {
            setMapCenter([firstLat, firstLng]);
            setMapZoom(13);
          }
        }
      }
    } catch (err) {
      console.error('Error executing manual area search:', err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const getPublicStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="success" className="bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center space-x-1 font-semibold">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Marked as Completed</span>
          </Badge>
        );
      case 'COMPLETION_SUBMITTED':
        return (
          <Badge variant="warning" className="bg-amber-50 text-amber-800 border-amber-300 flex items-center space-x-1 font-semibold">
            <FileCheck size={12} className="text-amber-600" />
            <span>Completion Submitted</span>
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="info" className="bg-sky-50 text-sky-800 border-sky-300 flex items-center space-x-1 font-semibold">
            <Clock size={12} className="text-sky-600" />
            <span>Work in Progress</span>
          </Badge>
        );
      case 'SANCTIONED':
        return (
          <Badge variant="purple" className="bg-purple-50 text-purple-800 border-purple-300 flex items-center space-x-1 font-semibold">
            <Layers size={12} className="text-purple-600" />
            <span>Sanctioned</span>
          </Badge>
        );
      case 'RECOMMENDED':
        return (
          <Badge variant="purple" className="bg-indigo-50 text-indigo-800 border-indigo-300 flex items-center space-x-1 font-semibold">
            <Layers size={12} className="text-indigo-600" />
            <span>Recommended</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="info" className="bg-slate-100 text-slate-800 border-slate-300 font-semibold">
            {status}
          </Badge>
        );
    }
  };

  const openReportModalForWork = (work?: WorkRecommendation) => {
    setSelectedWorkForReport(work || null);
    setIsReportModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      {/* PORTAL PUBLIC HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-sky-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Globe size={16} />
            <span>National MPLADS Public Transparency & Ground Verification Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Public Works & Ground Verification</h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            Explore actual MPLADS development projects near your location or across India. Help verify ground progress.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Button
            variant="gold"
            onClick={() => openReportModalForWork()}
            className="flex items-center space-x-2 shadow-sm font-bold text-xs"
          >
            <AlertTriangle size={16} />
            <span>Report an Issue / Unlisted Work</span>
          </Button>
        </div>
      </div>

      {/* MODE SELECTOR TABS */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('NEARBY')}
          className={`pb-3 text-xs md:text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'NEARBY'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Navigation size={18} />
          <span>MODE A: Works Near My Current Location</span>
        </button>

        <button
          onClick={() => setActiveTab('MANUAL_SEARCH')}
          className={`pb-3 text-xs md:text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'MANUAL_SEARCH'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search size={18} />
          <span>MODE B: Search Works Manually by Area</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE A: AUTOMATIC LOCATION / NEARBY WORKS */}
      {/* ========================================================================= */}
      {activeTab === 'NEARBY' && (
        <div className="space-y-6">
          {/* GEOLOCATION BANNER & CONTROLS */}
          <Card className="border-sky-300 bg-sky-50/70 shadow-xs">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <MapPin size={18} className="text-sky-700" />
                  <span className="text-sm font-bold text-slate-900">
                    Browser Location Status:
                  </span>
                  {geoStatus === 'LOCATING' && (
                    <span className="text-xs text-amber-700 font-semibold animate-pulse">Requesting location permission...</span>
                  )}
                  {geoStatus === 'GRANTED' && citizenCoords && (
                    <span className="text-xs text-emerald-700 font-bold">
                      Location Permission Granted ({citizenCoords[0].toFixed(4)}° N, {citizenCoords[1].toFixed(4)}° E)
                    </span>
                  )}
                  {(geoStatus === 'DENIED' || geoStatus === 'ERROR') && (
                    <span className="text-xs text-rose-700 font-semibold">Location Access Unavailable</span>
                  )}
                </div>

                <p className="text-xs text-slate-600">
                  {geoStatus === 'GRANTED'
                    ? `Querying PostgreSQL/PostGIS database for public works within ${config.nearby_radius_km} km radius.`
                    : geoErrorMessage || 'Allow location access in your browser to discover public works nearby.'}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestBrowserGeolocation}
                  disabled={loadingNearby}
                  className="flex items-center space-x-1.5 border-slate-300 text-slate-700 hover:bg-white"
                >
                  <RefreshCw size={14} className={loadingNearby ? 'animate-spin' : ''} />
                  <span>{geoStatus === 'GRANTED' ? 'Refresh GPS Location' : 'Allow Location'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('MANUAL_SEARCH')}
                  className="text-xs text-sky-700 hover:text-sky-900 font-semibold border-sky-300 bg-white"
                >
                  Search Manually Instead →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* NEARBY WORKS (LEFT FIXED SECTION) & LEAFLET MAP (RIGHT) DISPLAY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* FIXED SECTION: NEARBY WORK CARDS (LEFT SIDE - 50% width on desktop) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[530px]">
              {/* Fixed Header */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <MapPin size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Nearby MPLADS Works</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Sorted by closest GPS proximity</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  {nearbyWorks.length} work(s) nearby
                </span>
              </div>

              {/* Internal Scrollable Content Box */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/40">
                {loadingNearby ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-600 space-y-3 bg-white rounded-xl border border-slate-200">
                    <RefreshCw size={28} className="mx-auto animate-spin text-sky-600" />
                    <p className="text-xs font-semibold">Finding public works around your coordinates...</p>
                  </div>
                ) : nearbyWorks.length === 0 ? (
                  <Card className="border-slate-200 bg-white shadow-xs h-full flex items-center justify-center">
                    <CardContent className="p-8 text-center text-slate-600 space-y-3">
                      <Info size={36} className="mx-auto text-slate-400" />
                      <p className="text-xs leading-relaxed">
                        No registered MPLADS works found within {config.nearby_radius_km} km of your current location.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('MANUAL_SEARCH')}
                        className="text-xs border-slate-300 text-slate-700 font-semibold"
                      >
                        Search Works by Area
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  nearbyWorks.map((work: any) => (
                    <Card key={work.id} className="border-slate-200 hover:border-sky-400 transition-all bg-white shadow-xs hover:shadow-sm">
                      <CardContent className="p-4 space-y-3">
                        {/* Top Badges & Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              {work.id}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                              {work.sector}
                            </span>
                          </div>
                          {getPublicStatusBadge(work.status)}
                        </div>

                        {/* Title */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug hover:text-sky-700 transition-colors cursor-pointer" onClick={() => setSelectedWorkForDetail(work)}>
                            {work.title}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                            {work.description}
                          </p>
                        </div>

                        {/* Information Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 text-slate-700">
                          <div className="flex items-center space-x-1.5 truncate">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate" title={work.address || work.location_address}>{work.address || work.location_address || 'Location Unspecified'}</span>
                          </div>

                          <div className="flex items-center space-x-1.5 text-sky-700 font-bold">
                            <Building size={13} className="shrink-0" />
                            <span>Sanctioned: ₹{Number(work.sanctioned_amount || work.estimated_cost || 0).toLocaleString('en-IN')}</span>
                          </div>

                          {work.distance_meters !== undefined && (
                            <div className="flex items-center space-x-1.5 text-emerald-700 font-bold sm:col-span-2 bg-emerald-50/70 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              <Navigation size={13} className="shrink-0" />
                              <span>
                                {work.distance_meters >= 1000
                                  ? `${(work.distance_meters / 1000).toFixed(2)} km away from current GPS location`
                                  : `${Math.round(work.distance_meters)} meters away from current GPS location`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWorkForDetail(work)}
                            className="flex-1 text-xs border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                          >
                            View Work Details
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => openReportModalForWork(work)}
                            className="flex-1 text-xs font-bold shadow-2xs"
                          >
                            Report Ground Issue
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Map Column (RIGHT SIDE - 50% width on desktop) */}
            <div className="lg:col-span-6 h-[530px] flex flex-col">
              <ConstituencyWorkMap
                works={nearbyWorks}
                center={mapCenter}
                zoom={mapZoom}
                heightClass="h-[415px]"
                onSelectWork={(w) => setSelectedWorkForDetail(w)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE B: MANUAL AREA SEARCH */}
      {/* ========================================================================= */}
      {activeTab === 'MANUAL_SEARCH' && (
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Filter size={18} className="text-sky-600" />
                <span>Search Works by Area (State → District → Constituency)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <form onSubmit={handleManualSearch} className="space-y-4">
                {/* CASCADING GEOGRAPHY SELECTORS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                    <select
                      value={selectedStateId}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white font-medium"
                    >
                      <option value="all">All States</option>
                      {states.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.state_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white font-medium"
                    >
                      <option value="all">All Districts</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.district_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Constituency</label>
                    <select
                      value={selectedConstituencyId}
                      onChange={(e) => setSelectedConstituencyId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white font-medium"
                    >
                      <option value="all">All Constituencies</option>
                      {constituencies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.house_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Public Work Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white font-medium"
                    >
                      <option value="all">All Public Statuses</option>
                      <option value="COMPLETED">Marked as Completed</option>
                      <option value="COMPLETION_SUBMITTED">Completion Submitted</option>
                      <option value="IN_PROGRESS">Work in Progress</option>
                      <option value="SANCTIONED">Sanctioned</option>
                      <option value="RECOMMENDED">Recommended</option>
                    </select>
                  </div>
                </div>

                {/* KEYWORD SEARCH INPUT */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by Work Name, ID, Address, Sector, or Keyword..."
                      value={keywordQuery}
                      onChange={(e) => setKeywordQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white font-medium"
                    />
                  </div>
                  <Button type="submit" disabled={loadingSearch} size="sm" className="px-6 font-bold shadow-xs">
                    {loadingSearch ? 'Searching...' : 'Search Works'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* MATCHING WORKS (LEFT FIXED SECTION) & MANUAL SEARCH MAP (RIGHT) DISPLAY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* FIXED SECTION: MATCHING PUBLIC WORKS LIST (LEFT SIDE - 50% width on desktop) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[530px]">
              {/* Fixed Header */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                    <Search size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Matching Public Works</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Filtered by selected area & keyword</p>
                  </div>
                </div>
                <span className="text-xs text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full font-bold">
                  {searchResults.length} work(s) found
                </span>
              </div>

              {/* Internal Scrollable Content Box */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/40">
                {loadingSearch ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-600 space-y-3 bg-white rounded-xl border border-slate-200">
                    <RefreshCw size={28} className="mx-auto animate-spin text-sky-600" />
                    <p className="text-xs font-semibold">Querying database for selected area...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <Card className="border-slate-200 bg-white shadow-xs h-full flex items-center justify-center">
                    <CardContent className="p-8 text-center text-slate-600 space-y-3">
                      <Info size={36} className="mx-auto text-slate-400" />
                      <p className="text-xs font-medium text-slate-700">
                        No public works found for this area or search keyword.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setKeywordQuery('');
                          setSelectedStateId('all');
                          setSelectedDistrictId('all');
                          setSelectedConstituencyId('all');
                          setSelectedStatus('all');
                          handleManualSearch();
                        }}
                        className="text-xs border-slate-300 text-slate-700"
                      >
                        Reset All Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.map((work: any) => (
                    <Card key={work.id} className="border-slate-200 hover:border-sky-400 transition-all bg-white shadow-xs hover:shadow-sm">
                      <CardContent className="p-4 space-y-3">
                        {/* Top Row: Work ID, Sector, Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              {work.id}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                              {work.sector}
                            </span>
                          </div>
                          {getPublicStatusBadge(work.status)}
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4
                            className="text-sm font-bold text-slate-900 leading-snug hover:text-sky-700 transition-colors cursor-pointer"
                            onClick={() => setSelectedWorkForDetail(work)}
                          >
                            {work.title}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                            {work.description}
                          </p>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 text-slate-700 font-medium">
                          <div className="flex items-center space-x-1.5 truncate">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate" title={work.address || work.location_address}>
                              {work.address || work.location_address || 'Location Unspecified'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-sky-700 font-bold">
                            <Building size={13} className="shrink-0" />
                            <span>
                              Sanctioned: ₹{Number(work.sanctioned_amount || work.estimated_cost || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWorkForDetail(work)}
                            className="flex-1 text-xs border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                          >
                            View Work Details
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => openReportModalForWork(work)}
                            className="flex-1 text-xs font-bold shadow-2xs"
                          >
                            Report Ground Issue
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Map Column (RIGHT SIDE - 50% width on desktop) */}
            <div className="lg:col-span-6 h-[530px] flex flex-col">
              <ConstituencyWorkMap
                works={searchResults}
                center={mapCenter}
                zoom={mapZoom}
                heightClass="h-[415px]"
                onSelectWork={(w: WorkRecommendation) => setSelectedWorkForDetail(w)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PUBLIC WORK DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedWorkForDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full bg-white border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  {selectedWorkForDetail.sector}
                </span>
                <CardTitle className="text-lg font-bold text-slate-900 mt-1">
                  {selectedWorkForDetail.title}
                </CardTitle>
              </div>
              <div>{getPublicStatusBadge(selectedWorkForDetail.status)}</div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Description</h4>
                <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {selectedWorkForDetail.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 block font-semibold">Work ID</span>
                  <strong className="text-slate-900 font-mono text-xs">{selectedWorkForDetail.id}</strong>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 block font-semibold">Sanctioned Allocation</span>
                  <strong className="text-emerald-700 text-sm font-bold">
                    ₹{Number(selectedWorkForDetail.sanctioned_amount || selectedWorkForDetail.estimated_cost || 0).toLocaleString('en-IN')}
                  </strong>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 sm:col-span-2">
                  <span className="text-slate-500 block font-semibold">Public Location</span>
                  <strong className="text-slate-900">{selectedWorkForDetail.address || 'Location Unspecified'}</strong>
                </div>
              </div>

              {/* COMPLETED WORK GROUND VERIFICATION CALLOUT */}
              {selectedWorkForDetail.status === 'COMPLETED' && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 size={16} />
                    <span>This work has been marked COMPLETED by the Implementing Agency.</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Citizens are invited to physically inspect the site. If the work is missing, incomplete, or damaged, submit a ground observation report below.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setSelectedWorkForDetail(null)} className="border-slate-300 text-slate-700">
                  Close
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => {
                    const w = selectedWorkForDetail;
                    setSelectedWorkForDetail(null);
                    openReportModalForWork(w);
                  }}
                  className="font-bold text-xs"
                >
                  Report an Issue for this Work
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* REPORT ISSUE MODAL */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedWork={selectedWorkForReport}
        availableWorks={nearbyWorks.length > 0 ? nearbyWorks : searchResults}
      />
    </div>
  );
};
