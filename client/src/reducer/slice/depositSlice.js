// src/redux/slice/depositSlice.js
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
            
            if (depositData.gatewayId) {
                formData.append("gatewayId", depositData.gatewayId);
            }
            formData.append("paymentMethod", depositData.paymentMethod || "");
            formData.append("channel", depositData.channel || "");
            formData.append("amount", depositData.amount);
            formData.append("utr", depositData.utr || "");
            
            if (depositData.paymentProof instanceof File) {
                formData.append("image", depositData.paymentProof);
            }

            const { data } = await api.post("/deposit", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Deposit submission failed"
            );
        }
    }
);

/* ==========================================================
   GET MY DEPOSITS
   Route : GET /api/deposit  (protected -> verifyToken)
   Controller supported query params:
   status, paymentMethod, channel, phone, username, orderId,
   transactionId, utr, fromDate, toDate, minAmount, maxAmount,
   page, limit, sort
========================================================== */
export const getMyDeposits = createAsyncThunk(
    "deposit/getMyDeposits",
    async (filters = {}, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();

            if (filters.status) params.append("status", filters.status);
            if (filters.paymentMethod) params.append("paymentMethod", filters.paymentMethod);
            if (filters.channel) params.append("channel", filters.channel);
            if (filters.phone) params.append("phone", filters.phone);
            if (filters.username) params.append("username", filters.username);
            if (filters.orderId) params.append("orderId", filters.orderId);
            if (filters.transactionId) params.append("transactionId", filters.transactionId);
            if (filters.utr) params.append("utr", filters.utr);
            if (filters.fromDate) params.append("fromDate", filters.fromDate);
            if (filters.toDate) params.append("toDate", filters.toDate);
            if (filters.minAmount) params.append("minAmount", filters.minAmount);
            if (filters.maxAmount) params.append("maxAmount", filters.maxAmount);
            if (filters.page) params.append("page", filters.page);
            if (filters.limit) params.append("limit", filters.limit);
            if (filters.sort) params.append("sort", filters.sort);

            const queryString = params.toString();
            const url = `/deposit${queryString ? `?${queryString}` : ""}`;

            const { data } = await api.get(url);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch deposits"
            );
        }
    }
);

/* ==========================================================
   GET SINGLE DEPOSIT
   Route : GET /api/deposit/:id  (protected -> verifyToken)
========================================================== */
export const getSingleDeposit = createAsyncThunk(
    "deposit/getSingleDeposit",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/deposit/${id}`);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch deposit details"
            );
        }
    }
);

/* ==========================
   SLICE
========================== */
const initialState = {
    loading: false,
    success: false,
    error: null,
    message: "",

    // Deposit data
    deposits: [],          // list from getMyDeposits
    currentDeposit: null,  // last created deposit (from createDeposit response)
    paymentUrl: null,      // for automatic payment gateways

    // Pagination (matches controller response: total, currentPage, totalPages)
    pagination: {
        total: 0,
        currentPage: 1,
        totalPages: 0,
        limit: 10,
    },

    // Filters used for getMyDeposits query
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
            state.filters = { ...state.filters, ...action.payload };
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
            /* ================= Create Deposit ================= */
            .addCase(createDeposit.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
                state.message = "";
                state.paymentUrl = null;
            })
            .addCase(createDeposit.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = action.payload.message || "Deposit request submitted successfully";
                
                // ✅ Handle automatic payment gateway response
                if (action.payload.paymentUrl) {
                    state.paymentUrl = action.payload.paymentUrl;
                }
                
                // ✅ Store deposit data
                if (action.payload.deposit) {
                    state.currentDeposit = action.payload.deposit;
                    state.deposits = [action.payload.deposit, ...state.deposits];
                }
            })
            .addCase(createDeposit.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
                state.paymentUrl = null;
            })

            /* ================= Get My Deposits ================= */
            .addCase(getMyDeposits.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getMyDeposits.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.deposits = action.payload.deposits || [];
                state.pagination = {
                    total: action.payload.total || 0,
                    currentPage: action.payload.currentPage || 1,
                    totalPages: action.payload.totalPages || 0,
                    limit: state.filters.limit || state.pagination.limit || 10,
                };
            })
            .addCase(getMyDeposits.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.deposits = [];
            })

            /* ================= Get Single Deposit ================= */
            .addCase(getSingleDeposit.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSingleDeposit.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.currentDeposit = action.payload.deposit;
            })
            .addCase(getSingleDeposit.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.currentDeposit = null;
            });
    },
});

export const {
    clearDepositState,
    clearDeposits,
    clearCurrentDeposit,
    setDepositFilters,
    resetDepositFilters,
} = depositSlice.actions;

export default depositSlice.reducer;