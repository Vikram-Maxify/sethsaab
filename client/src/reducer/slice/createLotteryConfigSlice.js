import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
  config: null,
  activeConfig: null,

  loading: false,
  createLoading: false,
  activeLoading: false,
  purchaseLoading: false,

  error: null,
  successMessage: null,
};

// =====================================================
// CREATE LOTTERY CONFIG
// POST /api/lottery
//
// Body:
// {
//   marketName: "Delhi Market",
//   month: 9,
//   year: 2026
// }
// =====================================================

export const createLotteryConfig = createAsyncThunk(
  "createLotteryConfig/create",
  async ({ marketName, month, year }, { rejectWithValue }) => {
    try {
      const response = await api.post("/lottery", {
        marketName,
        month,
        year,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create lottery configuration",
      );
    }
  },
);

// =====================================================
// GET ACTIVE LOTTERY CONFIG
// GET /api/lottery/active
// =====================================================

export const getActiveLotteryConfig = createAsyncThunk(
  "createLotteryConfig/getActiveLotteryConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lottery/active");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch active lottery configuration",
      );
    }
  },
);

// =====================================================
// ADD USER LOTTERY ENTRY / PURCHASE
// POST /api/lottery/entry
//
// Body:
// {
//   number: "123456",
//   amount: 100
// }
// =====================================================

export const addUserLotteryEntry = createAsyncThunk(
  "createLotteryConfig/addUserLotteryEntry",
  async ({ number, amount }, { rejectWithValue }) => {
    try {
      // -----------------------------------------------
      // Validate number
      // -----------------------------------------------

      if (number === undefined || number === null || number === "") {
        return rejectWithValue("6 digit lottery number is required");
      }

      const lotteryNumber = String(number).trim();

      if (!/^\d{6}$/.test(lotteryNumber)) {
        return rejectWithValue("Lottery number must be exactly 6 digits");
      }

      // -----------------------------------------------
      // Validate amount
      // -----------------------------------------------

      if (
        amount === undefined ||
        amount === null ||
        amount === "" ||
        Number.isNaN(Number(amount))
      ) {
        return rejectWithValue("Valid amount is required");
      }

      const lotteryAmount = Number(amount);

      if (lotteryAmount < 0) {
        return rejectWithValue("Amount cannot be negative");
      }

      // -----------------------------------------------
      // API
      // -----------------------------------------------

      const response = await api.post("/lottery/entry", {
        number: lotteryNumber,
        amount: lotteryAmount,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to purchase lottery ticket",
      );
    }
  },
);

// =====================================================
// SLICE
// =====================================================

const createLotteryConfigSlice = createSlice({
  name: "createLotteryConfig",

  initialState,

  reducers: {
    clearLotteryConfigError: (state) => {
      state.error = null;
    },

    clearLotteryConfigSuccess: (state) => {
      state.successMessage = null;
    },

    resetLotteryConfig: () => initialState,
  },

  extraReducers: (builder) => {
    builder

      // =================================================
      // CREATE CONFIG
      // =================================================

      .addCase(createLotteryConfig.pending, (state) => {
        state.createLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(createLotteryConfig.fulfilled, (state, action) => {
        state.createLoading = false;

        const config = action.payload?.data || null;

        state.config = config;

        if (config?.isActive) {
          state.activeConfig = config;
        }

        state.successMessage =
          action.payload?.message ||
          "Lottery configuration created successfully";
      })

      .addCase(createLotteryConfig.rejected, (state, action) => {
        state.createLoading = false;

        state.error =
          action.payload || "Failed to create lottery configuration";
      })

      // =================================================
      // ACTIVE CONFIG
      // =================================================

      .addCase(getActiveLotteryConfig.pending, (state) => {
        state.activeLoading = true;
        state.error = null;
      })

      .addCase(getActiveLotteryConfig.fulfilled, (state, action) => {
        state.activeLoading = false;

        const config = action.payload?.data || null;

        state.config = config;
        state.activeConfig = config;
      })

      .addCase(getActiveLotteryConfig.rejected, (state, action) => {
        state.activeLoading = false;

        // No active config = normal situation
        if (action.payload?.status === 404) {
          state.config = null;
          state.activeConfig = null;
          state.error = null;
        } else {
          state.error =
            action.payload?.message ||
            action.payload ||
            "Failed to fetch active lottery configuration";
        }
      })

      // =================================================
      // PURCHASE
      // =================================================

      .addCase(addUserLotteryEntry.pending, (state) => {
        state.purchaseLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(addUserLotteryEntry.fulfilled, (state, action) => {
        state.purchaseLoading = false;

        /*
            Backend response:

            {
              success: true,
              message: "...",
              data: {
                lotteryId,
                marketName,
                month,
                year,
                entry
              }
            }
          */

        const responseData = action.payload?.data;

        if (responseData) {
          // Keep current config information
          state.config = {
            ...(state.config || {}),
            _id: responseData.lotteryId || state.config?._id,
            marketName: responseData.marketName || state.config?.marketName,
            month: responseData.month ?? state.config?.month,
            year: responseData.year ?? state.config?.year,
          };
        }

        state.successMessage =
          action.payload?.message || "Lottery ticket purchased successfully";
      })

      .addCase(addUserLotteryEntry.rejected, (state, action) => {
        state.purchaseLoading = false;

        state.error = action.payload || "Failed to purchase lottery ticket";
      });
  },
});

// =====================================================
// ACTIONS
// =====================================================

export const {
  clearLotteryConfigError,
  clearLotteryConfigSuccess,
  resetLotteryConfig,
} = createLotteryConfigSlice.actions;

// =====================================================
// SELECTORS
// =====================================================

export const selectLotteryConfig = (state) => state.createLotteryConfig.config;

export const selectActiveLotteryConfig = (state) =>
  state.createLotteryConfig.activeConfig;

export const selectLotteryLoading = (state) =>
  state.createLotteryConfig.loading;

export const selectLotteryCreateLoading = (state) =>
  state.createLotteryConfig.createLoading;

export const selectLotteryActiveLoading = (state) =>
  state.createLotteryConfig.activeLoading;

export const selectLotteryPurchaseLoading = (state) =>
  state.createLotteryConfig.purchaseLoading;

export const selectLotteryError = (state) => state.createLotteryConfig.error;

export const selectLotterySuccessMessage = (state) =>
  state.createLotteryConfig.successMessage;

// =====================================================
// DEFAULT
// =====================================================

export default createLotteryConfigSlice.reducer;
