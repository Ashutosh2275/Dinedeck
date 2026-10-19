import React from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Activity,
  ShoppingBag,
  DollarSign,
  FileSpreadsheet,
  FileCheck,
  AlertOctagon,
  ShieldCheck,
  Smartphone,
  Flag,
  RotateCcw,
  LifeBuoy,
  HeartPulse,
  History,
  Settings,
  X,
  Sparkles,
  Store,
  Users
} from 'lucide-react';

export type AdminTab =
  | 'OVERVIEW'
  | 'TENANT_SUITE'
  | 'USER_DATABASE'
  | 'CUSTOMER_CMS'
  | 'RESTAURANTS'
  | 'APPROVALS'
  | 'OPERATIONS'
  | 'ORDERS'
  | 'FINANCE'
  | 'RECONCILIATION'
  | 'COMPLIANCE'
  | 'RISK'
  | 'IAM'
  | 'DEVICES'
  | 'FLAGS'
  | 'CHANGES'
  | 'SUPPORT'
  | 'HEALTH'
  | 'AUDIT'
  | 'SETTINGS';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { isDark } = useTheme();
  const navigationGroups = [
    {
      group: 'A. DASHBOARD & OPERATIONS',
      items: [
        { key: 'OVERVIEW' as AdminTab, label: 'Platform Overview', icon: LayoutDashboard },
        { key: 'OPERATIONS' as AdminTab, label: 'Live Kitchen & Orders', icon: Activity },
        { key: 'HEALTH' as AdminTab, label: 'System Health & Controls', icon: HeartPulse }
      ]
    },
    {
      group: 'B. RESTAURANTS & ONBOARDING',
      items: [
        { key: 'RESTAURANTS' as AdminTab, label: 'Restaurants & Branches', icon: Building2 },
        { key: 'APPROVALS' as AdminTab, label: 'New Restaurant Approvals', icon: CheckSquare },
        { key: 'TENANT_SUITE' as AdminTab, label: 'Restaurant Workspace', icon: Store },
        { key: 'COMPLIANCE' as AdminTab, label: 'Verification & Compliance', icon: FileCheck }
      ]
    },
    {
      group: 'C. ORDERS & CUSTOMERS',
      items: [
        { key: 'ORDERS' as AdminTab, label: 'All Orders', icon: ShoppingBag },
        { key: 'USER_DATABASE' as AdminTab, label: 'Customers & Diners', icon: Users },
        { key: 'CUSTOMER_CMS' as AdminTab, label: 'Website Content & Banners', icon: Sparkles }
      ]
    },
    {
      group: 'D. FINANCE & PAYOUTS',
      items: [
        { key: 'FINANCE' as AdminTab, label: 'Payouts & Billing', icon: DollarSign },
        { key: 'RECONCILIATION' as AdminTab, label: 'Match Payments & Settlements', icon: FileSpreadsheet }
      ]
    },
    {
      group: 'E. SAFETY & SUPPORT',
      items: [
        { key: 'RISK' as AdminTab, label: 'Fraud & Risk Alerts', icon: AlertOctagon },
        { key: 'SUPPORT' as AdminTab, label: 'Help Desk & Service Issues', icon: LifeBuoy }
      ]
    },
    {
      group: 'F. DEVICES & CONTROLS',
      items: [
        { key: 'DEVICES' as AdminTab, label: 'Devices & Printers', icon: Smartphone },
        { key: 'FLAGS' as AdminTab, label: 'Feature Controls', icon: Flag },
        { key: 'CHANGES' as AdminTab, label: 'Settings History', icon: RotateCcw }
      ]
    },
    {
      group: 'G. ACCESS & HISTORY',
      items: [
        { key: 'IAM' as AdminTab, label: 'Staff & Access Permissions', icon: ShieldCheck },
        { key: 'AUDIT' as AdminTab, label: 'Activity History', icon: History }
      ]
    },
    {
      group: 'H. SETTINGS',
      items: [
        { key: 'SETTINGS' as AdminTab, label: 'General Settings', icon: Settings }
      ]
    }
  ];

  const handleSelect = (key: AdminTab) => {
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
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#090D16] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-3.5 transition-transform duration-300 ease-in-out lg:translate-x-0 shrink-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 lg:hidden">
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Administration Menu
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1 mb-1">
            <img
              src={isDark ? "/dinedeck-logo-dark.png" : "/dinedeck-logo.png"}
              alt="DineDeck"
              className="h-5 object-contain"
              draggable={false}
            />
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              Admin
            </span>
          </div>

          <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {navigationGroups.map((grp) => (
              <div key={grp.group} className="space-y-0.5">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 pb-1">
                  {grp.group}
                </div>
                {grp.items.map((t) => {
                  const Icon = t.icon;
                  const isActive = currentTab === t.key;

                  return (
                    <button
                      key={t.key}
                      onClick={() => handleSelect(t.key)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl font-extrabold text-xs transition duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};
