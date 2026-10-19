import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShiftOverview, Order, ServiceCall, TableItem, MenuCategory, WaiterPickupAlert, TableAllocationSurveillanceItem } from '../types';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { formatRole } from '../utils/roleFormatter';
import {
  TrendingUp,
  ChefHat,
  BellRing,
  Grid,
  Clock,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  Receipt,
  Utensils,
  Users,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  QrCode,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  CalendarDays,
  Search,
  X,
  ClipboardList,
  Filter,
  Check,
  Layers,
  Printer,
  Copy,
  CreditCard,
  PhoneCall,
  Settings,
  Save,
  Edit3,
  ArrowLeft,
  Volume2,
  VolumeX,
  Shield,
  UserCheck,
  Timer,
  AlertOctagon,
  Sparkles,
  UserPlus
} from 'lucide-react';

interface DashboardProps {
  overview: ShiftOverview | null;
  orders: Order[];
  serviceCalls: ServiceCall[];
  tables?: TableItem[];
  categories?: MenuCategory[];
  onToggleTableOccupancy?: (table: TableItem) => void;
  onRefreshTables?: () => void;
  onOrderCreated?: () => void;
  onNavigateTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  overview,
  orders,
  serviceCalls,
  tables = [],
  categories = [],
  onToggleTableOccupancy,
  onRefreshTables,
  onOrderCreated,
  onNavigateTab
}) => {
  const { user, restaurant, assignedRoles, hasPermission } = useAuth();
  const primaryRole = assignedRoles[0] || 'STAFF';
  const isOwnerOrGM = assignedRoles.includes('RESTAURANT_OWNER') || assignedRoles.includes('GENERAL_MANAGER') || assignedRoles.includes('DINEDECK_SUPER_ADMIN');

  // Targeted Kitchen Food-Ready Pickup Alert (Waiter Buzzer)
  const [activePickupAlerts, setActivePickupAlerts] = useState<WaiterPickupAlert[]>([]);
  const [isAudioBuzzerActive, setIsAudioBuzzerActive] = useState<boolean>(true);
  const [servingActionLoading, setServingActionLoading] = useState<string | null>(null);

  // Play Audible Buzzer Alert Tone
  const playBuzzerSound = () => {
    if (!isAudioBuzzerActive) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  // Real-time WebSocket Listeners for Table Allocation & Food-Ready Buzzer Alerts
  useEffect(() => {
    const unsub = wsService.onMessage((msg) => {
      if (msg.eventType === 'WAITER_PICKUP_ALERT' || msg.eventType === 'KDS_WAITER_NOTIFIED') {
        const payload = msg.payload || msg.data;
        if (payload) {
          setActivePickupAlerts((prev) => {
            if (prev.some((p) => p.orderId === payload.orderId)) return prev;
            return [{
              orderId: payload.orderId,
              orderNumber: payload.orderNumber,
              tableNumber: payload.tableNumber,
              waiterId: payload.waiterId,
              waiterName: payload.waiterName,
              itemsReady: payload.itemsReady || [],
              stationName: payload.stationName || 'Kitchen Pass',
              notifiedAt: payload.notifiedAt || new Date().toISOString()
            }, ...prev];
          });
          playBuzzerSound();
          if (onRefreshTables) onRefreshTables();
        }
      } else if (msg.eventType === 'KDS_ORDER_SERVED' || msg.eventType === 'KDS_SERVED') {
        const payload = msg.payload || msg.data;
        if (payload?.orderId) {
          setActivePickupAlerts((prev) => prev.filter((p) => p.orderId !== payload.orderId));
          if (onRefreshTables) onRefreshTables();
        }
      } else if (msg.eventType === 'TABLE_WAITER_ASSIGNED') {
        if (onRefreshTables) onRefreshTables();
      }
    });

    return () => {
      unsub();
    };
  }, [restaurant?.id, isAudioBuzzerActive]);

  // Mark Order Served Handler from Buzzer Alert
  const handleMarkAlertServed = async (orderId: string) => {
    setServingActionLoading(orderId);
    try {
      const res = await api.markOrderServed(orderId, restaurant?.id);
      if (res.success) {
        setActivePickupAlerts((prev) => prev.filter((p) => p.orderId !== orderId));
        if (onRefreshTables) onRefreshTables();
      }
    } catch (err) {
      console.error('Failed to mark served:', err);
    } finally {
      setServingActionLoading(null);
    }
  };

  // Floor Selection Dropdown
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [tableFilter, setTableFilter] = useState<'ALL' | 'OCCUPIED' | 'VACANT'>('ALL');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Selected Table for Table Modal
  const [selectedTableDetails, setSelectedTableDetails] = useState<TableItem | null>(null);

  // Table Modal Inline Server Reassignment State
  const [isEditingWaiter, setIsEditingWaiter] = useState<boolean>(false);
  const [selectedTableWaiterId, setSelectedTableWaiterId] = useState<string>('usr-waiter-1');
  const [isSavingWaiter, setIsSavingWaiter] = useState<boolean>(false);
  const [waiterChangeSuccess, setWaiterChangeSuccess] = useState<string | null>(null);

  // Save/Reassign Waiter directly inside Table Modal
  const handleSaveTableWaiterInModal = async () => {
    if (!selectedTableDetails) return;
    setIsSavingWaiter(true);
    const waiterMap: Record<string, { name: string; role: string }> = {
      'usr-waiter-1': { name: 'Ramesh Kumar', role: 'Floor Captain' },
      'usr-waiter-2': { name: 'Suresh Raina', role: 'Senior Server' },
      'usr-waiter-3': { name: 'Pooja Sharma', role: 'Steward / Host' },
      'usr-waiter-4': { name: 'Amit Patel', role: 'Floor Captain' }
    };
    const chosen = waiterMap[selectedTableWaiterId] || waiterMap['usr-waiter-1'];
    try {
      const res = await api.assignTableWaiter(selectedTableDetails.id, {
        waiterId: selectedTableWaiterId,
        waiterName: chosen.name,
        waiterRole: chosen.role,
        restaurantId: restaurant?.id
      });
      if (res.success) {
        setSelectedTableDetails({
          ...selectedTableDetails,
          assignedServer: {
            id: selectedTableWaiterId,
            name: chosen.name,
            role: chosen.role,
            assignedAt: new Date().toISOString()
          }
        });
        setWaiterChangeSuccess(`Assigned to ${chosen.name} (${chosen.role})`);
        setTimeout(() => setWaiterChangeSuccess(null), 3000);
        setIsEditingWaiter(false);
        if (onRefreshTables) onRefreshTables();
      }
    } catch (err) {
      console.error('Failed to reassign waiter:', err);
    } finally {
      setIsSavingWaiter(false);
    }
  };

  // Table Configuration Edit Drawer / Modal State
  const [isEditingTable, setIsEditingTable] = useState<boolean>(false);
  const [editFloor, setEditFloor] = useState<string>('Ground Floor (Main Hall)');
  const [editCapacity, setEditCapacity] = useState<number>(4);
  const [isSavingTable, setIsSavingTable] = useState<boolean>(false);
  const [tableConfigSuccess, setTableConfigSuccess] = useState<string | null>(null);

  // POS Order Modal State
  const [showPosModal, setShowPosModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dietFilter, setDietFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [posTableNumber, setPosTableNumber] = useState<string>('1');
  const [customerName, setCustomerName] = useState<string>('');
  const [cart, setCart] = useState<{ menuItemId: string; name: string; unitPrice: number; quantity: number; stationCode?: string; isVeg?: boolean }[]>([]);
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posSuccessMsg, setPosSuccessMsg] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Reservations State
  const [showResModal, setShowResModal] = useState(false);
  const [resTab, setResTab] = useState<'UPCOMING' | 'WAITLIST' | 'SEATED'>('UPCOMING');
  const [resGuestName, setResGuestName] = useState('');
  const [resGuestPhone, setResGuestPhone] = useState('');
  const [resPartySize, setResPartySize] = useState('4');
  const [resTime, setResTime] = useState('20:30');
  const [resTable, setResTable] = useState('1');
  const [reservations, setReservations] = useState([
    {
      id: 'res-101',
      guestName: 'Kapil Dev & Family',
      phone: '+91 98112 23344',
      partySize: 4,
      tableNumber: '1',
      time: '20:00 PM',
      status: 'CONFIRMED',
      notes: 'Window booth'
    },
    {
      id: 'res-102',
      guestName: 'Dr. Ananya Roy',
      phone: '+91 98223 34455',
      partySize: 2,
      tableNumber: '4',
      time: '20:30 PM',
      status: 'CONFIRMED',
      notes: 'Anniversary celebration'
    },
    {
      id: 'res-103',
      guestName: 'Vikram Malhotra',
      phone: '+91 98334 45566',
      partySize: 6,
      tableNumber: '9',
      time: '21:00 PM',
      status: 'WAITLIST',
      notes: 'High chair for toddler'
    }
  ]);

  // Service Calls Modal State
  const [showServiceCallsModal, setShowServiceCallsModal] = useState<boolean>(false);
  const [serviceCallSearch, setServiceCallSearch] = useState<string>('');
  const [serviceCallStatusFilter, setServiceCallStatusFilter] = useState<'ALL' | 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED'>('ALL');
  const [localServiceCalls, setLocalServiceCalls] = useState<ServiceCall[]>([]);

  useEffect(() => {
    setLocalServiceCalls(serviceCalls);
  }, [serviceCalls]);

  const handleUpdateServiceCallStatus = async (callId: string, status: 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED') => {
    setLocalServiceCalls((prev) => prev.map((c) => (c.id === callId ? { ...c, status } : c)));
    try {
      await api.updateServiceCall(callId, status);
    } catch (err) {
      console.error('Failed to update service call:', err);
    }
  };

  const pendingCalls = localServiceCalls.filter((c) => (c.status || 'PENDING') === 'PENDING');
  const acknowledgedCalls = localServiceCalls.filter((c) => c.status === 'ACKNOWLEDGED');
  const completedCalls = localServiceCalls.filter((c) => ['COMPLETED', 'RESOLVED'].includes(c.status));

  const filteredLocalServiceCalls = useMemo(() => {
    return localServiceCalls.filter((c) => {
      if (serviceCallSearch.trim()) {
        const q = serviceCallSearch.toLowerCase();
        const matchesTbl = c.tableNumber?.toLowerCase().includes(q);
        const matchesType = (c.type || c.requestType || '').toLowerCase().includes(q);
        const matchesNote = (c.notes || c.customNote || '').toLowerCase().includes(q);
        if (!matchesTbl && !matchesType && !matchesNote) return false;
      }
      if (serviceCallStatusFilter === 'PENDING' && (c.status || 'PENDING') !== 'PENDING') return false;
      if (serviceCallStatusFilter === 'ACKNOWLEDGED' && c.status !== 'ACKNOWLEDGED') return false;
      if (serviceCallStatusFilter === 'COMPLETED' && !['COMPLETED', 'RESOLVED'].includes(c.status)) return false;
      return true;
    });
  }, [localServiceCalls, serviceCallSearch, serviceCallStatusFilter]);

  const activeOrders = orders.filter((o) => ['CONFIRMED', 'PREPARING', 'READY'].includes(o.status));
  const cookingOrders = orders.filter((o) => o.status === 'PREPARING');

  // Helper to extract numeric table number for exact sequential sorting
  const getTableNumericValue = (tableNumber: string): number => {
    if (!tableNumber) return 9999;
    const match = tableNumber.match(/\d+/);
    return match ? parseInt(match[0], 10) : 9999;
  };

  // Helper to ensure clean single-line table labels (e.g. "Table 10" instead of "Table #T10")
  const getFormattedTableTitle = (tableNumber: string) => {
    if (!tableNumber) return 'Table';
    const clean = tableNumber.replace(/^(Table|T)[\s#-]*/i, '').trim();
    return `Table ${clean || tableNumber}`;
  };

  const getTableShortBadge = (tableNumber: string) => {
    if (!tableNumber) return 'T';
    const clean = tableNumber.replace(/^(Table|T)[\s#-]*/i, '').trim();
    return `T${clean || tableNumber}`;
  };

  // Get floor name from table model or fallback based on number
  const getTableFloor = (table: TableItem | string) => {
    if (typeof table === 'object' && table.floor) {
      return table.floor;
    }
    const tableNumber = typeof table === 'string' ? table : table?.tableNumber || '';
    const clean = tableNumber.replace(/^(Table|T)[\s#-]*/i, '').trim();
    const num = parseInt(clean, 10);
    if (isNaN(num)) return 'Ground Floor (Main Hall)';
    if (num <= 6) return 'Ground Floor (Main Hall)';
    if (num <= 10) return 'First Floor (AC Family Hall)';
    if (num <= 13) return 'Rooftop / Terrace Garden';
    return 'Outdoor Courtyard & Patio';
  };

  // Deduplicate and naturally sort tables 1 through 16
  const sortedTables = useMemo(() => {
    const seen = new Set<number>();
    const uniqueList: TableItem[] = [];

    // Sort by numeric value first
    const sorted = [...tables].sort(
      (a, b) => getTableNumericValue(a.tableNumber) - getTableNumericValue(b.tableNumber)
    );

    for (const t of sorted) {
      const num = getTableNumericValue(t.tableNumber);
      if (!seen.has(num)) {
        seen.add(num);
        uniqueList.push(t);
      }
    }

    return uniqueList;
  }, [tables]);

  // Map active reservations to table numbers
  const tableReservationMap = useMemo(() => {
    const map = new Map<string, any>();
    reservations.forEach((r) => {
      if (r.tableNumber && r.status !== 'CANCELLED') {
        map.set(r.tableNumber, r);
      }
    });
    return map;
  }, [reservations]);

  const occupiedAndReservedTablesList = useMemo(
    () => sortedTables.filter((t) => t.isOccupied || tableReservationMap.has(t.tableNumber)),
    [sortedTables, tableReservationMap]
  );
  const vacantTablesList = useMemo(
    () => sortedTables.filter((t) => !t.isOccupied && !tableReservationMap.has(t.tableNumber)),
    [sortedTables, tableReservationMap]
  );

  // Filtered tables based on floor dropdown, occupancy status, and search in proper sequence
  const filteredTables = useMemo(() => {
    return sortedTables.filter((t) => {
      // Floor filter
      if (selectedFloor !== 'ALL') {
        const floor = getTableFloor(t);
        if (floor !== selectedFloor) return false;
      }
      // Occupancy status filter: Occupied includes both diner seated & reserved tables
      if (tableFilter === 'OCCUPIED' && !t.isOccupied && !tableReservationMap.has(t.tableNumber)) return false;
      if (tableFilter === 'VACANT' && (t.isOccupied || tableReservationMap.has(t.tableNumber))) return false;
      // Search
      if (tableSearch.trim() && !t.tableNumber.toLowerCase().includes(tableSearch.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [sortedTables, selectedFloor, tableFilter, tableSearch, tableReservationMap]);

  // Map service requests to table numbers for visual alert badges
  const tableServiceCallMap = useMemo(() => {
    const map = new Map<string, ServiceCall>();
    pendingCalls.forEach((call) => {
      if (call.tableNumber) {
        map.set(call.tableNumber, call);
      }
    });
    return map;
  }, [pendingCalls]);

  // Get active orders and bill amount for a selected table
  const getTableActiveOrders = (tableNumber: string) => {
    return orders.filter(
      (o) => o.tableNumber === tableNumber && ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'].includes(o.status)
    );
  };

  // Flattened all menu items with category context
  const allItems = useMemo(() => {
    return categories.flatMap((cat) =>
      (cat.items || []).map((item) => ({
        ...item,
        categoryName: cat.name
      }))
    );
  }, [categories]);

  // Filtered dishes for POS Modal
  const filteredDishes = useMemo(() => {
    return allItems.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesCategory = item.categoryName?.toLowerCase().includes(q);
        const matchesStation = item.stationCode?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCategory && !matchesStation) {
          return false;
        }
      }

      if (selectedCategory !== 'ALL' && item.categoryName !== selectedCategory) {
        return false;
      }

      if (dietFilter === 'VEG' && !item.isVeg) return false;
      if (dietFilter === 'NON_VEG' && item.isVeg) return false;

      return true;
    });
  }, [allItems, searchQuery, selectedCategory, dietFilter]);

  // POS Order Handlers
  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) => (i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
          stationCode: item.stationCode,
          isVeg: item.isVeg
        }
      ];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as any[]
    );
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Directly dispatch order & print KOT without popups
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !restaurant?.id) return;

    setIsSubmitting(true);
    const notesWithMeta = [
      orderType === 'TAKEAWAY' ? '[TAKEAWAY / PARCEL ORDER]' : null,
      customerName ? `Guest: ${customerName}` : null,
      specialNotes || null
    ]
      .filter(Boolean)
      .join(' • ');

    const res = await api.placeOrder({
      restaurantId: restaurant.id,
      tableNumber: orderType === 'TAKEAWAY' ? 'TAKEOUT' : posTableNumber,
      items: cart,
      specialNotes: notesWithMeta || undefined
    });
    setIsSubmitting(false);

    if (res.success) {
      setPosSuccessMsg('Order Sent to Kitchen & Printed!');
      setCart([]);
      setSpecialNotes('');
      setCustomerName('');
      setShowPosModal(false);
      if (onOrderCreated) onOrderCreated();
      setTimeout(() => setPosSuccessMsg(null), 3000);
    } else {
      alert(res.message || 'Failed to dispatch order');
    }
  };

  const cartItemCounts = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((i) => map.set(i.menuItemId, i.quantity));
    return map;
  }, [cart]);

  // Reservation Handlers
  const handleAddReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setReservations((prev) => [
      ...prev,
      {
        id: `res-${Date.now()}`,
        guestName: resGuestName,
        phone: resGuestPhone,
        partySize: parseInt(resPartySize) || 4,
        tableNumber: resTable,
        time: `${resTime} PM`,
        status: resTab === 'WAITLIST' ? 'WAITLIST' : 'CONFIRMED',
        notes: 'Dine-In Booking'
      }
    ]);
    setShowResModal(false);
    setResGuestName('');
    setResGuestPhone('');
  };

  const handleSeatParty = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'SEATED' } : r))
    );
  };

  const filteredReservations = reservations.filter((r) => {
    if (resTab === 'UPCOMING') return r.status === 'CONFIRMED';
    if (resTab === 'WAITLIST') return r.status === 'WAITLIST';
    if (resTab === 'SEATED') return r.status === 'SEATED';
    return true;
  });

  // Unique Tamper-Proof Cryptographic Table QR Link Generator (Customer App Endpoint)
  const getTableQrUrl = (table: TableItem) => {
    let customerOrigin = 'http://localhost:3000';
    if (typeof window !== 'undefined' && window.location.hostname) {
      const isDev = window.location.port === '5173' || window.location.port === '5174';
      customerOrigin = isDev
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : window.location.origin;
    }
    const secureToken = table.qrCodeToken || `qr_${table.id}`;
    return `${customerOrigin}/?qrToken=${encodeURIComponent(secureToken)}`;
  };

  const copyTableLink = (table: TableItem) => {
    const url = getTableQrUrl(table);
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Save Table Configuration (Floor & Capacity)
  const handleSaveTableConfig = async () => {
    if (!selectedTableDetails) return;
    setIsSavingTable(true);
    try {
      const res = await api.updateTableConfig(selectedTableDetails.id, {
        floor: editFloor,
        capacity: Number(editCapacity)
      });
      if (res.success && res.data) {
        setSelectedTableDetails({
          ...selectedTableDetails,
          floor: editFloor,
          capacity: Number(editCapacity)
        });
        setIsEditingTable(false);
        setTableConfigSuccess('Table configuration updated successfully!');
        if (onRefreshTables) onRefreshTables();
        setTimeout(() => setTableConfigSuccess(null), 3000);
      } else {
        alert(res.message || 'Failed to update table configuration');
      }
    } catch (err: any) {
      alert(err.message || 'Network error updating table');
    } finally {
      setIsSavingTable(false);
    }
  };

  const openTableModal = (table: TableItem) => {
    setSelectedTableDetails(table);
    setEditFloor(getTableFloor(table));
    setEditCapacity(table.capacity || 4);
    setIsEditingTable(false);
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP OPERATIONAL HEADER BANNER (WITH ONLY ONE POS BUTTON)  */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-orange-950/40 dark:via-[#1E293B] dark:to-slate-900 border border-slate-200 dark:border-orange-500/20 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-orange-500 dark:text-orange-400">
              {restaurant?.name || 'DINEDECK Restaurant'}
            </span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{formatRole(primaryRole)} Operations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Home Command Center</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Realtime dining floor, live guest orders, kitchen dispatch, and advance reservations.
          </p>
        </div>

        {/* Top Right: One Single Prominent POS Order Button */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => {
              setOrderType('DINE_IN');
              setShowPosModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-95 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-orange-500/25 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Take POS Order</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1b. TARGETED FOOD-READY PICKUP BUZZER ALERT (WAITER / CAPTAIN)*/}
      {/* ------------------------------------------------------------- */}
      {activePickupAlerts.length > 0 && (
        <div className="space-y-3">
          {activePickupAlerts.map((alert) => (
            <div
              key={alert.orderId}
              className="p-4 bg-gradient-to-r from-amber-950/70 via-orange-900/60 to-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl shadow-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in"
            >
              <div className="flex items-start space-x-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shrink-0 shadow-lg shadow-amber-500/40 animate-pulse">
                  <BellRing className="w-6 h-6" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                      🛎️ Food Ready For Pickup
                    </span>
                    <span className="text-white font-black text-sm font-mono">
                      Table #{alert.tableNumber}
                    </span>
                    <span className="text-xs text-amber-300 font-semibold">
                      • Assigned Server: {alert.waiterName || 'You'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium">
                    <strong className="text-amber-400 font-bold">Dishes: </strong>
                    {alert.itemsReady.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Station: {alert.stationName || 'Kitchen Pass'} • Order #{alert.orderNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAudioBuzzerActive(!isAudioBuzzerActive)}
                  className={`p-2 rounded-xl transition border ${
                    isAudioBuzzerActive
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title={isAudioBuzzerActive ? 'Mute Buzzer' : 'Enable Buzzer'}
                >
                  {isAudioBuzzerActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  disabled={servingActionLoading === alert.orderId}
                  onClick={() => handleMarkAlertServed(alert.orderId)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{servingActionLoading === alert.orderId ? 'Serving...' : 'Mark Picked Up & Served'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {posSuccessMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{posSuccessMsg}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SHIFT KPI CARDS STRIP                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('REPORTS')}
          className="bg-white dark:bg-[#1E293B] hover:border-orange-500/40 cursor-pointer transition border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm dark:shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Shift Settled Revenue</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            ₹{(overview?.settledRevenue || 0).toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            <span>{overview?.settledOrdersCount || 0} Settled Orders</span>
            <span className="text-slate-400 dark:text-slate-500 font-semibold">Reports & GST →</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('KITCHEN')}
          className="bg-white dark:bg-[#1E293B] hover:border-blue-500/40 cursor-pointer transition border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm dark:shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cooking in Kitchen</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {activeOrders.length || overview?.activeOrders || 0}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            <span>{cookingOrders.length} on fire in kitchen</span>
            <span className="text-blue-500 dark:text-blue-400 font-semibold">Open Kitchen Display →</span>
          </div>
        </div>

        <div
          onClick={() => setShowServiceCallsModal(true)}
          className="bg-white dark:bg-[#1E293B] hover:border-rose-500/40 cursor-pointer transition border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm dark:shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Service Calls</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
              <BellRing className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {pendingCalls.length}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            <span>Customer Table Calls</span>
            <span className={pendingCalls.length > 0 ? 'text-rose-500 dark:text-rose-400 font-bold' : 'text-slate-400 dark:text-slate-500'}>
              {pendingCalls.length > 0 ? 'Manage Calls →' : 'All Clear'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Floor Occupancy</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {sortedTables.length > 0 ? Math.round((occupiedAndReservedTablesList.length / sortedTables.length) * 100) : 0}%
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            <span>{occupiedAndReservedTablesList.length} / {sortedTables.length} Occupied</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{vacantTablesList.length} Ready</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. DINING FLOOR & TABLES (CLEAN 1..16 SEQUENTIAL LAYOUT)       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
        {/* Floor Dropdown & Seating Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Grid className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Dining Floor & Tables ({sortedTables.length} Tables)</h2>
            </div>

            {/* MULTI-FLOOR DROPDOWN SELECTOR */}
            <div className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">All Floors (Entire Venue)</option>
                <option value="Ground Floor (Main Hall)">Ground Floor (Main Hall)</option>
                <option value="First Floor (AC Family Hall)">First Floor (AC Family Hall)</option>
                <option value="Rooftop / Terrace Garden">Rooftop / Terrace Garden</option>
                <option value="Outdoor Courtyard & Patio">Outdoor Courtyard & Patio</option>
              </select>
            </div>
          </div>

          {/* Occupancy Filters & Fast Refresh */}
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 font-bold">
              <button
                type="button"
                onClick={() => setTableFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  tableFilter === 'ALL' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                All Tables ({sortedTables.length})
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('OCCUPIED')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                  tableFilter === 'OCCUPIED' ? 'bg-rose-500 text-white' : 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Occupied ({occupiedAndReservedTablesList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('VACANT')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                  tableFilter === 'VACANT' ? 'bg-emerald-600 text-white' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Vacant ({vacantTablesList.length})</span>
              </button>
            </div>

            {onRefreshTables && (
              <button
                type="button"
                onClick={onRefreshTables}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition border border-slate-200 dark:border-slate-700"
                title="Refresh Floor State"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Floor Table Cards Grid in Sequential Numeric Order (1..16) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filteredTables.map((table) => {
            const isOcc = table.isOccupied;
            const reservation = tableReservationMap.get(table.tableNumber);
            const pendingCall = tableServiceCallMap.get(table.tableNumber);
            const floorName = getTableFloor(table);
            const activeTableOrders = getTableActiveOrders(table.tableNumber);
            const tableRunningTotal = activeTableOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            return (
              <div
                key={table.id}
                onClick={() => {
                  setSelectedTableDetails(table);
                  setSelectedTableWaiterId(table.assignedServer?.id || 'usr-waiter-1');
                  setIsEditingWaiter(false);
                }}
                className={`p-3 rounded-2xl border transition-all shadow-sm dark:shadow-md flex flex-col justify-between space-y-2 relative group cursor-pointer hover:scale-[1.02] ${
                  pendingCall
                    ? 'bg-rose-50 dark:bg-slate-900 border-rose-500 ring-2 ring-rose-500/30'
                    : isOcc
                    ? 'bg-rose-50/70 dark:bg-slate-900/90 border-rose-300 dark:border-rose-500/50 hover:border-rose-500'
                    : reservation
                    ? 'bg-amber-50/70 dark:bg-slate-900/90 border-amber-300 dark:border-amber-500/50 hover:border-amber-500'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-emerald-500/60'
                }`}
              >
                {/* Alert Badge */}
                {pendingCall && (
                  <div className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center space-x-0.5 shadow-lg animate-pulse">
                    <BellRing className="w-2.5 h-2.5" />
                    <span>{(pendingCall.type || 'CALL').replace('_', ' ')}</span>
                  </div>
                )}

                {/* Table Header with Single-Line Title */}
                <div className="flex items-center justify-between gap-1 min-w-0">
                  <span className="text-xs font-black text-slate-900 dark:text-white font-mono whitespace-nowrap truncate">
                    {getFormattedTableTitle(table.tableNumber)}
                  </span>
                  <div className="flex items-center space-x-1 shrink-0">
                    <QrCode className="w-3 h-3 text-slate-400 group-hover:text-orange-500 transition" />
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOcc ? 'bg-rose-500' : reservation ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Seats & Floor info */}
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{table.capacity || 4} Seats</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                    {floorName}
                  </div>
                  
                  {/* Assigned Server Badge */}
                  {table.assignedServer && (
                    <div className="flex items-center space-x-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 truncate">
                      <UserCheck className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{table.assignedServer.name || 'Server'}</span>
                    </div>
                  )}

                  <div className="font-bold pt-0.5">
                    {isOcc ? (
                      <span className="text-rose-400">
                        {tableRunningTotal > 0 ? `₹${tableRunningTotal.toFixed(0)} Seated` : 'Diner Seated'}
                      </span>
                    ) : reservation ? (
                      <span className="text-amber-400 font-bold truncate block">
                        📅 {reservation.guestName.split(' ')[0]} ({reservation.time})
                      </span>
                    ) : (
                      <span className="text-emerald-400">Vacant / Ready</span>
                    )}
                  </div>
                </div>

                {/* Table Actions: Seat Table Toggle */}
                <div className="pt-1.5 border-t border-slate-800/80">
                  {onToggleTableOccupancy && hasPermission('tables.assign') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTableOccupancy(table);
                      }}
                      className={`text-[9px] font-bold px-2 py-1 rounded-lg transition w-full ${
                        isOcc
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : reservation
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {isOcc ? 'Mark Vacant' : reservation ? 'Seat Reservation' : 'Seat Table'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. COMPREHENSIVE EASYDINER + PETPOOJA TABLE & QR MODAL        */}
      {/* ------------------------------------------------------------- */}
      {selectedTableDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-mono font-black text-white text-xs shrink-0 shadow-lg shadow-orange-500/20 whitespace-nowrap">
                  {getTableShortBadge(selectedTableDetails.tableNumber)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-white whitespace-nowrap truncate">
                      {getFormattedTableTitle(selectedTableDetails.tableNumber)}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingTable(!isEditingTable)}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-orange-400 text-[10px] font-bold transition flex items-center space-x-1 border border-slate-700"
                      title="Configure Table Floor & Seating Capacity"
                    >
                      <Settings className="w-3 h-3 text-orange-400" />
                      <span>Configure Floor & Seats</span>
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap truncate block">
                    {getTableFloor(selectedTableDetails)} • {selectedTableDetails.capacity || 4} Seater Dining Table
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap ${
                    selectedTableDetails.isOccupied
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : tableReservationMap.has(selectedTableDetails.tableNumber)
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {selectedTableDetails.isOccupied
                    ? 'Diner Seated'
                    : tableReservationMap.has(selectedTableDetails.tableNumber)
                    ? `Reserved (${tableReservationMap.get(selectedTableDetails.tableNumber).time})`
                    : 'Vacant'}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTableDetails(null);
                    setIsEditingTable(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {tableConfigSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{tableConfigSuccess}</span>
              </div>
            )}

            {/* Table Configuration Editor Drawer */}
            {isEditingTable ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-orange-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Configure Table Settings
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingTable(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Assigned Floor / Section
                    </label>
                    <select
                      value={editFloor}
                      onChange={(e) => setEditFloor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
                    >
                      <option value="Ground Floor (Main Hall)">Ground Floor (Main Hall)</option>
                      <option value="First Floor (AC Family Hall)">First Floor (AC Family Hall)</option>
                      <option value="Rooftop / Terrace Garden">Rooftop / Terrace Garden</option>
                      <option value="Outdoor Courtyard & Patio">Outdoor Courtyard & Patio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Seating Capacity (Guests)
                    </label>
                    <select
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
                    >
                      <option value={2}>2 Seater (Couples Table)</option>
                      <option value={4}>4 Seater (Standard Dining)</option>
                      <option value={6}>6 Seater (Family Booth)</option>
                      <option value={8}>8 Seater (Large Group)</option>
                      <option value={10}>10 Seater (Banquet Hall)</option>
                      <option value={12}>12 Seater (Party Table)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingTable(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTableConfig}
                    disabled={isSavingTable}
                    className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingTable ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Modal Body: QR Standee & Operational Details */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* Left 5 Cols: Live Scannable Table QR Standee */}
              <div className="sm:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-3 flex flex-col items-center">
                <div className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                  Dine-In QR Code Standee
                </div>

                <div className="p-3 bg-white rounded-2xl shadow-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      getTableQrUrl(selectedTableDetails)
                    )}`}
                    alt={`${getFormattedTableTitle(selectedTableDetails.tableNumber)} QR Code`}
                    className="w-36 h-36 mx-auto rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">Scan & Order on Mobile</div>
                  <div className="text-[10px] text-slate-500">Self-serve menu, live orders & UPI payment</div>
                </div>

                <div className="flex items-center space-x-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => copyTableLink(selectedTableDetails)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[10px] transition flex items-center justify-center space-x-1 border border-slate-700"
                  >
                    {copySuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copySuccess ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-2 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 font-bold rounded-xl text-[10px] transition flex items-center justify-center space-x-1 border border-orange-500/30"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Print QR</span>
                  </button>
                </div>
              </div>

              {/* Right 7 Cols: Live Running Order & Table Actions */}
              <div className="sm:col-span-7 space-y-4">
                {/* Active Session Summary */}
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>Live Dining Session</span>
                    <span className="text-slate-500">Floor: {getTableFloor(selectedTableDetails)}</span>
                  </div>

                  {getTableActiveOrders(selectedTableDetails.tableNumber).length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-2">
                      No active orders placed for this table yet.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {getTableActiveOrders(selectedTableDetails.tableNumber).map((ord) => (
                        <div key={ord.id} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white font-mono">{ord.orderNumber}</div>
                            <div className="text-[10px] text-slate-400">
                              {ord.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                              {ord.status}
                            </span>
                            <div className="font-bold text-white text-xs font-mono mt-0.5">
                              ₹{(ord.totalAmount || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Guest Reservation Card */}
                {tableReservationMap.has(selectedTableDetails.tableNumber) && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs shrink-0">
                        📅
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-amber-400">Guest Reservation</div>
                        <div className="text-white font-bold text-xs">
                          {tableReservationMap.get(selectedTableDetails.tableNumber).guestName} • {tableReservationMap.get(selectedTableDetails.tableNumber).partySize} Guests • {tableReservationMap.get(selectedTableDetails.tableNumber).time}
                        </div>
                        {tableReservationMap.get(selectedTableDetails.tableNumber).notes && (
                          <div className="text-[10px] text-slate-400 italic">
                            Note: {tableReservationMap.get(selectedTableDetails.tableNumber).notes}
                          </div>
                        )}
                      </div>
                    </div>
                    {!selectedTableDetails.isOccupied && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onToggleTableOccupancy) onToggleTableOccupancy(selectedTableDetails);
                          setSelectedTableDetails({
                            ...selectedTableDetails,
                            isOccupied: true
                          });
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition whitespace-nowrap"
                      >
                        Seat Guest
                      </button>
                    )}
                  </div>
                )}

                {/* Assigned Waiter & Inline Reassign Card */}
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center space-x-1.5 text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Assigned Waiter</span>
                    </span>
                    {!isEditingWaiter ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingWaiter(true)}
                        className="text-[11px] font-bold text-orange-400 hover:text-orange-300 transition"
                      >
                        Reassign Waiter
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingWaiter(false)}
                        className="text-[11px] text-slate-500 hover:text-white"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {waiterChangeSuccess && (
                    <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{waiterChangeSuccess}</span>
                    </div>
                  )}

                  {!isEditingWaiter ? (
                    <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                          {selectedTableDetails.assignedServer?.name?.charAt(0) || 'R'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">
                            {selectedTableDetails.assignedServer?.name || 'Ramesh Kumar'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {selectedTableDetails.assignedServer?.role || 'Floor Captain'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        Active Server
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1 animate-in fade-in">
                      <select
                        value={selectedTableWaiterId}
                        onChange={(e) => setSelectedTableWaiterId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
                      >
                        <option value="usr-waiter-1">Ramesh Kumar (Floor Captain)</option>
                        <option value="usr-waiter-2">Suresh Raina (Senior Server)</option>
                        <option value="usr-waiter-3">Pooja Sharma (Steward / Host)</option>
                        <option value="usr-waiter-4">Amit Patel (Floor Captain)</option>
                      </select>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingWaiter(false)}
                          className="px-3 py-1.5 text-slate-400 hover:text-white text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSavingWaiter}
                          onClick={handleSaveTableWaiterInModal}
                          className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                        >
                          {isSavingWaiter ? 'Saving...' : 'Save Waiter'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const tbl = selectedTableDetails;
                      setSelectedTableDetails(null);
                      setPosTableNumber(tbl.tableNumber);
                      setOrderType('DINE_IN');
                      setShowPosModal(true);
                    }}
                    className="py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Take POS Order</span>
                  </button>

                  {onToggleTableOccupancy && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleTableOccupancy(selectedTableDetails);
                        setSelectedTableDetails({
                          ...selectedTableDetails,
                          isOccupied: !selectedTableDetails.isOccupied
                        });
                      }}
                      className={`py-3 font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 ${
                        selectedTableDetails.isOccupied
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{selectedTableDetails.isOccupied ? 'Mark Vacant' : 'Seat Table'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTableDetails(null);
                      onNavigateTab('BILLING');
                    }}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 border border-slate-700"
                  >
                    <Receipt className="w-3.5 h-3.5 text-orange-400" />
                    <span>Cashier & Billing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTableDetails(null);
                      onNavigateTab('KITCHEN');
                    }}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 border border-slate-700"
                  >
                    <ChefHat className="w-3.5 h-3.5 text-blue-400" />
                    <span>Kitchen Display</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. TAKE POS ORDER QUICK MODAL WORKSTATION                     */}
      {/* ------------------------------------------------------------- */}
      {showPosModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Take POS Order</h3>
                  <span className="text-[10px] text-slate-400">Direct Kitchen Ticket & KOT Generation</span>
                </div>
              </div>

              {/* Dine-In vs Takeaway Toggle */}
              <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setOrderType('DINE_IN')}
                  className={`px-3 py-1 rounded-lg transition ${
                    orderType === 'DINE_IN' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dine-In
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`px-3 py-1 rounded-lg transition ${
                    orderType === 'TAKEAWAY' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Takeaway / Parcel
                </button>

                <button
                  type="button"
                  onClick={() => setShowPosModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: 2-Column POS */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 7 Cols: Search & Dish Catalog */}
              <div className="lg:col-span-7 space-y-3">
                {/* Search Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search dish by name (e.g. Butter Chicken, Paneer Tikka, Naan)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs shrink-0 font-bold">
                    <button
                      type="button"
                      onClick={() => setDietFilter('ALL')}
                      className={`px-2 py-1 rounded-lg transition ${
                        dietFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setDietFilter('VEG')}
                      className={`px-2 py-1 rounded-lg transition ${
                        dietFilter === 'VEG' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
                      }`}
                    >
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setDietFilter('NON_VEG')}
                      className={`px-2 py-1 rounded-lg transition ${
                        dietFilter === 'NON_VEG' ? 'bg-rose-600 text-white' : 'text-rose-400'
                      }`}
                    >
                      Non-Veg
                    </button>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition ${
                      selectedCategory === 'ALL'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    All Menu ({allItems.length})
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition ${
                        selectedCategory === cat.name
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cat.name} ({cat.items?.length || 0})
                    </button>
                  ))}
                </div>

                {/* Dishes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {filteredDishes.map((item) => {
                    const inCartQty = cartItemCounts.get(item.id) || 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          inCartQty > 0
                            ? 'bg-orange-500/10 border-orange-500/60'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                          </div>
                          <div className="text-xs font-black text-orange-400 font-mono mt-0.5">
                            ₹{item.price.toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {inCartQty > 0 && (
                            <span className="w-5 h-5 rounded-lg bg-orange-500 text-white font-black text-[10px] flex items-center justify-center">
                              {inCartQty}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item);
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-300 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 5 Cols: POS Ticket Cart & Dispatch */}
              <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <span className="font-bold text-white">Current Ticket</span>
                    <span className="text-orange-400 font-bold">{totalCartCount} items</span>
                  </div>

                  {/* Target Table */}
                  {orderType === 'DINE_IN' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        Seated Table Number
                      </label>
                      <select
                        value={posTableNumber}
                        onChange={(e) => setPosTableNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
                      >
                        {sortedTables.map((t) => (
                          <option key={t.id} value={t.tableNumber}>
                            {getFormattedTableTitle(t.tableNumber)} {t.isOccupied ? '• (Occupied)' : '• (Vacant)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        Customer / Token Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh (+91 98200...)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  )}

                  {/* Cart Items List */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {cart.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Cart is empty. Tap any dish to add.
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.menuItemId}
                          className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="truncate pr-1">
                            <div className="font-bold text-white truncate">{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ₹{item.unitPrice} × {item.quantity}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.menuItemId, -1)}
                              className="p-0.5 text-slate-400 hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-bold text-xs text-white px-1">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.menuItemId, 1)}
                              className="p-0.5 text-slate-400 hover:text-white"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.menuItemId)}
                              className="p-0.5 text-rose-400 hover:text-rose-300 ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Kitchen Instructions */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      Kitchen Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Less spicy, serve hot..."
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Submit Button with clean 'Print KOT' text */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>Total Amount:</span>
                    <span className="font-mono text-white font-black text-sm">
                      ₹{cartTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={cart.length === 0 || isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-orange-500/20 disabled:opacity-40 flex items-center justify-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isSubmitting ? 'Sending to Kitchen...' : 'Send to Kitchen & Print'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. RESERVATION BOOKING MODAL                                  */}
      {/* ------------------------------------------------------------- */}
      {showResModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-black text-white">New Table Booking</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddReservation} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Guest Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kapil Dev"
                  value={resGuestName}
                  onChange={(e) => setResGuestName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98112..."
                    value={resGuestPhone}
                    onChange={(e) => setResGuestPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Party Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={resPartySize}
                    onChange={(e) => setResPartySize(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Booking Time
                  </label>
                  <input
                    type="text"
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                    placeholder="20:30"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Assign Table
                  </label>
                  <select
                    value={resTable}
                    onChange={(e) => setResTable(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
                  >
                    {sortedTables.map((t) => (
                      <option key={t.id} value={t.tableNumber}>
                        {getFormattedTableTitle(t.tableNumber)} ({t.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-500/20"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. ACTIVE TABLE SERVICE CALLS MODAL POPUP                    */}
      {/* ------------------------------------------------------------- */}
      {showServiceCallsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowServiceCallsModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 text-xs font-bold"
                  title="Back to Home Dashboard"
                >
                  <ArrowLeft className="w-4 h-4 text-orange-400" />
                  <span>Back</span>
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-white">Table Service Call Logs</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {pendingCalls.length} Pending
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Live diner waiter calls, water refills, and bill assistance</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowServiceCallsModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter Strip */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search service calls by table # (e.g. 10), request type, or note..."
                  value={serviceCallSearch}
                  onChange={(e) => setServiceCallSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                {serviceCallSearch && (
                  <button
                    type="button"
                    onClick={() => setServiceCallSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-1.5 text-xs font-bold overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setServiceCallStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-xl transition ${
                    serviceCallStatusFilter === 'ALL'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({localServiceCalls.length})
                </button>
                <button
                  type="button"
                  onClick={() => setServiceCallStatusFilter('PENDING')}
                  className={`px-3 py-1 rounded-xl transition flex items-center space-x-1 ${
                    serviceCallStatusFilter === 'PENDING'
                      ? 'bg-rose-600 text-white'
                      : 'text-rose-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  <span>Pending ({pendingCalls.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setServiceCallStatusFilter('ACKNOWLEDGED')}
                  className={`px-3 py-1 rounded-xl transition ${
                    serviceCallStatusFilter === 'ACKNOWLEDGED'
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-400 hover:text-white'
                  }`}
                >
                  In Progress ({acknowledgedCalls.length})
                </button>
                <button
                  type="button"
                  onClick={() => setServiceCallStatusFilter('COMPLETED')}
                  className={`px-3 py-1 rounded-xl transition ${
                    serviceCallStatusFilter === 'COMPLETED'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-400 hover:text-white'
                  }`}
                >
                  Completed ({completedCalls.length})
                </button>
              </div>
            </div>

            {/* Sequential Service Call Logs List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredLocalServiceCalls.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="font-bold text-white">All Clear! No Service Requests</div>
                  <p className="text-slate-500 text-[11px]">All table service requests are currently resolved and acknowledged.</p>
                </div>
              ) : (
                filteredLocalServiceCalls.map((call) => {
                  const isPending = (call.status || 'PENDING') === 'PENDING';
                  const isAck = call.status === 'ACKNOWLEDGED';
                  const isComp = ['COMPLETED', 'RESOLVED'].includes(call.status);
                  const typeLabel = (call.type || call.requestType || 'CALL_WAITER').replace(/_/g, ' ');

                  return (
                    <div
                      key={call.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        isPending
                          ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-500/5'
                          : isAck
                          ? 'bg-blue-950/20 border-blue-500/50'
                          : 'bg-slate-900/60 border-slate-800 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-400 font-mono font-black text-xs">
                            {getFormattedTableTitle(call.tableNumber || '1')}
                          </span>
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {typeLabel}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isPending
                                ? 'bg-rose-500 text-white animate-pulse'
                                : isAck
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {call.status || 'PENDING'}
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      {(call.notes || call.customNote) && (
                        <div className="text-xs text-slate-300 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                          {call.notes || call.customNote}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          Floor: {getTableFloor(call.tableNumber || '1')}
                        </span>

                        <div className="flex items-center space-x-2">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleUpdateServiceCallStatus(call.id, 'ACKNOWLEDGED')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[11px] transition shadow-sm"
                            >
                              Acknowledge
                            </button>
                          )}

                          {!isComp && (
                            <button
                              type="button"
                              onClick={() => handleUpdateServiceCallStatus(call.id, 'COMPLETED')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] transition shadow-sm flex items-center space-x-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          )}

                          {!isComp && (
                            <button
                              type="button"
                              onClick={() => handleUpdateServiceCallStatus(call.id, 'CANCELLED')}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold rounded-xl text-[11px] transition"
                            >
                              Cancel
                            </button>
                          )}

                          {isComp && (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Resolved</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
