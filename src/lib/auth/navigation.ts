import type { PermissionKey } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import { permissionsForRole } from "@/lib/auth/role-permissions";

export interface NavItem {
  href: string;
  label: string;
  permission: PermissionKey;
}

export const APP_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", permission: "dashboard.read" },
  { href: "/pos", label: "POS", permission: "pos.read" },
  { href: "/inventory", label: "Inventory", permission: "inventory.read" },
  { href: "/expenses", label: "Expenses", permission: "expenses.read" },
  { href: "/reports", label: "Reports", permission: "reports.read" },
  { href: "/settings/staff", label: "Staff", permission: "staff.read" },
];

export function navItemsForRole(roleKey: string): NavItem[] {
  const permissions = permissionsForRole(roleKey);
  return APP_NAV_ITEMS.filter((item) =>
    hasPermission(permissions, item.permission),
  );
}
