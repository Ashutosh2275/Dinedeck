import React, { useState, useMemo } from 'react';
import { useInventory, RawStockItem } from '../context/InventoryContext';
import { printMandiProcurementSlip } from '../utils/thermalPrinter';
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  TrendingDown,
  Truck,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardCheck,
  Building2,
  Phone,
  Mail,
  Copy,
  Printer,
  Check,
  X,
  Edit2,
  Trash2,
  ChefHat,
  Flame,
  Scale,
  Sparkles,
  ArrowRight,
  Send,
  CreditCard,
  IndianRupee,
  ShieldCheck,
  Clock,
  History,
  Tag,
  Zap,
  TrendingUp,
  Sliders,
  UtensilsCrossed,
  ShoppingCart,
  PieChart
} from 'lucide-react';

interface InwardRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  supplier: string;
  invoiceNumber: string;
  paymentMode: 'VENDOR_CREDIT' | 'CASH_DRAWER' | 'UPI' | 'BANK_TRANSFER';
  receivedBy: string;
  date: string;
  notes?: string;
}

interface WastageRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  financialLoss: number;
  reason: 'EXPIRED' | 'BURNT_SPILL' | 'PREP_TRIMMING' | 'QUALITY_REJECTED' | 'CUSTOMER_RETURN';
  recordedBy: string;
  date: string;
  notes?: string;
}

interface GravyPrepBatch {
  id: string;
  name: string;
  yieldQuantity: number;
  unit: string;
  inStockQuantity: number;
  storageLocation: string;
  shelfLifeHours: number;
  preppedAt: string;
  rawRecipeIngredients: Array<{ itemName: string; requiredQty: number; unit: string }>;
}

interface VendorContact {
  id: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  gstin: string;
  paymentTerms: string;
  outstandingBalance: number;
  totalPurchasesMonth: number;
}

