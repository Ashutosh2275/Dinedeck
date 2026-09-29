export interface PermissionItem {
  id: string;
  resource: string;
  action: string;
  category: string;
  categoryLabel: string;
  name: string;
  description: string;
}

export interface PermissionCategory {
  key: string;
  label: string;
  description: string;
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  { key: 'OPERATIONS', label: 'OPERATIONS', description: 'Order intake, status advancement, and order history' },
  { key: 'KITCHEN', label: 'KITCHEN / KDS', description: 'KDS station feeds, cooking queue, and food preparation' },
  { key: 'SERVICE', label: 'SERVICE', description: 'Waiter calls, guest assistance, and service resolutions' },
  { key: 'MENU', label: 'MENU', description: 'Menu catalog, dish pricing, categories, variants, and stock availability' },
  { key: 'TABLES', label: 'TABLES', description: 'Floor plans, table occupancy, seatings, and QR assignments' },
  { key: 'BILLING', label: 'BILLING', description: 'Bill generation, printing, discounts, taxes, and refunds' },
  { key: 'PAYMENTS', label: 'PAYMENTS', description: 'Payment records, UPI verification, refunds, and POS terminals' },
  { key: 'FINANCE', label: 'FINANCE', description: 'Revenue metrics, bank settlements, and financial analytics' },
  { key: 'STAFF_IAM', label: 'STAFF / IAM', description: 'Staff directory, custom user-level permissions, and access states' },
  { key: 'REPORTS', label: 'REPORTS', description: 'Daily, weekly, monthly sales, kitchen, and staff reports' },
  { key: 'RESERVATIONS', label: 'RESERVATIONS', description: 'Table bookings, guest schedule management, and cancellations' },
  { key: 'INVENTORY', label: 'INVENTORY', description: 'Stock levels, wastage adjustments, purchases, and supply tracking' },
  { key: 'SETTINGS_AUDIT', label: 'SETTINGS & AUDIT', description: 'Store settings, operating hours, and security audit logs' }
];

