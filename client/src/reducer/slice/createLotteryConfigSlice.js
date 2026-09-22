
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
          message:
            "Some lottery dates already exist, so they were ignored.",
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
        return {
          success: true,
          data: null,
        };
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
        error.response?.data?.message ||
          "Failed to fetch your lottery entries"
      );
    }
  }
);

// =====================================================
// ADD USER LOTTERY ENTRY / SINGLE PURCHASE
// POST /api/lottery/entry
// =====================================================

export const addUserLotteryEntry = createAsyncThunk(
  "createLotteryConfig/addUserLotteryEntry",
  async (
    { configId, number, amount },
    { rejectWithValue }
  ) => {
    try {
      // ==========================================
      // CONFIG ID VALIDATION
      // ==========================================

      if (
        configId === undefined ||
        configId === null ||
        configId === ""
      ) {
        return rejectWithValue(
          "Lottery configId is required"
        );
      }

      const lotteryConfigId = String(configId).trim();

      if (!lotteryConfigId) {
        return rejectWithValue(
          "Lottery configId is required"
        );
      }

      // ==========================================
      // NUMBER VALIDATION
      // ==========================================

      if (
        number === undefined ||
        number === null ||
        number === ""
      ) {
        return rejectWithValue(
          "6 digit lottery number is required"
        );
      }

      const lotteryNumber = String(number).trim();

      if (!/^\d{6}$/.test(lotteryNumber)) {
        return rejectWithValue(
          "Lottery number must be exactly 6 digits"
        );
      }

      // ==========================================
      // AMOUNT VALIDATION
      // ==========================================

      if (
        amount === undefined ||
        amount === null ||
        amount === "" ||
        Number.isNaN(Number(amount))
      ) {
        return rejectWithValue(
          "Valid amount is required"
        );
      }

      const lotteryAmount = Number(amount);

      if (!Number.isFinite(lotteryAmount)) {
        return rejectWithValue(
          "Valid amount is required"
        );
      }

      if (lotteryAmount <= 0) {
        return rejectWithValue(
          "Amount must be greater than 0"
        );
      }

      // ==========================================
      // API REQUEST
      // ==========================================

      const response = await api.post(
        "/lottery/entry",
        {
          configId: lotteryConfigId,
          number: lotteryNumber,
          amount: lotteryAmount,
        }
      );

      // ==========================================
      // SUCCESS
      // ==========================================

      return response.data;
    } catch (error) {
      console.error(
        "addUserLotteryEntry error:",
        error
      );

      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to purchase lottery ticket"
      );
    }
  }
);

// =====================================================
// ADD MULTIPLE USER LOTTERY ENTRIES
// MULTIPLE TICKET PURCHASE
//
// This works with the existing backend endpoint:
//
// POST /api/lottery/entry
//
// Payload from BuyTicket:
//
// {
//   configId: "lottery_id",
//   tickets: ["123456", "456789", "789012"],
//   amount: 100
// }
//
// `amount` = price of ONE ticket.
//
// Total amount = amount × tickets.length
//
// Each ticket is sent separately to the existing API.
// =====================================================

