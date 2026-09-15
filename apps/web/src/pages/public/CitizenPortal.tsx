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
import { LeafletMap } from '../../components/map/LeafletMap';
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
    // Default initial search to load active public works from database
    handleManualSearch();
    // Prompt browser geolocation for MODE A
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

  // Browser Geolocation API Execution (Mode A)
  const requestBrowserGeolocation = () => {
    setGeoStatus('LOCATING');
    setGeoErrorMessage(null);
    setLoadingNearby(true);

    if (!navigator.geolocation) {
      setGeoStatus('ERROR');
      setGeoErrorMessage('Geolocation is not supported by your browser. You can still search works manually by area below.');
      setLoadingNearby(false);
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

        // Fetch actual PostGIS nearby works around citizen GPS
        try {
          const res = await publicService.getNearbyWorks(lat, lng, config.nearby_radius_meters);
          if (res.nearby_works) {
            setNearbyWorks(res.nearby_works);
          }
        } catch (err) {
          console.error('Error fetching PostGIS nearby works:', err);
        } finally {
          setLoadingNearby(false);
        }
      },
      (error) => {
        console.warn('Browser Geolocation error/denied:', error.message);
        setGeoStatus('DENIED');
        if (error.code === error.PERMISSION_DENIED) {
          setGeoErrorMessage('Location access was denied. Search works by area to explore public records.');
        } else if (error.code === error.TIMEOUT) {
          setGeoErrorMessage('Location request timed out. Retrying or manual search is available.');
        } else {
          setGeoErrorMessage('Position unavailable. Manual area search remains fully operational.');
        }
        setLoadingNearby(false);
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
            setMapZoom(12);
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
          <Badge variant="success" className="bg-emerald-950/80 text-emerald-300 border-emerald-500/50 flex items-center space-x-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>Marked as Completed</span>
          </Badge>
        );
      case 'COMPLETION_SUBMITTED':
        return (
          <Badge variant="warning" className="bg-amber-950/80 text-amber-300 border-amber-500/50 flex items-center space-x-1">
            <FileCheck size={12} className="text-amber-400" />
            <span>Completion Submitted</span>
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="info" className="bg-sky-950/80 text-sky-300 border-sky-500/50 flex items-center space-x-1">
            <Clock size={12} className="text-sky-400" />
            <span>Work in Progress</span>
          </Badge>
        );
      case 'SANCTIONED':
        return (
          <Badge variant="purple" className="bg-purple-950/80 text-purple-300 border-purple-500/50 flex items-center space-x-1">
            <Layers size={12} className="text-purple-400" />
            <span>Sanctioned</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="info" className="bg-slate-900 text-slate-300 border-slate-700">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Globe size={16} />
            <span>National MPLADS Public Transparency & Ground Verification Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Public Works & Ground Verification</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Explore actual MPLADS development projects near your location or across India. Help verify ground progress.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Button
            variant="gold"
            onClick={() => openReportModalForWork()}
            className="flex items-center space-x-2 shadow-lg"
          >
            <AlertTriangle size={16} />
            <span>Report an Issue / Unlisted Work</span>
          </Button>
        </div>
      </div>

      {/* MODE SELECTOR TABS */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('NEARBY')}
          className={`pb-3 text-xs md:text-sm font-semibold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'NEARBY'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation size={18} />
          <span>MODE A: Works Near My Current Location</span>
        </button>

        <button
          onClick={() => setActiveTab('MANUAL_SEARCH')}
          className={`pb-3 text-xs md:text-sm font-semibold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'MANUAL_SEARCH'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
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
          <Card className="border-sky-500/30 bg-slate-900/90">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <MapPin size={18} className="text-sky-400" />
                  <span className="text-sm font-bold text-slate-100">
                    Browser Location Status:
                  </span>
                  {geoStatus === 'LOCATING' && (
                    <span className="text-xs text-amber-400 animate-pulse">Requesting location permission...</span>
                  )}
                  {geoStatus === 'GRANTED' && citizenCoords && (
                    <span className="text-xs text-emerald-400 font-semibold">
                      Location Permission Granted ({citizenCoords[0].toFixed(4)}° N, {citizenCoords[1].toFixed(4)}° E)
                    </span>
                  )}
                  {(geoStatus === 'DENIED' || geoStatus === 'ERROR') && (
                    <span className="text-xs text-rose-400 font-semibold">Location Access Unavailable</span>
                  )}
                </div>

                <p className="text-xs text-slate-400">
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
                  className="flex items-center space-x-1.5"
                >
                  <RefreshCw size={14} className={loadingNearby ? 'animate-spin' : ''} />
                  <span>{geoStatus === 'GRANTED' ? 'Refresh GPS Location' : 'Allow Location'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('MANUAL_SEARCH')}
                  className="text-xs text-sky-400 hover:text-sky-300"
                >
                  Search Manually Instead →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* LEAFLET MAP & NEARBY WORKS DISPLAY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                  <Navigation size={16} className="text-sky-400" />
                  <span>Live GIS Nearby Map ({config.nearby_radius_km} km search radius)</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {nearbyWorks.length} work(s) found near you
                </span>
              </div>

              <LeafletMap
                points={nearbyWorks}
                center={mapCenter}
                zoom={mapZoom}
                citizenLocation={citizenCoords}
                onWorkSelect={(w) => setSelectedWorkForDetail(w)}
              />
            </div>

            {/* NEARBY WORK CARDS */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              <h3 className="text-sm font-bold text-slate-200">Nearby MPLADS Works</h3>

              {loadingNearby ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <RefreshCw size={24} className="mx-auto animate-spin text-sky-400" />
                  <p className="text-xs">Finding public works around your coordinates using PostGIS...</p>
                </div>
              ) : nearbyWorks.length === 0 ? (
                <Card className="border-slate-800 bg-slate-950">
                  <CardContent className="p-6 text-center text-slate-400 space-y-3">
                    <Info size={32} className="mx-auto text-slate-500" />
                    <p className="text-xs leading-relaxed">
                      No registered MPLADS works found within {config.nearby_radius_km} km of your current location.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('MANUAL_SEARCH')}
                      className="text-xs"
                    >
                      Search Works by Area
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                nearbyWorks.map((work: any) => (
                  <Card key={work.id} className="border-slate-800 hover:border-sky-500/50 transition-all bg-slate-900/60">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-400 block">
                            {work.sector}
                          </span>
                          <h4 className="text-sm font-bold text-slate-100 leading-snug">
                            {work.title}
                          </h4>
                        </div>
                        {getPublicStatusBadge(work.status)}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2">{work.description}</p>

                      <div className="text-xs space-y-1 text-slate-300 border-t border-slate-800/80 pt-2">
                        <div className="flex items-center space-x-1.5">
                          <MapPin size={12} className="text-slate-500 shrink-0" />
                          <span className="truncate">{work.address || 'Location Unspecified'}</span>
                        </div>

                        {work.distance_meters !== undefined && (
                          <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                            <Navigation size={12} />
                            <span>
                              {work.distance_meters >= 1000
                                ? `${(work.distance_meters / 1000).toFixed(2)} km away`
                                : `${Math.round(work.distance_meters)} m away`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* WORK GROUND VERIFICATION ACTION BUTTONS */}
                      <div className="flex items-center space-x-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWorkForDetail(work)}
                          className="w-1/2 text-xs"
                        >
                          View Work
                        </Button>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => openReportModalForWork(work)}
                          className="w-1/2 text-xs"
                        >
                          Report an Issue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE B: MANUAL AREA SEARCH */}
      {/* ========================================================================= */}
      {activeTab === 'MANUAL_SEARCH' && (
        <div className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Filter size={18} className="text-sky-400" />
                <span>Search Works by Area (State → District → Constituency)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <form onSubmit={handleManualSearch} className="space-y-4">
                {/* CASCADING GEOGRAPHY SELECTORS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                    <select
                      value={selectedStateId}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">District</label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Constituency</label>
                    <select
                      value={selectedConstituencyId}
                      onChange={(e) => setSelectedConstituencyId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Public Work Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    >
                      <option value="all">All Public Statuses</option>
                      <option value="COMPLETED">Marked as Completed</option>
                      <option value="COMPLETION_SUBMITTED">Completion Submitted</option>
                      <option value="IN_PROGRESS">Work in Progress</option>
                      <option value="SANCTIONED">Sanctioned</option>
                    </select>
                  </div>
                </div>

                {/* KEYWORD SEARCH INPUT */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by Work Name, Description, Sector, or Keyword..."
                      value={keywordQuery}
                      onChange={(e) => setKeywordQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <Button type="submit" disabled={loadingSearch} size="sm" className="px-5">
                    {loadingSearch ? 'Searching...' : 'Search Works'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* MAP AND MANUAL SEARCH RESULTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <LeafletMap
                points={searchResults}
                center={mapCenter}
                zoom={mapZoom}
                onWorkSelect={(w) => setSelectedWorkForDetail(w)}
              />
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">Matching Public Works</h3>
                <span className="text-xs text-slate-400">{searchResults.length} work(s) found</span>
              </div>

              {loadingSearch ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <RefreshCw size={24} className="mx-auto animate-spin text-sky-400" />
                  <p className="text-xs">Querying database for selected area...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <Card className="border-slate-800 bg-slate-950">
                  <CardContent className="p-6 text-center text-slate-400 space-y-2">
                    <Info size={28} className="mx-auto text-slate-500" />
                    <p className="text-xs">No public works found for this area or search filter.</p>
                  </CardContent>
                </Card>
              ) : (
                searchResults.map((work: any) => (
                  <Card key={work.id} className="border-slate-800 hover:border-sky-500/50 transition-all bg-slate-900/60">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-400 block">
                            {work.sector}
                          </span>
                          <h4 className="text-sm font-bold text-slate-100 leading-snug">
                            {work.title}
                          </h4>
                        </div>
                        {getPublicStatusBadge(work.status)}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2">{work.description}</p>

                      <div className="text-xs space-y-1 text-slate-300 border-t border-slate-800/80 pt-2">
                        <div className="flex items-center space-x-1.5">
                          <MapPin size={12} className="text-slate-500 shrink-0" />
                          <span className="truncate">{work.address || 'Location Unspecified'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-sky-400 font-semibold">
                          <Building size={12} />
                          <span>Sanctioned Cost: ₹{Number(work.sanctioned_amount || work.estimated_cost || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWorkForDetail(work)}
                          className="w-1/2 text-xs"
                        >
                          View Work
                        </Button>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => openReportModalForWork(work)}
                          className="w-1/2 text-xs"
                        >
                          Report an Issue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PUBLIC WORK DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedWorkForDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full bg-slate-900 border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  {selectedWorkForDetail.sector}
                </span>
                <CardTitle className="text-lg font-bold text-slate-100 mt-1">
                  {selectedWorkForDetail.title}
                </CardTitle>
              </div>
              <div>{getPublicStatusBadge(selectedWorkForDetail.status)}</div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Work Description</h4>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {selectedWorkForDetail.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Work ID</span>
                  <strong className="text-slate-100 font-mono text-xs">{selectedWorkForDetail.id}</strong>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Sanctioned Allocation</span>
                  <strong className="text-emerald-400 text-sm">
                    ₹{Number(selectedWorkForDetail.sanctioned_amount || selectedWorkForDetail.estimated_cost || 0).toLocaleString('en-IN')}
                  </strong>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 sm:col-span-2">
                  <span className="text-slate-400 block">Public Location</span>
                  <strong className="text-slate-100">{selectedWorkForDetail.address || 'Location Unspecified'}</strong>
                </div>
              </div>

              {/* COMPLETED WORK GROUND VERIFICATION CALLOUT */}
              {selectedWorkForDetail.status === 'COMPLETED' && (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 size={16} />
                    <span>This work has been marked COMPLETED by the Implementing Agency.</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Citizens are invited to physically inspect the site. If the work is missing, incomplete, or damaged, submit a ground observation report below.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
                <Button variant="outline" size="sm" onClick={() => setSelectedWorkForDetail(null)}>
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
