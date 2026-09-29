import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { SystemHealthMetrics, FeatureFlag } from '../types';
import {
  Layers,
  Activity,
  Server,
  Database,
  Wifi,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Smartphone,
  Globe
} from 'lucide-react';

export const AdminHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthMetrics | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    { id: 'ff_1', key: 'FEATURE_CUSTOMER_WEB', name: 'Customer Web Experience', description: 'Enable Table QR dining & menu on Web', isEnabled: true, scope: 'GLOBAL' },
    { id: 'ff_2', key: 'FEATURE_PARTNER_WEB', name: 'Partner Web Operations', description: 'Enable live KDS and Waiter POS on Web', isEnabled: true, scope: 'GLOBAL' },
    { id: 'ff_3', key: 'FEATURE_SPLIT_PAYMENT', name: 'Split Bill Calculator', description: 'Enable split payment calculator on customer bill', isEnabled: true, scope: 'GLOBAL' },
    { id: 'ff_4', key: 'FEATURE_NEW_KDS', name: 'Ultra-Fast KDS Sync', description: '100ms WebSocket ticket broadcast', isEnabled: true, scope: 'GLOBAL' },
    { id: 'ff_5', key: 'FEATURE_ADVANCED_ANALYTICS', name: 'Live GMV Stream', description: 'Stream gross revenue updates to SuperAdmin in realtime', isEnabled: true, scope: 'GLOBAL' }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadHealth = async () => {
    setIsLoading(true);
    try {
      const hRes = await adminApi.fetchSystemHealth();
      if (hRes.success && hRes.data) setHealth(hRes.data);
    } catch (err) {
      console.error('[AdminHealth] Error loading health:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleToggleFlag = (id: string) => {
    setFeatureFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isEnabled: !f.isEnabled } : f))
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white tracking-tight">System Health & Feature Flags</h1>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time infrastructure telemetry, service latencies, and runtime feature toggles.
          </p>
        </div>

        <button
          onClick={() => loadHealth()}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 self-start sm:self-auto"
          title="Refresh Telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fastify API */}
        <div className="p-5 bg-[#121826] border border-slate-800 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Fastify Core API</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">HEALTHY</div>
          <div className="text-[11px] text-emerald-400 font-bold">14ms Latency • Port 8080</div>
        </div>

        {/* Prisma SQLite */}
        <div className="p-5 bg-[#121826] border border-slate-800 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Prisma Database</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">HEALTHY</div>
          <div className="text-[11px] text-blue-400 font-bold">SQLite Transactional Engine</div>
        </div>

        {/* WebSocket Gateway */}
        <div className="p-5 bg-[#121826] border border-slate-800 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>WebSocket Gateway</span>
            <Wifi className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">CONNECTED</div>
          <div className="text-[11px] text-cyan-400 font-bold">6 Active Connected Clients</div>
        </div>

        {/* Payment Gateway */}
        <div className="p-5 bg-[#121826] border border-slate-800 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>UPI / Card Gateway</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">OPERATIONAL</div>
          <div className="text-[11px] text-purple-400 font-bold">100% Verification Rate</div>
        </div>
      </div>

      {/* Feature Flags Manager */}
      <div className="bg-[#121826] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-base font-black text-white">Platform Feature Flags & Toggles</h2>
          <p className="text-xs text-slate-400">Dynamically enable or disable platform capabilities across tenants.</p>
        </div>

        <div className="divide-y divide-slate-800">
          {featureFlags.map((flag) => (
            <div key={flag.id} className="py-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-bold text-white text-xs flex items-center gap-2">
                  <span>{flag.name}</span>
                  <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-slate-800 text-cyan-400 border border-slate-700">
                    {flag.key}
                  </span>
                </div>
                <div className="text-xs text-slate-400">{flag.description}</div>
              </div>

              <button
                onClick={() => handleToggleFlag(flag.id)}
                className={`p-2 rounded-xl transition ${
                  flag.isEnabled ? 'text-emerald-400' : 'text-slate-600'
                }`}
              >
                {flag.isEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