export const addMultipleUserLotteryEntries = createAsyncThunk(
  "createLotteryConfig/addMultipleUserLotteryEntries",
  async (
    { configId, tickets, amount },
    { rejectWithValue }
  ) => {
    try {
      // ==========================================
      // CONFIG ID VALIDATION
      // ==========================================

      if (
        configId === undefined ||
        configId === null ||
        configId === ""
      ) {
        return rejectWithValue(
          "Lottery configId is required"
        );
      }

      const lotteryConfigId = String(configId).trim();

      if (!lotteryConfigId) {
        return rejectWithValue(
          "Lottery configId is required"
        );
      }

      // ==========================================
      // TICKETS VALIDATION
      // ==========================================

      if (!Array.isArray(tickets)) {
        return rejectWithValue(
          "Tickets must be an array"
        );
      }

      if (tickets.length === 0) {
        return rejectWithValue(
          "At least one lottery ticket is required"
        );
      }

      // ==========================================
      // NORMALIZE TICKETS
      // ==========================================

      const normalizedTickets = tickets.map((ticket) =>
        String(ticket ?? "").trim()
      );

      // ==========================================
      // VALIDATE EVERY TICKET
      // ==========================================

      for (let index = 0; index < normalizedTickets.length; index++) {
        const ticket = normalizedTickets[index];

        if (!/^\d{6}$/.test(ticket)) {
          return rejectWithValue(
            `Ticket ${index + 1} must be exactly 6 digits`
          );
        }
      }

      // ==========================================
      // AMOUNT VALIDATION
      // ==========================================

      if (
        amount === undefined ||
        amount === null ||
        amount === "" ||
        Number.isNaN(Number(amount))
      ) {
        return rejectWithValue(
          "Valid amount is required"
        );
      }

      const lotteryAmount = Number(amount);

      if (!Number.isFinite(lotteryAmount)) {
        return rejectWithValue(
          "Valid amount is required"
        );
      }

      if (lotteryAmount <= 0) {
        return rejectWithValue(
          "Amount must be greater than 0"
        );
      }

      // ==========================================
      // TOTAL AMOUNT
      // ==========================================

      const totalAmount =
        lotteryAmount * normalizedTickets.length;

      // ==========================================
      // PURCHASE TICKETS ONE BY ONE
      // ==========================================

      const purchasedEntries = [];
      const failedTickets = [];

      for (let index = 0; index < normalizedTickets.length; index++) {
        const lotteryNumber = normalizedTickets[index];

        try {
          const response = await api.post(
            "/lottery/entry",
            {
              configId: lotteryConfigId,
              number: lotteryNumber,
              amount: lotteryAmount,
            }
          );

          const responseData = response.data;

          // ==========================================
          // STORE SUCCESSFUL ENTRY
          // ==========================================

          if (responseData?.data?.entry) {
            purchasedEntries.push(
              responseData.data.entry
            );
          } else if (responseData?.entry) {
            purchasedEntries.push(
              responseData.entry
            );
          }

        } catch (error) {
          console.error(
            `Failed to purchase ticket ${index + 1}:`,
            error
          );

          failedTickets.push({
            ticket: lotteryNumber,
            ticketIndex: index + 1,
            message:
              error.response?.data?.message ||
              "Failed to purchase this ticket",
          });

          // Stop here so we don't continue charging
          // remaining tickets after an API failure.
          break;
        }
      }

      // ==========================================
      // IF ANY TICKET FAILED
      // ==========================================

      if (failedTickets.length > 0) {
        const successfulCount =
          purchasedEntries.length;

        return rejectWithValue({
          message:
            successfulCount > 0
              ? `${successfulCount} ticket(s) purchased successfully. Ticket ${failedTickets[0].ticketIndex} could not be purchased.`
              : failedTickets[0].message,

          purchasedCount: successfulCount,

          totalTickets:
            normalizedTickets.length,

          purchasedEntries,

          failedTickets,

          totalAmount,

          amountPerTicket: lotteryAmount,
        });
      }

      // ==========================================
      // ALL TICKETS SUCCESSFUL
      // ==========================================

      return {
        success: true,

        message:
          normalizedTickets.length === 1
            ? "Lottery ticket purchased successfully"
            : `${normalizedTickets.length} lottery tickets purchased successfully`,

        purchasedCount:
          normalizedTickets.length,

        totalTickets:
          normalizedTickets.length,

        tickets:
          normalizedTickets,

        purchasedEntries,

        amountPerTicket:
          lotteryAmount,

        totalAmount,
      };
    } catch (error) {
      console.error(
        "addMultipleUserLotteryEntries error:",
        error
      );

      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to purchase lottery tickets"
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
    // =================================================
    // CLEAR ERROR
    // =================================================

    clearLotteryConfigError: (state) => {
      state.error = null;
    },

    // =================================================
    // CLEAR SUCCESS
    // =================================================

    clearLotteryConfigSuccess: (state) => {
      state.successMessage = null;
    },

    // =================================================
    // CLEAR ALL MESSAGES
    // =================================================

    clearLotteryMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    // =================================================
    // CLEAR MY LOTTERY ENTRIES
    // =================================================

    clearMyLotteryEntries: (state) => {
      state.myEntries = [];
      state.totalEntries = 0;
    },

    // =================================================
    // RESET LOTTERY CONFIG
    // =================================================

    resetLotteryConfig: () => initialState,
  },

  extraReducers: (builder) => {
    builder

      // =================================================
      // CREATE CONFIG
      // =================================================

      .addCase(
        createLotteryConfig.pending,
        (state) => {
          state.createLoading = true;
          state.error = null;
          state.successMessage = null;
        }
      )

      .addCase(
        createLotteryConfig.fulfilled,
        (state, action) => {
          state.createLoading = false;

          // Backend returns data as ARRAY
          // because insertMany is used.

          const createdArray =
            action.payload?.data;

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
        }
      )

      .addCase(
        createLotteryConfig.rejected,
        (state, action) => {
          state.createLoading = false;

          state.error =
            action.payload ||
            "Failed to create lottery configuration";
        }
      )

      // =================================================
      // ACTIVE CONFIG
      // =================================================

      .addCase(
        getActiveLotteryConfig.pending,
        (state) => {
          state.activeLoading = true;
          state.error = null;
        }
      )

      .addCase(
        getActiveLotteryConfig.fulfilled,
        (state, action) => {
          state.activeLoading = false;

          const config =
            action.payload?.data || null;

          state.config = config;
          state.activeConfig = config;
          state.error = null;
        }
      )

      .addCase(
        getActiveLotteryConfig.rejected,
        (state, action) => {
          state.activeLoading = false;

          state.error =
            action.payload ||
            "Failed to fetch active lottery configuration";

          state.activeConfig = null;
          state.config = null;
        }
      )

      // =================================================
      // GET MY ENTRIES
      // =================================================

      .addCase(
        getMyLotteryEntries.pending,
        (state) => {
          state.myEntriesLoading = true;
          state.error = null;
        }
      )

      .addCase(
        getMyLotteryEntries.fulfilled,
        (state, action) => {
          state.myEntriesLoading = false;
          state.error = null;

          const data =
            action.payload?.data;

          if (!data) {
            state.myEntries = [];
            state.totalEntries = 0;
            return;
          }

          // Backend returns:
          // {
          //   totalEntries,
          //   data: [...]
          // }

          const entriesArray =
            Array.isArray(data)
              ? data
              : [];

          state.myEntries = entriesArray;

          state.totalEntries =
            action.payload?.totalEntries ??
            entriesArray.length;
        }
      )

      .addCase(
        getMyLotteryEntries.rejected,
        (state, action) => {
          state.myEntriesLoading = false;

          state.error =
            action.payload ||
            "Failed to fetch your lottery entries";

          state.myEntries = [];
          state.totalEntries = 0;
        }
      )

      // =================================================
      // SINGLE PURCHASE / ADD ENTRY
      // =================================================

      .addCase(
        addUserLotteryEntry.pending,
        (state) => {
          state.purchaseLoading = true;
          state.error = null;
          state.successMessage = null;
        }
      )

      .addCase(
        addUserLotteryEntry.fulfilled,
        (state, action) => {
          state.purchaseLoading = false;

          const responseData =
            action.payload?.data;

          // ==============================================
          // UPDATE CONFIG
          // ==============================================

          if (responseData) {
            state.config = {
              ...(state.config || {}),

              _id:
                responseData.lotteryId ||
                state.config?._id,

              marketName:
                responseData.marketName ||
                state.config?.marketName,

              date:
                responseData.date ??
                state.config?.date,

              month:
                responseData.month ??
                state.config?.month,

              year:
                responseData.year ??
                state.config?.year,

              isActive:
                responseData.isActive ??
                state.config?.isActive,
            };

            // ==============================================
            // ADD NEW ENTRY
            // ==============================================

            if (responseData.entry) {
              state.myEntries = [
                responseData.entry,
                ...state.myEntries,
              ];

              state.totalEntries =
                state.myEntries.length;
            }
          }

          state.successMessage =
            action.payload?.message ||
            "Lottery ticket purchased successfully";
        }
      )

      .addCase(
        addUserLotteryEntry.rejected,
        (state, action) => {
          state.purchaseLoading = false;

          state.error =
            action.payload ||
            "Failed to purchase lottery ticket";
        }
      )

      // =================================================
      // MULTIPLE PURCHASE
      // =================================================

      .addCase(
        addMultipleUserLotteryEntries.pending,
        (state) => {
          state.purchaseLoading = true;
          state.error = null;
          state.successMessage = null;
        }
      )

      .addCase(
        addMultipleUserLotteryEntries.fulfilled,
        (state, action) => {
          state.purchaseLoading = false;

          // ==============================================
          // ADD ALL PURCHASED ENTRIES
          // ==============================================

          const purchasedEntries =
            action.payload?.purchasedEntries;

          if (
            Array.isArray(purchasedEntries) &&
            purchasedEntries.length > 0
          ) {
            state.myEntries = [
              ...purchasedEntries,
              ...state.myEntries,
            ];

            state.totalEntries =
              state.myEntries.length;
          }

          // ==============================================
          // UPDATE CONFIG FROM FIRST ENTRY
          // ==============================================

          const firstEntry =
            purchasedEntries?.[0];

          if (firstEntry) {
            state.config = {
              ...(state.config || {}),

              _id:
                firstEntry.lotteryId ||
                state.config?._id,

              marketName:
                firstEntry.marketName ||
                state.config?.marketName,

              date:
                firstEntry.date ??
                state.config?.date,

              month:
                firstEntry.month ??
                state.config?.month,

              year:
                firstEntry.year ??
                state.config?.year,

              isActive:
                firstEntry.isActive ??
                state.config?.isActive,
            };
          }

          // ==============================================
          // SUCCESS MESSAGE
          // ==============================================

          state.successMessage =
            action.payload?.message ||
            `${action.payload?.purchasedCount || 0} lottery tickets purchased successfully`;
        }
      )

      // =================================================
      // MULTIPLE PURCHASE FAILED / PARTIAL SUCCESS
      // =================================================

      .addCase(
        addMultipleUserLotteryEntries.rejected,
        (state, action) => {
          state.purchaseLoading = false;

          const payload =
            action.payload;

          // ==============================================
          // PARTIAL PURCHASE RESPONSE
          // ==============================================

          if (
            payload &&
            typeof payload === "object"
          ) {
            const purchasedEntries =
              payload.purchasedEntries;

            // Keep successfully purchased entries
            if (
              Array.isArray(purchasedEntries) &&
              purchasedEntries.length > 0
            ) {
              state.myEntries = [
                ...purchasedEntries,
                ...state.myEntries,
              ];

              state.totalEntries =
                state.myEntries.length;
            }

            state.error =
              payload.message ||
              "Failed to purchase lottery tickets";
          } else {
            state.error =
              payload ||
              "Failed to purchase lottery tickets";
          }
        }
      );
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

export const selectLotteryConfig = (state) =>
  state.createLotteryConfig.config;

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

export const selectLotteryError = (state) =>
  state.createLotteryConfig.error;

export const selectLotterySuccessMessage = (state) =>
  state.createLotteryConfig.successMessage;

// =====================================================
// DEFAULT
// =====================================================

export default createLotteryConfigSlice.reducer;
