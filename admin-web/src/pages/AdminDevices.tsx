import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { DeviceHardware } from '../types';
import {
  Smartphone,
  Printer,
  Monitor,
  RefreshCw,
  Search,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Play,
  LogOut,
  X
} from 'lucide-react';

export const AdminDevices: React.FC = () => {
  const [fleet, setFleet] = useState<DeviceHardware[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [executingDeviceId, setExecutingDeviceId] = useState<string | null>(null);

  const loadFleet = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchDeviceFleet();
      if (res.success && res.data) {
        setFleet(res.data);
      }
    } catch (err) {
      console.error('[AdminDevices] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFleet();
  }, []);

  const handleDiagnostic = async (deviceId: string, action: 'PING' | 'TEST_PRINT' | 'FORCE_LOGOUT') => {
    setExecutingDeviceId(deviceId);
    try {
      const res = await adminApi.triggerDeviceDiagnostic(deviceId, action);
      if (res.success) {
        setDiagnosticResult(res.message || 'Diagnostic command successfully transmitted to device.');
      }
    } catch (err: any) {

      setDiagnosticResult(`Diagnostic failed: ${err.message}`);
    } finally {
      setExecutingDeviceId(null);
    }
  };

  const filteredList = fleet.filter((d) => {
    const matchesType = filterType === 'ALL' || d.type === filterType;
    const matchesSearch = !searchQuery.trim() || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) || d.ipAddress.includes(searchQuery);
    return matchesType && matchesSearch;
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'KDS_TABLET':
        return <Smartphone className="w-5 h-5 text-cyan-400" />;
      case 'THERMAL_PRINTER':
        return <Printer className="w-5 h-5 text-amber-400" />;
      default:
        return <Monitor className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white tracking-tight">Devices & Printers</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              DEVICE STATUS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Realtime connection status and diagnostic control for restaurant kitchen tablets, thermal printers, and billing terminals.
          </p>
        </div>

        <button
          onClick={loadFleet}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 shrink-0"
          title="Refresh Fleet"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {diagnosticResult && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 text-xs font-bold text-cyan-300 flex items-center justify-between shadow-lg">
          <span>{diagnosticResult}</span>
          <button onClick={() => setDiagnosticResult(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fleet Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-[#121826] border border-slate-800 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-slate-400">Total Fleet Devices</div>
          <div className="text-3xl font-black text-white">{fleet.length}</div>
          <div className="text-[10px] text-slate-500">Across all connected restaurant branches</div>
        </div>

        <div className="p-5 bg-[#121826] border border-cyan-500/30 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-cyan-400">KDS Tablet Units</div>
          <div className="text-3xl font-black text-cyan-400">
            {fleet.filter(d => d.type === 'KDS_TABLET').length}
          </div>
          <div className="text-[10px] text-slate-500">Active kitchen stations</div>
        </div>

        <div className="p-5 bg-[#121826] border border-amber-500/30 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-amber-400">ESC/POS Printers</div>
          <div className="text-3xl font-black text-amber-400">
            {fleet.filter(d => d.type === 'THERMAL_PRINTER').length}
          </div>
          <div className="text-[10px] text-slate-500">LAN / Bluetooth thermal KOT printers</div>
        </div>

        <div className="p-5 bg-[#121826] border border-emerald-500/30 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-emerald-400">Online & Synchronized</div>
          <div className="text-3xl font-black text-emerald-400">
            {fleet.filter(d => d.status === 'ONLINE').length}
          </div>
          <div className="text-[10px] text-slate-500">Realtime WebSocket heartbeat verified</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#121826] border border-slate-800 p-4 rounded-3xl shadow-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Device Name, Restaurant, or IP Address..."
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'KDS_TABLET', 'THERMAL_PRINTER', 'WEB_CLIENT'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterType === t
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-16 text-slate-500 bg-[#121826] border border-slate-800 rounded-3xl">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Scanning hardware fleet telemetry...</span>
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-500 bg-[#121826] border border-slate-800 rounded-3xl">
            No devices found matching filter criteria.
          </div>
        ) : (
          filteredList.map((dev) => (
            <div
              key={dev.id}
              className="bg-[#121826] border border-slate-800 hover:border-slate-700 p-5 rounded-3xl shadow-lg transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                      {getDeviceIcon(dev.type)}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white">{dev.name}</h3>
                      <div className="text-[10px] text-slate-400">{dev.restaurantName}</div>
                    </div>
                  </div>

                  {dev.status === 'ONLINE' ? (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>ONLINE</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-slate-800 text-slate-400 border border-slate-700">
                      OFFLINE
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Model:</span>
                    <span className="text-slate-200 font-bold">{dev.deviceModel}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>IP / Port:</span>
                    <span className="text-cyan-400 font-mono font-bold">{dev.ipAddress}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Firmware / App:</span>
                    <span className="text-slate-200 font-bold">{dev.appVersion}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Station:</span>
                    <span className="text-slate-300 font-semibold">{dev.station}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => handleDiagnostic(dev.id, 'PING')}
                  disabled={executingDeviceId === dev.id}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition"
                >
                  Ping Diagnostic
                </button>

                {dev.type === 'THERMAL_PRINTER' && (
                  <button
                    onClick={() => handleDiagnostic(dev.id, 'TEST_PRINT')}
                    disabled={executingDeviceId === dev.id}
                    className="flex-1 py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-[11px] font-black transition"
                  >
                    Test Print
                  </button>
                )}

                <button
                  onClick={() => handleDiagnostic(dev.id, 'FORCE_LOGOUT')}
                  disabled={executingDeviceId === dev.id}
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                  title="Remote Session Revoke"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
