import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatRole } from '../../utils/roleFormatter';
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
  Power,
  Sun,
  Moon
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
  const { isDark, toggleTheme } = useTheme();
  const primaryRole = assignedRoles.length > 0 ? assignedRoles[0] : 'STAFF';

  return (
    <header className="h-16 bg-white/95 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm dark:shadow-md transition-colors duration-150">
      {/* Left Brand + Restaurant Identity + Mobile Drawer Trigger */}
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white lg:hidden border border-slate-300 dark:border-slate-700 transition shrink-0"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* 1. Official DineDeck Partner Operations Identity */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center gap-2">
            <img
              src={isDark ? "/dinedeck-logo-dark.png" : "/dinedeck-logo.png"}
              alt="DineDeck"
              className="h-6 sm:h-7 object-contain"
              draggable={false}
            />
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 hidden xl:inline">
              Partner Operations
            </span>
          </div>
          <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
            PARTNER
          </span>
        </div>

        {/* Subtle Vertical Divider */}
        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5" />

        {/* 2. Refined Restaurant Identity */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-50 dark:bg-[#0B1120] border border-orange-500/20 dark:border-orange-500/30 flex items-center justify-center shadow-sm shrink-0 p-1">
            <img
              src="/dinedeck-emblem.png"
              alt="Restaurant Emblem"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight leading-tight truncate max-w-[130px] sm:max-w-[200px] md:max-w-[280px] lg:max-w-[360px]">
                {restaurant?.name || 'DINEDECK Partner'}
              </h1>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0">
                {formatRole(primaryRole)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
              <span className="truncate">{branch?.name || 'Main Flagship Branch'}</span>
              <span className="sm:hidden text-orange-500 font-semibold">• {formatRole(primaryRole)}</span>
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

        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-orange-400 transition border border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer shadow-sm active:scale-95"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle visual theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer shadow-sm active:scale-95"
            title="Refresh Live State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* User Badge, Desktop Controls & Logout */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden xl:block">
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">{user?.email}</div>
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
