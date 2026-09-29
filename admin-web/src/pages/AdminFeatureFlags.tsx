import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { FeatureFlag } from '../types';
import {
  Flag,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Sparkles,
  Shield,
  Layers,
  X,
  Loader2
} from 'lucide-react';

export const AdminFeatureFlags: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadFlags = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchFeatureFlags();
      if (res.success && res.data) {
        setFlags(res.data);
      }
    } catch (err) {
      console.error('[AdminFeatureFlags] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggleGlobal = async (flag: FeatureFlag) => {
    setSavingKey(flag.key);
    try {
      const newGlobal = !flag.globalEnabled;
      const res = await adminApi.updateFeatureFlag(flag.key, {
        globalEnabled: newGlobal,
        rolloutPercent: flag.rolloutPercent
      });
      if (res.success) {
        setFeedback(`Feature flag ${flag.name} ${newGlobal ? 'enabled' : 'disabled'} globally.`);
        await loadFlags();
      }
    } catch (err) {
      console.error('[AdminFeatureFlags] Toggle error:', err);
    } finally {
      setSavingKey(null);
    }
  };

  const handleRolloutChange = async (flag: FeatureFlag, newPercent: number) => {
    setSavingKey(flag.key);
    try {
      const res = await adminApi.updateFeatureFlag(flag.key, {
        globalEnabled: flag.globalEnabled,
        rolloutPercent: newPercent
      });
      if (res.success) {
        setFeedback(`${flag.name} rollout updated to ${newPercent}%.`);
        await loadFlags();
      }
    } catch (err) {
      console.error('[AdminFeatureFlags] Rollout error:', err);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white tracking-tight">Feature Flags & Canary Rollouts</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              TENANT GOVERNANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Safely control platform feature rollouts (1% to 100%), canary experimentation, and tenant-level feature overrides.
          </p>
        </div>

        <button
          onClick={loadFlags}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 shrink-0"
          title="Refresh Flags"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Feature Flags Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-16 text-slate-500 bg-[#121826] border border-slate-800 rounded-3xl">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading feature flags and canary allocations...</span>
            </div>
          </div>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.id}
              className="bg-[#121826] border border-slate-800 hover:border-slate-700 p-5 rounded-3xl shadow-lg transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      {flag.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{flag.key}</span>
                  </div>
                  <h3 className="text-sm font-black text-white">{flag.name}</h3>
                  <p className="text-xs text-slate-400">{flag.description}</p>
                </div>

                {/* Global Toggle Switch */}
                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-xs font-bold text-slate-300">
                    {flag.globalEnabled ? 'GLOBAL ACTIVE' : 'GLOBAL DISABLED'}
                  </span>
                  <button
                    onClick={() => handleToggleGlobal(flag)}
                    disabled={savingKey === flag.key}
                    className={`w-12 h-6 rounded-full transition p-1 flex items-center ${
                      flag.globalEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>

              {/* Canary Percentage Stepper */}
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Canary Rollout Allocation:</span>
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-lg font-black font-mono">
                    {flag.rolloutPercent}%
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[0, 10, 25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handleRolloutChange(flag, pct)}
                      disabled={savingKey === flag.key}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        flag.rolloutPercent === pct
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
