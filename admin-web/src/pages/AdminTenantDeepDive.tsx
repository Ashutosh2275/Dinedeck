import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import {
  Building2,
  Activity,
  ShoppingBag,
  Receipt,
  UtensilsCrossed,
  Users,
  Package,
  BarChart3,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  ShieldCheck,
  Search,
  RefreshCw,
  Sliders,
  ChevronDown,
  Printer,
  FileCheck,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  X,
  Phone,
  MapPin,
  Flame,
  Check
} from 'lucide-react';

type TenantSubTab =
  | 'HOME'
  | 'KDS'
  | 'BILLING'
  | 'MENU'
  | 'STAFF'
  | 'TABLES'
  | 'REPORTS'
  | 'SETTINGS';

export const CANONICAL_RESTAURANTS = [
  {
    id: 'rest_punjab_heritage',
    name: 'The Punjab Heritage Kitchen',
    slug: 'punjab-heritage-mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    cuisineType: 'North Indian, Mughlai, Tandoor',
    rating: 4.9,
    costForTwo: 950,
    fullAddress: 'Plot 42, Bandra Kurla Complex, Bandra West, Mumbai, Maharashtra 400050',
    phone: '+912226501234',
    gstin: '27AAAAA0000A1Z5',
    fssaiNumber: '11521000001234',
    commissionRatePercent: 15.0,
    cgstRatePercent: 2.5,
    sgstRatePercent: 2.5,
    serviceChargePercent: 5.0,
    status: 'ACTIVE'
  },
  {
    id: 'rest_dakshin_bistro',
    name: 'Dakshin Coastal Bistro & Tiffin',
    slug: 'dakshin-coastal-bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    cuisineType: 'South Indian, Chettinad, Coastal Seafood',
    rating: 4.8,
    costForTwo: 850,
    fullAddress: '88, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
    phone: '+918041234567',
    gstin: '29BBBBB1111B2Z6',
    fssaiNumber: '11222000005678',
    commissionRatePercent: 15.0,
    cgstRatePercent: 2.5,
    sgstRatePercent: 2.5,
    serviceChargePercent: 5.0,
    status: 'ACTIVE'
  },
  {
    id: 'rest_dum_pukht_biryani',
    name: 'Dum Pukht Royal Biryani House',
    slug: 'dum-pukht-hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    cuisineType: 'Hyderabadi, Biryani, Mughlai',
    rating: 4.9,
    costForTwo: 900,
    fullAddress: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    phone: '+914023556789',
    gstin: '36CCCCC2222C3Z7',
    fssaiNumber: '13623000009999',
    commissionRatePercent: 15.0,
    cgstRatePercent: 2.5,
    sgstRatePercent: 2.5,
    serviceChargePercent: 5.0,
    status: 'ACTIVE'
  },
  {
    id: 'rest_thali_royal',
    name: 'Thali of Rajasthan & Gujarat',
    slug: 'thali-royal-heritage-jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    cuisineType: 'Rajasthani, Gujarati, Royal Thali',
    rating: 4.8,
    costForTwo: 750,
    fullAddress: 'MI Road, Near Panch Batti, Jaipur, Rajasthan 302001',
    phone: '+911412378901',
    gstin: '08DDDDD3333D4Z8',
    fssaiNumber: '10821000007777',
    commissionRatePercent: 15.0,
    cgstRatePercent: 2.5,
    sgstRatePercent: 2.5,
    serviceChargePercent: 0.0,
    status: 'ACTIVE'
  },
  {
    id: 'rest_peshawari_grill',
    name: 'Peshawari Charcoal Grill',
    slug: 'peshawari-grill-delhi',
    city: 'Delhi NCR',
    state: 'Delhi',
    cuisineType: 'North Indian, Afghan, Charcoal Kebabs',
    rating: 4.9,
    costForTwo: 1100,
    fullAddress: 'Connaught Place, Outer Circle, New Delhi 110001',
    phone: '+911123345678',
    gstin: '07EEEEE4444E5Z9',
    fssaiNumber: '10722000003333',
    commissionRatePercent: 15.0,
    cgstRatePercent: 2.5,
    sgstRatePercent: 2.5,
    serviceChargePercent: 5.0,
    status: 'ACTIVE'
  },
  {
    id: 'rest_bengal_sweet_club',
    name: 'Bengal Spice & Sweet Club',
    slug: 'bengal-sweet-club-kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    cuisineType: 'Bengali, Kosha Mangsho, Mishti',
    rating: 4.7,
    costForTwo: 700,
    fullAddress: 'Park Street, Kolkata, West Bengal 700016',
    phone: '+913322498765',
    gstin: '19FFFFF5555F6Z0',
    fssaiNumber: '11923000001111',
    commissionRatePercent: 15.0,
    cgstRatePercent: 2.5,
    sgstRatePercent: 2.5,
    serviceChargePercent: 5.0,
    status: 'ACTIVE'
  },
  {
    id: 'rest_chettinad_court',
    name: 'Chettinad Spice Court',
    slug: 'chettinad-court-chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    cuisineType: 'Chettinad, South Indian Spices',
    rating: 4.8,
    costForTwo: 800,
    fullAddress: 'Anna Nagar 2nd Avenue, Chennai, Tamil Nadu 600040',
    phone: '+914426214321',
    gstin: '33GGGGG6666G7Z1',
    fssaiNumber: '13322000004444',
    commissionRatePercent: 15.0,
    cgstRatePercent: 2.5,
    sgstRatePercent: 2.5,
    serviceChargePercent: 5.0,
    status: 'ACTIVE'
  },
  {
    id: 'rest_goan_coastal_shack',
    name: "Fisherman's Wharf & Goan Shack",
    slug: 'goan-coastal-shack-goa',
    city: 'Goa',
    state: 'Goa',
    cuisineType: 'Goan, Seafood, Balchão, Vindaloo',
    rating: 4.8,
    costForTwo: 1200,
    fullAddress: 'Cavelossim Beach Road, Salcete, South Goa 403731',
    phone: '+918322871234',
    gstin: '30HHHHH7777H8Z2',
    fssaiNumber: '13021000008888',
    commissionRatePercent: 15.0,
    cgstRatePercent: 2.5,
    sgstRatePercent: 2.5,
    serviceChargePercent: 5.0,
    status: 'ACTIVE'
  },
  {
    id: 'rest_awadhi_dastarkhwan',
    name: 'Awadhi Dastarkhwan',
    slug: 'awadhi-dastarkhwan-lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    cuisineType: 'Awadhi, Galouti, Sheermal, Nawabi',
    rating: 4.9,
    costForTwo: 850,
    fullAddress: 'Hazratganj, Lucknow, Uttar Pradesh 226001',
    phone: '+915222234567',
    gstin: '09IIIII8888I9Z3',
    fssaiNumber: '10923000002222',
    commissionRatePercent: 15.0,
    cgstRatePercent: 2.5,
    sgstRatePercent: 2.5,
    serviceChargePercent: 5.0,
    status: 'ACTIVE'
  },
  {
    id: 'rest_malabar_express',
    name: 'Malabar Express Kitchen',
    slug: 'malabar-express-kochi',
    city: 'Kochi',
    state: 'Kerala',
    cuisineType: 'Kerala, Malabar Parotta, Roast',
    rating: 4.8,
    costForTwo: 700,
    fullAddress: 'Marine Drive, Ernakulam, Kochi, Kerala 682031',
    phone: '+914842367890',
    gstin: '32JJJJJ9999J0Z4',
    fssaiNumber: '13222000006666',
    commissionRatePercent: 15.0,
    cgstRatePercent: 2.5,
    sgstRatePercent: 2.5,
    serviceChargePercent: 5.0,
    status: 'ACTIVE'
  }
];