export const ALL_PERMISSIONS: PermissionItem[] = [
  // 1. OPERATIONS (7)
  { id: 'orders.read', resource: 'orders', action: 'read', category: 'OPERATIONS', categoryLabel: 'OPERATIONS', name: 'View Live & Active Orders', description: 'See all incoming and ongoing customer dining orders in real time' },
  { id: 'orders.accept', resource: 'orders', action: 'accept', category: 'OPERATIONS', categoryLabel: 'OPERATIONS', name: 'Accept Incoming Orders', description: 'Accept newly placed QR or waiter orders to start kitchen processing' },
  { id: 'orders.reject', resource: 'orders', action: 'reject', category: 'OPERATIONS', categoryLabel: 'OPERATIONS', name: 'Decline / Reject Orders', description: 'Decline incoming orders when kitchen is busy or items are unavailable' },
  { id: 'orders.update', resource: 'orders', action: 'update', category: 'OPERATIONS', categoryLabel: 'OPERATIONS', name: 'Change Order Status & Notes', description: 'Advance order stages and add customer special requests or notes' },
  { id: 'orders.cancel', resource: 'orders', action: 'cancel', category: 'OPERATIONS', categoryLabel: 'OPERATIONS', name: 'Cancel Active Orders', description: 'Cancel placed or cooking orders with a recorded reason' },
  { id: 'orders.history', resource: 'orders', action: 'history', category: 'OPERATIONS', categoryLabel: 'OPERATIONS', name: 'View Past Order History', description: 'Browse full historical records of completed, served, and past orders' },
  { id: 'orders.create', resource: 'orders', action: 'create', category: 'OPERATIONS', categoryLabel: 'OPERATIONS', name: 'Take Orders (Dine-In & Takeaway)', description: 'Directly place new food orders for guests seated at tables' },

  // 2. KITCHEN / KDS (7)
  { id: 'kds.view', resource: 'kds', action: 'view', category: 'KITCHEN', categoryLabel: 'KITCHEN / KDS', name: 'Open Kitchen Display (KDS)', description: 'Access the live kitchen order screen with incoming food tickets' },
  { id: 'kds.orders.accept', resource: 'kds', action: 'orders.accept', category: 'KITCHEN', categoryLabel: 'KITCHEN / KDS', name: 'Accept Kitchen Order Tickets (KOT)', description: 'Acknowledge and claim food tickets at kitchen cooking stations' },
  { id: 'orders.prepare', resource: 'orders', action: 'prepare', category: 'KITCHEN', categoryLabel: 'KITCHEN / KDS', name: 'Start Cooking Food', description: 'Mark dishes as actively cooking on tandoor, curry, or grill station' },
  { id: 'orders.ready', resource: 'orders', action: 'ready', category: 'KITCHEN', categoryLabel: 'KITCHEN / KDS', name: 'Mark Food Ready to Serve', description: 'Notify floor waiters that freshly cooked dishes are ready for pickup' },
  { id: 'orders.serve', resource: 'orders', action: 'serve', category: 'KITCHEN', categoryLabel: 'KITCHEN / KDS', name: 'Mark Food Delivered to Table', description: 'Confirm that plated food has been served to the customer table' },
  { id: 'kds.queue.manage', resource: 'kds', action: 'queue.manage', category: 'KITCHEN', categoryLabel: 'KITCHEN / KDS', name: 'Reorder Kitchen Cooking Queue', description: 'Reprioritize rush orders or put cooking tickets on hold' },
  { id: 'kds.analytics.read', resource: 'kds', action: 'analytics.read', category: 'KITCHEN', categoryLabel: 'KITCHEN / KDS', name: 'View Kitchen Cooking Speeds', description: 'Inspect chef preparation speeds, delays, and cooking time averages' },

  // 3. SERVICE (6)
  { id: 'service_requests.read', resource: 'service_requests', action: 'read', category: 'SERVICE', categoryLabel: 'SERVICE', name: 'View Customer Assistance Calls', description: 'See live customer requests for water, cutlery, cleaning, or waiter assistance' },
  { id: 'service_requests.acknowledge', resource: 'service_requests', action: 'acknowledge', category: 'SERVICE', categoryLabel: 'SERVICE', name: 'Acknowledge Service Request', description: 'Mark a table service call as seen and currently attended to' },
  { id: 'service_requests.resolve', resource: 'service_requests', action: 'resolve', category: 'SERVICE', categoryLabel: 'SERVICE', name: 'Complete / Close Service Request', description: 'Mark customer table call as finished after helping the guest' },
  { id: 'service_requests.assign', resource: 'service_requests', action: 'assign', category: 'SERVICE', categoryLabel: 'SERVICE', name: 'Assign Waiter to Table Call', description: 'Delegate table call to a specific floor steward or captain' },
  { id: 'service_requests.history', resource: 'service_requests', action: 'history', category: 'SERVICE', categoryLabel: 'SERVICE', name: 'View Service Call History', description: 'Review past customer response times and completed service logs' },
  { id: 'service_requests.create', resource: 'service_requests', action: 'create', category: 'SERVICE', categoryLabel: 'SERVICE', name: 'Create Manual Service Alert', description: 'Manually trigger service assistance request for a customer table' },

  // 4. MENU (10)
  { id: 'menu.read', resource: 'menu', action: 'read', category: 'MENU', categoryLabel: 'MENU', name: 'View Full Restaurant Menu', description: 'Browse master menu catalog, dish descriptions, and food photos' },
  { id: 'menu.create', resource: 'menu', action: 'create', category: 'MENU', categoryLabel: 'MENU', name: 'Add New Dish to Menu', description: 'Create and list new culinary dishes, beverages, and desserts' },
  { id: 'menu.update', resource: 'menu', action: 'update', category: 'MENU', categoryLabel: 'MENU', name: 'Edit Dish Info & Photos', description: 'Change dish titles, ingredients, food photos, or preparation time' },
  { id: 'menu.price.update', resource: 'menu', action: 'price.update', category: 'MENU', categoryLabel: 'MENU', name: 'Change Dish Prices', description: 'Update item selling prices and special promotional discount prices' },
  { id: 'menu.categories.manage', resource: 'menu', action: 'categories.manage', category: 'MENU', categoryLabel: 'MENU', name: 'Manage Menu Categories', description: 'Add, rename, or reorder menu sections (Starters, Main Course, etc.)' },
  { id: 'menu.variants.manage', resource: 'menu', action: 'variants.manage', category: 'MENU', categoryLabel: 'MENU', name: 'Manage Portion Sizes & Variants', description: 'Configure portion sizes like Half/Full, Small/Medium/Large, or Veg/Non-Veg' },
  { id: 'menu.customizations.manage', resource: 'menu', action: 'customizations.manage', category: 'MENU', categoryLabel: 'MENU', name: 'Manage Add-ons & Customizations', description: 'Configure extra toppings, spice level adjustments, and cheese add-ons' },
  { id: 'menu.availability.update', resource: 'menu', action: 'availability.update', category: 'MENU', categoryLabel: 'MENU', name: 'Turn Dish In-Stock / Out-of-Stock (86)', description: 'Instantly mark an item as out of stock when ingredients finish' },
  { id: 'menu.availability.manage', resource: 'menu', action: 'availability.manage', category: 'MENU', categoryLabel: 'MENU', name: 'Schedule Menu Timings', description: 'Set dishes to appear only during Breakfast, Lunch, or Dinner hours' },
  { id: 'menu.delete', resource: 'menu', action: 'delete', category: 'MENU', categoryLabel: 'MENU', name: 'Delete Dish from Menu', description: 'Permanently remove or archive dishes that are no longer served' },

  // 5. TABLES (9)
  { id: 'tables.read', resource: 'tables', action: 'read', category: 'TABLES', categoryLabel: 'TABLES', name: 'View Floor Map & Tables', description: 'See real-time table occupancy, vacant tables, and seated dining parties' },
  { id: 'tables.update', resource: 'tables', action: 'update', category: 'TABLES', categoryLabel: 'TABLES', name: 'Edit Table Numbers & Capacity', description: 'Update table numbers, seating capacity (2-seater, 4-seater), and shapes' },
  { id: 'tables.status.update', resource: 'tables', action: 'status.update', category: 'TABLES', categoryLabel: 'TABLES', name: 'Change Table Status (Vacant / Occupied)', description: 'Manually toggle table state between Occupied, Vacant, Reserved, or Cleaning' },
  { id: 'tables.floors.manage', resource: 'tables', action: 'floors.manage', category: 'TABLES', categoryLabel: 'TABLES', name: 'Manage Floors & Dining Areas', description: 'Configure Ground Floor, First Floor, Rooftop Lounge, or Outdoor Patio' },
  { id: 'tables.assign', resource: 'tables', action: 'assign', category: 'TABLES', categoryLabel: 'TABLES', name: 'Assign Tables to Waiters & Seat Guests', description: 'Seat walk-in customers and allocate dedicated floor staff' },
  { id: 'tables.qr.manage', resource: 'tables', action: 'qr.manage', category: 'TABLES', categoryLabel: 'TABLES', name: 'Generate & Print Table QR Codes', description: 'Create and print secure QR code acrylic standees for contactless ordering' },
  { id: 'tables.transfer', resource: 'tables', action: 'transfer', category: 'TABLES', categoryLabel: 'TABLES', name: 'Transfer Order to Another Table', description: 'Move seated guests and their running food bill to a different table' },
  { id: 'tables.merge', resource: 'tables', action: 'merge', category: 'TABLES', categoryLabel: 'TABLES', name: 'Merge Multiple Tables Together', description: 'Combine adjacent tables for large family parties or group gatherings' },
  { id: 'tables.close', resource: 'tables', action: 'close', category: 'TABLES', categoryLabel: 'TABLES', name: 'Clear & Close Finished Table', description: 'Reset table to vacant after customer pays and departs' },

  // 6. BILLING (8)
  { id: 'billing.read', resource: 'billing', action: 'read', category: 'BILLING', categoryLabel: 'BILLING', name: 'View Customer Bills & Invoices', description: 'Inspect running dining bills, itemized totals, and open receipts' },
  { id: 'billing.create', resource: 'billing', action: 'create', category: 'BILLING', categoryLabel: 'BILLING', name: 'Generate Final Bill for Table', description: 'Create printed or digital bill when customer requests check' },
  { id: 'billing.print', resource: 'billing', action: 'print', category: 'BILLING', categoryLabel: 'BILLING', name: 'Print Thermal Paper Receipts', description: 'Send print command to thermal receipt printer at cashier counter' },
  { id: 'billing.discount', resource: 'billing', action: 'discount', category: 'BILLING', categoryLabel: 'BILLING', name: 'Apply Discounts & Coupons', description: 'Apply promotional coupon codes, percentage discounts, or manager goodwill offers' },
  { id: 'billing.taxes.view', resource: 'billing', action: 'taxes.view', category: 'BILLING', categoryLabel: 'BILLING', name: 'View GST Taxes Breakdown', description: 'Inspect CGST 2.5%, SGST 2.5%, and optional Service Charge calculations' },
  { id: 'billing.payment_status.view', resource: 'billing', action: 'payment_status.view', category: 'BILLING', categoryLabel: 'BILLING', name: 'Check Bill Payment Status', description: 'Check live status of customer payments via UPI, Card, or Cash' },
  { id: 'billing.refund', resource: 'billing', action: 'refund', category: 'BILLING', categoryLabel: 'BILLING', name: 'Issue Bill Refund or Void Item', description: 'Remove a mistakenly billed dish or process customer refund' },
  { id: 'billing.settle', resource: 'billing', action: 'settle', category: 'BILLING', categoryLabel: 'BILLING', name: 'Settle & Close Bill', description: 'Record payment collected and close the bill out of open ledger' },

  // 7. PAYMENTS (5)
  { id: 'payments.read', resource: 'payments', action: 'read', category: 'PAYMENTS', categoryLabel: 'PAYMENTS', name: 'View Payment Transactions Log', description: 'Browse ledger of all collected UPI, Card, and Cash transactions' },
  { id: 'payments.create', resource: 'payments', action: 'create', category: 'PAYMENTS', categoryLabel: 'PAYMENTS', name: 'Collect & Record Payment', description: 'Record payment received via Cash, POS swipe, or dynamic UPI QR' },
  { id: 'payments.verify', resource: 'payments', action: 'verify', category: 'PAYMENTS', categoryLabel: 'PAYMENTS', name: 'Verify Online UPI / Card Payment', description: 'Verify bank payment receipt and digital transaction reference' },
  { id: 'payments.refund', resource: 'payments', action: 'refund', category: 'PAYMENTS', categoryLabel: 'PAYMENTS', name: 'Authorize Payment Refunds', description: 'Approve and authorize digital refunds directly to customer account' },
  { id: 'payments.terminal.manage', resource: 'payments', action: 'terminal.manage', category: 'PAYMENTS', categoryLabel: 'PAYMENTS', name: 'Manage POS Card Swipe Machines', description: 'Configure and link EDC card swipe terminals with billing counter' },

  // 8. FINANCE (6)
  { id: 'finance.revenue.view', resource: 'finance', action: 'revenue.view', category: 'FINANCE', categoryLabel: 'FINANCE', name: 'View Total Revenue & Sales', description: 'View daily, weekly, and monthly gross sales figures' },
  { id: 'finance.settlements.view', resource: 'finance', action: 'settlements.view', category: 'FINANCE', categoryLabel: 'FINANCE', name: 'View Bank Settlements & Payouts', description: 'Check money transferred to restaurant bank account after commission' },
  { id: 'finance.reports.view', resource: 'finance', action: 'reports.view', category: 'FINANCE', categoryLabel: 'FINANCE', name: 'View Payment Method Breakdown', description: 'See sales distribution across UPI, Credit Card, Debit Card, and Cash' },
  { id: 'finance.analytics.view', resource: 'finance', action: 'analytics.view', category: 'FINANCE', categoryLabel: 'FINANCE', name: 'View Financial Analytics & Growth', description: 'Analyze average order value (AOV), peak sales hours, and revenue trends' },
  { id: 'finance.pnl.view', resource: 'finance', action: 'pnl.view', category: 'FINANCE', categoryLabel: 'FINANCE', name: 'View Profit & Loss (P&L) Summary', description: 'Review food costs, operating expenses, and estimated restaurant profit' },
  { id: 'finance.payout_bank.update', resource: 'finance', action: 'payout_bank.update', category: 'FINANCE', categoryLabel: 'FINANCE', name: 'Update Settlement Bank Details', description: 'Change restaurant bank account number and IFSC code for payouts' },

  // 9. STAFF / IAM (8)
  { id: 'staff.read', resource: 'staff', action: 'read', category: 'STAFF_IAM', categoryLabel: 'STAFF / IAM', name: 'View Staff Directory & Profiles', description: 'Browse all restaurant employees, contact info, and active roles' },
  { id: 'staff.assign_role', resource: 'staff', action: 'assign_role', category: 'STAFF_IAM', categoryLabel: 'STAFF / IAM', name: 'Assign Staff Job Title', description: 'Change employee designation (e.g. Senior Captain, Chef, Waiter)' },
  { id: 'staff.assign_permission', resource: 'staff', action: 'assign_permission', category: 'STAFF_IAM', categoryLabel: 'STAFF / IAM', name: 'Customize Individual Permissions', description: 'Independently check or uncheck any of the 91 permissions for a staff member' },
  { id: 'staff.scopes.manage', resource: 'staff', action: 'scopes.manage', category: 'STAFF_IAM', categoryLabel: 'STAFF / IAM', name: 'Set Franchise & Location Bounds', description: 'Assign which franchise branch the staff member is permitted to operate in' },
  { id: 'staff.suspend', resource: 'staff', action: 'suspend', category: 'STAFF_IAM', categoryLabel: 'STAFF / IAM', name: 'Suspend Staff Account', description: 'Temporarily lock staff account so they cannot log in during leave or investigation' },
  { id: 'staff.revoke', resource: 'staff', action: 'revoke', category: 'STAFF_IAM', categoryLabel: 'STAFF / IAM', name: 'Revoke Staff Access', description: 'Permanently remove operational access for former or terminated employees' },
  { id: 'staff.update', resource: 'staff', action: 'update', category: 'STAFF_IAM', categoryLabel: 'STAFF / IAM', name: 'Edit Staff Profile & Details', description: 'Update staff phone number, display name, and profile information' },
  { id: 'staff.disable', resource: 'staff', action: 'disable', category: 'STAFF_IAM', categoryLabel: 'STAFF / IAM', name: 'Enable / Disable Staff Access', description: 'Toggle staff active access state on or off' },

  // 10. REPORTS (9)
  { id: 'reports.daily', resource: 'reports', action: 'daily', category: 'REPORTS', categoryLabel: 'REPORTS', name: 'View Daily Sales Summary', description: 'Check end-of-day sales, total orders, cash collected, and tax summary' },
  { id: 'reports.weekly', resource: 'reports', action: 'weekly', category: 'REPORTS', categoryLabel: 'REPORTS', name: 'View Weekly Sales Report', description: 'Compare weekly sales trends, customer footfall, and revenue growth' },
  { id: 'reports.monthly', resource: 'reports', action: 'monthly', category: 'REPORTS', categoryLabel: 'REPORTS', name: 'View Monthly Financial Report', description: 'Comprehensive monthly business overview and accounting statement' },
  { id: 'reports.sales', resource: 'reports', action: 'sales', category: 'REPORTS', categoryLabel: 'REPORTS', name: 'View Sales by Dish & Category', description: 'See which dishes sell the most and identify slow-moving menu items' },
  { id: 'reports.kitchen', resource: 'reports', action: 'kitchen', category: 'REPORTS', categoryLabel: 'REPORTS', name: 'View Kitchen Cooking Times Report', description: 'Check preparation delays, average cooking times, and chef productivity' },
  { id: 'reports.staff', resource: 'reports', action: 'staff', category: 'REPORTS', categoryLabel: 'REPORTS', name: 'View Waiter & Staff Performance', description: 'See orders served, tables attended, and sales generated per waiter' },
  { id: 'reports.export', resource: 'reports', action: 'export', category: 'REPORTS', categoryLabel: 'REPORTS', name: 'Download Reports (Excel / CSV / PDF)', description: 'Export sales, tax, and inventory spreadsheets for accounting' },
  { id: 'reports.read', resource: 'reports', action: 'read', category: 'REPORTS', categoryLabel: 'REPORTS', name: 'View General Analytics & Charts', description: 'Access business dashboards, visual graphs, and operational metrics' },
  { id: 'reports.financial', resource: 'reports', action: 'financial', category: 'REPORTS', categoryLabel: 'REPORTS', name: 'View Tax & Accounting Audits', description: 'Generate GST filing reports and balance sheet summaries' },

  // 11. RESERVATIONS (5)
  { id: 'reservations.read', resource: 'reservations', action: 'read', category: 'RESERVATIONS', categoryLabel: 'RESERVATIONS', name: 'View Table Bookings & Reservations', description: 'See list of upcoming table reservations, party sizes, and guest names' },
  { id: 'reservations.create', resource: 'reservations', action: 'create', category: 'RESERVATIONS', categoryLabel: 'RESERVATIONS', name: 'Create New Table Booking', description: 'Reserve a table for guests calling in or booking in advance' },
  { id: 'reservations.update', resource: 'reservations', action: 'update', category: 'RESERVATIONS', categoryLabel: 'RESERVATIONS', name: 'Edit Reservation Details', description: 'Change booking time, guest count, or special seating requests' },
  { id: 'reservations.cancel', resource: 'reservations', action: 'cancel', category: 'RESERVATIONS', categoryLabel: 'RESERVATIONS', name: 'Cancel Table Reservation', description: 'Cancel a guest booking and release table back to walk-in pool' },
  { id: 'reservations.seat', resource: 'reservations', action: 'seat', category: 'RESERVATIONS', categoryLabel: 'RESERVATIONS', name: 'Seat Reserved Guests', description: 'Mark arriving booking party as seated and create dining session' },

  // 12. INVENTORY (6)
  { id: 'inventory.read', resource: 'inventory', action: 'read', category: 'INVENTORY', categoryLabel: 'INVENTORY', name: 'View Raw Ingredients Stock', description: 'Check current quantities of vegetables, meats, dairy, and spices' },
  { id: 'inventory.update', resource: 'inventory', action: 'update', category: 'INVENTORY', categoryLabel: 'INVENTORY', name: 'Update Stock Deliveries', description: 'Enter new ingredient supplies received from food vendors' },
  { id: 'inventory.adjust', resource: 'inventory', action: 'adjust', category: 'INVENTORY', categoryLabel: 'INVENTORY', name: 'Record Wastage & Spoilage', description: 'Log damaged, expired, or spilled ingredients to keep inventory accurate' },
  { id: 'inventory.purchases.view', resource: 'inventory', action: 'purchases.view', category: 'INVENTORY', categoryLabel: 'INVENTORY', name: 'View Supplier Bills & Invoices', description: 'Track vendor purchase orders, receipts, and payment dues' },
  { id: 'inventory.reports.view', resource: 'inventory', action: 'reports.view', category: 'INVENTORY', categoryLabel: 'INVENTORY', name: 'View Stock Consumption Reports', description: 'Analyze ingredient usage rates and reorder alerts' },
  { id: 'inventory.create', resource: 'inventory', action: 'create', category: 'INVENTORY', categoryLabel: 'INVENTORY', name: 'Add New Ingredient / Item', description: 'Register a new raw material or kitchen consumable to inventory' },

  // 13. SETTINGS & AUDIT (5)
  { id: 'settings.read', resource: 'settings', action: 'read', category: 'SETTINGS_AUDIT', categoryLabel: 'SETTINGS & AUDIT', name: 'View Restaurant Settings', description: 'Check current restaurant details, tax settings, and service charges' },
  { id: 'settings.update', resource: 'settings', action: 'update', category: 'SETTINGS_AUDIT', categoryLabel: 'SETTINGS & AUDIT', name: 'Edit Restaurant Info & Policies', description: 'Update restaurant name, address, phone number, and service charge rate' },
  { id: 'settings.hours.manage', resource: 'settings', action: 'hours.manage', category: 'SETTINGS_AUDIT', categoryLabel: 'SETTINGS & AUDIT', name: 'Set Opening & Closing Hours', description: 'Configure dining hours, kitchen opening time, and holiday schedules' },
  { id: 'audit.read', resource: 'audit', action: 'read', category: 'SETTINGS_AUDIT', categoryLabel: 'SETTINGS & AUDIT', name: 'View Security Audit Log', description: 'Inspect chronological log of who changed permissions, prices, or orders' },
  { id: 'audit.staff_activity.view', resource: 'audit', action: 'staff_activity.view', category: 'SETTINGS_AUDIT', categoryLabel: 'SETTINGS & AUDIT', name: 'View Staff Activity Feed', description: 'Monitor live staff actions, shift logins, and order handoffs' }
];
