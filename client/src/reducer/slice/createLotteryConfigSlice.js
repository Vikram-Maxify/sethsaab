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
//
// Backend returns:
//   { success, message, totalCreated, startDay, endDay, data: [...] }
// =====================================================

export const createLotteryConfig = createAsyncThunk(
  "createLotteryConfig/create",
  async (
    { marketName, month, year, prizes },
    { rejectWithValue }
  ) => {
    try {
      // =====================================================
      // VALIDATION
      // =====================================================

      if (
        !marketName ||
        typeof marketName !== "string" ||
        !marketName.trim()
      ) {
        return rejectWithValue("Market name is required");
      }

      if (!prizes || typeof prizes !== "object") {
        return rejectWithValue("Prize amounts are required");
      }

      if (
        prizes.first === undefined ||
        prizes.second === undefined ||
        prizes.third === undefined
      ) {
        return rejectWithValue(
          "All three prize amounts are required"
        );
      }

      // =====================================================
      // CREATE BODY
      // =====================================================

      const body = {
        marketName: marketName.trim(),
        prizes: {
          first: Number(prizes.first),
          second: Number(prizes.second),
          third: Number(prizes.third),
        },
      };

      if (month !== undefined && month !== null) {
        body.month = Number(month);
      }

      if (year !== undefined && year !== null) {
        body.year = Number(year);
      }

      // =====================================================
      // API REQUEST
      // =====================================================

      const response = await api.post("/lottery", body);

      // =====================================================
      // SUCCESS
      // =====================================================

      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;

      // =====================================================
      // DUPLICATE DATE
      // =====================================================

      if (
        status === 400 &&
        (
          data?.message?.toLowerCase()?.includes("already exist") ||
          data?.message?.toLowerCase()?.includes("already exists") ||
          data?.message?.toLowerCase()?.includes("duplicate")
        )
      ) {
        // Duplicate ko error nahi maanenge
        return {
          success: true,
          skipped: true,
          duplicate: true,
          message: "Some lottery dates already exist, so they were ignored.",
          data,
        };
      }

      // =====================================================
      // OTHER ERROR
      // =====================================================

      return rejectWithValue(
        data?.message ||
          "Failed to create lottery configuration"
      );
    }
  }
);

// =====================================================
// GET ACTIVE LOTTERY CONFIG
// GET /api/lottery/active
//
// 200 → { success: true, data: {...} }
// 404 → treated as "no active config" (NOT an error)
// =====================================================

export const getActiveLotteryConfig = createAsyncThunk(
  "createLotteryConfig/getActiveLotteryConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lottery/active");
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true, data: null };
      }

      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch active lottery configuration"
      );
    }
  }
);

// =====================================================
// GET MY LOTTERY ENTRIES
// GET /api/lottery/my-entries
// =====================================================

export const getMyLotteryEntries = createAsyncThunk(
  "createLotteryConfig/getMyLotteryEntries",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lottery/my-entries");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch your lottery entries"
      );
    }
  }
);

// =====================================================
// ADD USER LOTTERY ENTRY / PURCHASE
// POST /api/lottery/entry
// =====================================================

export const addUserLotteryEntry = createAsyncThunk(
  "createLotteryConfig/addUserLotteryEntry",
  async ({ number, amount }, { rejectWithValue }) => {
    try {
      if (number === undefined || number === null || number === "") {
        return rejectWithValue("6 digit lottery number is required");
      }

      const lotteryNumber = String(number).trim();

      if (!/^\d{6}$/.test(lotteryNumber)) {
        return rejectWithValue("Lottery number must be exactly 6 digits");
      }

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

      const response = await api.post("/lottery/entry", {
        number: lotteryNumber,
        amount: lotteryAmount,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to purchase lottery ticket"
      );
    }
  }
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

    clearLotteryMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    clearMyLotteryEntries: (state) => {
      state.myEntries = [];
      state.totalEntries = 0;
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

        // Backend returns data as ARRAY (insertMany)
        const createdArray = action.payload?.data;
        const created = Array.isArray(createdArray)
          ? createdArray[0] || null
          : createdArray || null;

        state.config = created;

        if (created?.isActive) {
          state.activeConfig = created;
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
        state.error = null;
      })

      .addCase(getActiveLotteryConfig.rejected, (state, action) => {
        state.activeLoading = false;
        state.error =
          action.payload || "Failed to fetch active lottery configuration";
        state.activeConfig = null;
        state.config = null;
      })

      // =================================================
      // GET MY ENTRIES
      // =================================================

      .addCase(getMyLotteryEntries.pending, (state) => {
        state.myEntriesLoading = true;
        state.error = null;
      })

      .addCase(getMyLotteryEntries.fulfilled, (state, action) => {
        state.myEntriesLoading = false;
        state.error = null;

        const data = action.payload?.data;

        if (!data) {
          state.myEntries = [];
          state.totalEntries = 0;
          return;
        }

        // Backend returns `{ totalEntries, data: [...] }` — data is a flat array
        const entriesArray = Array.isArray(data) ? data : [];

        state.myEntries = entriesArray;
        state.totalEntries =
          action.payload?.totalEntries ?? entriesArray.length;
      })

      .addCase(getMyLotteryEntries.rejected, (state, action) => {
        state.myEntriesLoading = false;
        state.error =
          action.payload || "Failed to fetch your lottery entries";
        state.myEntries = [];
        state.totalEntries = 0;
      })

      // =================================================
      // PURCHASE / ADD ENTRY
      // =================================================

      .addCase(addUserLotteryEntry.pending, (state) => {
        state.purchaseLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(addUserLotteryEntry.fulfilled, (state, action) => {
        state.purchaseLoading = false;

        const responseData = action.payload?.data;

        if (responseData) {
          state.config = {
            ...(state.config || {}),
            _id: responseData.lotteryId || state.config?._id,
            marketName: responseData.marketName || state.config?.marketName,
            date: responseData.date ?? state.config?.date,
            month: responseData.month ?? state.config?.month,
            year: responseData.year ?? state.config?.year,
            isActive: responseData.isActive ?? state.config?.isActive,
          };

          if (responseData.entry) {
            state.myEntries = [responseData.entry, ...state.myEntries];
            state.totalEntries = state.myEntries.length;
          }
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
  clearLotteryMessages,
  clearMyLotteryEntries,
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

export const selectMyLotteryEntriesLoading = (state) =>
  state.createLotteryConfig.myEntriesLoading;

export const selectMyLotteryEntries = (state) =>
  state.createLotteryConfig.myEntries;

export const selectMyLotteryTotalEntries = (state) =>
  state.createLotteryConfig.totalEntries;

export const selectLotteryError = (state) => state.createLotteryConfig.error;

export const selectLotterySuccessMessage = (state) =>
  state.createLotteryConfig.successMessage;

// =====================================================
// DEFAULT
// =====================================================

export default createLotteryConfigSlice.reducer;