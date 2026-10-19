import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { Search, X, Building2, ShoppingBag, User, CreditCard, Table, LifeBuoy, ArrowRight, Loader2 } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: any, filterParam?: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await adminApi.globalSearch(query.trim());
      if (res.success && res.data) {
        setResults(res.data);
      }
    } catch (err) {
      console.error('[GlobalSearch] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header & Search Input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60">
          <form onSubmit={handleSearch} className="flex-1 flex items-center space-x-3">
            <Search className="w-5 h-5 text-cyan-500 dark:text-cyan-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Universal Search across 100+ Restaurants, Orders, Customers, Bills, GSTIN, Tables, KOTs..."
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 font-medium"
              autoFocus
            />
            {isLoading && <Loader2 className="w-5 h-5 text-cyan-500 dark:text-cyan-400 animate-spin shrink-0" />}
          </form>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {!results && !isLoading && (
            <div className="text-center py-12 space-y-2 text-slate-500">
              <Search className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
              <div className="text-sm font-bold text-slate-600 dark:text-slate-400">Search the entire DINEDECK multi-tenant ecosystem</div>
              <div className="text-xs">Try searching by Restaurant name ("Punjab"), Order ID ("ORD-"), Phone ("+91"), GSTIN ("27AA"), or Customer Name</div>
            </div>
          )}

          {results && (
            <>
              {/* Restaurants Results */}
              {results.restaurants && results.restaurants.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-cyan-600 dark:text-cyan-400 flex items-center space-x-2">
                    <Building2 className="w-4 h-4" />
                    <span>RESTAURANTS & TENANTS ({results.restaurants.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.restaurants.map((r: any) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          onNavigateToTab('RESTAURANTS', r.id);
                          onClose();
                        }}
                        className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 rounded-2xl cursor-pointer transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">{r.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{r.city} • {r.cuisineType} • {r.status}</div>
                          {r.gstin && <div className="text-[9px] text-slate-500 font-mono">GST: {r.gstin}</div>}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders Results */}
              {results.orders && results.orders.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-amber-500 dark:text-amber-400 flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>ORDERS & COMMERCE ({results.orders.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.orders.map((o: any) => (
                      <div
                        key={o.id}
                        onClick={() => {
                          onNavigateToTab('ORDERS', o.id);
                          onClose();
                        }}
                        className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 rounded-2xl cursor-pointer transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition">{o.orderNumber} (Table #{o.tableNumber})</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{o.restaurant?.name || 'Restaurant'} • ₹{o.totalAmount} • {o.status}</div>
                          {o.user && <div className="text-[9px] text-slate-500">{o.user.name} ({o.user.phone || 'Guest'})</div>}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers Results */}
              {results.customers && results.customers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>USERS & CUSTOMERS ({results.customers.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.customers.map((u: any) => (
                      <div
                        key={u.id}
                        className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{u.email} • {u.phone || 'No phone'}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase">{u.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments Results */}
              {results.payments && results.payments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-purple-600 dark:text-purple-400 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4" />
                    <span>PAYMENTS & TRANSACTIONS ({results.payments.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.payments.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigateToTab('FINANCE');
                          onClose();
                        }}
                        className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-purple-500/60 rounded-2xl cursor-pointer transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">{p.transactionRef}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{p.bill?.restaurant?.name || 'Restaurant'} • ₹{p.amount} • {p.status}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase">Method: {p.method}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
