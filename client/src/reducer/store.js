import { configureStore } from "@reduxjs/toolkit";

import adminAuthReducer from "./slice/adminAuthReducer";
import amountReducer from "./slice/amountReducer";
import authReducer from "./slice/authSlice";

import lotteryConfigReducer from "./slice/lotteryConfigSlice";

import createLotteryConfigReducer from "./slice/createLotteryConfigSlice";

import lotteryResultReducer from "./slice/lotteryResultReducer";

import adminLotteryReducer from './slice/adminLotteryReducer'
export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminAuth: adminAuthReducer,
    amount: amountReducer,
    lotteryResult: lotteryResultReducer,
    lotteryConfig: lotteryConfigReducer,
    adminLottery: adminLotteryReducer,

    createLotteryConfig: createLotteryConfigReducer,
  },
});
