import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
  config: null,
  activeConfig: null,

  // User entries
  myEntries: [],
  totalEntries: 0,

  loading: false,
  createLoading: false,
  activeLoading: false,
  purchaseLoading: false,
  myEntriesLoading: false,

  error: null,
  successMessage: null,
};

// =====================================================
// CREATE LOTTERY CONFIG
// POST /api/lottery
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
// GET MY LOTTERY ENTRIES
// GET /api/lottery/my-entries
//
// JWT se user ID automatically backend par milegi
// =====================================================

export const getMyLotteryEntries = createAsyncThunk(
  "createLotteryConfig/getMyLotteryEntries",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lottery/my-entries");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch your lottery entries",
      );
    }
  },
);

// =====================================================
// ADD USER LOTTERY ENTRY / PURCHASE
// POST /api/lottery/entry
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
    // -----------------------------------------------
    // CLEAR ERROR
    // -----------------------------------------------

    clearLotteryConfigError: (state) => {
      state.error = null;
    },

    // -----------------------------------------------
    // CLEAR SUCCESS
    // -----------------------------------------------

    clearLotteryConfigSuccess: (state) => {
      state.successMessage = null;
    },

    // -----------------------------------------------
    // CLEAR MY ENTRIES
    // -----------------------------------------------

    clearMyLotteryEntries: (state) => {
      state.myEntries = [];
      state.totalEntries = 0;
    },

    // -----------------------------------------------
    // RESET
    // -----------------------------------------------

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
      // ACTIVE CONFIG - PENDING
      // =================================================

      .addCase(getActiveLotteryConfig.pending, (state) => {
        state.activeLoading = true;
        state.error = null;
      })

      // =================================================
      // ACTIVE CONFIG - SUCCESS
      // =================================================

      .addCase(getActiveLotteryConfig.fulfilled, (state, action) => {
        state.activeLoading = false;

        const config = action.payload?.data || null;

        state.config = config;
        state.activeConfig = config;
      })

      // =================================================
      // ACTIVE CONFIG - ERROR
      // =================================================

      .addCase(getActiveLotteryConfig.rejected, (state, action) => {
        state.activeLoading = false;

        state.error =
          action.payload || "Failed to fetch active lottery configuration";
      })

      // =================================================
      // GET MY ENTRIES - PENDING
      // =================================================

      .addCase(getMyLotteryEntries.pending, (state) => {
        state.myEntriesLoading = true;
        state.error = null;
      })

      // =================================================
      // GET MY ENTRIES - SUCCESS
      // =================================================

      .addCase(getMyLotteryEntries.fulfilled, (state, action) => {
        state.myEntriesLoading = false;
        state.error = null;

        const data = action.payload?.data;

        if (data) {
          // Backend returns user lottery entries inside data.users.
          // Also keep data.entries support for backward compatibility.
          state.myEntries = Array.isArray(data.users)
            ? data.users
            : Array.isArray(data.entries)
              ? data.entries
              : [];

          state.totalEntries = data.totalEntries ?? state.myEntries.length;

          // ---------------------------------------------
          // Update active/config information
          // ---------------------------------------------

          state.config = {
            ...(state.config || {}),
            _id: data.lotteryId || data._id || state.config?._id,

            marketName: data.marketName || state.config?.marketName,

            month: data.month ?? state.config?.month,

            year: data.year ?? state.config?.year,

            isActive: data.isActive ?? state.config?.isActive,
          };

          if (data.isActive !== undefined) {
            state.activeConfig = {
              ...(state.activeConfig || {}),
              _id: data.lotteryId || data._id || state.activeConfig?._id,

              marketName: data.marketName || state.activeConfig?.marketName,

              month: data.month ?? state.activeConfig?.month,

              year: data.year ?? state.activeConfig?.year,

              isActive: data.isActive,
            };
          }
        } else {
          state.myEntries = [];
          state.totalEntries = 0;
        }
      })

      // =================================================
      // GET MY ENTRIES - ERROR
      // =================================================

      .addCase(getMyLotteryEntries.rejected, (state, action) => {
        state.myEntriesLoading = false;

        state.error = action.payload || "Failed to fetch your lottery entries";

        state.myEntries = [];
        state.totalEntries = 0;
      })

      // =================================================
      // PURCHASE - PENDING
      // =================================================

      .addCase(addUserLotteryEntry.pending, (state) => {
        state.purchaseLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      // =================================================
      // PURCHASE - SUCCESS
      // =================================================

      .addCase(addUserLotteryEntry.fulfilled, (state, action) => {
        state.purchaseLoading = false;

        const responseData = action.payload?.data;

        if (responseData) {
          // ---------------------------------------------
          // Update config
          // ---------------------------------------------

          state.config = {
            ...(state.config || {}),

            _id: responseData.lotteryId || state.config?._id,

            marketName: responseData.marketName || state.config?.marketName,

            month: responseData.month ?? state.config?.month,

            year: responseData.year ?? state.config?.year,
          };

          // ---------------------------------------------
          // Add newly purchased entry to Redux
          // ---------------------------------------------

          if (responseData.entry) {
            state.myEntries = [responseData.entry, ...state.myEntries];

            state.totalEntries = state.myEntries.length;
          }
        }

        state.successMessage =
          action.payload?.message || "Lottery ticket purchased successfully";
      })

      // =================================================
      // PURCHASE - ERROR
      // =================================================

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
  clearMyLotteryEntries,
  resetLotteryConfig,
} = createLotteryConfigSlice.actions;

// =====================================================
// SELECTORS
// =====================================================

// Config
export const selectLotteryConfig = (state) => state.createLotteryConfig.config;

export const selectActiveLotteryConfig = (state) =>
  state.createLotteryConfig.activeConfig;

// Loading
export const selectLotteryLoading = (state) =>
  state.createLotteryConfig.loading;

export const selectLotteryCreateLoading = (state) =>
  state.createLotteryConfig.createLoading;

export const selectLotteryActiveLoading = (state) =>
  state.createLotteryConfig.activeLoading;

export const selectLotteryPurchaseLoading = (state) =>
  state.createLotteryConfig.purchaseLoading;

export const selectMyLotteryEntriesLoading = (state) =>
  state.createLotteryConfig.myEntriesLoading;

// My entries
export const selectMyLotteryEntries = (state) =>
  state.createLotteryConfig.myEntries;

export const selectMyLotteryTotalEntries = (state) =>
  state.createLotteryConfig.totalEntries;

// Error / Success
export const selectLotteryError = (state) => state.createLotteryConfig.error;

export const selectLotterySuccessMessage = (state) =>
  state.createLotteryConfig.successMessage;

// =====================================================
// DEFAULT
// =====================================================

export default createLotteryConfigSlice.reducer;
