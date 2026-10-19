import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { MenuCategory, MenuItem } from '../types';
import { api } from '../services/api';
import { compressAndOptimizeFoodImage, validateImageFile } from '../utils/imageOptimizer';
import {
  Utensils,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Edit2,
  DollarSign,
  Flame,
  X,
  Plus,
  Filter,
  Check,
  Tag,
  ChefHat,
  Layers,
  ShoppingBag,
  Sliders,
  AlertCircle,
  AlertTriangle,
  Zap,
  Info,
  UtensilsCrossed,
  AlertOctagon,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

interface MenuManagementProps {
  categories: MenuCategory[];
  onRefresh: () => void;
}

export const MenuManagement: React.FC<MenuManagementProps> = ({ categories, onRefresh }) => {
  const { hasPermission, restaurant } = useAuth();
  const { getDishCapacity, nearOutOfStockDishes } = useInventory();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dietFilter, setDietFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'TODAYS_SPECIAL' | 'OUT_OF_STOCK' | 'NEAR_OUT_OF_STOCK'>('ALL');

  // Edit / Add Modal State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDiscountedPrice, setEditDiscountedPrice] = useState<string>('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editIsVeg, setEditIsVeg] = useState<boolean>(true);
  const [editStationCode, setEditStationCode] = useState<string>('CURRY');
  const [editPrepTime, setEditPrepTime] = useState<number>(15);
  const [editIsAvailable, setEditIsAvailable] = useState<boolean>(true);
  const [editIsBestseller, setEditIsBestseller] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Image Upload State (Max 200 KB WebP)
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{ sizeKb: number; width: number; height: number; format: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Toggling quick stock state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Flattened all items with category context
  const allItems: MenuItem[] = useMemo(() => {
    return categories.flatMap((c) =>
      c.items.map((i) => ({
        ...i,
        category: { id: c.id, name: c.name }
      }))
    );
  }, [categories]);

  // Counts for Specials and Out of Stock
  const outOfStockCount = useMemo(() => allItems.filter((i) => !i.isAvailable || getDishCapacity(i.name).status === 'OUT_OF_STOCK').length, [allItems, getDishCapacity]);
  const todaySpecialCount = useMemo(() => allItems.filter((i) => i.isBestseller).length, [allItems]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesCategory = item.category?.name.toLowerCase().includes(q);
        const matchesStation = item.stationCode?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCategory && !matchesStation) {
          return false;
        }
      }

      // 2. Category
      if (
        selectedCategory !== 'ALL' &&
        item.category?.id !== selectedCategory &&
        item.category?.name !== selectedCategory
      ) {
        return false;
      }

      // 3. Dietary Filter
      if (dietFilter === 'VEG' && !item.isVeg) return false;
      if (dietFilter === 'NON_VEG' && item.isVeg) return false;

      // 4. Stock & Specials Filter
      const cap = getDishCapacity(item.name);
      if (stockFilter === 'TODAYS_SPECIAL' && !item.isBestseller) return false;
      if (stockFilter === 'OUT_OF_STOCK' && (item.isAvailable && cap.status !== 'OUT_OF_STOCK')) return false;
      if (stockFilter === 'NEAR_OUT_OF_STOCK' && cap.status !== 'NEAR_OUT_OF_STOCK' && cap.status !== 'CRITICAL') return false;

      return true;
    });
  }, [allItems, searchQuery, selectedCategory, dietFilter, stockFilter, getDishCapacity]);

  // Fast Out of Stock Toggle
  const handleToggleAvailability = async (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    setTogglingId(item.id);
    try {
      await api.toggleItemAvailability(item.id, !item.isAvailable);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Fast Today's Special Toggle
  const handleToggleTodaySpecial = async (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    setTogglingId(item.id);
    try {
      await api.toggleItemBestseller(item.id, !item.isBestseller);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle today special:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditDescription(item.description || '');
    setEditPrice(item.price);
    setEditDiscountedPrice(item.discountedPrice !== null && item.discountedPrice !== undefined ? String(item.discountedPrice) : '');
    setEditCategoryId((item as any).categoryId || item.category?.id || categories[0]?.id || '');
    setEditIsVeg(item.isVeg !== undefined ? item.isVeg : true);
    setEditStationCode(item.stationCode || 'CURRY');
    setEditPrepTime(item.preparationTime || 15);
    setEditIsAvailable(item.isAvailable !== undefined ? item.isAvailable : true);
    setEditIsBestseller(Boolean(item.isBestseller));

    // Image state
    setEditImageUrl(item.imageUrl || '');
    setImagePreviewUrl(item.imageUrl || '');
    setImageFile(null);
    setImageMetadata(null);
    setUploadError(null);
  };

  // Open Add New Food Item Modal
  const handleAddNewItem = () => {
    setEditingItem({
      id: '',
      name: '',
      description: '',
      price: 0,
      isVeg: true,
      isAvailable: true,
      preparationTime: 15,
      stationCode: 'CURRY'
    } as MenuItem);

    setEditName('');
    setEditDescription('');
    setEditPrice(0);
    setEditDiscountedPrice('');
    setEditCategoryId(selectedCategory !== 'ALL' ? selectedCategory : (categories[0]?.id || ''));
    setEditIsVeg(true);
    setEditStationCode('CURRY');
    setEditPrepTime(15);
    setEditIsAvailable(true);
    setEditIsBestseller(false);

    // Image state
    setEditImageUrl('');
    setImagePreviewUrl('');
    setImageFile(null);
    setImageMetadata(null);
    setUploadError(null);
  };

  // Process and upload selected food image (enforces max 200 KB WebP)
  const handleFileSelection = async (file: File) => {
    setUploadError(null);
    setIsCompressing(true);

    try {
      // 1. Client-side validation & auto-compression to WebP <= 200 KB
      const optimized = await compressAndOptimizeFoodImage(file);
      setImageFile(optimized.file);
      setImagePreviewUrl(optimized.dataUrl);
      setImageMetadata({
        sizeKb: optimized.sizeKb,
        width: optimized.width,
        height: optimized.height,
        format: optimized.format
      });

      setIsCompressing(false);
      setIsUploadingImage(true);

      // 2. Upload to server object storage / image endpoint
      const uploadRes = await api.uploadFoodItemImageMultipart(
        optimized.file,
        restaurant?.id,
        editingItem?.id || undefined
      );

      setEditImageUrl(uploadRes.imageUrl);
      setUploadError(null);
    } catch (err: any) {
      console.error('Image optimization/upload error:', err);
      setUploadError(err.message || 'Failed to process and upload image. Please try again.');
    } finally {
      setIsCompressing(false);
      setIsUploadingImage(false);
    }
  };

  // Retry upload if previous upload attempt failed
  const handleRetryUpload = async () => {
    if (!imageFile) return;
    setUploadError(null);
    setIsUploadingImage(true);

    try {
      const uploadRes = await api.uploadFoodItemImageMultipart(
        imageFile,
        restaurant?.id,
        editingItem?.id || undefined
      );

      setEditImageUrl(uploadRes.imageUrl);
      setUploadError(null);
    } catch (err: any) {
      setUploadError(err.message || 'Retry failed. Check network connection.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove/Clear image
  const handleRemoveImage = () => {
    setEditImageUrl('');
    setImagePreviewUrl('');
    setImageFile(null);
    setImageMetadata(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save Item Changes (Handles both Update and Create)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editName.trim()) {
      alert('Please enter a food item name.');
      return;
    }
    if (editPrice < 0) {
      alert('Price must be greater than or equal to 0.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        price: Number(editPrice),
        discountedPrice: editDiscountedPrice ? Number(editDiscountedPrice) : null,
        categoryId: editCategoryId || undefined,
        imageUrl: editImageUrl || '',
        isVeg: editIsVeg,
        stationCode: editStationCode,
        preparationTime: Number(editPrepTime),
        isAvailable: editIsAvailable,
        isBestseller: editIsBestseller
      };

      if (editingItem.id) {
        // Update existing item
        await api.updateMenuItem(editingItem.id, payload);
        setSaveSuccess(`Updated "${editName}" successfully!`);
      } else {
        // Create new item
        await api.createMenuItem({
          ...payload,
          categoryId: editCategoryId || categories[0]?.id,
          restaurantId: restaurant?.id
        });
        setSaveSuccess(`Added "${editName}" to menu successfully!`);
      }

      setTimeout(() => setSaveSuccess(null), 3000);
      setEditingItem(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save food item');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & TOP CONTROLS                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-xl font-black text-white tracking-tight">Menu</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider">
                  {allItems.length} Dishes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Compact food catalog grid. Click any dish card to edit prices, photography, ingredients, category, and station.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAddNewItem}
              className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-xl text-xs transition shadow-md shadow-orange-500/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Food Item</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Refresh Menu Catalog"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search food by name, ingredients, category, or station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dietary Filter */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold shrink-0">
            {(['ALL', 'VEG', 'NON_VEG'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDietFilter(d)}
                className={`px-3 py-1 rounded-lg transition flex items-center space-x-1.5 ${
                  dietFilter === d
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d === 'VEG' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                {d === 'NON_VEG' && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                <span>{d === 'ALL' ? 'All Diets' : d === 'VEG' ? 'Veg' : 'Non-Veg'}</span>
              </button>
            ))}
          </div>

          {/* Stock & Specials Filter */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                stockFilter === 'ALL' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Dishes ({allItems.length})
            </button>

            <button
              type="button"
              onClick={() => setStockFilter('TODAYS_SPECIAL')}
              className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
                stockFilter === 'TODAYS_SPECIAL' ? 'bg-amber-500 text-slate-950 shadow font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Today's Special ({todaySpecialCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStockFilter('OUT_OF_STOCK')}
              className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
                stockFilter === 'OUT_OF_STOCK' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              <span>Out of Stock ({outOfStockCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStockFilter('NEAR_OUT_OF_STOCK')}
              className={`px-3 py-1 rounded-lg transition ${
                stockFilter === 'NEAR_OUT_OF_STOCK' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚠️ Near Out of Stock ({nearOutOfStockDishes.length})
            </button>
          </div>
        </div>

        {/* Category Horizontal Scrolling Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-3 pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Categories ({allItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-orange-500 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name} ({cat.items.length})
            </button>
          ))}
        </div>
      </div>

      {/* Near Out of Stock Intelligent Warning Banner */}
      {nearOutOfStockDishes.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Kitchen Inventory Alert: {nearOutOfStockDishes.length} Dishes Near Out of Stock
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Recommendation Only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Items remain available for single orders, but remaining raw ingredients ({nearOutOfStockDishes.map(d => `${d.dishName}: ~${d.portionsLeft} left`).join(', ')}) cannot fulfill large multi-plate orders without restock.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStockFilter('NEAR_OUT_OF_STOCK')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-xs whitespace-nowrap transition shrink-0 shadow-sm"
          >
            View Low Stock Dishes
          </button>
        </div>
      )}

      {/* Success Alert Banner */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. COMPACT SMALL GRID-LIKE MENU ITEMS CATALOG                 */}
      {/* ------------------------------------------------------------- */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Utensils className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No food items found</h3>
          <p className="text-xs text-slate-400">
            Try adjusting your search query, category, or dietary filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredItems.map((item) => {
            const isAvailable = item.isAvailable !== false;
            const cap = getDishCapacity(item.name);

            return (
              <div
                key={item.id}
                onClick={() => openEditModal(item)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-md hover:scale-[1.02] ${
                  !isAvailable || cap.status === 'OUT_OF_STOCK'
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-100 hover:border-slate-700'
                    : cap.status === 'CRITICAL'
                    ? 'bg-[#111827] border-rose-500/40 hover:border-rose-500 shadow-rose-500/5'
                    : cap.status === 'NEAR_OUT_OF_STOCK'
                    ? 'bg-[#111827] border-amber-500/40 hover:border-amber-500 shadow-amber-500/5'
                    : 'bg-[#111827] border-slate-800 hover:border-orange-500/60 hover:shadow-orange-500/10'
                }`}
              >
                {/* Card Top: Veg Dot, Category & Today's Special / Out of Stock Toggles */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {/* Veg / Non-Veg Indicator Icon */}
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                        item.isVeg
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-rose-500 bg-rose-500/10'
                      }`}
                      title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[90px]">
                      {item.category?.name || 'Dish'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Today's Special Star Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleTodaySpecial(e, item)}
                      disabled={togglingId === item.id}
                      className={`p-1 rounded-lg text-xs transition cursor-pointer ${
                        item.isBestseller
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-slate-800/80 text-slate-500 border border-slate-700 hover:text-amber-300'
                      }`}
                      title={item.isBestseller ? "Today's Special (Click to remove)" : "Click to mark as Today's Special"}
                    >
                      <Sparkles className={`w-3 h-3 ${item.isBestseller ? 'text-amber-400' : ''}`} />
                    </button>

                    {/* Out of Stock Toggle Pill */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleAvailability(e, item)}
                      disabled={togglingId === item.id}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${
                        isAvailable && cap.status !== 'OUT_OF_STOCK'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                      }`}
                      title="Click to toggle In Stock / Out of Stock"
                    >
                      {togglingId === item.id ? '...' : isAvailable && cap.status !== 'OUT_OF_STOCK' ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>
                </div>

                {/* Food Item Image Visual */}
                <div className="relative h-28 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 group-hover:border-orange-500/40 transition">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900/50">
                      <Utensils className="w-6 h-6 text-slate-400 dark:text-slate-700 mb-1" />
                      <span className="text-[9px] font-semibold text-slate-500">No Photo</span>
                    </div>
                  )}
                  {item.imageUrl && (
                    <div className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[8px] font-mono font-bold text-slate-300">
                      WebP
                    </div>
                  )}
                </div>

                {/* Dish Name & Description */}
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-white line-clamp-1 leading-snug">
                    {item.name}
                  </h3>
                  {item.description ? (
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                      {item.description}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-600 italic">No description provided</p>
                  )}
                </div>

                {/* Live Recipe Inventory Portions Recommendation Pill */}
                <div className="pt-1">
                  {cap.status === 'CRITICAL' ? (
                    <div
                      className="px-2 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-black flex items-center justify-between"
                      title={cap.recommendationMessage}
                    >
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        <span>Only ~{cap.portionsLeft} Left</span>
                      </span>
                      <span className="text-[9px] text-rose-400 font-medium truncate max-w-[80px]">
                        Low {cap.limitingIngredient?.name.split(' ')[0]}
                      </span>
                    </div>
                  ) : cap.status === 'NEAR_OUT_OF_STOCK' ? (
                    <div
                      className="px-2 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black flex items-center justify-between"
                      title={cap.recommendationMessage}
                    >
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>~{cap.portionsLeft} Portions Left</span>
                      </span>
                      <span className="text-[9px] text-amber-400 font-medium truncate max-w-[80px]">
                        Low {cap.limitingIngredient?.name.split(' ')[0]}
                      </span>
                    </div>
                  ) : cap.status === 'OUT_OF_STOCK' ? (
                    <div
                      className="px-2 py-1 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-400 text-[10px] font-bold flex items-center gap-1"
                      title={cap.recommendationMessage}
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Raw Materials Depleted (0)</span>
                    </div>
                  ) : (
                    <div
                      className="px-2 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-between"
                      title={cap.recommendationMessage}
                    >
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>~{cap.portionsLeft} in Stock</span>
                      </span>
                      <span className="text-[9px] text-emerald-500">Abundant</span>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Price, Station & Edit Action */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-black text-sm text-white">
                        ₹{item.price.toFixed(0)}
                      </span>
                      {item.discountedPrice && item.discountedPrice < item.price && (
                        <span className="font-mono text-[10px] text-slate-500 line-through">
                          ₹{item.discountedPrice.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {item.stationCode && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px] font-bold">
                        {item.stationCode}
                      </span>
                    )}

                    <div className="p-1 rounded-lg bg-slate-800 text-slate-400 group-hover:text-orange-400 transition">
                      <Edit2 className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. EDIT / ADD FOOD ITEM MODAL POPUP                           */}
      {/* ------------------------------------------------------------- */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  {editingItem.id ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {editingItem.id ? 'Edit Food Item' : 'Add New Food Item'}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {editingItem.id
                      ? 'Update dish information, pricing, station, and availability'
                      : 'Add a new dish to your restaurant food catalog and menu'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              {/* ======================================================= */}
              {/* 📷 OPTIMIZED FOOD ITEM IMAGE UPLOAD (MAX 200 KB WEBP)   */}
              {/* ======================================================= */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Food Item Photography
                  </label>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    Max 200 KB • WebP Optimized
                  </span>
                </div>

                {/* Upload or Preview Container */}
                {imagePreviewUrl || editImageUrl ? (
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-md group">
                    <img
                      src={imagePreviewUrl || editImageUrl}
                      alt={editName || 'Food Item Preview'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/50" />

                    {/* Top Status & Controls */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 backdrop-blur-md">
                          <Check className="w-2.5 h-2.5" /> Photo Attached
                        </span>
                        {imageMetadata && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-black/60 text-slate-200 border border-white/10 backdrop-blur-md">
                            {imageMetadata.sizeKb} KB ({imageMetadata.format.toUpperCase()})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-slate-200 hover:text-white border border-white/20 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md transition cursor-pointer"
                          title="Replace this food photo"
                        >
                          <RefreshCw className="w-3 h-3 text-orange-400" />
                          <span>Replace</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md transition cursor-pointer"
                          title="Remove food photo"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Metadata & Status */}
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-slate-300">
                      <span className="font-mono text-slate-300 truncate max-w-[200px]">
                        {imageMetadata
                          ? `${imageMetadata.width} × ${imageMetadata.height} px • WebP`
                          : (editImageUrl.split('/').pop() || 'Optimized WebP')}
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready for Menu
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Drag and Drop Upload Dropzone */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileSelection(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 group ${
                      isDragging
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-300 dark:border-slate-700 hover:border-orange-500/60 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform shadow-inner">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition text-xs">
                        Click to upload food photo or drag & drop
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        JPG, PNG, or WebP • Max 200 KB per image (Auto-compressed to WebP)
                      </div>
                    </div>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelection(e.target.files[0]);
                    }
                  }}
                />

                {/* Compression / Upload Progress Indicator */}
                {(isCompressing || isUploadingImage) && (
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-between text-orange-400 text-[11px] animate-pulse">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                      <span>
                        {isCompressing
                          ? 'Resizing & compressing to WebP (enforcing ≤ 200 KB)...'
                          : 'Uploading optimized food photo to cloud storage...'}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-orange-400 font-bold">Processing</span>
                  </div>
                )}

                {/* Upload Error Banner with Retry */}
                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-rose-300 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate max-w-[340px]">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="truncate">{uploadError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetryUpload}
                      className="px-2 py-0.5 rounded bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold cursor-pointer transition shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Food Item Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Description / Ingredients */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Description & Ingredients
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="e.g. Fresh paneer cubes simmered in creamy spiced tomato butter gravy"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Price & Discounted Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Discounted Price (₹) <span className="text-[10px] text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 299"
                    value={editDiscountedPrice}
                    onChange={(e) => setEditDiscountedPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Category & Kitchen Station */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Menu Category
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-orange-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Kitchen Station
                  </label>
                  <select
                    value={editStationCode}
                    onChange={(e) => setEditStationCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="CURRY">CURRY (Gravies & Curries)</option>
                    <option value="TANDOOR">TANDOOR (Breads & Kebabs)</option>
                    <option value="FRY">FRY (Starters & Frying)</option>
                    <option value="PANTRY">PANTRY (Salads & Accompaniments)</option>
                    <option value="DESSERT">DESSERT (Sweets & Icecreams)</option>
                    <option value="BAR">BAR (Beverages & Mocktails)</option>
                  </select>
                </div>
              </div>

              {/* Dietary Type & Prep Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Dietary Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditIsVeg(true)}
                      className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                        editIsVeg
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Veg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsVeg(false)}
                      className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                        !editIsVeg
                          ? 'bg-rose-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Non-Veg</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editPrepTime}
                    onChange={(e) => setEditPrepTime(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Live Recipe BOM & Portions Capacity Insight */}
              {(() => {
                const cap = getDishCapacity(editName || editingItem.name);
                return (
                  <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                        <span className="font-bold text-white text-xs">Recipe Raw Ingredients & Capacity</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${cap.badgeColor}`}>
                        ~{cap.portionsLeft} Portions Left
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {cap.recommendationMessage}
                    </p>

                    {cap.limitingIngredient && (
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                        <span>Limiting ingredient: <span className="text-slate-300 font-semibold">{cap.limitingIngredient.name}</span></span>
                        <span className="font-mono text-white">In Hand: {cap.limitingIngredient.currentStock.toFixed(1)} {cap.limitingIngredient.unit}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Today's Special Toggle */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-1.5 rounded-lg ${editIsBestseller ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Today's Special Recommendation</div>
                    <div className="text-[10px] text-slate-400">Featured at the top of the customer QR menu</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIsBestseller(!editIsBestseller)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center space-x-1 ${
                    editIsBestseller
                      ? 'bg-amber-500 text-slate-950 font-black shadow-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{editIsBestseller ? "Today's Special" : 'Set Special'}</span>
                </button>
              </div>

              {/* Availability Toggle */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Item Availability</div>
                  <div className="text-[10px] text-slate-400">Controls whether customers can order this dish</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIsAvailable(!editIsAvailable)}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                    editIsAvailable
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-rose-600 text-white shadow'
                  }`}
                >
                  {editIsAvailable ? 'In Stock' : 'Out of Stock'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-orange-500/20 flex items-center space-x-1.5"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
