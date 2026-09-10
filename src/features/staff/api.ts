import { apiFetch } from "@/lib/api/client";
import type { Page } from "@/features/inventory/types";

export interface RoleRead {
  id: string;
  key: string;
  name: string;
}

export interface StaffUser {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export interface StaffMembership {
  id: string;
  tenant_id: string;
  role: RoleRead;
}

export interface StaffMember {
  membership: StaffMembership;
  user: StaffUser;
}

export function listRoles(): Promise<RoleRead[]> {
  return apiFetch<RoleRead[]>("/api/v1/auth/roles");
}

export function listStaff(params?: {
  limit?: number;
  offset?: number;
}): Promise<Page<StaffMember>> {
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;
  return apiFetch<Page<StaffMember>>(
    `/api/v1/auth/staff?limit=${limit}&offset=${offset}`,
  );
}

export function addStaff(payload: {
  email: string;
  password?: string | null;
  role_key: string;
}): Promise<StaffMember> {
  return apiFetch<StaffMember>("/api/v1/auth/staff", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStaffRole(
  membershipId: string,
  payload: { role_key: string },
): Promise<StaffMember> {
  return apiFetch<StaffMember>(`/api/v1/auth/staff/${membershipId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function removeStaff(membershipId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/auth/staff/${membershipId}`, {
    method: "DELETE",
  });
}

export function updateStaffStatus(
  membershipId: string,
  payload: { status: "active" | "inactive" },
): Promise<StaffMember> {
  return apiFetch<StaffMember>(
    `/api/v1/auth/staff/${membershipId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
