import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/auth-slice";
import posReducer from "./slices/pos-slice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      pos: posReducer,
    },
    devTools: process.env.NODE_ENV !== "production",
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
