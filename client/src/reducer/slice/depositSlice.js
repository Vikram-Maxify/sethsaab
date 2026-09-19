import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

/* ==========================================================
   CREATE DEPOSIT
========================================================== */

export const createDeposit = createAsyncThunk(
  "deposit/createDeposit",
  async (depositData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // ==========================================
      // GATEWAY
      // ==========================================

      if (depositData.gatewayId) {
        formData.append("gatewayId", depositData.gatewayId);
      }

      // ==========================================
      // PAYMENT INFO
      // ==========================================

      formData.append(
        "paymentMethod",
        depositData.paymentMethod || "INR"
      );

      formData.append(
        "channel",
        depositData.channel || "voterx"
      );

      formData.append("amount", depositData.amount);

      if (depositData.utr) {
        formData.append("utr", depositData.utr);
      }

      // ==========================================
      // LOTTERY FIELDS  ← YAHI FIX HAI
      // ==========================================

      if (depositData.configId) {
        formData.append("configId", depositData.configId);
      }

      if (depositData.entryId) {
        formData.append("entryId", depositData.entryId);
      }

      if (depositData.number) {
        formData.append("number", depositData.number);
      }

      // ==========================================
      // PAYMENT PROOF (OPTIONAL)
      // ==========================================

      if (depositData.paymentProof instanceof File) {
        formData.append("image", depositData.paymentProof);
      }

      const { data } = await api.post("/deposit", formData);

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Deposit submission failed"
      );
    }
  }
);

/* ==========================================================
   GET MY DEPOSITS
========================================================== */

export const getMyDeposits = createAsyncThunk(
  "deposit/getMyDeposits",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();

      if (filters.status)
        params.append("status", filters.status);

      if (filters.paymentMethod)
        params.append("paymentMethod", filters.paymentMethod);

      if (filters.channel)
        params.append("channel", filters.channel);

      if (filters.phone)
        params.append("phone", filters.phone);

      if (filters.username)
        params.append("username", filters.username);

      if (filters.orderId)
        params.append("orderId", filters.orderId);

      if (filters.transactionId)
        params.append(
          "transactionId",
          filters.transactionId
        );

      if (filters.utr)
        params.append("utr", filters.utr);

      if (filters.fromDate)
        params.append("fromDate", filters.fromDate);

      if (filters.toDate)
        params.append("toDate", filters.toDate);

      if (filters.minAmount)
        params.append("minAmount", filters.minAmount);

      if (filters.maxAmount)
        params.append("maxAmount", filters.maxAmount);

      if (filters.page)
        params.append("page", filters.page);

      if (filters.limit)
        params.append("limit", filters.limit);

      if (filters.sort)
        params.append("sort", filters.sort);

      const queryString = params.toString();

      const url = `/deposit${
        queryString ? `?${queryString}` : ""
      }`;

      const { data } = await api.get(url);

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch deposits"
      );
    }
  }
);

/* ==========================================================
   GET SINGLE DEPOSIT
========================================================== */

export const getSingleDeposit = createAsyncThunk(
  "deposit/getSingleDeposit",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/deposit/${id}`);

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch deposit details"
      );
    }
  }
);

/* ==========================================================
   INITIAL STATE
========================================================== */

const initialState = {
  loading: false,

  success: false,

  error: null,

  message: "",

  deposits: [],

  currentDeposit: null,

  paymentUrl: null,

  pagination: {
    total: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },

  filters: {
    status: "",
    paymentMethod: "",
    channel: "",
    phone: "",
    username: "",
    orderId: "",
    transactionId: "",
    utr: "",
    fromDate: "",
    toDate: "",
    minAmount: "",
    maxAmount: "",
    sort: "desc",
  },
};

/* ==========================================================
   SLICE
========================================================== */

const depositSlice = createSlice({
  name: "deposit",

  initialState,

  reducers: {
    clearDepositState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.message = "";
      state.paymentUrl = null;
    },

    clearDeposits: (state) => {
      state.deposits = [];

      state.pagination = {
        total: 0,
        currentPage: 1,
        totalPages: 0,
        limit: 10,
      };
    },

    clearCurrentDeposit: (state) => {
      state.currentDeposit = null;
      state.paymentUrl = null;
    },

    setDepositFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    resetDepositFilters: (state) => {
      state.filters = {
        status: "",
        paymentMethod: "",
        channel: "",
        phone: "",
        username: "",
        orderId: "",
        transactionId: "",
        utr: "",
        fromDate: "",
        toDate: "",
        minAmount: "",
        maxAmount: "",
        sort: "desc",
      };
    },
  },

  extraReducers: (builder) => {
    builder

      /* =====================================================
         CREATE DEPOSIT
      ===================================================== */

      .addCase(createDeposit.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.message = "";
        state.paymentUrl = null;
      })

      .addCase(createDeposit.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.message =
          action.payload?.message ||
          "Payment order created successfully.";

        state.paymentUrl =
          action.payload?.paymentUrl || null;

        if (action.payload?.deposit) {
          state.currentDeposit =
            action.payload.deposit;

          state.deposits = [
            action.payload.deposit,
            ...state.deposits,
          ];
        }
      })

      .addCase(createDeposit.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        state.error =
          action.payload ||
          "Deposit submission failed";

        state.paymentUrl = null;
      })

      /* =====================================================
         GET MY DEPOSITS
      ===================================================== */

      .addCase(getMyDeposits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getMyDeposits.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.deposits =
          action.payload?.deposits || [];

        state.pagination = {
          total: action.payload?.total || 0,

          currentPage:
            action.payload?.currentPage || 1,

          totalPages:
            action.payload?.totalPages || 0,

          limit:
            action.payload?.limit ||
            state.pagination.limit ||
            10,
        };
      })

      .addCase(getMyDeposits.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload ||
          "Failed to fetch deposits";
      })

      /* =====================================================
         GET SINGLE DEPOSIT
      ===================================================== */

      .addCase(getSingleDeposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getSingleDeposit.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.currentDeposit =
          action.payload?.deposit || null;
      })

      .addCase(getSingleDeposit.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload ||
          "Failed to fetch deposit details";

        state.currentDeposit = null;
      });
  },
});

/* ==========================================================
   ACTIONS
========================================================== */

export const {
  clearDepositState,
  clearDeposits,
  clearCurrentDeposit,
  setDepositFilters,
  resetDepositFilters,
} = depositSlice.actions;

export default depositSlice.reducer;