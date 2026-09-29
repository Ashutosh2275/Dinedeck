import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/db.js';
import { iamService } from './iam.service.js';
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES, ROLE_TEMPLATES, calculateMaxRank, ROLE_HIERARCHY_RANK } from './iam.constants.js';

export const iamRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // 1. Get All Permissions Organized by Category
  server.get('/permissions', async (request, reply) => {
    return reply.send({
      success: true,
      categories: PERMISSION_CATEGORIES,
      count: ALL_PERMISSIONS.length,
      data: ALL_PERMISSIONS
    });
  });

  // 2. Get All Roles (Templates + Custom)
  server.get('/roles', async (request, reply) => {
    const query = request.query as any;
    const restaurantId = query.restaurantId;

    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { isSystem: true },
          { restaurantId: restaurantId || undefined }
        ]
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    const formatted = roles.map((r: any) => {
      const template = (ROLE_TEMPLATES as any)[r.id];
      return {
        id: r.id,
        name: template?.name || r.name,
        badgeColor: template?.badgeColor || 'bg-slate-500/20 text-slate-400 border-slate-500/40',
        description: template?.description || r.description,
        isSystem: r.isSystem,
        restaurantId: r.restaurantId,
        permissions: r.permissions.map((p: any) => p.permissionId)
      };
    });

    return reply.send({ success: true, count: formatted.length, data: formatted });
  });

  // 3. Get Current User Effective Permissions & Scopes (Dynamic UI Adaptor)
  server.get('/me', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    if (!userAuth) {
      return reply.status(401).send({ success: false, error: 'Unauthenticated' });
    }

    const query = request.query as any;
    const targetRestaurantId = query.restaurantId || userAuth.restaurantId;

    const { permissions, roles, scopes } = await iamService.getEffectivePermissions(
      userAuth.id,
      targetRestaurantId,
      query.branchId
    );

    return reply.send({
      success: true,
      data: {
        userId: userAuth.id,
        email: userAuth.email,
        name: userAuth.name,
        role: userAuth.role,
        assignedRoles: roles,
        permissions: Array.from(permissions),
        scopes
      }
    });
  });

  // 3.5. List Franchises / Locations for Restaurant (Root User Multi-Franchise Authority)
  server.get('/franchises', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;

    if (!restaurantId && userAuth.role !== 'DINEDECK_SUPER_ADMIN') {
      return reply.status(400).send({ success: false, message: 'restaurantId context is required' });
    }

    const branches = await prisma.restaurantBranch.findMany({
      where: restaurantId ? { restaurantId } : {},
      include: {
        _count: {
          select: { tables: true, userRoles: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return reply.send({
      success: true,
      count: branches.length,
      data: branches.map((b: any) => ({
        id: b.id,
        restaurantId: b.restaurantId,
        name: b.name,
        address: b.address,
        phone: b.phone,
        isActive: b.isActive,
        tableCount: b._count?.tables || 0,
        staffCount: b._count?.userRoles || 0
      }))
    });
  });

  // 4. List Staff Members for Restaurant with Comprehensive Access Details
  server.get('/staff', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;
    const franchiseFilter = query.branchId || query.franchiseId;

    if (!restaurantId && userAuth.role !== 'DINEDECK_SUPER_ADMIN') {
      return reply.status(400).send({ success: false, message: 'restaurantId context is required' });
    }

    // Check authorization: must have 'staff.read'
    const authRes = await iamService.authorize(userAuth, 'staff.read', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    // Fetch branches lookup for readable names
    const allBranches = await prisma.restaurantBranch.findMany({
      where: { restaurantId }
    });
    const branchNameMap = new Map<string, string>();
    allBranches.forEach(b => branchNameMap.set(b.id, b.name));

    const actorEffective = await iamService.getEffectivePermissions(userAuth.id, restaurantId);
    const actorRank = calculateMaxRank(actorEffective.roles);
    const isOwnerOrSuper = actorRank >= 100 || userAuth.role === 'DINEDECK_SUPER_ADMIN';

    // Find actor's branch from user or scopes
    const actorBranchScope = actorEffective.scopes?.find((s: any) => s.type === 'BRANCH')?.value;
    const actorBranchId = userAuth.branchId || actorBranchScope;

    const staffMembers = await prisma.user.findMany({
      where: {
        role: { notIn: ['CUSTOMER', 'RESTAURANT_OWNER', 'DINEDECK_SUPER_ADMIN'] },
        OR: [
          { staffProfile: { restaurantId } },
          { userRoles: { some: { restaurantId } } }
        ]
      },
      include: {
        staffProfile: {
          include: {
            restaurant: {
              include: { branches: true }
            }
          }
        },
        userRoles: {
          where: {
            OR: [
              { restaurantId: null },
              { restaurantId }
            ]
          },
          include: {
            role: {
              include: {
                permissions: true
              }
            },
            scopes: true
          }
        },
        permissionOverrides: {
          where: {
            OR: [
              { restaurantId: null },
              { restaurantId }
            ]
          },
          include: {
            permission: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const formatted = staffMembers.map((s: any) => {
      const primaryRole = s.userRoles[0]?.roleId || s.role || 'CUSTOM';
      const roleTemplate = (ROLE_TEMPLATES as any)[primaryRole];

      // Calculate effective permissions
      const basePerms = new Set<string>();
      for (const ur of s.userRoles) {
        for (const rp of ur.role?.permissions || []) {
          basePerms.add(rp.permissionId);
        }
      }
      for (const po of s.permissionOverrides) {
        if (po.isGranted) {
          basePerms.add(po.permissionId);
        } else {
          basePerms.delete(po.permissionId);
        }
      }

      // Collect scopes
      const allScopes = s.userRoles.flatMap((ur: any) => ur.scopes || []).map((sc: any) => ({
        type: sc.scopeType,
        value: sc.scopeValue
      }));

      const rawBranchScope = allScopes.find((sc: any) => sc.type === 'BRANCH')?.value || s.userRoles[0]?.branchId;
      const effectiveBranchId = s.branchId || rawBranchScope;
      const effectiveBranchName = effectiveBranchId ? (branchNameMap.get(effectiveBranchId) || effectiveBranchId) : 'All Franchises';
      const floorScope = allScopes.find((sc: any) => sc.type === 'FLOOR')?.value || 'ALL';
      const tableScope = allScopes.find((sc: any) => sc.type === 'TABLE')?.value || 'ALL';

      const isActive = s.staffProfile?.isActive ?? true;
      const status = !isActive ? (s.staffProfile?.designation?.includes('REVOKED') ? 'REVOKED' : 'SUSPENDED') : 'ACTIVE';

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone || '',
        avatarUrl: s.avatarUrl,
        designation: s.staffProfile?.designation || roleTemplate?.name || primaryRole,
        primaryRole,
        roleName: roleTemplate?.name || 'Custom Staff Access',
        badgeColor: roleTemplate?.badgeColor || 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
        status,
        isActive,
        isRootOwner: s.role === 'RESTAURANT_OWNER' || primaryRole === 'RESTAURANT_OWNER',
        franchiseId: effectiveBranchId,
        franchiseName: effectiveBranchName,
        branchId: effectiveBranchId,
        floorScope: s.userRoles[0]?.scopes?.find((sc: any) => sc.scopeType === 'FLOOR')?.scopeValue || 'ALL',
        tableScope: s.userRoles[0]?.scopes?.find((sc: any) => sc.scopeType === 'TABLE')?.scopeValue || 'ALL',
        stationScope: s.userRoles[0]?.scopes?.find((sc: any) => sc.scopeType === 'STATION')?.scopeValue || 'ALL',
        departmentScope: s.userRoles[0]?.scopes?.find((sc: any) => sc.scopeType === 'DEPARTMENT')?.scopeValue || 'ALL',
        shiftScope: s.userRoles[0]?.scopes?.find((sc: any) => sc.scopeType === 'SHIFT')?.scopeValue || 'ALL',
        scopes: (s.userRoles[0]?.scopes || []).map((sc: any) => ({
          type: sc.scopeType,
          value: sc.scopeValue
        })),
        permissionsCount: basePerms.size,
        totalPermissionsCount: ALL_PERMISSIONS.length,
        effectivePermissions: Array.from(basePerms),
        overrides: s.permissionOverrides.map((po: any) => ({
          permissionId: po.permissionId,
          isGranted: po.isGranted
        })),
        lastActive: s.updatedAt || s.createdAt
      };
    }).filter((staff: any) => {
      // If not Owner / SuperAdmin, strictly isolate to actor's branch
      if (!isOwnerOrSuper && actorBranchId) {
        return staff.franchiseId === actorBranchId || staff.branchId === actorBranchId;
      }
      if (!franchiseFilter || franchiseFilter === 'ALL') return true;
      return staff.franchiseId === franchiseFilter || staff.branchId === franchiseFilter;
    });

    return reply.send({ success: true, count: formatted.length, data: formatted });
  });


  // 5. Attach / Provision Access for a DINEDECK User ID to Restaurant
  server.post('/staff/attach', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const body = request.body as {
      restaurantId: string;
      userIdOrEmail: string;
      roleId?: string;
      designation?: string;
      branchId?: string;
      floorScope?: string;
      tableScope?: string;
      stationScope?: string;
      departmentScope?: string;
      shiftScope?: string;
      permissions: string[];
      reason?: string;
    };

    const {
      restaurantId,
      userIdOrEmail,
      roleId = 'SUPPORT_VIEW_ONLY',
      designation,
      branchId,
      floorScope,
      tableScope,
      stationScope,
      departmentScope,
      shiftScope,
      permissions = [],
      reason
    } = body;

    // Authorization
    const authRes = await iamService.authorize(userAuth, 'staff.assign_role', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    // Find User by ID or Email
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userIdOrEmail },
          { email: userIdOrEmail }
        ]
      }
    });

    if (!targetUser) {
      return reply.status(404).send({
        success: false,
        message: `Provisioned user '${userIdOrEmail}' was not found on DINEDECK. Ensure the user account exists before attaching.`
      });
    }

    // Prevent privilege escalation: Cannot grant super admin
    if (roleId === 'DINEDECK_SUPER_ADMIN' || roleId === 'SUPER_ADMIN') {
      return reply.status(403).send({
        success: false,
        message: 'Security Violation: Cannot grant platform super admin access.'
      });
    }

    // Tree-wise Hierarchy Verification
    const actorEffective = await iamService.getEffectivePermissions(userAuth.id, restaurantId);
    const actorRank = calculateMaxRank(actorEffective.roles);
    const targetRoleRank = calculateMaxRank([roleId]);

    if (actorRank <= targetRoleRank && userAuth.role !== 'DINEDECK_SUPER_ADMIN') {
      return reply.status(403).send({
        success: false,
        message: `Hierarchy Violation: Your role authority level (${actorRank}) cannot provision a staff member at or above your tier level (${targetRoleRank}).`
      });
    }

    // Link RestaurantStaff profile
    await prisma.restaurantStaff.upsert({
      where: { userId: targetUser.id },
      update: {
        restaurantId,
        designation: designation || 'Staff Member',
        isActive: true
      },
      create: {
        userId: targetUser.id,
        restaurantId,
        designation: designation || 'Staff Member',
        isActive: true
      }
    });

    // Build scopes
    const scopesList: Array<{ scopeType: string; scopeValue: string }> = [
      { scopeType: 'RESTAURANT', scopeValue: restaurantId }
    ];
    if (branchId && branchId !== 'ALL') scopesList.push({ scopeType: 'BRANCH', scopeValue: branchId });
    if (floorScope && floorScope !== 'ALL') scopesList.push({ scopeType: 'FLOOR', scopeValue: floorScope });
    if (tableScope && tableScope !== 'ALL') scopesList.push({ scopeType: 'TABLE', scopeValue: tableScope });
    if (stationScope && stationScope !== 'ALL') scopesList.push({ scopeType: 'STATION', scopeValue: stationScope });
    if (departmentScope && departmentScope !== 'ALL') scopesList.push({ scopeType: 'DEPARTMENT', scopeValue: departmentScope });
    if (shiftScope && shiftScope !== 'ALL') scopesList.push({ scopeType: 'SHIFT', scopeValue: shiftScope });

    // Clean old userRoles for this restaurant
    const existingRoles = await prisma.userRole.findMany({
      where: { userId: targetUser.id, restaurantId }
    });
    for (const er of existingRoles) {
      await prisma.roleScope.deleteMany({ where: { userRoleId: er.id } });
    }
    await prisma.userRole.deleteMany({
      where: { userId: targetUser.id, restaurantId }
    });

    const effectiveRoleId = roleId && ROLE_TEMPLATES[roleId] ? roleId : 'SUPPORT_VIEW_ONLY';
    await iamService.assignRoleToUser(targetUser.id, effectiveRoleId, restaurantId, branchId && branchId !== 'ALL' ? branchId : undefined, scopesList);

    // Apply discrete permission overrides
    const templateRole = (ROLE_TEMPLATES as any)[effectiveRoleId];
    const templatePerms = new Set<string>(templateRole?.permissions || []);
    const desiredPerms = new Set<string>(permissions);

    await prisma.userPermissionOverride.deleteMany({
      where: { userId: targetUser.id, restaurantId }
    });

    for (const p of ALL_PERMISSIONS) {
      const inTemplate = templatePerms.has(p.id);
      const inDesired = desiredPerms.has(p.id);

      if (!inTemplate && inDesired) {
        await prisma.userPermissionOverride.create({
          data: { userId: targetUser.id, permissionId: p.id, isGranted: true, restaurantId, branchId: branchId && branchId !== 'ALL' ? branchId : null }
        });
      } else if (inTemplate && !inDesired) {
        await prisma.userPermissionOverride.create({
          data: { userId: targetUser.id, permissionId: p.id, isGranted: false, restaurantId, branchId: branchId && branchId !== 'ALL' ? branchId : null }
        });
      }
    }


    const newEffective = await iamService.getEffectivePermissions(targetUser.id, restaurantId, branchId);
    const newPerms = Array.from(newEffective.permissions);

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: userAuth.role || 'RESTAURANT_OWNER',
      action: 'iam.staff_attach_provision',
      resource: 'staff_access',
      resourceId: targetUser.id,
      scope: `REST:${restaurantId}|USER:${targetUser.id}`,
      before: null,
      after: {
        targetUser: { id: targetUser.id, name: targetUser.name, email: targetUser.email },
        roleId,
        permissionsCount: newPerms.length,
        permissions: newPerms,
        scopes: scopesList,
        reason: reason || 'User provisioned and access shared by Restaurant Owner'
      },
      result: 'SUCCESS'
    });

    return reply.send({
      success: true,
      message: `User '${targetUser.name}' provisioned and access granted successfully`,
      data: {
        userId: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        totalPermissionsCount: newPerms.length
      }
    });
  });

  // 6. Manage Staff Access (Permissions, Scopes, Confirmation)
  server.put('/staff/:id/access', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: targetUserId } = request.params as { id: string };
    const body = request.body as {
      restaurantId: string;
      roleId?: string;
      branchId?: string;
      floorScope?: string;
      tableScope?: string;
      stationScope?: string;
      departmentScope?: string;
      shiftScope?: string;
      permissions: string[]; // Full list of individually granted permissions
      reason?: string;
    };

    const {
      restaurantId,
      roleId = 'CUSTOM',
      branchId,
      floorScope,
      tableScope,
      stationScope,
      departmentScope,
      shiftScope,
      permissions,
      reason
    } = body;

    // Authorization check
    const authRes = await iamService.authorize(userAuth, 'staff.assign_role', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    // Tenant Isolation Check
    if (userAuth.role !== 'DINEDECK_SUPER_ADMIN' && userAuth.restaurantId && userAuth.restaurantId !== restaurantId) {
      return reply.status(403).send({ success: false, message: 'Tenant Isolation: Cannot modify staff outside your assigned restaurant' });
    }

    // Root User Safety Check: Cannot remove root owner's own authority
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { userRoles: true }
    });
    if (!targetUser) {
      return reply.status(404).send({ success: false, message: 'Target staff user not found' });
    }

    if (targetUser.id === userAuth.id && (targetUser.role === 'RESTAURANT_OWNER' || targetUser.userRoles.some((r: any) => r.roleId === 'RESTAURANT_OWNER'))) {
      if (roleId !== 'RESTAURANT_OWNER') {
        return reply.status(400).send({
          success: false,
          message: 'Root User Safety: The Root Restaurant Owner cannot demote or remove their own root ownership authority.'
        });
      }
    }

    // Prevent granting platform-level roles
    if (roleId === 'DINEDECK_SUPER_ADMIN' || roleId === 'SUPER_ADMIN') {
      return reply.status(403).send({
        success: false,
        message: 'Security Violation: Restaurant owners cannot grant DINEDECK platform-level administrative privileges.'
      });
    }

    // Tree-wise Hierarchy & Self-Modification Verification
    const actorEffective = await iamService.getEffectivePermissions(userAuth.id, restaurantId);
    const actorRank = calculateMaxRank(actorEffective.roles);
    const targetEffective = await iamService.getEffectivePermissions(targetUserId, restaurantId);
    const targetRank = calculateMaxRank(targetEffective.roles);

    // Rule 1: Cannot edit self (unless super admin)
    if (targetUserId === userAuth.id && userAuth.role !== 'DINEDECK_SUPER_ADMIN') {
      return reply.status(403).send({
        success: false,
        message: 'Self-Modification Prohibited: Staff accounts cannot modify their own permissions. Contact the Restaurant Owner.'
      });
    }

    // Rule 2: Cannot edit staff at or above own hierarchy rank
    if (actorRank <= targetRank && userAuth.role !== 'DINEDECK_SUPER_ADMIN') {
      return reply.status(403).send({
        success: false,
        message: `Hierarchy Violation: Your role authority (${actorRank}) cannot modify a staff member with equal or higher rank (${targetRank}).`
      });
    }

    // Rule 3: Permission Sub-Delegation Enforcement (Can only grant what actor possesses)
    if (actorRank < 100 && userAuth.role !== 'DINEDECK_SUPER_ADMIN' && permissions && Array.isArray(permissions)) {
      const unauthorizedPerms = permissions.filter((p) => !actorEffective.permissions.has(p) && !actorEffective.permissions.has('ALL'));
      if (unauthorizedPerms.length > 0) {
        return reply.status(403).send({
          success: false,
          message: `Sub-delegation Violation: You cannot grant permissions (${unauthorizedPerms.slice(0, 3).join(', ')}) that your account does not hold.`
        });
      }
    }

    // Rule 4: Branch Isolation Enforcement (General Managers can only modify staff within their branch)
    if (actorRank < 100 && userAuth.role !== 'DINEDECK_SUPER_ADMIN') {
      const actorBranchScope = actorEffective.scopes?.find((s: any) => s.type === 'BRANCH')?.value;
      const actorBranchId = userAuth.branchId || actorBranchScope;

      const targetBranchScope = targetEffective.scopes?.find((s: any) => s.type === 'BRANCH')?.value;
      const targetBranchId = (targetUser as any).branchId || targetBranchScope;

      if (actorBranchId && targetBranchId && actorBranchId !== targetBranchId) {
        return reply.status(403).send({
          success: false,
          message: 'Branch Isolation Violation: You can only modify staff belonging to your assigned branch.'
        });
      }
    }

    // Capture old state for audit log
    const oldEffective = targetEffective;
    const oldRoles = oldEffective.roles;
    const oldPerms = Array.from(oldEffective.permissions);

    // 1. Assign Scopes
    const scopesList: Array<{ scopeType: string; scopeValue: string }> = [
      { scopeType: 'RESTAURANT', scopeValue: restaurantId }
    ];
    if (branchId && branchId !== 'ALL') {
      scopesList.push({ scopeType: 'BRANCH', scopeValue: branchId });
    }
    if (floorScope && floorScope !== 'ALL') {
      scopesList.push({ scopeType: 'FLOOR', scopeValue: floorScope });
    }
    if (tableScope && tableScope !== 'ALL') {
      scopesList.push({ scopeType: 'TABLE', scopeValue: tableScope });
    }
    if (stationScope && stationScope !== 'ALL') {
      scopesList.push({ scopeType: 'STATION', scopeValue: stationScope });
    }
    if (departmentScope && departmentScope !== 'ALL') {
      scopesList.push({ scopeType: 'DEPARTMENT', scopeValue: departmentScope });
    }
    if (shiftScope && shiftScope !== 'ALL') {
      scopesList.push({ scopeType: 'SHIFT', scopeValue: shiftScope });
    }

    // Clean up existing roleScopes and userRoles for this restaurant
    const existingRoles = await prisma.userRole.findMany({
      where: {
        userId: targetUserId,
        restaurantId
      }
    });
    for (const er of existingRoles) {
      await prisma.roleScope.deleteMany({ where: { userRoleId: er.id } });
    }
    await prisma.userRole.deleteMany({
      where: {
        userId: targetUserId,
        restaurantId
      }
    });

    const effectiveRoleId = roleId && ROLE_TEMPLATES[roleId] ? roleId : 'SUPPORT_VIEW_ONLY';
    await iamService.assignRoleToUser(targetUserId, effectiveRoleId, restaurantId, branchId && branchId !== 'ALL' ? branchId : undefined, scopesList);

    // 2. Process Custom Permission Overrides (Explicit Individual Permissions)
    if (permissions && Array.isArray(permissions)) {
      const templateRole = (ROLE_TEMPLATES as any)[effectiveRoleId];
      const templatePerms = new Set<string>(templateRole?.permissions || []);
      const desiredPerms = new Set<string>(permissions);

      // Clear existing overrides for this restaurant context
      await prisma.userPermissionOverride.deleteMany({
        where: {
          userId: targetUserId,
          restaurantId
        }
      });

      // Add overrides where desired differs from template
      for (const p of ALL_PERMISSIONS) {
        const inTemplate = templatePerms.has(p.id);
        const inDesired = desiredPerms.has(p.id);

        if (!inTemplate && inDesired) {
          // Explicit Grant
          await prisma.userPermissionOverride.create({
            data: {
              userId: targetUserId,
              permissionId: p.id,
              isGranted: true,
              restaurantId,
              branchId: branchId && branchId !== 'ALL' ? branchId : null
            }
          });
        } else if (inTemplate && !inDesired) {
          // Explicit Deny
          await prisma.userPermissionOverride.create({
            data: {
              userId: targetUserId,
              permissionId: p.id,
              isGranted: false,
              restaurantId,
              branchId: branchId && branchId !== 'ALL' ? branchId : null
            }
          });
        }
      }
    }


    // Capture new state
    const newEffective = await iamService.getEffectivePermissions(targetUserId, restaurantId, branchId);
    const newPerms = Array.from(newEffective.permissions);

    const addedPerms = newPerms.filter(p => !oldPerms.includes(p));
    const removedPerms = oldPerms.filter(p => !newPerms.includes(p));
    const retainedPerms = oldPerms.filter(p => newPerms.includes(p));

    // 3. Record Authoritative Audit Event
    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: userAuth.role || 'RESTAURANT_OWNER',
      action: 'iam.staff_access_update',
      resource: 'staff_access',
      resourceId: targetUserId,
      scope: `REST:${restaurantId}|USER:${targetUserId}`,
      before: {
        roles: oldRoles,
        permissionsCount: oldPerms.length,
        permissions: oldPerms
      },
      after: {
        roleId: effectiveRoleId,
        roles: newEffective.roles,
        permissionsCount: newPerms.length,
        totalPermissionsCount: newPerms.length,
        addedPermissions: addedPerms,
        removedPermissions: removedPerms,
        retainedPermissions: retainedPerms,
        scopes: scopesList,
        reason: reason || 'Access configuration updated via Restaurant IAM'
      },
      result: 'SUCCESS'
    });

    return reply.send({
      success: true,
      message: `Access configuration successfully confirmed & shared for staff member '${targetUser.name}'`,
      data: {
        userId: targetUserId,
        roleId: effectiveRoleId,
        addedPermissionsCount: addedPerms.length,
        removedPermissionsCount: removedPerms.length,
        retainedPermissionsCount: retainedPerms.length,
        totalPermissionsCount: newPerms.length,
        effectivePermissions: newPerms
      }
    });
  });


  // 6. Toggle Staff Access State (ACTIVE, SUSPENDED, REVOKED)
  server.patch('/staff/:id/status', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const { id: targetUserId } = request.params as { id: string };
    const body = request.body as {
      status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
      restaurantId: string;
      reason?: string;
    };

    const { status, restaurantId, reason } = body;

    const authRes = await iamService.authorize(userAuth, 'staff.suspend', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return reply.status(404).send({ success: false, message: 'Staff member not found' });
    }

    // Root safety
    if (targetUser.id === userAuth.id && targetUser.role === 'RESTAURANT_OWNER') {
      return reply.status(400).send({
        success: false,
        message: 'Root User Safety: You cannot suspend or revoke the root restaurant owner account.'
      });
    }

    const isActive = status === 'ACTIVE';

    await prisma.restaurantStaff.updateMany({
      where: {
        userId: targetUserId,
        restaurantId
      },
      data: {
        isActive,
        designation: status === 'REVOKED' ? `[REVOKED] Staff Account` : undefined
      }
    });

    await iamService.logAuditEvent({
      actorId: userAuth.id,
      actorRole: userAuth.role,
      action: `staff.${status.toLowerCase()}`,
      resource: 'staff_status',
      resourceId: targetUserId,
      scope: `REST:${restaurantId}`,
      before: { targetName: targetUser.name },
      after: {
        status,
        isActive,
        reason: reason || `Staff status updated to ${status}`
      },
      result: 'SUCCESS'
    });

    return reply.send({
      success: true,
      message: `Staff member '${targetUser.name}' access state set to ${status}`,
      data: {
        userId: targetUserId,
        status,
        isActive
      }
    });
  });

  // 7. Query Restaurant IAM Audit Logs
  server.get('/audit-logs', { preHandler: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userAuth = (request as any).user;
    const query = request.query as any;
    const restaurantId = query.restaurantId || userAuth.restaurantId;

    const authRes = await iamService.authorize(userAuth, 'audit.read', { restaurantId });
    if (!authRes.authorized) {
      return reply.status(authRes.statusCode).send({ success: false, error: authRes.reason });
    }

    const logs = await prisma.auditLog.findMany({
      where: restaurantId ? {
        scope: { contains: restaurantId }
      } : {},
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return reply.send({ success: true, count: logs.length, data: logs });
  });
};
