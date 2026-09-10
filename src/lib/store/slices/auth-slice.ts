import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type {
  MembershipRead,
  TenantSummary,
  UserRead,
} from "@/features/auth/types";

export interface AuthState {
  hydrated: boolean;
  user: UserRead | null;
  tenant: TenantSummary | null;
  membership: MembershipRead | null;
}

const initialState: AuthState = {
  hydrated: false,
  user: null,
  tenant: null,
  membership: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(
      state,
      action: PayloadAction<{
        user: UserRead;
        tenant: TenantSummary;
        membership: MembershipRead;
      }>,
    ) {
      state.user = action.payload.user;
      state.tenant = action.payload.tenant;
      state.membership = action.payload.membership;
      state.hydrated = true;
    },
    clearSession(state) {
      state.user = null;
      state.tenant = null;
      state.membership = null;
      state.hydrated = true;
    },
    setHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
    },
    resetAuth() {
      return initialState;
    },
  },
});

export const { setSession, clearSession, setHydrated, resetAuth } =
  authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.user !== null;
