import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ChefHat,
  Bell,
  Grid,
  MenuSquare,
  Receipt,
  Users,
  PlusCircle,
  CalendarDays,
  Boxes,
  FileBarChart2,
  ShieldCheck,
  Settings,
  LifeBuoy,
  X
} from 'lucide-react';

export type TabKey =
  | 'DASHBOARD'
  | 'KITCHEN'
  | 'SERVICE_CALLS'
  | 'TABLES'
  | 'ORDERS'
  | 'MENU'
  | 'BILLING'
  | 'STAFF'
  | 'RESERVATIONS'
  | 'INVENTORY'
  | 'REPORTS'
  | 'AUDIT'
  | 'SETTINGS'
  | 'HELP';

interface SidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  serviceCallsCount?: number;
  ordersCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  serviceCallsCount = 0,
  ordersCount = 0,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { hasPermission, hasAnyRole } = useAuth();

  const navigationItems = [
    {
      key: 'DASHBOARD' as TabKey,
      label: 'Home',
      icon: LayoutDashboard,
      roles: ['RESTAURANT_OWNER', 'GENERAL_MANAGER', 'ASSISTANT_MANAGER', 'CAPTAIN', 'HEAD_WAITER', 'WAITER', 'CASHIER', 'CHEF', 'DINEDECK_SUPER_ADMIN']
    },
    {
      key: 'KITCHEN' as TabKey,
      label: 'Kitchen Display',
      icon: ChefHat,
      badge: ordersCount,
      roles: ['RESTAURANT_OWNER', 'GENERAL_MANAGER', 'KITCHEN_MANAGER', 'HEAD_CHEF', 'CHEF', 'KITCHEN_STAFF', 'DINEDECK_SUPER_ADMIN']
    },
    {
      key: 'BILLING' as TabKey,
      label: 'Cashier & Billing',
      icon: Receipt,
      roles: ['RESTAURANT_OWNER', 'GENERAL_MANAGER', 'CASHIER', 'ACCOUNTANT', 'DINEDECK_SUPER_ADMIN']
    },
    {
      key: 'MENU' as TabKey,
      label: 'Menu',
      icon: MenuSquare,
      roles: ['RESTAURANT_OWNER', 'GENERAL_MANAGER', 'HEAD_CHEF', 'CHEF', 'KITCHEN_MANAGER', 'DINEDECK_SUPER_ADMIN']
    },
    {
      key: 'STAFF' as TabKey,
      label: 'Staff & Access',
      icon: Users,
      roles: ['RESTAURANT_OWNER', 'GENERAL_MANAGER', 'DINEDECK_SUPER_ADMIN']
    },
    {
      key: 'INVENTORY' as TabKey,
      label: 'Stock & Inventory',
      icon: Boxes,
      roles: ['RESTAURANT_OWNER', 'GENERAL_MANAGER', 'HEAD_CHEF', 'CHEF', 'INVENTORY_MANAGER', 'DINEDECK_SUPER_ADMIN']
    },
    {
      key: 'REPORTS' as TabKey,
      label: 'Reports',
      icon: FileBarChart2,
      roles: ['RESTAURANT_OWNER', 'GENERAL_MANAGER', 'ACCOUNTANT', 'DINEDECK_SUPER_ADMIN']
    },
    {
      key: 'SETTINGS' as TabKey,
      label: 'Settings',
      icon: Settings,
      roles: ['RESTAURANT_OWNER', 'GENERAL_MANAGER', 'DINEDECK_SUPER_ADMIN']
    },
    {
      key: 'HELP' as TabKey,
      label: 'Help & Support',
      icon: LifeBuoy,
      roles: ['RESTAURANT_OWNER', 'GENERAL_MANAGER', 'ASSISTANT_MANAGER', 'CAPTAIN', 'HEAD_WAITER', 'WAITER', 'CASHIER', 'CHEF', 'KITCHEN_STAFF', 'DINEDECK_SUPER_ADMIN']
    }
  ];

  const visibleItems = navigationItems.filter(
    (item) => !item.roles || hasAnyRole(item.roles)
  );

  const handleSelect = (key: TabKey) => {
    onSelectTab(key);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-[#0B1120] border-r border-slate-800 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-4">
          {/* Mobile Drawer Close Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 lg:hidden">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Navigation Menu
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1 mb-2">
            <img
              src="/dinedeck-logo-dark.png"
              alt="DineDeck"
              className="h-6 object-contain"
              draggable={false}
            />
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Partner
            </span>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 hidden lg:block">
            Operations & Management
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => handleSelect(item.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-extrabold text-xs transition duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/20'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-white text-orange-600 shadow'
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Role Badge */}
        <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-white flex items-center justify-between">
            <span>Security Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-[10px] text-slate-500">DineDeck Connected • Online</div>
        </div>
      </aside>
    </>
  );
};
