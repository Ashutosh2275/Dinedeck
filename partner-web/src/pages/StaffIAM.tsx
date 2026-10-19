import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { StaffMember, PermissionCategory, PermissionItem, FranchiseLocation, AuditLog } from '../types';
import { api } from '../services/api';
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES } from '../constants/iam';
import { formatRole } from '../utils/roleFormatter';
import {
  Users,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  PlusCircle,
  UserPlus,
  ArrowLeft,
  Building2,
  Store,
  MapPin,
  CheckSquare,
  Square,
  History,
  Lock,
  Layers
} from 'lucide-react';

export const ROLE_HIERARCHY_RANK: Record<string, number> = {
  DINEDECK_SUPER_ADMIN: 1000,
  SUPER_ADMIN: 1000,
  RESTAURANT_OWNER: 100,
  OWNER: 100,
  GENERAL_MANAGER: 80,
  MANAGER: 80,
  BRANCH_MANAGER: 75,
  ASSISTANT_MANAGER: 75,
  HEAD_CHEF: 60,
  KITCHEN_MANAGER: 60,
  CAPTAIN: 60,
  HEAD_WAITER: 60,
  CHIEF_ACCOUNTANT: 60,
  ACCOUNTANT: 50,
  CASHIER: 40,
  CHEF: 40,
  KITCHEN_STAFF: 30,
  WAITER: 20,
  STEWARD: 20,
  SUPPORT_VIEW_ONLY: 10,
  CUSTOMER: 0
};

