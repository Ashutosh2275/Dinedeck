import React, { useState } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { customerApi } from '../services/api';
import {
  BellRing,
  Droplets,
  Receipt,
  Utensils,
  HelpCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export const ServiceModal: React.FC = () => {
  const { session, showServiceModal, setShowServiceModal } = useCustomer();
  const [selectedType, setSelectedType] = useState<string>('WATER');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  if (!showServiceModal) return null;

  const serviceOptions = [
    { type: 'WATER', label: 'Water Pitcher Refill', icon: Droplets, color: 'text-blue-400' },
    { type: 'EXTRA_PLATE', label: 'Extra Dinner Plates / Spoons', icon: Utensils, color: 'text-amber-400' },
    { type: 'CUTLERY', label: 'Extra Fork & Knives', icon: Utensils, color: 'text-emerald-400' },
    { type: 'BILL', label: 'Printed Physical Bill', icon: Receipt, color: 'text-purple-400' },
    { type: 'CALL_WAITER', label: 'Steward Assistance', icon: BellRing, color: 'text-orange-400' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await customerApi.requestService({
      restaurantId: session.restaurantId,
      tableNumber: session.tableNumber,
      type: selectedType,
      notes: customNotes || undefined
    });

    setIsSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setShowServiceModal(false);
      setCustomNotes('');
    }, 1500);
  };

  return (
    <div
      onClick={() => setShowServiceModal(false)}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#151D30] border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 cursor-default"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white">Table #{session.tableNumber} Service</h3>
            <p className="text-xs text-slate-400">Direct alert to assigned floor captain</p>
          </div>
          <button
            onClick={() => setShowServiceModal(false)}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <div className="text-sm font-bold text-white">Request Dispatched to Waiter!</div>
            <div className="text-xs text-slate-400">A steward will assist your table shortly.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Choose Service Type</label>
              <div className="grid grid-cols-1 gap-2">
                {serviceOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSel = selectedType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setSelectedType(opt.type)}
                      className={`p-3 rounded-2xl border text-left flex items-center space-x-3 transition ${
                        isSel
                          ? 'bg-orange-500/15 border-orange-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`p-2 rounded-xl bg-slate-800 ${opt.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Special Instructions (Optional)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Warm water without ice, please"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Dispatching...' : 'Dispatch Request to Floor Steward'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
