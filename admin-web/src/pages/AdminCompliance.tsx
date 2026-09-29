import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { AdminComplianceRecord } from '../types';
import {
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Clock
} from 'lucide-react';

export const AdminCompliance: React.FC = () => {
  const [records, setRecords] = useState<AdminComplianceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  const loadCompliance = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.fetchComplianceRecords();
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error('[AdminCompliance] Error loading compliance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompliance();
  }, []);

  const handleReview = async (restaurantId: string, status: string) => {
    await adminApi.reviewCompliance({ restaurantId, status });
    loadCompliance();
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.gstin && r.gstin.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRisk = filterRisk === 'ALL' || r.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121826] border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Compliance & KYC Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            GSTIN, FSSAI food licenses, PAN identity, and merchant verification lifecycle.
          </p>
        </div>

        <button
          onClick={() => loadCompliance()}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 self-start sm:self-auto"
          title="Refresh Compliance Records"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Compliance Risk Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Low Risk • 100% Verified</span>
          </div>
          <div className="text-xl font-black text-white">
            {records.filter((r) => r.riskLevel === 'LOW').length || records.length} Merchants
          </div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-3xl space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Medium Risk • Action Required</span>
          </div>
          <div className="text-xl font-black text-white">
            {records.filter((r) => r.riskLevel === 'MEDIUM').length} Merchants
          </div>
        </div>

        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-3xl space-y-1">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
            <XCircle className="w-4 h-4" />
            <span>High Risk • License Expired</span>
          </div>
          <div className="text-xl font-black text-white">
            {records.filter((r) => r.riskLevel === 'HIGH').length} Merchants
          </div>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="bg-[#121826] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Merchant Name</th>
                <th className="px-4 py-4">City</th>
                <th className="px-4 py-4">GSTIN & PAN</th>
                <th className="px-4 py-4">FSSAI License</th>
                <th className="px-4 py-4">Risk Level</th>
                <th className="px-4 py-4">KYC State</th>
                <th className="px-5 py-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4 font-bold text-white">
                    {rec.restaurantName}
                  </td>
                  <td className="px-4 py-4 text-slate-400">{rec.city}</td>
                  <td className="px-4 py-4 font-mono font-bold text-cyan-400">
                    {rec.gstin || '27AABCP1234F1Z5'}
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-emerald-400">
                    {rec.fssaiNumber || '11521019000342'}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        rec.riskLevel === 'LOW'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : rec.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {rec.riskLevel || 'LOW'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-white flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{rec.kycStatus || 'VERIFIED'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleReview(rec.restaurantId, 'VERIFIED')}
                      className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white transition"
                      title="Approve & Verify KYC"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReview(rec.restaurantId, 'REQUIRES_REVISION')}
                      className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-white transition"
                      title="Request Document Revision"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
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
