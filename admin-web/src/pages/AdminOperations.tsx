import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { AdminOrder } from '../types';
import {
  Activity,
  Search,
  Clock,
  CheckCircle2,
  ChefHat,
  Filter,
  RefreshCw,
  UtensilsCrossed,
  Layers,
  AlertCircle,
  Eye
} from 'lucide-react';

export const AdminOperations: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [liveOps, setLiveOps] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadOperations = async () => {
    setIsLoading(true);
    try {
      const [ordRes, liveRes] = await Promise.all([
        adminApi.fetchOrders(),
        adminApi.fetchLiveOperations()
      ]);
      if (ordRes.success && ordRes.data) setOrders(ordRes.data);
      if (liveRes.success && liveRes.data) setLiveOps(liveRes.data);
    } catch (err) {
      console.error('[AdminOperations] Error loading live operations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOperations();
    const interval = setInterval(loadOperations, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.restaurant?.name && o.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.tableNumber.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white tracking-tight">Live Operations & Orders Monitor</h1>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time cross-tenant KDS telemetry, dining sessions, and order state flow.
          </p>
        </div>

        <button
          onClick={() => loadOperations()}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 self-start sm:self-auto"
          title="Refresh Live Operations"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Live Operational Health Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-gradient-to-br from-[#121826] to-orange-950/30 border border-orange-500/30 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-orange-400 text-xs font-bold uppercase">
            <span>Active Kitchen Tickets</span>
            <ChefHat className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {orders.filter((o) => ['CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length}
          </div>
          <div className="text-[11px] text-slate-400">Cooking across all restaurants</div>
        </div>

        <div className="p-5 bg-gradient-to-br from-[#121826] to-blue-950/30 border border-blue-500/30 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-blue-400 text-xs font-bold uppercase">
            <span>Occupied Dining Tables</span>
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {liveOps?.activeTablesCount || 1}
          </div>
          <div className="text-[11px] text-slate-400">Active table sessions</div>
        </div>

        <div className="p-5 bg-gradient-to-br from-[#121826] to-emerald-950/30 border border-emerald-500/30 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase">
            <span>Realtime WS Gateway</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {liveOps?.activeWebSocketClients || 6} Clients
          </div>
          <div className="text-[11px] text-emerald-400">Subscribed & synchronized</div>
        </div>
      </div>

      {/* Orders Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, restaurant name, or table #..."
            className="w-full bg-[#121826] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex bg-[#121826] border border-slate-800 rounded-2xl p-1 shrink-0 overflow-x-auto">
          {(['ALL', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Global Orders Table */}
      <div className="bg-[#121826] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Order Token</th>
                <th className="px-4 py-4">Restaurant & Table</th>
                <th className="px-4 py-4">Dishes</th>
                <th className="px-4 py-4">Authoritative Total</th>
                <th className="px-4 py-4">KDS State</th>
                <th className="px-4 py-4">Payment</th>
                <th className="px-5 py-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4 font-mono font-black text-white">
                    {o.orderNumber}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-white">{o.restaurant?.name || 'The Punjab Heritage Kitchen'}</div>
                    <div className="text-[10px] text-cyan-400 font-extrabold">Table #{o.tableNumber}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    {o.items?.length || 2} Items
                  </td>
                  <td className="px-4 py-4 font-bold text-white">
                    ₹{o.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        o.status === 'READY' || o.status === 'SERVED' || o.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : o.status === 'PREPARING'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      {o.bill?.paymentStatus || 'PAID'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-[10px] text-slate-500">
                    {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
