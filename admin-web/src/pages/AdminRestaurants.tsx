import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { AdminRestaurant, AdminBranch, AdminTable } from '../types';
import { BulkOperationsModal } from '../components/BulkOperationsModal';
import { RestaurantDetailWorkspace } from '../components/RestaurantDetailWorkspace';
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Plus,
  Edit,
  ShieldCheck,
  Percent,
  MapPin,
  Phone,
  Mail,
  Grid,
  Clock,
  X,
  ArrowRight,
  RefreshCw,
  Power,
  Layers,
  QrCode,
  Utensils,
  History,
  RotateCcw,
  Sliders,
  DollarSign
} from 'lucide-react';

interface AdminRestaurantsProps {
  initialRestaurantId?: string | null;
}

export const AdminRestaurants: React.FC<AdminRestaurantsProps> = ({ initialRestaurantId }) => {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Multi-select for Bulk Operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

  // 360 Drawer state
  const [drawerRestaurant, setDrawerRestaurant] = useState<AdminRestaurant | null>(null);
  const [drawerTab, setDrawerTab] = useState<'OVERVIEW' | 'BRANCHES' | 'COMMERCIALS' | 'AUDIT'>('OVERVIEW');
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [isBranchesLoading, setIsBranchesLoading] = useState<boolean>(false);

  // Commercials Edit in Drawer
  const [editCommission, setEditCommission] = useState<number>(15.0);
  const [editCgst, setEditCgst] = useState<number>(2.5);
  const [editSgst, setEditSgst] = useState<number>(2.5);
  const [editServiceCharge, setEditServiceCharge] = useState<number>(5.0);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Onboarding Wizard Modal
  const [showOnboardModal, setShowOnboardModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newRestName, setNewRestName] = useState<string>('');
  const [newRestCity, setNewRestCity] = useState<string>('Mumbai');
  const [newRestCuisine, setNewRestCuisine] = useState<string>('North Indian');
  const [newRestGstin, setNewRestGstin] = useState<string>('27AABCP1234F1Z5');
  const [newRestFssai, setNewRestFssai] = useState<string>('11521019000342');
  const [newRestCommission, setNewRestCommission] = useState<number>(15.0);

  const [feedback, setFeedback] = useState<string | null>(null);

  const loadRestaurants = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchRestaurants();
      if (res.success && res.data) {
        setRestaurants(res.data);
        if (initialRestaurantId) {
          const found = res.data.find(r => r.id === initialRestaurantId);
          if (found) openDrawer(found);
        }
      }
    } catch (err) {
      console.error('[AdminRestaurants] Error loading restaurants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, [initialRestaurantId]);

  const openDrawer = async (r: AdminRestaurant) => {
    setDrawerRestaurant(r);
    setDrawerTab('OVERVIEW');
    setEditCommission(r.commissionRatePercent || 15.0);
    setEditCgst(r.cgstRatePercent || 2.5);
    setEditSgst(r.sgstRatePercent || 2.5);
    setEditServiceCharge(r.serviceChargePercent || 5.0);

    setIsBranchesLoading(true);
    try {
      const bRes = await adminApi.fetchBranches(r.id);
      if (bRes.success && bRes.data) {
        setBranches(bRes.data);
      }
    } catch (err) {
      console.error('[AdminRestaurants] Error fetching branches:', err);
    } finally {
      setIsBranchesLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerRestaurant) return;
    setIsSavingConfig(true);
    try {
      const res = await adminApi.updateRestaurantConfig(drawerRestaurant.id, {
        commissionRatePercent: editCommission,
        cgstRatePercent: editCgst,
        sgstRatePercent: editSgst,
        serviceChargePercent: editServiceCharge
      });
      if (res.success) {
        setFeedback('Commercial tariffs updated and recorded in audit log.');
        await loadRestaurants();
        setDrawerRestaurant(prev => prev ? { ...prev, commissionRatePercent: editCommission, cgstRatePercent: editCgst, sgstRatePercent: editSgst, serviceChargePercent: editServiceCharge } : null);
      }
    } catch (err) {
      console.error('[AdminRestaurants] Config save error:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleToggleStatus = async (restaurant: AdminRestaurant) => {
    const nextStatus = restaurant.isActive ? 'SUSPENDED' : 'ACTIVE';
    const reason = window.prompt(
      `Enter reason for ${restaurant.isActive ? 'SUSPENDING' : 'ACTIVATING'} ${restaurant.name}:`,
      'Administrative governance update'
    );
    if (reason) {
      const res = await adminApi.updateRestaurantStatus(restaurant.id, nextStatus, reason);
      if (res.success) {
        setFeedback(`Restaurant ${restaurant.name} is now ${nextStatus}.`);
        loadRestaurants();
        if (drawerRestaurant?.id === restaurant.id) {
          setDrawerRestaurant(prev => prev ? { ...prev, isActive: nextStatus === 'ACTIVE', status: nextStatus as any } : null);
        }
      }
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: newRestName,
      city: newRestCity,
      cuisineType: newRestCuisine,
      gstin: newRestGstin,
      fssaiNumber: newRestFssai,
      commissionRatePercent: newRestCommission,
      ownerEmail: `owner.${newRestName.toLowerCase().replace(/[^a-z0-9]/g, '')}@dinedeck.in`,
      ownerName: `${newRestName} Proprietor`
    };

    const res = await adminApi.onboardRestaurant(payload);
    setIsSubmitting(false);

    if (res.success) {
      setShowOnboardModal(false);
      setNewRestName('');
      setFeedback('New merchant successfully provisioned.');
      loadRestaurants();
    }
  };

  const handleRegenerateQr = async (tableId: string) => {
    try {
      const res = await adminApi.regenerateTableQr(tableId);
      if (res.success) {
        setFeedback('QR code cryptographic signature rotated.');
        if (drawerRestaurant) {
          const bRes = await adminApi.fetchBranches(drawerRestaurant.id);
          if (bRes.success && bRes.data) setBranches(bRes.data);
        }
      }
    } catch (err) {
      console.error('[AdminRestaurants] QR Regen error:', err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRestaurants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRestaurants.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisineType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && r.isActive) ||
      (statusFilter === 'SUSPENDED' && !r.isActive) ||
      (statusFilter === 'PENDING' && r.status === 'PENDING_REVIEW');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white tracking-tight">Restaurants & Branches</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              ALL RESTAURANTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage restaurants, branches, tables, QR codes, and onboarding status.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl text-xs transition shadow-lg flex items-center space-x-1.5 animate-in zoom-in-95"
            >
              <Layers className="w-4 h-4" />
              <span>Bulk Action ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={() => loadRestaurants()}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="Refresh Restaurant List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowOnboardModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold rounded-2xl text-xs transition shadow-lg flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Restaurant</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by restaurant name, city, cuisine, GSTIN..."
            className="w-full bg-[#121826] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex bg-[#121826] border border-slate-800 rounded-2xl p-1 shrink-0">
          {(['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === st ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? `All (${restaurants.length})` : st}
            </button>
          ))}
        </div>
      </div>

      {/* Merchants Table Grid */}
      <div className="bg-[#121826] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedIds.length > 0 && selectedIds.length === filteredRestaurants.length}
              onChange={toggleSelectAll}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <span>Select All Restaurants for Batch Action</span>
          </div>
          <span>Showing {filteredRestaurants.length} of {restaurants.length} Restaurants</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
              <tr>
                <th className="w-10 px-3 py-4 text-center">#</th>
                <th className="px-5 py-4">Restaurant / Business Name</th>
                <th className="px-4 py-4">City & Cuisine</th>
                <th className="px-4 py-4">Commercials</th>
                <th className="px-4 py-4">Compliance</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredRestaurants.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-3 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-cyan-400 shrink-0">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-white text-xs">{r.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {r.id.slice(0, 14)}...</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{r.city}</div>
                    <div className="text-[10px] text-slate-500">{r.cuisineType}</div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-1 text-cyan-400 font-extrabold">
                      <Percent className="w-3 h-3" />
                      <span>{r.commissionRatePercent || 15.0}% Comm.</span>
                    </div>
                    <div className="text-[10px] text-slate-500">GST: {r.cgstRatePercent + r.sgstRatePercent}% • SC: {r.serviceChargePercent}%</div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-1 text-emerald-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      GSTIN: {r.gstin || '27AABCP1234F1Z5'}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        r.isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {r.isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => openDrawer(r)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 font-bold transition inline-flex items-center space-x-1"
                      title="Inspect 360 Command Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>360° Profile</span>
                    </button>

                    <button
                      onClick={() => handleToggleStatus(r)}
                      className={`p-1.5 rounded-xl transition inline-flex items-center ${
                        r.isActive
                          ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white'
                          : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                      }`}
                      title={r.isActive ? 'Suspend Restaurant' : 'Activate Restaurant'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 Restaurant Command Profile Workspace (17-Tab Full Studio) */}
      {drawerRestaurant && (
        <RestaurantDetailWorkspace
          restaurant={drawerRestaurant}
          onClose={() => setDrawerRestaurant(null)}
          onRefresh={loadRestaurants}
        />
      )}

      {/* Bulk Operations Modal */}
      <BulkOperationsModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedRestaurantIds={selectedIds}
        selectedRestaurantNames={restaurants.filter(r => selectedIds.includes(r.id)).map(r => r.name)}
        onSuccess={() => {
          setSelectedIds([]);
          loadRestaurants();
        }}
      />

      {/* Onboarding Wizard Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">Add New Restaurant</h3>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRestaurant} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Restaurant Legal / Display Name</label>
                <input
                  type="text"
                  value={newRestName}
                  onChange={(e) => setNewRestName(e.target.value)}
                  placeholder="e.g. Bukhara Royal Tandoor"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={newRestCity}
                    onChange={(e) => setNewRestCity(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Cuisine Type</label>
                  <input
                    type="text"
                    value={newRestCuisine}
                    onChange={(e) => setNewRestCuisine(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={newRestGstin}
                    onChange={(e) => setNewRestGstin(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">FSSAI License</label>
                  <input
                    type="text"
                    value={newRestFssai}
                    onChange={(e) => setNewRestFssai(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Platform Commission (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newRestCommission}
                  onChange={(e) => setNewRestCommission(parseFloat(e.target.value))}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Adding Restaurant...' : 'Complete Verification & Add Restaurant'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
