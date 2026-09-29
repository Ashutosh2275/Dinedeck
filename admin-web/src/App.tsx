import React, { useState, useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminNavbar } from './components/AdminNavbar';
import { AdminSidebar, AdminTab } from './components/AdminSidebar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { adminWs } from './services/websocket';

// All 17 Domain Command Pages
import { AdminOverview } from './pages/AdminOverview';
import { AdminOperations } from './pages/AdminOperations';
import { AdminOrders } from './pages/AdminOrders';
import { AdminRestaurants } from './pages/AdminRestaurants';
import { AdminApprovals } from './pages/AdminApprovals';
import { AdminFinance } from './pages/AdminFinance';
import { AdminReconciliation } from './pages/AdminReconciliation';
import { AdminCompliance } from './pages/AdminCompliance';
import { AdminRisk } from './pages/AdminRisk';
import { AdminIAM } from './pages/AdminIAM';
import { AdminDevices } from './pages/AdminDevices';
import { AdminFeatureFlags } from './pages/AdminFeatureFlags';
import { AdminChangeManagement } from './pages/AdminChangeManagement';
import { AdminSupport } from './pages/AdminSupport';
import { AdminHealth } from './pages/AdminHealth';
import { AdminAudit } from './pages/AdminAudit';
import { AdminSettings } from './pages/AdminSettings';
import { AdminCustomerCMS } from './pages/AdminCustomerCMS';
import { AdminTenantDeepDive } from './pages/AdminTenantDeepDive';
import { AdminUserDatabase } from './pages/AdminUserDatabase';

import {
  LayoutDashboard,
  Building2,
  Activity,
  ShoppingBag,
  DollarSign,
  FileCheck,
  Lock,
  ArrowRight
} from 'lucide-react';

const AdminLogin: React.FC = () => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('superadmin@dinedeck.in');
  const [password, setPassword] = useState('SuperAdmin@2026');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const success = await login(email, password);
    setIsLoading(false);
    if (!success) {
      setError('Invalid SuperAdmin credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-4">
      <div className="bg-[#0E131F] border border-slate-800 rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-600/30">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-black text-white">DINEDECK Control Center</h2>
          <p className="text-xs text-slate-400">Platform Governance & Multi-Tenant SuperAdmin</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">SuperAdmin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold rounded-2xl text-xs transition shadow-lg shadow-cyan-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : 'Access Command Center'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminLayout: React.FC = () => {
  const { isLoggedIn, isLoading } = useAdminAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>('OVERVIEW');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [targetEntityId, setTargetEntityId] = useState<string | null>(null);

  // Global Keyboard Shortcut for Ctrl+K search and Realtime WebSocket Connection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (isLoggedIn) {
      adminWs.connect();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoggedIn]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold text-slate-300">Initializing Control Center...</div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AdminLogin />;
  }

  const navigateToTabWithEntity = (tab: AdminTab, entityId?: string) => {
    if (entityId) setTargetEntityId(entityId);
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white antialiased">
      <AdminNavbar
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setTargetEntityId(null);
            setCurrentTab(tab);
          }}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-4rem)] pb-20 lg:pb-6 custom-scrollbar">
          {currentTab === 'OVERVIEW' && <AdminOverview onNavigate={setCurrentTab} />}
          {currentTab === 'TENANT_SUITE' && <AdminTenantDeepDive />}
          {currentTab === 'USER_DATABASE' && <AdminUserDatabase />}
          {currentTab === 'CUSTOMER_CMS' && <AdminCustomerCMS />}
          {currentTab === 'OPERATIONS' && <AdminOperations />}
          {currentTab === 'ORDERS' && <AdminOrders />}
          {currentTab === 'RESTAURANTS' && <AdminRestaurants initialRestaurantId={targetEntityId} />}
          {currentTab === 'APPROVALS' && <AdminApprovals />}
          {currentTab === 'FINANCE' && <AdminFinance />}
          {currentTab === 'RECONCILIATION' && <AdminReconciliation />}
          {currentTab === 'COMPLIANCE' && <AdminCompliance />}
          {currentTab === 'RISK' && <AdminRisk onNavigateToRestaurant={(id) => navigateToTabWithEntity('RESTAURANTS', id)} />}
          {currentTab === 'IAM' && <AdminIAM />}
          {currentTab === 'DEVICES' && <AdminDevices />}
          {currentTab === 'FLAGS' && <AdminFeatureFlags />}
          {currentTab === 'CHANGES' && <AdminChangeManagement />}
          {currentTab === 'HEALTH' && <AdminHealth />}
          {currentTab === 'SUPPORT' && <AdminSupport />}
          {currentTab === 'AUDIT' && <AdminAudit />}
          {currentTab === 'SETTINGS' && <AdminSettings />}
        </main>
      </div>

      {/* Global Universal Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateToTab={navigateToTabWithEntity}
      />

      {/* Mobile Bottom Quick Navigation (lg:hidden) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0E131F]/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setCurrentTab('OVERVIEW')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            currentTab === 'OVERVIEW' ? 'text-cyan-400 font-extrabold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Overview</span>
        </button>

        <button
          onClick={() => setCurrentTab('ORDERS')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            currentTab === 'ORDERS' ? 'text-cyan-400 font-extrabold' : 'text-slate-400'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Orders</span>
        </button>

        <button
          onClick={() => setCurrentTab('OPERATIONS')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            currentTab === 'OPERATIONS' ? 'text-cyan-400 font-extrabold' : 'text-slate-400'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Live KDS</span>
        </button>

        <button
          onClick={() => setCurrentTab('RESTAURANTS')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            currentTab === 'RESTAURANTS' ? 'text-cyan-400 font-extrabold' : 'text-slate-400'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Merchants</span>
        </button>

        <button
          onClick={() => setCurrentTab('FINANCE')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            currentTab === 'FINANCE' ? 'text-cyan-400 font-extrabold' : 'text-slate-400'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Finance</span>
        </button>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AdminAuthProvider>
      <AdminLayout />
    </AdminAuthProvider>
  );
}

export default App;
