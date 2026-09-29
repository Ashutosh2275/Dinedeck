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
  FileCheck
} from 'lucide-react';

type TenantSubTab =
  | 'HOME'
  | 'KDS'
  | 'BILLING'
  | 'MENU'
  | 'STAFF'
  | 'INVENTORY'
  | 'REPORTS'
  | 'SETTINGS';

export const AdminTenantDeepDive: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string>('rest_punjab_heritage');
  const [activeTab, setActiveTab] = useState<TenantSubTab>('HOME');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // Selected restaurant state
  const [currentRestaurant, setCurrentRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  // Load all restaurants
  const loadRestaurants = async () => {
    setIsLoading(true);
    const res = await adminApi.fetchRestaurants();
    if (res.success && res.data) {
      setRestaurants(res.data);
      if (!selectedRestId && res.data.length > 0) {
        setSelectedRestId(res.data[0].id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  // Whenever selectedRestId changes, load its deep-dive data
  useEffect(() => {
    if (!selectedRestId) return;
    const rest = restaurants.find((r) => r.id === selectedRestId);
    if (rest) {
      setCurrentRestaurant(rest);
    }
  }, [selectedRestId, restaurants]);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(''), 3500);
  };

  const selectedRest = currentRestaurant || restaurants.find((r) => r.id === selectedRestId) || {
    name: 'The Punjab Heritage Kitchen',
    city: 'Mumbai',
    rating: 4.9,
    cuisineType: 'North Indian, Mughlai, Tandoor',
    costForTwo: 800,
    fullAddress: 'Plot 42, Bandra Kurla Complex, Bandra West, Mumbai 400050',
    gstin: '27AAAAA0000A1Z5',
    fssaiNumber: '11521000001234',
    cgstRatePercent: 2.5,
    sgstRatePercent: 2.5,
    serviceChargePercent: 5.0
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Top Tenant Control Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Multi-Tenant Super-Command
              </span>
              <span className="text-xs text-slate-400">Total Partners: {restaurants.length || 6}</span>
            </div>
            <h1 className="text-xl font-black text-white mt-1">{selectedRest.name}</h1>
            <p className="text-xs text-slate-400">
              {selectedRest.city} • {selectedRest.cuisineType} • Rating: {selectedRest.rating} ★
            </p>
          </div>
        </div>

        {/* Restaurant Switcher Dropdown */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <select
              value={selectedRestId}
              onChange={(e) => setSelectedRestId(e.target.value)}
              className="appearance-none bg-slate-950 border border-cyan-500/40 hover:border-cyan-400 text-white text-xs font-bold py-2.5 pl-4 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-inner cursor-pointer"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.name} ({r.city})
                </option>
              ))}
              {restaurants.length === 0 && (
                <>
                  <option value="rest_punjab_heritage">The Punjab Heritage Kitchen (Mumbai)</option>
                  <option value="rest_dakshin_bistro">Dakshin Coastal Bistro & Tiffin (Bengaluru)</option>
                  <option value="rest_dum_pukht_biryani">Dum Pukht Royal Biryani House (Hyderabad)</option>
                  <option value="rest_thali_royal">Thali of Rajasthan & Gujarat (Jaipur)</option>
                </>
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={loadRestaurants}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition cursor-pointer"
            title="Refresh Tenant Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
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
          { key: 'HOME' as TenantSubTab, label: 'Home & Overview', icon: Activity },
          { key: 'KDS' as TenantSubTab, label: 'Kitchen KDS', icon: Clock },
          { key: 'BILLING' as TenantSubTab, label: 'Cashier & Billing', icon: Receipt },
          { key: 'MENU' as TenantSubTab, label: 'Dishes & Menu', icon: UtensilsCrossed },
          { key: 'STAFF' as TenantSubTab, label: 'Staff & IAM', icon: Users },
          { key: 'INVENTORY' as TenantSubTab, label: 'Stock & Inventory', icon: Package },
          { key: 'REPORTS' as TenantSubTab, label: 'Reports & Analytics', icon: BarChart3 },
          { key: 'SETTINGS' as TenantSubTab, label: 'Settings & Compliance', icon: Settings }
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

      {/* TAB 1: HOME & OVERVIEW */}
      {activeTab === 'HOME' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Today Gross Revenue</span>
              <h3 className="text-2xl font-black text-white mt-1">₹48,920</h3>
              <p className="text-[10px] text-emerald-400 font-bold mt-1">↑ +14.2% vs yesterday</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Tables Seated</span>
              <h3 className="text-2xl font-black text-white mt-1">8 / 12</h3>
              <p className="text-[10px] text-cyan-400 font-bold mt-1">66.7% occupancy</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Active Kitchen KOTs</span>
              <h3 className="text-2xl font-black text-amber-400 mt-1">4 Active</h3>
              <p className="text-[10px] text-slate-400 mt-1">Avg prep: 14 mins</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Settled Invoices</span>
              <h3 className="text-2xl font-black text-white mt-1">26 Bills</h3>
              <p className="text-[10px] text-slate-400 mt-1">0 voided bills</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black text-white">Live Floor Table Grid</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((t) => {
                  const isSeated = [2, 4, 5, 7, 8, 9, 11, 12].includes(t);
                  return (
                    <div
                      key={t}
                      className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${
                        isSeated
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">Table #{t}</span>
                        <span className="text-[9px] uppercase font-bold">
                          {isSeated ? 'Occupied' : 'Vacant'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isSeated ? '4 Guests • 2 KOTs' : 'Ready for guests'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black text-white">Live Service Calls</h3>
              <div className="space-y-2.5">
                {[
                  { table: 'Table #4', req: 'Water & Cutlery', time: '1 min ago', status: 'PENDING' },
                  { table: 'Table #7', req: 'Head Captain Assistance', time: '3 mins ago', status: 'ASSIGNED' },
                  { table: 'Table #2', req: 'Bill Settlement Request', time: '6 mins ago', status: 'RESOLVED' }
                ].map((s, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{s.table} • {s.req}</div>
                      <div className="text-[10px] text-slate-400">{s.time}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      s.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KITCHEN KDS */}
      {activeTab === 'KDS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Live Cooking Station Tickets (4 Active KOTs)
            </h3>
            <span className="text-xs text-cyan-400 font-bold">Auto-sync: Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'KOT-1041', table: 'Table #4', time: '4 mins ago', status: 'PREPARING', items: ['2x Angaari Paneer Tikka', '1x Bhatinda Murgh Malai Tikka'] },
              { id: 'KOT-1042', table: 'Table #8', time: '7 mins ago', status: 'PLACED', items: ['1x Royal Awadhi Handi Biryani', '2x Roomali Roti'] },
              { id: 'KOT-1043', table: 'Table #2', time: '12 mins ago', status: 'PREPARING', items: ['1x Dal Makhani Heritage', '2x Butter Garlic Naan'] }
            ].map((k) => (
              <div key={k.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="font-black text-xs text-white">{k.id}</span>
                    <span className="text-[10px] text-cyan-400 font-bold ml-2">{k.table}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-400 uppercase">
                    {k.status}
                  </span>
                </div>
                <div className="space-y-1 py-1">
                  {k.items.map((it, i) => (
                    <div key={i} className="text-xs text-slate-200 font-medium">{it}</div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{k.time}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => showNotification(`KOT ${k.id} marked READY`)}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-black rounded-lg transition"
                    >
                      Mark Ready
                    </button>
                    <button
                      onClick={() => showNotification(`KOT ${k.id} rejected`)}
                      className="px-2 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[10px] font-black rounded-lg transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CASHIER & BILLING */}
      {activeTab === 'BILLING' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Settled & Pending Invoices</h3>
            <button
              onClick={() => showNotification('Exporting GST B2C Sales Ledger (CSV)...')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export Tax Summary</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black text-slate-400 uppercase">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Table</th>
                  <th className="py-3 px-3">Subtotal</th>
                  <th className="py-3 px-3">GST (5%)</th>
                  <th className="py-3 px-3">Service (5%)</th>
                  <th className="py-3 px-3">Grand Total</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[
                  { inv: 'INV-2026-4358', table: 'Table #4', sub: '₹378.00', gst: '₹18.90', svc: '₹18.90', total: '₹415.80', mode: 'UPI (Pending)' },
                  { inv: 'INV-2026-4357', table: 'Table #2', sub: '₹1,240.00', gst: '₹62.00', svc: '₹62.00', total: '₹1,364.00', mode: 'Cash (Settled)' },
                  { inv: 'INV-2026-4356', table: 'Table #9', sub: '₹2,100.00', gst: '₹105.00', svc: '₹105.00', total: '₹2,310.00', mode: 'Card (Settled)' }
                ].map((b, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-mono font-bold text-white">{b.inv}</td>
                    <td className="py-3 px-3 text-cyan-400 font-bold">{b.table}</td>
                    <td className="py-3 px-3 text-slate-300">{b.sub}</td>
                    <td className="py-3 px-3 text-slate-300">{b.gst}</td>
                    <td className="py-3 px-3 text-slate-300">{b.svc}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">{b.total}</td>
                    <td className="py-3 px-3 text-slate-300">{b.mode}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => showNotification(`Receipt for ${b.inv} re-sent`)}
                        className="text-cyan-400 hover:underline font-bold text-[11px]"
                      >
                        Print Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DISHES & MENU */}
      {activeTab === 'MENU' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Restaurant Menu Items (86 Inventory Sync)</h3>
            <span className="text-xs text-slate-400">Total dishes: 32</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: 'Angaari Paneer Tikka', cat: 'Starters', price: '₹299.20', inStock: true, veg: true },
              { name: 'Bhatinda Murgh Malai Tikka', cat: 'Starters', price: '₹378.00', inStock: true, veg: false },
              { name: 'Dal Makhani Heritage', cat: 'Main Course', price: '₹340.00', inStock: true, veg: true },
              { name: 'Royal Awadhi Dum Biryani', cat: 'Biryani & Rice', price: '₹480.00', inStock: false, veg: false }
            ].map((it, idx) => (
              <div key={idx} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${it.veg ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                    <span className="text-xs font-bold text-white">{it.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{it.cat} • {it.price}</div>
                </div>
                <button
                  onClick={() => showNotification(`Item "${it.name}" stock status toggled`)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition ${
                    it.inStock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {it.inStock ? 'In Stock' : '86 Out of Stock'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: STAFF & IAM */}
      {activeTab === 'STAFF' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Restaurant Staff Members & Security PINs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Ramesh Sharma', role: 'Head Captain', email: 'captain.ramesh@punjabheritage.in', pin: '••••' },
              { name: 'Sanjay Rawat', role: 'Executive Chef', email: 'chef.sanjay@punjabheritage.in', pin: '••••' },
              { name: 'Pooja Nair', role: 'Head Cashier', email: 'pooja.cashier@punjabheritage.in', pin: '••••' }
            ].map((st, i) => (
              <div key={i} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-white">{st.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-400 uppercase">{st.role}</span>
                </div>
                <p className="text-[10px] text-slate-400">{st.email}</p>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Fast PIN Access: {st.pin}</span>
                  <span className="text-emerald-400 font-bold">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: STOCK & INVENTORY */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Raw Ingredients & Consumption Tracking</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { item: 'Paneer (Cottage Cheese)', qty: '18.5 kg', status: 'HEALTHY' },
              { item: 'Amul Butter', qty: '4.2 kg', status: 'LOW_STOCK' },
              { item: 'Basmati Rice (Daawat)', qty: '45.0 kg', status: 'HEALTHY' },
              { item: 'Kasuri Methi', qty: '1.2 kg', status: 'HEALTHY' }
            ].map((inv, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-bold text-white block">{inv.item}</span>
                <span className="text-lg font-black text-cyan-400 mt-1 block">{inv.qty}</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase mt-1 ${
                  inv.status === 'LOW_STOCK' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: REPORTS & ANALYTICS */}
      {activeTab === 'REPORTS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Sales Analytics & Hourly Rush</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Peak Dining Hours</h4>
              <div className="space-y-1.5 pt-2 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>1:00 PM – 3:30 PM (Lunch Rush)</span>
                  <span className="font-bold text-white">42% of volume</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>8:00 PM – 11:00 PM (Dinner Rush)</span>
                  <span className="font-bold text-white">58% of volume</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Top 3 Bestselling Dishes</h4>
              <div className="space-y-1.5 pt-2 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>1. Angaari Paneer Tikka</span>
                  <span className="font-bold text-emerald-400">142 orders</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>2. Bhatinda Murgh Malai Tikka</span>
                  <span className="font-bold text-emerald-400">118 orders</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>3. Dal Makhani Heritage</span>
                  <span className="font-bold text-emerald-400">96 orders</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: SETTINGS & COMPLIANCE */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Taxes, Compliance & Branch Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-cyan-400 uppercase">GST & Billing Rates</h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">CGST Rate</label>
                  <div className="font-black text-white">{selectedRest.cgstRatePercent || 2.5}%</div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">SGST Rate</label>
                  <div className="font-black text-white">{selectedRest.sgstRatePercent || 2.5}%</div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Service Charge</label>
                  <div className="font-black text-white">{selectedRest.serviceChargePercent || 5.0}%</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-cyan-400 uppercase">Statutory Licenses</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">GSTIN:</span>
                  <span className="font-mono text-white">{selectedRest.gstin || '27AAAAA0000A1Z5'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">FSSAI Number:</span>
                  <span className="font-mono text-white">{selectedRest.fssaiNumber || '11521000001234'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
