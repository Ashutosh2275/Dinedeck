import React, { useState, useEffect } from 'react';
import { AdminAuditLog } from '../types';
import { adminApi } from '../services/api';
import { ShieldAlert, Clock, RefreshCw } from 'lucide-react';

export const AdminAudit: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);

  const fetchLogs = async () => {
    const res = await adminApi.fetchAuditLogs();
    if (res.success && res.data) {
      setLogs(res.data);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Platform-Wide Security & SuperAdmin Audit
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Global immutable audit trail of platform events, tenant suspensions, and IAM role overrides.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4">Actor</th>
                <th className="px-5 py-4">Executed Action</th>
                <th className="px-5 py-4">Resource Target</th>
                <th className="px-5 py-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4 text-slate-400 whitespace-nowrap flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4 font-bold text-white">
                    {log.actorName || log.actorRole || 'DINEDECK_SUPER_ADMIN'}
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-blue-400">
                    {log.action}
                  </td>
                  <td className="px-5 py-4 text-slate-300">{log.resource}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400">
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
