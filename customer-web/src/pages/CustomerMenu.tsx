import React, { useState, useMemo } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { MenuItem, MenuItemVariant, MenuItemAddon, CartCustomization } from '../types';
import { CustomerTracking } from './CustomerTracking';
import { DineDeckLoader } from '../components/DineDeckLoader';
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  Clock,
  ArrowRight,
  X,
  Leaf,
  Drumstick,
  RefreshCw,
  ChefHat,
  Star,
  FileText,
  AlertCircle,
  Check,
  QrCode,
  UtensilsCrossed,
  Navigation
} from 'lucide-react';

export const CustomerMenu: React.FC = () => {
  const {
    session,
    categories,
    isLoadingMenu,
    loadMenu,
    cart,
    currentOrder,
    addToCart,
    updateCartQty,
    removeCartItem,
    clearCart,
    placeOrder,
    setActiveView,
    setShowQrScannerModal,
    isTableSessionValid,
    user
  } = useCustomer();

  const [menuSubTab, setMenuSubTab] = useState<'DISHES' | 'ORDER_STATUS'>('DISHES');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietFilter, setDietFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [isOrdering, setIsOrdering] = useState<boolean>(false);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string>('');
  const [tableNotes, setTableNotes] = useState<string>('');

  // Dish Customizer State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<'REGULAR' | 'LARGE' | 'HALF' | 'FULL'>('REGULAR');
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | undefined>(undefined);
  const [selectedSpice, setSelectedSpice] = useState<'MILD' | 'MEDIUM' | 'SPICY' | 'EXTRA_HOT'>('MEDIUM');
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);
  const [itemSpecialNotes, setItemSpecialNotes] = useState<string>('');

  // Standard Indian restaurant accompaniments
  const defaultAddonsList: MenuItemAddon[] = useMemo(() => [
    { id: 'addon_butter', name: 'Extra Butter', price: 20 },
    { id: 'addon_gravy', name: 'Extra Rich Gravy', price: 40 },
    { id: 'addon_cheese', name: 'Grated Amul Cheese', price: 35 },
    { id: 'addon_pav_poori', name: 'Extra 2 Pav / Poori', price: 30 }
  ], []);

  const allItems: MenuItem[] = useMemo(() => {
    return categories.flatMap((c) =>
      (c.items || []).map((i) => ({ ...i, category: { id: c.id, name: c.name } }))
    );
  }, [categories]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat =
        selectedCat === 'ALL'
          ? true
          : selectedCat === 'BESTSELLERS'
          ? item.isBestseller
          : item.category?.id === selectedCat;

      let matchesDiet = true;
      if (dietFilter === 'VEG') matchesDiet = item.isVeg;
      else if (dietFilter === 'NON_VEG') matchesDiet = !item.isVeg;

      return matchesSearch && matchesCat && matchesDiet && item.isAvailable !== false;
    });
  }, [allItems, searchQuery, selectedCat, dietFilter]);

  // Cart financial calculations (Strictly direct pricing without fake coupons)
  const cartSubtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const cgstAmount = cartSubtotal * 0.025;
  const sgstAmount = cartSubtotal * 0.025;
  const serviceCharge = cartSubtotal * 0.05;
  const cartGrandTotal = Math.round(cartSubtotal + cgstAmount + sgstAmount + serviceCharge);
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Customizer Trigger
  const handleOpenCustomizer = (item: MenuItem) => {
    setCustomizingItem(item);
    setSelectedPortion('REGULAR');
    setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : undefined);
    setSelectedSpice('MEDIUM');
    setSelectedAddons([]);
    setItemSpecialNotes('');
  };

  // Add Item to Cart
  const handleConfirmAddToCart = () => {
    if (!customizingItem) return;

    let finalPrice = customizingItem.price;

    if (selectedVariant) {
      finalPrice = selectedVariant.price;
    } else if (selectedPortion === 'LARGE' || selectedPortion === 'FULL') {
      finalPrice = Math.round(customizingItem.price * 1.5);
    } else if (selectedPortion === 'HALF') {
      finalPrice = Math.round(customizingItem.price * 0.65);
    }

    const customization: CartCustomization = {
      portionSize: selectedPortion,
      spiceLevel: selectedSpice,
      selectedVariant,
      selectedAddons,
      specialNotes: itemSpecialNotes.trim() || undefined
    };

    addToCart(
      {
        ...customizingItem,
        price: finalPrice
      },
      customization
    );

    setCustomizingItem(null);
  };

  // Toggle Add-on
  const handleToggleAddon = (addon: MenuItemAddon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  // Handle Send Order to Kitchen KDS
  const handleSendOrderToKitchen = async () => {
    if (cart.length === 0 || isOrdering) return;
    setIsOrdering(true);
    setOrderError('');

    try {
      const res = await placeOrder(tableNotes.trim() || undefined);
      if (!res.success) {
        setOrderError(res.message || 'Could not send order. Please check connection.');
      } else {
        setShowCartDrawer(false);
      }
    } catch (e: any) {
      setOrderError(e.message || 'Network error while placing order');
    } finally {
      setIsOrdering(false);
    }
  };

  React.useEffect(() => {
    if (session.restaurantId && categories.length === 0 && !isLoadingMenu) {
      loadMenu(session.restaurantId);
    }
  }, [categories.length, isLoadingMenu, loadMenu, session.restaurantId]);

  if (!session.restaurantId && categories.length === 0) {
    return (
      <div className="space-y-6 pb-28 max-w-xl mx-auto text-center p-10 bg-[#151D30] border border-slate-800 rounded-3xl shadow-xl mt-6">
        <div className="w-16 h-16 rounded-3xl bg-orange-500/15 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/30">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-white">Select a Partner Restaurant</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Choose a partner restaurant or scan your table QR code to browse its live menu and order.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <button
            type="button"
            onClick={() => setActiveView('HOME')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-black rounded-2xl text-xs transition shadow-lg shadow-orange-500/20 inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Browse Restaurants</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowQrScannerModal(true)}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs transition border border-slate-700 inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-orange-400" />
            <span>Scan Table QR</span>
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0 && isLoadingMenu) {
    return (
      <div className="py-20 flex justify-center">
        <DineDeckLoader
          size="lg"
          label="Loading Live Kitchen Menu..."
          sublabel="Fetching freshest dishes, recipes, and chef's specials"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-32 max-w-6xl mx-auto">
      {/* 1. TOP DINING TABLE HEADER & REFRESH */}
      <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black text-white">{session.restaurantName}</span>
              {session.tableNumber && isTableSessionValid() && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                  Table #{session.tableNumber}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Live Kitchen Ordering & Custom Recipes</p>
          </div>
        </div>

        <button
          onClick={() => loadMenu()}
          disabled={isLoadingMenu}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700 disabled:opacity-50 cursor-pointer"
          title="Refresh Menu"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingMenu ? 'animate-spin text-orange-400' : ''}`} />
        </button>
      </div>

      {/* Table Verification / Scan QR In-Dining Status Banner */}
      {session.tableNumber && isTableSessionValid() ? (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-extrabold text-emerald-300">
              Seated at Table #{session.tableNumber} (Verified by Table QR)
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">In-Dining Active</span>
        </div>
      ) : (
        <div className="bg-orange-500/10 border border-orange-500/40 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-white text-xs sm:text-sm">
                Browsing Digital Menu • In-Dining Only
              </div>
              <div className="text-[11px] text-slate-400">
                You can explore dishes and customize orders freely. To send your order to the kitchen, scan your table QR code when seated.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowQrScannerModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan Table QR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const query = encodeURIComponent(`${session.restaurantName}`);
                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Get directions to restaurant"
            >
              <Navigation className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Directions</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. SUB-TAB SWITCHER: DISHES & MENU vs ACTIVE ORDER STATUS */}
      <div className="p-1 bg-[#151D30] border border-slate-800 rounded-2xl flex items-center shadow-lg">
        <button
          type="button"
          onClick={() => setMenuSubTab('DISHES')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer ${
            menuSubTab === 'DISHES'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Dishes & Menu</span>
        </button>

        <button
          type="button"
          onClick={() => setMenuSubTab('ORDER_STATUS')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer ${
            menuSubTab === 'ORDER_STATUS'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Active Order Status</span>
          {currentOrder && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
          )}
        </button>
      </div>

      {menuSubTab === 'ORDER_STATUS' ? (
        <CustomerTracking />
      ) : (
        <>
          {/* Active Order Banner if cooking */}
          {currentOrder && (
            <div
              onClick={() => setMenuSubTab('ORDER_STATUS')}
              className="p-3.5 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-500/50 transition group shadow-md"
            >
              <div className="flex items-center space-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <div>
                  <span className="text-xs font-black text-white">
                    Active Order {currentOrder.orderNumber || '#ORD-LIVE'} is in Kitchen: {currentOrder.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Dishes being prepared live • Tap to track</p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-400 group-hover:underline flex items-center gap-1 shrink-0">
                Track Live →
              </span>
            </div>
          )}

          {/* 3. SEARCH & DIETARY FILTER CONTROLS */}
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes (e.g. Biryani, Paneer, Dosa, Naan)..."
            className="w-full bg-[#151D30] border border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 shadow-md transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dietary Filters & Bestseller Toggle */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 bg-[#151D30] p-1 rounded-2xl border border-slate-800 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setDietFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                dietFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDietFilter('VEG')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                dietFilter === 'VEG'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Leaf className="w-3 h-3" />
              <span>Veg Only</span>
            </button>
            <button
              type="button"
              onClick={() => setDietFilter('NON_VEG')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                dietFilter === 'NON_VEG'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <Drumstick className="w-3 h-3" />
              <span>Non-Veg</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedCat(selectedCat === 'BESTSELLERS' ? 'ALL' : 'BESTSELLERS')}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md ${
              selectedCat === 'BESTSELLERS'
                ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'
                : 'bg-[#151D30] border-slate-800 text-amber-400 hover:border-amber-500/50'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Today's Specials</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCat('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
              selectedCat === 'ALL'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-[#151D30] border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Dishes ({allItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
                selectedCat === cat.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-[#151D30] border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.name} ({cat.items?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* 3. DISHES GRID */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-[#151D30] border border-slate-800 rounded-3xl space-y-3">
          <ChefHat className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-white">No dishes matched your selection</h3>
          <p className="text-xs text-slate-400">Try clearing your search query or dietary filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setDietFilter('ALL');
              setSelectedCat('ALL');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const inCartItems = cart.filter((c) => c.menuItemId === item.id);
            const totalQtyInCart = inCartItems.reduce((s, i) => s + i.quantity, 0);

            return (
              <div
                key={item.id}
                className="bg-[#151D30] border border-slate-800 hover:border-orange-500/40 rounded-3xl p-4 shadow-xl transition space-y-3 flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="space-y-2">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`w-4 h-4 rounded-md flex items-center justify-center border text-[8px] font-black ${
                          item.isVeg
                            ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                            : 'border-rose-500 text-rose-400 bg-rose-500/10'
                        }`}
                        title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                      >
                        ●
                      </span>
                      {item.isBestseller && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-400" /> Bestseller
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{item.preparationTime || 15}m</span>
                    </span>
                  </div>

                  {/* Food Item Image Visual */}
                  {item.imageUrl && (
                    <div className="relative h-28 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 mb-2 group-hover:border-orange-500/40 transition">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[8px] font-mono font-bold text-slate-300">
                        WebP
                      </div>
                    </div>
                  )}

                  {/* Title & Description */}
                  <div>
                    <h4 className="font-extrabold text-sm text-white group-hover:text-orange-400 transition leading-snug">
                      {item.name}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing & Add / Customizer Trigger */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-black text-white font-mono">₹{item.price.toFixed(2)}</div>
                    <span className="text-[9px] text-slate-500 font-semibold">Portions & Notes customizable</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {totalQtyInCart > 0 ? (
                      <div className="flex items-center bg-slate-900 border border-orange-500/40 rounded-2xl p-1 shadow-md">
                        <button
                          type="button"
                          onClick={() => {
                            if (inCartItems.length > 0) {
                              updateCartQty(inCartItems[0].cartItemId, -1);
                            }
                          }}
                          className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 font-black text-orange-400 text-xs font-mono">
                          {totalQtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenCustomizer(item)}
                          className="w-7 h-7 rounded-xl bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm"
                          title="Add with customizations"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenCustomizer(item)}
                        className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-2xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-orange-500/20 cursor-pointer transform active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
    )}

      {/* 4. DISH CUSTOMIZATION MODAL (Portions, Spice, Add-ons, Cooking Notes) */}
      {customizingItem && (
        <div
          onClick={() => setCustomizingItem(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#151D30] border border-slate-700 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border text-[7px] font-black ${
                      customizingItem.isVeg
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                        : 'border-rose-500 text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    ●
                  </span>
                  <h3 className="text-base font-black text-white">{customizingItem.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Customize portion size, spice level, and cooking notes</p>
              </div>

              <button
                onClick={() => setCustomizingItem(null)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Food Item Image Banner */}
            {customizingItem.imageUrl && (
              <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-inner">
                <img
                  src={customizingItem.imageUrl}
                  alt={customizingItem.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
                  WebP • &le;200KB
                </div>
              </div>
            )}

            {/* A. Portion Size Selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>1. Portion Size</span>
                <span className="text-[10px] text-orange-400 lowercase">Required</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'REGULAR' as const, label: 'Regular Portion', price: customizingItem.price },
                  { key: 'LARGE' as const, label: 'Large / Family (+50%)', price: Math.round(customizingItem.price * 1.5) }
                ].map((portion) => (
                  <button
                    key={portion.key}
                    type="button"
                    onClick={() => setSelectedPortion(portion.key)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      selectedPortion === portion.key
                        ? 'bg-orange-500/15 border-orange-500 text-white shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{portion.label}</span>
                      {selectedPortion === portion.key && <Check className="w-3.5 h-3.5 text-orange-400" />}
                    </div>
                    <div className="text-sm font-black text-white font-mono mt-1">₹{portion.price.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* B. Spice Level Selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                2. Spice Preference
              </label>

              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {[
                  { key: 'MILD' as const, label: '🟢 Mild (Kids Friendly)' },
                  { key: 'MEDIUM' as const, label: '🟡 Medium Spicy' },
                  { key: 'SPICY' as const, label: '🔴 Authentic Spicy' }
                ].map((spice) => (
                  <button
                    key={spice.key}
                    type="button"
                    onClick={() => setSelectedSpice(spice.key)}
                    className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                      selectedSpice === spice.key
                        ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {spice.label}
                  </button>
                ))}
              </div>
            </div>

            {/* C. Optional Add-ons */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>3. Add-ons & Accompaniments</span>
                <span className="text-[10px] text-slate-500">Optional</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {defaultAddonsList.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => handleToggleAddon(addon)}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-emerald-500/15 border-emerald-500 text-white'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{addon.name}</div>
                        <div className="text-[10px] text-slate-400">+₹{addon.price}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          isChecked ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-700'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* D. Special Cooking Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-orange-400" />
                <span>4. Cooking Notes for Chef</span>
              </label>
              <textarea
                value={itemSpecialNotes}
                onChange={(e) => setItemSpecialNotes(e.target.value)}
                placeholder="e.g. Steam for poori, 38 idli, crisp dosa, less oil, no onion/garlic..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition resize-none"
              />
            </div>

            {/* Modal Footer / Add Button */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Item Total</span>
                <div className="text-lg font-black text-white font-mono">
                  ₹{(() => {
                    let p = selectedVariant
                      ? selectedVariant.price
                      : selectedPortion === 'LARGE' || selectedPortion === 'FULL'
                      ? Math.round(customizingItem.price * 1.5)
                      : customizingItem.price;
                    const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
                    return (p + addonsTotal).toFixed(2);
                  })()}
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmAddToCart}
                className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-2xl text-xs transition shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Add to Table Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FLOATING CART CHECKOUT BAR */}
      {cartItemCount > 0 && !showCartDrawer && (
        <div className="fixed bottom-5 md:bottom-6 left-0 right-0 z-40 px-4 max-w-lg mx-auto">
          <div
            onClick={() => setShowCartDrawer(true)}
            className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-3xl p-4 shadow-2xl shadow-orange-500/40 flex items-center justify-between text-white cursor-pointer transform hover:scale-102 active:scale-98 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-black">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider">
                  {cartItemCount} {cartItemCount === 1 ? 'Dish' : 'Dishes'} in Order
                </div>
                <div className="text-[11px] text-orange-100">
                  {session.tableNumber && isTableSessionValid()
                    ? `Table #${session.tableNumber} • Tap to review & send`
                    : 'Tap to review order & send to kitchen'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-right">
                <span className="text-xs font-black font-mono">₹{cartGrandTotal.toFixed(2)}</span>
                <span className="text-[9px] block text-orange-100">Incl. Taxes</span>
              </div>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* 6. EXPANDABLE CART DRAWER */}
      {showCartDrawer && (
        <div
          onClick={() => setShowCartDrawer(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#151D30] border border-slate-700 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col justify-between cursor-default"
          >
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-orange-400" />
                    <span>
                      {session.tableNumber && isTableSessionValid()
                        ? `Table #${session.tableNumber} Order Cart`
                        : 'Your Dining Cart'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{cartItemCount} items ready for the kitchen</p>
                </div>

                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Table QR Required Notice if not yet seated / table session expired */}
              {(!session.tableNumber || !isTableSessionValid()) && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <QrCode className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Table QR scan required to send order</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    DineDeck routes orders directly to the restaurant kitchen. To send your order, please scan the QR code at your dining table.
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCartDrawer(false);
                        setShowQrScannerModal(true);
                      }}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan Table QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const query = encodeURIComponent(`${session.restaurantName}`);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium rounded-xl text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-orange-400" />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {cart.map((c) => (
                  <div
                    key={c.cartItemId}
                    className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`w-3 h-3 rounded-sm flex items-center justify-center border text-[6px] font-black ${
                            c.isVeg
                              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                              : 'border-rose-500 text-rose-400 bg-rose-500/10'
                          }`}
                        >
                          ●
                        </span>
                        <span className="font-extrabold text-xs text-white truncate">{c.name}</span>
                      </div>

                      {/* Customization Details */}
                      <div className="text-[10px] text-slate-400 space-y-0.5 pl-4">
                        {c.customization?.portionSize && c.customization.portionSize !== 'REGULAR' && (
                          <div>• Portion: <span className="text-orange-300 font-bold">{c.customization.portionSize}</span></div>
                        )}
                        {c.customization?.spiceLevel && (
                          <div>• Spice: <span className="text-amber-300 font-bold">{c.customization.spiceLevel}</span></div>
                        )}
                        {c.customization?.selectedAddons && c.customization.selectedAddons.length > 0 && (
                          <div>
                            • Addons:{' '}
                            <span className="text-emerald-300 font-bold">
                              {c.customization.selectedAddons.map((a) => a.name).join(', ')}
                            </span>
                          </div>
                        )}
                        {c.customization?.specialNotes && (
                          <div className="text-orange-400 font-bold italic">
                            "{c.customization.specialNotes}"
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-black text-white font-mono pl-4">
                        ₹{(c.unitPrice * c.quantity).toFixed(2)}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center bg-slate-800 rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartQty(c.cartItemId, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-black text-orange-400 text-xs font-mono">
                        {c.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(c.cartItemId, 1)}
                        className="w-6 h-6 rounded-lg bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center font-bold text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Table Instructions */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-orange-400" />
                  <span>General Table Request (Optional)</span>
                </label>
                <input
                  type="text"
                  value={tableNotes}
                  onChange={(e) => setTableNotes(e.target.value)}
                  placeholder="e.g. Serve starters first, bring extra plates & spoons..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Bill Breakdown (Authentic Dining Calculation) */}
              <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Food Subtotal</span>
                  <span className="text-white font-mono font-bold">₹{cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>CGST (2.5%)</span>
                  <span className="text-purple-300 font-mono font-bold">₹{cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SGST (2.5%)</span>
                  <span className="text-purple-300 font-mono font-bold">₹{sgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Service Charge (5%)</span>
                  <span className="text-slate-300 font-mono font-bold">₹{serviceCharge.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-800 pt-1.5 flex justify-between text-sm font-black">
                  <span className="text-white">Total Amount</span>
                  <span className="text-emerald-400 font-mono text-base">₹{cartGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              {orderError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}
            </div>

            {/* Send Order Button */}
            <div className="pt-4 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs font-bold transition cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleSendOrderToKitchen}
                disabled={isOrdering}
                className="flex-1 py-3.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black rounded-2xl text-xs transition shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isOrdering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <span>Send Order to Kitchen 🚀</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

