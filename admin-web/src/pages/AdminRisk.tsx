import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { RestaurantRiskScore } from '../types';
import {
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Search,
  Building2,
  TrendingDown,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface AdminRiskProps {
  onNavigateToRestaurant?: (id: string) => void;
}

export const AdminRisk: React.FC<AdminRiskProps> = ({ onNavigateToRestaurant }) => {
  const [riskData, setRiskData] = useState<RestaurantRiskScore[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadRiskScores = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchRiskScores();
      if (res.success && res.data) {
        setRiskData(res.data);
      }
    } catch (err) {
      console.error('[AdminRisk] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRiskScores();
  }, []);

  const filteredList = riskData.filter((item) => {
    const matchesLevel = filterLevel === 'ALL' || item.riskLevel === filterLevel;
    const matchesSearch = !searchQuery.trim() || item.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) || item.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const getRiskBadge = (level: string, score: number) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center space-x-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>CRITICAL ({score}/100)</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>HIGH ({score}/100)</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>MEDIUM ({score}/100)</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>LOW ({score}/100)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white tracking-tight">Fraud & Risk Alerts</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
              HEALTH MONITOR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor unusual order cancellations, payment failures, compliance issues, and service downtime.
          </p>
        </div>

        <button
          onClick={loadRiskScores}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 shrink-0"
          title="Refresh Alerts"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Risk Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-[#121826] border border-rose-500/30 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-rose-400">Critical Attention Needed</div>
          <div className="text-3xl font-black text-rose-400">
            {riskData.filter(r => r.riskLevel === 'CRITICAL').length}
          </div>
          <div className="text-[10px] text-slate-500">Requires immediate administrative review</div>
        </div>

        <div className="p-5 bg-[#121826] border border-orange-500/30 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-orange-400">High Alert Restaurants</div>
          <div className="text-3xl font-black text-orange-400">
            {riskData.filter(r => r.riskLevel === 'HIGH').length}
          </div>
          <div className="text-[10px] text-slate-500">Elevated cancellations / payment failures</div>
        </div>

        <div className="p-5 bg-[#121826] border border-amber-500/30 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-amber-400">Medium Alert Restaurants</div>
          <div className="text-3xl font-black text-amber-400">
            {riskData.filter(r => r.riskLevel === 'MEDIUM').length}
          </div>
          <div className="text-[10px] text-slate-500">Incomplete compliance or tariff variations</div>
        </div>

        <div className="p-5 bg-[#121826] border border-emerald-500/30 rounded-3xl space-y-1">
          <div className="text-xs font-black uppercase text-emerald-400">Healthy Restaurants</div>
          <div className="text-3xl font-black text-emerald-400">
            {riskData.filter(r => r.riskLevel === 'LOW').length}
          </div>
          <div className="text-[10px] text-slate-500">Full compliance & healthy operations</div>
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
            placeholder="Filter by Restaurant name or City..."
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterLevel === lvl
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Cards Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-16 text-slate-500 bg-[#121826] border border-slate-800 rounded-3xl">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing risk signals across all restaurants...</span>
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-[#121826] border border-slate-800 rounded-3xl">
            No restaurants found matching risk criteria.
          </div>
        ) : (
          filteredList.map((r) => (
            <div
              key={r.restaurantId}
              className={`bg-[#121826] border p-5 rounded-3xl shadow-lg transition space-y-3 ${
                r.riskLevel === 'CRITICAL'
                  ? 'border-rose-500/40 hover:border-rose-500'
                  : r.riskLevel === 'HIGH'
                  ? 'border-orange-500/40 hover:border-orange-500'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-black text-sm">
                    <Building2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{r.restaurantName}</h3>
                    <div className="text-[11px] text-slate-400">{r.city} • Operational Status: <strong className="text-slate-200">{r.status}</strong></div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getRiskBadge(r.riskLevel, r.riskScore)}
                  {onNavigateToRestaurant && (
                    <button
                      onClick={() => onNavigateToRestaurant(r.restaurantId)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition"
                      title="Inspect 360 Profile"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Risk Factors Breakdown */}
              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Contributing Risk Factors ({r.riskFactors.length})</span>
                </div>
                {r.riskFactors.length === 0 ? (
                  <div className="text-xs text-emerald-400 font-bold">Zero active risk signals detected. Clean operational baseline.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {r.riskFactors.map((f, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        • {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] block font-bold">Total Orders</span>
                  <span className="font-extrabold text-white">{r.metrics.totalOrders}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] block font-bold">Cancellation Rate</span>
                  <span className="font-extrabold text-white">{r.metrics.cancellationRate}%</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] block font-bold">Failed Payments</span>
                  <span className="font-extrabold text-white">{r.metrics.failedPayments}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] block font-bold">Refunds</span>
                  <span className="font-extrabold text-white">{r.metrics.refundCount}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
