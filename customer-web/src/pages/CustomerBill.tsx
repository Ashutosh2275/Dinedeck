import React, { useState } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { OfflineReceipt } from '../types';
import {
  Receipt,
  QrCode,
  CreditCard,
  CheckCircle2,
  Lock,
  Users,
  Banknote,
  ArrowRight,
  History,
  Calendar,
  UtensilsCrossed,
  X,
  Share2,
  Copy,
  Check,
  Building2,
  Clock,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export const CustomerBill: React.FC = () => {
  const {
    session,
    user,
    currentOrder,
    sessionOrders,
    currentBill,
    offlineReceipts,
    settlePayment,
    setActiveView,
    setDiningTable
  } = useCustomer();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(currentBill?.paymentStatus === 'PAID');
  const [splitCount, setSplitCount] = useState<number>(1);
  const [showSplitCalculator, setShowSplitCalculator] = useState<boolean>(false);
  const [viewingReceipt, setViewingReceipt] = useState<OfflineReceipt | any | null>(null);
  const [shareToast, setShareToast] = useState<string>('');

  // Collect all ordered dishes across this table's session
  const allItems =
    sessionOrders.length > 0
      ? sessionOrders
          .filter((o) => o.status !== 'REJECTED' && o.status !== 'CANCELLED')
          .flatMap((o) => o.items || [])
      : currentOrder && currentOrder.status !== 'REJECTED'
      ? currentOrder.items || []
      : [];

  const rawSubtotal =
    currentBill?.subtotal ||
    (allItems.length > 0
      ? allItems.reduce(
          (sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity),
          0
        )
      : 0);

  const cgst = currentBill?.cgstAmount || rawSubtotal * 0.025;
  const sgst = currentBill?.sgstAmount || rawSubtotal * 0.025;
  const serviceCharge = currentBill?.serviceCharge || rawSubtotal * 0.05;
  const grandTotal =
    currentBill?.grandTotal ||
    Math.round(rawSubtotal + cgst + sgst + serviceCharge);
  const splitPerPerson = Math.ceil(grandTotal / (splitCount || 1));

  const hasActiveSession =
    Boolean(session.isActive && session.tableNumber) &&
    (allItems.length > 0 || grandTotal > 0);

  const handlePayBill = async () => {
    if (grandTotal === 0) return;
    setIsProcessing(true);
    const res = await settlePayment(paymentMethod);
    setIsProcessing(false);
    if (res.success) {
      setIsPaid(true);
      if (res.receipt) {
        setViewingReceipt(res.receipt);
      }
    }
  };

  const handleOpenCurrentThermalBill = () => {
    const activeReceiptData: OfflineReceipt = {
      receiptId: currentBill?.id || `DIN-${Date.now().toString().slice(-6)}`,
      billId: currentBill?.id || `BILL-${Date.now().toString().slice(-6)}`,
      orderNumber: currentOrder?.orderNumber || `#ORD-T${session.tableNumber || '1'}`,
      restaurantId: session.restaurantId || 'rest_main',
      restaurantName: session.restaurantName || 'Dining Restaurant',
      tableNumber: session.tableNumber || '1',
      customerName: user?.name || 'Guest Diner',
      subtotal: rawSubtotal,
      taxTotal: cgst + sgst,
      serviceCharge: serviceCharge,
      grandTotal: grandTotal,
      paymentMethod: isPaid ? (currentBill as any)?.paymentMethod || 'UPI' : 'PENDING',
      paidAt: isPaid ? (currentBill?.paidAt || new Date().toISOString()) : new Date().toISOString(),
      items: allItems.map((item) => ({
        id: item.id || `item_${Date.now()}`,
        menuItemId: item.menuItemId || '',
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || (item.unitPrice || 0) * item.quantity,
        variantName: item.variantName || null,
        addonsSummary: item.addonsSummary || null,
        specialNotes: item.specialNotes || null
      }))
    };
    setViewingReceipt(activeReceiptData);
  };

  // Generate plain text receipt slip for sharing
  const generateReceiptText = (rcpt: any) => {
    const restName = rcpt.restaurantName || 'DINEDECK RESTAURANT';
    const tbl = rcpt.tableNumber || '1';
    const dateStr = new Date(rcpt.paidAt || Date.now()).toLocaleString();
    const billNo = rcpt.orderNumber || rcpt.receiptId || rcpt.billId || 'DIN-8821';

    let txt = `====================================\n`;
    txt += `       ${restName.toUpperCase()}\n`;
    txt += `    Smart Dining POS Tax Receipt\n`;
    txt += `====================================\n`;
    txt += `Bill No : ${billNo}\n`;
    txt += `Table   : #${tbl}\n`;
    txt += `Date    : ${dateStr}\n`;
    txt += `Guest   : ${rcpt.customerName || 'Guest Diner'}\n`;
    txt += `------------------------------------\n`;
    txt += `ITEMS                 QTY   TOTAL\n`;
    txt += `------------------------------------\n`;

    (rcpt.items || []).forEach((it: any) => {
      const name = it.name.length > 20 ? it.name.substring(0, 18) + '..' : it.name.padEnd(20);
      const qty = String(it.quantity).padStart(3);
      const price = `₹${(it.totalPrice || it.unitPrice * it.quantity).toFixed(2)}`.padStart(8);
      txt += `${name} ${qty} ${price}\n`;
    });

    const sub = rcpt.subtotal || 0;
    const cgstAmt = sub * 0.025;
    const sgstAmt = sub * 0.025;
    const servAmt = rcpt.serviceCharge || sub * 0.05;

    txt += `------------------------------------\n`;
    txt += `Food Subtotal:            ₹${sub.toFixed(2)}\n`;
    txt += `CGST @ 2.5%:              ₹${cgstAmt.toFixed(2)}\n`;
    txt += `SGST @ 2.5%:              ₹${sgstAmt.toFixed(2)}\n`;
    txt += `Service Charge @ 5.0%:    ₹${servAmt.toFixed(2)}\n`;
    txt += `====================================\n`;
    txt += `NET AMOUNT PAID:          ₹${rcpt.grandTotal.toFixed(2)}\n`;
    txt += `Payment Method:           ${rcpt.paymentMethod || 'UPI (PAID)'}\n`;
    txt += `====================================\n`;
    txt += `  THANK YOU FOR DINING WITH US!\n`;
    txt += `      Powered by DineDeck\n`;
    txt += `====================================`;
    return txt;
  };

  const handleShareReceipt = async (rcpt: any) => {
    const textSlip = generateReceiptText(rcpt);
    const title = `${rcpt.restaurantName} - Bill #${rcpt.orderNumber || rcpt.receiptId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: textSlip,
          url: window.location.href
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
      }
    }

    // Fallback: Copy to Clipboard
    try {
      await navigator.clipboard.writeText(textSlip);
      setShareToast('Exact bill copied to clipboard! You can paste and share it on WhatsApp or any app.');
      setTimeout(() => setShareToast(''), 3500);
    } catch (e) {
      setShareToast('Could not copy automatically. Please copy the text from the receipt.');
      setTimeout(() => setShareToast(''), 3000);
    }
  };

  const handleBrowseRestaurants = () => {
    // Graceful navigation: if restaurant already selected, open menu; otherwise open Discover (HOME)
    if (session.restaurantId) {
      setActiveView('MENU');
    } else {
      setActiveView('HOME');
    }
  };

  const handleReorder = (rcpt: OfflineReceipt) => {
    setDiningTable(rcpt.tableNumber || '1', rcpt.restaurantId, rcpt.restaurantName);
    setActiveView('MENU');
  };

  return (
    <div className="space-y-6 pb-32 max-w-4xl mx-auto px-2 sm:px-4 animate-in fade-in">
      {/* Toast Alert */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in zoom-in-95">
          <Check className="w-4 h-4" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Page Title & Context */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-orange-400" />
            <span>Bill & Pay</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active table bill, payment settlement, and complete dining order history
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ACTIVE DINING TABLE BILL (TOP CARD)                             */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-xs font-extrabold text-orange-400">
            <Sparkles className="w-3.5 h-3.5" /> Current Table Order
          </span>
          {hasActiveSession && (
            <span className="text-[11px] text-slate-400 font-mono">
              Table #{session.tableNumber}
            </span>
          )}
        </div>

        {hasActiveSession ? (
          <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Header Status */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-black text-white">{session.restaurantName}</h2>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Table #{session.tableNumber} • Active Session
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCurrentThermalBill}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title="View Exact Thermal POS Bill"
                >
                  <Receipt className="w-3.5 h-3.5 text-orange-400" />
                  <span>View Bill</span>
                </button>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    isPaid
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isPaid ? 'PAID IN FULL' : 'PAYMENT PENDING'}
                </span>
              </div>
            </div>

            {/* Itemized Dishes List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <span>Ordered Items ({allItems.length})</span>
                <span>Rate & Amount</span>
              </div>

              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 divide-y divide-slate-800 max-h-52 overflow-y-auto custom-scrollbar">
                {allItems.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between text-xs gap-2">
                    <div className="flex items-start space-x-2 min-w-0">
                      <span className="w-5 h-5 rounded-lg bg-slate-800 text-orange-400 font-extrabold flex items-center justify-center shrink-0 text-[11px]">
                        {item.quantity}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{item.name}</div>
                        {item.variantName && (
                          <div className="text-[10px] text-orange-300 font-semibold">• Portion: {item.variantName}</div>
                        )}
                        {item.addonsSummary && (
                          <div className="text-[10px] text-emerald-300 font-semibold">• {item.addonsSummary}</div>
                        )}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-200 shrink-0">
                      ₹{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Indian GST Billing Breakdown */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Food Subtotal</span>
                <span className="font-mono text-white font-bold">₹{rawSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CGST (2.5%)</span>
                <span className="font-mono text-purple-300 font-bold">₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST (2.5%)</span>
                <span className="font-mono text-purple-300 font-bold">₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Service Charge (5.0%)</span>
                <span className="font-mono text-slate-300 font-bold">₹{serviceCharge.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-700 flex justify-between text-base font-black text-white">
                <span>Grand Total</span>
                <span className="text-orange-400 font-mono text-lg">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Split Bill Calculator */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowSplitCalculator(!showSplitCalculator)}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>{showSplitCalculator ? 'Hide Split Calculator' : 'Split Bill with Friends →'}</span>
              </button>

              {showSplitCalculator && (
                <div className="mt-2 p-3 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-bold">Split between:</span>
                    <select
                      value={splitCount}
                      onChange={(e) => setSplitCount(parseInt(e.target.value) || 1)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                    >
                      <option value={1}>1 Person (Full)</option>
                      <option value={2}>2 People (50%)</option>
                      <option value={3}>3 People (33%)</option>
                      <option value={4}>4 People (25%)</option>
                      <option value={5}>5 People (20%)</option>
                    </select>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-[10px]">Each Pays</div>
                    <div className="text-sm font-black text-emerald-400 font-mono">₹{splitPerPerson.toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Methods / Settlement Flow */}
            {!isPaid ? (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Choose Instant Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'CARD', 'CASH'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                          paymentMethod === m
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                        {m === 'CARD' && <CreditCard className="w-3.5 h-3.5" />}
                        {m === 'CASH' && <Banknote className="w-3.5 h-3.5" />}
                        <span>{m}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'UPI' && (
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center space-x-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-md shrink-0">
                      <QrCode className="w-14 h-14 text-slate-900" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white">Direct Dynamic UPI QR</div>
                      <div className="text-[10px] text-slate-400">
                        Scan via GPay, PhonePe, Paytm, or BHIM
                      </div>
                      <div className="text-xs font-black text-emerald-400 font-mono">
                        Exact Payable: ₹{grandTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'CARD' && (
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-1">
                    <div className="font-bold text-white">Tap & Pay Wireless Terminal</div>
                    <div className="text-[10px] text-slate-400">
                      Handheld POS terminal will be brought to Table #{session.tableNumber}
                    </div>
                  </div>
                )}

                {paymentMethod === 'CASH' && (
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-1">
                    <div className="font-bold text-white">Cash Settlement at Table</div>
                    <div className="text-[10px] text-slate-400">
                      Floor Captain will collect cash and provide physical change.
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePayBill}
                  disabled={isProcessing}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-2xl text-sm transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isProcessing ? 'Verifying Gateway Transaction...' : `Pay ₹${grandTotal.toFixed(2)} & Settle Bill`}</span>
                </button>
              </div>
            ) : (
              <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <div className="text-sm font-black text-white">Bill Settled Successfully!</div>
                <p className="text-xs text-slate-300">
                  Your official printed thermal bill is saved and ready to share.
                </p>

                <div className="flex gap-2 justify-center pt-1">
                  <button
                    type="button"
                    onClick={handleOpenCurrentThermalBill}
                    className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-500/20"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>View Thermal Bill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareReceipt({
                      restaurantName: session.restaurantName,
                      tableNumber: session.tableNumber,
                      orderNumber: currentOrder?.orderNumber || '#ORD-LIVE',
                      subtotal: rawSubtotal,
                      serviceCharge,
                      grandTotal,
                      paymentMethod,
                      paidAt: new Date().toISOString(),
                      items: allItems
                    })}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Share Bill</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-orange-400 flex items-center justify-center mx-auto border border-slate-700">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white">No active table order at the moment</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Orders placed from any partner restaurant will appear here live with split pay and digital settlement.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBrowseRestaurants}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-black rounded-xl text-xs transition shadow-md shadow-orange-500/20 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Find Restaurants & Browse Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PAST DINING ORDERS & INVOICES (AMAZON / FLIPKART TIMELINE FEED) */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-xs font-extrabold text-white">
            <History className="w-4 h-4 text-orange-400" /> Dining History & Past Bills
          </span>
          <span className="text-[11px] text-slate-400">
            {offlineReceipts.length} past visits
          </span>
        </div>

        {offlineReceipts.length === 0 ? (
          <div className="bg-[#151D30] border border-slate-800 rounded-3xl p-8 text-center space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs font-bold text-slate-300">No past dining bills recorded yet</div>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Completed table bills and payments will be saved here in chronological order.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {offlineReceipts.map((rcpt) => (
              <div
                key={rcpt.receiptId}
                onClick={() => setViewingReceipt(rcpt)}
                className="bg-[#151D30] hover:bg-[#182236] border border-slate-800/90 hover:border-slate-700 rounded-3xl p-4 sm:p-5 shadow-lg transition space-y-3 group cursor-pointer active:scale-[0.99]"
              >
                {/* Order Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm sm:text-base font-extrabold text-white group-hover:text-orange-400 transition truncate">
                      {rcpt.restaurantName}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(rcpt.paidAt || Date.now()).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span>• {new Date(rcpt.paidAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      <span>• Table #{rcpt.tableNumber}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-black text-white font-mono">
                      ₹{rcpt.grandTotal.toFixed(2)}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                      PAID ({rcpt.paymentMethod})
                    </span>
                  </div>
                </div>

                {/* Dishes Summary Line */}
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  <span className="font-bold text-orange-400 mr-1">Dishes:</span>
                  {(rcpt.items || []).map((it) => `${it.quantity}x ${it.name}`).join(' • ') || 'Session bill'}
                </div>

                {/* Order Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="font-mono text-[10px] text-slate-500">
                    {rcpt.orderNumber || rcpt.receiptId}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareReceipt(rcpt);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Share this exact bill"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Share</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingReceipt(rcpt);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-md shadow-orange-500/20"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Bill</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorder(rcpt);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition hidden sm:flex items-center gap-1 border border-slate-700 cursor-pointer"
                      title="Order again from this restaurant"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reorder</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* AUTHENTIC RESTAURANT THERMAL POS BILL SLIP MODAL (WITH SHARE FEATURE)     */}
      {/* ========================================================================= */}
      {viewingReceipt && (
        <div
          onClick={() => setViewingReceipt(null)}
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
                  onClick={() => handleShareReceipt(viewingReceipt)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Authentic Thermal Paper Roll Slip */}
            <div className="bg-[#fcfcfa] text-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-8 font-mono text-xs border border-neutral-300 relative overflow-hidden select-text">
              {/* Top Perforated Serrated Edge Illusion */}
              <div className="border-b-2 border-dashed border-neutral-400 pb-3 text-center space-y-1">
                <div className="font-black text-sm uppercase tracking-wider text-black">
                  {viewingReceipt.restaurantName || 'THE PUNJAB HERITAGE KITCHEN'}
                </div>
                <div className="text-[10px] text-neutral-600">
                  BKC Flagship Location, Mumbai - 400051
                </div>
                <div className="text-[9px] text-neutral-500">
                  GSTIN: 27AABCD1234E1Z5 • FSSAI: 11521014000123
                </div>
              </div>

              {/* Bill Metadata */}
              <div className="py-2.5 border-b border-dashed border-neutral-400 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">BILL NO:</span>
                  <span className="font-bold text-black">{viewingReceipt.orderNumber || viewingReceipt.receiptId || viewingReceipt.billId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">DATE & TIME:</span>
                  <span className="font-bold text-black">{new Date(viewingReceipt.paidAt || Date.now()).toLocaleDateString()} {new Date(viewingReceipt.paidAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">TABLE / SERVER:</span>
                  <span className="font-bold text-black">Table #{viewingReceipt.tableNumber || '1'} | Steward</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">BILLED TO:</span>
                  <span className="font-bold text-black">{viewingReceipt.customerName || user?.name || 'Guest Diner'}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-3 border-b border-dashed border-neutral-400 space-y-1.5">
                <div className="flex justify-between text-[10px] font-black text-neutral-600 uppercase border-b border-neutral-300 pb-1">
                  <span>ITEM</span>
                  <div className="flex space-x-4">
                    <span className="w-8 text-right">QTY</span>
                    <span className="w-16 text-right">AMOUNT</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1 max-h-52 overflow-y-auto">
                  {(viewingReceipt.items || []).map((it: any, i: number) => (
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

              {/* Taxes & Totals */}
              <div className="py-2.5 border-b-2 border-dashed border-neutral-400 text-[11px] space-y-1">
                <div className="flex justify-between text-neutral-700">
                  <span>SUBTOTAL:</span>
                  <span className="font-bold">₹{viewingReceipt.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>CGST (2.5%):</span>
                  <span>₹{(viewingReceipt.subtotal * 0.025).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>SGST (2.5%):</span>
                  <span>₹{(viewingReceipt.subtotal * 0.025).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>SERVICE CHG (5.0%):</span>
                  <span>₹{(viewingReceipt.subtotal * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-black pt-1 border-t border-neutral-300">
                  <span>NET PAYABLE:</span>
                  <span>₹{viewingReceipt.grandTotal?.toFixed(2)}</span>
                </div>
              </div>

              {/* Settlement Stamp & Footer */}
              <div className="pt-3 text-center space-y-2">
                <div className="inline-block px-3 py-1 border-2 border-emerald-600 text-emerald-800 rounded font-black text-[10px] uppercase tracking-wider">
                  PAID IN FULL via {viewingReceipt.paymentMethod || 'UPI'}
                </div>
                <div className="text-[10px] text-neutral-600">
                  *** THANK YOU FOR DINING WITH US! ***
                </div>
                <div className="text-[9px] text-neutral-400">
                  POWERED BY DINEDECK SMART POS
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
