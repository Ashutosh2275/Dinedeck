import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, TabKey } from './components/layout/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { KitchenKDS } from './pages/KitchenKDS';
import { ServiceCalls } from './pages/ServiceCalls';
import { TableManagement } from './pages/TableManagement';
import { MenuManagement } from './pages/MenuManagement';
import { BillingCashier } from './pages/BillingCashier';
import { StaffIAM } from './pages/StaffIAM';
import { OrderManagement } from './pages/OrderManagement';
import { Reservations } from './pages/Reservations';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { HelpSupport } from './pages/HelpSupport';
import { IncomingOrderModal } from './components/IncomingOrderModal';
import { DineDeckLoader } from './components/DineDeckLoader';

import { Order, ServiceCall, MenuCategory, TableItem, ShiftOverview } from './types';
import { api } from './services/api';
import { wsService } from './services/websocket';
import {
  LayoutDashboard,
  ChefHat,
  Bell,
  Grid,
  Receipt,
  PlusCircle,
  MenuSquare
} from 'lucide-react';

export const App: React.FC = () => {
  const { isLoggedIn, isLoading: authLoading, isInitializing, restaurant, user } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabKey>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Platform Data State
  const [overview, setOverview] = useState<ShiftOverview | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Incoming Order Pop-up Alert State
  const [incomingOrderAlert, setIncomingOrderAlert] = useState<Order | null>(null);

  const playOrderChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // audio autoplay policy fallback
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!restaurant?.id) return;
    setIsDataLoading(true);

    try {
      const [ovRes, ordRes, srvRes, menuRes, tblRes] = await Promise.all([
        api.fetchOverview(restaurant.id),
        api.fetchOrders(restaurant.id),
        api.fetchServiceCalls(restaurant.id),
        api.fetchMenu(restaurant.id),
        api.fetchTables(restaurant.id)
      ]);

      if (ovRes.success && ovRes.data) setOverview(ovRes.data);
      if (ordRes.success && ordRes.data) setOrders(ordRes.data);
      if (srvRes.success && srvRes.data) setServiceCalls(srvRes.data);
      if (menuRes.success && menuRes.data) setMenuCategories(menuRes.data);
      if (tblRes.success && tblRes.data) setTables(tblRes.data);
    } catch (err) {
      console.error('[PartnerWeb] Failed fetching dashboard data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    if (isLoggedIn && restaurant?.id) {
      fetchAllData();
    }
  }, [isLoggedIn, restaurant?.id, fetchAllData]);

  // Real-time WebSocket Event Dispatcher & Connection
  useEffect(() => {
    if (isLoggedIn && restaurant?.id) {
      wsService.connect({
        restaurantId: restaurant.id,
        userId: user?.id,
        role: user?.role
      });
    }

    // High-reliability 4-second background synchronization to ensure 100% data sync across all tabs & workstations
    const syncInterval = setInterval(() => {
      fetchAllData();
    }, 4000);

    const unsub = wsService.onMessage((msg) => {
      const { type, data } = msg;

      if ((type === 'ORDER_CREATED' || type === 'ORDER_PLACED') && data) {
        // Prepend to live orders list
        setOrders((prev) => [data, ...prev.filter((o) => o.id !== data.id)]);
        playOrderChime();
        setIncomingOrderAlert(data as Order);
        fetchAllData();
      } else if (
        (type === 'ORDER_STATUS_CHANGED' ||
          type === 'KDS_ORDER_ACCEPTED' ||
          type === 'KDS_ORDER_REJECTED' ||
          type === 'KDS_ORDER_REVERTED' ||
          type === 'ORDER_TIMEOUT') &&
        data
      ) {
        const targetStatus =
          data.status ||
          (type === 'KDS_ORDER_ACCEPTED'
            ? 'PREPARING'
            : (type === 'KDS_ORDER_REJECTED' || type === 'ORDER_TIMEOUT')
            ? 'REJECTED'
            : type === 'KDS_ORDER_REVERTED'
            ? 'PLACED'
            : undefined);

        setOrders((prev) =>
          prev.map((o) =>
            o.id === data.orderId || o.id === data.id
              ? { ...o, status: targetStatus || o.status }
              : o
          )
        );

        if (type === 'KDS_ORDER_REJECTED' || type === 'ORDER_TIMEOUT' || targetStatus === 'REJECTED') {
          setIncomingOrderAlert((current) => {
            if (current && (current.id === data.orderId || current.id === data.id)) {
              return null;
            }
            return current;
          });
        }

        fetchAllData();
      } else if (type === 'SERVICE_REQUEST_CREATED' && data) {
        setServiceCalls((prev) => [data, ...prev.filter((c) => c.id !== data.id)]);
      } else if (type === 'SERVICE_REQUEST_RESOLVED' && data) {
        setServiceCalls((prev) =>
          prev.map((c) =>
            c.id === data.serviceRequestId || c.id === data.id
              ? { ...c, status: data.status || 'COMPLETED' }
              : c
          )
        );
      } else if (type === 'TABLE_STATUS_CHANGED' && data) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === data.tableId || t.tableNumber === data.tableNumber
              ? { ...t, isOccupied: data.isOccupied }
              : t
          )
        );
      } else if ((type === 'BILL_CREATED' || type === 'BILL_SETTLED' || type === 'BILL_VOIDED') && data) {
        fetchAllData();
      } else if (type === 'MENU_AVAILABILITY_CHANGED' && data) {
        setMenuCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: cat.items.map((item) =>
              item.id === data.itemId ? { ...item, isAvailable: data.isAvailable } : item
            )
          }))
        );
      }
    });

    return () => {
      clearInterval(syncInterval);
      unsub();
    };
  }, [isLoggedIn, restaurant?.id, user?.id, user?.role, playOrderChime, fetchAllData]);

  // Modal Handlers
  const handleAcceptIncomingOrder = async (orderId: string) => {
    if (!restaurant?.id) return;
    try {
      await api.acceptKdsOrder(orderId, restaurant.id);
      setIncomingOrderAlert(null);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept order');
    }
  };

  const handleRejectIncomingOrder = async (
    orderId: string,
    reason: string,
    reasonCode?: string,
    customReason?: string
  ) => {
    if (!restaurant?.id) return;
    try {
      await api.rejectKdsOrder(orderId, reason, restaurant.id, reasonCode, customReason);
      setIncomingOrderAlert(null);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject order');
    }
  };

  const handleOpenKdsFromAlert = () => {
    setIncomingOrderAlert(null);
    setCurrentTab('KITCHEN');
  };

  const handleToggleTableOccupancy = async (table: TableItem) => {
    try {
      await api.toggleTableOccupancy(table.id, !table.isOccupied);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update table status');
    }
  };

  if (isInitializing) {
    return (
      <DineDeckLoader
        fullScreen
        size="lg"
        label="Loading Partner Workspace..."
        sublabel="Connecting to your dining floor, kitchen display & billing terminal..."
        showWordmark
      />
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  const pendingServiceCalls = serviceCalls.filter((c) => (c.status || 'PENDING') === 'PENDING').length;
  const activeOrdersCount = orders.filter((o) => ['CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white antialiased transition-colors duration-150">
      {/* 1. Global Incoming Order Pop-up Alert */}
      <IncomingOrderModal
        order={incomingOrderAlert}
        onAccept={handleAcceptIncomingOrder}
        onReject={handleRejectIncomingOrder}
        onDismiss={() => setIncomingOrderAlert(null)}
        onOpenKds={handleOpenKdsFromAlert}
      />

      {/* 2. Fixed Top Navbar Header */}
      <Navbar
        activeServiceCallsCount={pendingServiceCalls}
        onRefresh={fetchAllData}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* 3. Main Workspace Container with fixed Sidebar and Scrollable Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          serviceCallsCount={pendingServiceCalls}
          ordersCount={activeOrdersCount}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 lg:p-8 bg-slate-100 dark:bg-[#0B0F19] transition-colors duration-150">
          {currentTab === 'DASHBOARD' && (
            <Dashboard
              overview={overview}
              orders={orders}
              serviceCalls={serviceCalls}
              tables={tables}
              categories={menuCategories}
              onToggleTableOccupancy={handleToggleTableOccupancy}
              onRefreshTables={fetchAllData}
              onOrderCreated={fetchAllData}
              onNavigateTab={(tab: TabKey) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'KITCHEN' && <KitchenKDS />}

          {currentTab === 'ORDERS' && (
            <OrderManagement
              categories={menuCategories}
              tables={tables}
              onOrderCreated={fetchAllData}
            />
          )}

          {currentTab === 'SERVICE_CALLS' && (
            <ServiceCalls
              serviceCalls={serviceCalls}
              onRefresh={fetchAllData}
            />
          )}

          {currentTab === 'TABLES' && (
            <TableManagement
              tables={tables}
              onRefresh={fetchAllData}
            />
          )}

          {currentTab === 'MENU' && (
            <MenuManagement
              categories={menuCategories}
              onRefresh={fetchAllData}
            />
          )}

          {currentTab === 'BILLING' && (
            <BillingCashier
              orders={orders}
              onRefresh={fetchAllData}
            />
          )}

          {currentTab === 'STAFF' && <StaffIAM />}

          {currentTab === 'RESERVATIONS' && <Reservations tables={tables} />}

          {currentTab === 'INVENTORY' && <Inventory />}

          {currentTab === 'REPORTS' && (
            <Reports
              overview={overview}
              orders={orders}
            />
          )}

          {currentTab === 'AUDIT' && <StaffIAM />}

          {currentTab === 'SETTINGS' && <Settings />}
          {currentTab === 'HELP' && <HelpSupport />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden bg-[#1E293B] border-t border-slate-800 px-4 py-2 flex items-center justify-around z-40">
        <button
          onClick={() => setCurrentTab('DASHBOARD')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            currentTab === 'DASHBOARD' ? 'text-orange-400 font-extrabold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setCurrentTab('KITCHEN')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition relative ${
            currentTab === 'KITCHEN' ? 'text-orange-400 font-extrabold' : 'text-slate-400'
          }`}
        >
          <ChefHat className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Kitchen</span>
          {activeOrdersCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">
              {activeOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('SERVICE_CALLS')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition relative ${
            currentTab === 'SERVICE_CALLS' ? 'text-orange-400 font-extrabold' : 'text-slate-400'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Calls</span>
          {pendingServiceCalls > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
              {pendingServiceCalls}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('TABLES')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            currentTab === 'TABLES' ? 'text-orange-400 font-extrabold' : 'text-slate-400'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Tables</span>
        </button>

        <button
          onClick={() => setCurrentTab('BILLING')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            currentTab === 'BILLING' ? 'text-orange-400 font-extrabold' : 'text-slate-400'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Cashier</span>
        </button>
      </div>
    </div>
  );
};
