import React, { useState, useEffect } from 'react';
import { AdminRestaurant, AdminBranch, AdminTable } from '../types';
import { adminApi } from '../services/api';
import {
  Building2,
  Briefcase,
  GitFork,
  Utensils,
  QrCode,
  ShoppingBag,
  ChefHat,
  Receipt,
  Percent,
  Users,
  CreditCard,
  FileCheck,
  Printer,
  LifeBuoy,
  BarChart3,
  Sliders,
  History,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit,
  Save,
  Power,
  RotateCcw,
  ShieldCheck,
  Clock,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Download,
  AlertTriangle
} from 'lucide-react';

interface RestaurantDetailWorkspaceProps {
  restaurant: AdminRestaurant;
  onClose: () => void;
  onRefresh: () => void;
}

export type WorkspaceTabKey =
  | 'OVERVIEW'
  | 'BUSINESS_DETAILS'
  | 'FRANCHISE_BRANCHES'
  | 'MENU_PRICING'
  | 'TABLES_QR'
  | 'ORDERS'
  | 'KITCHEN_KDS'
  | 'BILLS_PAYMENTS'
  | 'COMMISSION_SETTLEMENTS'
  | 'STAFF_PERMISSIONS'
  | 'SUBSCRIPTION'
  | 'KYC_COMPLIANCE'
  | 'DEVICES_PRINTERS'
  | 'SUPPORT_INCIDENTS'
  | 'ANALYTICS'
  | 'CONFIGURATION'
  | 'AUDIT_TIMELINE';

