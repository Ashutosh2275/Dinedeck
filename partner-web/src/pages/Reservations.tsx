import React, { useState } from 'react';
import { TableItem } from '../types';
import {
  CalendarDays,
  Users,
  Clock,
  CheckCircle2,
  Plus,
  Search
} from 'lucide-react';

interface ReservationsProps {
  tables: TableItem[];
}

export const Reservations: React.FC<ReservationsProps> = ({ tables }) => {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'WAITLIST' | 'SEATED'>('UPCOMING');
  const [showModal, setShowModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [partySize, setPartySize] = useState('4');
  const [reservedTime, setReservedTime] = useState('20:30');
  const [selectedTable, setSelectedTable] = useState(tables[0]?.tableNumber || '1');

  interface ReservationItem {
    id: string;
    guestName: string;
    phone: string;
    partySize: number;
    tableNumber: string;
    time: string;
    status: 'CONFIRMED' | 'WAITLIST' | 'SEATED';
    specialRequests: string;
  }

  const [reservations, setReservations] = useState<ReservationItem[]>([]);

  const handleAddReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setReservations((prev) => [
      ...prev,
      {
        id: `res-${Date.now()}`,
        guestName,
        phone: guestPhone,
        partySize: parseInt(partySize) || 4,
        tableNumber: selectedTable,
        time: `${reservedTime} PM`,
        status: activeTab === 'WAITLIST' ? 'WAITLIST' : 'CONFIRMED',
        specialRequests: 'Standard dining'
      }
    ]);
    setShowModal(false);
    setGuestName('');
    setGuestPhone('');
  };

  const handleSeatParty = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'SEATED' } : r))
    );
  };

  const filtered = reservations.filter((r) => {
    if (activeTab === 'UPCOMING') return r.status === 'CONFIRMED';
    if (activeTab === 'WAITLIST') return r.status === 'WAITLIST';
    if (activeTab === 'SEATED') return r.status === 'SEATED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Table Reservations & Guest Waitlist
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              {reservations.length} Bookings Today
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Host table allocations, walk-in waitlist queue, and party arrivals.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-orange-500/20 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {(['UPCOMING', 'WAITLIST', 'SEATED'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === t
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t === 'UPCOMING' ? 'Confirmed Bookings' : t === 'WAITLIST' ? 'Live Waitlist' : 'Currently Seated'}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-500 dark:text-slate-400">
          <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400 dark:text-slate-500" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {activeTab === 'UPCOMING'
              ? 'No upcoming reservations scheduled'
              : activeTab === 'WAITLIST'
              ? 'No guests currently on the waitlist'
              : 'No parties currently seated'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Tap "New Reservation" to record a table booking or waitlist party.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((res) => (
            <div
              key={res.id}
              className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold text-xs">
                      Table #{res.tableNumber}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{res.guestName}</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      res.status === 'CONFIRMED'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : res.status === 'WAITLIST'
                        ? 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                        : 'bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Party of {res.partySize} Guests</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reserved for {res.time}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    Note: {res.specialRequests}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end space-x-2">
                {res.status !== 'SEATED' && (
                  <button
                    onClick={() => handleSeatParty(res.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Seat Guests</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Guest Booking</h3>
            <form onSubmit={handleAddReservation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Guest Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Party Size</label>
                  <input
                    type="number"
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Table</label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.tableNumber}>
                        Table #{t.tableNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Time Slot</label>
                <input
                  type="text"
                  value={reservedTime}
                  onChange={(e) => setReservedTime(e.target.value)}
                  placeholder="e.g. 20:30"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
