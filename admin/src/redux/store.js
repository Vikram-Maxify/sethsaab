import { configureStore } from "@reduxjs/toolkit";

import adminAuthReducer from "./reducers/adminAuthReducer";

const store = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
  },
});

export default store;