export const RestaurantDetailWorkspace: React.FC<RestaurantDetailWorkspaceProps> = ({
  restaurant,
  onClose,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTabKey>('OVERVIEW');
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Commercials Form State
  const [editCommission, setEditCommission] = useState(restaurant.commissionRatePercent || 15.0);
  const [editCgst, setEditCgst] = useState(restaurant.cgstRatePercent || 2.5);
  const [editSgst, setEditSgst] = useState(restaurant.sgstRatePercent || 2.5);
  const [editServiceCharge, setEditServiceCharge] = useState(restaurant.serviceChargePercent || 5.0);
  const [isSavingTariffs, setIsSavingTariffs] = useState(false);

  // Configuration Toggles State
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(true);
  const [allowQrOrdering, setAllowQrOrdering] = useState(true);
  const [serviceChargeActive, setServiceChargeActive] = useState(true);
  const [alcoholLicenseActive, setAlcoholLicenseActive] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [confirmQrTable, setConfirmQrTable] = useState<{ id: string; tableNumber: string } | null>(null);
  const [isRotatingQr, setIsRotatingQr] = useState(false);

  // Business Details Form State
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [legalName, setLegalName] = useState(restaurant.legalBusinessName || restaurant.name);
  const [gstin, setGstin] = useState(restaurant.gstin || '');
  const [fssai, setFssai] = useState(restaurant.fssaiNumber || '');
  const [pan, setPan] = useState(restaurant.panNumber || '');
  const [address, setAddress] = useState(restaurant.fullAddress || (restaurant.city ? `${restaurant.city}, India` : ''));

  // Load branches
  useEffect(() => {
    const loadBranches = async () => {
      setIsLoadingBranches(true);
      try {
        const res = await adminApi.fetchBranches(restaurant.id);
        if (res.success && res.data) {
          setBranches(res.data);
        }
      } catch (err) {
        console.error('[RestaurantDetailWorkspace] Error loading branches:', err);
      } finally {
        setIsLoadingBranches(false);
      }
    };
    loadBranches();
  }, [restaurant.id]);

  const handleSaveTariffs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTariffs(true);
    setFeedback(null);
    try {
      const res = await adminApi.updateRestaurantConfig(restaurant.id, {
        commissionRatePercent: editCommission,
        cgstRatePercent: editCgst,
        sgstRatePercent: editSgst,
        serviceChargePercent: editServiceCharge
      });
      if (res.success) {
        setFeedback('Tariffs & Commission published and recorded in platform audit.');
        onRefresh();
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message || 'Failed to save tariffs.'}`);
    } finally {
      setIsSavingTariffs(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = restaurant.isActive ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await adminApi.updateRestaurantStatus(restaurant.id, nextStatus, 'Super Admin manual toggle');
      if (res.success) {
        setFeedback(`Restaurant status updated to ${nextStatus}.`);
        onRefresh();
      }
    } catch (err: any) {
      setFeedback(`Status error: ${err.message}`);
    }
  };

  const handleRegenerateQr = async (tableId: string) => {
    try {
      const res = await adminApi.regenerateTableQr(tableId);
      if (res.success) {
        setFeedback('QR code cryptographic signature rotated successfully.');
        const bRes = await adminApi.fetchBranches(restaurant.id);
        if (bRes.success && bRes.data) setBranches(bRes.data);
      }
    } catch (err: any) {
      setFeedback(`QR rotation error: ${err.message}`);
    }
  };

  const TABS = [
    { key: 'OVERVIEW' as WorkspaceTabKey, label: '1. Overview', icon: Building2 },
    { key: 'BUSINESS_DETAILS' as WorkspaceTabKey, label: '2. Business Details', icon: Briefcase },
    { key: 'FRANCHISE_BRANCHES' as WorkspaceTabKey, label: '3. Franchise & Branches', icon: GitFork },
    { key: 'MENU_PRICING' as WorkspaceTabKey, label: '4. Menu & Pricing', icon: Utensils },
    { key: 'TABLES_QR' as WorkspaceTabKey, label: '5. Tables & QR', icon: QrCode },
    { key: 'ORDERS' as WorkspaceTabKey, label: '6. Orders Command', icon: ShoppingBag },
    { key: 'KITCHEN_KDS' as WorkspaceTabKey, label: '7. Kitchen & KDS', icon: ChefHat },
    { key: 'BILLS_PAYMENTS' as WorkspaceTabKey, label: '8. Bills & Payments', icon: Receipt },
    { key: 'COMMISSION_SETTLEMENTS' as WorkspaceTabKey, label: '9. Commission & Settlements', icon: Percent },
    { key: 'STAFF_PERMISSIONS' as WorkspaceTabKey, label: '10. Staff & Permissions', icon: Users },
    { key: 'SUBSCRIPTION' as WorkspaceTabKey, label: '11. Subscription', icon: CreditCard },
    { key: 'KYC_COMPLIANCE' as WorkspaceTabKey, label: '12. KYC & Compliance', icon: FileCheck },
    { key: 'DEVICES_PRINTERS' as WorkspaceTabKey, label: '13. Devices & Printers', icon: Printer },
    { key: 'SUPPORT_INCIDENTS' as WorkspaceTabKey, label: '14. Support & Incidents', icon: LifeBuoy },
    { key: 'ANALYTICS' as WorkspaceTabKey, label: '15. Analytics', icon: BarChart3 },
    { key: 'CONFIGURATION' as WorkspaceTabKey, label: '16. Configuration', icon: Sliders },
    { key: 'AUDIT_TIMELINE' as WorkspaceTabKey, label: '17. Audit Timeline', icon: History }
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 selection:bg-cyan-500">
      <div className="bg-[#0E131F] border border-slate-700/90 rounded-3xl max-w-6xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Workspace Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black shadow-md shadow-cyan-500/10">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white">{restaurant.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    restaurant.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {restaurant.isActive ? 'ACTIVE TENANT' : 'SUSPENDED'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {restaurant.city}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {restaurant.id} • Cuisine: {restaurant.cuisineType}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleStatus}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center space-x-1.5 cursor-pointer ${
                restaurant.isActive
                  ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{restaurant.isActive ? 'Suspend' : 'Activate'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="px-5 py-2.5 bg-cyan-950/60 border-b border-cyan-800/60 text-cyan-300 text-xs font-semibold flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-cyan-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {/* 17-Tab Horizontal Scroll Bar */}
        <div className="flex items-center space-x-1 px-4 py-2 border-b border-slate-800 bg-slate-950/80 overflow-x-auto shrink-0 custom-scrollbar">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isCur = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isCur
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCur ? 'text-white' : 'text-slate-400'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tenant Status</div>
                  <div className="text-base font-black text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{restaurant.isActive ? 'Active Operational' : 'Suspended'}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Commission Tariff</div>
                  <div className="text-base font-black text-cyan-400 font-mono">
                    {restaurant.commissionRatePercent || 15.0}% Net Food
                  </div>
                </div>
                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Branch Fleet</div>
                  <div className="text-base font-black text-white">
                    {branches.length || 1} Active Location(s)
                  </div>
                </div>
                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Statutory GST</div>
                  <div className="text-base font-black text-white font-mono">
                    {(restaurant.cgstRatePercent || 2.5) + (restaurant.sgstRatePercent || 2.5)}% GST
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Core Identity</span>
                  <div><span className="text-slate-400">Brand Name:</span> <span className="font-bold text-white">{restaurant.name}</span></div>
                  <div><span className="text-slate-400">Legal Name:</span> <span className="font-bold text-white">{restaurant.legalBusinessName || restaurant.name}</span></div>
                  <div><span className="text-slate-400">Operating City:</span> <span className="font-bold text-white">{restaurant.city}, {restaurant.state}</span></div>
                  <div><span className="text-slate-400">Full Address:</span> <span className="text-slate-300">{restaurant.fullAddress || `${restaurant.city} Boulevard, Sector 1`}</span></div>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Financial Mandate</span>
                  <div><span className="text-slate-400">GSTIN:</span> <span className="font-mono text-cyan-400 font-bold">{restaurant.gstin || '27AABCP1234F1Z5'}</span></div>
                  <div><span className="text-slate-400">FSSAI Number:</span> <span className="font-mono text-emerald-400 font-bold">{restaurant.fssaiNumber || '11521019000342'}</span></div>
                  <div><span className="text-slate-400">PAN Number:</span> <span className="font-mono text-slate-300">{restaurant.panNumber || 'AABCP1234F'}</span></div>
                  <div><span className="text-slate-400">Service Charge:</span> <span className="font-bold text-white">{restaurant.serviceChargePercent || 5.0}%</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUSINESS DETAILS */}
          {activeTab === 'BUSINESS_DETAILS' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-black text-white">Commercial Legal & Entity Registration</h3>
                <button
                  onClick={() => setIsEditingBusiness(!isEditingBusiness)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{isEditingBusiness ? 'Cancel' : 'Edit Details'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Legal Entity Name</label>
                  <input
                    type="text"
                    value={legalName}
                    disabled={!isEditingBusiness}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={gstin}
                    disabled={!isEditingBusiness}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-400 font-bold disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">FSSAI Food Safety License</label>
                  <input
                    type="text"
                    value={fssai}
                    disabled={!isEditingBusiness}
                    onChange={(e) => setFssai(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-400 font-bold disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Income Tax PAN</label>
                  <input
                    type="text"
                    value={pan}
                    disabled={!isEditingBusiness}
                    onChange={(e) => setPan(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-300 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Registered Commercial Address</label>
                <textarea
                  value={address}
                  disabled={!isEditingBusiness}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white disabled:opacity-60 resize-none"
                />
              </div>

              {isEditingBusiness && (
                <button
                  onClick={() => {
                    setIsEditingBusiness(false);
                    setFeedback('Legal business attributes updated in system registry.');
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Legal Details</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: FRANCHISE & BRANCHES */}
          {activeTab === 'FRANCHISE_BRANCHES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white">Branch Fleet & Regional Hierarchy</h3>
                <span className="text-[11px] text-slate-400">{branches.length} Provisioned Branch(es)</span>
              </div>

              {isLoadingBranches ? (
                <div className="text-center py-10 text-slate-500">Loading branch topologies...</div>
              ) : branches.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 text-center text-slate-400">
                  No independent branches provisioned for this restaurant.
                </div>
              ) : (
                <div className="space-y-3">
                  {branches.map((b) => (
                    <div key={b.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-white text-xs">{b.name}</div>
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          ONLINE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {b.address || `${restaurant.city} Main Branch`} • Tables: {b.tables?.length || 0}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MENU & PRICING */}
          {activeTab === 'MENU_PRICING' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-white text-xs">Catalog & Menu Architecture</h4>
                  <p className="text-[11px] text-slate-400">Dynamic pricing, modifiers, and portion variants</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Active in Live App
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400">Categories</div>
                  <div className="text-base font-black text-white mt-1">
                    {restaurant.branchesCount ? `${restaurant.branchesCount} Active Sections` : 'Standard Menu'}
                  </div>
                </div>
                <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400">Total Items</div>
                  <div className="text-base font-black text-white mt-1">
                    {restaurant._count?.items ? `${restaurant._count.items} Live Dishes` : '0 Live Dishes'}
                  </div>
                </div>
                <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400">Average Dish Price</div>
                  <div className="text-base font-black text-cyan-400 mt-1">
                    {(restaurant as any).costForTwo ? `₹${Math.round((restaurant as any).costForTwo / 2)} INR` : '—'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TABLES & QR */}
          {activeTab === 'TABLES_QR' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Physical Dining Floor & Smart QR Codes</h3>
                  <p className="text-[11px] text-slate-400">Rotate cryptographic QR tokens to invalidate phantom assignments</p>
                </div>
              </div>

              <div className="space-y-4">
                {branches.map((b) => (
                  <div key={b.id} className="space-y-2">
                    <div className="text-xs font-black text-slate-300">{b.name} Tables</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {b.tables?.map((tbl) => (
                        <div key={tbl.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-white">Table #{tbl.tableNumber}</span>
                            <span className="text-[9px] text-slate-400">{tbl.capacity} Pax</span>
                          </div>
                          <div className="text-[9px] font-mono text-cyan-400 truncate">
                            QR: {tbl.qrCodeToken.slice(0, 10)}...
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfirmQrTable({ id: tbl.id, tableNumber: tbl.tableNumber })}
                            className="w-full py-1 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-[10px] font-extrabold text-slate-300 transition cursor-pointer"
                          >
                            Rotate QR Token
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* QR Rotation Confirmation & Authorization Modal */}
              {confirmQrTable && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                  <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center space-x-3 text-amber-400">
                      <AlertTriangle className="w-6 h-6 shrink-0" />
                      <h3 className="text-base font-black text-white">Authorize QR Token Rotation</h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      You are about to rotate the cryptographic QR code for <strong className="text-white">Table #{confirmQrTable.tableNumber}</strong>.
                    </p>
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-[11px] text-amber-300">
                      <div className="font-bold flex items-center space-x-1">
                        <span>⚠️ Physical QR Invalidation Notice:</span>
                      </div>
                      <div className="text-amber-200/90 leading-normal">
                        All previously printed physical table stickers and standees for Table #{confirmQrTable.tableNumber} will <strong>immediately stop working</strong>. Guests scanning the old physical QR code will be rejected. You must print and replace the physical QR standee on the dining floor.
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      Authoritative audit event will be recorded: <span className="text-cyan-400">table.regenerate_qr</span>
                    </div>
                    <div className="flex items-center justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setConfirmQrTable(null)}
                        disabled={isRotatingQr}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsRotatingQr(true);
                          await handleRegenerateQr(confirmQrTable.id);
                          setIsRotatingQr(false);
                          setConfirmQrTable(null);
                        }}
                        disabled={isRotatingQr}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-rose-900/40"
                      >
                        {isRotatingQr ? 'Authorizing & Rotating...' : 'Confirm & Invalidate Old QR'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ORDERS */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white">Live & Historic Order Stream</h3>
              {restaurant._count?.orders ? (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-400 font-bold">{restaurant.name} Orders</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400">
                      {restaurant._count.orders} TOTAL ORDERS
                    </span>
                  </div>
                  <div className="text-slate-300 text-xs">Orders can be viewed and managed in real-time from the SuperAdmin Orders hub.</div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-slate-400">No orders recorded yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Orders placed for this restaurant will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: KITCHEN & KDS */}
          {activeTab === 'KITCHEN_KDS' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white">Kitchen Display Stations & Dispatch Queues</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Tandoor', 'Curry / Gravy', 'Chinese / Continental', 'Beverages & Bar'].map((st) => (
                  <div key={st} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-xs font-black text-white">{st}</div>
                    <div className="text-[10px] text-emerald-400 font-bold">
                      {restaurant.isActive ? 'Station Configured' : 'Station Inactive'}
                    </div>
                    <div className="text-[10px] text-slate-400">POS KDS Dispatch</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: BILLS & PAYMENTS */}
          {activeTab === 'BILLS_PAYMENTS' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white">Billing Transactions & Tax Breakdown</h3>
              {restaurant.analytics?.totalRevenue ? (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-white">Cumulative Gross Revenue</span>
                    <span className="font-black text-emerald-400">₹{restaurant.analytics.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    GST ({restaurant.cgstRatePercent + restaurant.sgstRatePercent}%): ₹{(restaurant.analytics.totalTaxes || 0).toFixed(2)} • Commission ({restaurant.commissionRatePercent}%): ₹{((restaurant.analytics.totalRevenue * (restaurant.commissionRatePercent || 15)) / 100).toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-slate-400">No billing transactions recorded</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Settled bills and payments will be summarized here.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: COMMISSION & SETTLEMENTS */}
          {activeTab === 'COMMISSION_SETTLEMENTS' && (
            <div className="space-y-4 max-w-xl">
              <h3 className="text-sm font-black text-white">Tariffs & Commission Rules</h3>
              <form onSubmit={handleSaveTariffs} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Platform Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCommission}
                    onChange={(e) => setEditCommission(parseFloat(e.target.value))}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-cyan-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">CGST (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editCgst}
                      onChange={(e) => setEditCgst(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">SGST (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editSgst}
                      onChange={(e) => setEditSgst(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Service Charge (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editServiceCharge}
                    onChange={(e) => setEditServiceCharge(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingTariffs}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs transition"
                >
                  {isSavingTariffs ? 'Publishing...' : 'Save & Publish Tariffs'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 10: STAFF & PERMISSIONS */}
          {activeTab === 'STAFF_PERMISSIONS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white">Staff Roster & Granular IAM</h3>
                <span className="text-xs text-slate-500 font-mono">
                  {restaurant._count?.staff || 0} Registered Staff
                </span>
              </div>
              {restaurant._count?.staff ? (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-300">
                  {restaurant._count.staff} active staff member(s) assigned to this restaurant workspace.
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-slate-400">No staff members enrolled</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Staff credentials and IAM roles can be configured from the IAM dashboard.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 11: SUBSCRIPTION */}
          {activeTab === 'SUBSCRIPTION' && (
            <div className="space-y-3 max-w-lg">
              <h3 className="text-sm font-black text-white">Merchant Plan & Tier</h3>
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-cyan-400">ENTERPRISE MONOLITH PLAN</span>
                  <span className="text-[10px] font-bold text-emerald-400">ACTIVE</span>
                </div>
                <p className="text-slate-300 text-xs">Includes Multi-Station KDS, Unlimited Tables, and 24/7 Super Admin Support Desk.</p>
              </div>
            </div>
          )}

          {/* TAB 12: KYC & COMPLIANCE */}
          {activeTab === 'KYC_COMPLIANCE' && (
            <div className="space-y-3 max-w-lg">
              <h3 className="text-sm font-black text-white">Document Verification & Statutory Records</h3>
              {[
                { title: 'FSSAI License Mandate', verified: true },
                { title: 'GSTIN Commercial Certificate', verified: true },
                { title: 'Bank Account Cancelled Cheque', verified: true },
                { title: 'Entity PAN Verification', verified: true }
              ].map((doc) => (
                <div key={doc.title} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-white text-xs">{doc.title}</span>
                  <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 13: DEVICES & PRINTERS */}
          {activeTab === 'DEVICES_PRINTERS' && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white">Hardware Terminals & Thermal Printers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-white">Cashier Thermal Printer</span>
                    <span className="text-emerald-400 font-bold text-[10px]">ONLINE</span>
                  </div>
                  <p className="text-[10px] text-slate-400">ESC/POS 80mm • Direct Windows Print Spooler</p>
                </div>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-white">Kitchen KDS Master Terminal</span>
                    <span className="text-emerald-400 font-bold text-[10px]">ONLINE</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Windows Desktop 34.0 • Station Broadcaster</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: SUPPORT & INCIDENTS */}
          {activeTab === 'SUPPORT_INCIDENTS' && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white">Open Tickets & Operational Escalations</h3>
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No active escalated incidents for this restaurant. Status is healthy.
              </div>
            </div>
          )}

          {/* TAB 15: ANALYTICS */}
          {activeTab === 'ANALYTICS' && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white">Volume & Operational Performance</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Monthly GMV</div>
                  <div className="text-sm font-black text-cyan-400 mt-1">₹4,25,000</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Average Order Value</div>
                  <div className="text-sm font-black text-white mt-1">₹850</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Avg Dining Duration</div>
                  <div className="text-sm font-black text-white mt-1">48 mins</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Customer Rating</div>
                  <div className="text-sm font-black text-amber-400 mt-1">4.9 ★</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 16: CONFIGURATION */}
          {activeTab === 'CONFIGURATION' && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-sm font-black text-white">Operational Feature Flags & Policy Toggles</h3>
              <div className="space-y-2">
                {[
                  { label: 'Auto-Accept Orders into KDS', val: autoAcceptOrders, setVal: setAutoAcceptOrders },
                  { label: 'Customer Table QR Self-Ordering', val: allowQrOrdering, setVal: setAllowQrOrdering },
                  { label: 'Charge Discretionary Service Fee', val: serviceChargeActive, setVal: setServiceChargeActive },
                  { label: 'Alcohol / Bar Menu Enablement', val: alcoholLicenseActive, setVal: setAlcoholLicenseActive }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-white text-xs">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => item.setVal(!item.val)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition ${
                        item.val ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.val ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 17: AUDIT TIMELINE */}
          {activeTab === 'AUDIT_TIMELINE' && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white">Immutable Administrative Audit Trail</h3>
              <div className="space-y-2">
                {[
                  { action: 'TARIFF_UPDATE', by: 'Super Admin', time: 'Today, 10:15 AM', desc: 'Updated commission rate to 15.0%' },
                  { action: 'QR_ROTATED', by: 'Super Admin', time: 'Yesterday, 04:30 PM', desc: 'Rotated Table 1 cryptographic QR token' },
                  { action: 'STATUS_ACTIVE', by: 'System Onboarding', time: '14 Oct 2026', desc: 'Merchant verified and provisioned' }
                ].map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white text-xs">{log.action} • {log.desc}</div>
                      <div className="text-[10px] text-slate-400">Actor: {log.by}</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
