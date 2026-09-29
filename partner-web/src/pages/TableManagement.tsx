import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TableItem } from '../types';
import { api } from '../services/api';
import {
  Grid,
  Users,
  QrCode,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface TableManagementProps {
  tables: TableItem[];
  onRefresh: () => void;
}

export const TableManagement: React.FC<TableManagementProps> = ({ tables, onRefresh }) => {
  const { hasPermission } = useAuth();
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggleOccupancy = async (table: TableItem) => {
    if (!hasPermission('tables.assign')) return;
    setUpdatingId(table.id);
    await api.toggleTableOccupancy(table.id, !table.isOccupied);
    setUpdatingId(null);
    onRefresh();
  };

  const occupiedCount = tables.filter((t) => t.isOccupied).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Tables & Floor Layout</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {tables.length} Total Tables
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Floor seating capacity, real-time occupancy status, and table QR pairing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300 font-semibold">{occupiedCount} Occupied</span>
            <span className="text-slate-600">|</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300 font-semibold">{tables.length - occupiedCount} Vacant</span>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title="Refresh Tables"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {tables.map((table) => {
          const isOcc = table.isOccupied;
          return (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`p-4 rounded-2xl border transition shadow-lg flex flex-col justify-between cursor-pointer group ${
                isOcc
                  ? 'bg-slate-900/90 border-rose-500/40 hover:border-rose-500'
                  : 'bg-[#1E293B] border-slate-700/80 hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white">Table #{table.tableNumber}</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isOcc ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
              </div>

              <div className="my-3 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{table.capacity || 4} Seats</span>
                </div>
                <div className="text-[11px] font-bold">
                  {isOcc ? (
                    <span className="text-rose-400">Diner Seated</span>
                  ) : (
                    <span className="text-emerald-400">Ready to Seat</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleOccupancy(table);
                  }}
                  disabled={updatingId === table.id}
                  className={`w-full py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                    isOcc
                      ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white'
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white'
                  }`}
                >
                  {isOcc ? 'Mark Vacant' : 'Mark Occupied'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Table QR & Details Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Table #{selectedTable.tableNumber} Dining Hub
              </h3>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center space-x-4">
              <div className="p-3 bg-white rounded-xl">
                <QrCode className="w-12 h-12 text-slate-900" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-white">Smart Table QR Token</div>
                <div className="font-mono text-[10px] text-slate-400 break-all">
                  {selectedTable.qrCodeToken || `table_qr_${selectedTable.tableNumber}_auth`}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Instant Diner Mobile Ordering</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  handleToggleOccupancy(selectedTable);
                  setSelectedTable(null);
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition"
              >
                {selectedTable.isOccupied ? 'Vacate & Clean Table' : 'Seat Arrived Party'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
