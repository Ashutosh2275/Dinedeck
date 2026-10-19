import React, { useState } from 'react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import {
  Settings,
  Percent,
  ShieldCheck,
  Save,
  CheckCircle2,
  Lock,
  DollarSign,
  Palette,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [defaultCommission, setDefaultCommission] = useState<number>(15.0);
  const [defaultCgst, setDefaultCgst] = useState<number>(2.5);
  const [defaultSgst, setDefaultSgst] = useState<number>(2.5);
  const [defaultServiceCharge, setDefaultServiceCharge] = useState<number>(5.0);
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState<number>(120);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <h1 className="text-xl font-black text-white tracking-tight">Platform Configuration & Commercial Defaults</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Authoritative ecosystem defaults, global commission rate, and statutory tax parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-[#121826] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Commercial Defaults */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Percent className="w-4 h-4 text-cyan-400" />
            <span>Commercial & Revenue Policy</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Default DINEDECK Platform Commission (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={defaultCommission}
                onChange={(e) => setDefaultCommission(parseFloat(e.target.value))}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500">Applied automatically to gross settled order value</span>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Settlement Cycle Payout Frequency
              </label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-cyan-500">
                <option value="T+1">T+1 (Next Business Day)</option>
                <option value="T+2">T+2 Standard Bank Cycle</option>
                <option value="WEEKLY">Weekly Batch on Monday</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statutory Tax Defaults */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Indian GST Statutory Defaults</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">CGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={defaultCgst}
                onChange={(e) => setDefaultCgst(parseFloat(e.target.value))}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">SGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={defaultSgst}
                onChange={(e) => setDefaultSgst(parseFloat(e.target.value))}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Service Charge (%)</label>
              <input
                type="number"
                step="0.5"
                value={defaultServiceCharge}
                onChange={(e) => setDefaultServiceCharge(parseFloat(e.target.value))}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Security Policies */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Security & Session Policy</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Admin Session Inactivity Timeout (Minutes)
              </label>
              <input
                type="number"
                value={sessionTimeoutMins}
                onChange={(e) => setSessionTimeoutMins(parseInt(e.target.value))}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Enforce 2FA for SuperAdmin
              </label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-cyan-500">
                <option value="ENFORCED">Enforced (OTP / Hardware Key)</option>
                <option value="OPTIONAL">Optional for Development</option>
              </select>
            </div>
          </div>
        </div>

        {/* Display & Visual Theme Policy */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Palette className="w-4 h-4 text-pink-400" />
            <span>Display Appearance & System Theme</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                key: 'LIGHT' as ThemeMode,
                label: 'Light Mode',
                icon: Sun,
                desc: 'Clean, high-contrast daytime governance workspace.',
                preview: 'bg-white border-slate-300'
              },
              {
                key: 'DARK' as ThemeMode,
                label: 'Dark Mode',
                icon: Moon,
                desc: 'Deep slate theme for NOC operations and low fatigue.',
                preview: 'bg-[#090D16] border-slate-700'
              },
              {
                key: 'SYSTEM' as ThemeMode,
                label: 'System Adaptive',
                icon: Monitor,
                desc: 'Follows operating system dark/light configuration.',
                preview: 'bg-gradient-to-r from-white to-[#090D16] border-slate-500'
              }
            ].map(({ key, label, icon: Icon, desc, preview }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                  theme === key
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className={`w-full h-8 rounded-xl mb-3 border ${preview}`} />
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${theme === key ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="font-black text-xs text-white">{label}</span>
                  </div>
                  {theme === key && (
                    <span className="px-1.5 py-0.5 bg-cyan-500 text-white text-[9px] font-black rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold rounded-2xl text-xs transition shadow-lg flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Platform Configuration</span>
        </button>

        {isSaved && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-400 text-center flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configuration Saved & Active on Platform Engine</span>
          </div>
        )}
      </form>
    </div>
  );
};
