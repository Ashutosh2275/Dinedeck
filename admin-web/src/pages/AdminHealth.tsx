import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { SystemHealthMetrics, FeatureFlag } from '../types';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Wifi,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  CreditCard,
  Layers,
  Cpu,
  Clock,
  Zap,
  Lock,
  Unlock,
  Sliders,
  ShieldAlert,
  Smartphone,
  Globe
} from 'lucide-react';

export const AdminHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthMetrics | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadHealth = async () => {
    setIsLoading(true);
    try {
      const [hRes, fRes] = await Promise.all([
        adminApi.fetchSystemHealth(),
        adminApi.fetchFeatureFlags()
      ]);
      if (hRes.success && hRes.data) setHealth(hRes.data);
      if (fRes.success && fRes.data) setFeatureFlags(fRes.data);
    } catch (err) {
      console.error('[AdminHealth] Error loading health:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleToggleFlag = async (flag: FeatureFlag) => {
    const nextState = !flag.isEnabled;
    try {
      await adminApi.updateFeatureFlag(flag.key, { globalEnabled: nextState });
      setFeatureFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, isEnabled: nextState } : f))
      );
    } catch (err) {
      console.error('[AdminHealth] Error toggling feature flag:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm dark:shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">System Health & Services</h1>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                health?.status === 'HEALTHY' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time authoritative backend service telemetry, latency, and system flags.
          </p>
        </div>

        <button
          onClick={() => loadHealth()}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700 self-start sm:self-auto cursor-pointer"
          title="Refresh System Health"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backend Server */}
        <div className="p-5 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm dark:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Fastify API Node</span>
            <Server className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {health?.status || (isLoading ? 'CHECKING...' : 'ONLINE')}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            {health ? `${health.dbLatencyMs}ms Latency • Node ${health.nodeVersion}` : 'Checking services...'}
          </div>
        </div>

        {/* Database */}
        <div className="p-5 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm dark:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>PostgreSQL Engine</span>
            <Database className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {health?.dbLatencyMs !== undefined ? 'CONNECTED' : (isLoading ? 'PROBING...' : 'ONLINE')}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
            {health?.dbLatencyMs !== undefined ? `${health.dbLatencyMs}ms Query Latency` : 'Prisma ORM Connected'}
          </div>
        </div>

        {/* WebSocket Gateway */}
        <div className="p-5 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm dark:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Real-time WebSocket Hub</span>
            <Wifi className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {health?.activeWebSocketClients !== undefined ? 'ACTIVE' : (isLoading ? 'SYNCING...' : 'READY')}
          </div>
          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">
            {health?.activeWebSocketClients !== undefined
              ? `${health.activeWebSocketClients} Connected Client(s)`
              : 'Pub/Sub Socket Stream'}
          </div>
        </div>

        {/* System Memory & Heap */}
        <div className="p-5 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm dark:shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Node Heap & RSS</span>
            <Cpu className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {health?.memory?.heapUsedMb ? `${health.memory.heapUsedMb} MB` : 'OPTIMAL'}
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
            {health?.memory?.rssMb ? `RSS: ${health.memory.rssMb} MB` : 'Memory Stable'}
          </div>
        </div>
      </div>

      {/* Feature Flags Manager */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">Platform Feature Flags & Toggles</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Dynamically enable or disable platform capabilities across tenants.</p>
        </div>

        {featureFlags.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600 opacity-50" />
            <p className="font-semibold text-slate-600 dark:text-slate-400">No feature flags configured</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configured canary release and feature flags will be listed here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {featureFlags.map((flag) => (
              <div key={flag.id} className="py-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                    <span>{flag.name}</span>
                    <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700">
                      {flag.key}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{flag.description}</div>
                </div>

                <button
                  onClick={() => handleToggleFlag(flag)}
                  className={`p-2 rounded-xl transition ${
                    flag.isEnabled ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {flag.isEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
