import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import { adminWs, AdminWsMessage } from '../services/websocket';
import { AdminOrder } from '../types';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Eye,
  Edit3,
  X,
  Building2,
  User,
  CreditCard,
  History,
  FileText,
  Printer,
  ChevronDown,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [restaurantFilter, setRestaurantFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Play incoming order chime
  const playOrderSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [soundEnabled]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchOrders({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        restaurantId: restaurantFilter !== 'ALL' ? restaurantFilter : undefined,
        search: searchQuery.trim() || undefined
      });
      if (res.success && res.data) {
        setOrders(res.data);
        setTotalCount(res.total ?? res.data.length);
      } else {
        setOrders([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('[AdminOrders] Failed loading orders:', err);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    adminApi.fetchRestaurants().then((res) => {
      if (res.success && res.data) {
        setRestaurants(res.data);
      }
    }).catch((err) => {
      console.error('[AdminOrders] Failed loading restaurants:', err);
    });
  }, []);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, restaurantFilter]);

  // Realtime WebSocket Subscription
  useEffect(() => {
    const unsub = adminWs.onMessage((msg: AdminWsMessage) => {
      if (['ORDER_CREATED', 'NEW_ORDER'].includes(msg.type)) {
        playOrderSound();
        const incoming = msg.payload || msg.data;
        if (incoming) {
          setOrders((prev) => [incoming, ...prev]);
          setFeedbackMessage(`Live Order Alert: ${incoming.orderNumber || 'New Order'} at ${incoming.restaurant?.name || 'Partner'}`);
          setTimeout(() => setFeedbackMessage(null), 5000);
        }
      } else if (msg.type === 'ORDER_STATUS_CHANGED') {
        const payload = msg.payload || msg.data;
        if (payload?.orderId) {
          setOrders((prev) =>
            prev.map((o) => (o.id === payload.orderId ? { ...o, status: payload.status } : o))
          );
        }
      }
    });

    return () => unsub();
  }, [playOrderSound]);

  const handleStatusOverride = (orderId: string, nextStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    setFeedbackMessage(`Order #${orderId} administratively updated to ${nextStatus}.`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchRest = restaurantFilter === 'ALL' || o.restaurantId === restaurantFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.tableNumber?.toLowerCase().includes(q) ||
      o.restaurant?.name?.toLowerCase().includes(q) ||
      o.user?.phone?.includes(q) ||
      o.user?.name?.toLowerCase().includes(q);
    return matchStatus && matchRest && matchSearch;
  });

  const totalValue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCommission = totalValue * 0.15;

  const AdminOrderCountdown: React.FC<{ deadline?: string; createdAt?: string }> = ({ deadline, createdAt }) => {
    const [remaining, setRemaining] = useState<number>(() => {
      const now = Date.now();
      if (deadline) return Math.max(0, Math.floor((new Date(deadline).getTime() - now) / 1000));
      if (createdAt) return Math.max(0, 90 - Math.floor((now - new Date(createdAt).getTime()) / 1000));
      return 90;
    });

    useEffect(() => {
      const calc = () => {
        const now = Date.now();
        if (deadline) return Math.max(0, Math.floor((new Date(deadline).getTime() - now) / 1000));
        if (createdAt) return Math.max(0, 90 - Math.floor((now - new Date(createdAt).getTime()) / 1000));
        return 90;
      };
      setRemaining(calc());
      const t = setInterval(() => setRemaining(calc()), 1000);
      return () => clearInterval(t);
    }, [deadline, createdAt]);

    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (remaining === 0) {
      return <span className="text-[10px] font-bold text-rose-400">SLA Expired</span>;
    }
    return (
      <span className={`text-[10px] font-mono font-bold ${remaining <= 15 ? 'text-rose-400 animate-pulse' : remaining <= 45 ? 'text-amber-400' : 'text-cyan-400'}`}>
        · {timeStr}
      </span>
    );
  };

  const getStatusBadge = (status: string, order?: any) => {
    switch (status) {
      case 'PLACED':
        return (
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
              PLACED
            </span>
            {(order?.acceptanceDeadline || order?.createdAt) && (
              <AdminOrderCountdown deadline={order?.acceptanceDeadline} createdAt={order?.createdAt} />
            )}
          </div>
        );
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">CONFIRMED</span>;
      case 'PREPARING':
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">PREPARING</span>;
      case 'READY':
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">READY FOR PICKUP</span>;
      case 'SERVED':
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">SERVED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">CANCELLED</span>;
      case 'REJECTED':
        const isTimeout = order?.rejectionReasonCode === 'ACCEPTANCE_TIMEOUT' || String(order?.rejectionReason || '').includes('90 seconds');
        return (
          <div className="flex flex-col gap-0.5">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 inline-flex items-center gap-1">
              {isTimeout ? 'AUTO-REJECTED (TIMEOUT)' : `REJECTED: ${order?.rejectionReasonCode || 'STAFF'}`}
            </span>
            {order?.rejectionReason && (
              <span className="text-[10px] text-slate-400 max-w-[200px] truncate" title={order.rejectionReason}>
                {order.rejectionReason}
              </span>
            )}
          </div>
        );
      default:
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-white tracking-tight">Centralized Orders Command Center</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live order tracking, status progression, and instant tax invoices across all restaurants.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-2xl border transition ${soundEnabled ? 'bg-slate-800 text-cyan-400 border-slate-700' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
            title={soundEnabled ? 'Sound alerts enabled' : 'Sound alerts muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={loadOrders}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtered Order Volume</div>
          <div className="text-2xl font-black text-white mt-1">{filteredOrders.length} Orders</div>
          <div className="text-[10px] text-cyan-400 mt-0.5">Real-time synchronized</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active in Kitchen</div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {filteredOrders.filter((o) => ['PLACED', 'CONFIRMED', 'PREPARING'].includes(o.status)).length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cooking across stations</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Order Value</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">₹{totalValue.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Customer payments captured</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform Commission (15%)</div>
          <div className="text-2xl font-black text-purple-400 mt-1">₹{totalCommission.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-purple-300 mt-0.5">Platform commission earned</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3 bg-[#121826] border border-slate-800 p-4 rounded-3xl shadow-lg">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order # (ORD-...), Table, Restaurant name, or Diner phone..."
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Restaurant Filter Dropdown */}
        <div className="relative min-w-[220px]">
          <select
            value={restaurantFilter}
            onChange={(e) => setRestaurantFilter(e.target.value)}
            className="w-full appearance-none bg-slate-900 border border-slate-700 text-white text-xs font-bold py-2.5 pl-3.5 pr-8 rounded-2xl focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Partner Chains ({restaurants.length})</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0">
          {['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#121826] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
          <span>Showing {filteredOrders.length} Orders</span>
          <span className="text-[10px] text-cyan-400 font-mono">Realtime Hub: Connected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] font-black uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Restaurant Chain</th>
                <th className="p-3.5">Table & Diner</th>
                <th className="p-3.5">Items Ordered</th>
                <th className="p-3.5">Bill Total</th>
                <th className="p-3.5">Kitchen Status</th>
                <th className="p-3.5 text-right">SuperAdmin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                    <p className="font-semibold text-slate-400">No orders found</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {searchQuery || statusFilter !== 'ALL' || restaurantFilter !== 'ALL'
                        ? 'No orders match the selected filters.'
                        : 'Realtime live orders from partner restaurants will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-white leading-tight">{ord.orderNumber || ord.id}</div>
                      <div className="text-[10px] text-slate-500">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-200">{ord.restaurant?.name || 'Restaurant'}</div>
                      <div className="text-[10px] text-slate-500">{ord.restaurant?.city || ''}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-cyan-400">
                        {ord.tableNumber ? `Table ${ord.tableNumber}` : 'Direct Order'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ord.user?.name || 'Guest'} {ord.user?.phone ? `(${ord.user.phone})` : ''}
                      </div>
                    </td>

                    <td className="p-3.5 max-w-[220px]">
                      <div className="space-y-0.5 truncate">
                        {ord.items && ord.items.length > 0 ? (
                          ord.items.map((it: any, i: number) => (
                            <div key={i} className="text-slate-300 text-[11px] truncate">
                              {it.quantity}x {it.name}
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px]">No items listed</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-black text-emerald-400 text-sm">₹{Number(ord.totalAmount || 0).toFixed(2)}</div>
                      <div className="text-[9px] text-slate-500">
                        {ord.cgstAmount || ord.sgstAmount ? 'Incl. GST' : 'Standard'}
                      </div>
                    </td>

                    <td className="p-3.5">
                      {getStatusBadge(ord.status, ord)}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {ord.status === 'PLACED' && (
                          <button
                            onClick={() => handleStatusOverride(ord.id, 'PREPARING')}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black hover:bg-amber-500/20"
                          >
                            Start Prep
                          </button>
                        )}
                        {ord.status === 'PREPARING' && (
                          <button
                            onClick={() => handleStatusOverride(ord.id, 'READY')}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-black hover:bg-purple-500/20"
                          >
                            Mark Ready
                          </button>
                        )}
                        {ord.status === 'READY' && (
                          <button
                            onClick={() => handleStatusOverride(ord.id, 'SERVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black hover:bg-emerald-500/20"
                          >
                            Mark Served
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setIsReceiptModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Print / View Tax Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formal Tax Receipt Modal */}
      {isReceiptModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121826] border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center pb-3 border-b border-dashed border-slate-700">
              <h3 className="font-black text-white text-base">{selectedOrder.restaurant?.name || 'Restaurant'}</h3>
              <p className="text-[10px] text-slate-400">{selectedOrder.restaurant?.city ? `${selectedOrder.restaurant.city}, India` : 'India'}</p>
              {(selectedOrder.restaurant?.gstin || selectedOrder.restaurant?.fssai) && (
                <p className="text-[9px] font-mono text-cyan-400 mt-1">
                  {selectedOrder.restaurant?.gstin ? `GSTIN: ${selectedOrder.restaurant.gstin}` : ''}
                  {selectedOrder.restaurant?.gstin && selectedOrder.restaurant?.fssai ? ' • ' : ''}
                  {selectedOrder.restaurant?.fssai ? `FSSAI: ${selectedOrder.restaurant.fssai}` : ''}
                </p>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Order No:</span>
                <span className="font-mono font-bold text-white">{selectedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Table:</span>
                <span className="font-bold text-white">{selectedOrder.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Diner:</span>
                <span>{selectedOrder.user?.name || 'Walk-in Diner'}</span>
              </div>
            </div>

            {selectedOrder.status === 'REJECTED' && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                <div className="font-black flex items-center justify-between">
                  <span>Rejection Status:</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    {selectedOrder.rejectionReasonCode || 'REJECTED'}
                  </span>
                </div>
                {selectedOrder.rejectionReason && (
                  <p className="italic text-[11px] text-slate-300">"{selectedOrder.rejectionReason}"</p>
                )}
                {selectedOrder.rejectedBy && (
                  <div className="text-[10px] text-slate-400">Recorded by: {selectedOrder.rejectedBy}</div>
                )}
              </div>
            )}

            <div className="border-t border-b border-dashed border-slate-700 py-2.5 space-y-1 text-xs">
              {selectedOrder.items?.map((it: any, i: number) => (
                <div key={i} className="flex justify-between text-slate-200">
                  <span>{it.quantity}x {it.name}</span>
                  <span className="font-mono font-bold">₹{it.unitPrice * it.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CGST (2.5%)</span>
                <span>₹{selectedOrder.cgstAmount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST (2.5%)</span>
                <span>₹{selectedOrder.sgstAmount}</span>
              </div>
              {selectedOrder.serviceCharge > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Service Charge (5%)</span>
                  <span>₹{selectedOrder.serviceCharge}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-700">
                <span>Grand Total</span>
                <span className="text-emerald-400">₹{selectedOrder.totalAmount}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
