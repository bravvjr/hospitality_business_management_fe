import type { PermissionKey } from "@/lib/auth/permissions";

/**
 * UI-only permission hints for navigation. Backend authorization remains authoritative.
 * Mirrors seeded role grants across backend migrations.
 */
const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  owner: [
    "staff.read",
    "staff.write",
    "staff.status",
    "inventory.read",
    "inventory.write",
    "pos.read",
    "pos.write",
    "expenses.read",
    "expenses.write",
    "dashboard.read",
    "reports.read",
  ],
  manager: [
    "staff.read",
    "staff.write",
    "staff.status",
    "inventory.read",
    "inventory.write",
    "pos.read",
    "pos.write",
    "expenses.read",
    "expenses.write",
    "dashboard.read",
    "reports.read",
  ],
  finance: [
    "inventory.read",
    "pos.read",
    "expenses.read",
    "expenses.write",
    "dashboard.read",
    "reports.read",
  ],
  cashier: [
    "inventory.read",
    "pos.read",
    "pos.write",
    "dashboard.read",
  ],
  kitchen: ["inventory.read", "pos.read"],
};

export function permissionsForRole(roleKey: string): PermissionKey[] {
  return ROLE_PERMISSIONS[roleKey] ?? [];
}
