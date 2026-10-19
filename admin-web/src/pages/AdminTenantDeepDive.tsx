import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import {
  Building2,
  ChevronDown,
  Activity,
  Receipt,
  UtensilsCrossed,
  Clock,
  Users,
  Settings,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Phone,
  MapPin,
  Flame,
  Check,
  ShoppingBag
} from 'lucide-react';

type TenantSubTab =
  | 'HOME'
  | 'KDS'
  | 'MENU'
  | 'BILLING'
  | 'TABLES'
  | 'STAFF'
  | 'SETTINGS';

export const AdminTenantDeepDive: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TenantSubTab>('HOME');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // Selected restaurant state
  const [currentRestaurant, setCurrentRestaurant] = useState<any>(null);

  // Operational states for deep dive
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [kdsTickets, setKdsTickets] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

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
        setRestaurants(res.data);
        if (!selectedRestId || !res.data.some((r: any) => r.id === selectedRestId)) {
          setSelectedRestId(res.data[0].id);
        }
      } else {
        setRestaurants([]);
        setCurrentRestaurant(null);
      }
    } catch (e) {
      console.error('[AdminTenantDeepDive] Error loading restaurants:', e);
      setRestaurants([]);
      setCurrentRestaurant(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  // When restaurant selection changes, load all operational entities
  useEffect(() => {
    if (!selectedRestId) return;

    const found = restaurants.find((r) => r.id === selectedRestId);
    if (found) {
      setCurrentRestaurant(found);
      setEditFormData({
        name: found.name || '',
        phone: found.phone || '',
        fullAddress: found.fullAddress || '',
        cuisineType: found.cuisineType || '',
        gstin: found.gstin || '',
        fssaiNumber: found.fssaiNumber || '',
        commissionRatePercent: found.commissionRatePercent || 15.0,
        cgstRatePercent: found.cgstRatePercent || 2.5,
        sgstRatePercent: found.sgstRatePercent || 2.5,
        serviceChargePercent: found.serviceChargePercent || 5.0
      });
    }

    const loadDeepDiveData = async () => {
      try {
        const [detailRes, ordersRes, billsRes] = await Promise.all([
          adminApi.fetchRestaurantDetail(selectedRestId),
          adminApi.fetchOrders({ restaurantId: selectedRestId }),
          adminApi.fetchBills({ restaurantId: selectedRestId })
        ]);

        if (detailRes.success && detailRes.data) {
          const detail = detailRes.data;
          setCurrentRestaurant(detail);

          // Extract menu items from categories
          const allItems: any[] = [];
          if (Array.isArray((detail as any).categories)) {
            (detail as any).categories.forEach((cat: any) => {
              if (Array.isArray(cat.items)) {
                cat.items.forEach((item: any) => {
                  allItems.push({ ...item, category: cat.name });
                });
              }
            });
          }
          setMenuItems(allItems);

          // Extract tables from branches
          const allTables: any[] = [];
          if (Array.isArray(detail.branches)) {
            detail.branches.forEach((branch: any) => {
              if (Array.isArray(branch.tables)) {
                branch.tables.forEach((t: any) => {
                  allTables.push({
                    id: t.id,
                    number: t.tableNumber ? `Table ${t.tableNumber}` : t.id,
                    capacity: t.capacity || 4,
                    status: t.isOccupied ? 'OCCUPIED' : 'VACANT',
                    qrCode: t.qrCodeToken || `QR_${t.id}`
                  });
                });
              }
            });
          }
          setTables(allTables);

          // Extract staff
          if (Array.isArray((detail as any).staff)) {
            setStaff((detail as any).staff);
          } else {
            setStaff([]);
          }
        }

        // Active KDS Tickets from real orders
        if (ordersRes.success && ordersRes.data) {
          const activeOrders = ordersRes.data.filter((o: any) =>
            ['PLACED', 'PREPARING', 'READY'].includes(o.status)
          );
          setKdsTickets(
            activeOrders.map((o: any) => ({
              id: o.orderNumber || o.id,
              orderId: o.id,
              table: o.tableNumber ? `Table #${o.tableNumber}` : 'Counter',
              time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
              status: o.status,
              station: 'Main Kitchen',
              items: (o.items || []).map((it: any) => `${it.quantity}x ${it.name}`)
            }))
          );
        } else {
          setKdsTickets([]);
        }

        // Invoices from bills
        if (billsRes.success && billsRes.data) {
          setBills(billsRes.data);
        } else {
          setBills([]);
        }
      } catch (err) {
        console.error('[AdminTenantDeepDive] Error loading deep dive details:', err);
      }
    };

    loadDeepDiveData();
  }, [selectedRestId]);

  // Status Lifecycle Toggle
  const handleToggleLifecycle = async (newStatus: string) => {
    try {
      await adminApi.updateRestaurantStatus(selectedRestId, newStatus, 'SuperAdmin live toggle');
      setRestaurants((prev) =>
        prev.map((r) => (r.id === selectedRestId ? { ...r, status: newStatus } : r))
      );
      if (currentRestaurant) {
        setCurrentRestaurant({ ...currentRestaurant, status: newStatus });
      }
      showNotification(`Restaurant status updated to ${newStatus} across all platforms.`);
    } catch {
      showNotification(`Failed to update status to ${newStatus}.`);
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
      if (currentRestaurant) {
        setCurrentRestaurant({ ...currentRestaurant, ...editFormData });
      }
      setIsEditProfileModalOpen(false);
      showNotification(`Profile, GSTIN & Commission settings updated for ${editFormData.name}.`);
    } catch {
      showNotification(`Failed updating profile for ${editFormData.name}.`);
    }
  };

  // Menu Availability Toggle
  const handleToggleMenuAvailability = async (itemId: string) => {
    const item = menuItems.find((it) => it.id === itemId);
    if (!item) return;
    const next = !item.isAvailable;
    try {
      await adminApi.updateMenuItem(itemId, { isAvailable: next });
      setMenuItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, isAvailable: next } : it))
      );
      showNotification(`${item.name} is now ${next ? 'IN STOCK' : 'OUT OF STOCK'}.`);
    } catch {
      showNotification(`Failed to toggle availability for ${item.name}.`);
    }
  };

  // KDS Ticket State Progression
  const handleAdvanceKdsTicket = async (tk: any) => {
    const nextStatus =
      tk.status === 'PLACED' ? 'PREPARING' : tk.status === 'PREPARING' ? 'READY' : 'SERVED';
    try {
      await adminApi.correctOrder(tk.orderId, {
        status: nextStatus,
        remarks: `SuperAdmin progressed ticket to ${nextStatus}`
      });
      setKdsTickets((prev) =>
        prev
          .map((item) => (item.id === tk.id ? { ...item, status: nextStatus } : item))
          .filter((item) => item.status !== 'SERVED')
      );
      showNotification(`${tk.id} progressed to ${nextStatus}.`);
    } catch {
      showNotification(`Failed to advance ticket ${tk.id}.`);
    }
  };

  if (!isLoading && restaurants.length === 0) {
    return (
      <div className="p-16 text-center bg-[#121826] border border-slate-800 rounded-3xl space-y-4 max-w-xl mx-auto shadow-2xl">
        <Building2 className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
        <h2 className="text-xl font-black text-white">No Restaurants Registered</h2>
        <p className="text-xs text-slate-400">
          No merchant partner accounts exist in the database yet. Onboard a restaurant from the Merchants workspace to activate the deep-dive operational controls.
        </p>
      </div>
    );
  }

  const selectedRest = currentRestaurant || restaurants[0] || {};
  const settledRevenue = bills
    .filter((b) => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + Number(b.grandTotal || 0), 0);
  const platformCommRate = selectedRest.commissionRatePercent || 15.0;
  const platformCommission = Math.round(settledRevenue * (platformCommRate / 100) * 100) / 100;

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
                  Restaurant Workspace
                </span>
                <span className="text-xs text-slate-400">
                  {restaurants.length} Registered Merchant{restaurants.length === 1 ? '' : 's'}
                </span>
              </div>
              <h1 className="text-xl font-black text-white mt-0.5">{selectedRest.name || 'Merchant'}</h1>
              <p className="text-xs text-slate-400">
                {selectedRest.city ? `${selectedRest.city}, ` : ''}{selectedRest.state || 'India'}
                {selectedRest.cuisineType ? ` • ${selectedRest.cuisineType}` : ''}
                {selectedRest.rating ? ` • Rating: ${selectedRest.rating} ★` : ''}
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
                    {r.name} {r.city ? `(${r.city})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Edit Restaurant Profile Button */}
            <button
              onClick={() => setIsEditProfileModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 border border-slate-700 transition cursor-pointer"
              title="Edit Restaurant Details & Business Info"
            >
              <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Details</span>
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
                ACTIVE
              </button>
              <button
                onClick={() => handleToggleLifecycle('PAUSED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedRest.status === 'PAUSED'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PAUSED
              </button>
              <button
                onClick={() => handleToggleLifecycle('SUSPENDED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedRest.status === 'SUSPENDED'
                    ? 'bg-rose-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SUSPENDED
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Info Pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-3 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-slate-500 font-bold">GSTIN:</span>
            <span className="font-mono text-white font-bold">{selectedRest.gstin || 'Not Provided'}</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-slate-500 font-bold">FSSAI:</span>
            <span className="font-mono text-white font-bold">{selectedRest.fssaiNumber || 'Not Provided'}</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-slate-500 font-bold">Platform Comm:</span>
            <span className="font-black text-cyan-400">{platformCommRate}%</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-slate-500 font-bold">GST Rate:</span>
            <span className="font-bold text-white">
              {(Number(selectedRest.cgstRatePercent || 2.5) + Number(selectedRest.sgstRatePercent || 2.5))}%
            </span>
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
          { key: 'KDS' as TenantSubTab, label: 'Kitchen Display', icon: Clock },
          { key: 'MENU' as TenantSubTab, label: 'Dishes & Live Stock', icon: UtensilsCrossed },
          { key: 'BILLING' as TenantSubTab, label: 'Cashier & Invoices', icon: Receipt },
          { key: 'TABLES' as TenantSubTab, label: 'Tables & Table QR Codes', icon: QrCodeIcon },
          { key: 'STAFF' as TenantSubTab, label: 'Staff & Roles', icon: Users },
          { key: 'SETTINGS' as TenantSubTab, label: 'Verification & Details', icon: Settings }
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
              <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Settled GMV</span>
              <h3 className="text-2xl font-black text-white mt-1">₹{settledRevenue.toFixed(2)}</h3>
              <p className="text-[10px] text-emerald-400 font-bold mt-1">Authoritative settled orders</p>
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
              <p className="text-[10px] text-slate-400 mt-1">Live order tickets</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{platformCommRate}% Platform Commission</span>
              <h3 className="text-2xl font-black text-purple-400 mt-1">₹{platformCommission.toFixed(2)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Auto-accrued to DineDeck</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Live Floor Table Grid ({selectedRest.name})</h3>
                <p className="text-xs text-slate-400">Click any table to inspect floor occupancy.</p>
              </div>
              <span className="text-xs text-emerald-400 font-bold">Real-time Sync</span>
            </div>

            {tables.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <QrCodeIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-400">No tables configured for this restaurant</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tables added to branches will populate the floor grid.</p>
              </div>
            ) : (
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
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{t.number}</span>
                        <span className="text-[9px] uppercase font-bold">{t.status}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Capacity: {t.capacity} Seats
                      </div>
                      <div className="text-[9px] text-cyan-400 font-mono truncate">
                        {t.qrCode}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
            <span className="text-xs text-cyan-400 font-bold">Real-time KDS</span>
          </div>

          {kdsTickets.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-400">No active kitchen orders</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Active kitchen order tickets (KOT) will appear here as diners place orders.</p>
            </div>
          ) : (
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
                      onClick={() => handleAdvanceKdsTicket(tk)}
                      className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
                    >
                      {tk.status === 'PLACED' ? 'Start Cooking' : tk.status === 'PREPARING' ? 'Mark Ready' : 'Mark Served'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: MENU & LIVE DISH STOCK */}
      {activeTab === 'MENU' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white">Live Menu Catalog ({selectedRest.name})</h3>
              <p className="text-xs text-slate-400">Toggle dish availability or update live stock status.</p>
            </div>
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
                {menuItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-slate-400">No dishes recorded in this restaurant's menu</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Dishes added in the menu management module will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  menuItems.map((dish) => (
                    <tr key={dish.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-white">{dish.name}</td>
                      <td className="p-3.5 text-slate-400">{dish.category || 'General'}</td>
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
                  ))
                )}
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
            <span className="text-xs text-slate-400">GSTIN: {selectedRest.gstin || 'Not Provided'}</span>
          </div>

          {bills.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-500">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-400">No invoices generated yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Bills settled at tables or POS counter will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bills.map((inv) => (
                <div key={inv.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono font-bold text-xs text-white">{inv.billNumber || inv.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${inv.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Dining Table</span>
                      <span className="text-white font-bold">{inv.tableNumber ? `Table #${inv.tableNumber}` : 'Counter'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>₹{Number(inv.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Taxes & Fees</span>
                      <span>₹{(Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0) + Number(inv.serviceCharge || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white font-black text-sm pt-1 border-t border-slate-800">
                      <span>Grand Total</span>
                      <span className="text-emerald-400">₹{Number(inv.grandTotal || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: TABLES & QR CODES */}
      {activeTab === 'TABLES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">Physical Table QR Codes ({selectedRest.name})</h3>
          </div>

          {tables.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-500">
              <QrCodeIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-400">No physical dining tables registered</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tables added to branches will generate secure digital QR codes here.</p>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* SUBTAB 6: STAFF & IAM */}
      {activeTab === 'STAFF' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">Authorized Restaurant Staff ({selectedRest.name})</h3>
          </div>

          {staff.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-400">No staff members enrolled yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Staff credentials and IAM roles can be configured in the IAM dashboard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {staff.map((st: any, i: number) => (
                <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                  <div className="font-bold text-white text-xs">{st.name}</div>
                  <div className="text-[10px] text-cyan-400 font-bold">{st.role}</div>
                  <div className="text-[10px] text-slate-400">{st.email}</div>
                  <div className="text-[10px] text-slate-500">{st.phone || 'No phone'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 7: SETTINGS & KYC COMPLIANCE */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white">Legal Profile & Compliance KYC</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-bold">Legal Business Name</span>
              <div className="p-3 bg-slate-950 rounded-xl text-white font-bold">
                {selectedRest.legalBusinessName || selectedRest.name || 'Not Provided'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-bold">Registered GSTIN</span>
              <div className="p-3 bg-slate-950 rounded-xl text-white font-mono">
                {selectedRest.gstin || 'Not Provided'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-bold">FSSAI Food License #</span>
              <div className="p-3 bg-slate-950 rounded-xl text-white font-mono">
                {selectedRest.fssaiNumber || 'Not Provided'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-bold">Platform Commission Rate</span>
              <div className="p-3 bg-slate-950 rounded-xl text-cyan-400 font-black">
                {platformCommRate}%
              </div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <span className="text-slate-500 font-bold">Full Physical Address</span>
              <div className="p-3 bg-slate-950 rounded-xl text-slate-300">
                {selectedRest.fullAddress || (selectedRest.city ? `${selectedRest.city}, India` : 'Not Provided')}
              </div>
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
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">GSTIN Number</label>
                  <input
                    type="text"
                    value={editFormData.gstin || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, gstin: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">FSSAI License #</label>
                  <input
                    type="text"
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
