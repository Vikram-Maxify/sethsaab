import { configureStore } from "@reduxjs/toolkit";
import adminAuthReducer from "./slice/adminAuthReducer";
import authReducer from "./slice/authSlice";
import amountReducer from './slice/amountReducer';
import lotteryResultReducer from './slice/lotteryResultReducer'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminAuth: adminAuthReducer,
    amount: amountReducer,
    lotteryResult: lotteryResultReducer,

  },
});
