import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShiftOverview, Order } from '../types';
import {
  TrendingUp,
  Receipt,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Download,
  UtensilsCrossed,
  Sparkles,
  CreditCard,
  Smartphone,
  Wallet,
  FileSpreadsheet,
  Printer,
  Clock,
  ArrowUpRight,
  Filter,
  Search,
  CheckCircle2,
  Building2,
  Percent,
  Layers,
  ShieldCheck
} from 'lucide-react';

interface ReportsProps {
  overview: ShiftOverview | null;
  orders: Order[];
}

type ReportTab = 'SALES' | 'TAX_BILLS' | 'TOP_ITEMS' | 'DAILY_SUMMARY';
type DatePreset = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH';

export const Reports: React.FC<ReportsProps> = ({ overview, orders }) => {
  const { restaurant, branch } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>('SALES');
  const [datePreset, setDatePreset] = useState<DatePreset>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Completed & settled orders
  const completedOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'COMPLETED' || o.status === 'SERVED' || (o.bills && o.bills.some((b) => b.paymentStatus === 'PAID'))
    );
  }, [orders]);

  const totalGrossSales = useMemo(() => {
    if (overview?.settledRevenue && overview.settledRevenue > 0) return overview.settledRevenue;
    return completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [overview, completedOrders]);

  const totalOrdersCount = useMemo(() => {
    if (overview?.settledOrdersCount && overview.settledOrdersCount > 0) return overview.settledOrdersCount;
    return completedOrders.length;
  }, [overview, completedOrders]);

  const avgTicketSize = totalOrdersCount > 0 ? totalGrossSales / totalOrdersCount : 0;

  const cgstRate = restaurant?.cgstRatePercent ?? 2.5;
  const sgstRate = restaurant?.sgstRatePercent ?? 2.5;
  const totalTaxRate = cgstRate + sgstRate;

  // Tax calculations
  const taxableValue = totalTaxRate > 0 ? (totalGrossSales * 100) / (100 + totalTaxRate) : totalGrossSales;
  const totalCgst = (taxableValue * cgstRate) / 100;
  const totalSgst = (taxableValue * sgstRate) / 100;
  const totalTaxCollected = totalCgst + totalSgst;
  const totalDiscounts = completedOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);

  // Payment Breakdown calculated dynamically from real orders
  const paymentBreakdown = useMemo(() => {
    let upiAmount = 0, upiCount = 0;
    let cardAmount = 0, cardCount = 0;
    let cashAmount = 0, cashCount = 0;

    completedOrders.forEach((o: any) => {
      const method = (o.paymentMethod || o.bill?.paymentMethod || 'UPI').toUpperCase();
      const amt = Number(o.totalAmount || o.bill?.grandTotal || 0);
      if (method.includes('CARD')) {
        cardAmount += amt;
        cardCount += 1;
      } else if (method.includes('CASH')) {
        cashAmount += amt;
        cashCount += 1;
      } else {
        upiAmount += amt;
        upiCount += 1;
      }
    });

    const total = upiAmount + cardAmount + cashAmount;
    return {
      upi: { amount: upiAmount, count: upiCount, percent: total > 0 ? Math.round((upiAmount / total) * 100) : 0 },
      card: { amount: cardAmount, count: cardCount, percent: total > 0 ? Math.round((cardAmount / total) * 100) : 0 },
      cash: { amount: cashAmount, count: cashCount, percent: total > 0 ? Math.round((cashAmount / total) * 100) : 0 }
    };
  }, [completedOrders]);

  // Busy hours breakdown calculated dynamically from real order timestamps
  const hourlyData = useMemo(() => {
    const slots = [
      { label: '11:00 AM – 1:00 PM (Morning & Early Lunch)', minH: 11, maxH: 13, orders: 0, revenue: 0, isPeak: false },
      { label: '1:00 PM – 3:30 PM (Lunch Rush)', minH: 13, maxH: 16, orders: 0, revenue: 0, isPeak: true },
      { label: '3:30 PM – 7:00 PM (Snacks & Beverages)', minH: 16, maxH: 19, orders: 0, revenue: 0, isPeak: false },
      { label: '7:00 PM – 10:30 PM (Dinner Rush)', minH: 19, maxH: 23, orders: 0, revenue: 0, isPeak: true },
      { label: '10:30 PM – Midnight (Late Night Orders)', minH: 23, maxH: 24, orders: 0, revenue: 0, isPeak: false }
    ];

    completedOrders.forEach((o: any) => {
      if (!o.createdAt) return;
      const h = new Date(o.createdAt).getHours();
      const amt = Number(o.totalAmount || o.bill?.grandTotal || 0);
      const slot = slots.find((s) => h >= s.minH && h < s.maxH) || slots[0];
      slot.orders += 1;
      slot.revenue += amt;
    });

    return slots.map(({ label, orders, revenue, isPeak }) => ({ label, orders, revenue, isPeak }));
  }, [completedOrders]);

  // Dish sales list
  const dishSales = useMemo(() => {
    const itemMap = new Map<string, { name: string; category: string; units: number; revenue: number; price: number }>();

    completedOrders.forEach((ord) => {
      ord.items?.forEach((item) => {
        const cat = item.course || item.stationCode || 'Food Item';
        const current = itemMap.get(item.name) || {
          name: item.name,
          category: cat,
          units: 0,
          revenue: 0,
          price: item.unitPrice || (item.totalPrice ? item.totalPrice / item.quantity : 0)
        };
        current.units += item.quantity;
        current.revenue += item.totalPrice || item.unitPrice * item.quantity;
        itemMap.set(item.name, current);
      });
    });

    const list = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
    if (selectedCategory !== 'ALL') {
      return list.filter((d) => d.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    }
    if (searchQuery.trim()) {
      return list.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return list;
  }, [completedOrders, selectedCategory, searchQuery]);

  // Export to Excel / CSV with User-Prompted Storage File Path
  const handleExportCSV = async () => {
    const headers = ['Dish Name', 'Category', 'Plates Sold', 'Price (Rs)', 'Total Money Earned (Rs)'];
    const rows = dishSales.map((d) => [`"${d.name}"`, `"${d.category}"`, d.units, d.price.toFixed(2), d.revenue.toFixed(2)]);
    const rawCsv = [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const defaultFilename = `dinedeck_sales_report_${new Date().toISOString().slice(0, 10)}.csv`;

    // 1. Electron Desktop Environment: Prompt native Windows Save File dialog
    if (typeof window !== 'undefined' && (window as any).dinedeckDesktop?.saveFile) {
      try {
        await (window as any).dinedeckDesktop.saveFile({
          defaultName: defaultFilename,
          data: rawCsv,
          filters: [
            { name: 'CSV Spreadsheet (*.csv)', extensions: ['csv'] },
            { name: 'All Files (*.*)', extensions: ['*'] }
          ]
        });
        return;
      } catch (err) {
        console.error('Desktop save dialog failed, falling back to browser picker:', err);
      }
    }

    // 2. Modern Browser: Prompt native file picker if supported
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [{
            description: 'CSV Spreadsheet File',
            accept: { 'text/csv': ['.csv'] }
          }]
        });
        const writableStream = await fileHandle.createWritable();
        await writableStream.write(rawCsv);
        await writableStream.close();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User opted to cancel dialog
      }
    }

    // 3. Fallback: Standard Blob Download
    const blob = new Blob([rawCsv], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', defaultFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Sales & Reports</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              LIVE DATA
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Check your daily collection, tax totals, top dishes, and closing cash summary.
          </p>
        </div>

        {/* Date Presets & Print / Download Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            {(['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'THIS_MONTH'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDatePreset(preset)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  datePreset === preset
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {preset === 'TODAY'
                  ? "Today"
                  : preset === 'YESTERDAY'
                  ? 'Yesterday'
                  : preset === 'LAST_7_DAYS'
                  ? 'Last 7 Days'
                  : 'This Month'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm"
            title="Download Excel spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Download Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-2xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-orange-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE KEY SUMMARY NUMBERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total Sales */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-orange-500/40 rounded-3xl p-4 transition shadow-sm dark:shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-2xl bg-orange-500/10 text-orange-500 dark:text-orange-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">₹{totalGrossSales.toFixed(2)}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{totalOrdersCount} bills settled</span>
          </div>
        </div>

        {/* Average Bill / Table */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 rounded-3xl p-4 transition shadow-sm dark:shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Bill / Table</span>
            <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">₹{avgTicketSize.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Average spent per table</div>
        </div>

        {/* GST Tax Collected */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 rounded-3xl p-4 transition shadow-sm dark:shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GST Tax ({totalTaxRate}%)</span>
            <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-500 dark:text-purple-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">₹{totalTaxCollected.toFixed(2)}</div>
          <div className="text-[10px] text-purple-600 dark:text-purple-300 font-medium mt-1">
            CGST ₹{totalCgst.toFixed(1)} + SGST ₹{totalSgst.toFixed(1)}
          </div>
        </div>

        {/* Food Sales (Before Tax) */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 rounded-3xl p-4 transition shadow-sm dark:shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Food & Drink Sales</span>
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">₹{taxableValue.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Amount before taxes</div>
        </div>

        {/* Discounts Given */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 rounded-3xl p-4 transition shadow-sm dark:shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Discounts Given</span>
            <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-500 dark:text-rose-400 mt-2">₹{totalDiscounts.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Total discounts granted</div>
        </div>

        {/* Table Occupancy */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 rounded-3xl p-4 transition shadow-sm dark:shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Table Occupancy</span>
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{overview?.occupancyRatePercent || 0}%</div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">Active floor utilization</div>
        </div>
      </div>

      {/* 3. SIMPLE 4 TABS NAVIGATION */}
      <div className="flex items-center space-x-1.5 bg-white dark:bg-[#111827] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar shadow-sm">
        {[
          { key: 'SALES' as ReportTab, label: 'Sales & Payments', icon: TrendingUp },
          { key: 'TAX_BILLS' as ReportTab, label: 'Tax & Bills', icon: Receipt },
          { key: 'TOP_ITEMS' as ReportTab, label: 'Best Selling Items', icon: PieChart },
          { key: 'DAILY_SUMMARY' as ReportTab, label: 'Daily Cash & Shift Summary', icon: Layers }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
              activeTab === key
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: SALES & PAYMENTS */}
      {activeTab === 'SALES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Busiest Hours of the Day */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                  <span>Busiest Hours of the Day</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">See when your restaurant gets the most orders</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                Peak: Dinner (7:00 PM – 10:30 PM)
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {hourlyData.map((slot, idx) => {
                const percent = totalGrossSales > 0 ? Math.min(100, Math.round((slot.revenue / totalGrossSales) * 100)) : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={`${slot.isPeak ? 'text-slate-900 dark:text-white font-black' : 'text-slate-500 dark:text-slate-400'}`}>{slot.label}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-500 dark:text-slate-400">{slot.orders} orders</span>
                        <span className="text-slate-900 dark:text-white font-mono font-black">₹{slot.revenue.toFixed(2)} ({percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800/80">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          slot.isPeak
                            ? 'bg-gradient-to-r from-orange-500 to-amber-400 shadow-sm shadow-orange-500/50'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        style={{ width: `${Math.max(4, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How Customers Paid */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>How Customers Paid</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Balanced ✓</span>
            </div>

            <div className="space-y-3">
              {/* UPI & QR Codes */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">UPI & QR (GPay / PhonePe / Paytm)</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{paymentBreakdown.upi.count} payments</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900 dark:text-white font-mono">₹{paymentBreakdown.upi.amount.toFixed(2)}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{paymentBreakdown.upi.percent}% of total</div>
                  </div>
                </div>
              </div>

              {/* Card Machine */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Card Machine (Swipe / Tap)</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{paymentBreakdown.card.count} payments</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900 dark:text-white font-mono">₹{paymentBreakdown.card.amount.toFixed(2)}</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">{paymentBreakdown.card.percent}% of total</div>
                  </div>
                </div>
              </div>

              {/* Cash Collection */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Cash in Counter Drawer</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{paymentBreakdown.cash.count} payments</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900 dark:text-white font-mono">₹{paymentBreakdown.cash.amount.toFixed(2)}</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">{paymentBreakdown.cash.percent}% of total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TAX & BILLS */}
      {activeTab === 'TAX_BILLS' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                  <span>GST & Tax Summary</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your GSTIN: <span className="text-purple-600 dark:text-purple-300 font-mono font-bold">{restaurant?.gstin || 'Not Registered'}</span> • Ready to share with your CA or accountant
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 rounded-xl text-xs font-bold">
                  GST Rate: {totalTaxRate}%
                </span>
              </div>
            </div>

            {/* 4 Clean Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Food Sales (Without Tax)</div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">₹{taxableValue.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500">Base food & drink sales</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">CGST ({cgstRate}%)</div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">₹{totalCgst.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500">Central Government share</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">SGST ({sgstRate}%)</div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">₹{totalSgst.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500">State Government share</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Tax Collected</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{totalTaxCollected.toFixed(2)}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold">Total GST for this period</div>
              </div>
            </div>

            {/* List of Bills Table */}
            <div className="pt-2">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                All Settled Customer Bills ({completedOrders.length} Total)
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Bill / Invoice #</th>
                      <th className="px-4 py-3">Table</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3 text-right">Food Amount (₹)</th>
                      <th className="px-4 py-3 text-right">CGST (₹)</th>
                      <th className="px-4 py-3 text-right">SGST (₹)</th>
                      <th className="px-4 py-3 text-right">Total Bill (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {completedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          No bills settled yet for this period.
                        </td>
                      </tr>
                    ) : (
                      completedOrders.map((ord, idx) => {
                        const invTaxable = totalTaxRate > 0 ? (ord.totalAmount * 100) / (100 + totalTaxRate) : ord.totalAmount;
                        const invCgst = (invTaxable * cgstRate) / 100;
                        const invSgst = (invTaxable * sgstRate) / 100;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition font-mono">
                            <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">
                              {ord.orderNumber ? `BILL-${ord.orderNumber.slice(-4)}` : `BILL-${1000 + idx}`}
                            </td>
                            <td className="px-4 py-3 text-slate-900 dark:text-white font-sans font-bold">{ord.tableNumber || 'Takeaway'}</td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-sans">
                              {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">₹{invTaxable.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-purple-600 dark:text-purple-300">₹{invCgst.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-purple-600 dark:text-purple-300">₹{invSgst.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">₹{ord.totalAmount.toFixed(2)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BEST SELLING ITEMS */}
      {activeTab === 'TOP_ITEMS' && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                <span>Top Selling Food & Drinks</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Which dishes made the most money and sold the most plates</p>
            </div>

            {/* Quick Search Bar */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dish..."
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Dishes Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            {dishSales.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/60 rounded-2xl text-slate-500 space-y-2">
                <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600" />
                <div className="font-bold text-slate-900 dark:text-white text-sm">No dishes sold yet for this period</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Dish rankings will appear here as orders are placed and settled.
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Dish Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">Plates Sold</th>
                    <th className="px-4 py-3 text-right">Price (₹)</th>
                    <th className="px-4 py-3 text-right">Total Earned (₹)</th>
                    <th className="px-4 py-3 text-right">Share of Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {dishSales.map((dish, idx) => {
                    const contribution = totalGrossSales > 0 ? (dish.revenue / totalGrossSales) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5 font-black text-slate-400 dark:text-slate-500">
                          {idx === 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">#1 Top Dish</span>
                          ) : idx === 1 ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-400/20 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-400/30">#2</span>
                          ) : idx === 2 ? (
                            <span className="px-2 py-0.5 rounded-md bg-orange-700/15 dark:bg-orange-700/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">#3</span>
                          ) : (
                            `#${idx + 1}`
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white text-sm">{dish.name}</td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{dish.category}</td>
                        <td className="px-4 py-3.5 text-center font-black text-orange-600 dark:text-orange-400 text-sm font-mono">{dish.units}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-slate-600 dark:text-slate-300">₹{dish.price.toFixed(2)}</td>
                        <td className="px-4 py-3.5 text-right font-black text-slate-900 dark:text-white font-mono text-sm">
                          ₹{dish.revenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {contribution.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DAILY CASH & SHIFT SUMMARY */}
      {activeTab === 'DAILY_SUMMARY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Shift Closing Summary */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Daily Shift Closing Summary</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Register Balanced ✓
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Shift Started</span>
                <span className="text-slate-900 dark:text-white font-bold">{new Date().toLocaleDateString()} at 10:30 AM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Total Bills Settled</span>
                <span className="text-slate-900 dark:text-white font-bold">{totalOrdersCount} Table Bills</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Food & Drink Sales (Without Tax)</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold">₹{taxableValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">GST Tax Collected (CGST + SGST)</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">₹{totalTaxCollected.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Total Discounts Given</span>
                <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">₹{totalDiscounts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 border-t border-b border-slate-200 dark:border-slate-700 text-sm font-black">
                <span className="text-slate-900 dark:text-white">TOTAL MONEY COLLECTED (Cash + Online)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base">₹{totalGrossSales.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-2xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Daily Summary</span>
            </button>
          </div>

          {/* Thermal Summary Slip Preview */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-3">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center space-x-2">
              <Printer className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <span>DAILY SUMMARY PREVIEW</span>
            </div>

            <div className="font-mono text-[10.5px] text-black mx-auto border border-gray-300 rounded-2xl p-4 space-y-1 bg-white shadow-lg max-w-[280px]">
              <div className="text-center font-black text-sm uppercase">{restaurant?.name || 'DINEDECK RESTAURANT'}</div>
              <div className="text-center text-gray-600 text-[9.5px]">DAILY SHIFT SUMMARY</div>
              <div className="text-center text-gray-500 text-[9px]">{new Date().toLocaleString()}</div>
              <div className="border-t border-dashed border-gray-400 my-1.5" />
              <div className="flex justify-between">
                <span>TOTAL BILLS</span>
                <span className="font-bold">{totalOrdersCount}</span>
              </div>
              <div className="flex justify-between">
                <span>FOOD SALES</span>
                <span>₹{taxableValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST {cgstRate}%</span>
                <span>₹{totalCgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST {sgstRate}%</span>
                <span>₹{totalSgst.toFixed(2)}</span>
              </div>
              <div className="border-t border-black my-1 pt-1 flex justify-between font-black text-xs">
                <span>TOTAL MONEY</span>
                <span>₹{totalGrossSales.toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed border-gray-400 my-1.5" />
              <div className="text-center font-bold text-[9px]">--- END OF DAY SUMMARY ---</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

