import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { customerApi } from '../services/api';
import { customerWs } from '../services/websocket';
import { receiptStorage } from '../services/receiptStorage';
import {
  UtensilsCrossed,
  ArrowRight,
  Sparkles,
  Star,
  MapPin,
  Clock,
  Search,
  Layers,
  ChevronRight,
  ChevronLeft,
  Heart,
  X,
  Smartphone,
  Download,
  Navigation,
  CheckCircle2,
  Building2
} from 'lucide-react';

export interface IndianPlace {
  name: string;
  hub: string;
  state: string;
  lat: number;
  lng: number;
}

// Comprehensive top dining hubs & cities across India
export const TOP_INDIAN_PLACES: IndianPlace[] = [
  // User specifically requested Raipur & Rajpur and 'Ra' places
  { name: 'Raipur, Chhattisgarh', hub: 'Telibandha Marine Drive & VIP Road', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { name: 'Rajpur Road, Dehradun', hub: 'Rajpur Dining Corridor & Mussoorie Foothills', state: 'Uttarakhand', lat: 30.3444, lng: 78.0583 },
  { name: 'Rajkot, Gujarat', hub: 'Kalawad Road & Racecourse Ring Road', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  { name: 'Ranchi, Jharkhand', hub: 'Main Road & Morabadi Food Street', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { name: 'Rajasthan - Jaipur', hub: 'C-Scheme & MI Road Food Hub', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Rajasthan - Udaipur', hub: 'Fateh Sagar Lake & Old City Rasoi', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  { name: 'Rajasthan - Jodhpur', hub: 'Clock Tower & Sardarpura Food Street', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  { name: 'Rajpura, Punjab', hub: 'GT Road Highway Dhabas & Dining', state: 'Punjab', lat: 30.4840, lng: 76.5940 },
  { name: 'Rajahmundry, Andhra Pradesh', hub: 'Godavari Riverfront Food Trail', state: 'Andhra Pradesh', lat: 17.0005, lng: 81.8040 },
  { name: 'Ratnagiri, Maharashtra', hub: 'Konkan Coastal Kitchens', state: 'Maharashtra', lat: 16.9902, lng: 73.3120 },

  // Mumbai & MMR
  { name: 'Bandra West, Mumbai', hub: 'Pali Hill & Hill Road', state: 'Maharashtra', lat: 19.0596, lng: 72.8295 },
  { name: 'BKC, Mumbai', hub: 'Bandra Kurla Complex Financial City', state: 'Maharashtra', lat: 19.0664, lng: 72.8687 },
  { name: 'Lower Parel, Mumbai', hub: 'High Street Phoenix & Kamala Mills', state: 'Maharashtra', lat: 18.9986, lng: 72.8311 },
  { name: 'Colaba, Mumbai', hub: 'Gateway of India & Colaba Causeway', state: 'Maharashtra', lat: 18.9067, lng: 72.8147 },
  { name: 'Juhu, Mumbai', hub: 'Juhu Tara Road & Beachside Cafes', state: 'Maharashtra', lat: 19.1075, lng: 72.8263 },
  { name: 'Powai, Mumbai', hub: 'Hiranandani High Street', state: 'Maharashtra', lat: 19.1176, lng: 72.9060 },
  { name: 'FC Road, Pune', hub: 'Fergusson College Road & Deccan', state: 'Maharashtra', lat: 18.5246, lng: 73.8415 },
  { name: 'Koregaon Park, Pune', hub: 'North Main Road & Osho Lane', state: 'Maharashtra', lat: 18.5362, lng: 73.8940 },

  // Delhi NCR
  { name: 'Connaught Place, New Delhi', hub: 'CP Inner & Outer Circle', state: 'Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Hauz Khas Village, New Delhi', hub: 'HKV & Green Park Market', state: 'Delhi', lat: 28.5494, lng: 77.2001 },
  { name: 'Cyber Hub, Gurugram', hub: 'DLF Cyber City Promenade', state: 'Haryana', lat: 28.4949, lng: 77.0894 },
  { name: 'Sector 29, Gurugram', hub: 'Brewery & Leisure Valley District', state: 'Haryana', lat: 28.4682, lng: 77.0632 },
  { name: 'Noida Sector 18', hub: 'Atta Market & Mall of India Hub', state: 'Uttar Pradesh', lat: 28.5708, lng: 77.3260 },

  // Bengaluru & Karnataka
  { name: 'Indiranagar, Bengaluru', hub: '100 Feet Road & 12th Main', state: 'Karnataka', lat: 12.9784, lng: 77.6408 },
  { name: 'Koramangala, Bengaluru', hub: '5th & 7th Block Dining Street', state: 'Karnataka', lat: 12.9352, lng: 77.6245 },
  { name: 'Whitefield, Bengaluru', hub: 'ITPL & Phoenix Marketcity', state: 'Karnataka', lat: 12.9698, lng: 77.7500 },

  // Hyderabad & Telangana
  { name: 'Banjara Hills, Hyderabad', hub: 'Road No. 1, 10 & 12', state: 'Telangana', lat: 17.4156, lng: 78.4357 },
  { name: 'Jubilee Hills, Hyderabad', hub: 'Road No. 36 & 45 Bistro Mile', state: 'Telangana', lat: 17.4325, lng: 78.4071 },
  { name: 'Gachibowli, Hyderabad', hub: 'Financial District & Hitec City', state: 'Telangana', lat: 17.4401, lng: 78.3489 },

  // Other Major Hubs
  { name: 'Park Street, Kolkata', hub: 'Heritage Colonial Dining Strip', state: 'West Bengal', lat: 22.5535, lng: 88.3524 },
  { name: 'Salt Lake, Kolkata', hub: 'Sector 5 Tech & Dining Hub', state: 'West Bengal', lat: 22.5867, lng: 88.4178 },
  { name: 'T. Nagar, Chennai', hub: 'Pondy Bazaar & Panagal Park', state: 'Tamil Nadu', lat: 13.0418, lng: 80.2341 },
  { name: 'Hazratganj, Lucknow', hub: 'Royal Awadhi Heritage Walk', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Sector 26, Chandigarh', hub: 'Madhya Marg Dining District', state: 'Chandigarh', lat: 30.7265, lng: 76.8048 },
  { name: 'Vijay Nagar, Indore', hub: 'Scheme 54 & Sarafa Food Trail', state: 'Madhya Pradesh', lat: 22.7533, lng: 75.8937 },
  { name: 'Panaji, Goa', hub: 'Fontainhas Latin Quarter & Waterfront', state: 'Goa', lat: 15.4909, lng: 73.8278 },
  { name: 'Vastrapur, Ahmedabad', hub: 'Sindhu Bhavan & IIM Road', state: 'Gujarat', lat: 23.0350, lng: 72.5293 }
];

export const POPULAR_NEIGHBORHOODS = TOP_INDIAN_PLACES.slice(0, 10);

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

// Fallback high-resolution banners ensuring carousel always has content to swipe
const DEFAULT_BANNERS = [
  {
    id: 'banner_awadhi_dum_biryani',
    title: 'Royal Awadhi Dum Biryani Festival',
    subtitle: 'Slow-cooked handi saffron biryanis with tender mutton, char-grilled galouti kebabs & burani raita.',
    badge: 'TRENDING FESTIVAL',
    tag: "CHEF'S SPECIAL • 20% OFF DINE-IN",
    rating: '4.9 ★ (1,400+)',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&auto=format&fit=crop&q=80',
    restaurantId: 'rest_dum_pukht_biryani',
    restaurantName: 'Awadhi Dastarkhwan',
    cta: 'Explore Biryani Specials'
  },
  {
    id: 'banner_heritage_thali',
    title: 'Grand 32-Course Heritage Thali',
    subtitle: 'Unlimited Rajasthani Dal Baati Churma, Gatta Curry, Malpua & saffron buttermilk served in royal brass.',
    badge: 'UNLIMITED FEAST',
    tag: 'PURE VEG • FLAT ₹150 OFF',
    rating: '4.8 ★ (980+)',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&auto=format&fit=crop&q=80',
    restaurantId: 'rest_thali_royal',
    restaurantName: 'Mewar Royal Rasoi',
    cta: 'View Heritage Thali'
  },
  {
    id: 'banner_coastal_seafood',
    title: 'Coastal Seafood & Ghee Roast Carnival',
    subtitle: 'Mangalorean Kane Fish Fry, Chettinad Crab Curry, and crispy Appams prepared fresh with tender coconut.',
    badge: 'COASTAL SPECIAL',
    tag: 'CATCH OF THE DAY • 25% OFF',
    rating: '4.9 ★ (2,150+)',
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=1200&auto=format&fit=crop&q=80',
    restaurantId: 'rest_dakshin_bistro',
    restaurantName: 'Dakshin Coastal Hub',
    cta: 'Discover Coastal Menu'
  }
];

export const CustomerHome: React.FC = () => {
  const {
    session,
    setDiningTable,
    setActiveView,
    currentOrder,
    isTableSessionValid
  } = useCustomer();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [, setIsLoadingRestaurants] = useState<boolean>(true);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PURE_VEG' | 'TOP_RATED' | 'BUDGET'>('ALL');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [activeAdIndex, setActiveAdIndex] = useState(0);

  // Discovery Tabs: 'RECOMMENDED' | 'NEAREST' | 'BEST_RATED'
  const [discoveryTab, setDiscoveryTab] = useState<'RECOMMENDED' | 'NEAREST' | 'BEST_RATED'>('RECOMMENDED');

  // Dynamic Location State
  const [userLocation, setUserLocation] = useState(TOP_INDIAN_PLACES[0]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'LOCATING' | 'SUCCESS' | 'DENIED'>('IDLE');
  const [dynamicBanners, setDynamicBanners] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);

  // Search dropdown outside-click container ref
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Carousel Swipe & Drag Tracking Refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const isMouseDown = useRef<boolean>(false);
  const isPaused = useRef<boolean>(false);

  // Click outside listener for search suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load CMS Marketing Banners from Backend with WebSocket Realtime Sync
  const loadBanners = useCallback(async () => {
    try {
      const res = await customerApi.fetchBanners();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDynamicBanners(res.data);
      } else {
        setDynamicBanners([]);
      }
    } catch {
      setDynamicBanners([]);
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
        image: b.imageUrl || '',
        badge: b.badge || 'Featured',
        restaurantId: b.restaurantId || '',
        restaurantName: b.restaurant?.name || 'Partner Restaurant',
        rating: b.rating ? `${b.rating} ★` : 'Featured',
        cta: b.ctaText || 'Browse Menu'
      }));
    }
    return DEFAULT_BANNERS;
  }, [dynamicBanners]);

  // Carousel Navigation Handlers
  const handleNextBanner = useCallback(() => {
    setActiveAdIndex((prev) => (prev + 1) % activeBannersList.length);
  }, [activeBannersList.length]);

  const handlePrevBanner = useCallback(() => {
    setActiveAdIndex((prev) => (prev - 1 + activeBannersList.length) % activeBannersList.length);
  }, [activeBannersList.length]);

  // Auto-slide Timer
  useEffect(() => {
    if (activeBannersList.length <= 1) return;
    const timer = setInterval(() => {
      if (!isPaused.current) {
        setActiveAdIndex((prev) => (prev + 1) % activeBannersList.length);
      }
    }, 4500);
    return () => clearInterval(timer);
  }, [activeBannersList.length]);

  // Touch Swipe Handlers for Mobile & Tablet
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
    isPaused.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const onTouchEnd = () => {
    isPaused.current = false;
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 40) {
        // Swiped Left -> go Next
        handleNextBanner();
      } else if (diff < -40) {
        // Swiped Right -> go Previous
        handlePrevBanner();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Mouse Drag Handlers for Desktop Swiping
  const onMouseDown = (e: React.MouseEvent) => {
    isMouseDown.current = true;
    mouseStartX.current = e.clientX;
    isPaused.current = true;
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (isMouseDown.current && mouseStartX.current !== null) {
      const diff = mouseStartX.current - e.clientX;
      if (diff > 40) {
        handleNextBanner();
      } else if (diff < -40) {
        handlePrevBanner();
      }
    }
    isMouseDown.current = false;
    mouseStartX.current = null;
    isPaused.current = false;
  };

  const onMouseLeave = () => {
    isMouseDown.current = false;
    mouseStartX.current = null;
    isPaused.current = false;
  };

  // Curated Regional Dining Hubs
  const cuisineHubs = [
    { id: 'ALL', name: 'All Cuisines', icon: '🍽️', desc: 'Full Menu Collection' },
    { id: 'PUNJAB_TANDOOR', name: 'Punjab & Tandoori', icon: '🥘', desc: 'Butter Chicken & Naans' },
    { id: 'RAJASTHAN_GUJARAT', name: 'Royal Thali', icon: '🍲', desc: 'Mewar Thali & Dal Baati' },
    { id: 'SOUTH_COASTAL', name: 'Coastal & South', icon: '🍛', desc: 'Ghee Roast & Curries' },
    { id: 'MUGHLAI_BIRYANI', name: 'Awadhi Biryani', icon: '🍗', desc: 'Dum Pukht & Kebabs' }
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
        const detectedLat = pos.coords.latitude;
        const detectedLng = pos.coords.longitude;

        // Find closest recognized Indian place for a friendlier display name
        let closestPlace = TOP_INDIAN_PLACES[0];
        let minDistance = Infinity;
        for (const place of TOP_INDIAN_PLACES) {
          const d = getDistanceKm(detectedLat, detectedLng, place.lat, place.lng);
          if (d < minDistance) {
            minDistance = d;
            closestPlace = place;
          }
        }

        const label = minDistance <= 30
          ? `Current Location (${closestPlace.name.split(',')[0]})`
          : 'Current Device Location';

        setUserLocation({
          name: label,
          hub: closestPlace.hub,
          state: closestPlace.state,
          lat: detectedLat,
          lng: detectedLng
        });

        setLocationStatus('SUCCESS');
        setIsSearchFocused(false);
        setTimeout(() => {
          setShowLocationModal(false);
          setLocationStatus('IDLE');
        }, 600);
      },
      () => {
        setLocationStatus('DENIED');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Load Restaurants Data
  useEffect(() => {
    const load = async () => {
      setIsLoadingRestaurants(true);
      try {
        const res = await customerApi.fetchRestaurants();
        if (res.success && res.data && res.data.length > 0) {
          const formatted = res.data.map((r: any) => ({
            id: r.id,
            name: r.name,
            city: r.address || r.city || 'Location on file',
            cuisineType: r.cuisineType || 'Multi-Cuisine',
            rating: r.rating || null,
            reviewCount: r.reviewCount || 0,
            costForTwo: r.costForTwo || null,
            isPureVeg: !!r.isPureVeg,
            hub: r.hub || 'ALL',
            coverImageUrl: r.coverImageUrl || '',
            avgTime: r.avgPrepTime ? `${r.avgPrepTime} min` : '15-25 min',
            lat: r.latitude || r.lat || 0,
            lng: r.longitude || r.lng || 0,
            tags: r.tags || (r.isPureVeg ? ['Pure Veg'] : ['Multi-Cuisine'])
          }));
          setRestaurants(formatted);
        } else {
          setRestaurants([]);
        }
      } catch {
        setRestaurants([]);
      } finally {
        setIsLoadingRestaurants(false);
      }
    };
    load();
  }, []);

  const handleSelectRestaurant = (rest: any) => {
    const hasValidTableForRest = session.restaurantId === rest.id && isTableSessionValid();
    const tableToSet = hasValidTableForRest ? session.tableNumber : '';
    setDiningTable(tableToSet, rest.id, rest.name);
    setActiveView('MENU');
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Indian Places Autocomplete Matching Engine (e.g. typing 'Ra' matches Raipur, Rajpur, Rajkot, etc.)
  const matchingIndianPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return TOP_INDIAN_PLACES.slice(0, 8);
    }
    return TOP_INDIAN_PLACES.filter((place) => {
      const matchName = place.name.toLowerCase().includes(q);
      const matchHub = place.hub.toLowerCase().includes(q);
      const matchState = place.state.toLowerCase().includes(q);
      return matchName || matchHub || matchState;
    });
  }, [searchQuery]);

  // Modal Indian Places Filter
  const modalMatchingPlaces = useMemo(() => {
    const q = modalSearchQuery.trim().toLowerCase();
    if (!q) return TOP_INDIAN_PLACES;
    return TOP_INDIAN_PLACES.filter((place) => {
      return (
        place.name.toLowerCase().includes(q) ||
        place.hub.toLowerCase().includes(q) ||
        place.state.toLowerCase().includes(q)
      );
    });
  }, [modalSearchQuery]);

  // Category shelves data
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
    return restaurants.filter(r => r.hub === 'MUGHLAI_BIRYANI' || r.cuisineType?.toLowerCase().includes('biryani') || r.cuisineType?.toLowerCase().includes('mughlai'));
  }, [restaurants]);

  const thaliRestaurants = useMemo(() => {
    return restaurants.filter(r => r.hub === 'RAJASTHAN_GUJARAT' || r.cuisineType?.toLowerCase().includes('thali') || r.cuisineType?.toLowerCase().includes('rajasthan'));
  }, [restaurants]);

  // Filtered List based on Search & Active Filter
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((rest) => {
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
  }, [restaurants, selectedCuisine, searchQuery, activeFilter]);

  // Discovery Section Tab Logic: Recommended for You | Nearest | Best Rated
  const discoveryRestaurants = useMemo(() => {
    if (discoveryTab === 'RECOMMENDED') {
      if (recommended.length > 0) return recommended;
      return [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (discoveryTab === 'NEAREST') {
      return [...restaurants].sort((a, b) => {
        const distA = a.lat && a.lng ? getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) : 9999;
        const distB = b.lat && b.lng ? getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng) : 9999;
        return distA - distB;
      });
    }
    if (discoveryTab === 'BEST_RATED') {
      return [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return restaurants;
  }, [discoveryTab, recommended, restaurants, userLocation]);

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
                <span className="text-xs font-black text-slate-900 dark:text-white">Live Kitchen Order #{currentOrder.orderNumber}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase">
                  {currentOrder.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">Tap to track live preparation & view bill</p>
            </div>
          </div>
          <div className="text-xs font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1 group-hover:translate-x-1 transition">
            <span>Track</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* TOP HEADER: Dining Location Selector */}
      <div className="pt-1 pb-1 flex flex-wrap items-center justify-between gap-2.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Explore Dining
            </h1>
            {/* Clickable Neighborhood Location Chip */}
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 hover:border-orange-500/60 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-white transition cursor-pointer shadow-sm group active:scale-95"
              title="Change your dining location"
            >
              <MapPin className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="max-w-[130px] sm:max-w-[200px] truncate">{userLocation.name}</span>
              <span className="text-[10px] text-orange-500 dark:text-orange-400 font-black">▾</span>
            </button>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Discover verified kitchens, explore menus & dine seamlessly
          </p>
        </div>
      </div>

      {/* SEARCH BAR WITH EMBEDDED CURRENT LOCATION BUTTON & AUTOCOMPLETE */}
      <div ref={searchBoxRef} className="relative z-30">
        <div className="bg-white dark:bg-[#151D30] border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-md space-y-2.5">
          {/* Main Search Input Row with Embedded 'Use Current Location' Button */}
          <div className="relative flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              placeholder="Search restaurants, cuisines, or places in India (e.g. Raipur, Rajpur, Biryani)..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-28 sm:pr-36 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition shadow-inner"
            />

            {/* Embedded Action Group: Clear Button + Current Location Button */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Current Location GPS Button inside Search Bar */}
              <button
                type="button"
                onClick={handleDetectGpsLocation}
                disabled={locationStatus === 'LOCATING'}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/15 dark:hover:bg-orange-500/25 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 text-xs font-extrabold transition cursor-pointer active:scale-95 shrink-0 shadow-sm"
                title="Detect & use my current device location"
              >
                <Navigation
                  className={`w-3.5 h-3.5 text-orange-500 dark:text-orange-400 ${
                    locationStatus === 'LOCATING' ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden sm:inline">Current Location</span>
                <span className="sm:hidden text-[11px]">Near Me</span>
              </button>
            </div>
          </div>

          {/* Popular Quick Search Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase shrink-0">Popular:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchQuery(searchQuery === tag ? '' : tag);
                  setIsSearchFocused(false);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer border ${
                  searchQuery.toLowerCase() === tag.toLowerCase()
                    ? 'bg-orange-500 text-white border-orange-400'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Live Autocomplete Dropdown for Places in India & Restaurants */}
        {isSearchFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-slate-700 rounded-3xl p-4 shadow-2xl space-y-4 max-h-[460px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Quick Action: Use Current Location */}
            <button
              type="button"
              onClick={handleDetectGpsLocation}
              disabled={locationStatus === 'LOCATING'}
              className="w-full p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30 flex items-center justify-between transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                  <Navigation className={`w-4 h-4 ${locationStatus === 'LOCATING' ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    {locationStatus === 'LOCATING' ? 'Detecting device GPS...' : 'Use Current Device Location'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Auto-detect and find dining spots closest to you
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded-full">
                GPS
              </span>
            </button>

            {/* Places in India Matching Keyword (e.g. 'Ra' -> Raipur, Rajpur, Rajkot, Ranchi, etc.) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-500" />
                  <span>
                    {searchQuery.trim()
                      ? `Places in India matching "${searchQuery}" (${matchingIndianPlaces.length})`
                      : `Top Dining Hubs in India (${matchingIndianPlaces.length})`}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 lowercase font-normal">Select to set location</span>
              </div>

              {matchingIndianPlaces.length === 0 ? (
                <div className="text-xs text-slate-400 py-2 text-center">
                  No Indian cities matching "{searchQuery}". Try "Raipur", "Rajpur", "Mumbai", or "Delhi".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {matchingIndianPlaces.slice(0, 10).map((place) => {
                    const isSelected = userLocation.name === place.name;
                    return (
                      <button
                        key={place.name}
                        type="button"
                        onClick={() => {
                          setUserLocation(place);
                          setIsSearchFocused(false);
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between cursor-pointer group ${
                          isSelected
                            ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-white font-black'
                            : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="truncate">
                            <div className="font-extrabold truncate text-slate-900 dark:text-white">
                              {place.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {place.hub}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0 ml-1.5 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800">
                          {place.state}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Matching Partner Restaurants in Database */}
            {searchQuery.trim() && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
                  <span>Restaurants Matching Query ({filteredRestaurants.length})</span>
                </div>

                {filteredRestaurants.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1">No restaurants match this keyword.</p>
                ) : (
                  <div className="space-y-1.5">
                    {filteredRestaurants.slice(0, 4).map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setIsSearchFocused(false);
                          handleSelectRestaurant(r);
                        }}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={r.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80'}
                            alt={r.name}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{r.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{r.cuisineType} • {r.city}</div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-500 shrink-0 ml-2">★ {r.rating || 4.8}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. INTERACTIVE PROMOTIONAL BANNER CAROUSEL (SWIPEABLE LEFT/RIGHT & VISIBLE TEXT) */}
      {activeBannersList.length > 0 && (
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800/90 group h-64 sm:h-76 select-none bg-slate-950 cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {/* Sliding Track for Smooth Left-Right Scroll */}
          <div
            className="flex h-full w-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeAdIndex * 100}%)` }}
          >
            {activeBannersList.map((banner, idx) => (
              <div key={banner.id || idx} className="min-w-full h-full relative shrink-0">
                {/* Background Food Photography */}
                <img
                  src={banner.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&auto=format&fit=crop&q=80'}
                  alt={banner.title || 'Featured Promotion'}
                  className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 transition-all duration-700 ease-out pointer-events-none"
                  draggable={false}
                />

                {/* Deep Dark Scrim Overlay to Guarantee 100% Text Visibility */}
                <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/95 via-black/80 sm:via-black/70 to-black/35 pointer-events-none" />

                {/* Banner Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-5 sm:p-7">
                  {/* Top Promotional Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 uppercase tracking-wider">
                        {banner.badge}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 backdrop-blur-md text-white border border-white/20 hidden sm:inline-flex">
                        {banner.tag}
                      </span>
                    </div>

                    <span className="text-[11px] font-black text-amber-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40 font-mono">
                      {banner.rating}
                    </span>
                  </div>

                  {/* Headline & Description with 100% Guaranteed Crisp White Text */}
                  <div className="space-y-1.5 max-w-lg sm:max-w-xl">
                    <h2
                      style={{ color: '#FFFFFF' }}
                      className="banner-title text-xl sm:text-2xl font-black tracking-tight leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]"
                    >
                      {banner.title}
                    </h2>
                    <p
                      style={{ color: '#F1F5F9' }}
                      className="banner-subtitle text-xs sm:text-sm font-medium line-clamp-2 leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]"
                    >
                      {banner.subtitle}
                    </p>
                  </div>

                  {/* Bottom Action CTA */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDiningTable(session.tableNumber || '', banner.restaurantId, banner.restaurantName);
                        setActiveView('MENU');
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <span className="!text-white">{banner.cta}</span>
                      <ArrowRight className="w-4 h-4 !text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Left & Right Chevron Controls for Desktop / Instant Tap Navigation */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevBanner();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition cursor-pointer shadow-lg active:scale-90"
            title="Previous banner (Swipe right)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextBanner();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition cursor-pointer shadow-lg active:scale-90"
            title="Next banner (Swipe left)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Interactive Slide Dots */}
          <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
            {activeBannersList.map((ad, idx) => (
              <button
                key={ad.id || idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAdIndex(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === activeAdIndex ? 'w-6 bg-orange-500' : 'w-2 bg-white/40 hover:bg-white/80'
                }`}
                title={ad.title}
              />
            ))}
          </div>
        </div>
      )}

      {/* DISCOVERY SECTION: 'RECOMMENDED FOR YOU', 'NEAREST', & 'BEST RATED' NEAR CURRENT DEVICE LOCATION */}
      <section className="space-y-3.5 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* Current Device Location Pill & Change Trigger */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 dark:text-orange-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Near</span>
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="font-extrabold text-slate-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition flex items-center gap-1 cursor-pointer underline decoration-orange-500/40 decoration-2 underline-offset-2"
                title="Change Dining Location"
              >
                <span className="max-w-[200px] truncate">{userLocation.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
              </button>
            </div>
          </div>

          {/* Clean & Minimal Filter Tabs: Recommended for you | Nearest | Best Rated */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-inner self-start sm:self-auto overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setDiscoveryTab('RECOMMENDED')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                discoveryTab === 'RECOMMENDED'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended for you</span>
            </button>

            <button
              type="button"
              onClick={() => setDiscoveryTab('NEAREST')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                discoveryTab === 'NEAREST'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Nearest</span>
            </button>

            <button
              type="button"
              onClick={() => setDiscoveryTab('BEST_RATED')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                discoveryTab === 'BEST_RATED'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Best Rated</span>
            </button>
          </div>
        </div>

        {/* Discovery Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {discoveryRestaurants.slice(0, 3).map((rec: any) => {
            const dist = rec.lat && rec.lng ? getDistanceKm(userLocation.lat, userLocation.lng, rec.lat, rec.lng) : null;
            return (
              <div
                key={rec.id}
                onClick={() => handleSelectRestaurant(rec)}
                className="p-3.5 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:to-[#151D30] border border-slate-200 dark:border-slate-800 hover:border-orange-500/60 transition cursor-pointer flex items-center gap-3 shadow-sm hover:shadow-md dark:shadow-lg group"
              >
                <div className="relative w-18 h-18 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={rec.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80'}
                    alt={rec.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-black text-amber-300 flex items-center gap-0.5">
                    ★ {rec.rating || 4.8}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate group-hover:text-orange-500 dark:group-hover:text-orange-400 transition">
                      {rec.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{rec.cuisineType}</p>
                  <div className="flex items-center gap-2 pt-0.5">
                    {dist !== null ? (
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-500/25 font-mono">
                        📍 {dist} km
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-500/25">
                        📍 Near You
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      {discoveryTab === 'BEST_RATED'
                        ? `${rec.reviewCount || 120}+ reviews`
                        : discoveryTab === 'NEAREST'
                        ? (rec.avgTime || '15-25 min')
                        : (rec.matchReason || 'Top Match')}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition shrink-0" />
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. REFINED CURATED DINING SECTORS / CUISINES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-white">
            <Layers className="w-4 h-4 text-orange-400" /> Popular Cuisines
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">Select category to filter</span>
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
                    ? 'bg-orange-50 dark:bg-gradient-to-b dark:from-orange-500/20 dark:to-[#182236] border-orange-500 text-orange-600 dark:text-white shadow-md shadow-orange-500/15'
                    : 'bg-white dark:bg-[#151D30] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70 shadow-sm'
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
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight group-hover:text-orange-500 dark:group-hover:text-orange-400 transition">
                    {hub.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {hub.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CURATED CATEGORY SHELVES (Horizontal Discovery by Cuisine) */}
      <div className="space-y-6 pt-2">
        {/* Shelf A: Top in Biryanis & Awadhi Kebabs */}
        {biryaniRestaurants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥘</span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Top in Biryanis & Kebabs</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Slow dum cooked handi saffron biryanis & juicy charcoal kebabs</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCuisine('MUGHLAI_BIRYANI')}
                className="text-xs font-bold text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 flex items-center gap-0.5 cursor-pointer"
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
                    className="w-56 sm:w-64 shrink-0 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 rounded-2xl overflow-hidden p-3 space-y-2.5 cursor-pointer group shadow-sm dark:shadow-lg transition"
                  >
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
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
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-orange-500 dark:group-hover:text-orange-400 transition">{rest.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{rest.cuisineType}</p>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const q = rest.lat && rest.lng ? `${rest.lat},${rest.lng}` : encodeURIComponent(`${rest.name}, ${rest.city}`);
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank');
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700/80 flex items-center gap-1 cursor-pointer transition"
                        title="Navigate via Google Maps"
                      >
                        <Navigation className="w-3 h-3 text-orange-500" />
                        <span className="hidden sm:inline">Directions</span>
                        <span className="sm:hidden">Map</span>
                      </button>
                      <button
                        type="button"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-600 dark:text-orange-400 hover:text-white border border-orange-500/30 text-[10px] font-black flex items-center justify-center gap-1 transition"
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
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Top in Royal Thali & Heritage</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Unlimited 18-dish regional thalis served in royal heritage style</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCuisine('RAJASTHAN_GUJARAT')}
                className="text-xs font-bold text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 flex items-center gap-0.5 cursor-pointer"
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
                    className="w-56 sm:w-64 shrink-0 bg-white dark:bg-[#151D30] border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 rounded-2xl overflow-hidden p-3 space-y-2.5 cursor-pointer group shadow-sm dark:shadow-lg transition"
                  >
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
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
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-orange-500 dark:group-hover:text-orange-400 transition">{rest.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{rest.cuisineType}</p>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const q = rest.lat && rest.lng ? `${rest.lat},${rest.lng}` : encodeURIComponent(`${rest.name}, ${rest.city}`);
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank');
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700/80 flex items-center gap-1 cursor-pointer transition"
                        title="Navigate via Google Maps"
                      >
                        <Navigation className="w-3 h-3 text-orange-500" />
                        <span className="hidden sm:inline">Directions</span>
                        <span className="sm:hidden">Map</span>
                      </button>
                      <button
                        type="button"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-orange-500/15 hover:bg-orange-500 text-orange-600 dark:text-orange-400 hover:text-white border border-orange-500/30 text-[10px] font-black flex items-center justify-center gap-1 transition"
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

      {/* 4. ALL PARTNER RESTAURANTS GRID */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-white">
            <UtensilsCrossed className="w-4 h-4 text-orange-400" /> All Partner Restaurants ({filteredRestaurants.length})
          </span>
          {(selectedCuisine !== 'ALL' || searchQuery || activeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSelectedCuisine('ALL');
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="text-orange-500 hover:underline font-bold text-[11px] cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="bg-white dark:bg-[#151D30] border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3 shadow-sm">
            <div className="text-3xl">🔍</div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Restaurants Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Try searching for Biryani, Thali, or clear filters.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCuisine('ALL');
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-orange-600 transition"
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
                  className={`bg-white dark:bg-[#151D30] border rounded-2xl sm:rounded-3xl overflow-hidden shadow-md dark:shadow-xl hover:shadow-xl cursor-pointer transition-all duration-300 flex flex-col justify-between group ${
                    isSelected
                      ? 'border-orange-500 ring-2 ring-orange-500/40 bg-orange-50/40 dark:bg-gradient-to-b dark:from-[#182238] dark:to-[#121824]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-orange-400 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Image Media Header */}
                  <div className="relative h-28 sm:h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={rest.coverImageUrl}
                      alt={rest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 dark:from-[#151D30] dark:via-transparent dark:to-black/40" />

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
                        <h3 className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition leading-snug truncate">
                          {rest.name}
                        </h3>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                            Connected
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 line-clamp-1">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span className="truncate">{rest.cuisineType}</span>
                      </div>

                      <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-1">
                        <span className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{rest.city}</span>
                        </span>
                        {dist !== null && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-500 dark:text-orange-400 text-[9px] sm:text-[10px] font-mono font-bold shrink-0">
                            {dist} km
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] sm:text-xs">
                      <span className="text-slate-500 dark:text-slate-400">For two:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
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
                        className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs font-bold border border-slate-200 dark:border-slate-700/80 flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                        title="Get directions on Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5 text-orange-500" />
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

      {/* 5. DOWNLOAD APP SECTION (White Card in Light Mode) */}
      <section className="mt-10 mb-4 rounded-3xl overflow-hidden bg-white dark:bg-[#151D30] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-2xl relative">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 sm:p-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Marketing Pitch */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-wider shadow-sm">
                <Smartphone className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                <span className="text-orange-600 dark:text-orange-400">DineDeck App</span>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Download the DineDeck App
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
                  Order from your table, track your food live from the kitchen, and pay seamlessly — all in one app.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center gap-3">
                <a
                  href="/dinedeck-customer.apk"
                  download="dinedeck-customer.apk"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 !text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-orange-500/25 flex items-center gap-2 transition cursor-pointer transform active:scale-95"
                >
                  <Download className="w-4 h-4 !text-white" />
                  <span className="!text-white font-black">Download App</span>
                </a>
              </div>
            </div>

            {/* Right Column: Scannable QR Code */}
            <div className="lg:col-span-5 hidden sm:flex flex-col items-center justify-center">
              <div className="flex flex-col items-center bg-slate-50 dark:bg-[#121824] p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700/80 text-center max-w-xs w-full group transition transform hover:scale-[1.02]">
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
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
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 font-extrabold text-[10px] tracking-wider uppercase">
                    Scan with Phone Camera
                  </span>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Scan to Download</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Point your camera to get the app on your phone
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOCATION SELECTOR MODAL (Image 3 Fixes + Instant Search for Indian Hubs) */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151D30] border border-slate-200 dark:border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Select Dining Location</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Discover tables and menus near you</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GPS Detection Action with High-Contrast Typography in Light & Dark Mode */}
            <button
              type="button"
              onClick={handleDetectGpsLocation}
              disabled={locationStatus === 'LOCATING'}
              className="w-full p-3.5 rounded-2xl bg-orange-50 hover:bg-orange-100 dark:bg-gradient-to-r dark:from-orange-500/20 dark:to-amber-500/20 border border-orange-200 dark:border-orange-500/40 hover:border-orange-500 flex items-center justify-between transition group cursor-pointer shrink-0 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Navigation
                  className={`w-5 h-5 text-orange-500 dark:text-orange-400 ${
                    locationStatus === 'LOCATING' ? 'animate-spin' : 'group-hover:rotate-12 transition'
                  }`}
                />
                <div className="text-left">
                  <div
                    style={{ color: '#0F172A' }}
                    className="modal-location-title text-xs font-black dark:!text-white"
                  >
                    {locationStatus === 'LOCATING' ? 'Detecting GPS Coordinates...' : 'Use Current Device Location'}
                  </div>
                  <div
                    style={{ color: '#475569' }}
                    className="modal-location-sub text-[10px] font-medium dark:!text-slate-300"
                  >
                    {locationStatus === 'DENIED'
                      ? 'GPS permission denied. Please choose below.'
                      : locationStatus === 'SUCCESS'
                      ? 'GPS coordinates locked!'
                      : 'Browser location permission'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            </button>

            {/* Quick Search inside Location Modal */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                placeholder="Search city, hub, or state (e.g. Raipur, Rajpur)..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition"
              />
              {modalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setModalSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Indian Places List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {modalSearchQuery.trim()
                  ? `Matching Locations (${modalMatchingPlaces.length})`
                  : 'Popular Dining Hubs in India'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {modalMatchingPlaces.map((nh) => {
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
                          ? 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500 text-orange-600 dark:text-white'
                          : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="truncate min-w-0 pr-1">
                        <span className="truncate block">{nh.name}</span>
                        <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400 truncate block">
                          {nh.hub}
                        </span>
                      </div>
                      {isCur && <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
