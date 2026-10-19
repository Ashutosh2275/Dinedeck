import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { AdminUser, AdminAuditLog } from '../types';
import {
  ShieldCheck,
  Users,
  Lock,
  UserCheck,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Power,
  KeyRound,
  FileText
} from 'lucide-react';

export const AdminIAM: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'USERS' | 'AUDIT'>('USERS');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadIAMData = async () => {
    setIsLoading(true);
    try {
      const [uRes, aRes] = await Promise.all([
        adminApi.fetchUsers(),
        adminApi.fetchAuditLogs()
      ]);
      if (uRes.success && uRes.data) setUsers(uRes.data);
      if (aRes.success && aRes.data) setAuditLogs(aRes.data);
    } catch (err) {
      console.error('[AdminIAM] Error loading IAM data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIAMData();
  }, []);

  const handleToggleUserStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (window.confirm(`Are you sure you want to change status of ${user.email} to ${nextStatus}?`)) {
      await adminApi.updateUserStatus(user.id, nextStatus);
      loadIAMData();
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm dark:shadow-xl">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Staff & Access Permissions</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage staff accounts, assign access permissions, and review security activity history.
          </p>
        </div>

        <button
          onClick={() => loadIAMData()}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700 self-start sm:self-auto cursor-pointer"
          title="Refresh Staff & Access Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex bg-slate-100 dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-2xl p-1 max-w-xs">
        <button
          onClick={() => setActiveSubTab('USERS')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'USERS' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Users & Staff ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab('AUDIT')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'AUDIT' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Activity History ({auditLogs.length})
        </button>
      </div>

      {/* Users & Staff Directory */}
      {activeSubTab === 'USERS' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user by name, email, or role..."
              className="w-full bg-slate-50 dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-4">User Name</th>
                    <th className="px-4 py-4">Email Identity</th>
                    <th className="px-4 py-4">Assigned Role</th>
                    <th className="px-4 py-4">Tenant Scope</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Security Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                        {u.name}
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400 font-mono">
                        {u.email}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                        {u.restaurantName || (u.role === 'DINEDECK_SUPER_ADMIN' ? 'GLOBAL_PLATFORM' : 'Bandra Flagship')}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition"
                          title="Toggle User Access Status"
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
        </div>
      )}

      {/* Audit Logs Table */}
      {activeSubTab === 'AUDIT' && (
        <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">Action Event</th>
                  <th className="px-4 py-4">Resource Target</th>
                  <th className="px-4 py-4">Actor Role</th>
                  <th className="px-4 py-4">Execution Result</th>
                  <th className="px-5 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {log.action}
                    </td>
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                      {log.resource} <span className="text-slate-400 dark:text-slate-600">({log.resourceId?.slice(0, 10)}...)</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                        {log.actorRole || 'SUPER_ADMIN'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {log.result || 'SUCCESS'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-[10px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
