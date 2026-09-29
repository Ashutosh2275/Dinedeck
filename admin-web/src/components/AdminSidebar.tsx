import React from 'react';
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
  const navigationGroups = [
    {
      group: '01 COMMAND & TELEMETRY',
      items: [
        { key: 'OVERVIEW' as AdminTab, label: 'Command Center', icon: LayoutDashboard },
        { key: 'TENANT_SUITE' as AdminTab, label: 'All-Restaurant Live Command', icon: Store },
        { key: 'USER_DATABASE' as AdminTab, label: 'User & Diner Database', icon: Users },
        { key: 'CUSTOMER_CMS' as AdminTab, label: 'Customer Scrolls & CMS', icon: Sparkles },
        { key: 'OPERATIONS' as AdminTab, label: 'Live Operations & KDS', icon: Activity },
        { key: 'ORDERS' as AdminTab, label: 'Orders Command', icon: ShoppingBag }
      ]
    },
    {
      group: '02 MERCHANTS & COMMERCE',
      items: [
        { key: 'RESTAURANTS' as AdminTab, label: 'Merchants & Tenants', icon: Building2 },
        { key: 'APPROVALS' as AdminTab, label: 'Onboarding & Approvals', icon: CheckSquare },
        { key: 'FINANCE' as AdminTab, label: 'Finance & Settlements', icon: DollarSign },
        { key: 'RECONCILIATION' as AdminTab, label: 'Financial Reconciliation', icon: FileSpreadsheet }
      ]
    },
    {
      group: '03 GOVERNANCE & RISK',
      items: [
        { key: 'COMPLIANCE' as AdminTab, label: 'KYC & Compliance', icon: FileCheck },
        { key: 'RISK' as AdminTab, label: 'Risk Assessment Engine', icon: AlertOctagon },
        { key: 'AUDIT' as AdminTab, label: 'Audit Logs & Timeline', icon: History }
      ]
    },
    {
      group: '04 PLATFORM & INFRASTRUCTURE',
      items: [
        { key: 'IAM' as AdminTab, label: 'IAM & Granular Security', icon: ShieldCheck },
        { key: 'DEVICES' as AdminTab, label: 'Hardware Fleet & Printers', icon: Smartphone },
        { key: 'FLAGS' as AdminTab, label: 'Feature Flags & Rollouts', icon: Flag },
        { key: 'CHANGES' as AdminTab, label: 'Config Versioning & Rollback', icon: RotateCcw }
      ]
    },
    {
      group: '05 OBSERVABILITY & DESK',
      items: [
        { key: 'HEALTH' as AdminTab, label: 'System Health & Killswitch', icon: HeartPulse },
        { key: 'SUPPORT' as AdminTab, label: 'Support & Incident Desk', icon: LifeBuoy },
        { key: 'SETTINGS' as AdminTab, label: 'Platform Configuration', icon: Settings }
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
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-[#090D16] border-r border-slate-800 flex flex-col justify-between p-3.5 transition-transform duration-300 ease-in-out lg:translate-x-0 shrink-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 lg:hidden">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Control Center Navigation
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {navigationGroups.map((grp) => (
              <div key={grp.group} className="space-y-0.5">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-3 pb-1">
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
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
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
