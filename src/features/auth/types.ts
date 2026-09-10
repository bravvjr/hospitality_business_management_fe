/** Session payload from `/api/v1/auth/*` (matches backend SessionRead). */

export interface RoleRead {
  id: string;
  key: string;
  name: string;
}

export interface UserRead {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  base_currency: string;
}

export interface MembershipRead {
  id: string;
  tenant_id: string;
  role: RoleRead;
}

export interface SessionRead {
  user: UserRead;
  tenant: TenantSummary;
  membership: MembershipRead;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenant_id?: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  tenant_name: string;
  base_currency?: string;
}
