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
      // LOTTERY FIELDS
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
      // PAYMENT PROOF
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

      if (filters.status !== undefined && filters.status !== "")
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

      if (
        filters.minAmount !== undefined &&
        filters.minAmount !== ""
      )
        params.append("minAmount", filters.minAmount);

      if (
        filters.maxAmount !== undefined &&
        filters.maxAmount !== ""
      )
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
   ADMIN - GET ALL DEPOSITS
========================================================== */

export const getAllDepositsForAdmin = createAsyncThunk(
  "deposit/getAllDepositsForAdmin",

  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();

      // ==========================================
      // STATUS
      // 0 = Pending
      // 1 = Success
      // 2 = Failed
      // ==========================================

      if (
        filters.status !== undefined &&
        filters.status !== ""
      ) {
        params.append("status", filters.status);
      }

      // ==========================================
      // PAYMENT METHOD
      // ==========================================

      if (filters.paymentMethod) {
        params.append(
          "paymentMethod",
          filters.paymentMethod
        );
      }

      // ==========================================
      // CHANNEL
      // ==========================================

      if (filters.channel) {
        params.append(
          "channel",
          filters.channel
        );
      }

      // ==========================================
      // PHONE
      // ==========================================

      if (filters.phone) {
        params.append(
          "phone",
          filters.phone
        );
      }

      // ==========================================
      // USERNAME
      // ==========================================

      if (filters.username) {
        params.append(
          "username",
          filters.username
        );
      }

      // ==========================================
      // UID
      // ==========================================

      if (filters.uid) {
        params.append(
          "uid",
          filters.uid
        );
      }

      // ==========================================
      // ORDER ID
      // ==========================================

      if (filters.orderId) {
        params.append(
          "orderId",
          filters.orderId
        );
      }

      // ==========================================
      // TRANSACTION ID
      // ==========================================

      if (filters.transactionId) {
        params.append(
          "transactionId",
          filters.transactionId
        );
      }

      // ==========================================
      // UTR
      // ==========================================

      if (filters.utr) {
        params.append(
          "utr",
          filters.utr
        );
      }

      // ==========================================
      // DATE
      // ==========================================

      if (filters.fromDate) {
        params.append(
          "fromDate",
          filters.fromDate
        );
      }

      if (filters.toDate) {
        params.append(
          "toDate",
          filters.toDate
        );
      }

      // ==========================================
      // AMOUNT
      // ==========================================

      if (
        filters.minAmount !== undefined &&
        filters.minAmount !== ""
      ) {
        params.append(
          "minAmount",
          filters.minAmount
        );
      }

      if (
        filters.maxAmount !== undefined &&
        filters.maxAmount !== ""
      ) {
        params.append(
          "maxAmount",
          filters.maxAmount
        );
      }

      // ==========================================
      // PAGINATION
      // ==========================================

      params.append(
        "page",
        filters.page || 1
      );

      params.append(
        "limit",
        filters.limit || 20
      );

      // ==========================================
      // SORT
      // ==========================================

      params.append(
        "sort",
        filters.sort || "desc"
      );

      // ==========================================
      // API
      // ==========================================

      const queryString = params.toString();

      const url = `/deposits?${queryString}`;

      const { data } = await api.get(url);

      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch all deposits"
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
      const { data } = await api.get(
        `/deposit/${id}`
      );

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

  // ==========================================
  // USER DEPOSITS
  // ==========================================

  deposits: [],

  // ==========================================
  // ADMIN ALL DEPOSITS
  // ==========================================

  adminDeposits: [],

  // ==========================================
  // CURRENT DEPOSIT
  // ==========================================

  currentDeposit: null,

  paymentUrl: null,

  // ==========================================
  // USER PAGINATION
  // ==========================================

  pagination: {
    total: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },

  // ==========================================
  // ADMIN PAGINATION
  // ==========================================

  adminPagination: {
    total: 0,
    currentPage: 1,
    totalPages: 0,
    perPage: 20,
  },

  // ==========================================
  // USER FILTERS
  // ==========================================

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

  // ==========================================
  // ADMIN FILTERS
  // ==========================================

  adminFilters: {
    status: "",
    paymentMethod: "",
    channel: "",
    phone: "",
    username: "",
    uid: "",
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
    // ==========================================
    // CLEAR GENERAL STATE
    // ==========================================

    clearDepositState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.message = "";
      state.paymentUrl = null;
    },

    // ==========================================
    // CLEAR USER DEPOSITS
    // ==========================================

    clearDeposits: (state) => {
      state.deposits = [];

      state.pagination = {
        total: 0,
        currentPage: 1,
        totalPages: 0,
        limit: 10,
      };
    },

    // ==========================================
    // CLEAR ADMIN DEPOSITS
    // ==========================================

    clearAdminDeposits: (state) => {
      state.adminDeposits = [];

      state.adminPagination = {
        total: 0,
        currentPage: 1,
        totalPages: 0,
        perPage: 20,
      };
    },

    // ==========================================
    // CLEAR CURRENT DEPOSIT
    // ==========================================

    clearCurrentDeposit: (state) => {
      state.currentDeposit = null;
      state.paymentUrl = null;
    },

    // ==========================================
    // USER FILTERS
    // ==========================================

    setDepositFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    // ==========================================
    // ADMIN FILTERS
    // ==========================================

    setAdminDepositFilters: (state, action) => {
      state.adminFilters = {
        ...state.adminFilters,
        ...action.payload,
      };
    },

    // ==========================================
    // RESET USER FILTERS
    // ==========================================

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

    // ==========================================
    // RESET ADMIN FILTERS
    // ==========================================

    resetAdminDepositFilters: (state) => {
      state.adminFilters = {
        status: "",
        paymentMethod: "",
        channel: "",
        phone: "",
        username: "",
        uid: "",
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

      .addCase(
        createDeposit.pending,
        (state) => {
          state.loading = true;
          state.success = false;
          state.error = null;
          state.message = "";
          state.paymentUrl = null;
        }
      )

      .addCase(
        createDeposit.fulfilled,
        (state, action) => {
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
        }
      )

      .addCase(
        createDeposit.rejected,
        (state, action) => {
          state.loading = false;
          state.success = false;

          state.error =
            action.payload ||
            "Deposit submission failed";

          state.paymentUrl = null;
        }
      )

      /* =====================================================
         GET MY DEPOSITS
      ===================================================== */

      .addCase(
        getMyDeposits.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getMyDeposits.fulfilled,
        (state, action) => {
          state.loading = false;
          state.success = true;

          state.deposits =
            action.payload?.deposits || [];

          state.pagination = {
            total:
              action.payload?.total || 0,

            currentPage:
              action.payload?.currentPage || 1,

            totalPages:
              action.payload?.totalPages || 0,

            limit:
              action.payload?.limit ||
              state.pagination.limit ||
              10,
          };
        }
      )

      .addCase(
        getMyDeposits.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to fetch deposits";
        }
      )

      /* =====================================================
         ADMIN - GET ALL DEPOSITS
      ===================================================== */

      .addCase(
        getAllDepositsForAdmin.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getAllDepositsForAdmin.fulfilled,
        (state, action) => {
          state.loading = false;
          state.success = true;

          // ========================================
          // ALL ADMIN DEPOSITS
          // ========================================

          state.adminDeposits =
            action.payload?.deposits || [];

          // ========================================
          // ADMIN PAGINATION
          // ========================================

          state.adminPagination = {
            total:
              action.payload?.total || 0,

            currentPage:
              action.payload?.currentPage || 1,

            totalPages:
              action.payload?.totalPages || 0,

            perPage:
              action.payload?.perPage ||
              action.payload?.limit ||
              state.adminPagination.perPage ||
              20,
          };

          state.message =
            action.payload?.message ||
            "All deposits fetched successfully";
        }
      )

      .addCase(
        getAllDepositsForAdmin.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to fetch all deposits";

          state.adminDeposits = [];
        }
      )

      /* =====================================================
         GET SINGLE DEPOSIT
      ===================================================== */

      .addCase(
        getSingleDeposit.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getSingleDeposit.fulfilled,
        (state, action) => {
          state.loading = false;
          state.success = true;

          state.currentDeposit =
            action.payload?.deposit || null;
        }
      )

      .addCase(
        getSingleDeposit.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to fetch deposit details";

          state.currentDeposit = null;
        }
      );
  },
});

/* ==========================================================
   ACTIONS
========================================================== */

export const {
  clearDepositState,

  clearDeposits,

  clearAdminDeposits,

  clearCurrentDeposit,

  setDepositFilters,

  setAdminDepositFilters,

  resetDepositFilters,

  resetAdminDepositFilters,
} = depositSlice.actions;

/* ==========================================================
   SELECTORS
========================================================== */

export const selectAdminDeposits = (state) =>
  state.deposit.adminDeposits;

export const selectAdminDepositPagination = (state) =>
  state.deposit.adminPagination;

/* ==========================================================
   EXPORT REDUCER
========================================================== */

export default depositSlice.reducer;