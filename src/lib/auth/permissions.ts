export type PermissionKey =
  | "staff.read"
  | "staff.write"
  | "staff.status"
  | "inventory.read"
  | "inventory.write"
  | "pos.read"
  | "pos.write"
  | "expenses.read"
  | "expenses.write"
  | "dashboard.read"
  | "reports.read"
  | "recipes.read"
  | "recipes.write";

export function hasPermission(
  permissions: string[],
  required: PermissionKey,
): boolean {
  return permissions.includes(required);
}
