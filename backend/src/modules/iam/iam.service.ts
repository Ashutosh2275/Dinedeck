import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db.js';
import { ALL_PERMISSIONS, ROLE_TEMPLATES } from './iam.constants.js';

export interface ScopeContext {
  restaurantId?: string;
  branchId?: string;
  tableNumber?: string;
  floor?: string;
  department?: string;
}

export interface AuthorizationResult {
  authorized: boolean;
  statusCode: number;
  reason?: string;
  effectivePermissions?: string[];
  effectiveRoles?: string[];
  scopes?: Array<{ type: string; value: string }>;
}

export class IamService {
  /**
   * Seed all standard permissions, role templates, and link them
   */
  async seedIamDefinitions(): Promise<void> {
    console.log('[IAM] Seeding IAM Permissions and Role Templates...');

    // 1. Seed Permissions
    for (const p of ALL_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { id: p.id },
        update: {
          resource: p.resource,
          action: p.action,
          category: p.category,
          description: p.description
        },
        create: {
          id: p.id,
          resource: p.resource,
          action: p.action,
          category: p.category,
          description: p.description
        }
      });
    }

    // 2. Seed Role Templates & RolePermissions
    for (const [roleKey, roleDef] of Object.entries(ROLE_TEMPLATES)) {
      await prisma.role.upsert({
        where: { id: roleKey },
        update: {
          name: roleDef.name,
          description: roleDef.description,
          isSystem: true
        },
        create: {
          id: roleKey,
          name: roleDef.name,
          description: roleDef.description,
          isSystem: true
        }
      });

      // Clear existing RolePermissions and re-link
      await prisma.rolePermission.deleteMany({ where: { roleId: roleKey } });

      for (const permId of roleDef.permissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: roleKey,
            permissionId: permId
          }
        });
      }
    }

    // 3. Link Seed Users to Default Roles & Provision Multi-Tenant Accounts
    const defaultPasswordHash = await bcrypt.hash('Dinedeck@2026', 10);

    // Platform Super Admin
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@dinedeck.in' },
      update: { role: 'DINEDECK_SUPER_ADMIN', passwordHash: defaultPasswordHash },
      create: {
        email: 'superadmin@dinedeck.in',
        name: 'DINEDECK Super Administrator',
        phone: '+919876543210',
        passwordHash: defaultPasswordHash,
        role: 'DINEDECK_SUPER_ADMIN'
      }
    });
    await this.assignRoleToUser(superAdmin.id, 'SUPER_ADMIN', undefined, undefined, [
      { scopeType: 'PLATFORM', scopeValue: 'ALL' }
    ]);

    // Customer
    const customerUser = await prisma.user.upsert({
      where: { email: 'alex.vance@dinedeck.io' },
      update: { role: 'CUSTOMER', passwordHash: defaultPasswordHash },
      create: {
        email: 'alex.vance@dinedeck.io',
        name: 'Alex Vance',
        phone: '+919820123456',
        passwordHash: defaultPasswordHash,
        role: 'CUSTOMER'
      }
    });
    await this.assignRoleToUser(customerUser.id, 'CUSTOMER', undefined, undefined, [
      { scopeType: 'PLATFORM', scopeValue: 'ALL' }
    ]);

    // Restaurant 1: The Punjab Heritage Kitchen
    const rest1 = await prisma.restaurant.findFirst({
      where: { OR: [{ slug: 'punjab-heritage-mumbai' }, { name: { contains: 'Punjab Heritage' } }] }
    });
    const rest1Id = rest1?.id || 'rest_punjab_heritage';

    // Ensure Multiple Franchise Branches exist for Restaurant 1 (e.g. Khandagiri, Kalpana, Porasuni, Flagship)
    const flagshipBranch = await prisma.restaurantBranch.upsert({
      where: { id: `branch_${rest1Id}` },
      update: { name: 'BKC Flagship Location' },
      create: {
        id: `branch_${rest1Id}`,
        restaurantId: rest1Id,
        name: 'BKC Flagship Location',
        address: 'Plot 42, Bandra Kurla Complex, Bandra West, Mumbai',
        phone: '+912226501234'
      }
    });

    // Owner for Restaurant 1 (Harpreet Singh)
    let owner1 = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'owner.punjab@dinedeck.in' },
          { phone: '+919820011000' }
        ]
      }
    });
    if (owner1) {
      owner1 = await prisma.user.update({
        where: { id: owner1.id },
        data: {
          email: 'owner.punjab@dinedeck.in',
          name: 'Harpreet Singh (Owner)',
          phone: '+919820011000',
          role: 'RESTAURANT_OWNER',
          passwordHash: defaultPasswordHash
        }
      });
    } else {
      owner1 = await prisma.user.create({
        data: {
          email: 'owner.punjab@dinedeck.in',
          name: 'Harpreet Singh (Owner)',
          phone: '+919820011000',
          passwordHash: defaultPasswordHash,
          role: 'RESTAURANT_OWNER'
        }
      });
    }

    await prisma.restaurantStaff.upsert({
      where: { userId: owner1.id },
      update: { restaurantId: rest1Id, designation: 'Owner & Superintendent', isActive: true },
      create: { userId: owner1.id, restaurantId: rest1Id, designation: 'Owner & Superintendent', isActive: true }
    });

    await this.assignRoleToUser(owner1.id, 'RESTAURANT_OWNER', rest1Id, flagshipBranch.id, [
      { scopeType: 'RESTAURANT', scopeValue: rest1Id }
    ]);

    const khandagiriBranch = await prisma.restaurantBranch.upsert({
      where: { id: `branch_${rest1Id}_khandagiri` },
      update: { name: 'Khandagiri Franchise' },
      create: {
        id: `branch_${rest1Id}_khandagiri`,
        restaurantId: rest1Id,
        name: 'Khandagiri Franchise',
        address: 'Plot 108, Khandagiri Square, Near Caves, Bhubaneswar',
        phone: '+916742301100'
      }
    });

    const kalpanaBranch = await prisma.restaurantBranch.upsert({
      where: { id: `branch_${rest1Id}_kalpana` },
      update: { name: 'Kalpana Square Franchise' },
      create: {
        id: `branch_${rest1Id}_kalpana`,
        restaurantId: rest1Id,
        name: 'Kalpana Square Franchise',
        address: 'Shop 14, Kalpana Square, Cuttack-Puri Road, Bhubaneswar',
        phone: '+916742302200'
      }
    });

    const porasuniBranch = await prisma.restaurantBranch.upsert({
      where: { id: `branch_${rest1Id}_porasuni` },
      update: { name: 'Porasuni Franchise' },
      create: {
        id: `branch_${rest1Id}_porasuni`,
        restaurantId: rest1Id,
        name: 'Porasuni Franchise',
        address: 'NH-16 Express Bypass, Porasuni Junction, Khordha',
        phone: '+916742303300'
      }
    });

    // Seed Consistent, Realistic Indian Restaurant Staff across All 4 Franchise Branches
    const branchConfigs = [
      {
        id: flagshipBranch.id,
        name: 'BKC Flagship Location',
        code: 'bkc',
        staff: [
          { role: 'RESTAURANT_MANAGER', desig: 'Branch Operations Manager', name: 'Sunil Verma', email: 'manager.sunil@punjabheritage.in', phone: '+919820011001', perms: ['orders.read', 'orders.accept', 'orders.update', 'orders.history', 'tables.read', 'billing.read', 'billing.create', 'reports.daily', 'reports.sales', 'staff.read', 'inventory.read'] },
          { role: 'RESTAURANT_STAFF', desig: 'Head Chef', name: 'Vikram Rawat', email: 'chef.vikram@punjabheritage.in', phone: '+919820011002', perms: ['orders.read', 'orders.accept', 'orders.update', 'kds.view', 'kds.orders.accept', 'orders.prepare', 'orders.ready', 'inventory.read', 'inventory.update'] },
          { role: 'RESTAURANT_STAFF', desig: 'Senior Captain', name: 'Rohan Malhotra', email: 'captain.bkc@punjabheritage.in', phone: '+919820011003', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.assign', 'tables.transfer', 'tables.merge', 'service_requests.read', 'service_requests.resolve', 'reservations.read', 'reservations.seat'] },
          { role: 'RESTAURANT_STAFF', desig: 'Table Waiter 1', name: 'Ramesh Sharma', email: 'waiter.ramesh@punjabheritage.in', phone: '+919820011004', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.status.update', 'service_requests.read', 'service_requests.acknowledge', 'service_requests.resolve'] },
          { role: 'RESTAURANT_STAFF', desig: 'Table Waiter 2', name: 'Deepak Jena', email: 'waiter2.bkc@punjabheritage.in', phone: '+919820011005', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.status.update', 'service_requests.read', 'service_requests.acknowledge', 'service_requests.resolve'] },
          { role: 'RESTAURANT_STAFF', desig: 'Inventory Manager', name: 'Anita Sharma', email: 'inventory.anita@punjabheritage.in', phone: '+919820011008', perms: ['inventory.read', 'inventory.update', 'inventory.restock', 'orders.read', 'service_requests.read', 'tables.read', 'menu.read'] },
          { role: 'RESTAURANT_STAFF', desig: 'Cashier & Billing Desk', name: 'Priya Joshi', email: 'cashier.priya@punjabheritage.in', phone: '+919820011006', perms: ['billing.read', 'billing.create', 'billing.print', 'billing.discount', 'billing.taxes.view', 'billing.settle', 'payments.read', 'payments.create', 'payments.verify'] },
          { role: 'RESTAURANT_STAFF', desig: 'Housekeeping & Cleaner', name: 'Raju Nayak', email: 'cleaner.bkc@punjabheritage.in', phone: '+919820011007', perms: ['tables.read', 'tables.status.update', 'tables.close', 'service_requests.read', 'service_requests.resolve'] }
        ]
      },
      {
        id: khandagiriBranch.id,
        name: 'Khandagiri Franchise',
        code: 'khandagiri',
        staff: [
          { role: 'RESTAURANT_MANAGER', desig: 'Branch Operations Manager', name: 'Manoj Mohanty', email: 'manager.khandagiri@punjabheritage.in', phone: '+919820022001', perms: ['orders.read', 'orders.accept', 'orders.update', 'orders.history', 'tables.read', 'billing.read', 'billing.create', 'reports.daily', 'reports.sales', 'staff.read', 'inventory.read'] },
          { role: 'RESTAURANT_STAFF', desig: 'Head Chef', name: 'Debabrata Sahoo', email: 'chef.khandagiri@punjabheritage.in', phone: '+919820022002', perms: ['orders.read', 'orders.accept', 'orders.update', 'kds.view', 'kds.orders.accept', 'orders.prepare', 'orders.ready', 'inventory.read', 'inventory.update'] },
          { role: 'RESTAURANT_STAFF', desig: 'Senior Captain', name: 'Subhashish Rout', email: 'captain.khandagiri@punjabheritage.in', phone: '+919820022003', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.assign', 'tables.transfer', 'tables.merge', 'service_requests.read', 'service_requests.resolve', 'reservations.read', 'reservations.seat'] },
          { role: 'RESTAURANT_STAFF', desig: 'Table Waiter 1', name: 'Bikram Rout', email: 'waiter1.khandagiri@punjabheritage.in', phone: '+919820022004', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.status.update', 'service_requests.read', 'service_requests.acknowledge', 'service_requests.resolve'] },
          { role: 'RESTAURANT_STAFF', desig: 'Table Waiter 2', name: 'Sanjay Das', email: 'waiter2.khandagiri@punjabheritage.in', phone: '+919820022005', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.status.update', 'service_requests.read', 'service_requests.acknowledge', 'service_requests.resolve'] },
          { role: 'RESTAURANT_STAFF', desig: 'Cashier & Billing Desk', name: 'Subhashree Patel', email: 'cashier.khandagiri@punjabheritage.in', phone: '+919820022006', perms: ['billing.read', 'billing.create', 'billing.print', 'billing.discount', 'billing.taxes.view', 'billing.settle', 'payments.read', 'payments.create', 'payments.verify'] },
          { role: 'RESTAURANT_STAFF', desig: 'Housekeeping & Cleaner', name: 'Kalia Pradhan', email: 'cleaner.khandagiri@punjabheritage.in', phone: '+919820022007', perms: ['tables.read', 'tables.status.update', 'tables.close', 'service_requests.read', 'service_requests.resolve'] }
        ]
      },
      {
        id: kalpanaBranch.id,
        name: 'Kalpana Square Franchise',
        code: 'kalpana',
        staff: [
          { role: 'RESTAURANT_MANAGER', desig: 'Branch Operations Manager', name: 'Alok Tripathy', email: 'manager.kalpana@punjabheritage.in', phone: '+919820033001', perms: ['orders.read', 'orders.accept', 'orders.update', 'orders.history', 'tables.read', 'billing.read', 'billing.create', 'reports.daily', 'reports.sales', 'staff.read', 'inventory.read'] },
          { role: 'RESTAURANT_STAFF', desig: 'Head Chef', name: 'Birendra Rawat', email: 'chef.kalpana@punjabheritage.in', phone: '+919820033002', perms: ['orders.read', 'orders.accept', 'orders.update', 'kds.view', 'kds.orders.accept', 'orders.prepare', 'orders.ready', 'inventory.read', 'inventory.update'] },
          { role: 'RESTAURANT_STAFF', desig: 'Senior Captain', name: 'Pradeep Nayak', email: 'captain.kalpana@punjabheritage.in', phone: '+919820033003', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.assign', 'tables.transfer', 'tables.merge', 'service_requests.read', 'service_requests.resolve', 'reservations.read', 'reservations.seat'] },
          { role: 'RESTAURANT_STAFF', desig: 'Table Waiter 1', name: 'Rajesh Barik', email: 'waiter1.kalpana@punjabheritage.in', phone: '+919820033004', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.status.update', 'service_requests.read', 'service_requests.acknowledge', 'service_requests.resolve'] },
          { role: 'RESTAURANT_STAFF', desig: 'Table Waiter 2', name: 'Manas Behera', email: 'waiter2.kalpana@punjabheritage.in', phone: '+919820033005', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.status.update', 'service_requests.read', 'service_requests.acknowledge', 'service_requests.resolve'] },
          { role: 'RESTAURANT_STAFF', desig: 'Cashier & Billing Desk', name: 'Ananya Mishra', email: 'cashier.kalpana@punjabheritage.in', phone: '+919820033006', perms: ['billing.read', 'billing.create', 'billing.print', 'billing.discount', 'billing.taxes.view', 'billing.settle', 'payments.read', 'payments.create', 'payments.verify'] },
          { role: 'RESTAURANT_STAFF', desig: 'Housekeeping & Cleaner', name: 'Gopal Swain', email: 'cleaner.kalpana@punjabheritage.in', phone: '+919820033007', perms: ['tables.read', 'tables.status.update', 'tables.close', 'service_requests.read', 'service_requests.resolve'] }
        ]
      },
      {
        id: porasuniBranch.id,
        name: 'Porasuni Franchise',
        code: 'porasuni',
        staff: [
          { role: 'RESTAURANT_MANAGER', desig: 'Branch Operations Manager', name: 'Prakash Samal', email: 'manager.porasuni@punjabheritage.in', phone: '+919820044001', perms: ['orders.read', 'orders.accept', 'orders.update', 'orders.history', 'tables.read', 'billing.read', 'billing.create', 'reports.daily', 'reports.sales', 'staff.read', 'inventory.read'] },
          { role: 'RESTAURANT_STAFF', desig: 'Head Chef', name: 'Chandan Biswal', email: 'chef.porasuni@punjabheritage.in', phone: '+919820044002', perms: ['orders.read', 'orders.accept', 'orders.update', 'kds.view', 'kds.orders.accept', 'orders.prepare', 'orders.ready', 'inventory.read', 'inventory.update'] },
          { role: 'RESTAURANT_STAFF', desig: 'Senior Captain', name: 'Tapan Mahapatra', email: 'captain.porasuni@punjabheritage.in', phone: '+919820044003', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.assign', 'tables.transfer', 'tables.merge', 'service_requests.read', 'service_requests.resolve', 'reservations.read', 'reservations.seat'] },
          { role: 'RESTAURANT_STAFF', desig: 'Table Waiter 1', name: 'Jagan Sethi', email: 'waiter1.porasuni@punjabheritage.in', phone: '+919820044004', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.status.update', 'service_requests.read', 'service_requests.acknowledge', 'service_requests.resolve'] },
          { role: 'RESTAURANT_STAFF', desig: 'Table Waiter 2', name: 'Ashok Muduli', email: 'waiter2.porasuni@punjabheritage.in', phone: '+919820044005', perms: ['orders.read', 'orders.create', 'orders.update', 'orders.serve', 'tables.read', 'tables.status.update', 'service_requests.read', 'service_requests.acknowledge', 'service_requests.resolve'] },
          { role: 'RESTAURANT_STAFF', desig: 'Cashier & Billing Desk', name: 'Anita Deshmukh', email: 'cashier.porasuni@punjabheritage.in', phone: '+919820044006', perms: ['billing.read', 'billing.create', 'billing.print', 'billing.discount', 'billing.taxes.view', 'billing.settle', 'payments.read', 'payments.create', 'payments.verify'] },
          { role: 'RESTAURANT_STAFF', desig: 'Housekeeping & Cleaner', name: 'Babul Murmu', email: 'cleaner.porasuni@punjabheritage.in', phone: '+919820044007', perms: ['tables.read', 'tables.status.update', 'tables.close', 'service_requests.read', 'service_requests.resolve'] }
        ]
      }
    ];

    for (const b of branchConfigs) {
      for (const st of b.staff) {
        let u = await prisma.user.findFirst({
          where: {
            OR: [
              { email: st.email },
              { phone: st.phone }
            ]
          }
        });

        if (u) {
          u = await prisma.user.update({
            where: { id: u.id },
            data: {
              email: st.email,
              name: `${st.name} — ${st.desig}`,
              phone: st.phone,
              role: st.role,
              passwordHash: defaultPasswordHash
            }
          });
        } else {
          u = await prisma.user.create({
            data: {
              email: st.email,
              name: `${st.name} — ${st.desig}`,
              phone: st.phone,
              passwordHash: defaultPasswordHash,
              role: st.role
            }
          });
        }

        await prisma.restaurantStaff.upsert({
          where: { userId: u.id },
          update: { restaurantId: rest1Id, designation: st.desig, isActive: true },
          create: { userId: u.id, restaurantId: rest1Id, designation: st.desig, isActive: true }
        });

        await this.assignRoleToUser(u.id, 'CUSTOM', rest1Id, b.id, [
          { scopeType: 'RESTAURANT', scopeValue: rest1Id },
          { scopeType: 'BRANCH', scopeValue: b.id }
        ]);

        // Assign starting permission overrides
        await prisma.userPermissionOverride.deleteMany({
          where: { userId: u.id, restaurantId: rest1Id }
        });

        const validPermIds = new Set(ALL_PERMISSIONS.map(p => p.id));
        for (const pId of st.perms) {
          if (validPermIds.has(pId)) {
            await prisma.userPermissionOverride.create({
              data: {
                userId: u.id,
                permissionId: pId,
                restaurantId: rest1Id,
                isGranted: true
              }
            });
          }
        }
      }
    }


    // Restaurant 2: Grand Peshawari Grill (Tenant Isolation Verification)
    let rest2 = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { id: 'rest_peshawari_grill' },
          { slug: { contains: 'peshawari' } },
          { name: { contains: 'Peshawari' } }
        ]
      }
    });
    if (!rest2) {
      rest2 = await prisma.restaurant.upsert({
        where: { id: 'rest_peshawari_grill' },
        update: {},
        create: {
          id: 'rest_peshawari_grill',
          name: 'Grand Peshawari Grill & Kebab',
          slug: 'grand-peshawari-grill-mumbai',
          logoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80',
          coverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
          description: 'Authentic frontier barbecue, Peshawari tandoor kebabs, and slow-braised curries.',
          cuisineType: 'North Indian, Mughlai, Barbecue',
          costForTwo: 1100,
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400051',
          fullAddress: 'Level 2, Phoenix Palladium, Lower Parel, Mumbai, Maharashtra 400013',
          phone: '+919820099002',
          latitude: 18.9950,
          longitude: 72.8250,
          isPureVeg: false,
          isActive: true
        }
      });
    }

    if (rest2) {
      const rest2Id = rest2.id;
      let branch2 = await prisma.restaurantBranch.findFirst({ where: { restaurantId: rest2Id } });
      if (!branch2) {
        branch2 = await prisma.restaurantBranch.create({
          data: {
            id: `branch_${rest2Id}`,
            restaurantId: rest2Id,
            name: 'Main Branch - Peshawari',
            address: rest2.fullAddress,
            phone: rest2.phone
          }
        });
      }

      // Owner for Restaurant 2
      let owner2 = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'owner.peshawari@dinedeck.in' },
            { phone: '+919820099002' }
          ]
        }
      });
      if (owner2) {
        owner2 = await prisma.user.update({
          where: { id: owner2.id },
          data: {
            email: 'owner.peshawari@dinedeck.in',
            name: 'Tariq Khan (Peshawari Owner)',
            phone: '+919820099002',
            passwordHash: defaultPasswordHash,
            role: 'RESTAURANT_OWNER'
          }
        });
      } else {
        owner2 = await prisma.user.create({
          data: {
            email: 'owner.peshawari@dinedeck.in',
            name: 'Tariq Khan (Peshawari Owner)',
            phone: '+919820099002',
            passwordHash: defaultPasswordHash,
            role: 'RESTAURANT_OWNER'
          }
        });
      }
      await prisma.restaurantStaff.upsert({
        where: { userId: owner2.id },
        update: { restaurantId: rest2Id, designation: 'Owner & Root Admin', isActive: true },
        create: { userId: owner2.id, restaurantId: rest2Id, designation: 'Owner & Root Admin', isActive: true }
      });
      await this.assignRoleToUser(owner2.id, 'RESTAURANT_OWNER', rest2Id, branch2.id, [
        { scopeType: 'RESTAURANT', scopeValue: rest2Id }
      ]);
    }

    console.log('[IAM] All Multi-Tenant Restaurant Staff & IAM Roles Seeded Successfully.');
  }

  /**
   * Assign a role with scopes to a user
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    restaurantId?: string,
    branchId?: string,
    scopes?: Array<{ scopeType: string; scopeValue: string }>
  ): Promise<any> {
    const existing = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        restaurantId: restaurantId || null,
        branchId: branchId || null
      }
    });

    let userRole = existing;
    if (!userRole) {
      userRole = await prisma.userRole.create({
        data: {
          userId,
          roleId,
          restaurantId: restaurantId || null,
          branchId: branchId || null
        }
      });
    }

    if (scopes && scopes.length > 0) {
      await prisma.roleScope.deleteMany({ where: { userRoleId: userRole.id } });
      for (const s of scopes) {
        await prisma.roleScope.create({
          data: {
            userRoleId: userRole.id,
            scopeType: s.scopeType,
            scopeValue: s.scopeValue
          }
        });
      }
    }

    return userRole;
  }

  /**
   * Get effective permissions for a user taking into account roles and overrides
   */
  async getEffectivePermissions(
    userId: string,
    restaurantId?: string,
    branchId?: string
  ): Promise<{ permissions: Set<string>; roles: string[]; scopes: Array<{ type: string; value: string }> }> {
    // 1. Fetch user roles
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        OR: [
          { restaurantId: null },
          { restaurantId: restaurantId || undefined }
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
    });

    const grantedPermissions = new Set<string>();
    const roles: string[] = [];
    const scopes: Array<{ type: string; value: string }> = [];

    for (const ur of userRoles) {
      roles.push(ur.roleId);
      for (const rp of ur.role.permissions) {
        grantedPermissions.add(rp.permissionId);
      }
      for (const sc of ur.scopes) {
        scopes.push({ type: sc.scopeType, value: sc.scopeValue });
      }
    }

    // 2. Fetch UserPermissionOverrides (Explicit Grant / Deny)
    const overrides = await prisma.userPermissionOverride.findMany({
      where: {
        userId,
        OR: [
          { restaurantId: null },
          { restaurantId: restaurantId || undefined }
        ]
      }
    });

    for (const ov of overrides) {
      if (ov.isGranted) {
        grantedPermissions.add(ov.permissionId);
      } else {
        grantedPermissions.delete(ov.permissionId);
      }
    }

    return { permissions: grantedPermissions, roles, scopes };
  }

  /**
   * Authorize user request against permission and context scopes
   */
  async authorize(
    user: { id: string; role?: string },
    requiredPermission: string,
    context: ScopeContext = {}
  ): Promise<AuthorizationResult> {
    if (!user || !user.id) {
      return { authorized: false, statusCode: 401, reason: 'Unauthenticated user' };
    }

    // Platform Super Admin Bypass
    if (user.role === 'DINEDECK_SUPER_ADMIN' || user.role === 'SUPER_ADMIN') {
      return { authorized: true, statusCode: 200, effectiveRoles: ['SUPER_ADMIN'] };
    }

    // Customer boundary: Customers cannot execute operational staff permissions on restaurants
    if (user.role === 'CUSTOMER') {
      const allowedCustomerPerms = ['orders.create', 'service_requests.create', 'orders.read', 'menu.read'];
      // If restaurant operational context is checked for non-public customer actions, deny
      if (!allowedCustomerPerms.includes(requiredPermission) || context.restaurantId) {
        // Customer can read public restaurant menu, but cannot read staff orders or operational data
        if (requiredPermission !== 'menu.read') {
          return {
            authorized: false,
            statusCode: 403,
            reason: `Access Denied: Customer accounts are not authorized for operational permission '${requiredPermission}'`
          };
        }
      }
    }

    // Check if target user staff account is suspended / revoked
    if (context.restaurantId) {
      const staffProfile = await prisma.restaurantStaff.findFirst({
        where: {
          userId: user.id,
          restaurantId: context.restaurantId
        }
      });

      if (staffProfile && !staffProfile.isActive) {
        return {
          authorized: false,
          statusCode: 403,
          reason: 'Access Denied: Staff account is suspended or revoked by the restaurant owner'
        };
      }
    }

    const { permissions, roles, scopes } = await this.getEffectivePermissions(
      user.id,
      context.restaurantId,
      context.branchId
    );

    // 1. Check if permission is granted
    if (!permissions.has(requiredPermission)) {
      return {
        authorized: false,
        statusCode: 403,
        reason: `Access Denied: Missing required permission '${requiredPermission}'`,
        effectiveRoles: roles,
        effectivePermissions: Array.from(permissions),
        scopes
      };
    }

    // 2. Check Table Scope (if applicable)
    if (context.tableNumber) {
      const tableScope = scopes.find(s => s.type === 'TABLE');
      if (tableScope && tableScope.value !== 'ALL') {
        const normalizeTable = (t: string) => t.toLowerCase().replace(/^(table|tbl|t)\s*[-_#]?\s*/i, '').trim();
        const allowedTables = tableScope.value.split(',').map(t => normalizeTable(t));
        const target = normalizeTable(context.tableNumber);
        
        const matches = allowedTables.includes(target) || allowedTables.includes('all');
        if (!matches) {
          return {
            authorized: false,
            statusCode: 403,
            reason: `Access Denied: User is not authorized to operate Table #${context.tableNumber} (Assigned Scope: ${tableScope.value})`,
            effectiveRoles: roles,
            scopes
          };
        }
      }
    }


    // 3. Check Branch Scope (if applicable)
    if (context.branchId) {
      const branchScope = scopes.find(s => s.type === 'BRANCH');
      if (branchScope && branchScope.value !== 'ALL' && branchScope.value !== context.branchId) {
        return {
          authorized: false,
          statusCode: 403,
          reason: `Access Denied: User is scoped to branch '${branchScope.value}', requested '${context.branchId}'`,
          effectiveRoles: roles,
          scopes
        };
      }
    }

    return {
      authorized: true,
      statusCode: 200,
      effectiveRoles: roles,
      effectivePermissions: Array.from(permissions),
      scopes
    };
  }

  /**
   * Log an audit event
   */
  async logAuditEvent(params: {
    actorId?: string;
    actorRole?: string;
    action: string;
    resource: string;
    resourceId: string;
    scope?: string;
    before?: any;
    after?: any;
    result?: 'SUCCESS' | 'DENIED' | 'FAILED';
    ipAddress?: string;
  }): Promise<void> {
    try {
      // If actorId is 'SYSTEM' or not a User UUID, set to null because AuditLog.actorId references User.id
      const validActorId = params.actorId && params.actorId !== 'SYSTEM' ? params.actorId : null;

      await prisma.auditLog.create({
        data: {
          actorId: validActorId,
          actorRole: params.actorRole || (params.actorId === 'SYSTEM' ? 'SYSTEM' : null),
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          scope: params.scope || null,
          beforeJson: params.before ? JSON.stringify(params.before) : null,
          afterJson: params.after ? JSON.stringify(params.after) : null,
          result: params.result || 'SUCCESS',
          ipAddress: params.ipAddress || null
        }
      });
    } catch (e: any) {
      console.error('[IAM Audit] Failed to record audit log:', e.message);
    }
  }

  /**
   * Set explicit permission override (Grant or Deny)
   */
  async setUserPermissionOverride(params: {
    userId: string;
    permissionId: string;
    effect: 'ALLOW' | 'DENY';
    restaurantId?: string;
    branchId?: string;
    actorId?: string;
  }): Promise<any> {
    const isGranted = params.effect === 'ALLOW';

    const override = await prisma.userPermissionOverride.upsert({
      where: {
        userId_permissionId_restaurantId_branchId: {
          userId: params.userId,
          permissionId: params.permissionId,
          restaurantId: params.restaurantId || '',
          branchId: params.branchId || ''
        }
      },
      update: { isGranted },
      create: {
        userId: params.userId,
        permissionId: params.permissionId,
        isGranted,
        restaurantId: params.restaurantId || null,
        branchId: params.branchId || null
      }
    });

    if (params.actorId) {
      await this.logAuditEvent({
        actorId: params.actorId,
        actorRole: 'RESTAURANT_OWNER',
        action: 'iam.permission_override',
        resource: 'user_permission_override',
        resourceId: override.id,
        after: params
      });
    }

    return override;
  }
}

export const iamService = new IamService();
