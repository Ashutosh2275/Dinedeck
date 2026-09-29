import React, { useState } from 'react';
import { useCustomer } from '../context/CustomerContext';
import {
  User,
  Mail,
  Smartphone,
  ShieldCheck,
  Flame,
  Leaf,
  UtensilsCrossed,
  Receipt,
  LogOut,
  LogIn,
  Save,
  CheckCircle2,
  Building2,
  Trash2,
  Bell,
  Sparkles,
  Edit3,
  Calendar,
  CreditCard,
  Printer,
  X,
  Star,
  FileText,
  BadgePercent,
  Clock,
  Share2
} from 'lucide-react';

export const CustomerAccount: React.FC = () => {
  const {
    user,
    session,
    offlineReceipts,
    updateUserProfile,
    clearTableSession,
    logout,
    setShowAuthModal,
    setActiveView,
    setShowServiceModal
  } = useCustomer();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [spicePref, setSpicePref] = useState<'MILD' | 'MEDIUM' | 'SPICY' | 'EXTRA_HOT'>(
    (user?.defaultSpiceLevel as any) || 'MEDIUM'
  );
  const [dietPref, setDietPref] = useState<'ALL' | 'VEG' | 'NON_VEG'>(
    user?.dietaryPreference || 'ALL'
  );
  const [dietNotes, setDietNotes] = useState(user?.specialDietNotes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim() || 'Guest Diner',
      phone: phone.trim() || null,
      email: email.trim() || null,
      defaultSpiceLevel: spicePref,
      dietaryPreference: dietPref,
      specialDietNotes: dietNotes.trim() || undefined
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-32 max-w-4xl mx-auto animate-in fade-in">
      {/* 1. TOP PROFILE HERO BANNER */}
      <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 p-0.5 shadow-xl shadow-orange-500/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[22px] bg-[#0B0F19] flex items-center justify-center text-orange-400 font-black text-2xl">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : <User className="w-8 h-8" />}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {user?.name || 'Guest Diner'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>DineDeck VIP</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span>{user?.email || 'guest.diner@dinedeck.io'}</span>
                {user?.phone && (
                  <>
                    <span>•</span>
                    <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                    <span>{user.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                  <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-rose-500/30 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Quick PIN Setup</span>
              </button>
            )}
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile and dining preferences updated successfully!</span>
          </div>
        )}
      </div>

      {/* 2. EDIT PROFILE FORM */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-[#151D30] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-in zoom-in-95"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-orange-400" />
              <span>Update Profile Info</span>
            </h3>
            <span className="text-[11px] text-slate-400">Stored securely on your device</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Your Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-orange-500 transition font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-orange-500 transition font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Mobile Number (+91)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-orange-500 transition font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-white font-black text-xs transition flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. ORDER HISTORY & SAVED TAX INVOICES VAULT */}
      <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-400" />
              <span>Dining Visits & Tax Invoices</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Official GST invoices for your past dining visits and expense claims
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('BILL')}
            className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
          >
            Bill & Pay Screen →
          </button>
        </div>

        {offlineReceipts.length > 0 ? (
          <div className="space-y-3">
              {offlineReceipts.map((rc) => (
                <div
                  key={rc.receiptId}
                  onClick={() => setViewingInvoice(rc)}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                >
                  <div className="space-y-1">
                    <div className="font-extrabold text-sm text-white group-hover:text-orange-400 transition">
                      {rc.restaurantName}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(rc.paidAt).toLocaleDateString()}</span>
                      <span>• Table #{rc.tableNumber}</span>
                      <span>• {rc.items.length} items</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-white font-mono">₹{rc.grandTotal.toFixed(2)}</div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Paid ({rc.paymentMethod})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingInvoice(rc);
                      }}
                      className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Bill</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-6 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No past dining invoices recorded yet.</p>
            <button
              onClick={() => setActiveView('MENU')}
              className="px-4 py-2 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-xl hover:bg-orange-500 hover:text-white transition cursor-pointer"
            >
              Start Dining & View Live Menu
            </button>
          </div>
        )}
      </div>

      {/* 4. DINING & TASTE PREFERENCES (Compact & Practical) */}
      <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-400" />
              <span>Dining & Kitchen Preferences</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically included in your orders for the head chef
            </p>
          </div>
        </div>

        {/* Spice Level Preference */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Default Spice Level</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'MILD', label: 'Mild (Low Spice)', icon: '🟢' },
              { key: 'MEDIUM', label: 'Medium (Standard)', icon: '🟡' },
              { key: 'SPICY', label: 'Spicy (Hot)', icon: '🔴' },
              { key: 'EXTRA_HOT', label: 'Extra Fiery', icon: '🌶️' }
            ].map((sp) => (
              <button
                key={sp.key}
                type="button"
                onClick={() => {
                  setSpicePref(sp.key as any);
                  updateUserProfile({ defaultSpiceLevel: sp.key });
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  spicePref === sp.key
                    ? 'bg-orange-500/15 border-orange-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{sp.icon}</span>
                <span>{sp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Preference */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dietary Filter</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'ALL', label: 'All Items', desc: 'Veg & Non-Veg' },
              { key: 'VEG', label: 'Pure Veg Only', desc: '100% Vegetarian' },
              { key: 'NON_VEG', label: 'Non-Veg Allowed', desc: 'Chicken, Fish, Mutton' }
            ].map((dt) => (
              <button
                key={dt.key}
                type="button"
                onClick={() => {
                  setDietPref(dt.key as any);
                  updateUserProfile({ dietaryPreference: dt.key as any });
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  dietPref === dt.key
                    ? 'bg-orange-500/15 border-orange-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-extrabold text-xs text-white">{dt.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{dt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Special Allergy / Cooking Notes */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Special Allergies & Chef Instructions</span>
          </label>
          <input
            type="text"
            value={dietNotes}
            onChange={(e) => {
              setDietNotes(e.target.value);
              updateUserProfile({ specialDietNotes: e.target.value });
            }}
            placeholder="e.g. Jain food (no onion/garlic), Peanut allergy, Gluten sensitive"
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition font-sans"
          />
        </div>
      </div>

      {/* 5. ACTIVE TABLE STATUS */}
      <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-400" />
              <span>Active Dining Pairing</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live connection to restaurant kitchen and steward
            </p>
          </div>
        </div>

        {session.isActive && session.tableNumber ? (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">{session.restaurantName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white">
                  Table #{session.tableNumber}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Session Active
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView('MENU')}
                className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-md shadow-orange-500/20 cursor-pointer"
              >
                Open Table Menu
              </button>
              <button
                type="button"
                onClick={clearTableSession}
                className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold transition border border-rose-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Leave</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">No active dining table connected.</p>
            <button
              type="button"
              onClick={() => setActiveView('HOME')}
              className="px-5 py-2.5 rounded-xl bg-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500 hover:text-white transition cursor-pointer"
            >
              Scan Table QR or Browse Restaurants
            </button>
          </div>
        )}
      </div>

      {/* 6. AUTHENTIC RESTAURANT THERMAL POS BILL SLIP MODAL */}
      {viewingInvoice && (
        <div
          onClick={() => setViewingInvoice(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm sm:max-w-md w-full space-y-3 my-auto cursor-default"
          >
            {/* Top Toolbar Actions */}
            <div className="flex items-center justify-between bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800 text-white">
              <span className="text-xs font-extrabold text-orange-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4" />
                <span>Restaurant POS Bill</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    let txt = `${viewingInvoice.restaurantName} - Table #${viewingInvoice.tableNumber}\nBill: ₹${viewingInvoice.grandTotal.toFixed(2)}\nPaid via ${viewingInvoice.paymentMethod}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: 'DineDeck Bill', text: txt, url: window.location.href });
                        return;
                      } catch {}
                    }
                    await navigator.clipboard.writeText(txt);
                    alert('Bill copied to clipboard!');
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Authentic Thermal Paper Roll Slip */}
            <div className="bg-[#fcfcfa] text-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-8 font-mono text-xs border border-neutral-300 relative overflow-hidden select-text">
              <div className="border-b-2 border-dashed border-neutral-400 pb-3 text-center space-y-1">
                <div className="font-black text-sm uppercase tracking-wider text-black">
                  {viewingInvoice.restaurantName || 'THE PUNJAB HERITAGE KITCHEN'}
                </div>
                <div className="text-[10px] text-neutral-600">
                  BKC Flagship Location, Mumbai - 400051
                </div>
                <div className="text-[9px] text-neutral-500">
                  GSTIN: 27AABCD1234E1Z5 • FSSAI: 11521014000123
                </div>
              </div>

              <div className="py-2.5 border-b border-dashed border-neutral-400 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">BILL NO:</span>
                  <span className="font-bold text-black">{viewingInvoice.orderNumber || viewingInvoice.receiptId || viewingInvoice.billId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">DATE & TIME:</span>
                  <span className="font-bold text-black">{new Date(viewingInvoice.paidAt || Date.now()).toLocaleDateString()} {new Date(viewingInvoice.paidAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">TABLE:</span>
                  <span className="font-bold text-black">Table #{viewingInvoice.tableNumber || '1'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">BILLED TO:</span>
                  <span className="font-bold text-black">{viewingInvoice.customerName || user?.name || 'Guest Diner'}</span>
                </div>
              </div>

              <div className="py-3 border-b border-dashed border-neutral-400 space-y-1.5">
                <div className="flex justify-between text-[10px] font-black text-neutral-600 uppercase border-b border-neutral-300 pb-1">
                  <span>ITEM</span>
                  <div className="flex space-x-4">
                    <span className="w-8 text-right">QTY</span>
                    <span className="w-16 text-right">AMOUNT</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1 max-h-52 overflow-y-auto">
                  {(viewingInvoice.items || []).map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-[11px] items-start">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-black truncate">{it.name}</div>
                        {it.variantName && (
                          <div className="text-[9px] text-neutral-500">[{it.variantName}]</div>
                        )}
                      </div>
                      <div className="flex space-x-4 shrink-0 font-bold">
                        <span className="w-8 text-right text-neutral-700">{it.quantity}</span>
                        <span className="w-16 text-right text-black">
                          ₹{(it.totalPrice || it.unitPrice * it.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="py-2.5 border-b-2 border-dashed border-neutral-400 text-[11px] space-y-1">
                <div className="flex justify-between text-neutral-700">
                  <span>SUBTOTAL:</span>
                  <span className="font-bold">₹{viewingInvoice.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>CGST (2.5%):</span>
                  <span>₹{(viewingInvoice.subtotal * 0.025).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>SGST (2.5%):</span>
                  <span>₹{(viewingInvoice.subtotal * 0.025).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>SERVICE CHG (5.0%):</span>
                  <span>₹{(viewingInvoice.subtotal * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-black pt-1 border-t border-neutral-300">
                  <span>NET PAYABLE:</span>
                  <span>₹{viewingInvoice.grandTotal?.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-3 text-center space-y-2">
                <div className="inline-block px-3 py-1 border-2 border-emerald-600 text-emerald-800 rounded font-black text-[10px] uppercase tracking-wider">
                  PAID IN FULL via {viewingInvoice.paymentMethod || 'UPI'}
                </div>
                <div className="text-[10px] text-neutral-600">
                  *** THANK YOU FOR DINING WITH US! ***
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
