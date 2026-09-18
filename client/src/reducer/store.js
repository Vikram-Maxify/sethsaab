import { configureStore } from "@reduxjs/toolkit";
import adminAuthReducer from "./slice/adminAuthReducer";
import authReducer from "./slice/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminAuth: adminAuthReducer,
  },
});