export const Inventory: React.FC = () => {
  const {
    rawItems: items,
    recipes,
    capacities,
    getDishCapacity,
    deductIngredientsForOrder,
    updateRawStock,
    addRawInward,
    logRawWastage,
    nearOutOfStockDishes
  } = useInventory();

  // Tabs Navigation
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'RESTOCK_BOM' | 'SIMULATOR' | 'GRAVY_PREP' | 'MANDI_INWARD' | 'WASTAGE' | 'AUDIT' | 'VENDORS'>('REGISTER');

  // Tomorrow Demand Projection Multiplier (Normal 1.0x, Weekend 1.5x, Festival / Party 2.0x)
  const [demandForecastMultiplier, setDemandForecastMultiplier] = useState<number>(1.2);

  // Master Gravies & Pre-prepped Batches
  const [gravyBatches, setGravyBatches] = useState<GravyPrepBatch[]>([
    {
      id: 'grp-1',
      name: 'Makhani Gravy Master Base (Butter Chicken / Paneer Makhani)',
      yieldQuantity: 20.0,
      unit: 'L',
      inStockQuantity: 14.5,
      storageLocation: 'Walk-in Cold Storage (Container M1)',
      shelfLifeHours: 48,
      preppedAt: '2026-08-30 11:00 AM',
      rawRecipeIngredients: [
        { itemName: 'Hybrid Salad Tomatoes', requiredQty: 10.0, unit: 'kg' },
        { itemName: 'Whole Cashews (Kaju Tukda)', requiredQty: 2.0, unit: 'kg' },
        { itemName: 'Amul Salted Table Butter', requiredQty: 1.5, unit: 'kg' },
        { itemName: 'Fresh Heavy Cooking Cream', requiredQty: 1.0, unit: 'L' }
      ]
    },
    {
      id: 'grp-2',
      name: 'Bhuna Masala Onion-Tomato Gravy (Kadhai / Rogan Josh)',
      yieldQuantity: 25.0,
      unit: 'L',
      inStockQuantity: 18.0,
      storageLocation: 'Walk-in Cold Storage (Container B1)',
      shelfLifeHours: 72,
      preppedAt: '2026-08-30 10:30 AM',
      rawRecipeIngredients: [
        { itemName: 'Red Onions', requiredQty: 18.0, unit: 'kg' },
        { itemName: 'Hybrid Salad Tomatoes', requiredQty: 8.0, unit: 'kg' },
        { itemName: 'Desi Ghee', requiredQty: 1.5, unit: 'kg' },
        { itemName: 'Kashmiri Red Chilli Powder', requiredQty: 0.4, unit: 'kg' }
      ]
    },
    {
      id: 'grp-3',
      name: 'Tandoori Tikka Red Master Marination',
      yieldQuantity: 12.0,
      unit: 'kg',
      inStockQuantity: 8.0,
      storageLocation: 'Walk-in Cold Storage (Marination Tub T1)',
      shelfLifeHours: 48,
      preppedAt: '2026-08-30 09:30 AM',
      rawRecipeIngredients: [
        { itemName: 'Fresh Malai Paneer / Dahi', requiredQty: 8.0, unit: 'kg' },
        { itemName: 'Kashmiri Red Chilli Powder', requiredQty: 0.5, unit: 'kg' },
        { itemName: 'Desi Ghee / Mustard Oil', requiredQty: 0.6, unit: 'kg' }
      ]
    }
  ]);

  // Goods Inward (GRN) Register
  const [inwardLogs, setInwardLogs] = useState<InwardRecord[]>([
    {
      id: 'grn-1001',
      itemId: 'inv-6',
      itemName: 'Fresh Boneless Chicken Breast',
      quantity: 20.0,
      unit: 'kg',
      costPerUnit: 280.0,
      totalCost: 5600.0,
      supplier: 'Zorabian Fresh Cuts',
      invoiceNumber: 'INV-ZOR-8821',
      paymentMode: 'VENDOR_CREDIT',
      receivedBy: 'Chef Manpreet Singh',
      date: '2026-08-30 08:30 AM',
      notes: 'Morning fresh poultry delivery inspected, temp 2°C approved'
    },
    {
      id: 'grn-1002',
      itemId: 'inv-1',
      itemName: 'Fresh Malai Paneer (Vacuum Pack)',
      quantity: 15.0,
      unit: 'kg',
      costPerUnit: 340.0,
      totalCost: 5100.0,
      supplier: 'Amul Dairy Distro (BKC)',
      invoiceNumber: 'INV-AMUL-9912',
      paymentMode: 'VENDOR_CREDIT',
      receivedBy: 'Harpreet Singh (Owner)',
      date: '2026-08-29 09:15 AM',
      notes: 'Vacuum seals intact, batch code B-88'
    },
    {
      id: 'grn-1003',
      itemId: 'inv-7',
      itemName: 'Red Onions (Nashik Quality)',
      quantity: 100.0,
      unit: 'kg',
      costPerUnit: 35.0,
      totalCost: 3500.0,
      supplier: 'APMC Market Vashi Stall 42',
      invoiceNumber: 'CHALLAN-APMC-402',
      paymentMode: 'CASH_DRAWER',
      receivedBy: 'Ramesh (Storekeeper)',
      date: '2026-08-29 07:00 AM',
      notes: 'Paid cash directly to mandi tempo driver'
    }
  ]);

  // Kitchen Wastage Logbook
  const [wastageLogs, setWastageLogs] = useState<WastageRecord[]>([
    {
      id: 'wst-201',
      itemId: 'inv-4',
      itemName: 'Fresh Heavy Cooking Cream (Amul 36%)',
      quantity: 1.5,
      unit: 'L',
      costPerUnit: 220.0,
      financialLoss: 330.0,
      reason: 'EXPIRED',
      recordedBy: 'Chef Gurpreet',
      date: '2026-08-30 11:30 PM',
      notes: 'Opened carton past 48hr shelf life in walk-in'
    },
    {
      id: 'wst-202',
      itemId: 'inv-1',
      itemName: 'Fresh Malai Paneer (Vacuum Pack)',
      quantity: 0.8,
      unit: 'kg',
      costPerUnit: 340.0,
      financialLoss: 272.0,
      reason: 'PREP_TRIMMING',
      recordedBy: 'Chef Manpreet Singh',
      date: '2026-08-29 04:00 PM',
      notes: 'Skewering trimming losses during tandoori tikka prep'
    }
  ]);

  // Vendors Directory & Khata Ledger
  const [vendors, setVendors] = useState<VendorContact[]>([
    {
      id: 'ven-1',
      name: 'Amul Dairy Distro (BKC Hub)',
      category: 'Dairy & Cheese',
      phone: '+91 98200 11223',
      email: 'orders.bkc@amuldistro.com',
      gstin: '27AABCA1234F1Z5',
      paymentTerms: 'Weekly Net 7 (Every Monday)',
      outstandingBalance: 12400.0,
      totalPurchasesMonth: 48600.0
    },
    {
      id: 'ven-2',
      name: 'Zorabian Fresh Cuts',
      category: 'Meat & Poultry',
      phone: '+91 98444 88990',
      email: 'supply@zorabianfresh.in',
      gstin: '27AABCZ5678K1Z2',
      paymentTerms: 'Weekly Net 7',
      outstandingBalance: 18500.0,
      totalPurchasesMonth: 64200.0
    },
    {
      id: 'ven-3',
      name: 'APMC Market Vashi Stall 42 (Produce)',
      category: 'Vegetables & Produce',
      phone: '+91 98777 22334',
      email: 'apmc.vashi42@gmail.com',
      gstin: '27AABCV8899N1Z4',
      paymentTerms: 'Daily Cash / UPI On Delivery',
      outstandingBalance: 0.0,
      totalPurchasesMonth: 32400.0
    },
    {
      id: 'ven-4',
      name: 'Kohinoor & Daawat Agro Mills',
      category: 'Grains & Flour',
      phone: '+91 98211 44556',
      email: 'mumbai.sales@kohinooragro.com',
      gstin: '27AABCK9901M1Z8',
      paymentTerms: 'Monthly Net 30',
      outstandingBalance: 15000.0,
      totalPurchasesMonth: 38000.0
    },
    {
      id: 'ven-5',
      name: 'MDH & Everest Spices Vashi',
      category: 'Spices & Seasonings',
      phone: '+91 98333 55667',
      email: 'vashi.spices@everestmdh.in',
      gstin: '27AABCE3344P1Z1',
      paymentTerms: 'Bi-weekly Net 15',
      outstandingBalance: 8200.0,
      totalPurchasesMonth: 22000.0
    },
    {
      id: 'ven-6',
      name: 'PackPro Solutions Mumbai',
      category: 'Packaging & Disposables',
      phone: '+91 98111 66778',
      email: 'sales@packprosolutions.com',
      gstin: '27AABCP7788R1Z9',
      paymentTerms: 'Immediate UPI',
      outstandingBalance: 0.0,
      totalPurchasesMonth: 14000.0
    }
  ]);

  // Physical Audit inputs
  const [auditCounts, setAuditCounts] = useState<{ [id: string]: number }>({});
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [storageFilter, setStorageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'HEALTHY'>('ALL');

  // Live Order Simulator Form State
  const [simSelectedDish, setSimSelectedDish] = useState(recipes[0]?.dishName || 'Paneer Butter Masala');
  const [simPortionsCount, setSimPortionsCount] = useState<number>(2);
  const [simRecentEvents, setSimRecentEvents] = useState<Array<{ id: string; text: string; time: string }>>([
    {
      id: 'sim-1',
      text: 'Order placed: 2x Paneer Butter Masala (Deducted 400g Paneer, 300g Tomatoes, 60g Butter)',
      time: '12:15 PM'
    }
  ]);

  // Modals
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCookGravyModal, setShowCookGravyModal] = useState(false);
  const [selectedGravy, setSelectedGravy] = useState<GravyPrepBatch | null>(null);
  const [cookBatchMultiplier, setCookBatchMultiplier] = useState<number>(1);
  const [showVendorPayModal, setShowVendorPayModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorContact | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMode, setPayMode] = useState<'UPI' | 'CASH' | 'BANK'>('UPI');
  const [copiedMandiPO, setCopiedMandiPO] = useState(false);

  // Form states: Inward GRN
  const [inwardItemId, setInwardItemId] = useState(items[0]?.id || '');
  const [inwardQty, setInwardQty] = useState('');
  const [inwardRate, setInwardRate] = useState('');
  const [inwardSupplier, setInwardSupplier] = useState('');
  const [inwardInvoice, setInwardInvoice] = useState('');
  const [inwardPayMode, setInwardPayMode] = useState<'VENDOR_CREDIT' | 'CASH_DRAWER' | 'UPI' | 'BANK_TRANSFER'>('VENDOR_CREDIT');
  const [inwardNotes, setInwardNotes] = useState('');

  // Form states: Wastage
  const [wasteItemId, setWasteItemId] = useState(items[0]?.id || '');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState<'EXPIRED' | 'BURNT_SPILL' | 'PREP_TRIMMING' | 'QUALITY_REJECTED' | 'CUSTOMER_RETURN'>('EXPIRED');
  const [wasteNotes, setWasteNotes] = useState('');
  const [wasteChefName, setWasteChefName] = useState('Chef Manpreet Singh');

  // Form states: Add New Raw Item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Dairy & Cheese');
  const [newItemStock, setNewItemStock] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemMin, setNewItemMin] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemSupplier, setNewItemSupplier] = useState('');
  const [newItemStorage, setNewItemStorage] = useState('Cold Storage / Walk-in');

  // -------------------------------------------------------------
  // 🧠 SMART NEXT-DAY PROCUREMENT & RECIPE CONSUMPTION ENGINE
  // -------------------------------------------------------------
  const todayRawConsumptionMap = useMemo(() => {
    const map = new Map<string, number>();
    recipes.forEach((bom) => {
      bom.ingredients.forEach((ing) => {
        const totalIngConsumed = ing.qtyPerPortion * 15; // default shift base
        const key = ing.rawItemId || ing.rawItemName;
        map.set(key, (map.get(key) || 0) + totalIngConsumed);
      });
    });
    return map;
  }, [recipes]);

  const nextDayProcurementPlan = useMemo(() => {
    return items.map((raw) => {
      const consumedToday = todayRawConsumptionMap.get(raw.id) || todayRawConsumptionMap.get(raw.name) || 0;
      const projectedTomorrowDemand = Math.max(consumedToday * demandForecastMultiplier, raw.minimumThreshold * 0.5);
      const targetRequired = projectedTomorrowDemand + raw.minimumThreshold;
      const recommendedOrderQty = Math.max(0, targetRequired - raw.currentStock);
      const estimatedCost = recommendedOrderQty * raw.costPerUnit;

      const urgency: 'CRITICAL' | 'RECOMMENDED' | 'SUFFICIENT' =
        raw.currentStock <= raw.minimumThreshold || raw.currentStock < projectedTomorrowDemand
          ? 'CRITICAL'
          : recommendedOrderQty > 0
          ? 'RECOMMENDED'
          : 'SUFFICIENT';

      return {
        ...raw,
        consumedToday,
        projectedTomorrowDemand,
        recommendedOrderQty: Math.ceil(recommendedOrderQty * 2) / 2,
        estimatedCost,
        urgency
      };
    });
  }, [items, todayRawConsumptionMap, demandForecastMultiplier]);

  const urgentRestockItems = useMemo(() => {
    return nextDayProcurementPlan.filter((p) => p.recommendedOrderQty > 0);
  }, [nextDayProcurementPlan]);

  const totalTomorrowRestockBudget = useMemo(() => {
    return urgentRestockItems.reduce((sum, p) => sum + p.estimatedCost, 0);
  }, [urgentRestockItems]);

  const totalValuation = useMemo(() => {
    return items.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);
  }, [items]);

  const lowStockItems = useMemo(() => {
    return items.filter((i) => i.currentStock <= i.minimumThreshold);
  }, [items]);

  const totalVendorDue = useMemo(() => {
    return vendors.reduce((sum, v) => sum + v.outstandingBalance, 0);
  }, [vendors]);

  const todayWastageLoss = useMemo(() => {
    return wastageLogs.reduce((sum, w) => sum + w.financialLoss, 0);
  }, [wastageLogs]);

  const categoriesList = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const storageLocationsList = useMemo(() => {
    const set = new Set(items.map((i) => i.storageLocation));
    return ['ALL', ...Array.from(set)];
  }, [items]);

  // Filtered Stock Register
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = i.name.toLowerCase().includes(q);
        const matchesSupplier = i.supplier.toLowerCase().includes(q);
        const matchesLoc = i.storageLocation.toLowerCase().includes(q);
        if (!matchesName && !matchesSupplier && !matchesLoc) return false;
      }

      if (categoryFilter !== 'ALL' && i.category !== categoryFilter) {
        return false;
      }

      if (storageFilter !== 'ALL' && i.storageLocation !== storageFilter) {
        return false;
      }

      const isLow = i.currentStock <= i.minimumThreshold;
      if (statusFilter === 'LOW_STOCK' && !isLow) return false;
      if (statusFilter === 'HEALTHY' && isLow) return false;

      return true;
    });
  }, [items, searchQuery, categoryFilter, storageFilter, statusFilter]);

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleSaveInward = (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find((i) => i.id === inwardItemId);
    if (!item) return;

    const qty = parseFloat(inwardQty) || 0;
    const rate = parseFloat(inwardRate) || item.costPerUnit;
    const total = qty * rate;

    addRawInward(item.id, qty, rate);

    const newRecord: InwardRecord = {
      id: `grn-${Date.now().toString().slice(-4)}`,
      itemId: item.id,
      itemName: item.name,
      quantity: qty,
      unit: item.unit,
      costPerUnit: rate,
      totalCost: total,
      supplier: inwardSupplier.trim() || item.supplier,
      invoiceNumber: inwardInvoice.trim() || `BILL-${Date.now().toString().slice(-4)}`,
      paymentMode: inwardPayMode,
      receivedBy: 'Harpreet Singh (Owner)',
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      notes: inwardNotes.trim() || undefined
    };

    setInwardLogs((prev) => [newRecord, ...prev]);

    if (inwardPayMode === 'VENDOR_CREDIT') {
      setVendors((prev) =>
        prev.map((v) =>
          v.name.toLowerCase().includes(item.supplier.toLowerCase().split(' ')[0])
            ? {
                ...v,
                outstandingBalance: v.outstandingBalance + total,
                totalPurchasesMonth: v.totalPurchasesMonth + total
              }
            : v
        )
      );
    }

    setShowInwardModal(false);
    setInwardQty('');
    setInwardRate('');
    setInwardInvoice('');
    setInwardNotes('');
  };

  const handleSaveWastage = (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find((i) => i.id === wasteItemId);
    if (!item) return;

    const qty = parseFloat(wasteQty) || 0;
    const loss = qty * item.costPerUnit;

    logRawWastage(item.id, qty);

    const newRecord: WastageRecord = {
      id: `wst-${Date.now().toString().slice(-4)}`,
      itemId: item.id,
      itemName: item.name,
      quantity: qty,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      financialLoss: loss,
      reason: wasteReason,
      recordedBy: wasteChefName.trim() || 'Chef On Duty',
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      notes: wasteNotes.trim() || undefined
    };

    setWastageLogs((prev) => [newRecord, ...prev]);
    setShowWastageModal(false);
    setWasteQty('');
    setWasteNotes('');
  };

  // Live Order Simulator Handler
  const handleSimulateOrderPlacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simSelectedDish || simPortionsCount <= 0) return;

    deductIngredientsForOrder([{ name: simSelectedDish, quantity: simPortionsCount }]);

    const rec = recipes.find((r) => r.dishName.toLowerCase() === simSelectedDish.toLowerCase());
    const deductedStr = rec
      ? rec.ingredients
          .map((i) => `${(i.qtyPerPortion * simPortionsCount).toFixed(2)} ${i.unit} ${i.rawItemName.split(' ')[0]}`)
          .join(', ')
      : 'ingredients';

    const eventText = `Simulated order: ${simPortionsCount}x ${simSelectedDish} (Deducted ${deductedStr})`;
    setSimRecentEvents((prev) => [
      {
        id: `sim-${Date.now()}`,
        text: eventText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      },
      ...prev.slice(0, 7)
    ]);
  };

  const handleExecuteGravyBatchCook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGravy) return;

    const multiplier = cookBatchMultiplier || 1;
    const preppedYield = selectedGravy.yieldQuantity * multiplier;

    selectedGravy.rawRecipeIngredients.forEach((r) => {
      const match = items.find((it) => it.name.toLowerCase().includes(r.itemName.toLowerCase()));
      if (match) {
        logRawWastage(match.id, r.requiredQty * multiplier);
      }
    });

    setGravyBatches((prev) =>
      prev.map((g) =>
        g.id === selectedGravy.id
          ? {
              ...g,
              inStockQuantity: g.inStockQuantity + preppedYield,
              preppedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
            }
          : g
      )
    );

    alert(`Successfully cooked batch! Added +${preppedYield} ${selectedGravy.unit} of ${selectedGravy.name} to kitchen prep stock.`);
    setShowCookGravyModal(false);
    setSelectedGravy(null);
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: RawStockItem = {
      id: `inv-${Date.now().toString().slice(-4)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      currentStock: parseFloat(newItemStock) || 0,
      unit: newItemUnit,
      minimumThreshold: parseFloat(newItemMin) || 5,
      costPerUnit: parseFloat(newItemCost) || 100,
      supplier: newItemSupplier.trim() || 'Local Distributor',
      storageLocation: newItemStorage,
      lastRestocked: new Date().toISOString().split('T')[0],
      priceTrend: 'STABLE'
    };

    updateRawStock(newItem.id, newItem.currentStock);
    setShowAddItemModal(false);
    setNewItemName('');
    setNewItemStock('');
    setNewItemMin('');
    setNewItemCost('');
    setNewItemSupplier('');
  };

  const handleReconcileAllAudit = () => {
    let updatedCount = 0;
    items.forEach((i) => {
      if (auditCounts[i.id] !== undefined && !isNaN(auditCounts[i.id])) {
        updatedCount++;
        updateRawStock(i.id, auditCounts[i.id]);
      }
    });

    setAuditSuccessMsg(`Successfully reconciled ${updatedCount} items to physical closing shelf counts.`);
    setTimeout(() => setAuditSuccessMsg(null), 4000);
    setAuditCounts({});
  };

  const handleRecordVendorPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    const amt = parseFloat(payAmount) || 0;
    setVendors((prev) =>
      prev.map((v) =>
        v.id === selectedVendor.id
          ? {
              ...v,
              outstandingBalance: Math.max(0, v.outstandingBalance - amt)
            }
          : v
      )
    );

    alert(`Recorded payment of ₹${amt.toFixed(2)} to ${selectedVendor.name} via ${payMode}.`);
    setShowVendorPayModal(false);
    setSelectedVendor(null);
    setPayAmount('');
  };

  const generateNextDayMandiPOText = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('en-IN', { dateStyle: 'full' });

    let text = `🌅 *NEXT-DAY MORNING MANDI & PROCUREMENT LIST*\n`;
    text += `🏨 *The Punjab Heritage Kitchen (BKC Location)*\n`;
    text += `📅 Delivery Date: *${tomorrowStr} (07:00 AM)*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*RAW INGREDIENTS TO RESTOCK (${urgentRestockItems.length} Items)*:\n\n`;

    const supplierGroups = new Map<string, typeof urgentRestockItems>();
    urgentRestockItems.forEach((item) => {
      const group = supplierGroups.get(item.supplier) || [];
      group.push(item);
      supplierGroups.set(item.supplier, group);
    });

    supplierGroups.forEach((groupItems, supplierName) => {
      text += `🏢 *Vendor: ${supplierName}*\n`;
      groupItems.forEach((item) => {
        text += `   • *${item.name}*: *${item.recommendedOrderQty} ${item.unit}*\n`;
        text += `     (Shelf Balance: ${item.currentStock.toFixed(1)} ${item.unit} | Today Consumed: ${item.consumedToday.toFixed(1)} ${item.unit})\n`;
      });
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 Estimated Procurement Budget: *₹${totalTomorrowRestockBudget.toLocaleString()}*\n`;
    text += `Please send morning delivery tempo with printed challan/invoice. Thank you!`;
    return text;
  };

  const handleCopyMandiPO = () => {
    const text = generateNextDayMandiPOText();
    navigator.clipboard.writeText(text);
    setCopiedMandiPO(true);
    setTimeout(() => setCopiedMandiPO(false), 2500);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & OPERATIONAL METRICS STRIP                         */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-xl font-black text-white tracking-tight">Stock & Inventory</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Live Recipe Sync
                </span>
                {nearOutOfStockDishes.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{nearOutOfStockDishes.length} Dishes Near Out of Stock</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every customer order dynamically consumes raw ingredients. Recommends restocking before items run out without abrupt stockouts.
              </p>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('SIMULATOR')}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-blue-600/20"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Live Order Depletion Tester</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RESTOCK_BOM')}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-orange-500/20"
            >
              <Zap className="w-4 h-4" />
              <span>Next-Day Restock Plan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInwardItemId(items[0]?.id || '');
                setInwardRate(String(items[0]?.costPerUnit || ''));
                setShowInwardModal(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>+ Inward GRN</span>
            </button>
          </div>
        </div>

        {/* Live Operational Inventory Financial KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Total Stock Valuation</div>
            <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
              ₹{totalValuation.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Near Out of Stock</div>
            <div className="text-sm font-black text-amber-400 font-mono mt-0.5">
              {nearOutOfStockDishes.length} Dishes at Risk
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Tomorrow Restock Budget</div>
            <div className="text-sm font-black text-purple-300 font-mono mt-0.5">
              ₹{totalTomorrowRestockBudget.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Vendor Khata Due</div>
            <div className="text-sm font-black text-slate-200 font-mono mt-0.5">
              ₹{totalVendorDue.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Prepped Gravies Ready</div>
            <div className="text-sm font-black text-orange-400 mt-0.5">
              {gravyBatches.length} Bases ({gravyBatches.reduce((s, g) => s + g.inStockQuantity, 0).toFixed(0)} L)
            </div>
          </div>
        </div>

        {/* 8 Workstation Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pt-4 border-t border-slate-800/80 mt-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('REGISTER')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'REGISTER'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Raw Ingredients Ledger ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SIMULATOR')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'SIMULATOR'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-blue-400 hover:text-blue-300 border border-slate-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Live Order Depletion Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RESTOCK_BOM')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'RESTOCK_BOM'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-amber-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Portion Capacities & Restock Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GRAVY_PREP')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'GRAVY_PREP'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Master Gravies & Prep</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MANDI_INWARD')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'MANDI_INWARD'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Goods Inward / GRN ({inwardLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WASTAGE')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'WASTAGE'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Kitchen Wastage Log</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'AUDIT'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Closing Shelf Audit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('VENDORS')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'VENDORS'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Vendor Khatas</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. TAB: LIVE ORDER DEPLETION TESTER & MULTI-ORDER SIMULATOR  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'SIMULATOR' && (
        <div className="space-y-5">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">
                  Live Order Depletion & Multi-Plate Capacity Simulator
                </h2>
                <p className="text-xs text-slate-400">
                  Simulate live customer orders to see exact gram/kg raw material deductions and real-time portion capacity alerts across all dishes sharing the same ingredient!
                </p>
              </div>
            </div>

            {/* Interactive Simulation Form */}
            <form onSubmit={handleSimulateOrderPlacement} className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-bold text-slate-300">
                ⚡ Select Food Item & Order Quantity to Deduct from Kitchen Inventory:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 text-xs">Menu Dish</label>
                  <select
                    value={simSelectedDish}
                    onChange={(e) => setSimSelectedDish(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs"
                  >
                    {recipes.map((r) => (
                      <option key={r.dishId} value={r.dishName}>
                        {r.dishName} ({r.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 text-xs">Quantity Ordered (Plates)</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 4, 8].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setSimPortionsCount(qty)}
                        className={`px-3 py-2 rounded-xl font-black text-xs transition ${
                          simPortionsCount === qty
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {qty}x
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      value={simPortionsCount}
                      onChange={(e) => setSimPortionsCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-center text-white font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-1.5"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Deduct Raw Ingredients (Live Order)</span>
                  </button>
                </div>
              </div>

              {/* Recipe breakdown for selected dish */}
              {(() => {
                const rec = recipes.find((r) => r.dishName.toLowerCase() === simSelectedDish.toLowerCase());
                if (!rec) return null;
                const cap = getDishCapacity(simSelectedDish);

                return (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">
                        Recipe Consumption per portion ({rec.dishName}):
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${cap.badgeColor}`}>
                        ~{cap.portionsLeft} Portions Currently Possible
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                      {rec.ingredients.map((ing, idx) => {
                        const raw = items.find((it) => it.id === ing.rawItemId || it.name.toLowerCase().includes(ing.rawItemName.toLowerCase()));
                        const totalDeduct = ing.qtyPerPortion * simPortionsCount;
                        const remainingAfter = raw ? Math.max(0, raw.currentStock - totalDeduct) : 0;

                        return (
                          <div key={idx} className="p-2 bg-slate-900 rounded-lg border border-slate-800/80 space-y-0.5">
                            <div className="font-semibold text-slate-300 truncate">{ing.rawItemName}</div>
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>Will Deduct:</span>
                              <span className="font-mono font-bold text-rose-400">-{totalDeduct.toFixed(2)} {ing.unit}</span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>In-Hand Stock:</span>
                              <span className="font-mono text-white">{raw?.currentStock.toFixed(2)} {ing.unit}</span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                              <span>After Order:</span>
                              <span className={`font-mono font-black ${remainingAfter < (raw?.minimumThreshold || 0) ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {remainingAfter.toFixed(2)} {ing.unit}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </form>

            {/* Recent Simulation Depletion Feed */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <History className="w-4 h-4 text-blue-400" />
                <span>Recent Live Order Depletion History</span>
              </div>

              <div className="space-y-1.5">
                {simRecentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300"
                  >
                    <span className="font-medium">{evt.text}</span>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{evt.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. TAB: SMART NEXT-DAY RESTOCK & DISH RECIPE BOM              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'RESTOCK_BOM' && (
        <div className="space-y-5">
          {/* Top Recommendation Summary & 1-Click WhatsApp Export */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black text-white">
                      Next-Day Morning Mandi & Procurement Restock Engine
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Predictive Demand
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Calculated automatically from today's live dish orders sold + recipe portion BOMs against current shelf stocks.
                  </p>
                </div>
              </div>

              {/* Demand Forecast Multiplier Controls */}
              <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs shrink-0">
                <span className="text-slate-400 font-bold px-2">Tomorrow's Forecast:</span>
                {[
                  { label: 'Normal (1.0x)', val: 1.0 },
                  { label: 'Busy (1.2x)', val: 1.2 },
                  { label: 'Weekend Rush (1.5x)', val: 1.5 },
                  { label: 'Party / Event (2.0x)', val: 2.0 }
                ].map((f) => (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setDemandForecastMultiplier(f.val)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      demandForecastMultiplier === f.val
                        ? 'bg-amber-500 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Summary Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
              <div>
                <div className="text-xs font-bold text-amber-300">
                  ⚡ Suggested Procurement for Tomorrow Morning (07:00 AM):
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  <span className="font-bold text-white">{urgentRestockItems.length} Ingredients</span> require replenishment • Estimated Mandi Bill: <span className="font-mono font-black text-amber-400">₹{totalTomorrowRestockBudget.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyMandiPO}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
                >
                  {copiedMandiPO ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <span>{copiedMandiPO ? 'Copied WhatsApp PO!' : 'Export Mandi WhatsApp PO'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    printMandiProcurementSlip({
                      dateStr: new Date(Date.now() + 86400000).toLocaleDateString('en-IN', { dateStyle: 'full' }),
                      restaurantName: 'THE PUNJAB HERITAGE',
                      items: urgentRestockItems.map((i) => ({
                        name: i.name,
                        orderQty: i.recommendedOrderQty,
                        unit: i.unit,
                        shelfBalance: i.currentStock,
                        costPerUnit: i.costPerUnit,
                        estimatedCost: i.estimatedCost
                      })),
                      totalEstimatedCost: totalTomorrowRestockBudget
                    });
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Mandi Thermal Slip (80mm)</span>
                </button>
              </div>
            </div>

            {/* Restock Recommendations Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Raw Ingredient</th>
                    <th className="px-4 py-3">Current Shelf Balance</th>
                    <th className="px-4 py-3">Today's Consumption</th>
                    <th className="px-4 py-3">Projected Tomorrow Need</th>
                    <th className="px-4 py-3">Safety Min</th>
                    <th className="px-4 py-3">Recommended Restock</th>
                    <th className="px-4 py-3">Estimated Cost</th>
                    <th className="px-4 py-3">Preferred Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {nextDayProcurementPlan.map((item) => (
                    <tr
                      key={item.id}
                      className={`transition ${
                        item.urgency === 'CRITICAL'
                          ? 'bg-rose-950/20 hover:bg-rose-950/30'
                          : item.urgency === 'RECOMMENDED'
                          ? 'bg-amber-950/10 hover:bg-amber-950/20'
                          : 'hover:bg-slate-900/60 opacity-80'
                      }`}
                    >
                      <td className="px-4 py-3.5 font-bold text-white flex items-center space-x-2">
                        <Package className="w-4 h-4 text-orange-400 shrink-0" />
                        <span>{item.name}</span>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold">
                        <span className={item.currentStock <= item.minimumThreshold ? 'text-rose-400 font-black' : 'text-white'}>
                          {item.currentStock.toFixed(1)} {item.unit}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-amber-400 font-bold">
                        {item.consumedToday > 0 ? `-${item.consumedToday.toFixed(1)} ${item.unit}` : '0.0'}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {item.projectedTomorrowDemand.toFixed(1)} {item.unit}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-500">
                        {item.minimumThreshold.toFixed(1)} {item.unit}
                      </td>

                      <td className="px-4 py-3.5 font-mono">
                        {item.recommendedOrderQty > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-sm text-emerald-400">
                              +{item.recommendedOrderQty.toFixed(1)} {item.unit}
                            </span>
                            {item.urgency === 'CRITICAL' && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-black border border-rose-500/30">
                                URGENT
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-semibold">✓ Sufficient Stock</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-white">
                        {item.recommendedOrderQty > 0 ? `₹${item.estimatedCost.toFixed(0)}` : '₹0'}
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        <div className="font-semibold text-xs">{item.supplier}</div>
                        {item.supplierContact && (
                          <div className="text-[10px] text-slate-500 font-mono">{item.supplierContact}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dish Recipe BOM Matrix */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <UtensilsCrossed className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="text-sm font-black text-white">Dish Recipe Bill of Materials (BOM) & Portions Left</h3>
                  <p className="text-xs text-slate-400">Exact raw ingredients consumed per portion for automatic kitchen stock depletion.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.map((dish) => {
                const cap = getDishCapacity(dish.dishName);
                return (
                  <div key={dish.dishId} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-xs">{dish.dishName}</h4>
                        <span className="text-[10px] text-slate-400">{dish.category} • Portion Food Cost: ₹{dish.portionCost.toFixed(0)}</span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-xl font-mono font-black text-xs border ${cap.badgeColor}`}>
                        ~{cap.portionsLeft} Portions Left
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Raw Ingredients Consumed Per Portion:</div>
                      <div className="space-y-1">
                        {dish.ingredients.map((ing, iIdx) => (
                          <div key={iIdx} className="flex justify-between text-xs text-slate-300">
                            <span>{ing.rawItemName}</span>
                            <span className="font-mono font-bold text-white">
                              {ing.qtyPerPortion} {ing.unit} / plate
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. TAB: RAW INGREDIENTS LEDGER                                */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'REGISTER' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search raw ingredients by name, supplier, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
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

            {/* Storage Filter */}
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold shrink-0">
              <select
                value={storageFilter}
                onChange={(e) => setStorageFilter(e.target.value)}
                className="bg-transparent text-slate-300 font-bold px-2 py-1 focus:outline-none text-xs"
              >
                <option value="ALL">All Storage Locations</option>
                {storageLocationsList.filter((s) => s !== 'ALL').map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold shrink-0">
              {(['ALL', 'LOW_STOCK', 'HEALTHY'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg transition ${
                    statusFilter === st
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'LOW_STOCK' ? 'Low Stock' : 'Healthy'}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  categoryFilter === cat
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Ingredient & Storage Location</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">In-Stock Balance</th>
                  <th className="px-4 py-3">Safety Min</th>
                  <th className="px-4 py-3">Latest Rate</th>
                  <th className="px-4 py-3">Valuation</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.map((item) => {
                  const isLow = item.currentStock <= item.minimumThreshold;
                  const valuation = item.currentStock * item.costPerUnit;

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white flex items-center space-x-2">
                          <Package className="w-4 h-4 text-orange-400 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          📍 {item.storageLocation}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 font-medium">
                        {item.category}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span className={`font-black font-mono text-sm ${isLow ? 'text-rose-400' : 'text-white'}`}>
                            {item.currentStock.toFixed(1)} {item.unit}
                          </span>
                          {isLow && (
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-extrabold border border-rose-500/30 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> REORDER
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 font-mono">
                        {item.minimumThreshold.toFixed(1)} {item.unit}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-200">
                        <div className="flex items-center space-x-1">
                          <span>₹{item.costPerUnit.toFixed(2)}</span>
                          {item.priceTrend === 'UP' && <span className="text-[9px] text-rose-400 font-bold">▲</span>}
                          {item.priceTrend === 'DOWN' && <span className="text-[9px] text-emerald-400 font-bold">▼</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">
                        ₹{valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        <div className="font-semibold flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{item.supplier}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setInwardItemId(item.id);
                              setInwardRate(String(item.costPerUnit));
                              setInwardSupplier(item.supplier);
                              setShowInwardModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] transition"
                            title="Record Inward"
                          >
                            + Inward
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setWasteItemId(item.id);
                              setShowWastageModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-bold text-[10px] transition"
                            title="Record Wastage"
                          >
                            - Waste
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. TAB: MASTER GRAVIES & SEMI-FINISHED KITCHEN PREP           */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'GRAVY_PREP' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-black text-white">Master Gravies & Kitchen Prep Batches</h2>
              <p className="text-xs text-slate-400">
                Track pre-cooked mother gravies (Makhani, Bhuna Masala, Shahi White, Tikka Marinations). Cooking a batch automatically deducts raw onions, tomatoes, butter, and cashews!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gravyBatches.map((gravy) => (
              <div
                key={gravy.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-xs leading-snug">{gravy.name}</h3>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        📍 {gravy.storageLocation} • {gravy.shelfLifeHours}h Shelf Life
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 font-mono font-black text-xs shrink-0 border border-amber-500/30">
                    {gravy.inStockQuantity.toFixed(1)} {gravy.unit} In Hand
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Base Recipe Consumption (Per {gravy.yieldQuantity} {gravy.unit} Batch):
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                    {gravy.rawRecipeIngredients.map((r, rIdx) => (
                      <div key={rIdx} className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="truncate">{r.itemName}:</span>
                        <span className="font-mono font-bold text-white">{r.requiredQty} {r.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">
                    Last prepped: {gravy.preppedAt}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGravy(gravy);
                      setCookBatchMultiplier(1);
                      setShowCookGravyModal(true);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md shadow-amber-600/20"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Cook +{gravy.yieldQuantity} {gravy.unit} Batch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. TAB: GOODS INWARD (GRN & PROCUREMENT BILLS)                */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'MANDI_INWARD' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-black text-white">Goods Inward Register (GRN & Mandi Delivery)</h2>
              <p className="text-xs text-slate-400">Digital ledger of supplier bills, delivery challans, cash/credit procurement receipts.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setInwardItemId(items[0]?.id || '');
                setInwardRate(String(items[0]?.costPerUnit || ''));
                setShowInwardModal(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Record Inward GRN</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">GRN # & Date</th>
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Quantity Received</th>
                  <th className="px-4 py-3">Purchase Rate</th>
                  <th className="px-4 py-3">Total Inward Bill</th>
                  <th className="px-4 py-3">Payment Mode</th>
                  <th className="px-4 py-3">Supplier & Invoice #</th>
                  <th className="px-4 py-3">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {inwardLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-white">{log.id.toUpperCase()}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{log.date}</div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-white">
                      {log.itemName}
                      {log.notes && (
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{log.notes}</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-black text-emerald-400 text-sm">
                      +{log.quantity.toFixed(1)} {log.unit}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      ₹{log.costPerUnit.toFixed(2)}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-white">
                      ₹{log.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          log.paymentMode === 'VENDOR_CREDIT'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {log.paymentMode === 'VENDOR_CREDIT' ? 'Khata (Credit)' : log.paymentMode}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">{log.supplier}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.invoiceNumber}</div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400">
                      {log.receivedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. TAB: KITCHEN SCRAP & WASTAGE LOGBOOK                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'WASTAGE' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-black text-white">Kitchen Scrap & Wastage Logbook</h2>
              <p className="text-xs text-slate-400">Record spoiled items, kitchen preparation trimmings, spills, and calculate financial cost loss.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setWasteItemId(items[0]?.id || '');
                setShowWastageModal(true);
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Log Scrap / Wastage</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Log # & Time</th>
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Wasted Quantity</th>
                  <th className="px-4 py-3">Wastage Reason</th>
                  <th className="px-4 py-3">Financial Loss (₹)</th>
                  <th className="px-4 py-3">Recorded By</th>
                  <th className="px-4 py-3">Chef Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {wastageLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-white">{log.id.toUpperCase()}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{log.date}</div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-white">
                      {log.itemName}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-black text-rose-400 text-sm">
                      -{log.quantity.toFixed(1)} {log.unit}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        {log.reason.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono font-black text-rose-400">
                      ₹{log.financialLoss.toFixed(2)}
                    </td>

                    <td className="px-4 py-3.5 text-slate-300">
                      {log.recordedBy}
                    </td>

                    <td className="px-4 py-3.5 text-slate-400">
                      {log.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. TAB: PHYSICAL STOCK AUDIT & VARIANCE RECONCILIATION       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'AUDIT' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-black text-white">Physical Closing Stock Audit Sheet</h2>
              <p className="text-xs text-slate-400">Enter shelf physical counts to calculate shrinkage variance and reconcile book balances.</p>
            </div>

            <button
              type="button"
              onClick={handleReconcileAllAudit}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-purple-600/20"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Reconcile Counted Stock</span>
            </button>
          </div>

          {auditSuccessMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{auditSuccessMsg}</span>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Storage Location</th>
                  <th className="px-4 py-3">System Book Stock</th>
                  <th className="px-4 py-3">Physical Shelf Count</th>
                  <th className="px-4 py-3">Quantity Variance</th>
                  <th className="px-4 py-3">Cost Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {items.map((item) => {
                  const physicalInput = auditCounts[item.id];
                  const hasInput = physicalInput !== undefined && !isNaN(physicalInput);
                  const varianceQty = hasInput ? physicalInput - item.currentStock : 0;
                  const varianceCost = varianceQty * item.costPerUnit;

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition">
                      <td className="px-4 py-3.5 font-bold text-white">
                        {item.name}
                      </td>

                      <td className="px-4 py-3.5 text-slate-400">
                        {item.storageLocation}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-white">
                        {item.currentStock.toFixed(1)} {item.unit}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            step="0.1"
                            placeholder={item.currentStock.toFixed(1)}
                            value={auditCounts[item.id] !== undefined ? auditCounts[item.id] : ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setAuditCounts((prev) => ({
                                ...prev,
                                [item.id]: isNaN(val) ? (undefined as any) : val
                              }));
                            }}
                            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-500"
                          />
                          <span className="text-[11px] text-slate-400">{item.unit}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold">
                        {!hasInput ? (
                          <span className="text-slate-500">—</span>
                        ) : varianceQty === 0 ? (
                          <span className="text-emerald-400">0.0 (Matched)</span>
                        ) : varianceQty > 0 ? (
                          <span className="text-blue-400">+{varianceQty.toFixed(1)} (Surplus)</span>
                        ) : (
                          <span className="text-rose-400">{varianceQty.toFixed(1)} (Shrinkage)</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold">
                        {!hasInput ? (
                          <span className="text-slate-500">—</span>
                        ) : varianceCost === 0 ? (
                          <span className="text-emerald-400">₹0.00</span>
                        ) : varianceCost > 0 ? (
                          <span className="text-blue-400">+₹{varianceCost.toFixed(2)}</span>
                        ) : (
                          <span className="text-rose-400">-₹{Math.abs(varianceCost).toFixed(2)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. TAB: VENDOR KHATA & PURCHASE ORDERS                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'VENDORS' && (
        <div className="space-y-5">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">Vendor Directory & Khata Ledger</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {vendors.map((ven) => (
                <div key={ven.id} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white">{ven.name}</h4>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                      {ven.category}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-slate-200">{ven.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{ven.email}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      GSTIN: {ven.gstin}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Khata Due Balance:</div>
                      <div className="font-mono font-black text-sm text-purple-300 mt-0.5">
                        ₹{ven.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVendor(ven);
                        setPayAmount(String(ven.outstandingBalance || ''));
                        setShowVendorPayModal(true);
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-sm"
                    >
                      Pay Khata
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 10. COOK GRAVY BATCH MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      {showCookGravyModal && selectedGravy && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Cook Gravy Batch</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCookGravyModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteGravyBatchCook} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                <div className="font-bold text-white">{selectedGravy.name}</div>
                <div className="text-slate-400 text-[11px]">
                  Standard batch yield: {selectedGravy.yieldQuantity} {selectedGravy.unit}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Batch Multiplier</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((mul) => (
                    <button
                      key={mul}
                      type="button"
                      onClick={() => setCookBatchMultiplier(mul)}
                      className={`py-2 rounded-xl font-black text-xs transition ${
                        cookBatchMultiplier === mul
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {mul}x ({selectedGravy.yieldQuantity * mul} {selectedGravy.unit})
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCookGravyModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-600/20"
                >
                  Cook & Deduct Raw Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 11. PAY VENDOR KHATA MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      {showVendorPayModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <IndianRupee className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Record Vendor Khata Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVendorPayModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordVendorPayment} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1">
                <div className="font-bold text-white">{selectedVendor.name}</div>
                <div className="text-slate-400 text-[11px]">
                  Current Outstanding Due: <span className="font-mono font-black text-purple-300">₹{selectedVendor.outstandingBalance.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  step="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'CASH', 'BANK'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMode(m)}
                      className={`py-2 rounded-xl font-bold text-xs transition ${
                        payMode === m
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {m === 'UPI' ? '📱 UPI' : m === 'CASH' ? '💵 Cash' : '🏦 Bank NEFT'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVendorPayModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20"
                >
                  Confirm Khata Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 12. GOODS INWARD (GRN) MODAL                                  */}
      {/* ------------------------------------------------------------- */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Record Goods Inward (GRN)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInward} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Raw Ingredient</label>
                <select
                  value={inwardItemId}
                  onChange={(e) => {
                    setInwardItemId(e.target.value);
                    const it = items.find((i) => i.id === e.target.value);
                    if (it) {
                      setInwardRate(String(it.costPerUnit));
                      setInwardSupplier(it.supplier);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit}) — Current: {i.currentStock.toFixed(1)} {i.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Received Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 10.0"
                    value={inwardQty}
                    onChange={(e) => setInwardQty(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Purchase Rate (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={inwardRate}
                    onChange={(e) => setInwardRate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="Amul / APMC / Metro"
                    value={inwardSupplier}
                    onChange={(e) => setInwardSupplier(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Invoice / Bill #</label>
                  <input
                    type="text"
                    placeholder="INV-99201"
                    value={inwardInvoice}
                    onChange={(e) => setInwardInvoice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInwardPayMode('VENDOR_CREDIT')}
                    className={`py-2 rounded-xl font-bold text-xs transition ${
                      inwardPayMode === 'VENDOR_CREDIT'
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Vendor Credit (Khata)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInwardPayMode('CASH_DRAWER')}
                    className={`py-2 rounded-xl font-bold text-xs transition ${
                      inwardPayMode === 'CASH_DRAWER'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Cash Paid on Delivery
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20"
                >
                  Confirm Inward Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 13. LOG WASTAGE MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      {showWastageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Record Kitchen Wastage / Scrap</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWastageModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWastage} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Wasted Item</label>
                <select
                  value={wasteItemId}
                  onChange={(e) => setWasteItemId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit}) — Current: {i.currentStock.toFixed(1)} {i.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Wasted Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 1.5"
                    value={wasteQty}
                    onChange={(e) => setWasteQty(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Wastage Reason</label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value="EXPIRED">Expired / Spoiled</option>
                    <option value="BURNT_SPILL">Burnt / Kitchen Spill</option>
                    <option value="PREP_TRIMMING">Preparation Trimmings</option>
                    <option value="QUALITY_REJECTED">Quality Rejection</option>
                    <option value="CUSTOMER_RETURN">Customer Return</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Recorded By (Chef Name)</label>
                <input
                  type="text"
                  value={wasteChefName}
                  onChange={(e) => setWasteChefName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Incident Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Deep freezer cooling dropped overnight"
                  value={wasteNotes}
                  onChange={(e) => setWasteNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowWastageModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/20"
                >
                  Submit Wastage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 14. ADD NEW RAW INGREDIENT MODAL                              */}
      {/* ------------------------------------------------------------- */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Add New Raw Ingredient</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Ingredient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Malai Paneer, Basmati Rice"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value="Dairy & Cheese">Dairy & Cheese</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Vegetables & Produce">Vegetables & Produce</option>
                    <option value="Grains & Flour">Grains & Flour</option>
                    <option value="Spices & Seasonings">Spices & Seasonings</option>
                    <option value="Oils & Fats">Oils & Fats</option>
                    <option value="Beverages & Bar">Beverages & Bar</option>
                    <option value="Packaging & Disposables">Packaging & Disposables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="L">L (Litres)</option>
                    <option value="mL">mL (Millilitres)</option>
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="packs">packs (Packets)</option>
                    <option value="tins">tins (Tins)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Opening Stock</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="10.0"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Reorder Alert Min</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="5.0"
                    value={newItemMin}
                    onChange={(e) => setNewItemMin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Cost / Unit (₹)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="250"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Primary Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. Amul / APMC Market"
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Storage Location</label>
                  <select
                    value={newItemStorage}
                    onChange={(e) => setNewItemStorage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value="Cold Storage / Walk-in">Cold Storage / Walk-in</option>
                    <option value="Deep Freezer Unit">Deep Freezer Unit</option>
                    <option value="Dry Pantry Store Rack">Dry Pantry Store Rack</option>
                    <option value="Spice Storage Room">Spice Storage Room</option>
                    <option value="Produce Storage Bin">Produce Storage Bin</option>
                    <option value="Packaging Storage Rack">Packaging Storage Rack</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-500/20"
                >
                  Add Ingredient to Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
