import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { customerApi } from '../services/api';
import { customerWs } from '../services/websocket';
import { receiptStorage } from '../services/receiptStorage';
import {
  UtensilsCrossed,
  QrCode,
  ArrowRight,
  Sparkles,
  Star,
  MapPin,
  Clock,
  ChefHat,
  Search,
  Layers,
  ChevronRight,
  Heart,
  X,
  Coins,
  Smartphone,
  Download,
  Navigation,
  Target,
  CheckCircle2
} from 'lucide-react';

const POPULAR_NEIGHBORHOODS = [
  { name: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295 },
  { name: 'BKC, Mumbai', lat: 19.0664, lng: 72.8687 },
  { name: 'Lower Parel, Mumbai', lat: 18.9986, lng: 72.8311 },
  { name: 'Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408 },
  { name: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 },
  { name: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Park Street, Kolkata', lat: 22.5535, lng: 88.3524 },
  { name: 'FC Road, Pune', lat: 18.5246, lng: 73.8415 }
];

export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const CustomerHome: React.FC = () => {
  const {
    session,
    setDiningTable,
    setActiveView,
    setShowQrScannerModal,
    user,
    currentOrder,
    setShowAuthModal,
    isTableSessionValid
  } = useCustomer();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState<boolean>(true);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PURE_VEG' | 'TOP_RATED' | 'BUDGET'>('ALL');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [activeAdIndex, setActiveAdIndex] = useState(0);

  // Dynamic Location & Recommendations State
  const [userLocation, setUserLocation] = useState(POPULAR_NEIGHBORHOODS[0]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'LOCATING' | 'SUCCESS' | 'DENIED'>('IDLE');
  const [dynamicBanners, setDynamicBanners] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);

  // Curated Fallback Promotional Dining Festivals
  const promoAds = [
    {
      id: 'ad_1',
      title: 'Royal Awadhi Dum Biryani Festival',
      subtitle: 'Slow-cooked handi saffron biryanis with tender mutton, char-grilled galouti kebabs & burani raita.',
      tag: "CHEF'S SPECIAL • 20% OFF DINE-IN",
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&auto=format&fit=crop&q=80',
      badge: '🔥 Trending Festival',
      restaurantId: 'rest_punjab_heritage',
      restaurantName: 'The Punjab Heritage Kitchen',
      rating: '4.9 ★ (1,400+)',
      cta: 'Explore Biryani Specials'
    },
    {
      id: 'ad_2',
      title: 'Smoky Tandoor & Barbeque Nights',
      subtitle: 'Fiery charcoal-grilled Angaari Paneer, Murgh Malai Tikka & artisanal garlic butter naans.',
      tag: 'WEEKEND LIVE TANDOOR',
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=1200&auto=format&fit=crop&q=80',
      badge: '✨ Live Grill Spotlight',
      restaurantId: 'rest_punjab_heritage',
      restaurantName: 'Grand Peshawari Grill',
      rating: '4.85 ★ (980+)',
      cta: 'Explore Tandoori Sizzlers'
    },
    {
      id: 'ad_3',
      title: 'Maharaja Heritage Royal Thali Feast',
      subtitle: '18 authentic regional dishes served hot with unlimited fragrant basmati rice & pure ghee sweets.',
      tag: 'PURE VEG • UNLIMITED REFILLS',
      image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&auto=format&fit=crop&q=80',
      badge: '👑 Heritage Dining',
      restaurantId: 'rest_punjab_heritage',
      restaurantName: 'Mewar Royal Thali',
      rating: '4.92 ★ (1,250+)',
      cta: 'Discover Royal Feast'
    }
  ];

  // Load Dynamic CMS Marketing Banners from Backend with WebSocket Realtime Sync
  const loadBanners = useCallback(async () => {
    try {
      const res = await customerApi.fetchBanners();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDynamicBanners(res.data);
      }
    } catch {
      // Fallback cleanly to promoAds
    }
  }, []);

  useEffect(() => {
    loadBanners();
    customerWs.connect();
    const unsub = customerWs.onMessage((msg) => {
      if (msg.type === 'BANNER_UPDATED' || msg.eventType === 'BANNER_UPDATED') {
        loadBanners();
      }
    });
    return () => {
      unsub();
    };
  }, [loadBanners]);

  const activeBannersList = useMemo(() => {
    if (dynamicBanners.length > 0) {
      return dynamicBanners.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        tag: b.tag || 'SPECIAL PROMOTION',
        image: b.imageUrl || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&auto=format&fit=crop&q=80',
        badge: b.badge || 'Featured',
        restaurantId: b.restaurantId || 'rest_punjab_heritage',
        restaurantName: b.restaurant?.name || 'Partner Restaurant',
        rating: '4.9 ★ (Featured)',
        cta: b.ctaText || 'Browse Menu'
      }));
    }
    return promoAds;
  }, [dynamicBanners]);

  useEffect(() => {
    if (activeBannersList.length === 0) return;
    const timer = setInterval(() => {
      setActiveAdIndex((prev) => (prev + 1) % activeBannersList.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeBannersList.length]);

  // Curated Regional Dining Hubs
  const cuisineHubs = [
    { id: 'ALL', name: 'All Cuisines', icon: '🍽️', desc: 'Full Menu Collection' },
    { id: 'PUNJAB_TANDOOR', name: 'Punjab & Tandoori', icon: '🥘', desc: 'Butter Chicken & Naans' },
    { id: 'RAJASTHAN_GUJARAT', name: 'Royal Thali', icon: '🍲', desc: 'Mewar Thali & Dal Baati' },
    { id: 'SOUTH_COASTAL', name: 'Coastal & South', icon: '🍛', desc: 'Ghee Roast & Curries' },
    { id: 'MUGHLAI_BIRYANI', name: 'Awadhi Biryani', icon: '🍗', desc: 'Dum Pukht & Kebabs' }
  ];

  // Exactly 6 Curated Premier Partner Restaurants with precise geo-coordinates
  const curatedRestaurants = [
    {
      id: 'rest_punjab_heritage',
      name: 'The Punjab Heritage Kitchen',
      city: 'Bandra Kurla Complex, Mumbai',
      cuisineType: 'North Indian • Mughlai • Tandoori',
      rating: 4.9,
      reviewCount: 1420,
      costForTwo: 950,
      isPureVeg: false,
      hub: 'PUNJAB_TANDOOR',
      coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      avgTime: '15-20 min',
      lat: 19.0760,
      lng: 72.8777,
      tags: ['Chef Special', 'Live Tandoor', 'AC Hall']
    },
    {
      id: 'rest_rajasthan_rasoi',
      name: 'Royal Mewar Thali & Rasoi',
      city: 'Heritage Chowk, Udaipur & Mumbai',
      cuisineType: 'Rajasthani • Dal Baati • Gujarati Farsan',
      rating: 4.8,
      reviewCount: 980,
      costForTwo: 750,
      isPureVeg: true,
      hub: 'RAJASTHAN_GUJARAT',
      coverImageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
      avgTime: '10-15 min',
      lat: 19.0596,
      lng: 72.8295,
      tags: ['100% Pure Veg', 'Unlimited Thali', 'Heritage Decor']
    },
    {
      id: 'rest_dakshin_bistro',
      name: 'Dakshin Coastal Bistro & Tiffin',
      city: 'Indiranagar, Bangalore & Mumbai',
      cuisineType: 'South Indian • Chettinad • Coastal Seafood',
      rating: 4.9,
      reviewCount: 2150,
      costForTwo: 850,
      isPureVeg: false,
      hub: 'SOUTH_COASTAL',
      coverImageUrl: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800&q=80',
      avgTime: '12-18 min',
      lat: 19.0020,
      lng: 72.8280,
      tags: ['Ghee Roast', 'Seafood Bar', 'Filter Coffee']
    },
    {
      id: 'rest_dum_pukht_biryani',
      name: 'Dum Pukht Royal Biryani House',
      city: 'Banjara Hills & Bandra West',
      cuisineType: 'Hyderabadi Dum Biryani • Awadhi Kebabs',
      rating: 4.8,
      reviewCount: 1640,
      costForTwo: 1100,
      isPureVeg: false,
      hub: 'MUGHLAI_BIRYANI',
      coverImageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
      avgTime: '20-25 min',
      lat: 19.0620,
      lng: 72.8350,
      tags: ['Slow Dum Cooked', 'Authentic Saffron', 'Kofta Special']
    },
    {
      id: 'rest_copper_chimney_grill',
      name: 'Copper Chimney & Charcoal Grill',
      city: 'Juhu Tara Road, Mumbai',
      cuisineType: 'North Indian • Mughlai • Charcoal Kebabs',
      rating: 4.7,
      reviewCount: 890,
      costForTwo: 1200,
      isPureVeg: false,
      hub: 'PUNJAB_TANDOOR',
      coverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      avgTime: '15-20 min',
      lat: 19.1000,
      lng: 72.8260,
      tags: ['Charcoal Grill', 'Mocktails', 'Outdoor Patio']
    },
    {
      id: 'rest_malabar_coastal_catch',
      name: 'Malabar Coastal Catch & Mess',
      city: 'Fort Heritage, South Mumbai',
      cuisineType: 'Kerala Style • Seafood • Malabar Parotta',
      rating: 4.9,
      reviewCount: 1310,
      costForTwo: 700,
      isPureVeg: false,
      hub: 'SOUTH_COASTAL',
      coverImageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
      avgTime: '10-15 min',
      lat: 18.9320,
      lng: 72.8340,
      tags: ['Clay Pot Curry', 'Flaky Parotta', 'Fresh Catch']
    }
  ];

  // Quick popular search tags
  const popularTags = ['Biryani', 'North Indian', 'Pure Veg', 'Thali', 'Tandoor', 'South Indian'];

  // Fetch Recommended Restaurants via DSA Multi-Factor Engine
  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await customerApi.fetchRecommendations({
          lat: userLocation.lat,
          lng: userLocation.lng,
          dietary: activeFilter === 'PURE_VEG' ? 'PURE_VEG' : 'ALL'
        });
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setRecommended(res.data);
        } else {
          setRecommended([]);
        }
      } catch {
        setRecommended([]);
      }
    };
    fetchRecs();
  }, [userLocation, activeFilter]);

  // GPS Permission & Location Detector
  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('DENIED');
      return;
    }
    setLocationStatus('LOCATING');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          name: 'Current Device Location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setLocationStatus('SUCCESS');
        setTimeout(() => {
          setShowLocationModal(false);
          setLocationStatus('IDLE');
        }, 800);
      },
      () => {
        setLocationStatus('DENIED');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    const load = async () => {
      setIsLoadingRestaurants(true);
      try {
        const res = await customerApi.fetchRestaurants();
        if (res.success && res.data && res.data.length > 0) {
          const formatted = res.data.slice(0, 6).map((r: any, idx: number) => {
            const fallback = curatedRestaurants[idx % curatedRestaurants.length];
            return {
              ...fallback,
              ...r,
              coverImageUrl: r.coverImageUrl || fallback.coverImageUrl,
              rating: r.rating || fallback.rating,
              reviewCount: r.reviewCount || fallback.reviewCount,
              costForTwo: r.costForTwo || fallback.costForTwo,
              lat: r.latitude || r.lat || fallback.lat,
              lng: r.longitude || r.lng || fallback.lng,
              tags: fallback.tags
            };
          });
          setRestaurants(formatted);
        } else {
          setRestaurants(curatedRestaurants);
        }
      } catch {
        setRestaurants(curatedRestaurants);
      } finally {
        setIsLoadingRestaurants(false);
      }
    };
    load();
  }, []);

  const handleSelectRestaurant = (rest: any) => {
    // Only retain table number if it belongs to this exact restaurant and session is active & unexpired (< 90 mins)
    const hasValidTableForRest = session.restaurantId === rest.id && isTableSessionValid();
    const tableToSet = hasValidTableForRest ? session.tableNumber : '';
    setDiningTable(tableToSet, rest.id, rest.name);
    setActiveView('MENU');
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const displayList = restaurants.length > 0 ? restaurants : curatedRestaurants;

  // Past Orders Affinity & Category Shelves
  const pastReceipts = useMemo(() => receiptStorage.getReceipts(), []);
  const favoriteCuisine = useMemo(() => {
    if (pastReceipts.length === 0) return null;
    const dishNames = pastReceipts.flatMap(r => (r.items || []).map(i => i.name.toLowerCase()));
    if (dishNames.some(n => n.includes('biryani') || n.includes('kebab'))) return 'MUGHLAI_BIRYANI';
    if (dishNames.some(n => n.includes('thali') || n.includes('paneer') || n.includes('dal'))) return 'RAJASTHAN_GUJARAT';
    if (dishNames.some(n => n.includes('fish') || n.includes('roast') || n.includes('curry'))) return 'SOUTH_COASTAL';
    return null;
  }, [pastReceipts]);

  const biryaniRestaurants = useMemo(() => {
    return displayList.filter(r => r.hub === 'MUGHLAI_BIRYANI' || r.cuisineType?.toLowerCase().includes('biryani') || r.cuisineType?.toLowerCase().includes('mughlai'));
  }, [displayList]);

  const thaliRestaurants = useMemo(() => {
    return displayList.filter(r => r.hub === 'RAJASTHAN_GUJARAT' || r.cuisineType?.toLowerCase().includes('thali') || r.cuisineType?.toLowerCase().includes('rajasthan'));
  }, [displayList]);

  const coastalRestaurants = useMemo(() => {
    return displayList.filter(r => r.hub === 'SOUTH_COASTAL' || r.cuisineType?.toLowerCase().includes('coastal') || r.cuisineType?.toLowerCase().includes('seafood'));
  }, [displayList]);

  // Filtered List
  const filteredRestaurants = useMemo(() => {
    return displayList.filter((rest) => {
      if (selectedCuisine !== 'ALL' && rest.hub && rest.hub !== selectedCuisine) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rest.name?.toLowerCase().includes(q);
        const matchesCity = rest.city?.toLowerCase().includes(q);
        const matchesCuisine = rest.cuisineType?.toLowerCase().includes(q);
        const matchesTags = rest.tags?.some((t: string) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesCuisine && !matchesTags) {
          return false;
        }
      }
      if (activeFilter === 'PURE_VEG' && !rest.isPureVeg) return false;
      if (activeFilter === 'TOP_RATED' && (rest.rating || 0) < 4.85) return false;
      if (activeFilter === 'BUDGET' && (rest.costForTwo || 0) > 800) return false;
      return true;
    });
  }, [displayList, selectedCuisine, searchQuery, activeFilter]);

  return (
    <div className="space-y-6 pb-28 max-w-6xl mx-auto px-2 sm:px-4">
      {/* Active Order Live Banner if diner has a kitchen order placed */}
      {currentOrder && (
        <div
          onClick={() => setActiveView('TRACKING')}
          className="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-emerald-500/15 border border-orange-500/40 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-orange-400 transition shadow-lg group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/30">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Live Kitchen Order #{currentOrder.orderNumber}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase">
                  {currentOrder.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Tap to track live preparation & view bill</p>
            </div>
          </div>
          <div className="text-xs font-bold text-orange-400 flex items-center gap-1 group-hover:translate-x-1 transition">
            <span>Track</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Page Header with Location Selector */}
      <div className="pt-1 pb-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Explore Restaurants
          </h1>
          {/* Clickable Neighborhood Location Chip */}
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 hover:border-orange-500/60 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer shadow-sm group active:scale-95"
            title="Change your dining location"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="max-w-[130px] sm:max-w-[200px] truncate">{userLocation.name}</span>
            <span className="text-[10px] text-orange-400 font-black">▾</span>
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Browse menus or scan your table QR code to order
        </p>
      </div>

      {/* Location Selector Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151D30] border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Select Dining Location</h3>
                  <p className="text-xs text-slate-400">Discover tables and menus near you</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GPS Detection Action */}
            <button
              type="button"
              onClick={handleDetectGpsLocation}
              disabled={locationStatus === 'LOCATING'}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 hover:border-orange-500 text-white flex items-center justify-between transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Navigation className={`w-5 h-5 text-orange-400 ${locationStatus === 'LOCATING' ? 'animate-spin' : 'group-hover:rotate-12 transition'}`} />
                <div className="text-left">
                  <div className="text-xs font-black">
                    {locationStatus === 'LOCATING' ? 'Detecting GPS Coordinates...' : 'Use Current Device Location'}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {locationStatus === 'DENIED'
                      ? 'GPS permission denied. Please choose below.'
                      : locationStatus === 'SUCCESS'
                      ? 'GPS coordinates locked!'
                      : 'Browser location permission'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-400" />
            </button>

            {/* Popular Neighborhoods */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Popular Dining Hubs
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {POPULAR_NEIGHBORHOODS.map((nh) => {
                  const isCur = userLocation.name === nh.name;
                  return (
                    <button
                      key={nh.name}
                      type="button"
                      onClick={() => {
                        setUserLocation(nh);
                        setShowLocationModal(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isCur
                          ? 'bg-orange-500/20 border-orange-500 text-white'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{nh.name}</span>
                      {isCur && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. PROMOTIONAL ADVERTISEMENT & CULINARY FESTIVAL SHOWCASE */}
      {activeBannersList.length > 0 && (
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/90 group h-64 sm:h-72 select-none bg-slate-950">
          {/* Background Food Photography */}
          <img
            src={activeBannersList[activeAdIndex]?.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&auto=format&fit=crop&q=80'}
            alt={activeBannersList[activeAdIndex]?.title || 'Featured'}
            className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 transition-all duration-700 ease-out"
          />

          {/* Ambient Dark Gradient Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/95 via-black/80 sm:via-black/65 to-black/35" />

          {/* Banner Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-5 sm:p-7">
            {/* Top Promotional Badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 uppercase tracking-wider">
                  {activeBannersList[activeAdIndex]?.badge}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 backdrop-blur-md text-slate-200 border border-white/10 hidden sm:inline-flex">
                  {activeBannersList[activeAdIndex]?.tag}
                </span>
              </div>

              <span className="text-[11px] font-black text-amber-300 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30 font-mono">
                {activeBannersList[activeAdIndex]?.rating}
              </span>
            </div>

            {/* Headline & Description */}
            <div className="space-y-1.5 max-w-lg sm:max-w-xl">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-md">
                {activeBannersList[activeAdIndex]?.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed drop-shadow">
                {activeBannersList[activeAdIndex]?.subtitle}
              </p>
            </div>

            {/* Bottom Action & Carousel Dots */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  const ad = activeBannersList[activeAdIndex];
                  if (ad) {
                    setDiningTable(
                      session.tableNumber || '',
                      ad.restaurantId,
                      ad.restaurantName
                    );
                    setActiveView('MENU');
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>{activeBannersList[activeAdIndex]?.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Slider Dots */}
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                {activeBannersList.map((ad, idx) => (
                  <button
                    key={ad.id || idx}
                    type="button"
                    onClick={() => setActiveAdIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activeAdIndex ? 'w-6 bg-orange-500' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    title={ad.title}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended for You (DSA Multi-Factor Proximity & Rating Engine) */}
      {recommended.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-extrabold text-white">Recommended for You</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Nearest & Best Rated
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Near {userLocation.name.split(',')[0]}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommended.slice(0, 3).map((rec: any) => (
              <div
                key={rec.id}
                onClick={() => handleSelectRestaurant(rec)}
                className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-[#151D30] border border-slate-800 hover:border-orange-500/60 transition cursor-pointer flex items-center gap-3 shadow-lg group"
              >
                <img
                  src={rec.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80'}
                  alt={rec.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-extrabold text-xs text-white truncate group-hover:text-orange-400 transition">
                      {rec.name}
                    </h4>
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5 shrink-0">
                      ★ {rec.rating || 4.9}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{rec.cuisineType}</p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/25">
                      📍 {rec.distanceKm != null ? `${rec.distanceKm} km` : 'Near You'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold truncate">
                      {rec.matchReason || 'Top Match'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. REFINED CURATED DINING SECTORS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 text-sm font-extrabold text-white">
            <Layers className="w-4 h-4 text-orange-400" /> Popular Cuisines
          </span>
          <span className="text-slate-400 text-[11px]">Select category to filter</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {cuisineHubs.map((hub) => {
            const isSelected = selectedCuisine === hub.id;
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => setSelectedCuisine(hub.id)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 group ${
                  isSelected
                    ? 'bg-gradient-to-b from-orange-500/20 to-[#182236] border-orange-500 text-white shadow-md shadow-orange-500/15'
                    : 'bg-[#151D30] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl group-hover:scale-105 transition">{hub.icon}</span>
                  {isSelected && (
                    <span className="px-1.5 py-0.2 rounded bg-orange-500 text-white text-[9px] font-black uppercase">
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-xs text-white leading-tight group-hover:text-orange-400 transition">
                    {hub.name}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {hub.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SEARCH & POPULAR SEARCH TAGS */}
      <div className="bg-[#151D30] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        {/* Popular Tags Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
          <span className="text-slate-400 font-bold text-[10px] uppercase shrink-0">Popular:</span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchQuery(searchQuery === tag ? '' : tag)}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer border ${
                searchQuery.toLowerCase() === tag.toLowerCase()
                  ? 'bg-orange-500 text-white border-orange-400'
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurants, cuisines (e.g. Mughlai, Thali), or dishes..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Summary Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
          <span>Showing <strong className="text-white">{filteredRestaurants.length}</strong> partner restaurants</span>
          {(selectedCuisine !== 'ALL' || searchQuery || activeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSelectedCuisine('ALL');
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="text-orange-400 hover:underline font-bold text-[11px] cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. CURATED CATEGORY SHELVES (Horizontal Discovery by Cuisine) */}
      <div className="space-y-6 pt-2">
        {/* Shelf A: Top in Biryanis & Awadhi Kebabs */}
        {biryaniRestaurants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥘</span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Top in Biryanis & Kebabs</h3>
                  <p className="text-[11px] text-slate-400">Slow dum cooked handi saffron biryanis & juicy charcoal kebabs</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCuisine('MUGHLAI_BIRYANI')}
                className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {biryaniRestaurants.map((rest) => {
                const dist = rest.lat && rest.lng ? getDistanceKm(userLocation.lat, userLocation.lng, rest.lat, rest.lng) : null;
                return (
                  <div
                    key={rest.id}
                    onClick={() => handleSelectRestaurant(rest)}
                    className="w-56 sm:w-64 shrink-0 bg-[#151D30] border border-slate-800 hover:border-orange-500/50 rounded-2xl overflow-hidden p-3 space-y-2.5 cursor-pointer group shadow-lg transition"
                  >
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-900">
                      <img src={rest.coverImageUrl} alt={rest.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-black text-amber-300 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-300" />
                        <span>{rest.rating || 4.8}</span>
                      </div>
                      {dist !== null && (
                        <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-orange-400 font-mono">
                          📍 {dist} km
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white truncate group-hover:text-orange-400 transition">{rest.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{rest.cuisineType}</p>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const q = rest.lat && rest.lng ? `${rest.lat},${rest.lng}` : encodeURIComponent(`${rest.name}, ${rest.city}`);
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank');
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700/80 flex items-center gap-1 cursor-pointer"
                        title="Navigate via Google Maps"
                      >
                        <Navigation className="w-3 h-3 text-orange-400" />
                        <span className="hidden sm:inline">Directions</span>
                        <span className="sm:hidden">Map</span>
                      </button>
                      <button
                        type="button"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-[10px] font-black flex items-center justify-center gap-1 transition"
                      >
                        <span>Browse Menu</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shelf B: Top in Royal Thali & Heritage Rasoi */}
        {thaliRestaurants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍲</span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Top in Royal Thali & Heritage</h3>
                  <p className="text-[11px] text-slate-400">Unlimited 18-dish regional thalis served in royal heritage style</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCuisine('RAJASTHAN_GUJARAT')}
                className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {thaliRestaurants.map((rest) => {
                const dist = rest.lat && rest.lng ? getDistanceKm(userLocation.lat, userLocation.lng, rest.lat, rest.lng) : null;
                return (
                  <div
                    key={rest.id}
                    onClick={() => handleSelectRestaurant(rest)}
                    className="w-56 sm:w-64 shrink-0 bg-[#151D30] border border-slate-800 hover:border-orange-500/50 rounded-2xl overflow-hidden p-3 space-y-2.5 cursor-pointer group shadow-lg transition"
                  >
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-900">
                      <img src={rest.coverImageUrl} alt={rest.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute top-2 left-2 bg-emerald-950/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-black text-emerald-400 border border-emerald-500/30">
                        Pure Veg
                      </div>
                      {dist !== null && (
                        <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-orange-400 font-mono">
                          📍 {dist} km
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white truncate group-hover:text-orange-400 transition">{rest.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{rest.cuisineType}</p>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const q = rest.lat && rest.lng ? `${rest.lat},${rest.lng}` : encodeURIComponent(`${rest.name}, ${rest.city}`);
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank');
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700/80 flex items-center gap-1 cursor-pointer"
                        title="Navigate via Google Maps"
                      >
                        <Navigation className="w-3 h-3 text-orange-400" />
                        <span className="hidden sm:inline">Directions</span>
                        <span className="sm:hidden">Map</span>
                      </button>
                      <button
                        type="button"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-[10px] font-black flex items-center justify-center gap-1 transition"
                      >
                        <span>Browse Menu</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. MAIN RESTAURANTS GRID (Responsive 2x1 on Mobile, 3x1 on Desktop) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 text-sm font-extrabold text-white">
            <UtensilsCrossed className="w-4 h-4 text-orange-400" /> All Partner Restaurants
          </span>
          <span className="text-slate-400 text-[11px]">2-in-1 layout • Select to browse</span>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <div className="text-3xl">🔍</div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No Restaurants Found</h3>
              <p className="text-xs text-slate-400">Try searching for Biryani, Thali, or clear filters.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCuisine('ALL');
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Show All Restaurants
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {filteredRestaurants.map((rest) => {
              const isSelected = session.restaurantId === rest.id;
              const isFav = !!favorites[rest.id];
              const dist = rest.lat && rest.lng ? getDistanceKm(userLocation.lat, userLocation.lng, rest.lat, rest.lng) : null;

              return (
                <div
                  key={rest.id}
                  onClick={() => handleSelectRestaurant(rest)}
                  className={`bg-[#151D30] border rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between group ${
                    isSelected
                      ? 'border-orange-500 ring-2 ring-orange-500/40 bg-gradient-to-b from-[#182238] to-[#121824]'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Image Media Header */}
                  <div className="relative h-28 sm:h-44 w-full overflow-hidden bg-slate-900">
                    <img
                      src={rest.coverImageUrl}
                      alt={rest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151D30] via-transparent to-black/40" />

                    {/* Rating Badge */}
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black border border-white/10 text-amber-400 shadow-md">
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400" />
                      <span>{rest.rating || 4.8}</span>
                    </div>

                    {/* Veg / Multi-Cuisine Indicator */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1">
                      {rest.isPureVeg ? (
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase shadow-md">
                          Pure Veg
                        </span>
                      ) : (
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/60 text-slate-300 text-[9px] sm:text-[10px] font-black uppercase shadow-md">
                          Multi
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, rest.id)}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg backdrop-blur-md flex items-center justify-center transition border ${
                          isFav
                            ? 'bg-rose-500 text-white border-rose-400'
                            : 'bg-slate-950/70 text-slate-300 border-white/10'
                        }`}
                      >
                        <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-extrabold text-xs sm:text-base text-white group-hover:text-orange-400 transition leading-snug truncate">
                          {rest.name}
                        </h3>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                            Connected
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] sm:text-xs text-slate-300 flex items-center gap-1 line-clamp-1">
                        <UtensilsCrossed className="w-3 h-3 text-orange-400 shrink-0" />
                        <span className="truncate">{rest.cuisineType}</span>
                      </div>

                      <div className="text-[10px] sm:text-xs text-slate-400 flex items-center justify-between gap-1">
                        <span className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{rest.city}</span>
                        </span>
                        {dist !== null && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[9px] sm:text-[10px] font-mono font-bold shrink-0">
                            {dist} km
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] sm:text-xs">
                      <span className="text-slate-400">For two:</span>
                      <span className="font-bold text-white font-mono">
                        ₹{rest.costForTwo || 800}
                      </span>
                    </div>

                    {/* Dual Actions: Navigation / Google Maps + Browse Menu */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const q = rest.lat && rest.lng ? `${rest.lat},${rest.lng}` : encodeURIComponent(`${rest.name}, ${rest.city}`);
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank');
                        }}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] sm:text-xs font-bold border border-slate-700/80 flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                        title="Get directions on Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5 text-orange-400" />
                        <span className="hidden sm:inline">Map</span>
                      </button>

                      <button
                        type="button"
                        className={`flex-1 py-2 sm:py-2.5 px-2 rounded-xl text-[10px] sm:text-xs font-black transition flex items-center justify-center space-x-1 cursor-pointer shadow-md ${
                          isSelected
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white shadow-orange-500/20'
                        }`}
                      >
                        <span className="truncate">{isSelected ? 'Connected Table' : 'Browse Menu'}</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. DOWNLOAD APP SECTION */}
      <section className="mt-10 mb-4 rounded-3xl overflow-hidden bg-gradient-to-br from-[#131C31] via-[#0F1726] to-[#0A0F1A] border border-orange-500/25 shadow-2xl relative">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 sm:p-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Minimal & Clean Marketing Pitch */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5" />
                <span>DineDeck App</span>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Download the DineDeck App
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                  Order from your table, track your food live from the kitchen, and pay seamlessly — all in one app.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center gap-3">
                <a
                  href="/dinedeck-customer.apk"
                  download="dinedeck-customer.apk"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-orange-500/25 flex items-center gap-2 transition cursor-pointer transform active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download App</span>
                </a>
              </div>
            </div>

            {/* Right Column: Scannable QR (Desktop Highlight) */}
            <div className="lg:col-span-5 hidden sm:flex flex-col items-center justify-center">
              <div className="flex flex-col items-center bg-white p-5 rounded-3xl shadow-2xl border-4 border-orange-500/30 text-center max-w-xs w-full group transition transform hover:scale-[1.02]">
                <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      typeof window !== 'undefined'
                        ? `${window.location.origin}/dinedeck-customer.apk`
                        : 'https://dinedeck.app/dinedeck-customer.apk'
                    )}&margin=10`}
                    alt="Scan to Download DineDeck App"
                    className="w-40 h-40 rounded-xl"
                  />
                </div>
                <div className="mt-3 space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-extrabold text-[10px] tracking-wider uppercase">
                    Scan with Phone Camera
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Scan to Download</h4>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Point your camera to get the app on your phone
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
