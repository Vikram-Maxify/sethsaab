import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

const API = "/withdrawal";

export const createWithdrawal = createAsyncThunk(
    "withdrawal/create",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await api.post(API, payload, { withCredentials: true });
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const fetchMyWithdrawals = createAsyncThunk(
    "withdrawal/fetchMine",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`${API}/me`, { withCredentials: true });
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message);
        }
    }
);

export const fetchAllWithdrawals = createAsyncThunk(
    "withdrawal/fetchAll",
    async ({ status, page = 1 } = {}, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`${API}/admin/all`, {
                params: { status, page },
                withCredentials: true,
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message);
        }
    }
);

export const updateWithdrawalStatus = createAsyncThunk(
    "withdrawal/updateStatus",
    async ({ id, status, adminRemark, transactionId }, { rejectWithValue }) => {
        try {
            const { data } = await api.patch(
                `${API}/admin/${id}`,
                { status, adminRemark, transactionId },
                { withCredentials: true }
            );
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message);
        }
    }
);

const withdrawalSlice = createSlice({
    name: "withdrawal",
    initialState: {
        myWithdrawals: [],
        allWithdrawals: [],
        pagination: null,
        loading: false,
        error: null,
        success: false,
    },
    reducers: {
        resetWithdrawalState: (s) => {
            s.success = false;
            s.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createWithdrawal.pending, (s) => { s.loading = true; s.error = null; })
            .addCase(createWithdrawal.fulfilled, (s, a) => {
                s.loading = false;
                s.success = true;
                s.myWithdrawals.unshift(a.payload);
            })
            .addCase(createWithdrawal.rejected, (s, a) => {
                s.loading = false;
                s.error = a.payload;
            })
            .addCase(fetchMyWithdrawals.fulfilled, (s, a) => {
                s.myWithdrawals = a.payload;
            })
            .addCase(fetchAllWithdrawals.fulfilled, (s, a) => {
                s.allWithdrawals = a.payload.data;
                s.pagination = a.payload.pagination;
            })
            .addCase(updateWithdrawalStatus.fulfilled, (s, a) => {
                const idx = s.allWithdrawals.findIndex((w) => w._id === a.payload._id);
                if (idx !== -1) s.allWithdrawals[idx] = a.payload;
            });
    },
});

export const { resetWithdrawalState } = withdrawalSlice.actions;
export default withdrawalSlice.reducer;