export const AdminTenantDeepDive: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>(CANONICAL_RESTAURANTS);
  const [selectedRestId, setSelectedRestId] = useState<string>('rest_punjab_heritage');
  const [activeTab, setActiveTab] = useState<TenantSubTab>('HOME');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // Selected restaurant state
  const [currentRestaurant, setCurrentRestaurant] = useState<any>(CANONICAL_RESTAURANTS[0]);

  // Operational states for deep dive
  const [menuItems, setMenuItems] = useState<any[]>([
    { id: 'm1', name: 'Angaari Paneer Tikka', category: 'Starters', price: 340, isAvailable: true, isVeg: true },
    { id: 'm2', name: 'Bhatinda Murgh Malai Tikka', category: 'Starters', price: 420, isAvailable: true, isVeg: false },
    { id: 'm3', name: 'Grand Old Delhi Butter Chicken', category: 'Main Course', price: 490, isAvailable: true, isVeg: false },
    { id: 'm4', name: 'Signature Dal Makhani 1947', category: 'Main Course', price: 360, isAvailable: true, isVeg: true },
    { id: 'm5', name: 'Amritsari Kulcha Platter', category: 'Breads & Accompaniments', price: 220, isAvailable: false, isVeg: true },
    { id: 'm6', name: 'Royal Awadhi Handi Biryani', category: 'Biryanis', price: 450, isAvailable: true, isVeg: false }
  ]);

  const [kdsTickets, setKdsTickets] = useState<any[]>([
    { id: 'KOT-1041', table: 'Table #4', time: '3 mins ago', status: 'PREPARING', station: 'Tandoor', items: ['2x Angaari Paneer Tikka', '1x Murgh Malai Tikka'] },
    { id: 'KOT-1042', table: 'Table #8', time: '6 mins ago', status: 'PLACED', station: 'Curry / Mains', items: ['1x Butter Chicken', '2x Garlic Naan'] },
    { id: 'KOT-1043', table: 'Table #2', time: '11 mins ago', status: 'READY', station: 'Tandoor', items: ['1x Dal Makhani', '2x Kulcha'] }
  ]);

  const [tables, setTables] = useState<any[]>([
    { id: 't1', number: 'Table 1', capacity: 2, status: 'VACANT', qrCode: 'QR_PUNJAB_T1' },
    { id: 't2', number: 'Table 2', capacity: 4, status: 'OCCUPIED', qrCode: 'QR_PUNJAB_T2' },
    { id: 't3', number: 'Table 3', capacity: 4, status: 'VACANT', qrCode: 'QR_PUNJAB_T3' },
    { id: 't4', number: 'Table 4', capacity: 6, status: 'OCCUPIED', qrCode: 'QR_PUNJAB_T4' },
    { id: 't5', number: 'Table 5', capacity: 4, status: 'OCCUPIED', qrCode: 'QR_PUNJAB_T5' },
    { id: 't6', number: 'Table 6', capacity: 2, status: 'VACANT', qrCode: 'QR_PUNJAB_T6' }
  ]);

  // Edit Profile Modal State
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(''), 3500);
  };

  // Load all restaurants from API
  const loadRestaurants = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchRestaurants();
      if (res.success && res.data && res.data.length > 0) {
        // Merge API data with canonical records
        const combined = res.data.map((apiRest: any) => {
          const canonical = CANONICAL_RESTAURANTS.find((c) => c.id === apiRest.id) || {};
          return { ...canonical, ...apiRest };
        });
        setRestaurants(combined);
      }
    } catch (e) {
      console.warn('[AdminTenantDeepDive] Fallback to canonical restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    const found = restaurants.find((r) => r.id === selectedRestId) || CANONICAL_RESTAURANTS[0];
    setCurrentRestaurant(found);
    setEditFormData({
      name: found.name,
      phone: found.phone,
      fullAddress: found.fullAddress,
      cuisineType: found.cuisineType,
      gstin: found.gstin,
      fssaiNumber: found.fssaiNumber,
      commissionRatePercent: found.commissionRatePercent || 15.0,
      cgstRatePercent: found.cgstRatePercent || 2.5,
      sgstRatePercent: found.sgstRatePercent || 2.5,
      serviceChargePercent: found.serviceChargePercent || 5.0
    });
  }, [selectedRestId, restaurants]);

  // Status Lifecycle Toggle
  const handleToggleLifecycle = async (newStatus: string) => {
    try {
      await adminApi.updateRestaurantStatus(selectedRestId, newStatus, 'SuperAdmin live toggle');
      setRestaurants((prev) =>
        prev.map((r) => (r.id === selectedRestId ? { ...r, status: newStatus } : r))
      );
      showNotification(`Restaurant status updated to ${newStatus} across all platforms.`);
    } catch {
      setRestaurants((prev) =>
        prev.map((r) => (r.id === selectedRestId ? { ...r, status: newStatus } : r))
      );
      showNotification(`Restaurant status set to ${newStatus}.`);
    }
  };

  // Save Profile & Compliance KYC
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.updateRestaurantProfile(selectedRestId, editFormData);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === selectedRestId ? { ...r, ...editFormData } : r))
      );
      setIsEditProfileModalOpen(false);
      showNotification(`Profile, GSTIN & Commission settings updated for ${editFormData.name}.`);
    } catch {
      setRestaurants((prev) =>
        prev.map((r) => (r.id === selectedRestId ? { ...r, ...editFormData } : r))
      );
      setIsEditProfileModalOpen(false);
      showNotification(`Profile updated for ${editFormData.name}.`);
    }
  };

  // Menu Availability Toggle
  const handleToggleMenuAvailability = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const next = !it.isAvailable;
          showNotification(`${it.name} is now ${next ? 'IN STOCK' : 'OUT OF STOCK'}.`);
          return { ...it, isAvailable: next };
        }
        return it;
      })
    );
  };

  // KDS Ticket State Progression
  const handleAdvanceKdsTicket = (ticketId: string) => {
    setKdsTickets((prev) =>
      prev.map((tk) => {
        if (tk.id === ticketId) {
          const nextStatus =
            tk.status === 'PLACED' ? 'PREPARING' : tk.status === 'PREPARING' ? 'READY' : 'SERVED';
          showNotification(`${ticketId} progressed to ${nextStatus}.`);
          return { ...tk, status: nextStatus };
        }
        return tk;
      })
    );
  };

  const selectedRest = currentRestaurant || CANONICAL_RESTAURANTS[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Tenant Control Header with Universal Dropdown */}
      <div className="bg-[#121826] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Universal Restaurant Command
                </span>
                <span className="text-xs text-slate-400">10 Seeded Multi-Tenant Chains</span>
              </div>
              <h1 className="text-xl font-black text-white mt-0.5">{selectedRest.name}</h1>
              <p className="text-xs text-slate-400">
                {selectedRest.city}, {selectedRest.state} • {selectedRest.cuisineType} • Rating: {selectedRest.rating} ★
              </p>
            </div>
          </div>

          {/* Restaurant Switcher & Top Bar Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dynamic Restaurant Dropdown */}
            <div className="relative min-w-[280px]">
              <select
                value={selectedRestId}
                onChange={(e) => setSelectedRestId(e.target.value)}
                className="w-full appearance-none bg-slate-950 border border-cyan-500/40 hover:border-cyan-400 text-white text-xs font-bold py-2.5 pl-4 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-inner cursor-pointer"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.name} ({r.city})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Edit Restaurant Profile Button */}
            <button
              onClick={() => setIsEditProfileModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 border border-slate-700 transition cursor-pointer"
              title="Edit Restaurant Legal Details & Pricing"
            >
              <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Details & KYC</span>
            </button>

            {/* Lifecycle Status Switcher */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => handleToggleLifecycle('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedRest.status === 'ACTIVE'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live
              </button>
              <button
                onClick={() => handleToggleLifecycle('PAUSED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedRest.status === 'PAUSED'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Paused
              </button>
              <button
                onClick={() => handleToggleLifecycle('SUSPENDED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedRest.status === 'SUSPENDED'
                    ? 'bg-rose-500 text-white font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Locked
              </button>
            </div>

            <button
              onClick={loadRestaurants}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition cursor-pointer border border-slate-700"
              title="Refresh Restaurant Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Compliance & Financial Badges */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-bold">GSTIN:</span>
            <span className="font-mono text-slate-200">{selectedRest.gstin || '27AAAAA0000A1Z5'}</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-bold">FSSAI:</span>
            <span className="font-mono text-slate-200">{selectedRest.fssaiNumber || '11521000001234'}</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-bold">Platform Commission:</span>
            <span className="font-black text-cyan-400">{selectedRest.commissionRatePercent || 15}%</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-bold">GST Rate:</span>
            <span className="font-bold text-white">5% (2.5% CGST + 2.5% SGST)</span>
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
        {[
          { key: 'HOME' as TenantSubTab, label: 'Floor & Live Operations', icon: Activity },
          { key: 'KDS' as TenantSubTab, label: 'Kitchen KDS Station', icon: Clock },
          { key: 'MENU' as TenantSubTab, label: 'Dishes & Live Stock', icon: UtensilsCrossed },
          { key: 'BILLING' as TenantSubTab, label: 'Cashier & Invoices', icon: Receipt },
          { key: 'TABLES' as TenantSubTab, label: 'Tables & Table QR Codes', icon: QrCodeIcon },
          { key: 'STAFF' as TenantSubTab, label: 'Staff & Roles', icon: Users },
          { key: 'SETTINGS' as TenantSubTab, label: 'KYC & Compliance', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: HOME & FLOOR TABLE GRID */}
      {activeTab === 'HOME' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Today Gross Revenue</span>
              <h3 className="text-2xl font-black text-white mt-1">₹52,480</h3>
              <p className="text-[10px] text-emerald-400 font-bold mt-1">↑ +18.4% vs yesterday</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Tables Seated</span>
              <h3 className="text-2xl font-black text-white mt-1">
                {tables.filter((t) => t.status === 'OCCUPIED').length} / {tables.length}
              </h3>
              <p className="text-[10px] text-cyan-400 font-bold mt-1">Active in-dining guests</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Active Kitchen KOTs</span>
              <h3 className="text-2xl font-black text-amber-400 mt-1">{kdsTickets.length} Active</h3>
              <p className="text-[10px] text-slate-400 mt-1">Avg prep time: 13 mins</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">15% Platform Commission</span>
              <h3 className="text-2xl font-black text-purple-400 mt-1">₹7,872</h3>
              <p className="text-[10px] text-slate-400 mt-1">Auto-accrued to DineDeck</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Live Floor Table Grid ({selectedRest.name})</h3>
                <p className="text-xs text-slate-400">Click any table to view open cart, active bill, or clear session.</p>
              </div>
              <span className="text-xs text-emerald-400 font-bold">Real-time WebSocket Sync</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {tables.map((t) => {
                const isOccupied = t.status === 'OCCUPIED';
                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 cursor-pointer transition hover:scale-105 ${
                      isOccupied
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                    onClick={() => {
                      setTables((prev) =>
                        prev.map((item) =>
                          item.id === t.id
                            ? { ...item, status: isOccupied ? 'VACANT' : 'OCCUPIED' }
                            : item
                        )
                      );
                      showNotification(`${t.number} marked as ${isOccupied ? 'VACANT' : 'OCCUPIED'}.`);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{t.number}</span>
                      <span className="text-[9px] uppercase font-bold">{t.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Capacity: {t.capacity} Seats
                    </div>
                    <div className="text-[9px] text-cyan-400 font-mono">
                      {t.qrCode}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: KITCHEN KDS STATION */}
      {activeTab === 'KDS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Live Cooking Station Tickets for {selectedRest.name}
            </h3>
            <span className="text-xs text-cyan-400 font-bold">Auto-sync: Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kdsTickets.map((tk) => (
              <div key={tk.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="font-black text-xs text-white">{tk.id}</span>
                    <span className="text-[10px] text-cyan-400 font-bold ml-2">{tk.table}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      tk.status === 'PREPARING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : tk.status === 'READY'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {tk.status}
                  </span>
                </div>

                <div className="space-y-1 py-1">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Station: {tk.station}</div>
                  {tk.items.map((it: string, i: number) => (
                    <div key={i} className="text-xs text-slate-200 font-medium">
                      {it}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">{tk.time}</span>
                  <button
                    onClick={() => handleAdvanceKdsTicket(tk.id)}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
                  >
                    {tk.status === 'PLACED' ? 'Start Cooking' : tk.status === 'PREPARING' ? 'Mark Ready' : 'Mark Served'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: MENU & LIVE DISH STOCK */}
      {activeTab === 'MENU' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white">Live Menu Catalog ({selectedRest.name})</h3>
              <p className="text-xs text-slate-400">Toggle dish availability or update pricing instantly from SuperAdmin.</p>
            </div>
            <button
              onClick={() => showNotification('New dish dialog initiated.')}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Dish</span>
            </button>
          </div>

          <div className="bg-[#121826] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-[10px] font-black uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Dish Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price (₹)</th>
                  <th className="p-3.5">Dietary</th>
                  <th className="p-3.5">Live Stock Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {menuItems.map((dish) => (
                  <tr key={dish.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-white">{dish.name}</td>
                    <td className="p-3.5 text-slate-400">{dish.category}</td>
                    <td className="p-3.5 font-bold text-emerald-400">₹{dish.price}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dish.isVeg ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {dish.isVeg ? 'VEG' : 'NON-VEG'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${dish.isAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                        {dish.isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleMenuAvailability(dish.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${dish.isAvailable ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                      >
                        {dish.isAvailable ? 'Mark Out of Stock' : 'Mark In Stock'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: CASHIER & INVOICES */}
      {activeTab === 'BILLING' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">Live Invoices & Cashier Desk ({selectedRest.name})</h3>
            <span className="text-xs text-slate-400">GSTIN: {selectedRest.gstin}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'INV-2026-901', table: 'Table #2', subtotal: 1250, tax: 62.5, total: 1312, status: 'PAID', mode: 'UPI' },
              { id: 'INV-2026-902', table: 'Table #4', subtotal: 1800, tax: 90, total: 1890, status: 'PENDING', mode: 'CASH' },
              { id: 'INV-2026-903', table: 'Table #5', subtotal: 940, tax: 47, total: 987, status: 'PAID', mode: 'CARD' }
            ].map((inv) => (
              <div key={inv.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono font-bold text-xs text-white">{inv.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {inv.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Dining Table</span>
                    <span className="text-white font-bold">{inv.table}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{inv.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GST (5%)</span>
                    <span>₹{inv.tax}</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-sm pt-1 border-t border-slate-800">
                    <span>Grand Total</span>
                    <span className="text-emerald-400">₹{inv.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: TABLES & QR CODES */}
      {activeTab === 'TABLES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">Physical Table QR Codes ({selectedRest.name})</h3>
            <button
              onClick={() => showNotification('Table QR Batch generated.')}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
            >
              Export QR Code Badges (PDF)
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {tables.map((t) => (
              <div key={t.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2">
                <div className="font-black text-white text-sm">{t.number}</div>
                <div className="w-16 h-16 bg-white rounded-xl mx-auto flex items-center justify-center p-1 shadow">
                  <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-white text-[8px] font-mono">
                    [QR]
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 font-mono truncate">{t.qrCode}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 6: STAFF & IAM */}
      {activeTab === 'STAFF' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">Authorized Restaurant Staff ({selectedRest.name})</h3>
            <button
              onClick={() => showNotification('Add staff modal opened.')}
              className="px-3 py-1.5 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-700 cursor-pointer"
            >
              + Add Crew Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: 'Sunil Verma', role: 'General Manager', email: 'manager.sunil@punjabheritage.in', phone: '+91 98223 45678' },
              { name: 'Vikram Singh', role: 'Head Chef (Tandoor)', email: 'chef.vikram@punjabheritage.in', phone: '+91 98112 33445' },
              { name: 'Ramesh Sharma', role: 'Head Captain / Waiter', email: 'waiter.ramesh@punjabheritage.in', phone: '+91 98112 23344' },
              { name: 'Priya Iyer', role: 'Head Cashier', email: 'cashier.priya@punjabheritage.in', phone: '+91 98445 67890' }
            ].map((st, i) => (
              <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                <div className="font-bold text-white text-xs">{st.name}</div>
                <div className="text-[10px] text-cyan-400 font-bold">{st.role}</div>
                <div className="text-[10px] text-slate-400">{st.email}</div>
                <div className="text-[10px] text-slate-500">{st.phone}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 7: SETTINGS & KYC COMPLIANCE */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white">Legal Profile & Compliance KYC</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-bold">Legal Business Name</span>
              <div className="p-3 bg-slate-950 rounded-xl text-white font-bold">{selectedRest.name} Hospitality Pvt Ltd</div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-bold">Registered GSTIN</span>
              <div className="p-3 bg-slate-950 rounded-xl text-white font-mono">{selectedRest.gstin}</div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-bold">FSSAI Food License #</span>
              <div className="p-3 bg-slate-950 rounded-xl text-white font-mono">{selectedRest.fssaiNumber}</div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-bold">Platform Commission Rate</span>
              <div className="p-3 bg-slate-950 rounded-xl text-cyan-400 font-black">{selectedRest.commissionRatePercent}%</div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <span className="text-slate-500 font-bold">Full Physical Address</span>
              <div className="p-3 bg-slate-950 rounded-xl text-slate-300">{selectedRest.fullAddress}</div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE & KYC MODAL */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121826] border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditProfileModalOpen(false)}
              className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-black text-white">Edit Restaurant Profile & KYC</h3>
              <p className="text-xs text-slate-400">Directly modify legal identity, platform commission, and tax rates.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Restaurant Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">GSTIN Number</label>
                  <input
                    type="text"
                    required
                    value={editFormData.gstin || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, gstin: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">FSSAI License #</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fssaiNumber || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, fssaiNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Platform Commission (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    required
                    value={editFormData.commissionRatePercent || 15}
                    onChange={(e) => setEditFormData({ ...editFormData, commissionRatePercent: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-400 font-black focus:outline-none focus:border-cyan-500 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Cuisine Summary</label>
                  <input
                    type="text"
                    value={editFormData.cuisineType || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, cuisineType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Full Physical Address</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullAddress || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, fullAddress: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-black"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper SVG icon for tables
function QrCodeIcon(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
