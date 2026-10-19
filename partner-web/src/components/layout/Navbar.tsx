import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UtensilsCrossed,
  Bell,
  RefreshCw,
  LogOut,
  Shield,
  Wifi,
  WifiOff,
  UserCheck,
  Menu,
  X,
  Trash2,
  Maximize2,
  Minimize2,
  Power
} from 'lucide-react';

interface NavbarProps {
  activeServiceCallsCount?: number;
  onRefresh?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeServiceCallsCount = 0,
  onRefresh,
  onToggleMobileMenu,
  isMobileMenuOpen = false
}) => {
  const { user, restaurant, branch, wsStatus, logout, assignedRoles } = useAuth();
  const primaryRole = assignedRoles.length > 0 ? assignedRoles[0] : 'STAFF';

  return (
    <header className="h-16 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Left Brand + Mobile Drawer Trigger */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white lg:hidden border border-slate-700 transition"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="font-black text-xs sm:text-sm text-white tracking-tight leading-tight truncate max-w-[140px] sm:max-w-[220px]">
                {restaurant?.name || 'DINEDECK Partner'}
              </h1>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                {primaryRole}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              {branch?.name || 'Bandra Flagship'}
            </div>
          </div>
        </div>
      </div>

      {/* Right Operational Controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Live Status Indicator */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
            wsStatus === 'CONNECTED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : wsStatus === 'RECONNECTING'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
          title={wsStatus === 'CONNECTED' ? 'Connection Status: Online' : `Connection Status: ${wsStatus}`}
        >
          {wsStatus === 'CONNECTED' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden xs:inline">Live Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{wsStatus}</span>
            </>
          )}
        </div>

        {/* Clean Reset to 0 Action */}
        <button
          onClick={() => {
            const confirmed = window.confirm('Are you sure you want to reset all live operational records (orders, bills, test data) to clean 0?');
            if (confirmed) {
              // Clear local state caches
              try {
                localStorage.removeItem('dinedeck_cashier_shifts');
                localStorage.removeItem('dinedeck_recent_bills');
                localStorage.removeItem('dinedeck_inventory_transactions');
              } catch (e) {}
              if (onRefresh) onRefresh();
              alert('✓ All local caches and operational test records reset to 0.');
            }
          }}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition border border-slate-700 text-xs font-bold flex items-center space-x-1.5 shrink-0"
          title="Reset All Live Records & Caches to 0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Reset to 0</span>
        </button>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition border border-slate-700 shrink-0"
            title="Refresh Live State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* User Badge, Desktop Controls & Logout */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="text-right hidden xl:block">
            <div className="text-xs font-bold text-white leading-tight">{user?.name}</div>
            <div className="text-[10px] text-slate-500">{user?.email}</div>
          </div>

          {(window as any).dinedeckDesktop?.isDesktop && (
            <>
              <button
                type="button"
                onClick={() => (window as any).dinedeckDesktop?.toggleFullScreen()}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition border border-slate-700 shrink-0 cursor-pointer"
                title="Toggle Full-Screen (F11)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => (window as any).dinedeckDesktop?.exitApp()}
                className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white transition border border-rose-500/30 shrink-0 cursor-pointer"
                title="Exit DineDeck Application (Alt+F4)"
              >
                <Power className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition border border-rose-500/20 shrink-0 cursor-pointer"
            title="Sign Out of Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
