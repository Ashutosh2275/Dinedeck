import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { ConfigVersion, AdminRestaurant } from '../types';
import {
  RotateCcw,
  Building2,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeftRight,
  X,
  Loader2
} from 'lucide-react';

export const AdminChangeManagement: React.FC = () => {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [versions, setVersions] = useState<ConfigVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rollbackAuditId, setRollbackAuditId] = useState<string | null>(null);
  const [isRollbackSubmitting, setIsRollbackSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchRestaurants();
      if (res.success && res.data && res.data.length > 0) {
        setRestaurants(res.data);
        const firstId = res.data[0].id;
        setSelectedRestaurantId(firstId);
        await loadConfigVersions(firstId);
      }
    } catch (err) {
      console.error('[AdminChangeManagement] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfigVersions = async (restId: string) => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchConfigVersions(restId);
      if (res.success && res.data) {
        setCurrentConfig(res.data.currentConfig);
        setVersions(res.data.versions);
      }
    } catch (err) {
      console.error('[AdminChangeManagement] Error loading versions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleRestaurantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedRestaurantId(id);
    loadConfigVersions(id);
  };

  const handleRollback = async (versionAuditId: string) => {
    if (!selectedRestaurantId) return;
    setIsRollbackSubmitting(true);
    try {
      const res = await adminApi.rollbackConfigVersion(selectedRestaurantId, versionAuditId);
      if (res.success) {
        setFeedback(res.message || 'Configuration rollback completed successfully.');
        setRollbackAuditId(null);
        await loadConfigVersions(selectedRestaurantId);
      }

    } catch (err: any) {
      console.error('[AdminChangeManagement] Rollback error:', err);
      setFeedback(`Rollback failed: ${err.message}`);
    } finally {
      setIsRollbackSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white tracking-tight">Configuration Versioning & Rollback</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              CHANGE GOVERNANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-tracked restaurant configuration version history with instantaneous, safe one-click rollback capabilities.
          </p>
        </div>

        <button
          onClick={() => selectedRestaurantId && loadConfigVersions(selectedRestaurantId)}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 shrink-0"
          title="Refresh Versions"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Restaurant Selector Bar */}
      <div className="bg-[#121826] border border-slate-800 p-4 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Building2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-slate-300">Target Restaurant:</span>
        </div>
        <select
          value={selectedRestaurantId}
          onChange={handleRestaurantChange}
          className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold max-w-md w-full"
        >
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.city}) — Status: {r.status}
            </option>
          ))}
        </select>
      </div>

      {/* Active Configuration Snapshot */}
      {currentConfig && (
        <div className="bg-[#121826] border border-cyan-500/30 p-5 rounded-3xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Current Live Production Configuration</span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold text-[10px] rounded-lg">
              ACTIVE V_LATEST
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-bold">Commission Rate</span>
              <span className="text-cyan-400 font-black text-sm">{currentConfig.commissionRatePercent}%</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-bold">CGST Rate</span>
              <span className="text-white font-black text-sm">{currentConfig.cgstRatePercent}%</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-bold">SGST Rate</span>
              <span className="text-white font-black text-sm">{currentConfig.sgstRatePercent}%</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-bold">Service Charge</span>
              <span className="text-white font-black text-sm">{currentConfig.serviceChargePercent}%</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-bold">Packaging Charge</span>
              <span className="text-white font-black text-sm">₹{currentConfig.packagingCharge || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Historical Versions List */}
      <div className="bg-[#121826] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="flex items-center space-x-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Audited Historical Configuration Snapshots ({versions.length})</span>
          </span>
        </div>

        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading configuration version audit logs...</span>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No historical configuration mutations recorded for this restaurant yet.
            </div>
          ) : (
            versions.map((ver) => (
              <div
                key={ver.auditId}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-slate-800 text-cyan-400 font-mono font-black text-xs rounded-lg">
                      {ver.versionNumber}
                    </span>
                    <span className="text-xs font-extrabold text-white">{ver.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(ver.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1 font-mono">
                    {Object.entries(ver.snapshot).map(([k, val]: [string, any]) => (
                      <span key={k} className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                        {k}: <strong className="text-slate-200">{JSON.stringify(val)}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleRollback(ver.auditId)}
                    disabled={isRollbackSubmitting}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-xs font-black transition flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rollback to {ver.versionNumber}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
