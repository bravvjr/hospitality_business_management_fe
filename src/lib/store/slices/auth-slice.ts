import { createSlice } from "@reduxjs/toolkit";

export interface AuthState {
  hydrated: boolean;
}

const initialState: AuthState = {
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setHydrated(state, action: { payload: boolean }) {
      state.hydrated = action.payload;
    },
    resetAuth() {
      return initialState;
    },
  },
});

export const { setHydrated, resetAuth } = authSlice.actions;
export default authSlice.reducer;
