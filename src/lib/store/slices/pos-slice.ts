import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface PosState {
  openOrderId: string | null;
  receiptOrderId: string | null;
}

const initialState: PosState = {
  openOrderId: null,
  receiptOrderId: null,
};

const posSlice = createSlice({
  name: "pos",
  initialState,
  reducers: {
    setOpenOrderId(state, action: PayloadAction<string | null>) {
      state.openOrderId = action.payload;
    },
    setReceiptOrderId(state, action: PayloadAction<string | null>) {
      state.receiptOrderId = action.payload;
    },
    clearPosSale(state) {
      state.openOrderId = null;
    },
    resetPos() {
      return initialState;
    },
  },
});

export const { setOpenOrderId, setReceiptOrderId, clearPosSale, resetPos } =
  posSlice.actions;
export default posSlice.reducer;
