import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TableItem } from '../types';
import { api } from '../services/api';
import {
  Grid,
  Users,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Printer
} from 'lucide-react';

interface TableManagementProps {
  tables: TableItem[];
  onRefresh: () => void;
}

export const TableManagement: React.FC<TableManagementProps> = ({ tables, onRefresh }) => {
  const { hasPermission } = useAuth();
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const getTableQrUrl = (table: TableItem) => {
    let customerOrigin = 'http://localhost:3000';
    if (typeof window !== 'undefined' && window.location.hostname) {
      const isDev = window.location.port === '5173' || window.location.port === '5174';
      customerOrigin = isDev
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : window.location.origin;
    }
    const secureToken = table.qrCodeToken || `qr_${table.id}`;
    return `${customerOrigin}/?qrToken=${encodeURIComponent(secureToken)}`;
  };

  const copyTableLink = (table: TableItem) => {
    const url = getTableQrUrl(table);
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Tables & Floor Layout</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              {tables.length} Total Tables
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Floor seating capacity, real-time occupancy status, and table QR pairing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{occupiedCount} Occupied</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{tables.length - occupiedCount} Vacant</span>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="Refresh Tables"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
          <Grid className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-300">No Dining Tables Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Add physical dining tables to manage floor capacity, seating occupancy, and generate table QR codes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tables.map((table) => {
            const isOcc = table.isOccupied;
            return (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`p-4 rounded-2xl border transition shadow-sm dark:shadow-lg flex flex-col justify-between cursor-pointer group hover:scale-[1.02] ${
                  isOcc
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/50 hover:border-rose-500'
                    : 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 dark:text-white">Table #{table.tableNumber}</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOcc ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                <div className="my-3 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{table.capacity || 4} Seats</span>
                  </div>
                  <div className="text-[11px] font-bold">
                    {isOcc ? (
                      <span className="text-rose-600 dark:text-rose-400">Diner Seated</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">Ready to Seat</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleOccupancy(table);
                    }}
                    disabled={updatingId === table.id}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition border cursor-pointer ${
                      isOcc
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500 hover:text-white border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white border-emerald-500/30'
                    }`}
                  >
                    {isOcc ? 'Mark Vacant' : 'Mark Occupied'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Table QR & Details Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Table #{selectedTable.tableNumber} Standee & Details
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedTable.floor || 'Ground Floor'} • {selectedTable.capacity} Seats
                </p>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Persistent QR Standee Display */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center space-y-3 flex flex-col items-center">
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    getTableQrUrl(selectedTable)
                  )}`}
                  alt={`Table #${selectedTable.tableNumber} QR Code`}
                  className="w-36 h-36 mx-auto rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Permanent Table QR Code</div>
                <div className="font-mono text-[10px] text-cyan-700 dark:text-cyan-400 break-all px-2 py-1 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  Token: {selectedTable.qrCodeToken || `qr_${selectedTable.id}`}
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full pt-1">
                <button
                  type="button"
                  onClick={() => copyTableLink(selectedTable)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-[10px] transition flex items-center justify-center space-x-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {copySuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copySuccess ? 'Copied!' : 'Copy Ordering Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-orange-500/15 hover:bg-orange-500/25 text-orange-600 dark:text-orange-400 font-bold rounded-xl text-[10px] transition flex items-center justify-center space-x-1 border border-orange-500/30 cursor-pointer"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print Standee</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                selectedTable.isOccupied
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
              }`}>
                {selectedTable.isOccupied ? 'Currently Occupied' : 'Vacant & Available'}
              </span>

              <button
                onClick={() => {
                  handleToggleOccupancy(selectedTable);
                  setSelectedTable(null);
                }}
                className={`px-4 py-2 text-white font-bold rounded-xl text-xs transition cursor-pointer ${
                  selectedTable.isOccupied
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {selectedTable.isOccupied ? 'Mark Vacant' : 'Seat Arrived Party'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
