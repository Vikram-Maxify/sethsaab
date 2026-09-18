import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// =====================================
// INITIAL STATE
// =====================================

const initialState = {
  admin: null,
  isAuthenticated: false,

  loading: false,
  error: null,
  message: null,
};

// =====================================
// ADMIN LOGIN
// =====================================

export const adminLogin = createAsyncThunk(
  "adminAuth/login",

  async ({ mobile, password }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", {
        mobile,
        password,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Admin login failed",
      );
    }
  },
);

// =====================================
// GET ADMIN PROFILE
// =====================================

export const getAdminProfile = createAsyncThunk(
  "adminAuth/profile",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/profile");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch admin profile",
      );
    }
  },
);

// =====================================
// ADMIN LOGOUT
// =====================================

export const adminLogout = createAsyncThunk(
  "adminAuth/logout",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/logout");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Admin logout failed",
      );
    }
  },
);

// =====================================
// SLICE
// =====================================

const adminAuthSlice = createSlice({
  name: "adminAuth",

  initialState,

  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },

    clearAdminMessage: (state) => {
      state.message = null;
    },

    resetAdminAuth: () => initialState,
  },

  extraReducers: (builder) => {
    // =================================
    // LOGIN
    // =================================

    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })

      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;

        state.isAuthenticated = true;

        state.admin = action.payload?.data || null;

        state.message = action.payload?.message || "Admin login successful";

        state.error = null;
      })

      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;

        state.isAuthenticated = false;

        state.admin = null;

        state.error = action.payload;
      });

    // =================================
    // PROFILE
    // =================================

    builder
      .addCase(getAdminProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getAdminProfile.fulfilled, (state, action) => {
        state.loading = false;

        state.isAuthenticated = true;

        state.admin = action.payload?.data || null;

        state.error = null;
      })

      .addCase(getAdminProfile.rejected, (state, action) => {
        state.loading = false;

        state.isAuthenticated = false;

        state.admin = null;

        state.error = action.payload;
      });

    // =================================
    // LOGOUT
    // =================================

    builder
      .addCase(adminLogout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(adminLogout.fulfilled, (state, action) => {
        state.loading = false;

        state.admin = null;

        state.isAuthenticated = false;

        state.error = null;

        state.message = action.payload?.message || "Admin logout successful";
      })

      .addCase(adminLogout.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload;
      });
  },
});

// =====================================
// ACTIONS
// =====================================

export const { clearAdminError, clearAdminMessage, resetAdminAuth } =
  adminAuthSlice.actions;

// =====================================
// REDUCER
// =====================================

export default adminAuthSlice.reducer;
