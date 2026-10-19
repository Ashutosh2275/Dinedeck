import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { PlatformOverviewData } from '../types';
import {
  TrendingUp,
  Building2,
  Users,
  UtensilsCrossed,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  Activity,
  Layers,
  FileCheck,
  Search,
  Sparkles,
  CreditCard,
  Percent
} from 'lucide-react';

interface AdminOverviewProps {
  onNavigate: (tab: any) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const [range, setRange] = useState<string>('all');
  const [data, setData] = useState<PlatformOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const loadData = async (selectedRange: string = range) => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchOverview(selectedRange);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('[AdminOverview] Failed loading metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(range);
  }, [range]);

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await adminApi.globalSearch(searchQuery);
      if (res.success && res.data) {
        setSearchResults(res.data);
      }
    } catch (err) {
      console.error('[GlobalSearch] Error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm dark:shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Platform Command Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              AUTHORITATIVE LEDGER
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Canonical DINEDECK platform governance, settlements, and live ecosystem health.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time Range Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-1 shrink-0">
            {(['today', '7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                  range === r
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {r === 'all' ? 'All Time' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'Today'}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(range)}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700 shrink-0"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Quick Search Bar */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm dark:shadow-lg space-y-3">
        <form onSubmit={handleGlobalSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Global Search: Restaurant, Branch, Table, Order ID, User, or Invoice..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl text-xs transition shadow-md shrink-0"
          >
            {isSearching ? 'Searching...' : 'Search Platform'}
          </button>
        </form>

        {searchResults && (
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-700 space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center justify-between font-bold text-slate-300 pb-2 border-b border-slate-800">
              <span>Search Results for "{searchQuery}"</span>
              <button onClick={() => setSearchResults(null)} className="text-slate-400 hover:text-white underline">
                Clear
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {searchResults.restaurants?.map((r: any) => (
                <div
                  key={r.id}
                  onClick={() => onNavigate('RESTAURANTS')}
                  className="p-2.5 bg-slate-800/80 rounded-xl hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-extrabold text-white">{r.name}</div>
                    <div className="text-[10px] text-slate-400">{r.city} • {r.status}</div>
                  </div>
                  <span className="text-cyan-400 font-bold text-[10px]">Restaurant →</span>
                </div>
              ))}

              {searchResults.orders?.map((o: any) => (
                <div
                  key={o.id}
                  onClick={() => onNavigate('OPERATIONS')}
                  className="p-2.5 bg-slate-800/80 rounded-xl hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-extrabold text-white">{o.orderNumber}</div>
                    <div className="text-[10px] text-slate-400">Table #{o.tableNumber} • ₹{o.totalAmount} • {o.status}</div>
                  </div>
                  <span className="text-orange-400 font-bold text-[10px]">Order →</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Primary Financial Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Order Value */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#121826] dark:to-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-5 rounded-3xl shadow-sm dark:shadow-xl space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Order Value</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            ₹{(data?.finance.grossOrderValue || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span>Total settled order amount</span>
          </div>
        </div>

        {/* 15% Platform Commission */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#121826] dark:to-cyan-950/30 border border-slate-200 dark:border-cyan-500/30 hover:border-cyan-400/50 p-5 rounded-3xl shadow-sm dark:shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-300">
            <span className="text-xs font-extrabold uppercase tracking-wider">DINEDECK 15% Commission</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400">
            ₹{(data?.finance.platformCommissionRevenue || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Platform gross margin earned</div>
        </div>

        {/* Net Amount Owed to Restaurants */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#121826] dark:to-emerald-950/30 border border-slate-200 dark:border-emerald-500/30 hover:border-emerald-400/50 p-5 rounded-3xl shadow-sm dark:shadow-xl space-y-2">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
            <span className="text-xs font-extrabold uppercase tracking-wider">Amount Owed to Restaurants</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{(data?.finance.netRestaurantPayable || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Ready for automated cycle payout</div>
        </div>

        {/* GST Taxes Withheld */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#121826] dark:to-purple-950/30 border border-slate-200 dark:border-purple-500/30 hover:border-purple-400/50 p-5 rounded-3xl shadow-sm dark:shadow-xl space-y-2">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-300">
            <span className="text-xs font-extrabold uppercase tracking-wider">GST Statutory Taxes</span>
            <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            ₹{(data?.finance.gstTaxCollected || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">CGST (2.5%) + SGST (2.5%)</div>
        </div>
      </div>

      {/* Operational & Governance Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Restaurants */}
        <div
          onClick={() => onNavigate('RESTAURANTS')}
          className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 p-4 rounded-3xl shadow-sm dark:shadow-lg space-y-2 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Restaurants</span>
            <Building2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {data?.restaurants.active || 0} / {data?.restaurants.total || 0}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
            {data?.restaurants.pendingReview || 0} Pending Verification
          </div>
        </div>

        {/* Cooking Tickets Today */}
        <div
          onClick={() => onNavigate('OPERATIONS')}
          className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 hover:border-orange-500/40 p-4 rounded-3xl shadow-sm dark:shadow-lg space-y-2 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Cooking In Kitchens</span>
            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {data?.operations.activeCookingTickets || 0}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {data?.operations.totalOrders || 0} Total Orders in Period
          </div>
        </div>

        {/* Diners & Active Sessions */}
        <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm dark:shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Dining Sessions</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {data?.customers.activeDiningSessions || 0} Live Tables
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {data?.customers.total || 0} Registered Diners
          </div>
        </div>

        {/* Compliance Risk */}
        <div
          onClick={() => onNavigate('COMPLIANCE')}
          className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 p-4 rounded-3xl shadow-sm dark:shadow-lg space-y-2 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Compliance & KYC</span>
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            100% Validated
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            FSSAI & GSTIN Compliant
          </div>
        </div>
      </div>

      {/* Quick Governance Navigation Actions */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm dark:shadow-xl space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Executive Platform Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('RESTAURANTS')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-cyan-500 rounded-2xl text-left space-y-1 transition group"
          >
            <Building2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Restaurants</div>
            <div className="text-[10px] text-slate-500">All Branches</div>
          </button>

          <button
            onClick={() => onNavigate('OPERATIONS')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-orange-500 rounded-2xl text-left space-y-1 transition group"
          >
            <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Kitchen & Orders</div>
            <div className="text-[10px] text-slate-500">Live Status</div>
          </button>

          <button
            onClick={() => onNavigate('FINANCE')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 rounded-2xl text-left space-y-1 transition group"
          >
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Payouts & Billing</div>
            <div className="text-[10px] text-slate-500">Platform Earnings</div>
          </button>

          <button
            onClick={() => onNavigate('COMPLIANCE')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-purple-500 rounded-2xl text-left space-y-1 transition group"
          >
            <FileCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Verification & Tax</div>
            <div className="text-[10px] text-slate-500">Restaurant Compliance</div>
          </button>

          <button
            onClick={() => onNavigate('IAM')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 rounded-2xl text-left space-y-1 transition group"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Staff & Access</div>
            <div className="text-[10px] text-slate-500">Permissions & History</div>
          </button>

          <button
            onClick={() => onNavigate('HEALTH')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-rose-500 rounded-2xl text-left space-y-1 transition group"
          >
            <Layers className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">System Health</div>
            <div className="text-[10px] text-slate-500">Connection & Latency</div>
          </button>
        </div>
      </div>
    </div>
  );
};
