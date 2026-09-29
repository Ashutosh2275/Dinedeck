import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import {
  Sparkles,
  Plus,
  Eye,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Smartphone,
  Monitor,
  Flame,
  Star,
  RefreshCw,
  ArrowRight,
  Sliders,
  Layers
} from 'lucide-react';

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  tag: string;
  rating: string;
  discountPercent: number;
  imageUrl: string;
  ctaText: string;
  ctaLink?: string | null;
  restaurantId?: string | null;
  displayOrder: number;
  isActive: boolean;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
  };
}

const PRESET_TEMPLATES = [
  {
    title: 'Royal Awadhi Dum Biryani Festival',
    subtitle: 'Slow-cooked handi saffron biryanis with tender mutton, char-grilled galouti kebabs & burani raita.',
    badge: 'TRENDING FESTIVAL',
    tag: "CHEF'S SPECIAL • 20% OFF DINE-IN",
    rating: '4.9 ★ (1,400+)',
    discountPercent: 20,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80',
    ctaText: 'Explore Biryani Specials',
    restaurantId: 'rest_dum_pukht_biryani'
  },
  {
    title: 'Grand 32-Course Heritage Thali',
    subtitle: 'Unlimited Rajasthani Dal Baati Churma, Gatta Curry, Malpua & saffron buttermilk served in royal brass.',
    badge: 'UNLIMITED FEAST',
    tag: 'PURE VEG • FLAT ₹150 OFF',
    rating: '4.8 ★ (980+)',
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=80',
    ctaText: 'View Heritage Thali',
    restaurantId: 'rest_thali_royal'
  },
  {
    title: 'Coastal Seafood & Ghee Roast Carnival',
    subtitle: 'Mangalorean Kane Fish Fry, Chettinad Crab Curry, and crispy Appams prepared fresh with tender coconut.',
    badge: 'COASTAL SPECIAL',
    tag: 'CATCH OF THE DAY • 25% OFF',
    rating: '4.9 ★ (2,150+)',
    discountPercent: 25,
    imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=1200&q=80',
    ctaText: 'Discover Coastal Menu',
    restaurantId: 'rest_dakshin_bistro'
  },
  {
    title: 'Monsoon Amritsari Tandoor Specials',
    subtitle: 'Charred paneer tikka, makki di roti with sarson da saag, and frothy Amritsari lassi.',
    badge: 'MONSOON DELIGHT',
    tag: 'TANDOOR SPECIAL • 15% OFF',
    rating: '4.9 ★ (1,420+)',
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
    ctaText: 'Explore Tandoor Delights',
    restaurantId: 'rest_punjab_heritage'
  }
];

