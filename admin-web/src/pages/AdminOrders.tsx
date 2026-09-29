import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
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
  FileText
} from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState<boolean>(false);
  const [correctionStatus, setCorrectionStatus] = useState<string>('CONFIRMED');
  const [correctionRemarks, setCorrectionRemarks] = useState<string>('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchOrders({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined
      });
      if (res.success && res.data) {
        setOrders(res.data);
        setTotalCount(res.total || res.data.length);
      }
    } catch (err) {
      console.error('[AdminOrders] Failed loading orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const openOrderDetail = async (orderId: string) => {
    setIsDetailLoading(true);
    setSelectedOrder(null);
    try {
      const res = await adminApi.fetchOrderDetail(orderId);
      if (res.success && res.data) {
        setSelectedOrder(res.data);
      }
    } catch (err) {
      console.error('[AdminOrders] Failed fetching detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !correctionRemarks.trim()) return;
    setIsSubmittingCorrection(true);
    try {
      const res = await adminApi.correctOrder(selectedOrder.id, {
        status: correctionStatus,
        remarks: correctionRemarks.trim()
      });
      if (res.success) {
        setFeedbackMessage('Order administratively corrected and audit log recorded.');
        setCorrectionModalOpen(false);
        setCorrectionRemarks('');
        await openOrderDetail(selectedOrder.id);
        await loadOrders();
      }
    } catch (err) {
      console.error('[AdminOrders] Correction error:', err);
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">PLACED</span>;
      case 'CONFIRMED':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">CONFIRMED</span>;
      case 'PREPARING':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">PREPARING</span>;
      case 'READY':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">READY</span>;
      case 'SERVED':
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">SERVED</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">CANCELLED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white tracking-tight">Orders Command Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
              AUTHORITATIVE COMMERCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Realtime multi-tenant order discovery, complete KOT lifecycle drilldowns, and auditable governance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadOrders}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 shrink-0"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
          <span>{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-[#121826] border border-slate-800 p-4 rounded-3xl shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order # (e.g. ORD-), Table #, Restaurant name, or Customer phone..."
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
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
          <span>Displaying {orders.length} of {totalCount} Authoritative Orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Restaurant & Branch</th>
                <th className="p-3.5">Table & Customer</th>
                <th className="p-3.5">Items Summary</th>
                <th className="p-3.5">Grand Total</th>
                <th className="p-3.5">Lifecycle Status</th>
                <th className="p-3.5">Created At</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center p-12 text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Loading orders telemetry...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-12 text-slate-500">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-cyan-400">{o.orderNumber}</td>
                    <td className="p-3.5">
                      <div className="font-extrabold text-white">{o.restaurant?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-500">{o.restaurant?.city || 'India'}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-white font-bold">Table #{o.tableNumber}</div>
                      <div className="text-[10px] text-slate-400">{o.user?.name || 'Guest User'}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {o.items && o.items.length > 0 ? (
                        <span>{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</span>
                      ) : (
                        <span className="text-slate-500 italic">No items itemized</span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400">₹{o.totalAmount.toFixed(2)}</td>
                    <td className="p-3.5">{getStatusBadge(o.status)}</td>
                    <td className="p-3.5 text-[10px] text-slate-400 font-mono">
                      {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => openOrderDetail(o.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 font-bold transition flex items-center space-x-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>360° Trace</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 Order Drilldown Drawer / Modal */}
      {(selectedOrder || isDetailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E131F] border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black text-white">{selectedOrder?.orderNumber || 'Loading Order...'}</h2>
                    {selectedOrder && getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-xs text-slate-400">Universal Order Lifecycle, KOT History & Financial Settlement Trace</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {isDetailLoading ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-xs font-bold text-slate-400">Loading comprehensive order history...</div>
                </div>
              ) : selectedOrder ? (
                <>
                  {/* Entity Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Merchant & Branch</span>
                      </div>
                      <div className="text-xs font-black text-white">{selectedOrder.restaurant?.name}</div>
                      <div className="text-[10px] text-slate-400">{selectedOrder.restaurant?.city} • Table #{selectedOrder.tableNumber}</div>
                    </div>

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>Customer Identity</span>
                      </div>
                      <div className="text-xs font-black text-white">{selectedOrder.user?.name || 'Guest Diner'}</div>
                      <div className="text-[10px] text-slate-400">{selectedOrder.user?.phone || 'Direct QR Session'}</div>
                    </div>

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bill & Settlement</span>
                      </div>
                      <div className="text-xs font-black text-emerald-400">₹{selectedOrder.totalAmount.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">
                        {selectedOrder.bills?.[0] ? `Bill: ${selectedOrder.bills[0].billNumber} (${selectedOrder.bills[0].paymentStatus})` : 'Pending Bill Generation'}
                      </div>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div className="space-y-2">
                    <div className="text-xs font-black text-slate-300 uppercase tracking-wider">Itemized KOT Order Items</div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-[10px] font-black text-slate-500 uppercase border-b border-slate-800">
                          <tr>
                            <th className="p-3">Item Name</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Unit Price</th>
                            <th className="p-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {selectedOrder.items?.map((it: any) => (
                            <tr key={it.id}>
                              <td className="p-3 text-white font-bold">{it.name} {it.variantName ? `(${it.variantName})` : ''}</td>
                              <td className="p-3 text-slate-300">{it.quantity}</td>
                              <td className="p-3 text-slate-300">₹{it.unitPrice.toFixed(2)}</td>
                              <td className="p-3 text-right text-emerald-400 font-bold">₹{it.totalPrice.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Status Timeline History */}
                  <div className="space-y-2">
                    <div className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <History className="w-4 h-4" />
                      <span>Authoritative Kitchen & Status Timeline</span>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                      {selectedOrder.statusHistory?.map((h: any, idx: number) => (
                        <div key={h.id || idx} className="flex items-start space-x-3 text-xs">
                          <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-white">{h.status}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{new Date(h.timestamp).toLocaleTimeString()}</span>
                            </div>
                            {h.remarks && <div className="text-[11px] text-slate-400 mt-0.5">{h.remarks}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setCorrectionModalOpen(true)}
                      className="px-4 py-2.5 rounded-2xl bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-xs font-black transition flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Administrative Correction</span>
                    </button>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                    >
                      Close Trace
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Admin Correction Modal */}
      {correctionModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E131F] border border-slate-700/80 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">Administrative Correction: {selectedOrder.orderNumber}</h3>
              <button onClick={() => setCorrectionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Target Status Override</label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="CONFIRMED">CONFIRMED (Re-accept)</option>
                  <option value="PREPARING">PREPARING (Kitchen Active)</option>
                  <option value="READY">READY (Plated)</option>
                  <option value="SERVED">SERVED (Completed Delivery)</option>
                  <option value="CANCELLED">CANCELLED (Administrative Cancellation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Correction Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={correctionRemarks}
                  onChange={(e) => setCorrectionRemarks(e.target.value)}
                  placeholder="State reason for manual intervention (e.g. Captain tablet battery failure recovery)"
                  rows={3}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCorrection}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs transition"
                >
                  {isSubmittingCorrection ? 'Applying...' : 'Apply Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
