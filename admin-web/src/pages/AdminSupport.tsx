import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { SupportTicket, PlatformNotification } from '../types';
import {
  LifeBuoy,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  MessageSquare
} from 'lucide-react';

export const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'NOTIFICATIONS'>('TICKETS');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        adminApi.fetchSupportTickets(),
        adminApi.fetchAuditLogs()
      ]);
      if (tRes.success && tRes.data) {
        setTickets(tRes.data);
      } else {
        setTickets([]);
      }
      if (aRes.success && aRes.data) {
        const notifs: PlatformNotification[] = aRes.data.map((log: any) => ({
          id: log.id,
          title: log.action ? log.action.replace(/_/g, ' ') : 'Platform Activity',
          message: `${log.resource || 'System'}: ${log.details?.reason || log.details?.status || 'Action processed'} by ${log.user?.email || log.user?.name || 'Administrator'}`,
          severity: log.action?.includes('FAIL') || log.action?.includes('REJECT') ? 'WARNING' : 'INFO',
          isRead: false,
          createdAt: log.createdAt || new Date().toISOString()
        }));
        setNotifications(notifs);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('[AdminSupport] Failed loading data:', err);
      setTickets([]);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveTicket = async (id: string) => {
    try {
      await adminApi.updateSupportTicket(id, { status: 'RESOLVED' });
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'RESOLVED' } : t))
      );
    } catch (err) {
      console.error('[AdminSupport] Failed resolving ticket:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Support Desk & Platform Notifications</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Merchant incident ticketing, customer support cases, and real-time operational alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="Refresh Support Desk"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1">
            <button
              onClick={() => setActiveTab('TICKETS')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'TICKETS' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Support Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'NOTIFICATIONS' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Notifications ({notifications.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Desk */}
      {activeTab === 'TICKETS' && (
        <div className="bg-[#121826] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Ticket #</th>
                  <th className="px-4 py-4">Merchant / Diner</th>
                  <th className="px-4 py-4">Subject & Issue</th>
                  <th className="px-4 py-4">Priority</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <LifeBuoy className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                      <p className="font-semibold text-slate-400">No support tickets reported</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Inquiries and hardware incident reports logged by merchants or diners will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-mono font-bold text-white">{t.ticketNumber || t.id}</td>
                      <td className="px-4 py-4 font-bold text-white">{t.restaurantName || 'General User'}</td>
                      <td className="px-4 py-4 text-slate-300">{t.subject}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {t.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolveTicket(t.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notifications Desk */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="p-12 text-center bg-[#121826] border border-slate-800 rounded-3xl text-slate-500 shadow-lg">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
              <p className="font-semibold text-slate-400">No operational alerts or notifications</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Audit events, settlement alerts, and compliance updates will stream here.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 bg-[#121826] border border-slate-800 rounded-3xl flex items-start justify-between gap-3 shadow-lg"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      n.severity === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : n.severity === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-cyan-500/20 text-cyan-400'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-xs">{n.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{n.message}</div>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500 shrink-0">
                  {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
