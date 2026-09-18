import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api";

// GET /active
export const getActiveLotteryConfig = createAsyncThunk(
  "lotteryConfig/getActiveLotteryConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lottery/active");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch active lottery configuration",
      );
    }
  },
);

const initialState = {
  config: null,
  loading: false,
  error: null,
};

const lotteryConfigSlice = createSlice({
  name: "lotteryConfig",
  initialState,
  reducers: {
    clearLotteryConfigError: (state) => {
      state.error = null;
    },
    clearLotteryConfig: (state) => {
      state.config = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getActiveLotteryConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveLotteryConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload?.data || null;
        state.error = null;
      })
      .addCase(getActiveLotteryConfig.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch active lottery configuration";
      });
  },
});

export const { clearLotteryConfigError, clearLotteryConfig } =
  lotteryConfigSlice.actions;

export default lotteryConfigSlice.reducer;
