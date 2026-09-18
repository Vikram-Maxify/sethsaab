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
// POST /api/lottery/create
// =====================================================

export const createLotteryConfig = createAsyncThunk(
  "createLotteryConfig/create",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const response = await api.post("/lottery/create", {
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
// POST /api/lottery/:id/date/:dateId/user
// =====================================================

export const addUserLotteryEntry = createAsyncThunk(
  "createLotteryConfig/addUserLotteryEntry",
  async ({ id, dateId, numbers, amount }, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Lottery configuration ID is required");
      }

      if (!dateId) {
        return rejectWithValue("Lottery date ID is required");
      }

      if (!Array.isArray(numbers) || numbers.length !== 6) {
        return rejectWithValue("Exactly 6 lottery numbers are required");
      }

      const response = await api.post(`/lottery/${id}/date/${dateId}/user`, {
        numbers,
        amount,
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

      // ACTIVE CONFIG
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

        state.error =
          action.payload || "Failed to fetch active lottery configuration";
      })

      // PURCHASE
      .addCase(addUserLotteryEntry.pending, (state) => {
        state.purchaseLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(addUserLotteryEntry.fulfilled, (state, action) => {
        state.purchaseLoading = false;

        if (action.payload?.data) {
          state.config = action.payload.data;
          state.activeConfig = action.payload.data;
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

export const selectLotteryLoading = (state) =>
  state.createLotteryConfig.loading;

export const selectLotteryPurchaseLoading = (state) =>
  state.createLotteryConfig.purchaseLoading;

export const selectLotteryError = (state) => state.createLotteryConfig.error;

export const selectLotterySuccessMessage = (state) =>
  state.createLotteryConfig.successMessage;

// =====================================================
// DEFAULT
// =====================================================

export default createLotteryConfigSlice.reducer;
