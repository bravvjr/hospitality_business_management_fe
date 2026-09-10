export type ModuleKey = "inventory" | "pos" | "finance";

export function hasEntitlement(
  entitlements: string[],
  module: ModuleKey,
): boolean {
  return entitlements.includes(module);
}