export const AdminCustomerCMS: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge: 'TRENDING',
    tag: "CHEF'S SPECIAL",
    rating: '4.9 ★ (1,400+)',
    discountPercent: 20,
    imageUrl: '',
    ctaText: 'Explore Specials',
    restaurantId: '',
    displayOrder: 1,
    isActive: true
  });

  const loadBanners = async () => {
    setIsLoading(true);
    const res = await adminApi.fetchBanners(false);
    if (res.success && res.data) {
      setBanners(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleApplyTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
    setFormData({
      title: tpl.title,
      subtitle: tpl.subtitle,
      badge: tpl.badge,
      tag: tpl.tag,
      rating: tpl.rating,
      discountPercent: tpl.discountPercent,
      imageUrl: tpl.imageUrl,
      ctaText: tpl.ctaText,
      restaurantId: tpl.restaurantId,
      displayOrder: banners.length + 1,
      isActive: true
    });
    setIsEditing(true);
    setEditingId(null);
  };

  const handleStartEdit = (b: BannerItem) => {
    setFormData({
      title: b.title,
      subtitle: b.subtitle,
      badge: b.badge,
      tag: b.tag,
      rating: b.rating,
      discountPercent: b.discountPercent || 20,
      imageUrl: b.imageUrl,
      ctaText: b.ctaText,
      restaurantId: b.restaurantId || '',
      displayOrder: b.displayOrder,
      isActive: b.isActive
    });
    setEditingId(b.id);
    setIsEditing(true);
  };

  const handleToggle = async (id: string) => {
    await adminApi.toggleBanner(id);
    loadBanners();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promotional banner?')) return;
    await adminApi.deleteBanner(id);
    loadBanners();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await adminApi.updateBanner(editingId, formData);
    } else {
      await adminApi.createBanner(formData);
    }
    setSaveSuccessMsg('Promotional banner saved and synced to customer devices!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
    setIsEditing(false);
    setEditingId(null);
    loadBanners();
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white">Customer App & Web Banner Scrolls CMS</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build, edit, and schedule promotional banners and culinary festival carousels across all diner interfaces.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadBanners}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>

          <button
            onClick={() => {
              setFormData({
                title: '',
                subtitle: '',
                badge: 'TRENDING',
                tag: "CHEF'S SPECIAL",
                rating: '4.9 ★ (1,000+)',
                discountPercent: 20,
                imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
                ctaText: 'Explore Specials',
                restaurantId: '',
                displayOrder: banners.length + 1,
                isActive: true
              });
              setEditingId(null);
              setIsEditing(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-orange-500/25 flex items-center space-x-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Custom Banner</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Preset Templates Library */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-orange-400" /> One-Click Promotional Templates
          </h3>
          <span className="text-[11px] text-slate-500">Select template to load into banner editor</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_TEMPLATES.map((tpl, i) => (
            <div
              key={i}
              className="bg-slate-900/80 border border-slate-800 hover:border-orange-500/50 p-4 rounded-2xl transition group cursor-pointer flex flex-col justify-between space-y-3"
              onClick={() => handleApplyTemplate(tpl)}
            >
              <div className="space-y-1.5">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500/20 text-orange-400 uppercase tracking-wider">
                  {tpl.badge}
                </span>
                <h4 className="font-black text-xs text-white group-hover:text-orange-400 transition leading-snug">
                  {tpl.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {tpl.subtitle}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                <span className="text-amber-400 font-bold">{tpl.rating}</span>
                <span className="text-orange-400 font-bold group-hover:translate-x-1 transition flex items-center gap-1">
                  Load Template <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Banner Editor & Live Preview Modal / Drawer */}
      {isEditing && (
        <div className="bg-slate-900/90 border border-orange-500/40 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-400" />
              <span>{editingId ? 'Edit Promotional Banner' : 'Create New Promotional Banner'}</span>
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕ Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Fields */}
            <form onSubmit={handleSave} className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Banner Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g. Royal Awadhi Dum Biryani Festival"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle / Menu Highlights</label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  required
                  placeholder="e.g. Slow-cooked handi saffron biryanis with tender mutton..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Tag / Promo Text</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Rating Display</label>
                  <input
                    type="text"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={formData.discountPercent}
                    onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Target Restaurant ID</label>
                  <input
                    type="text"
                    value={formData.restaurantId}
                    onChange={(e) => setFormData({ ...formData, restaurantId: e.target.value })}
                    placeholder="e.g. rest_dum_pukht_biryani"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  required
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded border-slate-700 bg-slate-950 focus:ring-orange-500"
                  />
                  <span className="text-xs font-bold text-slate-300">Set Live Immediately (Active)</span>
                </label>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400">Order:</span>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-orange-500/25 cursor-pointer hover:from-orange-600 hover:to-amber-600 transition"
                >
                  {editingId ? 'Save & Sync Changes' : 'Create & Publish Banner'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Live Customer Preview */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-orange-400" /> Customer Live Preview
                </span>
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('DESKTOP')}
                    className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                      previewMode === 'DESKTOP' ? 'bg-orange-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('MOBILE')}
                    className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                      previewMode === 'MOBILE' ? 'bg-orange-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Simulated Customer Carousel Card */}
              <div
                className={`relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 select-none ${
                  previewMode === 'MOBILE' ? 'max-w-xs mx-auto h-56' : 'h-64'
                }`}
              >
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt={formData.title}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30" />
                <div className="relative z-10 h-full flex flex-col justify-between p-5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white uppercase tracking-wider">
                      {formData.badge || 'PROMO'}
                    </span>
                    <span className="text-[10px] font-black text-amber-300 bg-black/50 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      {formData.rating || '4.9 ★'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-black text-white leading-tight">
                      {formData.title || 'Enter banner title...'}
                    </h4>
                    <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed">
                      {formData.subtitle || 'Enter subtitle text...'}
                    </p>
                    <div className="pt-2">
                      <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-[10px] rounded-xl shadow-md">
                        {formData.ctaText || 'Explore'} →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Published Banners List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
          Currently Configured Banners ({banners.length})
        </h3>

        {banners.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-2">
            <p className="text-xs text-slate-400">No promotional banners configured yet.</p>
            <p className="text-[11px] text-slate-500">Click "New Custom Banner" or select a template above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className={`bg-slate-900/90 border rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition ${
                  b.isActive ? 'border-slate-800 hover:border-slate-700' : 'border-rose-500/30 opacity-60'
                }`}
              >
                <div className="relative h-40">
                  <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-black/60 text-white border border-white/20 uppercase">
                      {b.badge}
                    </span>
                    <button
                      onClick={() => handleToggle(b.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase transition cursor-pointer border ${
                        b.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      }`}
                    >
                      {b.isActive ? '🟢 Active' : '⚪ Inactive'}
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-3 right-3">
                    <span className="text-[10px] text-amber-300 font-bold bg-black/60 px-2 py-0.5 rounded-md">
                      {b.rating}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-xs text-white leading-snug">{b.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{b.subtitle}</p>
                    {b.restaurant && (
                      <p className="text-[10px] text-orange-400 font-bold pt-1">
                        Linked: {b.restaurant.name}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">Order #{b.displayOrder}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStartEdit(b)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
