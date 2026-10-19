import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MenuCategory, TableItem } from '../types';
import { api } from '../services/api';
import {
  ClipboardList,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  UtensilsCrossed,
  Search,
  X,
  ChefHat,
  Filter,
  Sparkles,
  ShoppingBag,
  Clock,
  Flame,
  ArrowRight
} from 'lucide-react';

interface OrderManagementProps {
  categories: MenuCategory[];
  tables: TableItem[];
  onOrderCreated: () => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  categories,
  tables,
  onOrderCreated
}) => {
  const { restaurant } = useAuth();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dietFilter, setDietFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');

  // Cart & Order State
  const [selectedTable, setSelectedTable] = useState<string>(tables[0]?.tableNumber || '');

  useEffect(() => {
    if (!selectedTable && tables.length > 0) {
      setSelectedTable(tables[0].tableNumber);
    }
  }, [tables, selectedTable]);
  const [customerName, setCustomerName] = useState<string>('');
  const [cart, setCart] = useState<{ menuItemId: string; name: string; unitPrice: number; quantity: number; stationCode?: string; isVeg?: boolean }[]>([]);
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Flattened all menu items with category context
  const allItems = useMemo(() => {
    return categories.flatMap((cat) =>
      (cat.items || []).map((item) => ({
        ...item,
        categoryName: cat.name
      }))
    );
  }, [categories]);

  // Filtered dishes based on search query, category, and diet
  const filteredDishes = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesCategory = item.categoryName?.toLowerCase().includes(q);
        const matchesStation = item.stationCode?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCategory && !matchesStation) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL' && item.categoryName !== selectedCategory) {
        return false;
      }

      // 3. Diet Filter
      if (dietFilter === 'VEG' && !item.isVeg) return false;
      if (dietFilter === 'NON_VEG' && item.isVeg) return false;

      return true;
    });
  }, [allItems, searchQuery, selectedCategory, dietFilter]);

  // Add item to POS Cart
  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) => (i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
          stationCode: item.stationCode,
          isVeg: item.isVeg
        }
      ];
    });
  };

  // Update quantity in cart
  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as any[]
    );
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit Order directly to KDS & Kitchen
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !restaurant?.id) return;

    setIsSubmitting(true);
    const notesWithMeta = [
      orderType === 'TAKEAWAY' ? '[TAKEAWAY / PARCEL ORDER]' : null,
      customerName ? `Guest: ${customerName}` : null,
      specialNotes || null
    ]
      .filter(Boolean)
      .join(' • ');

    const res = await api.placeOrder({
      restaurantId: restaurant.id,
      tableNumber: orderType === 'TAKEAWAY' ? 'TAKEOUT' : selectedTable,
      items: cart,
      specialNotes: notesWithMeta || undefined
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(
        `Order placed successfully for ${
          orderType === 'TAKEAWAY' ? 'Takeaway Counter' : `Table #${selectedTable}`
        } with direct auto-KOT dispatch!`
      );
      setCart([]);
      setSpecialNotes('');
      setCustomerName('');
      onOrderCreated();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      alert(res.message || 'Failed to place order');
    }
  };

  // Helper map for quick cart item count lookups
  const cartItemCounts = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((i) => map.set(i.menuItemId, i.quantity));
    return map;
  }, [cart]);

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER BANNER */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-black text-white tracking-tight">
              Take POS Order & Manual Entry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
              DIRECT AUTO-KOT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant dish search, quick-add, dine-in/takeaway selection, and immediate kitchen dispatch.
          </p>
        </div>

        {/* Order Mode Toggle */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start md:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setOrderType('DINE_IN')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              orderType === 'DINE_IN'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Dine-In Table</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderType('TAKEAWAY')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              orderType === 'TAKEAWAY'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Takeaway / Parcel</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TWO-COLUMN POS WORKSPACE: DISH CATALOG & ORDER TICKET */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ============================================================= */}
        {/* LEFT 8 COLUMNS: SEARCH, CATEGORY PILLS & DISH CARDS */}
        {/* ============================================================= */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* Real-time Search Input & Quick Filters Bar */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-3">
            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search dish by name (e.g. Butter Chicken, Tikka, Naan, Biryani)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Veg / Non-Veg Diet Filter */}
              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs shrink-0 font-bold">
                <button
                  type="button"
                  onClick={() => setDietFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    dietFilter === 'ALL' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDietFilter('VEG')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                    dietFilter === 'VEG' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Veg</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDietFilter('NON_VEG')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                    dietFilter === 'NON_VEG' ? 'bg-rose-600 text-white shadow' : 'text-rose-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>Non-Veg</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  selectedCategory === 'ALL'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Menu ({allItems.length})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.name
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.name} ({cat.items?.length || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
              <span>Matching Dishes ({filteredDishes.length})</span>
              {searchQuery && (
                <span className="text-orange-400">
                  Filtered by "{searchQuery}"
                </span>
              )}
            </div>

            {filteredDishes.length === 0 ? (
              <div className="p-12 text-center bg-[#111827] border border-slate-800 rounded-2xl space-y-2">
                <UtensilsCrossed className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs font-bold text-slate-300">No matching dishes found</div>
                <p className="text-[11px] text-slate-500">
                  Try searching for another dish or clear filters to view the full menu.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setDietFilter('ALL');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold rounded-xl text-xs transition border border-slate-700 mt-2"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[calc(100vh-19rem)] overflow-y-auto pr-1">
                {filteredDishes.map((item) => {
                  const inCartQty = cartItemCounts.get(item.id) || 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 shadow-sm ${
                        inCartQty > 0
                          ? 'bg-orange-500/10 border-orange-500/60 shadow-orange-500/10'
                          : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                            />
                            <h3 className="text-xs font-bold text-white leading-tight">
                              {item.name}
                            </h3>
                          </div>

                          {inCartQty > 0 && (
                            <span className="w-5 h-5 rounded-lg bg-orange-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow">
                              {inCartQty}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <div>
                          <div className="text-xs font-black text-white font-mono">
                            ₹{item.price.toFixed(2)}
                          </div>
                          <div className="text-[9px] text-slate-500 font-semibold uppercase">
                            {item.stationCode || 'MAIN'} Station
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {inCartQty > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, -1);
                              }}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item);
                            }}
                            className="p-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white transition shadow-sm"
                            title="Add to Ticket"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================= */}
        {/* RIGHT 4 COLUMNS: POS CART & DISPATCH STATION */}
        {/* ============================================================= */}
        <div className="lg:col-span-4 bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-black text-white">Order Ticket</h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {totalCartCount} {totalCartCount === 1 ? 'Dish' : 'Dishes'}
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table / Guest Selector */}
          <div className="space-y-2 text-xs">
            {orderType === 'DINE_IN' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
                  Select Seated Table
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
                >
                  {tables.length === 0 ? (
                    <option value="">No tables configured</option>
                  ) : (
                    tables.map((t) => (
                      <option key={t.id} value={t.tableNumber}>
                        Table #{t.tableNumber} {t.isOccupied ? '• (Occupied)' : '• (Vacant)'}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
                  Customer Name / Token #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh K. (+91 98200...)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            )}
          </div>

          {/* Cart Itemized List */}
          <div className="space-y-2">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Selected Dishes
            </div>

            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-2.5 space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-800/80">
              {cart.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                  <UtensilsCrossed className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                  <div className="font-bold text-slate-400">Ticket is empty</div>
                  <div className="text-[10px] text-slate-600">Search and tap any dish to add to this order.</div>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="pt-2 first:pt-0 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ₹{item.unitPrice.toFixed(2)} × {item.quantity} = ₹{(item.unitPrice * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="p-1 hover:text-white text-slate-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1 font-mono font-bold text-white text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="p-1 hover:text-white text-slate-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Kitchen Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
              Kitchen Instructions / Table Notes
            </label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. Less spicy, extra green chutney, serve starters first..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Total & Instant Dispatch Button */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span>Item Subtotal:</span>
              <span className="font-mono text-white text-sm font-black">
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-[0.98] text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-orange-500/20 disabled:opacity-40 flex items-center justify-center space-x-2"
            >
              <ChefHat className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Dispatching Order & Printing KOT...'
                  : `Dispatch Order (₹${cartTotal.toFixed(2)})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
