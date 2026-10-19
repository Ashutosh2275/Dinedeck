import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { printKitchenKOT } from '../utils/thermalPrinter';
import {
  KdsTicketCard,
  KdsStationSummary,
  KitchenKdsSetting,
  MenuItem,
  KdsPriority,
  KdsItemStatus
} from '../types';
import { api } from '../services/api';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Flame,
  Utensils,
  Bell,
  Maximize2,
  Minimize2,
  Printer,
  RotateCcw,
  Pause,
  Play,
  Check,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  AlertOctagon,
  UserCheck,
  Coffee,
  IceCream,
  CheckSquare,
  Square,
  AlertCircle,
  Undo2,
  History,
  Layers,
  Filter
} from 'lucide-react';
import { OrderRejectionModal } from '../components/OrderRejectionModal';
import { OrderCountdownBadge } from '../components/OrderCountdownBadge';

interface KitchenKDSProps {
  orders?: any[];
  onRefresh?: () => void;
}

export const KitchenKDS: React.FC<KitchenKDSProps> = () => {
  const { restaurant } = useAuth();

  // Primary Tab View Mode: 'ACTIVE' (currently in kitchen) vs 'ALL' (active + past history)
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'ALL'>('ACTIVE');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'YESTERDAY' | 'ALL'>('TODAY');

  // Core Data States
  const [tickets, setTickets] = useState<KdsTicketCard[]>([]);
  const [stations, setStations] = useState<KdsStationSummary[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Partial Acceptance Item Decisions: { [orderId]: { [itemId]: boolean (true = accept, false = reject) } }
  const [itemDecisions, setItemDecisions] = useState<Record<string, Record<string, boolean>>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Views
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'FIFO' | 'NEWEST' | 'SLA_RISK' | 'TABLE'>('FIFO');
  const [densityMode, setDensityMode] = useState<'COMPACT' | 'COMFORTABLE'>('COMPACT');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Modals
  const [rejectModalOrder, setRejectModalOrder] = useState<KdsTicketCard | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [holdModalOrder, setHoldModalOrder] = useState<KdsTicketCard | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [refireModalOrder, setRefireModalOrder] = useState<KdsTicketCard | null>(null);
  const [refireReason, setRefireReason] = useState('');
  const [refireSelectedItems, setRefireSelectedItems] = useState<string[]>([]);
  const [kotSlipData, setKotSlipData] = useState<{ kot: any; thermalSlip: string } | null>(null);
  const [isMenuControlsModalOpen, setIsMenuControlsModalOpen] = useState(false);
  const [menuModalTab, setMenuModalTab] = useState<'OUT_OF_STOCK' | 'TODAYS_SPECIAL'>('OUT_OF_STOCK');
  const [menuModalSearch, setMenuModalSearch] = useState('');

  // Sound Audio Context Ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousTicketsCountRef = useRef<number>(0);

  // Play Sound Alert via Web Audio API
  const playAlertTone = (type: 'NEW_ORDER' | 'SLA_ALERT' | 'READY') => {
    if (!isAudioEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'NEW_ORDER') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'SLA_ALERT') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'READY') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn('[KDS Audio] Tone failed:', e);
    }
  };

  // 1. Fetch KDS Live Queue Data
  const fetchKdsData = async () => {
    if (!restaurant?.id) return;
    try {
      const statusParam = viewMode === 'ACTIVE' ? 'ACTIVE' : 'ALL';
      const res = await api.fetchKdsQueue(restaurant.id, {
        stationCode: selectedStation,
        status: statusParam,
        search: searchQuery,
        dateFilter: viewMode === 'ALL' ? dateFilter : undefined
      });

      if (res.success && res.data) {
        const newTickets = res.data.tickets || [];
        setTickets(newTickets);
        setStations(res.data.stations || []);

        if (newTickets.length > previousTicketsCountRef.current && previousTicketsCountRef.current > 0) {
          playAlertTone('NEW_ORDER');
        }
        previousTicketsCountRef.current = newTickets.length;
      }
    } catch (err) {
      console.error('[KDS] Fetch queue error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch Supporting Menu for Out of Stock Modal
  const fetchSupportingData = async () => {
    if (!restaurant?.id) return;
    try {
      const menuRes = await api.fetchMenu(restaurant.id);
      if (menuRes.success && menuRes.data) {
        setMenuItems(menuRes.data.flatMap((c: any) => c.items || []));
      }
    } catch (err) {
      console.error('[KDS] Menu fetch error:', err);
    }
  };

  useEffect(() => {
    fetchKdsData();
    fetchSupportingData();

    // 4-second background refresh
    const pollInterval = setInterval(() => {
      fetchKdsData();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [restaurant?.id, viewMode, selectedStation, searchQuery, dateFilter]);

  // Item-level acceptance decision toggle (for PLACED orders)
  const handleSetItemDecision = (orderId: string, itemId: string, accepted: boolean) => {
    setItemDecisions((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [itemId]: accepted
      }
    }));
  };

  // Accept Order (Full or Partial)
  const handleAcceptOrderWithDecisions = async (ticket: KdsTicketCard) => {
    if (!restaurant?.id) return;
    const orderDecisions = itemDecisions[ticket.id] || {};
    const hasRejections = ticket.items.some((item) => orderDecisions[item.id] === false);

    if (hasRejections) {
      const payloadDecisions = ticket.items.map((item) => ({
        itemId: item.id,
        accepted: orderDecisions[item.id] !== false,
        rejectReason: orderDecisions[item.id] === false ? 'Item is out of stock in kitchen' : undefined
      }));

      const res = await api.partialAcceptOrRejectKdsOrder(ticket.id, payloadDecisions, restaurant.id);
      if (res.success) {
        playAlertTone('NEW_ORDER');
        setToastMessage(`Order #${ticket.orderNumber} partially accepted (${res.data?.acceptedItems?.length || 0} items cooking, ${res.data?.rejectedItems?.length || 0} marked out of stock)`);
        setTimeout(() => setToastMessage(null), 5000);
        fetchKdsData();
      } else {
        alert(res.message || 'Failed to process partial acceptance');
      }
    } else {
      const res = await api.acceptKdsOrder(ticket.id, restaurant.id);
      if (res.success) {
        playAlertTone('NEW_ORDER');
        setToastMessage(`Order #${ticket.orderNumber} accepted & sent to kitchen!`);
        setTimeout(() => setToastMessage(null), 4000);
        fetchKdsData();
      } else {
        alert(res.message || 'Failed to accept order');
      }
    }
  };

  // Revert / Undo Accidental Acceptance
  const handleUndoAcceptance = async (ticket: KdsTicketCard) => {
    if (!restaurant?.id) return;
    const confirmed = window.confirm(`Mistake? Revert Order #${ticket.orderNumber} (Table ${ticket.tableNumber}) back to Placed state so it won't proceed?`);
    if (!confirmed) return;

    const res = await api.undoKdsOrderAcceptance(ticket.id, restaurant.id);
    if (res.success) {
      setToastMessage(`â†© Order #${ticket.orderNumber} reverted back to Placed state. Preparation halted.`);
      setTimeout(() => setToastMessage(null), 5000);
      fetchKdsData();
    } else {
      alert(res.message || 'Failed to revert order acceptance');
    }
  };

  // Reject Order
  const handleConfirmReject = async (payload: { reasonCode: string; reason: string; customReason?: string }) => {
    if (!rejectModalOrder || !restaurant?.id) return;
    const res = await api.rejectKdsOrder(
      rejectModalOrder.id,
      payload.reason,
      restaurant.id,
      payload.reasonCode,
      payload.customReason
    );
    if (res.success) {
      setRejectModalOrder(null);
      setToastMessage(`Order #${rejectModalOrder.orderNumber} rejected.`);
      setTimeout(() => setToastMessage(null), 4000);
      fetchKdsData();
    } else {
      alert(res.message || 'Failed to reject order');
    }
  };

  // Item Status Toggle
  const handleToggleItemStatus = async (orderItemId: string, currentStatus: KdsItemStatus) => {
    if (!restaurant?.id) return;
    const nextStatus: KdsItemStatus = currentStatus === 'PREPARING' ? 'READY' : 'PREPARING';
    const res = await api.updateKdsItemStatus(orderItemId, nextStatus, restaurant.id);
    if (res.success) {
      if (res.data?.allReady) {
        playAlertTone('READY');
      }
      fetchKdsData();
    }
  };

  // Hold Order
  const handleConfirmHold = async () => {
    if (!holdModalOrder || !restaurant?.id) return;
    const res = await api.holdKdsOrder(holdModalOrder.id, holdReason || 'Held by kitchen', restaurant.id);
    if (res.success) {
      setHoldModalOrder(null);
      setHoldReason('');
      fetchKdsData();
    }
  };

  // Resume Order
  const handleResumeOrder = async (orderId: string) => {
    if (!restaurant?.id) return;
    const res = await api.resumeKdsOrder(orderId, restaurant.id);
    if (res.success) {
      fetchKdsData();
    }
  };

  // Re-Fire Order
  const handleConfirmRefire = async () => {
    if (!refireModalOrder || !restaurant?.id || !refireReason.trim()) return;
    const res = await api.refireKdsOrder(refireModalOrder.id, refireReason, refireSelectedItems, restaurant.id);
    if (res.success) {
      playAlertTone('NEW_ORDER');
      setRefireModalOrder(null);
      setRefireReason('');
      setRefireSelectedItems([]);
      fetchKdsData();
    } else {
      alert(res.message || 'Failed to generate re-fire ticket');
    }
  };

  // Expo Pass / Mark All Ready
  const handleExpoPass = async (orderId: string) => {
    if (!restaurant?.id) return;
    const res = await api.expoPassKdsOrder(orderId, restaurant.id);
    if (res.success) {
      playAlertTone('READY');
      fetchKdsData();
    }
  };

  // Notify Waiter
  const handleNotifyWaiter = async (orderId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === orderId ? { ...t, waiterNotifiedAt: new Date().toISOString() } : t))
    );
    try {
      const res = await api.notifyWaiterForKdsOrder(orderId);
      if (res.success) {
        setToastMessage(res.message || 'Buzzer alert sent directly to Table Server for immediate pickup!');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mark Served
  const handleMarkServed = async (orderId: string) => {
    if (!restaurant?.id) return;
    const res = await api.markKdsOrderServed(orderId, restaurant.id);
    if (res.success) {
      fetchKdsData();
    }
  };

  // Print KOT Slip directly to 80mm thermal printer
  const handlePrintOrderKotSlip = (ticket: KdsTicketCard) => {
    try {
      printKitchenKOT({
        kotNumber: ticket.kotTickets?.[0]?.kotNumber || ticket.orderNumber,
        tableNumber: String(ticket.tableNumber),
        items: ticket.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          notes: i.kitchenNotes || undefined,
          customization: i.variantName || undefined
        })),
        specialInstructions: ticket.specialNotes || ticket.dietaryAlerts || undefined
      });
      setToastMessage(`🖨️ Kitchen ticket for Table #${ticket.tableNumber} sent to printer!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert('Could not trigger thermal KOT print');
    }
  };

  // Live Out of Stock item availability toggle
  const handleToggleItemAvailability = async (itemId: string, currentAvailable: boolean) => {
    if (!restaurant?.id) return;
    try {
      const nextStatus = !currentAvailable;
      const res = await api.toggleMenuItem86(itemId, nextStatus, restaurant.id);
      if (res.success) {
        setMenuItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, isAvailable: nextStatus } : i))
        );
        setToastMessage(nextStatus ? 'Dish marked In Stock' : 'Dish marked Out of Stock');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err: any) {
      alert('Failed to update dish availability');
    }
  };

  // Live Today's Special toggle
  const handleToggleTodaySpecial = async (itemId: string, currentSpecial?: boolean) => {
    if (!restaurant?.id) return;
    try {
      const nextStatus = !currentSpecial;
      const res = await api.toggleItemBestseller(itemId, nextStatus);
      if (res.success) {
        setMenuItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, isBestseller: nextStatus } : i))
        );
        setToastMessage(nextStatus ? '⭐ Dish marked as Today\'s Special!' : 'Dish removed from Today\'s Special');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err: any) {
      alert('Failed to update Today\'s Special');
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Filtered & Sorted Tickets
  const filteredTickets = useMemo(() => {
    const now = Date.now();
    let list = [...tickets];

    if (viewMode === 'ACTIVE') {
      // Exclude expired PLACED orders from active display
      list = list.filter((t) => {
        if (['REJECTED', 'CANCELLED', 'SERVED', 'COMPLETED'].includes(t.status)) return false;
        if (t.status === 'PLACED') {
          const deadline = (t as any).acceptanceDeadline
            ? new Date((t as any).acceptanceDeadline).getTime()
            : new Date(t.createdAt).getTime() + 90 * 1000;
          if (now >= deadline) return false;
        }
        return true;
      });
    } else {
      // In ALL & HISTORY mode: filter by date
      if (dateFilter === 'TODAY') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        list = list.filter((t) => new Date(t.createdAt).getTime() >= startOfToday.getTime());
      } else if (dateFilter === 'YESTERDAY') {
        const startOfYesterday = new Date();
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        startOfYesterday.setHours(0, 0, 0, 0);
        const endOfYesterday = new Date(startOfYesterday);
        endOfYesterday.setHours(23, 59, 59, 999);
        list = list.filter((t) => {
          const tTime = new Date(t.createdAt).getTime();
          return tTime >= startOfYesterday.getTime() && tTime <= endOfYesterday.getTime();
        });
      }
    }

    // Sub-status filter
    if (subStatusFilter !== 'ALL') {
      if (subStatusFilter === 'PLACED') {
        list = list.filter((t) => t.status === 'PLACED');
      } else if (subStatusFilter === 'PREPARING') {
        list = list.filter((t) => ['ACCEPTED', 'CONFIRMED', 'PREPARING', 'RE_FIRE'].includes(t.status));
      } else if (subStatusFilter === 'READY') {
        list = list.filter((t) => t.status === 'READY');
      } else if (subStatusFilter === 'ON_HOLD') {
        list = list.filter((t) => t.status === 'ON_HOLD' || t.isHeld);
      } else if (subStatusFilter === 'SERVED') {
        list = list.filter((t) => t.status === 'SERVED');
      } else if (subStatusFilter === 'REJECTED') {
        list = list.filter((t) => t.status === 'REJECTED' || t.status === 'CANCELLED');
      }
    }

    // Sort
    if (sortBy === 'FIFO') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'NEWEST') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'SLA_RISK') {
      const riskWeight = (s: string) => (s === 'SLA_BREACHED' ? 4 : s === 'DELAYED' ? 3 : s === 'AT_RISK' ? 2 : 1);
      list.sort((a, b) => riskWeight(b.slaStatus) - riskWeight(a.slaStatus));
    } else if (sortBy === 'TABLE') {
      list.sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }));
    }

    return list;
  }, [tickets, subStatusFilter, sortBy, viewMode, dateFilter]);

  // Counts
  const placedCount = tickets.filter((t) => {
    if (t.status !== 'PLACED') return false;
    const deadline = (t as any).acceptanceDeadline
      ? new Date((t as any).acceptanceDeadline).getTime()
      : new Date(t.createdAt).getTime() + 90 * 1000;
    return Date.now() < deadline;
  }).length;
  const cookingCount = tickets.filter((t) => ['ACCEPTED', 'CONFIRMED', 'PREPARING', 'RE_FIRE'].includes(t.status)).length;
  const readyCount = tickets.filter((t) => t.status === 'READY').length;
  const heldCount = tickets.filter((t) => t.status === 'ON_HOLD' || t.isHeld).length;
  const servedCount = tickets.filter((t) => t.status === 'SERVED').length;
  const rejectedCount = tickets.filter((t) => t.status === 'REJECTED' || t.status === 'CANCELLED').length;
  const activeCount = placedCount + cookingCount + readyCount + heldCount;

  // Out of Stock & Today's Special Computations
  const outOfStockItems = useMemo(() => menuItems.filter((i) => !i.isAvailable), [menuItems]);
  const todaySpecialItems = useMemo(() => menuItems.filter((i) => i.isBestseller), [menuItems]);

  const filteredModalItems = useMemo(() => {
    let list = [...menuItems];
    if (menuModalSearch.trim()) {
      const q = menuModalSearch.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q)));
    }
    if (menuModalTab === 'OUT_OF_STOCK') {
      list.sort((a, b) => (a.isAvailable === b.isAvailable ? 0 : a.isAvailable ? 1 : -1));
    } else {
      list.sort((a, b) => (Boolean(a.isBestseller) === Boolean(b.isBestseller) ? 0 : a.isBestseller ? -1 : 1));
    }
    return list;
  }, [menuItems, menuModalTab, menuModalSearch]);

  return (
    <div className={`space-y-3.5 max-w-full mx-auto pb-12 ${isFullscreen ? 'p-4 bg-[#0A0D12] min-h-screen' : ''}`}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-between animate-in slide-in-from-top-2 border border-orange-400/40">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & PRIMARY TABS (ACTIVE vs ALL / HISTORY)                    */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-2xl shadow-sm dark:shadow-xl space-y-3">
        {/* Row 1: Primary View Switcher (Active vs All) + Quick Tools */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Active vs All Tabs Segmented Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setViewMode('ACTIVE');
                setSubStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center space-x-2 ${
                viewMode === 'ACTIVE'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>ACTIVE ORDERS</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${viewMode === 'ACTIVE' ? 'bg-black/30 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'}`}>
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => {
                setViewMode('ALL');
                setSubStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center space-x-2 ${
                viewMode === 'ALL'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>ALL & HISTORY</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${viewMode === 'ALL' ? 'bg-black/30 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'}`}>
                {tickets.length}
              </span>
            </button>
          </div>

          {/* Date Filter Pills (When in ALL & HISTORY mode) */}
          {viewMode === 'ALL' && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-1 shadow-inner animate-in fade-in">
              {(['TODAY', 'YESTERDAY', 'ALL'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setDateFilter(period)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateFilter === period
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {period === 'TODAY' ? 'Today' : period === 'YESTERDAY' ? 'Yesterday' : 'All Dates'}
                </button>
              ))}
            </div>
          )}

          {/* Essential Quick Utilities */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative w-40 sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Table / Order #..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
            >
              <option value="FIFO">Oldest (FIFO)</option>
              <option value="NEWEST">Newest</option>
              <option value="SLA_RISK">Urgency (Cooking Time)</option>
              <option value="TABLE">Table #</option>
            </select>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isAudioEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-700'
              }`}
              title={isAudioEnabled ? 'Sound alerts ON' : 'Sound alerts MUTED'}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Out of Stock Items Button */}
            <button
              onClick={() => {
                setMenuModalTab('OUT_OF_STOCK');
                setMenuModalSearch('');
                setIsMenuControlsModalOpen(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                outOfStockItems.length > 0
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 dark:text-rose-300 border-rose-500/40'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
              title="View & manage Out of Stock items"
            >
              <AlertOctagon className={`w-3.5 h-3.5 ${outOfStockItems.length > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'}`} />
              <span>Out of Stock</span>
              {outOfStockItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white shadow">
                  {outOfStockItems.length}
                </span>
              )}
            </button>

            {/* Today's Special Button */}
            <button
              onClick={() => {
                setMenuModalTab('TODAYS_SPECIAL');
                setMenuModalSearch('');
                setIsMenuControlsModalOpen(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                todaySpecialItems.length > 0
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border-amber-500/40'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
              title="View & manage Today's Special items"
            >
              <Sparkles className={`w-3.5 h-3.5 ${todaySpecialItems.length > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'}`} />
              <span>Today's Special</span>
              {todaySpecialItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow font-extrabold">
                  {todaySpecialItems.length}
                </span>
              )}
            </button>

            {/* Density Toggle */}
            <button
              onClick={() => setDensityMode(densityMode === 'COMPACT' ? 'COMFORTABLE' : 'COMPACT')}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer text-xs font-bold"
              title={densityMode === 'COMPACT' ? 'Switch to Comfortable View' : 'Switch to Compact View'}
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchKdsData}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              title="Refresh KDS"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Row 2: Sub-filters & Station Pills */}
        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex-wrap">
          {/* Sub-status filter pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {viewMode === 'ACTIVE' ? (
              <>
                <button
                  onClick={() => setSubStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    subStatusFilter === 'ALL'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow'
                      : 'bg-slate-100 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800'
                  }`}
                >
                  All Active ({activeCount})
                </button>
                <button
                  onClick={() => setSubStatusFilter('PLACED')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    subStatusFilter === 'PLACED'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'bg-slate-100 dark:bg-slate-900/70 text-amber-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800'
                  }`}
                >
                  New Placed ({placedCount})
                </button>
                <button
                  onClick={() => setSubStatusFilter('PREPARING')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    subStatusFilter === 'PREPARING'
                      ? 'bg-blue-500 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-900/70 text-blue-600 dark:text-blue-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800'
                  }`}
                >
                  Cooking ({cookingCount})
                </button>
                <button
                  onClick={() => setSubStatusFilter('READY')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    subStatusFilter === 'READY'
                      ? 'bg-emerald-500 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-900/70 text-emerald-600 dark:text-emerald-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800'
                  }`}
                >
                  Ready ({readyCount})
                </button>
                {heldCount > 0 && (
                  <button
                    onClick={() => setSubStatusFilter('ON_HOLD')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      subStatusFilter === 'ON_HOLD'
                        ? 'bg-slate-700 text-white shadow'
                        : 'bg-slate-100 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    On Hold ({heldCount})
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setSubStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    subStatusFilter === 'ALL'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow'
                      : 'bg-slate-100 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800'
                  }`}
                >
                  All ({tickets.length})
                </button>
                <button
                  onClick={() => setSubStatusFilter('SERVED')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    subStatusFilter === 'SERVED'
                      ? 'bg-emerald-500 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-900/70 text-emerald-600 dark:text-emerald-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800'
                  }`}
                >
                  Served ({servedCount})
                </button>
                <button
                  onClick={() => setSubStatusFilter('REJECTED')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    subStatusFilter === 'REJECTED'
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-900/70 text-rose-600 dark:text-rose-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800'
                  }`}
                >
                  Rejected / Cancelled ({rejectedCount})
                </button>
              </>
            )}
          </div>

          {/* Station Selector Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedStation('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                selectedStation === 'ALL'
                  ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 font-extrabold'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>All Stations</span>
            </button>

            {stations.map((st) => (
              <button
                key={st.code}
                onClick={() => setSelectedStation(st.code)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                  selectedStation === st.code
                    ? 'bg-orange-500 text-white font-extrabold shadow'
                    : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800'
                }`}
              >
                {st.code === 'TANDOOR' ? (
                  <Flame className="w-3 h-3 text-orange-500 dark:text-orange-400" />
                ) : st.code === 'BEVERAGE' ? (
                  <Coffee className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                ) : st.code === 'DESSERT' ? (
                  <IceCream className="w-3 h-3 text-pink-500 dark:text-pink-400" />
                ) : (
                  <Utensils className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                )}
                <span>{st.name}</span>
                {st.activeTicketsCount > 0 && (
                  <span className="px-1 py-0.2 rounded text-[9px] font-black bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {st.activeTicketsCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPACT & CLEAN KDS TICKETS GRID                                      */}
      {/* ========================================================================= */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-12 text-center space-y-3 shadow-sm dark:shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-slate-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {viewMode === 'ACTIVE' ? 'Kitchen Queue Clear! All Active Orders Completed' : 'No Orders Found in This View'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            {viewMode === 'ACTIVE'
              ? 'New customer orders placed from tables or QR code will appear here instantly in real time.'
              : 'Try selecting a different filter or search term to review historical tickets.'}
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-3.5 ${
            densityMode === 'COMPACT'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {filteredTickets.map((ticket) => {
            const isPlaced = ticket.status === 'PLACED';
            const isPreparing = ticket.status === 'PREPARING' || ticket.status === 'ACCEPTED' || ticket.status === 'CONFIRMED';
            const isReady = ticket.status === 'READY';
            const isHeld = ticket.isHeld || ticket.status === 'ON_HOLD';
            const isRefire = ticket.priority === 'RE_FIRE' || ticket.status === 'RE_FIRE';
            const isServed = ticket.status === 'SERVED';
            const isRejected = ticket.status === 'REJECTED' || ticket.status === 'CANCELLED';

            // High contrast border styling per status
            const borderClass = isPlaced
              ? 'border-amber-500/80 bg-amber-500/[0.03] shadow-md shadow-amber-500/10'
              : isRefire
              ? 'border-rose-500 bg-rose-500/[0.04] shadow-md'
              : isHeld
              ? 'border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-900/40'
              : isReady
              ? 'border-emerald-500/80 bg-emerald-500/[0.03] shadow-md shadow-emerald-500/10'
              : isServed
              ? 'border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 opacity-90'
              : isRejected
              ? 'border-rose-300 dark:border-rose-700/50 bg-rose-50/40 dark:bg-rose-950/20 opacity-80'
              : ticket.slaStatus === 'SLA_BREACHED'
              ? 'border-rose-500 bg-rose-500/[0.04]'
              : ticket.slaStatus === 'DELAYED'
              ? 'border-orange-500 bg-orange-500/[0.02]'
              : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600';

            return (
              <div
                key={ticket.id}
                className={`bg-white dark:bg-[#1E293B] rounded-2xl border ${borderClass} transition flex flex-col justify-between overflow-hidden shadow-sm dark:shadow-xl`}
              >
                {/* A. TICKET HEADER: Table #, Order #, Status & Timer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-orange-500 text-white font-black text-xs shadow">
                        T-{ticket.tableNumber}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">#{ticket.orderNumber}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {isRefire && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40">
                          RE-FIRE
                        </span>
                      )}
                      {ticket.priority === 'VIP' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40">
                          VIP
                        </span>
                      )}
                      {ticket.priority === 'RUSH' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                          RUSH
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isPlaced
                            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 animate-pulse'
                            : isReady
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                            : isHeld
                            ? 'bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/40'
                            : isServed
                            ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40'
                            : isRejected
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40'
                            : 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40'
                        }`}
                      >
                        {ticket.status === 'PLACED' ? 'NEW ORDER' : ticket.status}
                      </span>
                    </div>
                  </div>

                  {/* Timer Strip */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    {isPlaced ? (
                      <OrderCountdownBadge
                        createdAt={ticket.createdAt}
                        acceptanceDeadline={ticket.acceptanceDeadline}
                      />
                    ) : (
                      <div className="flex items-center space-x-1 font-semibold">
                        <Clock className="w-3 h-3 text-orange-500 dark:text-orange-400" />
                        <span>{ticket.elapsedMinutes}m elapsed</span>
                        <span className="text-slate-400 dark:text-slate-500">/ ETA {ticket.dynamicEtaMinutes}m</span>
                      </div>
                    )}

                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                        ticket.slaStatus === 'SLA_BREACHED'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40'
                          : ticket.slaStatus === 'DELAYED'
                          ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {ticket.slaStatus === 'SLA_BREACHED'
                        ? 'SERVICE DELAY'
                        : ticket.slaStatus === 'DELAYED'
                        ? 'RUNNING LATE'
                        : ticket.slaStatus === 'AT_RISK'
                        ? 'EXPEDITE'
                        : 'ON TIME'}
                    </span>
                  </div>
                </div>

                {/* B. DIETARY ALERTS / SPECIAL NOTES */}
                {ticket.dietaryAlerts && (
                  <div className="p-2 bg-rose-50 dark:bg-rose-500/15 border-b border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center space-x-1.5 text-xs font-black">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span className="uppercase text-[11px] tracking-wide">ALERT: {ticket.dietaryAlerts}</span>
                  </div>
                )}

                {ticket.specialNotes && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px]">Note: {ticket.specialNotes}</span>
                  </div>
                )}

                {/* C. ITEMS CHECKLIST */}
                <div className="p-3 space-y-2 flex-1">
                  <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                    {ticket.items.map((item) => {
                      const isItemReady = item.status === 'READY' || item.status === 'SERVED';
                      const isItemAccepted = itemDecisions[ticket.id]?.[item.id] !== false;

                      return (
                        <div
                          key={item.id}
                          className={`pt-1.5 flex items-start justify-between gap-2 select-none rounded-lg p-1.5 transition ${
                            isPlaced
                              ? isItemAccepted
                                ? 'bg-emerald-500/5 border border-emerald-500/20'
                                : 'bg-rose-500/10 border border-rose-500/30 opacity-70'
                              : isItemReady
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div
                            onClick={() => !isPlaced && !isServed && !isRejected && handleToggleItemStatus(item.id, item.status)}
                            className={`flex items-start space-x-2 flex-1 ${!isPlaced && !isServed && !isRejected ? 'cursor-pointer' : ''}`}
                          >
                            {!isPlaced && !isServed && !isRejected && (
                              <div className="mt-0.5">
                                {isItemReady ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                )}
                              </div>
                            )}

                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="text-xs font-bold flex items-center space-x-1.5 flex-wrap">
                                <span className="font-black text-orange-500 dark:text-orange-400">{item.quantity}x</span>
                                <span className={isItemReady || (isPlaced && !isItemAccepted) ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}>
                                  {item.name}
                                </span>
                                {item.variantName && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                    ({item.variantName})
                                  </span>
                                )}
                                {isPlaced && !isItemAccepted && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                                    OUT OF STOCK
                                  </span>
                                )}
                              </div>

                              {item.kitchenNotes && (
                                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                                  ★ {item.kitchenNotes}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Placed: Tick / Cross controls */}
                          {isPlaced ? (
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSetItemDecision(ticket.id, item.id, true)}
                                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center cursor-pointer ${
                                  isItemAccepted
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300'
                                }`}
                                title="Accept item"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetItemDecision(ticket.id, item.id, false)}
                                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center cursor-pointer ${
                                  !isItemAccepted
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300'
                                }`}
                                title="Mark item Out of Stock"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider shrink-0 border border-slate-200 dark:border-slate-700">
                              {item.stationCode}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Readiness Progress Bar (for Active Orders) */}
                  {!isPlaced && !isServed && !isRejected && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-slate-500 dark:text-slate-400">Readiness:</span>
                        <span className="font-bold text-orange-500 dark:text-orange-400">
                          {ticket.readyItemsCount} / {ticket.totalItemsCount} Ready
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{
                            width: `${(ticket.readyItemsCount / Math.max(1, ticket.totalItemsCount)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* D. ACTION BAR */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-700/80 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {isPlaced ? (
                      (() => {
                        const deadline = (ticket as any).acceptanceDeadline
                          ? new Date((ticket as any).acceptanceDeadline).getTime()
                          : new Date(ticket.createdAt).getTime() + 90 * 1000;
                        const isExpired = Date.now() >= deadline;

                        if (isExpired) {
                          return (
                            <div className="flex-1 py-2 px-3 rounded-xl bg-rose-50 dark:bg-slate-800/80 border border-rose-200 dark:border-slate-700/80 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                              <span>Acceptance Expired (Cannot Accept)</span>
                            </div>
                          );
                        }

                        const orderDecisions = itemDecisions[ticket.id] || {};
                        const acceptedCount = ticket.items.filter((i) => orderDecisions[i.id] !== false).length;
                        const rejectedCount = ticket.items.length - acceptedCount;

                        return (
                          <>
                            <button
                              onClick={() => handleAcceptOrderWithDecisions(ticket)}
                              disabled={acceptedCount === 0}
                              className={`flex-1 font-bold py-2 px-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer ${
                                acceptedCount === 0
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                  : rejectedCount > 0
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>
                                {rejectedCount > 0
                                  ? `Accept ${acceptedCount} & Mark ${rejectedCount} Out of Stock`
                                  : `Accept Entire Order (${ticket.items.length})`}
                              </span>
                            </button>

                            <button
                              onClick={() => setRejectModalOrder(ticket)}
                              className="px-2.5 py-2 bg-rose-500/15 hover:bg-rose-500 text-rose-600 dark:text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/30 flex items-center gap-1 cursor-pointer"
                              title="Reject Entire Order"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        );
                      })()
                    ) : isHeld ? (
                      <button
                        onClick={() => handleResumeOrder(ticket.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume Cooking</span>
                      </button>
                    ) : isReady ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        {!ticket.waiterNotifiedAt ? (
                          <button
                            onClick={() => handleNotifyWaiter(ticket.id)}
                            className="flex-1 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold py-1.5 px-2.5 rounded-xl text-xs transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Bell className="w-3 h-3" />
                            <span>Notify Waiter</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleNotifyWaiter(ticket.id)}
                            className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 font-bold py-1.5 px-2.5 rounded-xl text-xs transition-all border border-amber-500/30 flex items-center justify-center gap-1 cursor-pointer"
                            title="Re-notify waiter"
                          >
                            <Check className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                            <span>Notified</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleMarkServed(ticket.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-1.5 px-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Mark Served</span>
                        </button>
                      </div>
                    ) : isServed ? (
                      <div className="flex items-center justify-between w-full text-xs text-slate-500 dark:text-slate-400">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Served
                        </span>
                        <button
                          onClick={() => handlePrintOrderKotSlip(ticket)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-orange-500 dark:text-orange-400" /> Reprint KOT
                        </button>
                      </div>
                    ) : isRejected ? (
                      <div className="flex flex-col gap-1 w-full text-xs">
                        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold">
                          <span className="flex items-center gap-1">
                            <X className="w-3.5 h-3.5 shrink-0" />
                            {ticket.rejectionReasonCode === 'ACCEPTANCE_TIMEOUT'
                              ? 'Auto-Rejected (90s Timeout)'
                              : `Rejected (${ticket.rejectionReasonCode || 'STAFF'})`}
                          </span>
                          {ticket.rejectedBy && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                              by {ticket.rejectedBy}
                            </span>
                          )}
                        </div>
                        {ticket.rejectionReason && (
                          <p className="text-[11px] text-rose-900 dark:text-slate-300 italic bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-500/20">
                            "{ticket.rejectionReason}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-1">
                        <button
                          onClick={() => handleExpoPass(ticket.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Ready</span>
                        </button>

                        <button
                          onClick={() => handleUndoAcceptance(ticket)}
                          className="px-2 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                          title="Mistake? Revert Order back to Placed state"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Revert</span>
                        </button>

                        <button
                          onClick={() => setHoldModalOrder(ticket)}
                          className="px-2 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                          title="Hold Order"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Secondary Line: Print KOT, Re-Fire for Active Orders */}
                  {!isPlaced && !isServed && !isRejected && (
                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                      <button
                        onClick={() => handlePrintOrderKotSlip(ticket)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all border border-slate-300 dark:border-slate-700/60 flex items-center gap-1 font-semibold cursor-pointer"
                        title="Print KOT Slip"
                      >
                        <Printer className="w-3 h-3 text-orange-500 dark:text-orange-400" />
                        <span>Print KOT</span>
                      </button>

                      <button
                        onClick={() => {
                          setRefireModalOrder(ticket);
                          setRefireSelectedItems(ticket.items.map((i) => i.id));
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-500/20 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all border border-slate-300 dark:border-slate-700/60 flex items-center gap-1 font-semibold cursor-pointer"
                        title="Re-Fire Dish"
                      >
                        <RotateCcw className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                        <span>Re-Fire</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REJECT ORDER MODAL                                                    */}
      {/* ========================================================================= */}
      <OrderRejectionModal
        isOpen={Boolean(rejectModalOrder)}
        orderNumber={rejectModalOrder?.orderNumber || ''}
        tableNumber={String(rejectModalOrder?.tableNumber || '')}
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectModalOrder(null)}
      />

      {/* ========================================================================= */}
      {/* 4. HOLD ORDER MODAL                                                      */}
      {/* ========================================================================= */}
      {holdModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold">
                <Pause className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Hold Order #{holdModalOrder.orderNumber}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pauses timer on kitchen display</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Reason for Hold
              </label>
              <input
                type="text"
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="e.g. Waiting for guest arrival, Course pacing"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setHoldModalOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHold}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Put on Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. RE-FIRE TICKET MODAL                                                   */}
      {/* ========================================================================= */}
      {refireModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Generate Re-Fire KOT Ticket</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Order #{refireModalOrder.orderNumber} (Table #{refireModalOrder.tableNumber})</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Items to Re-Fire
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                {refireModalOrder.items.map((i) => (
                  <label key={i.id} className="flex items-center space-x-2 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={refireSelectedItems.includes(i.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRefireSelectedItems([...refireSelectedItems, i.id]);
                        } else {
                          setRefireSelectedItems(refireSelectedItems.filter((id) => id !== i.id));
                        }
                      }}
                      className="rounded border-slate-300 dark:border-slate-700 text-rose-500 focus:ring-0"
                    />
                    <span>
                      {i.quantity}x {i.name} ({i.stationCode})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Re-Fire Reason
              </label>
              <input
                type="text"
                value={refireReason}
                onChange={(e) => setRefireReason(e.target.value)}
                placeholder="e.g. Dish arrived cold, Wrong spice level"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRefireModalOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefire}
                disabled={!refireReason.trim() || refireSelectedItems.length === 0}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition disabled:opacity-50"
              >
                Fire Priority Re-Fire KOT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. THERMAL KOT SLIP MODAL                                                */}
      {/* ========================================================================= */}
      {kotSlipData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-orange-500/20 text-orange-500 dark:text-orange-400 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Kitchen Order Ticket (KOT)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Thermal Print Slip</p>
                </div>
              </div>
              <button onClick={() => setKotSlipData(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl font-mono text-xs text-emerald-400 whitespace-pre-wrap overflow-y-auto border border-slate-800 shadow-inner flex-1 leading-relaxed">
              {kotSlipData.thermalSlip}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setKotSlipData(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all border border-slate-200 dark:border-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (printWin) {
                    printWin.document.write(`<pre style="font-family:monospace;font-size:12px;padding:20px;">${kotSlipData.thermalSlip}</pre>`);
                    printWin.document.close();
                    printWin.focus();
                    printWin.print();
                    printWin.close();
                  }
                }}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print KOT Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. KITCHEN MENU CONTROLS MODAL (OUT OF STOCK & TODAY'S SPECIAL)            */}
      {/* ========================================================================= */}
      {isMenuControlsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl p-5 shadow-2xl space-y-3.5 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl ${menuModalTab === 'OUT_OF_STOCK' ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400' : 'bg-amber-500/20 text-amber-500 dark:text-amber-400'}`}>
                  {menuModalTab === 'OUT_OF_STOCK' ? <AlertOctagon className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {menuModalTab === 'OUT_OF_STOCK' ? 'Live Out of Stock Management' : 'Today\'s Special Recommendations'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {menuModalTab === 'OUT_OF_STOCK'
                      ? 'Dishes marked as Out of Stock are immediately blocked from customer QR ordering & POS'
                      : 'Highlighted at the top of the customer digital menu and recommended by stewards'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuControlsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Tab Pills */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuModalTab('OUT_OF_STOCK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    menuModalTab === 'OUT_OF_STOCK'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Out of Stock</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${menuModalTab === 'OUT_OF_STOCK' ? 'bg-black/30 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'}`}>
                    {outOfStockItems.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMenuModalTab('TODAYS_SPECIAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    menuModalTab === 'TODAYS_SPECIAL'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Today's Special</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${menuModalTab === 'TODAYS_SPECIAL' ? 'bg-black/30 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'}`}>
                    {todaySpecialItems.length}
                  </span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={menuModalSearch}
                  onChange={(e) => setMenuModalSearch(e.target.value)}
                  placeholder={menuModalTab === 'OUT_OF_STOCK' ? 'Search dish to toggle stock...' : 'Search dish to set special...'}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[240px]">
              {filteredModalItems.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">No matching food items found</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Try checking your spelling or clear the search query.
                  </p>
                </div>
              ) : (
                filteredModalItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition flex items-center justify-between ${
                      menuModalTab === 'OUT_OF_STOCK'
                        ? !item.isAvailable
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
                        : item.isBestseller
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2 flex-wrap gap-y-1">
                        <span>{item.name}</span>
                        {menuModalTab === 'OUT_OF_STOCK' ? (
                          !item.isAvailable ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                              OUT OF STOCK
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                              IN STOCK
                            </span>
                          )
                        ) : (
                          item.isBestseller && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> TODAY'S SPECIAL
                            </span>
                          )
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        ₹{item.price} • Prep: ~{item.preparationTime}m
                      </div>
                    </div>

                    {menuModalTab === 'OUT_OF_STOCK' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleItemAvailability(item.id, item.isAvailable)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shadow ${
                          item.isAvailable
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-rose-600 hover:text-white hover:border-rose-600'
                            : 'bg-rose-600 text-white shadow-rose-600/30 hover:bg-emerald-600'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5" />
                            <span>Out of Stock</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleTodaySpecial(item.id, item.isBestseller)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shadow ${
                          item.isBestseller
                            ? 'bg-amber-500 text-slate-950 font-black shadow-amber-500/30 hover:bg-amber-400'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{item.isBestseller ? "Today's Special ✓" : "Set as Special"}</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span>
                {menuModalTab === 'OUT_OF_STOCK'
                  ? `${outOfStockItems.length} dishes currently Out of Stock`
                  : `${todaySpecialItems.length} dishes marked as Today's Special`}
              </span>
              <button
                type="button"
                onClick={() => setIsMenuControlsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
