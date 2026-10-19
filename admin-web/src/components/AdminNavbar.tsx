import React from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  Shield,
  LogOut,
  Search,
  Menu,
  X,
  Maximize2,
  Power
} from 'lucide-react';

interface AdminNavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  onOpenSearch?: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen = false,
  onOpenSearch
}) => {
  const { logout } = useAdminAuth();

  return (
    <header className="h-16 bg-[#0E131F]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-lg shrink-0">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white lg:hidden border border-slate-700 transition"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#090D16] border border-orange-500/40 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 p-1.5">
            <img
              src="/dinedeck-emblem.png"
              alt="DineDeck Emblem"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-1.5">
                <img
                  src="/dinedeck-logo-dark.png"
                  alt="DineDeck"
                  className="h-4.5 sm:h-5 object-contain"
                  draggable={false}
                />
                <span className="font-bold text-xs text-slate-300 hidden sm:inline">Control Center</span>
              </div>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                ADMIN
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400">
              Platform Administration
            </div>
          </div>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center max-w-md w-full mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl text-xs text-slate-400 transition group"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 group-hover:text-slate-200 transition truncate">
              Search Orders, Restaurants, GSTIN, Bills...
            </span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded-lg bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400"
          title="Search All"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Online</span>
        </div>

        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white leading-tight">DINEDECK SuperAdmin</div>
            <div className="text-[10px] text-slate-500">superadmin@dinedeck.in</div>
          </div>

          {(window as any).dinedeckDesktop?.isDesktop && (
            <>
              <button
                type="button"
                onClick={() => (window as any).dinedeckDesktop?.toggleFullScreen()}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition shrink-0 cursor-pointer"
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
            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition border border-rose-500/20 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
