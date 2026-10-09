import React, { useState, useEffect } from 'react';
import {
  Droplets, Truck, CheckCircle2, ShieldAlert,
  RefreshCw, Cloud, Server, Database, ChevronRight, X, MapPin
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { WARD_COORDINATES } from './data/wardsGeo';

// Fix Leaflet default icon path bug in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function App() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [showAwsDrawer, setShowAwsDrawer] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState([]);

  const fetchWards = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5001/api/wards');
      const data = await res.json();
      setWards(data);
    } catch (err) {
      console.error('Failed to fetch wards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  const handleBookTanker = async (wardId) => {
    try {
      setBookingLoading(wardId);
      const res = await fetch('http://localhost:5001/api/dispatch/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wardId, tankerCount: 2 }),
      });
      const data = await res.json();
      setBookingConfirmed(data);
      setDispatchLogs(prev => [data, ...prev]);
      setTimeout(() => setBookingConfirmed(null), 5000);
    } catch (err) {
      console.error('Dispatch failed:', err);
    } finally {
      setBookingLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CRITICAL':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Critical Depot Alert</span>;
      case 'ELEVATED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Stage 1 Rationing</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Normal Extraction</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">JalSetu</h1>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">AWS Powered</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">Urban Groundwater Buffer & Dispatch Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAwsDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-600" />
              AWS Infra Inspector
            </button>
            <button
              onClick={fetchWards}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Sensors
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {bookingConfirmed && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Priority Tanker Dispatched & Persisted to DynamoDB!</p>
              <p className="text-xs text-emerald-700">
                Order <span className="font-mono font-bold">{bookingConfirmed.bookingId}</span> allocated to {bookingConfirmed.wardId}.
              </p>
            </div>
          </div>
        )}

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monitored Catchment Wards</div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">{wards.length} Zones</div>
            <div className="text-xs text-slate-400">Hyderabad Urban Agglomeration</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Critical Buffer Alert</div>
            <div className="mt-1 text-2xl font-extrabold text-red-600">
              {wards.filter(w => w.dispatchStatus === 'CRITICAL').length} High Priority
            </div>
            <div className="text-xs text-red-500 font-medium">Bore exhaustion projected &lt; 48 hrs</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Collective Pooling Savings</div>
            <div className="mt-1 text-2xl font-extrabold text-blue-600">~30%</div>
            <div className="text-xs text-blue-500 font-medium">Prevented private spot surge pricing</div>
          </div>
        </div>

        {/* GIS Map & Dispatch Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Section */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Live Ward Water Table GIS
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Zoom to inspect aquifers</span>
            </div>
            <div className="h-[460px] rounded-lg overflow-hidden border border-slate-200">
              <MapContainer center={[17.445, 78.375]} zoom={12} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {wards.map((ward) => {
                  const coords = WARD_COORDINATES[ward.wardId] || { lat: 17.445, lng: 78.375 };
                  return (
                    <Marker key={ward.wardId} position={[coords.lat, coords.lng]}>
                      <Popup>
                        <div className="p-1">
                          <h4 className="font-bold text-xs">{ward.name}</h4>
                          <p className="text-[11px] text-slate-600">Runway: <b>{ward.daysRemaining} days</b></p>
                          <p className="text-[11px] text-slate-600">Depth: {ward.currentWaterLevelMeters}m</p>
                          <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            ward.dispatchStatus === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {ward.dispatchStatus}
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Ward Action Cards */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Action Recommendations</h2>
            {wards.map((ward) => (
              <div
                key={ward.wardId}
                className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
                  ward.dispatchStatus === 'CRITICAL' ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-medium text-slate-400">{ward.wardId}</span>
                    <h3 className="text-sm font-bold text-slate-900">{ward.name}</h3>
                  </div>
                  {getStatusBadge(ward.dispatchStatus)}
                </div>

                <div className="flex items-center justify-between text-xs my-3 py-2 px-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Current Depth</span>
                    <span className="font-semibold text-slate-800">{ward.currentWaterLevelMeters}m</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Depletion Runway</span>
                    <span className={`font-bold ${ward.daysRemaining <= 2 ? 'text-red-600' : 'text-slate-800'}`}>
                      {ward.daysRemaining} Days
                    </span>
                  </div>
                </div>

                <div className="mb-3 bg-blue-50/50 rounded-lg p-2.5 border border-blue-100/60">
                  <div className="flex items-start gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-slate-700 leading-snug">{ward.actionRecommendation}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleBookTanker(ward.wardId)}
                  disabled={bookingLoading === ward.wardId}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    ward.dispatchStatus === 'CRITICAL'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  {bookingLoading === ward.wardId ? 'Logging to AWS...' : 'Dispatch / Pool Tanker'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* AWS Architecture Drawer */}
      {showAwsDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">AWS Architecture Flow</h3>
              </div>
              <button onClick={() => setShowAwsDrawer(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Server className="w-4 h-4 text-blue-600" />
                  Compute: AWS Lambda / Express API
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Processes real-time bore depletion telemetry and calculates depletion runway formulas.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Database className="w-4 h-4 text-amber-600" />
                  Storage: Amazon DynamoDB (Table: JalSetuDispatches)
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Persists dynamic rationing orders and municipal dispatch tickets with milli-second latency.
                </p>
              </div>

              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Live AWS Event Stream</h4>
                {dispatchLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No tankers dispatched yet this session.</p>
                ) : (
                  <div className="space-y-2">
                    {dispatchLogs.map((log, idx) => (
                      <div key={idx} className="p-2.5 rounded border border-emerald-200 bg-emerald-50 text-[11px]">
                        <span className="font-mono font-bold text-emerald-800">{log.bookingId}</span>
                        <div className="text-emerald-700">Ward: {log.wardId} • Status: {log.status}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{log.dispatchedAt}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
