import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { printTaxInvoice } from '../utils/thermalPrinter';
import {
  TableDiningSessionSummary,
  BillCalculationBreakdown,
  BillingDashboardKpis,
  HistoricalBillSummary,
  PaymentMethod,
  DiscountType,
  TableItem
} from '../types';
import {
  Receipt,
  CreditCard,
  QrCode,
  CheckCircle2,
  Printer,
  RefreshCw,
  Search,
  IndianRupee,
  Clock,
  User as UserIcon,
  Maximize2,
  Minimize2,
  History,
  AlertTriangle,
  FileText,
  X,
  Check,
  Layers,
  ArrowRight,
  ShieldCheck,
  Grid,
  Zap,
  Split,
  Calendar,
  Sparkles
} from 'lucide-react';

interface BillingCashierProps {
  orders?: any[];
  onRefresh?: () => void;
}

type PeriodFilter = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH';
type CashierTab = 'INVOICES' | 'SETTLEMENT' | 'HISTORY';

export const BillingCashier: React.FC<BillingCashierProps> = () => {
  const { restaurant, user } = useAuth();

  // Active Cashier Workspace Tab
  const [activeTab, setActiveTab] = useState<CashierTab>('INVOICES');

  // Date Filter Period for KPIs and History
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('TODAY');

  // Core POS State
  const [sessions, setSessions] = useState<TableDiningSessionSummary[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [kpis, setKpis] = useState<BillingDashboardKpis | null>(null);
  const [historyList, setHistoryList] = useState<HistoricalBillSummary[]>([]);
  
  // Selected Session for Settlement
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionBillData, setSessionBillData] = useState<{
    session: TableDiningSessionSummary;
    calculation: BillCalculationBreakdown;
    bill: any;
  } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Settlement & Payment Mode Allocation
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'CARD' | 'SPLIT'>('UPI');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [cardRefNumber, setCardRefNumber] = useState<string>('');
  const [upiRefNumber, setUpiRefNumber] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');

  // Multi-Mode Split Amounts
  const [splitAmounts, setSplitAmounts] = useState<{
    upi: number;
    cash: number;
    card: number;
  }>({ upi: 0, cash: 0, card: 0 });

  // Discount Controls
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');

  // Success Feedback Banner
  const [settlementSuccessMsg, setSettlementSuccessMsg] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------
  const loadSessionsAndKpis = useCallback(async () => {
    if (!restaurant?.id) return;
    setIsLoading(true);
    try {
      const [sessRes, kpiRes, tablesRes] = await Promise.all([
        api.fetchBillingSessions(restaurant.id),
        api.fetchBillingKpis(restaurant.id),
        api.fetchTables(restaurant.id)
      ]);

      if (sessRes.success && sessRes.data) {
        setSessions(sessRes.data.sessions || []);
      }
      if (kpiRes.success && kpiRes.data) {
        setKpis(kpiRes.data);
      }
      if (tablesRes.success && tablesRes.data) {
        setTables(tablesRes.data);
      }
    } catch (err) {
      console.error('[BillingCashier] Failed to load sessions/kpis:', err);
    } finally {
      setIsLoading(false);
    }
  }, [restaurant?.id]);

  const loadHistoryForPeriod = useCallback(async (period: PeriodFilter) => {
    if (!restaurant?.id) return;
    try {
      const res = await api.fetchBillingHistory({
        restaurantId: restaurant.id,
        period: period
      });
      if (res.success && res.data) {
        setHistoryList(res.data);
      }
    } catch (err) {
      console.error('[BillingCashier] Failed to load history for period:', err);
    }
  }, [restaurant?.id]);

  const loadSessionBill = useCallback(async (sessionId: string) => {
    if (!restaurant?.id) return;
    try {
      const res = await api.fetchTableSessionBill(sessionId, restaurant.id);
      if (res.success && res.data) {
        setSessionBillData(res.data);
        if (res.data.calculation?.discountPercent) {
          setDiscountPercent(res.data.calculation.discountPercent);
        }
        // Initialize split amounts default
        const grandTotal = res.data.calculation.grandTotal || 0;
        setSplitAmounts({
          upi: Math.round(grandTotal / 2),
          cash: grandTotal - Math.round(grandTotal / 2),
          card: 0
        });
      }
    } catch (err) {
      console.error('[BillingCashier] Failed to load bill calculation:', err);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    loadSessionsAndKpis();
    loadHistoryForPeriod(selectedPeriod);
  }, [loadSessionsAndKpis, loadHistoryForPeriod, selectedPeriod]);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionBill(selectedSessionId);
    } else {
      setSessionBillData(null);
    }
  }, [selectedSessionId, loadSessionBill]);

  // Selected Session Details
  const selectedSession = useMemo(() => {
    return sessions.find((s) => s.sessionId === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  // Itemized Order items from Session Bill
  const sessionBillItems = useMemo(() => {
    if (!sessionBillData?.session?.orders) return [];
    return sessionBillData.session.orders.flatMap((o: any) => o.items || []);
  }, [sessionBillData]);

  // Helper for Floor name
  const getTableFloor = (table: TableItem | string) => {
    if (typeof table === 'object' && table.floor) {
      return table.floor;
    }
    const tableNumber = typeof table === 'string' ? table : table?.tableNumber || '';
    const clean = tableNumber.replace(/^(Table|T)[\s#-]*/i, '').trim();
    const num = parseInt(clean, 10);
    if (isNaN(num)) return 'Ground Floor';
    if (num <= 6) return 'Ground Floor (Main Hall)';
    if (num <= 10) return 'First Floor (AC Hall)';
    if (num <= 13) return 'Rooftop Garden';
    return 'Outdoor Patio';
  };

  const getFormattedTableTitle = (tableNumber: string) => {
    if (!tableNumber) return 'Table';
    const clean = tableNumber.replace(/^(Table|T)[\s#-]*/i, '').trim();
    return `Table ${clean || tableNumber}`;
  };

  // -------------------------------------------------------------
  // Dynamic Period Metrics Calculation (UPI, Cash, Card, Net Settled)
  // -------------------------------------------------------------
  const periodMetrics = useMemo(() => {
    let upiTotal = 0;
    let upiCount = 0;
    let cashTotal = 0;
    let cashCount = 0;
    let cardTotal = 0;
    let cardCount = 0;
    let grandTotalSettled = 0;
    let totalSettledCount = historyList.length;

    historyList.forEach((bill) => {
      grandTotalSettled += bill.grandTotal || 0;

      // Check payments array for split / multi-mode breakdowns
      if (bill.payments && bill.payments.length > 0) {
        bill.payments.forEach((p: any) => {
          if (p.method === 'UPI') {
            upiTotal += p.amount || 0;
            upiCount += 1;
          } else if (p.method === 'CASH') {
            cashTotal += p.amount || 0;
            cashCount += 1;
          } else if (p.method === 'CARD') {
            cardTotal += p.amount || 0;
            cardCount += 1;
          } else {
            upiTotal += p.amount || 0;
            upiCount += 1;
          }
        });
      } else {
        // Fallback to top-level paymentMethod
        if (bill.paymentMethod === 'UPI') {
          upiTotal += bill.grandTotal || 0;
          upiCount += 1;
        } else if (bill.paymentMethod === 'CASH') {
          cashTotal += bill.grandTotal || 0;
          cashCount += 1;
        } else if (bill.paymentMethod === 'CARD') {
          cardTotal += bill.grandTotal || 0;
          cardCount += 1;
        } else {
          upiTotal += bill.grandTotal || 0;
          upiCount += 1;
        }
      }
    });

    // If TODAY and historyList is empty but kpis has values, fallback gracefully
    if (selectedPeriod === 'TODAY' && historyList.length === 0 && kpis) {
      upiTotal = kpis.upiCollectedToday;
      cashTotal = kpis.cashCollectedToday;
      cardTotal = kpis.cardCollectedToday;
      grandTotalSettled = kpis.grossRevenueToday;
      totalSettledCount = kpis.paidBillsTodayCount;
    }

    return {
      upiTotal,
      upiCount,
      cashTotal,
      cashCount,
      cardTotal,
      cardCount,
      grandTotalSettled,
      totalSettledCount
    };
  }, [historyList, selectedPeriod, kpis]);

  // Filtered Sessions Queue for Invoices Tab
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTbl = s.tableNumber?.toLowerCase().includes(q);
        const matchesGuest = s.guestName?.toLowerCase().includes(q);
        const matchesToken = s.sessionToken?.toLowerCase().includes(q);
        if (!matchesTbl && !matchesGuest && !matchesToken) return false;
      }
      if (floorFilter !== 'ALL') {
        const floor = getTableFloor(s.tableNumber);
        if (!floor.toLowerCase().includes(floorFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [sessions, searchQuery, floorFilter]);

  // Filtered History for Settlement History Tab
  const filteredHistory = useMemo(() => {
    return historyList.filter((h) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchesTbl = h.tableNumber?.toLowerCase().includes(q);
      const matchesBill = h.billNumber?.toLowerCase().includes(q);
      const matchesGuest = h.guestName?.toLowerCase().includes(q);
      const matchesPhone = h.guestPhone?.toLowerCase().includes(q);
      return matchesTbl || matchesBill || matchesGuest || matchesPhone;
    });
  }, [historyList, searchQuery]);

  // -------------------------------------------------------------
  // Live Settlement Balance & Change Calculations
  // -------------------------------------------------------------
  const grandTotal = sessionBillData?.calculation?.grandTotal || 0;

  const allocatedAmount = useMemo(() => {
    if (paymentMode === 'SPLIT') {
      return (splitAmounts.upi || 0) + (splitAmounts.cash || 0) + (splitAmounts.card || 0);
    }
    return grandTotal;
  }, [paymentMode, splitAmounts, grandTotal]);

  const remainingBalanceToSettle = useMemo(() => {
    if (paymentMode === 'SPLIT') {
      return Math.max(0, grandTotal - allocatedAmount);
    }
    return 0;
  }, [paymentMode, grandTotal, allocatedAmount]);

  const changeDue = useMemo(() => {
    if (paymentMode !== 'CASH') return 0;
    const tendered = Number(cashTendered || 0);
    return Math.max(0, tendered - grandTotal);
  }, [paymentMode, cashTendered, grandTotal]);

  // -------------------------------------------------------------
  // Actions: Discount, Settlement, Thermal Receipt
  // -------------------------------------------------------------
  const handleApplyDiscount = async (val: number, type: DiscountType = 'PERCENTAGE') => {
    if (!sessionBillData?.bill?.id || !restaurant?.id) return;
    setActionLoading(true);
    try {
      const res = await api.applyBillDiscount(sessionBillData.bill.id, {
        restaurantId: restaurant.id,
        discountType: type,
        discountValue: val,
        reason: discountReason || 'Manager Approval'
      });
      if (res.success) {
        setDiscountPercent(type === 'PERCENTAGE' ? val : 0);
        if (selectedSessionId) {
          await loadSessionBill(selectedSessionId);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to apply discount');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectPrintCurrentBill = (customBillData?: any) => {
    const activeData = customBillData || sessionBillData;
    if (!activeData || !selectedSession) return;
    const calc = activeData.calculation || activeData;
    const bill = activeData.bill;

    printTaxInvoice({
      restaurantName: restaurant?.name || 'THE PUNJAB HERITAGE',
      address: (restaurant as any)?.address || 'BKC Flagship, G-Block, Bandra Kurla Complex, Mumbai',
      gstin: (restaurant as any)?.gstin || '27AABCU9603R1ZM',
      fssaiLicense: (restaurant as any)?.fssaiLicense || '11522001000452',
      phone: (restaurant as any)?.phone || '+91 98200 44556',
      invoiceNumber: bill?.billNumber || `INV-${Date.now().toString().slice(-4)}`,
      tableNumber: String(selectedSession.tableNumber),
      floor: getTableFloor(selectedSession.tableNumber),
      guestCount: selectedSession.capacity || 2,
      serverName: (selectedSession as any)?.serverName || 'Ramesh Kumar',
      cashierName: user?.name || 'Cashier Desk 01',
      items: (calc.items || sessionBillItems || []).map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        notes: i.specialNotes
      })),
      subtotal: calc.subtotal || 0,
      discountAmount: calc.discountAmount || 0,
      discountPercent: calc.discountPercentage || 0,
      taxableAmount: calc.taxableAmount || 0,
      cgstAmount: calc.cgstAmount || 0,
      sgstAmount: calc.sgstAmount || 0,
      serviceCharge: calc.serviceChargeAmount || 0,
      roundOff: calc.roundOffAmount || 0,
      grandTotal: calc.grandTotal || 0,
      paymentMethod: paymentMode,
      paymentRef: paymentMode === 'CARD' ? cardRefNumber : paymentMode === 'UPI' ? upiRefNumber : undefined,
      status: 'PAID & SETTLED'
    });
  };

  // Complete Final Settlement Action
  const handleCompleteFinalSettlement = async () => {
    if (!sessionBillData?.bill?.id || !restaurant?.id) return;
    if (paymentMode === 'SPLIT' && remainingBalanceToSettle > 0) {
      alert(`Please allocate the remaining ₹${remainingBalanceToSettle.toFixed(2)} before finalizing settlement.`);
      return;
    }

    setActionLoading(true);
    try {
      let splitPayload: any[] | undefined = undefined;
      if (paymentMode === 'SPLIT') {
        splitPayload = [];
        if (splitAmounts.upi > 0) {
          splitPayload.push({ label: 'UPI Payment', amount: splitAmounts.upi, method: 'UPI' });
        }
        if (splitAmounts.cash > 0) {
          splitPayload.push({ label: 'Cash Payment', amount: splitAmounts.cash, method: 'CASH' });
        }
        if (splitAmounts.card > 0) {
          splitPayload.push({ label: 'Card Payment', amount: splitAmounts.card, method: 'CARD' });
        }
      }

      const res = await api.settleBill(sessionBillData.bill.id, {
        restaurantId: restaurant.id,
        method: paymentMode === 'SPLIT' ? 'SPLIT' : (paymentMode as PaymentMethod),
        amountPaid: grandTotal,
        referenceNumber: paymentMode === 'CARD' ? cardRefNumber : paymentMode === 'UPI' ? upiRefNumber : undefined,
        note: paymentNote || undefined,
        splitItems: splitPayload
      });

      if (res.success && res.data) {
        const settledTableNumber = selectedSession?.tableNumber || 'Table';
        const invoiceNum = sessionBillData.bill.billNumber || 'INV-SETTLED';

        // Direct 80mm thermal receipt print
        handleDirectPrintCurrentBill();

        // Show banner
        setSettlementSuccessMsg(
          `Final Settlement of ₹${grandTotal.toFixed(2)} completed for ${getFormattedTableTitle(
            settledTableNumber
          )} (${invoiceNum}). Table is now vacant.`
        );
        setTimeout(() => setSettlementSuccessMsg(null), 6000);

        // Reset selected session and reload data
        setSelectedSessionId(null);
        setSessionBillData(null);
        await Promise.all([loadSessionsAndKpis(), loadHistoryForPeriod(selectedPeriod)]);
        setActiveTab('HISTORY');
      } else {
        alert(res.message || 'Settlement failed');
      }
    } catch (err: any) {
      alert(err.message || 'Settlement error');
    } finally {
      setActionLoading(false);
    }
  };

  const getPeriodLabel = (p: PeriodFilter) => {
    switch (p) {
      case 'TODAY':
        return 'Today';
      case 'YESTERDAY':
        return 'Yesterday';
      case 'WEEK':
        return 'This Week';
      case 'MONTH':
        return 'This Month';
      default:
        return 'Today';
    }
  };

  return (
    <div className={`space-y-5 pb-10 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-[#0B0F19] p-6 overflow-y-auto' : ''}`}>
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER WITH DATE FILTER SELECTOR & FAST REFRESH         */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Cashier & Billing Workstation
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Live Operations
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                GST Tax Invoices, Payment Collection (UPI / Cash / Card / Split), and Receipt History.
              </p>
            </div>
          </div>

          {/* Top Actions: Period Filter Buttons & Refresh */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Period Filters: Today, Yesterday, This Week, This Month */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-1 shadow-inner">
              {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => {
                    setSelectedPeriod(period);
                    loadHistoryForPeriod(period);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === period
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {getPeriodLabel(period)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                loadSessionsAndKpis();
                loadHistoryForPeriod(selectedPeriod);
              }}
              disabled={isLoading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              title="Refresh Live Billing & History"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Workstation'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {settlementSuccessMsg && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{settlementSuccessMsg}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. TOP 4 SUMMARY BOXES: UPI, CASH, CARDS, NET TOTAL SETTLED  */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {/* Box 1: UPI Collections */}
          <div className="bg-white dark:bg-slate-900/90 border border-purple-200 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-500/50 rounded-2xl p-4 shadow-sm dark:shadow-lg flex items-center justify-between transition-all">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI Collections</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                ₹{periodMetrics.upiTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {periodMetrics.upiCount} UPI / QR Payments ({getPeriodLabel(selectedPeriod)})
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
          </div>

          {/* Box 2: Cash Collections */}
          <div className="bg-white dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-400 dark:hover:border-emerald-500/50 rounded-2xl p-4 shadow-sm dark:shadow-lg flex items-center justify-between transition-all">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Cash Collections</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                ₹{periodMetrics.cashTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {periodMetrics.cashCount} Cash Settlements ({getPeriodLabel(selectedPeriod)})
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>

          {/* Box 3: Card Collections */}
          <div className="bg-white dark:bg-slate-900/90 border border-blue-200 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-2xl p-4 shadow-sm dark:shadow-lg flex items-center justify-between transition-all">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card Collections</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                ₹{periodMetrics.cardTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {periodMetrics.cardCount} POS Card Swipes ({getPeriodLabel(selectedPeriod)})
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          {/* Box 4: Net Total Settlements */}
          <div className="bg-white dark:bg-slate-900/90 border border-orange-200 dark:border-orange-500/40 hover:border-orange-400 dark:hover:border-orange-500/60 rounded-2xl p-4 shadow-sm dark:shadow-lg flex items-center justify-between transition-all bg-gradient-to-br from-orange-500/5 to-transparent">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Net Total Settled</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                ₹{periodMetrics.grandTotalSettled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {periodMetrics.totalSettledCount} Invoices Settled ({getPeriodLabel(selectedPeriod)})
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. PRIMARY WORKSPACE NAVIGATION TABS                         */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-sm dark:shadow-md">
        <button
          type="button"
          onClick={() => setActiveTab('INVOICES')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'INVOICES'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices & Bills</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-950/80 text-orange-600 dark:text-orange-300 font-mono font-bold">
            {sessions.length} Active
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SETTLEMENT')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SETTLEMENT'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Collect Payment</span>
          {selectedSession && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {getFormattedTableTitle(selectedSession.tableNumber)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('HISTORY');
            loadHistoryForPeriod(selectedPeriod);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'HISTORY'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Payment History</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 font-mono font-bold">
            {historyList.length}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. TAB CONTENT 1: INVOICES & RUNNING BILLS                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                <span>Live Running Invoices & Dining Tables</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select any table to review itemized GST bills, apply authorized discounts, and collect payment via UPI, Cash, or Card.
              </p>
            </div>

            {/* Search & Floor Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search table or guest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 w-44 sm:w-56 font-medium"
                />
              </div>

              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">All Floors</option>
                <option value="Ground">Ground Floor</option>
                <option value="First">First Floor</option>
                <option value="Rooftop">Rooftop</option>
                <option value="Patio">Patio</option>
              </select>
            </div>
          </div>

          {/* Invoices Grid */}
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Receipt className="w-8 h-8 mx-auto text-slate-600" />
              <div className="text-sm font-bold text-slate-400">No Active Running Bills</div>
              <p className="text-xs text-slate-500">
                All tables are settled or no dining orders are currently placed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSessions.map((sess) => {
                const isSelected = sess.sessionId === selectedSessionId;
                const floor = getTableFloor(sess.tableNumber);

                return (
                  <div
                    key={sess.sessionId}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900/90 shadow-sm dark:shadow-md ${
                      isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-md">
                          {sess.tableNumber.replace(/^(Table|T)[\s#-]*/i, '')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {getFormattedTableTitle(sess.tableNumber)}
                          </div>
                          <div className="text-[10px] text-slate-500">{floor}</div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {sess.totalOrdersCount || sess.orders?.length || 1} Orders Placed
                      </span>
                    </div>

                    {/* Guest & Timing */}
                    <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-b border-slate-100 dark:border-slate-800/80 py-2">
                      <div className="flex items-center justify-between">
                        <span>Guest Name:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{sess.guestName || 'Walk-in Guest'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Server Assigned:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{(sess as any).serverName || 'Ramesh Kumar'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Seated Since:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono">
                          {new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Running Total:</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                          ₹{(sess.runningGrandTotal || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSessionId(sess.sessionId);
                            setActiveTab('SETTLEMENT');
                          }}
                          className="py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Settle Bill</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSessionId(sess.sessionId);
                            setTimeout(() => handleDirectPrintCurrentBill(), 300);
                          }}
                          className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border border-slate-300 dark:border-slate-700 transition flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                          <span>Pre-Bill</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. TAB CONTENT 2: SETTLEMENT & MULTI-MODE PAY WORKSTATION      */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'SETTLEMENT' && (
        <div className="space-y-4">
          {!selectedSession ? (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-4 shadow-sm dark:shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20 flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Select a Table to Collect Payment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Pick an active dining session from below to review the itemized breakdown, select payment mode, and generate the tax invoice.
                </p>
              </div>

              {/* Table Quick Selector Dropdown */}
              <div className="max-w-xs mx-auto">
                <select
                  value={selectedSessionId || ''}
                  onChange={(e) => setSelectedSessionId(e.target.value || null)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Choose Active Table --</option>
                  {sessions.map((s) => (
                    <option key={s.sessionId} value={s.sessionId}>
                      {getFormattedTableTitle(s.tableNumber)} - ₹{(s.runningGrandTotal || 0).toFixed(2)} ({s.guestName || 'Guest'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 7 Columns: Bill Breakdown & Itemized Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
                  {/* Table Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-orange-500/20">
                        {selectedSession.tableNumber.replace(/^(Table|T)[\s#-]*/i, '')}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {getFormattedTableTitle(selectedSession.tableNumber)}
                          </h3>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                            {sessionBillData?.bill?.billNumber || 'INV-PENDING'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {getTableFloor(selectedSession.tableNumber)} • Guest: {selectedSession.guestName || 'Walk-in'} • Server: {(selectedSession as any).serverName || 'Ramesh Kumar'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSessionId(null)}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer transition"
                    >
                      Change Table
                    </button>
                  </div>

                  {/* Itemized Order List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(sessionBillItems.length > 0 ? sessionBillItems : (sessionBillData?.calculation as any)?.items || []).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.quantity}x {item.name}
                          </div>
                          {item.variantName && (
                            <div className="text-[10px] text-slate-500">{item.variantName}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 dark:text-white font-mono">
                            ₹{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            @ ₹{item.unitPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Discount Selector */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
                      <span className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                        <span>Apply Bill Discount</span>
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">{discountPercent}% Applied</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[0, 5, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleApplyDiscount(pct)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            discountPercent === pct
                              ? 'bg-orange-500 text-white shadow'
                              : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {pct === 0 ? 'No Discount' : `${pct}% Off`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculation Breakdown Details */}
                  {sessionBillData?.calculation && (
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="font-mono text-slate-900 dark:text-white font-bold">
                          ₹{sessionBillData.calculation.subtotal.toFixed(2)}
                        </span>
                      </div>
                      {sessionBillData.calculation.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Discount Applied:</span>
                          <span className="font-mono font-bold">
                            - ₹{sessionBillData.calculation.discountAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>CGST (2.5%):</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          ₹{sessionBillData.calculation.cgstAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST (2.5%):</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          ₹{sessionBillData.calculation.sgstAmount.toFixed(2)}
                        </span>
                      </div>
                      {sessionBillData.calculation.serviceChargeAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Service Charge (5%):</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            ₹{sessionBillData.calculation.serviceChargeAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span>Grand Total (Net Payable):</span>
                        <span className="text-lg text-orange-600 dark:text-orange-400 font-mono">
                          ₹{sessionBillData.calculation.grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right 5 Columns: Payment Mode & Settlement Execution */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
                  <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                      <span>Select Payment Mode</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Choose exact collection mode or split across multiple methods.
                    </p>
                  </div>

                  {/* Payment Mode Selector Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('UPI')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition text-xs font-bold cursor-pointer ${
                        paymentMode === 'UPI'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>UPI / QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('CASH')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition text-xs font-bold cursor-pointer ${
                        paymentMode === 'CASH'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <IndianRupee className="w-4 h-4" />
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('CARD')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition text-xs font-bold cursor-pointer ${
                        paymentMode === 'CARD'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Card / POS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('SPLIT')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition text-xs font-bold cursor-pointer ${
                        paymentMode === 'SPLIT'
                          ? 'bg-orange-500/20 border-orange-500 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/20'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Split className="w-4 h-4" />
                      <span>Split Pay</span>
                    </button>
                  </div>

                  {/* Payment Mode Interactive Sub-Forms */}
                  {paymentMode === 'UPI' && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>UPI Payment Verification</span>
                        <span className="text-purple-600 dark:text-purple-400 font-mono font-black">₹{grandTotal.toFixed(2)}</span>
                      </div>
                      <input
                        type="text"
                        placeholder="UPI Transaction ID / UTR (Optional)"
                        value={upiRefNumber}
                        onChange={(e) => setUpiRefNumber(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}

                  {paymentMode === 'CASH' && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>Cash Tendered</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">Due: ₹{grandTotal.toFixed(2)}</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          placeholder="Amount received from guest..."
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Quick Cash Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[grandTotal, Math.ceil(grandTotal / 100) * 100, Math.ceil(grandTotal / 500) * 500, 2000].map(
                          (amt, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCashTendered(String(amt))}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition"
                            >
                              ₹{amt}
                            </button>
                          )
                        )}
                      </div>

                      {/* Return Change */}
                      {Number(cashTendered) > grandTotal && (
                        <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <span>Return Change to Guest:</span>
                          <span className="font-mono text-sm">₹{changeDue.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMode === 'CARD' && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Card POS Authorization</span>
                        <span className="text-blue-600 dark:text-blue-400 font-mono font-black">₹{grandTotal.toFixed(2)}</span>
                      </div>
                      <input
                        type="text"
                        placeholder="POS Terminal Approval Code / Card Last 4 digits"
                        value={cardRefNumber}
                        onChange={(e) => setCardRefNumber(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}

                  {paymentMode === 'SPLIT' && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Multi-Mode Payment Allocation</span>
                        <span className="text-orange-600 dark:text-orange-400 font-mono font-black">Bill: ₹{grandTotal.toFixed(2)}</span>
                      </div>

                      <div className="space-y-2">
                        {/* UPI Split */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                            <span>UPI:</span>
                          </span>
                          <div className="relative w-36">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                            <input
                              type="number"
                              value={splitAmounts.upi || ''}
                              onChange={(e) =>
                                setSplitAmounts({ ...splitAmounts, upi: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-6 pr-2 py-1 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>

                        {/* Cash Split */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                            <span>Cash:</span>
                          </span>
                          <div className="relative w-36">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                            <input
                              type="number"
                              value={splitAmounts.cash || ''}
                              onChange={(e) =>
                                setSplitAmounts({ ...splitAmounts, cash: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-6 pr-2 py-1 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>

                        {/* Card Split */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                            <span>Card:</span>
                          </span>
                          <div className="relative w-36">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                            <input
                              type="number"
                              value={splitAmounts.card || ''}
                              onChange={(e) =>
                                setSplitAmounts({ ...splitAmounts, card: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-6 pr-2 py-1 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Live Allocation Summary */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-bold">
                        <span className="text-slate-600 dark:text-slate-400">Total Allocated:</span>
                        <span className="font-mono text-slate-900 dark:text-white">₹{allocatedAmount.toFixed(2)}</span>
                      </div>

                      {remainingBalanceToSettle > 0 ? (
                        <div className="p-2 bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] font-bold flex items-center justify-between">
                          <span>Left to Settle:</span>
                          <span className="font-mono">₹{remainingBalanceToSettle.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-bold text-center">
                          ✓ 100% of Bill Allocated
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cashier Notes */}
                  <input
                    type="text"
                    placeholder="Payment note (Optional)"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />

                  {/* Complete Final Settlement Action Button */}
                  <button
                    type="button"
                    disabled={actionLoading || (paymentMode === 'SPLIT' && remainingBalanceToSettle > 0)}
                    onClick={handleCompleteFinalSettlement}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {actionLoading ? 'Finalizing...' : `Complete Payment (₹${grandTotal.toFixed(2)})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. TAB CONTENT 3: SETTLEMENT HISTORY & AUDIT LEDGER           */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                <span>Payment History & Receipts ({getPeriodLabel(selectedPeriod)})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete history of all completed customer payments and receipts with exact payment mode breakdown.
              </p>
            </div>

            {/* Search History */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice, table, or guest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 w-56 font-medium"
              />
            </div>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Invoice #</th>
                  <th className="px-4 py-3.5">Table</th>
                  <th className="px-4 py-3.5">Guest Name</th>
                  <th className="px-4 py-3.5">Settled Time</th>
                  <th className="px-4 py-3.5">Payment Mode</th>
                  <th className="px-4 py-3.5">Cashier</th>
                  <th className="px-4 py-3.5 text-right">Grand Total</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-slate-950/40">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                      No settled invoices found for {getPeriodLabel(selectedPeriod)}.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((h) => {
                    const settledTimeStr = new Date(h.settledAt || h.paidAt || h.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const settledDateStr = new Date(h.settledAt || h.paidAt || h.createdAt).toLocaleDateString();

                    return (
                      <tr key={h.billId} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          {h.billNumber || `#${h.billId.slice(0, 8)}`}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-orange-600 dark:text-orange-400">
                          {getFormattedTableTitle(h.tableNumber)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-800 dark:text-slate-300">
                          {h.guestName || 'Walk-in Guest'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <div>{settledTimeStr}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">{settledDateStr}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          {h.payments && h.payments.length > 1 ? (
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300 border border-orange-500/30">
                                SPLIT
                              </span>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {h.payments.map((p) => `${p.method}: ₹${p.amount}`).join(' + ')}
                              </div>
                            </div>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                h.paymentMethod === 'UPI'
                                  ? 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                  : h.paymentMethod === 'CASH'
                                  ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {h.paymentMethod || 'PAID'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                          {h.settledBy || user?.name || 'Cashier Desk'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                          ₹{h.grandTotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDirectPrintCurrentBill({ calculation: h, bill: h })}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                            <span>Reprint Receipt</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