export const StaffIAM: React.FC = () => {
  const { restaurant, user: currentUser, branch, assignedRoles = [], permissions: userPermissions = new Set<string>() } = useAuth();

  // Hierarchy calculations
  const actorRoles = assignedRoles && assignedRoles.length > 0 ? assignedRoles : currentUser?.role ? [currentUser.role] : ['STAFF'];
  const actorMaxRank = useMemo(() => {
    const ranks = actorRoles.map((r) => {
      if (ROLE_HIERARCHY_RANK[r]) return ROLE_HIERARCHY_RANK[r];
      const upper = (r || '').toUpperCase();
      if (upper.includes('OWNER')) return 100;
      if (upper.includes('GENERAL') || upper.includes('MANAGER')) return 80;
      if (upper.includes('HEAD') || upper.includes('CAPTAIN') || upper.includes('CHIEF')) return 60;
      if (upper.includes('CHEF') || upper.includes('CASHIER')) return 40;
      return 20;
    });
    return Math.max(...ranks, 20);
  }, [actorRoles]);

  const isOwner = actorMaxRank >= 100;

  const getStaffRank = (staff: StaffMember): number => {
    if (staff.isRootOwner) return 100;
    const roleStrings: string[] = [];
    if (staff.primaryRole) roleStrings.push(staff.primaryRole);
    if (staff.roleName) roleStrings.push(staff.roleName);
    if (staff.designation) roleStrings.push(staff.designation);
    if (Array.isArray(staff.roles)) {
      staff.roles.forEach((r: any) => {
        if (typeof r === 'string') roleStrings.push(r);
        else if (r?.roleId) roleStrings.push(r.roleId);
      });
    }
    if (roleStrings.length === 0) return 20;
    const ranks = roleStrings.map((r: string) => {
      if (ROLE_HIERARCHY_RANK[r]) return ROLE_HIERARCHY_RANK[r];
      const upper = (r || '').toUpperCase();
      if (upper.includes('OWNER')) return 100;
      if (upper.includes('GENERAL') || upper.includes('MANAGER')) return 80;
      if (upper.includes('HEAD') || upper.includes('CAPTAIN') || upper.includes('CHIEF')) return 60;
      if (upper.includes('CHEF') || upper.includes('CASHIER')) return 40;
      return 20;
    });
    return Math.max(...ranks, 20);
  };

  const canActorEditStaff = (staff: StaffMember): boolean => {
    if (currentUser?.id && ((staff.userId && staff.userId === currentUser.id) || staff.id === currentUser.id || staff.email === currentUser.email)) {
      return false;
    }
    // Branch Isolation: Non-owners can only edit staff in their assigned branch
    if (!isOwner) {
      const actorBranchId = branch?.id || (currentUser as any)?.branchId;
      if (actorBranchId && (staff.branchId || staff.franchiseId) && staff.branchId !== actorBranchId && staff.franchiseId !== actorBranchId) {
        return false;
      }
    }
    const targetRank = getStaffRank(staff);
    return actorMaxRank > targetRank;
  };

  const canActorDelegatePermission = (permId: string): boolean => {
    if (isOwner) return true;
    return userPermissions.has(permId) || userPermissions.has('ALL');
  };

  // Core Data States with authoritative fallbacks
  const [franchises, setFranchises] = useState<FranchiseLocation[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>('ALL');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [categories, setCategories] = useState<PermissionCategory[]>(PERMISSION_CATEGORIES);
  const [permissions, setPermissions] = useState<PermissionItem[]>(ALL_PERMISSIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter States
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Selected User for 91-Permission IAM Matrix Modal
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // Matrix Modal Working State
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [assignedFranchiseId, setAssignedFranchiseId] = useState<string>('ALL');
  const [customDesignation, setCustomDesignation] = useState<string>('');
  const [changeReason, setChangeReason] = useState<string>('');
  const [showPreviewStep, setShowPreviewStep] = useState(false);
  const [permissionSearchQuery, setPermissionSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(null);

  // Attach / Provision New User ID Modal State
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachUserIdOrEmail, setAttachUserIdOrEmail] = useState('');
  const [attachDesignation, setAttachDesignation] = useState('');
  const [attachFranchiseId, setAttachFranchiseId] = useState('ALL');

  // Collapsed / Expanded Categories State (all expanded by default)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    PERMISSION_CATEGORIES.forEach((c) => {
      init[c.key] = true;
    });
    return init;
  });

  // Audit Logs Drawer State
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [auditTargetFilter, setAuditTargetFilter] = useState<string | null>(null);

  // 1. Fetch All Initial IAM Data
  const fetchAllIamData = async (franchiseIdToFetch = selectedFranchiseId) => {
    setIsLoading(true);
    try {
      const [franchiseRes, staffRes, permRes, auditRes] = await Promise.all([
        api.fetchFranchises(restaurant?.id),
        api.fetchStaff(restaurant?.id, franchiseIdToFetch),
        api.fetchPermissions(),
        api.fetchAuditLogs(restaurant?.id)
      ]);

      if (franchiseRes.success && franchiseRes.data) {
        setFranchises(franchiseRes.data);
      }

      if (staffRes.success && staffRes.data) {
        setStaffList(staffRes.data);
      }

      if (permRes && permRes.success) {
        const catList = (permRes as any).categories || (permRes.data as any)?.categories || PERMISSION_CATEGORIES;
        const permList = (permRes as any).data || (permRes.data as any)?.data || ALL_PERMISSIONS;

        const finalCats = Array.isArray(catList) && catList.length > 0 && catList[0]?.key ? catList : PERMISSION_CATEGORIES;
        const finalPerms = Array.isArray(permList) && permList.length > 0 && permList[0]?.id ? permList : ALL_PERMISSIONS;

        setCategories(finalCats);
        setPermissions(finalPerms);

        const initExpanded: Record<string, boolean> = {};
        finalCats.forEach((c: any) => {
          initExpanded[c.key] = true;
        });
        setExpandedCategories(initExpanded);
      }

      if (auditRes.success && auditRes.data) {
        setAuditLogs(auditRes.data);
      }
    } catch (err) {
      console.error('[Partner IAM] Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (restaurant?.id) {
      fetchAllIamData(selectedFranchiseId);
    }
  }, [restaurant?.id, selectedFranchiseId]);

  // 2. Open 91-Permission Matrix for a Staff Member
  const handleOpenAccessModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setSelectedPermissions(new Set(staff.effectivePermissions || []));
    setAssignedFranchiseId(staff.franchiseId || staff.branchId || 'ALL');
    setCustomDesignation(staff.designation || '');
    setChangeReason('');
    setShowPreviewStep(false);
    setPermissionSearchQuery('');
    setFormFeedback(null);
    setIsAccessModalOpen(true);
  };

  // 3. Open Attach Provisioned User Modal
  const handleOpenAttachModal = () => {
    setAttachUserIdOrEmail('');
    setAttachDesignation('Staff Member');
    setAttachFranchiseId(selectedFranchiseId !== 'ALL' ? selectedFranchiseId : 'ALL');
    setSelectedPermissions(new Set(['orders.read', 'service_requests.read', 'tables.read', 'menu.read']));
    setChangeReason('Provisioned user linked by Root User');
    setShowPreviewStep(false);
    setFormFeedback(null);
    setIsAttachModalOpen(true);
  };

  // 4. Toggle Individual Permission Checkbox (Subject to sub-delegation authority)
  const handleTogglePermission = (permId: string) => {
    if (!canActorDelegatePermission(permId)) return;
    const next = new Set(selectedPermissions);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setSelectedPermissions(next);
  };

  // 5. Category-wise Select All / Clear All
  const handleSelectAllCategory = (catKey: string) => {
    const catPerms = permissions.filter((p) => p.category === catKey && canActorDelegatePermission(p.id));
    const next = new Set(selectedPermissions);
    catPerms.forEach((p) => next.add(p.id));
    setSelectedPermissions(next);
  };

  const handleClearAllCategory = (catKey: string) => {
    const catPerms = permissions.filter((p) => p.category === catKey && canActorDelegatePermission(p.id));
    const next = new Set(selectedPermissions);
    catPerms.forEach((p) => next.delete(p.id));
    setSelectedPermissions(next);
  };

  // 6. Global Select All / Clear All
  const handleSelectAllGlobal = () => {
    const allowed = permissions.filter((p) => canActorDelegatePermission(p.id));
    setSelectedPermissions(new Set(allowed.map((p) => p.id)));
  };

  const handleClearAllGlobal = () => {
    if (isOwner) {
      setSelectedPermissions(new Set());
    } else {
      // Clear only permissions that current actor is allowed to delegate
      const allowedIds = new Set(permissions.filter((p) => canActorDelegatePermission(p.id)).map((p) => p.id));
      const next = new Set(Array.from(selectedPermissions).filter((id) => !allowedIds.has(id)));
      setSelectedPermissions(next);
    }
  };

  // 7. Toggle Category Collapse
  const toggleCategoryExpand = (catKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey]
    }));
  };

  // 8. Diff Calculation for Preview
  const currentPermissionsList = useMemo(() => {
    return selectedStaff?.effectivePermissions || [];
  }, [selectedStaff]);

  const addedPermissionsList = useMemo(() => {
    const currentSet = new Set(currentPermissionsList);
    return Array.from(selectedPermissions).filter((p) => !currentSet.has(p));
  }, [selectedPermissions, currentPermissionsList]);

  const removedPermissionsList = useMemo(() => {
    const nextSet = selectedPermissions;
    return currentPermissionsList.filter((p) => !nextSet.has(p));
  }, [selectedPermissions, currentPermissionsList]);

  const retainedPermissionsList = useMemo(() => {
    const currentSet = new Set(currentPermissionsList);
    return Array.from(selectedPermissions).filter((p) => currentSet.has(p));
  }, [selectedPermissions, currentPermissionsList]);

  // Lookup map for fast permission name display
  const permissionMap = useMemo(() => {
    const map = new Map<string, PermissionItem>();
    permissions.forEach((p) => map.set(p.id, p));
    return map;
  }, [permissions]);

  // 9. Confirm & Share Access (Authoritative Persistence)
  const handleConfirmAndShareAccess = async () => {
    if (!selectedStaff || !restaurant?.id) return;
    setIsSubmitting(true);
    setFormFeedback(null);

    try {
      const res = await api.updateStaffAccess(selectedStaff.id, {
        restaurantId: restaurant.id,
        roleId: 'CUSTOM',
        branchId: assignedFranchiseId,
        permissions: Array.from(selectedPermissions),
        reason: changeReason.trim() || 'Custom permissions assigned by Root User'
      });

      if (res.success) {
        setFormFeedback({
          type: 'SUCCESS',
          message: `Access permissions successfully updated and shared with ${selectedStaff.name}.`
        });

        setTimeout(() => {
          setIsAccessModalOpen(false);
          fetchAllIamData(selectedFranchiseId);
        }, 1200);
      } else {
        setFormFeedback({
          type: 'ERROR',
          message: res.error || 'Failed to update access permissions.'
        });
      }
    } catch (err: any) {
      setFormFeedback({
        type: 'ERROR',
        message: err.message || 'An unexpected error occurred while persisting access.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 10. Confirm Attach Provisioned User
  const handleConfirmAttachUser = async () => {
    if (!restaurant?.id || !attachUserIdOrEmail.trim()) {
      setFormFeedback({ type: 'ERROR', message: 'User ID or Email is required.' });
      return;
    }

    setIsSubmitting(true);
    setFormFeedback(null);

    try {
      const res = await api.attachStaffMember({
        restaurantId: restaurant.id,
        userIdOrEmail: attachUserIdOrEmail.trim(),
        roleId: 'CUSTOM',
        designation: attachDesignation.trim() || 'Staff Member',
        branchId: attachFranchiseId,
        permissions: Array.from(selectedPermissions),
        reason: changeReason.trim() || 'Provisioned account attached to franchise'
      });

      if (res.success) {
        setFormFeedback({
          type: 'SUCCESS',
          message: `User '${res.data?.name || attachUserIdOrEmail}' linked to restaurant with custom access.`
        });
        setTimeout(() => {
          setIsAttachModalOpen(false);
          fetchAllIamData(selectedFranchiseId);
        }, 1200);
      } else {
        setFormFeedback({
          type: 'ERROR',
          message: res.error || 'Failed to attach user account.'
        });
      }
    } catch (err: any) {
      setFormFeedback({
        type: 'ERROR',
        message: err.message || 'An unexpected error occurred while linking account.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Staff for Directory
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      // Franchise Filter: When a specific franchise is selected, show ONLY staff assigned to that franchise
      if (selectedFranchiseId !== 'ALL') {
        const matchesFranchise = s.franchiseId === selectedFranchiseId || s.branchId === selectedFranchiseId;
        if (!matchesFranchise) return false;
      }

      // Search Query
      if (searchUserQuery.trim()) {
        const q = searchUserQuery.toLowerCase();
        const matchesSearch =
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.designation.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [staffList, selectedFranchiseId, searchUserQuery, statusFilter]);

  // Filtered Permissions in Modal
  const filteredCategories = useMemo(() => {
    if (!permissionSearchQuery.trim()) return categories;

    const q = permissionSearchQuery.toLowerCase();
    const matchingCategoryKeys = new Set<string>();

    permissions.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q)
      ) {
        matchingCategoryKeys.add(p.category);
      }
    });

    return categories.filter((c) => matchingCategoryKeys.has(c.key));
  }, [categories, permissions, permissionSearchQuery]);

  const totalPossiblePermissions = 91;

  const [activeSubTab, setActiveSubTab] = useState<'STAFF_DIRECTORY' | 'SECURITY_AUDIT'>('STAFF_DIRECTORY');

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 p-4 md:p-6 lg:p-8 space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/40 rounded-xl text-orange-400 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Staff & Access
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage staff roles, access permissions, and account activity history
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeSubTab === 'STAFF_DIRECTORY' && (
            <button
              onClick={() => handleOpenAttachModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-orange-600/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          )}

          <button
            onClick={() => fetchAllIamData(selectedFranchiseId)}
            disabled={isLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all active:scale-95 cursor-pointer"
            title="Refresh Staff Access Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Sub-Tab Switcher: Staff Directory vs Security Audit */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md">
        <button
          type="button"
          onClick={() => setActiveSubTab('STAFF_DIRECTORY')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'STAFF_DIRECTORY'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Directory & Permissions</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {staffList.length}
          </span>
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={() => setActiveSubTab('SECURITY_AUDIT')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'SECURITY_AUDIT'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Activity History</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Owner Only
            </span>
          </button>
        )}
      </div>

      {activeSubTab === 'SECURITY_AUDIT' ? (
        /* SIMPLIFIED IMMUTABLE SECURITY AND OPERATIONAL AUDIT LOG */
        <div className="space-y-4">
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 bg-slate-900/90 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-400" />
                  <span>Staff & System Activity History</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chronological records of permissions assigned, revoked, roles changed, and refunds executed.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 self-start sm:self-auto">
                {auditLogs.length} Records Verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-700/80">
                  <tr>
                    <th className="px-5 py-4">Timestamp</th>
                    <th className="px-5 py-4">Actor</th>
                    <th className="px-5 py-4">Action Executed (+ / - Done)</th>
                    <th className="px-5 py-4">Target User</th>
                    <th className="px-5 py-4 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-14 text-center text-slate-500">
                        No activity history recorded for this restaurant.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      let afterData: any = null;
                      try {
                        if (log.afterJson) afterData = typeof log.afterJson === 'string' ? JSON.parse(log.afterJson) : log.afterJson;
                      } catch (e) {
                        afterData = log.afterJson;
                      }

                      // Branch lookup
                      const actorBranch = franchises.find((f) => f.id === log.scope || f.id === log.actor?.branchId)?.name || log.scope || 'Bandra Flagship';
                      const targetBranch = franchises.find((f) => f.id === afterData?.branchId)?.name || actorBranch;

                      return (
                        <tr key={log.id} className="hover:bg-slate-800/50 transition">
                          {/* 1. Timestamp */}
                          <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium">
                              <History className="w-3.5 h-3.5 text-slate-500" />
                              <span>
                                {new Date(log.createdAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </td>

                          {/* 2. Actor: Name (User ID) [Branch Name] */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-white text-xs">
                              {log.actor?.name || 'System Root'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              ID: {log.actorId?.slice(0, 10) || 'ROOT'} ({actorBranch})
                            </div>
                          </td>

                          {/* 3. Action Executed & Plus / Minus Done */}
                          <td className="px-5 py-4 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                {log.action}
                              </span>
                            </div>

                            {/* + Added / Granted */}
                            {afterData?.addedPermissions && afterData.addedPermissions.length > 0 && (
                              <div className="text-[11px] font-semibold text-emerald-400">
                                + Added: {afterData.addedPermissions.join(', ')}
                              </div>
                            )}

                            {/* - Removed / Revoked */}
                            {afterData?.removedPermissions && afterData.removedPermissions.length > 0 && (
                              <div className="text-[11px] font-semibold text-rose-400">
                                - Removed: {afterData.removedPermissions.join(', ')}
                              </div>
                            )}

                            {/* Reason */}
                            {afterData?.reason && (
                              <div className="text-[10px] text-slate-400 italic">
                                Note: "{afterData.reason}"
                              </div>
                            )}
                          </td>

                          {/* 4. Target User Name (Branch Name) */}
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-200 text-xs">
                              {afterData?.targetUser?.name || log.resourceId || 'Staff Profile'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              ({targetBranch})
                            </div>
                          </td>

                          {/* 5. Result: Success / Failed */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                log.result === 'SUCCESS' || log.result === 'ALLOWED'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {log.result === 'SUCCESS' || log.result === 'ALLOWED' ? '✅ SUCCESS' : '❌ FAILED'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>

      {/* 2. Franchise Location Control Toolbar (Owner vs Branch Staff) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
        {/* Franchise Dropdown (ACCESSIBLE TO OWNER ONLY) */}
        <div className="md:col-span-4 lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-orange-400" />
            Franchise Location
          </label>
          {isOwner ? (
            <div className="relative">
              <select
                value={selectedFranchiseId}
                onChange={(e) => setSelectedFranchiseId(e.target.value)}
                className="w-full bg-slate-800 text-white text-sm font-medium border border-slate-700 rounded-xl px-3.5 py-2.5 pr-9 appearance-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
              >
                <option value="ALL">🏢 All Franchises ({franchises.length} locations)</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>
                    📍 {f.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <div className="bg-slate-800/80 border border-slate-700 text-slate-300 px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>📍 {branch?.name || 'Assigned Branch'}</span>
            </div>
          )}
        </div>

        {/* Search Users */}
        <div className="md:col-span-5 lg:col-span-6">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            Search Staff / Users
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by staff name, user ID, email, or designation..."
              value={searchUserQuery}
              onChange={(e) => setSearchUserQuery(e.target.value)}
              className="w-full bg-slate-800 text-white text-sm border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchUserQuery && (
              <button
                onClick={() => setSearchUserQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3 lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Staff Status
          </label>
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'ALL' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({staffList.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('SUSPENDED')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'SUSPENDED' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Suspended
            </button>
          </div>
        </div>
      </div>

      {/* 3. Staff User Directory Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Staff Directory</span>
            <span className="px-2 py-0.5 text-xs bg-slate-800 text-orange-400 border border-slate-700 rounded-full">
              {filteredStaff.length} Users
            </span>
          </h2>
          <span className="text-xs text-slate-500">
            Click any user to customize their 91-permission matrix
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading staff users and permission state...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-slate-900/40 border border-slate-800 rounded-2xl text-center">
            <Users className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No Staff Users Found</h3>
            <p className="text-sm text-slate-400 max-w-md mt-1">
              No staff members match the selected franchise location or search filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((staff) => {
              const permissionsCount = staff.effectivePermissions?.length || 0;
              const hasFullAccess = permissionsCount === totalPossiblePermissions;
              const isEditable = canActorEditStaff(staff);
              const targetRank = getStaffRank(staff);
              const isSelf = currentUser?.id ? ((staff.userId && staff.userId === currentUser.id) || staff.id === currentUser.id || staff.email === currentUser.email) : false;

              return (
                <div
                  key={staff.id}
                  onClick={() => {
                    if (isEditable) {
                      handleOpenAccessModal(staff);
                    }
                  }}
                  className={`group relative bg-slate-900/80 border p-5 rounded-2xl transition-all shadow-lg ${
                    isEditable
                      ? 'hover:bg-slate-800/90 border-slate-800 hover:border-orange-500/50 cursor-pointer hover:shadow-orange-500/5 active:scale-[0.99]'
                      : 'border-slate-850 opacity-90 cursor-default'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-base font-bold text-white shadow-inner">
                        {staff.avatarUrl ? (
                          <img src={staff.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          staff.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold transition-colors ${isEditable ? 'text-white group-hover:text-orange-400' : 'text-slate-200'}`}>
                          {staff.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">{formatRole(staff.designation || staff.roleName || staff.primaryRole)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          staff.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {staff.status}
                      </span>

                      {isSelf ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> You (Protected)
                        </span>
                      ) : targetRank >= 100 ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" /> Root Owner
                        </span>
                      ) : !isEditable ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Peer / Higher Rank
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        Franchise:
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                        {staff.franchiseName || 'Assigned Branch'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                        Permissions Granted:
                      </span>
                      <span
                        className={`font-bold ${
                          hasFullAccess
                            ? 'text-amber-400'
                            : permissionsCount > 0
                            ? 'text-orange-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {permissionsCount} / {totalPossiblePermissions}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar for Permissions */}
                  <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        hasFullAccess
                          ? 'bg-amber-400'
                          : permissionsCount > 0
                          ? 'bg-orange-500'
                          : 'bg-slate-700'
                      }`}
                      style={{ width: `${(permissionsCount / totalPossiblePermissions) * 100}%` }}
                    />
                  </div>

                  <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                    <span className="text-slate-400 truncate max-w-[180px]">{staff.email}</span>
                    {isEditable ? (
                      <span className="text-orange-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Customize Matrix →
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-500" /> View Only
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* 4. FULL 91-PERMISSION IAM MATRIX & PREVIEW MODAL */}
      {isAccessModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedStaff.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedStaff.designation} • {selectedStaff.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAccessModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Selector Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-3 gap-3">
              <button
                onClick={() => setShowPreviewStep(false)}
                className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  !showPreviewStep
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>1. Select Permissions</span>
                <span className="px-2 py-0.5 text-xs bg-slate-800 text-orange-300 rounded-full">
                  {selectedPermissions.size} / {totalPossiblePermissions}
                </span>
              </button>

              <button
                onClick={() => setShowPreviewStep(true)}
                className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                  showPreviewStep
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>2. Preview Changes</span>
                {(addedPermissionsList.length > 0 || removedPermissionsList.length > 0) && (
                  <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full font-mono">
                    +{addedPermissionsList.length} / -{removedPermissionsList.length}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {formFeedback && (
                <div
                  className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
                    formFeedback.type === 'SUCCESS'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {formFeedback.type === 'SUCCESS' ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span>{formFeedback.message}</span>
                </div>
              )}

              {!showPreviewStep ? (
                /* STEP 1: 91-PERMISSION MATRIX */
                <div className="space-y-6">
                  {/* Franchise Location Assignment & Change Franchise */}
                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-orange-400" />
                        Assigned Franchise Location
                      </label>
                      <span className="text-xs font-semibold text-orange-400 flex items-center gap-1 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                        <MapPin className="w-3.5 h-3.5" />
                        Change Franchise
                      </span>
                    </div>

                    <div className="relative">
                      <select
                        value={assignedFranchiseId}
                        onChange={(e) => setAssignedFranchiseId(e.target.value)}
                        className="w-full bg-slate-800 text-white text-sm font-medium border border-slate-700 rounded-xl px-3.5 py-2.5 pr-9 appearance-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
                      >
                        {franchises.map((f) => (
                          <option key={f.id} value={f.id}>
                            📍 {f.name} — {f.address}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {selectedStaff && selectedStaff.franchiseId !== assignedFranchiseId && (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>
                          Transferring employee location to{' '}
                          <strong className="text-white underline">
                            {franchises.find((f) => f.id === assignedFranchiseId)?.name || assignedFranchiseId}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Search Permissions & Global Actions Toolbar */}
                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search any of the 91 permissions (e.g. orders, kitchen, kds, bill, menu, table, gst)..."
                          value={permissionSearchQuery}
                          onChange={(e) => setPermissionSearchQuery(e.target.value)}
                          className="w-full bg-slate-800 text-white text-xs border border-slate-700 rounded-xl pl-9 pr-8 py-2.5 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        {permissionSearchQuery && (
                          <button
                            onClick={() => setPermissionSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSelectAllGlobal}
                          className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/40 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                          <span>Select All (91)</span>
                        </button>
                        <button
                          onClick={handleClearAllGlobal}
                          className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/40 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <Square className="w-4 h-4 text-rose-400" />
                          <span>Clear All (0)</span>
                        </button>
                      </div>
                    </div>

                    {permissionSearchQuery && (
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>Showing matching options across categories for "{permissionSearchQuery}"</span>
                        <button
                          onClick={() => setPermissionSearchQuery('')}
                          className="text-orange-400 hover:underline text-[11px]"
                        >
                          Clear Search
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Category-Wise 91-Permission Matrix */}
                  <div className="space-y-4">
                    {filteredCategories.map((cat) => {
                      const allCatPerms = permissions.filter((p) => p.category === cat.key);
                      const isSearching = Boolean(permissionSearchQuery.trim());
                      const q = permissionSearchQuery.toLowerCase();
                      
                      // In search mode, filter items within the category
                      const catPerms = isSearching
                        ? allCatPerms.filter(
                            (p) =>
                              p.name.toLowerCase().includes(q) ||
                              p.id.toLowerCase().includes(q) ||
                              p.description.toLowerCase().includes(q) ||
                              p.categoryLabel.toLowerCase().includes(q)
                          )
                        : allCatPerms;

                      if (catPerms.length === 0) return null;

                      const isExpanded = isSearching ? true : (expandedCategories[cat.key] ?? true);
                      const selectedInCat = allCatPerms.filter((p) => selectedPermissions.has(p.id)).length;
                      const allSelectedInCat = allCatPerms.length > 0 && selectedInCat === allCatPerms.length;

                      return (
                        <div
                          key={cat.key}
                          className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
                        >
                          {/* Category Header with Both Select All and Clear All Options */}
                          <div
                            onClick={() => toggleCategoryExpand(cat.key)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3.5 bg-slate-900/90 hover:bg-slate-800/80 cursor-pointer border-b border-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-orange-400 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              )}
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                  <span>{cat.label}</span>
                                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-orange-300 border border-slate-700 rounded-full">
                                    {selectedInCat} / {allCatPerms.length} Selected
                                  </span>
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">{cat.description}</p>
                              </div>
                            </div>

                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 self-end sm:self-auto"
                            >
                              <button
                                onClick={() => handleSelectAllCategory(cat.key)}
                                className="text-xs font-semibold px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Select All</span>
                              </button>
                              <button
                                onClick={() => handleClearAllCategory(cat.key)}
                                className="text-xs font-semibold px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg border border-rose-500/30 transition-all flex items-center gap-1"
                              >
                                <X className="w-3 h-3 text-rose-400" />
                                <span>Clear All</span>
                              </button>
                            </div>
                          </div>

                          {/* Category Permissions Checkboxes */}
                          {isExpanded && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {catPerms.map((perm) => {
                                const isChecked = selectedPermissions.has(perm.id);
                                const canDelegate = canActorDelegatePermission(perm.id);

                                if (!canDelegate) {
                                  return (
                                    <div
                                      key={perm.id}
                                      className="flex items-start gap-3 p-3 rounded-xl border opacity-50 bg-slate-950/40 border-slate-900 text-slate-500 cursor-not-allowed select-none"
                                      title="You can only delegate permissions that your account holds. Contact the Restaurant Owner to grant this permission."
                                    >
                                      <div className="mt-0.5 p-1 rounded bg-slate-800 text-slate-500">
                                        <Lock className="w-3 h-3" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs font-bold text-slate-500 line-through">
                                            {perm.name}
                                          </span>
                                          <span className="text-[9px] font-semibold text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                                            <Lock className="w-2.5 h-2.5" /> Owner Authority
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                          {perm.description}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={perm.id}
                                    onClick={() => handleTogglePermission(perm.id)}
                                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                      isChecked
                                        ? 'bg-orange-500/10 border-orange-500/50 text-white shadow-sm'
                                        : 'bg-slate-900/50 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleTogglePermission(perm.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-0.5 w-4 h-4 rounded border-slate-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900 cursor-pointer flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className={`text-xs font-bold ${isChecked ? 'text-orange-300' : 'text-white'}`}>
                                          {perm.name}
                                        </span>
                                        <code className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded flex-shrink-0">
                                          {perm.id}
                                        </code>
                                      </div>
                                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                        {perm.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* STEP 2: REVIEW & PREVIEW CHANGES */
                <div className="space-y-6">
                  {/* Step Header */}
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Review & Preview Access Changes</span>
                      <span className="text-xs text-orange-400 font-normal">
                        ({selectedStaff.name} • {selectedStaff.designation})
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verify the added, removed, and final permission state before committing access.
                    </p>
                  </div>

                  {/* Franchise Location Transfer Banner (if changed) */}
                  {selectedStaff && selectedStaff.franchiseId !== assignedFranchiseId && (
                    <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                            Franchise Location Transfer
                          </span>
                          <span className="text-xs text-slate-300 mt-0.5 block">
                            {selectedStaff.franchiseName || 'Current Location'} →{' '}
                            <strong className="text-white font-bold underline">
                              {franchises.find((f) => f.id === assignedFranchiseId)?.name || assignedFranchiseId}
                            </strong>
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl">
                        LOCATION UPDATED
                      </span>
                    </div>
                  )}

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                      <span className="text-xs font-semibold text-slate-400 block">CURRENT PERMISSIONS</span>
                      <span className="text-2xl font-bold text-slate-200 mt-1 block">
                        {currentPermissionsList.length}
                      </span>
                    </div>

                    <div className="bg-emerald-950/40 border border-emerald-800/50 p-4 rounded-2xl">
                      <span className="text-xs font-semibold text-emerald-400 block">PERMISSIONS ADDED</span>
                      <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                        +{addedPermissionsList.length}
                      </span>
                    </div>

                    <div className="bg-rose-950/40 border border-rose-800/50 p-4 rounded-2xl">
                      <span className="text-xs font-semibold text-rose-400 block">PERMISSIONS REMOVED</span>
                      <span className="text-2xl font-bold text-rose-400 mt-1 block">
                        -{removedPermissionsList.length}
                      </span>
                    </div>

                    <div className="bg-orange-950/40 border border-orange-800/50 p-4 rounded-2xl">
                      <span className="text-xs font-semibold text-orange-400 block">FINAL ACCESS</span>
                      <span className="text-2xl font-bold text-orange-400 mt-1 block">
                        {selectedPermissions.size} / {totalPossiblePermissions}
                      </span>
                    </div>
                  </div>

                  {/* Added Permissions Section */}
                  {addedPermissionsList.length > 0 && (
                    <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Permissions to be Added (+{addedPermissionsList.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {addedPermissionsList.map((pId) => {
                          const p = permissionMap.get(pId);
                          return (
                            <div
                              key={pId}
                              className="p-3 bg-emerald-900/30 border border-emerald-700/50 rounded-xl text-xs flex items-center justify-between gap-2"
                            >
                              <div>
                                <span className="font-bold text-emerald-200 block">+ {p?.name || pId}</span>
                                <span className="text-[10px] text-emerald-400 block">{p?.description}</span>
                              </div>
                              <code className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded flex-shrink-0">
                                {pId}
                              </code>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Removed Permissions Section */}
                  {removedPermissionsList.length > 0 && (
                    <div className="bg-rose-950/20 border border-rose-800/40 rounded-2xl p-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        Permissions to be Removed (-{removedPermissionsList.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {removedPermissionsList.map((pId) => {
                          const p = permissionMap.get(pId);
                          return (
                            <div
                              key={pId}
                              className="p-3 bg-rose-900/30 border border-rose-700/50 rounded-xl text-xs flex items-center justify-between gap-2"
                            >
                              <div>
                                <span className="font-bold text-rose-200 block">− {p?.name || pId}</span>
                                <span className="text-[10px] text-rose-400 block">{p?.description}</span>
                              </div>
                              <code className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded flex-shrink-0">
                                {pId}
                              </code>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Current Retained Permissions Section */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Continuing / Retained Permissions ({retainedPermissionsList.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2.5 bg-slate-900 rounded-xl">
                      {retainedPermissionsList.length === 0 ? (
                        <span className="text-xs text-slate-500">No continuing permissions</span>
                      ) : (
                        retainedPermissionsList.map((pId) => {
                          const p = permissionMap.get(pId);
                          return (
                            <span
                              key={pId}
                              className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700 font-medium"
                              title={pId}
                            >
                              {p?.name || pId}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Audit Reason Input */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Reason for Access Change (Activity History)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Assigned floor operations and customer ordering matrix by Root Owner"
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      className="w-full bg-slate-800 text-white text-sm border border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800">
              <button
                onClick={() => setIsAccessModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                {!showPreviewStep ? (
                  <button
                    onClick={() => setShowPreviewStep(true)}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2"
                  >
                    <span>Review & Preview Changes</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowPreviewStep(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Matrix</span>
                    </button>

                    <button
                      onClick={handleConfirmAndShareAccess}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>CONFIRM & SHARE ACCESS</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ATTACH PROVISIONED USER MODAL */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Link Existing Staff Account</h3>
                  <p className="text-xs text-slate-400">Attach existing DINEDECK account to restaurant</p>
                </div>
              </div>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  formFeedback.type === 'SUCCESS'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}
              >
                {formFeedback.type === 'SUCCESS' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{formFeedback.message}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">
                  User ID or Verified Email *
                </label>
                <input
                  type="text"
                  placeholder="e.g. captain.ramesh@punjabheritage.in or usr_abc123"
                  value={attachUserIdOrEmail}
                  onChange={(e) => setAttachUserIdOrEmail(e.target.value)}
                  className="w-full bg-slate-800 text-white text-sm border border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Floor Captain"
                  value={attachDesignation}
                  onChange={(e) => setAttachDesignation(e.target.value)}
                  className="w-full bg-slate-800 text-white text-sm border border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">
                  Assigned Franchise Location
                </label>
                <select
                  value={attachFranchiseId}
                  onChange={(e) => setAttachFranchiseId(e.target.value)}
                  className="w-full bg-slate-800 text-white text-sm border border-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">🏢 All Franchises</option>
                  {franchises.map((f) => (
                    <option key={f.id} value={f.id}>
                      📍 {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-sm rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAttachUser}
                disabled={isSubmitting}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-600/25 flex items-center gap-2"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Link & Grant Access</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SECURITY AUDIT LOG DRAWER */}
      {isAuditDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 p-6 h-full overflow-y-auto flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Staff Access Activity History</h3>
                  <p className="text-xs text-slate-400">Chronological history of user permission changes</p>
                </div>
              </div>
              <button onClick={() => setIsAuditDrawerOpen(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No activity events recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => {
                  let afterData: any = null;
                  try {
                    if (log.afterJson) afterData = JSON.parse(log.afterJson);
                  } catch (e) {
                    afterData = log.afterJson;
                  }

                  return (
                    <div key={log.id} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-orange-400 font-bold">{log.action}</span>
                        <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Actor: <span className="font-semibold text-white">{log.actor?.name || log.actor?.role || 'ROOT'}</span> {log.actor?.email ? `(${log.actor.email})` : ''}
                      </p>
                      {log.scope && (
                        <p className="text-xs text-slate-400 font-mono">Scope: {log.scope}</p>
                      )}
                      {afterData && (
                        <div className="bg-slate-900 p-2 rounded-lg text-[11px] font-mono text-slate-300 space-y-1">
                          {afterData.reason && <div>Reason: "{afterData.reason}"</div>}
                          {afterData.permissionsCount !== undefined && (
                            <div>Final Permissions: <span className="text-orange-400 font-bold">{afterData.permissionsCount}</span> / 91</div>
                          )}
                          {afterData.addedPermissions?.length > 0 && (
                            <div className="text-emerald-400">Added: {afterData.addedPermissions.join(', ')}</div>
                          )}
                          {afterData.removedPermissions?.length > 0 && (
                            <div className="text-rose-400">Removed: {afterData.removedPermissions.join(', ')}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
