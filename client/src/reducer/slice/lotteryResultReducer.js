import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import api from "../api";


// ==========================================
// CREATE RESULT
// ==========================================
export const createResult = createAsyncThunk(
  "lotteryResult/createResult",
  async (resultData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/lottery-result/create",
        resultData
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to create result",
        }
      );
    }
  }
);

// ==========================================
// GET ALL RESULTS
// ==========================================
export const getAllResults = createAsyncThunk(
  "lotteryResult/getAllResults",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/lottery-result/all"
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to fetch results",
        }
      );
    }
  }
);

// ==========================================
// GET RESULT BY ID
// ==========================================
export const getResultById = createAsyncThunk(
  "lotteryResult/getResultById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/lottery-result/${id}`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to fetch result",
        }
      );
    }
  }
);

// ==========================================
// UPDATE RESULT
// ==========================================
export const updateResult = createAsyncThunk(
  "lotteryResult/updateResult",
  async (
    { id, data },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch(
        `/lottery-result/${id}`,
        data
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to update result",
        }
      );
    }
  }
);

// ==========================================
// PUBLISH RESULT
// ==========================================
export const publishResult = createAsyncThunk(
  "lotteryResult/publishResult",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/lottery-result/${id}/publish`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to publish result",
        }
      );
    }
  }
);

// ==========================================
// UNPUBLISH RESULT
// ==========================================
export const unpublishResult = createAsyncThunk(
  "lotteryResult/unpublishResult",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/lottery-result/${id}/unpublish`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to unpublish result",
        }
      );
    }
  }
);

