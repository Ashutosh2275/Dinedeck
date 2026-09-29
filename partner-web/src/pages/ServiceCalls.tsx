import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ServiceCall } from '../types';
import { api } from '../services/api';
import {
  BellRing,
  Droplets,
  Receipt,
  Utensils,
  HelpCircle,
  Clock,
  CheckCircle2,
  Zap,
  Plus,
  RefreshCw
} from 'lucide-react';

interface ServiceCallsProps {
  serviceCalls: ServiceCall[];
  onRefresh: () => void;
}

export const ServiceCalls: React.FC<ServiceCallsProps> = ({ serviceCalls, onRefresh }) => {
  const { hasPermission, restaurant } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTable, setNewTable] = useState('12');
  const [newType, setNewType] = useState('WATER');
  const [newNotes, setNewNotes] = useState('');

  const filterOptions = ['ALL', 'PENDING', 'ACKNOWLEDGED', 'RESOLVED'];

  const filteredCalls = serviceCalls.filter((call) => {
    const st = (call.status || 'PENDING').toUpperCase();
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'PENDING') return st === 'PENDING';
    if (selectedFilter === 'ACKNOWLEDGED') return st === 'ACKNOWLEDGED';
    if (selectedFilter === 'RESOLVED') return st === 'COMPLETED' || st === 'RESOLVED';
    return true;
  });

  const handleUpdateStatus = async (
    callId: string,
    status: 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED'
  ) => {
    setUpdatingId(callId);
    await api.updateServiceCall(callId, status);
    setUpdatingId(null);
    onRefresh();
  };

  const handleCreateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;
    await api.createServiceCall({
      restaurantId: restaurant.id,
      tableNumber: newTable,
      type: newType,
      notes: newNotes
    });
    setShowCreateModal(false);
    setNewNotes('');
    onRefresh();
  };

  const getIcon = (type?: string | null) => {
    const t = (type || '').toUpperCase();
    if (t === 'WATER') return <Droplets className="w-4 h-4 text-blue-400" />;
    if (t === 'BILL') return <Receipt className="w-4 h-4 text-purple-400" />;
    if (t === 'CUTLERY' || t === 'EXTRA_PLATE') return <Utensils className="w-4 h-4 text-amber-400" />;
    return <BellRing className="w-4 h-4 text-orange-400" />;
  };

  const getLabel = (type?: string | null) => {
    const t = (type || '').toUpperCase();
    if (t === 'WATER') return 'Water Pitcher Refill';
    if (t === 'BILL') return 'Printed Digital Bill';
    if (t === 'EXTRA_PLATE') return 'Extra Dinner Plate & Spoons';
    if (t === 'CUTLERY') return 'Extra Cutlery Set';
    return 'Steward Table Call';
  };

  return (
    <div className="space-y-6">
      {/* Header & New Call Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Table Service Calls</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {filteredCalls.length} Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Diner assistance requests, water refills, cutlery, and digital bill requests.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {hasPermission('service_requests.create') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Log Manual Call</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title="Refresh Service Requests"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedFilter === f
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/60'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Service Calls List Grid */}
      {filteredCalls.length === 0 ? (
        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-white">No Service Calls in this view</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All guest requests for "{selectedFilter}" are attended to.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCalls.map((call) => {
            const rawStatus = (call.status || 'PENDING').toUpperCase();
            const isPending = rawStatus === 'PENDING';
            const isAcknowledged = rawStatus === 'ACKNOWLEDGED';
            const isResolved = rawStatus === 'COMPLETED' || rawStatus === 'RESOLVED';

            return (
              <div
                key={call.id}
                className={`bg-[#1E293B] rounded-2xl border transition shadow-xl p-5 flex flex-col justify-between space-y-4 ${
                  isPending
                    ? 'border-amber-500/50 shadow-amber-500/5'
                    : isAcknowledged
                    ? 'border-blue-500/50 shadow-blue-500/5'
                    : 'border-slate-700/80 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 font-extrabold text-xs border border-orange-500/30">
                        Table #{call.tableNumber || call.tableId || '12'}
                      </span>
                      <div className="flex items-center space-x-1 text-sm font-bold text-white">
                        {getIcon(call.type || call.requestType)}
                        <span>{getLabel(call.type || call.requestType)}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : isAcknowledged
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {rawStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 mt-3 font-medium">
                    {call.notes || call.customNote || 'Customer requested assistance at table'}
                  </div>

                  <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Logged: {call.createdAt ? new Date(call.createdAt).toLocaleTimeString() : 'Just now'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-end space-x-2">
                  {isPending && hasPermission('service_requests.resolve') && (
                    <button
                      onClick={() => handleUpdateStatus(call.id, 'ACKNOWLEDGED')}
                      disabled={updatingId === call.id}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1 shadow-md shadow-blue-600/20"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>⚡ Acknowledge</span>
                    </button>
                  )}

                  {!isResolved && hasPermission('service_requests.resolve') && (
                    <button
                      onClick={() => handleUpdateStatus(call.id, 'COMPLETED')}
                      disabled={updatingId === call.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✅ Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Call Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Log Table Service Request</h3>
            <form onSubmit={handleCreateCall} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Table Number</label>
                <input
                  type="text"
                  value={newTable}
                  onChange={(e) => setNewTable(e.target.value)}
                  placeholder="e.g. 12"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Request Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="WATER">Water Pitcher Refill</option>
                  <option value="CUTLERY">Extra Cutlery / Spoons</option>
                  <option value="EXTRA_PLATE">Extra Dinner Plate</option>
                  <option value="BILL">Printed Digital Bill</option>
                  <option value="CALL_WAITER">Steward Table Call</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Need warm water with lemon"
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
