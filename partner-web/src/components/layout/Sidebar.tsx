import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  ChefHat,
  MenuSquare,
  Receipt,
  Users,
  Boxes,
  FileBarChart2,
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
  isOpen?: boolean;
  onClose?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  ordersCount = 0,
  isOpen,
  onClose,
  isOpenMobile,
  onCloseMobile
}) => {
  const { hasAnyRole } = useAuth();
  const { isDark } = useTheme();

  const isSidebarVisible = isOpen !== undefined ? isOpen : (isOpenMobile ?? true);
  const handleClose = onClose || onCloseMobile;

  const handleSelect = (key: TabKey) => {
    onSelectTab(key);
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && handleClose) {
      handleClose();
    }
  };

  const navigationGroups = [
    {
      group: 'OPERATIONS & FLOORS',
      items: [
        {
          key: 'DASHBOARD' as TabKey,
          label: 'Home',
          icon: LayoutDashboard,
          roles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'GENERAL_MANAGER', 'ASSISTANT_MANAGER', 'CAPTAIN', 'HEAD_WAITER', 'WAITER', 'CASHIER', 'CHEF', 'RESTAURANT_STAFF', 'STAFF', 'DINEDECK_ADMIN', 'DINEDECK_SUPER_ADMIN']
        },
        {
          key: 'KITCHEN' as TabKey,
          label: 'Kitchen Display',
          icon: ChefHat,
          badge: ordersCount,
          roles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'GENERAL_MANAGER', 'KITCHEN_MANAGER', 'HEAD_CHEF', 'CHEF', 'KITCHEN_STAFF', 'RESTAURANT_STAFF', 'STAFF', 'DINEDECK_ADMIN', 'DINEDECK_SUPER_ADMIN']
        },
        {
          key: 'BILLING' as TabKey,
          label: 'Cashier & Billing',
          icon: Receipt,
          roles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'GENERAL_MANAGER', 'CASHIER', 'ACCOUNTANT', 'RESTAURANT_STAFF', 'STAFF', 'DINEDECK_ADMIN', 'DINEDECK_SUPER_ADMIN']
        }
      ]
    },
    {
      group: 'RESTAURANT MANAGEMENT',
      items: [
        {
          key: 'MENU' as TabKey,
          label: 'Menu',
          icon: MenuSquare,
          roles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'GENERAL_MANAGER', 'HEAD_CHEF', 'CHEF', 'KITCHEN_MANAGER', 'DINEDECK_ADMIN', 'DINEDECK_SUPER_ADMIN']
        },
        {
          key: 'STAFF' as TabKey,
          label: 'Staff & Access',
          icon: Users,
          roles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'GENERAL_MANAGER', 'DINEDECK_ADMIN', 'DINEDECK_SUPER_ADMIN']
        },
        {
          key: 'INVENTORY' as TabKey,
          label: 'Stock & Inventory',
          icon: Boxes,
          roles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'GENERAL_MANAGER', 'HEAD_CHEF', 'CHEF', 'INVENTORY_MANAGER', 'DINEDECK_ADMIN', 'DINEDECK_SUPER_ADMIN']
        }
      ]
    },
    {
      group: 'INTELLIGENCE & SETTINGS',
      items: [
        {
          key: 'REPORTS' as TabKey,
          label: 'Reports',
          icon: FileBarChart2,
          roles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'GENERAL_MANAGER', 'ACCOUNTANT', 'DINEDECK_ADMIN', 'DINEDECK_SUPER_ADMIN']
        },
        {
          key: 'SETTINGS' as TabKey,
          label: 'Settings',
          icon: Settings,
          roles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'GENERAL_MANAGER', 'DINEDECK_ADMIN', 'DINEDECK_SUPER_ADMIN']
        },
        {
          key: 'HELP' as TabKey,
          label: 'Help & Support',
          icon: LifeBuoy,
          roles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'GENERAL_MANAGER', 'ASSISTANT_MANAGER', 'CAPTAIN', 'HEAD_WAITER', 'WAITER', 'CASHIER', 'CHEF', 'KITCHEN_STAFF', 'RESTAURANT_STAFF', 'STAFF', 'DINEDECK_ADMIN', 'DINEDECK_SUPER_ADMIN']
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarVisible && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Premium Sidebar Container with Smooth Collapsible Width */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarVisible
            ? 'w-72 p-3.5 translate-x-0 shadow-2xl lg:shadow-none opacity-100'
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:p-0 lg:border-none lg:overflow-hidden lg:opacity-0 pointer-events-none'
        }`}
      >
        {/* Sidebar Header with Brand + Close / Collapse Button */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <img
              src={isDark ? "/dinedeck-logo-dark.png" : "/dinedeck-logo.png"}
              alt="DineDeck"
              className="h-5 object-contain"
              draggable={false}
            />
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
              Partner
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items List with Clean Category Groupings */}
        <nav className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar pt-1">
          {navigationGroups.map((group) => {
            const visibleInGroup = group.items.filter(
              (item) => !item.roles || hasAnyRole(item.roles)
            );
            if (visibleInGroup.length === 0) return null;

            return (
              <div key={group.group} className="space-y-1">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 pb-1">
                  {group.group}
                </div>
                {visibleInGroup.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelect(item.key)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-white text-orange-600 shadow'
                              : 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