// ==========================================
// DELETE RESULT
// ==========================================
export const deleteResult = createAsyncThunk(
  "lotteryResult/deleteResult",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/lottery-result/${id}`
      );

      return {
        id,
        ...response.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to delete result",
        }
      );
    }
  }
);

// ==========================================
// CHECK NUMBER
// ==========================================
export const checkNumber = createAsyncThunk(
  "lotteryResult/checkNumber",
  async (numberData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/lottery-result/check-number",
        numberData
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          success: false,
          message: "Failed to check number",
        }
      );
    }
  }
);

// ==========================================
// INITIAL STATE
// ==========================================
const initialState = {
  results: [],
  result: null,
  checkResult: null,

  loading: false,
  createLoading: false,
  updateLoading: false,
  publishLoading: false,
  deleteLoading: false,
  checkLoading: false,

  success: false,
  error: null,
  message: "",
};

// ==========================================
// SLICE
// ==========================================
const lotteryResultSlice = createSlice({
  name: "lotteryResult",
  initialState,

  reducers: {
    clearResultMessage: (state) => {
      state.success = false;
      state.error = null;
      state.message = "";
    },

    clearCheckResult: (state) => {
      state.checkResult = null;
    },

    clearCurrentResult: (state) => {
      state.result = null;
    },
  },

  extraReducers: (builder) => {
    // ==========================================
    // GET ALL RESULTS
    // ==========================================
    builder
      .addCase(
        getAllResults.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getAllResults.fulfilled,
        (state, action) => {
          state.loading = false;

          state.results =
            action.payload?.data || [];

          state.message =
            action.payload?.message || "";

          state.error = null;
        }
      )

      .addCase(
        getAllResults.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload?.message ||
            "Failed to fetch results";
        }
      );

    // ==========================================
    // GET RESULT BY ID
    // ==========================================
    builder
      .addCase(
        getResultById.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getResultById.fulfilled,
        (state, action) => {
          state.loading = false;

          state.result =
            action.payload?.data || null;

          state.error = null;
        }
      )

      .addCase(
        getResultById.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload?.message ||
            "Failed to fetch result";
        }
      );

    // ==========================================
    // CREATE RESULT
    // ==========================================
    builder
      .addCase(
        createResult.pending,
        (state) => {
          state.createLoading = true;
          state.success = false;
          state.error = null;
        }
      )

      .addCase(
        createResult.fulfilled,
        (state, action) => {
          state.createLoading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "Result created successfully";

          state.error = null;

          if (action.payload?.data) {
            state.results.unshift(
              action.payload.data
            );
          }
        }
      )

      .addCase(
        createResult.rejected,
        (state, action) => {
          state.createLoading = false;
          state.success = false;

          state.error =
            action.payload?.message ||
            "Failed to create result";
        }
      );

    // ==========================================
    // UPDATE RESULT
    // ==========================================
    builder
      .addCase(
        updateResult.pending,
        (state) => {
          state.updateLoading = true;
          state.success = false;
          state.error = null;
        }
      )

      .addCase(
        updateResult.fulfilled,
        (state, action) => {
          state.updateLoading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "Result updated successfully";

          state.error = null;

          const updatedResult =
            action.payload?.data;

          if (updatedResult?._id) {
            const index =
              state.results.findIndex(
                (item) =>
                  item._id ===
                  updatedResult._id
              );

            if (index !== -1) {
              state.results[index] =
                updatedResult;
            }

            state.result =
              updatedResult;
          }
        }
      )

      .addCase(
        updateResult.rejected,
        (state, action) => {
          state.updateLoading = false;
          state.success = false;

          state.error =
            action.payload?.message ||
            "Failed to update result";
        }
      );

    // ==========================================
    // PUBLISH RESULT
    // ==========================================
    builder
      .addCase(
        publishResult.pending,
        (state) => {
          state.publishLoading = true;
          state.error = null;
        }
      )

      .addCase(
        publishResult.fulfilled,
        (state, action) => {
          state.publishLoading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "Result published successfully";

          state.error = null;

          const publishedResult =
            action.payload?.data;

          if (publishedResult?._id) {
            const index =
              state.results.findIndex(
                (item) =>
                  item._id ===
                  publishedResult._id
              );

            if (index !== -1) {
              state.results[index] =
                publishedResult;
            }

            state.result =
              publishedResult;
          }
        }
      )

      .addCase(
        publishResult.rejected,
        (state, action) => {
          state.publishLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to publish result";
        }
      );

    // ==========================================
    // UNPUBLISH RESULT
    // ==========================================
    builder
      .addCase(
        unpublishResult.pending,
        (state) => {
          state.publishLoading = true;
          state.error = null;
        }
      )

      .addCase(
        unpublishResult.fulfilled,
        (state, action) => {
          state.publishLoading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "Result unpublished successfully";

          state.error = null;

          const unpublishedResult =
            action.payload?.data;

          if (unpublishedResult?._id) {
            const index =
              state.results.findIndex(
                (item) =>
                  item._id ===
                  unpublishedResult._id
              );

            if (index !== -1) {
              state.results[index] =
                unpublishedResult;
            }

            state.result =
              unpublishedResult;
          }
        }
      )

      .addCase(
        unpublishResult.rejected,
        (state, action) => {
          state.publishLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to unpublish result";
        }
      );

    // ==========================================
    // DELETE RESULT
    // ==========================================
    builder
      .addCase(
        deleteResult.pending,
        (state) => {
          state.deleteLoading = true;
          state.success = false;
          state.error = null;
        }
      )

      .addCase(
        deleteResult.fulfilled,
        (state, action) => {
          state.deleteLoading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "Result deleted successfully";

          state.error = null;

          state.results =
            state.results.filter(
              (item) =>
                item._id !== action.payload.id
            );
        }
      )

      .addCase(
        deleteResult.rejected,
        (state, action) => {
          state.deleteLoading = false;
          state.success = false;

          state.error =
            action.payload?.message ||
            "Failed to delete result";
        }
      );

    // ==========================================
    // CHECK NUMBER
    // ==========================================
    builder
      .addCase(
        checkNumber.pending,
        (state) => {
          state.checkLoading = true;
          state.checkResult = null;
          state.error = null;
        }
      )

      .addCase(
        checkNumber.fulfilled,
        (state, action) => {
          state.checkLoading = false;

          state.checkResult =
            action.payload;

          state.message =
            action.payload?.message || "";

          state.error = null;
        }
      )

      .addCase(
        checkNumber.rejected,
        (state, action) => {
          state.checkLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to check number";
        }
      );
  },
});

// ==========================================
// EXPORT ACTIONS
// ==========================================
export const {
  clearResultMessage,
  clearCheckResult,
  clearCurrentResult,
} = lotteryResultSlice.actions;

export default lotteryResultSlice.reducer;