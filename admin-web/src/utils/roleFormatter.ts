// ==============================================================================
// DINEDECK HUMAN-READABLE ROLE FORMATTER UTILITY
// Converts internal enum identifiers (e.g. RESTAURANT_OWNER) to clean UI labels
// ==============================================================================

export const ROLE_LABELS: Record<string, string> = {
  DINEDECK_SUPER_ADMIN: 'Super Administrator',
  SUPER_ADMIN: 'Super Admin',
  PLATFORM_ADMIN: 'Platform Admin',
  ADMIN: 'Administrator',
  RESTAURANT_OWNER: 'Restaurant Owner',
  OWNER: 'Restaurant Owner',
  GENERAL_MANAGER: 'General Manager',
  MANAGER: 'Manager',
  BRANCH_MANAGER: 'Branch Manager',
  ASSISTANT_MANAGER: 'Assistant Manager',
  HEAD_CHEF: 'Head Chef',
  KITCHEN_MANAGER: 'Kitchen Manager',
  CHEF: 'Chef',
  KITCHEN_STAFF: 'Kitchen Staff',
  CAPTAIN: 'Captain',
  HEAD_WAITER: 'Head Captain',
  WAITER: 'Steward / Waiter',
  STEWARD: 'Steward',
  CASHIER: 'Cashier',
  CHIEF_ACCOUNTANT: 'Chief Accountant',
  ACCOUNTANT: 'Accountant',
  INVENTORY_MANAGER: 'Inventory Manager',
  RESTAURANT_STAFF: 'Restaurant Staff',
  STAFF: 'Staff Member',
  CUSTOMER: 'Customer',
  DINER: 'Diner',
  SUPPORT_VIEW_ONLY: 'Support Specialist',
  SYSTEM: 'System'
};

/**
 * Returns a human-friendly role name from any raw internal role identifier.
 * Example: 'RESTAURANT_OWNER' -> 'Restaurant Owner'
 */
export function formatRole(role?: string | null): string {
  if (!role || typeof role !== 'string') return 'User';
  const clean = role.trim();
  if (ROLE_LABELS[clean]) return ROLE_LABELS[clean];
  if (ROLE_LABELS[clean.toUpperCase()]) return ROLE_LABELS[clean.toUpperCase()];

  // Fallback: convert SNAKE_CASE or kebab-case to clean Title Case
  return clean
    .split(/[_\-\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
