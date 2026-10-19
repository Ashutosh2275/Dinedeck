import React, { useState, useMemo } from 'react';
import { useCustomer } from '../context/CustomerContext';
import {
  History,
  Receipt,
  Calendar,
  ArrowLeft,
  Printer,
  Search,
  LogIn,
  Clock,
  CheckCircle2,
  FileText,
  UtensilsCrossed,
  X
} from 'lucide-react';

export const CustomerHistory: React.FC = () => {
  const {
    user,
    customerOrders,
    offlineReceipts,
    setActiveView,
    openAuthModal,
    session
  } = useCustomer();

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Normalize all orders into a unified array
  const unifiedOrders = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    for (const ord of customerOrders) {
      const key = ord.orderNumber || ord.id;
      if (!seen.has(key)) {
        seen.add(key);
        const items = ord.items || [];
        const subtotal =
          Number(ord.subtotal) ||
          items.reduce(
            (s: number, it: any) =>
              s + (Number(it.totalPrice) || (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1)),
            0
          );
        const grandTotal =
          Number(ord.totalAmount) ||
          Number((ord as any).grandTotal) ||
          (subtotal > 0 ? Math.round(subtotal * 1.1) : 0);

        list.push({
          id: ord.id,
          orderNumber: ord.orderNumber || `#ORD-${ord.id.slice(-4)}`,
          restaurantName: ord.restaurant?.name || (ord as any).restaurantName || 'DineDeck Dining',
          restaurantAddress: ord.restaurant?.fullAddress || 'Flagship Gourmet Location',
          tableNumber: ord.tableNumber || '1',
          status: ord.status || 'COMPLETED',
          subtotal,
          taxTotal: (ord as any).taxTotal != null ? Number((ord as any).taxTotal) : subtotal * 0.05,
          serviceCharge: ord.serviceCharge != null ? Number(ord.serviceCharge) : subtotal * 0.05,
          grandTotal,
          paymentMethod:
            (ord.bills?.[0] as any)?.payments?.[0]?.paymentMethod ||
            ord.bills?.[0]?.paymentMethod ||
            'UPI',
          createdAt: ord.createdAt || new Date().toISOString(),
          items,
          customerName: user?.name || 'Guest Diner',
          isCloud: true
        });
      }
    }

    for (const rc of offlineReceipts) {
      const key = rc.orderNumber || rc.receiptId;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: rc.receiptId,
          orderNumber: rc.orderNumber || `#ORD-${rc.receiptId.slice(-4)}`,
          restaurantName: rc.restaurantName || 'DineDeck Dining',
          restaurantAddress: rc.restaurantAddress || 'Flagship Gourmet Location',
          tableNumber: rc.tableNumber || '1',
          status: 'COMPLETED',
          subtotal: rc.subtotal,
          taxTotal: rc.taxTotal,
          serviceCharge: rc.serviceCharge,
          grandTotal: rc.grandTotal,
          paymentMethod: rc.paymentMethod || 'UPI',
          createdAt: rc.paidAt || new Date().toISOString(),
          items: rc.items || [],
          customerName: rc.customerName || user?.name || 'Guest Diner',
          isCloud: false
        });
      }
    }

    // Sort by latest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [customerOrders, offlineReceipts, user?.name]);

  // Filtered list
  const filteredOrders = useMemo(() => {
    return unifiedOrders.filter((ord) => {
      // Filter tab
      if (filter === 'ACTIVE') {
        const isActive = ['PLACED', 'CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'].includes(ord.status);
        if (!isActive) return false;
      } else if (filter === 'COMPLETED') {
        const isComp = ['COMPLETED', 'PAID'].includes(ord.status);
        if (!isComp) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRest = ord.restaurantName.toLowerCase().includes(q);
        const matchNum = ord.orderNumber.toLowerCase().includes(q);
        const matchItem = ord.items.some((it: any) => it.name.toLowerCase().includes(q));
        if (!matchRest && !matchNum && !matchItem) return false;
      }

      return true;
    });
  }, [unifiedOrders, filter, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED':
        return (
          <span className="text-[10px] text-blue-400 font-black bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            PLACED
          </span>
        );
      case 'CONFIRMED':
      case 'ACCEPTED':
        return (
          <span className="text-[10px] text-indigo-400 font-black bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            CONFIRMED
          </span>
        );
      case 'PREPARING':
        return (
          <span className="text-[10px] text-amber-400 font-black bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            PREPARING
          </span>
        );
      case 'READY':
        return (
          <span className="text-[10px] text-emerald-400 font-black bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            READY
          </span>
        );
      case 'SERVED':
        return (
          <span className="text-[10px] text-emerald-400 font-black bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            SERVED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="text-[10px] text-emerald-400 font-black bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            PAID
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="text-[10px] text-rose-400 font-black bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="text-[10px] text-slate-300 font-black bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-2xl mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setActiveView('ACCOUNT')}
            className="p-2.5 rounded-2xl bg-[#151D30] border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
            title="Return to Account"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Order History & Bills
            </h1>
            <p className="text-xs text-slate-400">
              Live orders, table visits & official GST tax invoices
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-500/15 text-orange-400 border border-orange-500/30 shrink-0">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
        </span>
      </div>

      {/* Guest Notice if not logged in */}
      {!user && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white">Browsing as Guest</div>
            <p className="text-[11px] text-slate-400">
              Sign in to sync your order history and receipts across devices.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('SIGN_IN')}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-bold text-xs transition cursor-pointer shrink-0"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by restaurant, dish, or order #..."
            className="w-full bg-[#151D30] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-1 bg-[#121824] rounded-2xl border border-slate-800/80">
          {[
            { key: 'ALL', label: 'All Records' },
            { key: 'ACTIVE', label: 'Active & Cooking' },
            { key: 'COMPLETED', label: 'Paid & Completed' }
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key as any)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                filter === t.key
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-white">No Orders Found</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No orders matching "${searchQuery}". Try a different keyword.`
              : 'Whenever you place orders or settle bills at a dining table, records appear here.'}
          </p>
          <button
            type="button"
            onClick={() => setActiveView('HOME')}
            className="px-5 py-2.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-xl hover:bg-orange-500 hover:text-white transition cursor-pointer"
          >
            Explore Restaurants
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              onClick={() => setSelectedReceipt(ord)}
              className="bg-[#151D30] hover:bg-slate-800/80 border border-slate-800 hover:border-orange-500/50 rounded-3xl p-5 shadow-lg cursor-pointer transition space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white group-hover:text-orange-400 transition">
                      {ord.restaurantName}
                    </span>
                    {getStatusBadge(ord.status)}
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-orange-400 font-bold">
                      {ord.orderNumber}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span>• Table #{ord.tableNumber}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-orange-400 font-mono">
                    ₹{ord.grandTotal.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    via {ord.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Items Summary preview */}
              <div className="text-xs text-slate-300 bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/60 flex items-center gap-2">
                <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="truncate">
                  {ord.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || 'Item details'}
                </span>
              </div>

              <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-[10px] text-slate-500">
                  {ord.isCloud ? 'Cloud Verified Order' : 'Offline Device Copy'}
                </span>
                <span className="text-orange-400 font-bold group-hover:translate-x-1 transition flex items-center gap-1">
                  <span>View Tax Invoice</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Itemized Thermal Tax Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121824] border border-slate-700 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-black text-white">Tax Invoice & Digital Bill</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Authentic Thermal Paper Roll Slip */}
            <div className="bg-[#fcfcfa] text-neutral-900 rounded-2xl shadow-xl p-5 sm:p-7 font-mono text-xs border border-neutral-300 relative overflow-hidden select-text">
              <div className="border-b-2 border-dashed border-neutral-400 pb-3 text-center space-y-1">
                <div className="font-black text-sm uppercase tracking-wider text-black">
                  {selectedReceipt.restaurantName}
                </div>
                <div className="text-[10px] text-neutral-600">
                  {selectedReceipt.restaurantAddress}
                </div>
                <div className="text-[9px] text-neutral-500">
                  GSTIN: 27AABCD1234E1Z5 • FSSAI: 11521014000123
                </div>
              </div>

              <div className="py-2.5 border-b border-dashed border-neutral-400 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">BILL / ORDER NO:</span>
                  <span className="font-bold text-black">{selectedReceipt.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">DATE & TIME:</span>
                  <span className="font-bold text-black">
                    {new Date(selectedReceipt.createdAt).toLocaleDateString()} {new Date(selectedReceipt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">TABLE:</span>
                  <span className="font-bold text-black">Table #{selectedReceipt.tableNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">BILLED TO:</span>
                  <span className="font-bold text-black">{selectedReceipt.customerName}</span>
                </div>
              </div>

              <div className="py-3 border-b border-dashed border-neutral-400 space-y-1.5">
                <div className="flex justify-between text-[10px] font-black text-neutral-600 uppercase border-b border-neutral-300 pb-1">
                  <span>ITEM</span>
                  <div className="flex space-x-4">
                    <span className="w-8 text-right">QTY</span>
                    <span className="w-16 text-right">AMOUNT</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1 max-h-52 overflow-y-auto">
                  {(selectedReceipt.items || []).map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-[11px] items-start">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-black truncate">{it.name}</div>
                        {it.variantName && (
                          <div className="text-[9px] text-neutral-500">[{it.variantName}]</div>
                        )}
                      </div>
                      <div className="flex space-x-4 shrink-0 font-bold">
                        <span className="w-8 text-right text-neutral-700">{it.quantity}</span>
                        <span className="w-16 text-right text-black">
                          ₹{(it.totalPrice || (it.unitPrice || 0) * it.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="py-2.5 border-b-2 border-dashed border-neutral-400 text-[11px] space-y-1">
                <div className="flex justify-between text-neutral-700">
                  <span>SUBTOTAL:</span>
                  <span className="font-bold">₹{selectedReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>CGST (2.5%):</span>
                  <span>₹{(selectedReceipt.taxTotal / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>SGST (2.5%):</span>
                  <span>₹{(selectedReceipt.taxTotal / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>SERVICE CHARGE:</span>
                  <span>₹{selectedReceipt.serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-black pt-1 border-t border-neutral-300">
                  <span>NET PAYABLE:</span>
                  <span>₹{selectedReceipt.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-3 text-center space-y-2">
                <div className="inline-block px-3 py-1 border-2 border-emerald-600 text-emerald-800 rounded font-black text-[10px] uppercase tracking-wider">
                  PAID IN FULL via {selectedReceipt.paymentMethod}
                </div>
                <div className="text-[10px] text-neutral-600">
                  *** THANK YOU FOR DINING WITH US! ***
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-3 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-orange-500/20 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Tax Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
