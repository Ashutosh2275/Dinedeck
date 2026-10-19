import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuditLog } from '../types';
import { api } from '../services/api';
import { ShieldAlert, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { restaurant } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    const res = await api.fetchAuditLogs(restaurant?.id);
    if (res.success && res.data) {
      setLogs(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [restaurant?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Security & Operational Audit Trails
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              Immutable IAM Log
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete audit records of role changes, permission grants, order cancellations, and refunds.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition border border-slate-200 dark:border-slate-700 self-start"
          title="Refresh Audit Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-700/80">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Action Executed</th>
                <th className="px-5 py-3.5">Target Resource</th>
                <th className="px-5 py-3.5">Scope</th>
                <th className="px-5 py-3.5 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                    No security events logged for this session yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {log.actor?.name || log.actor?.email || 'System Root'}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {log.action}
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {log.resource} ({log.resourceId})
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{log.scope || 'RESTAURANT'}</td>
                    <td className="px-5 py-4 text-right font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          log.result === 'SUCCESS' || log.result === 'ALLOWED'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
