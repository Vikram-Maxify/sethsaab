import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createLotteryConfig,
  getAllLotteryConfigs,
  activateLotteryConfig,
  deactivateLotteryConfig,
  updateLotteryDate,
  deleteLotteryConfig,
  clearLotteryConfigError,
  clearLotteryConfigSuccess,
} from "../../reducer/slice/lotteryConfigSlice";

// =====================================================
// MONTHS
// =====================================================

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// =====================================================
// HELPERS
// =====================================================

const formatDate = (date) => {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getMonthName = (month) => {
  const index = Number(month) - 1;
  return months[index] || "-";
};

/**
 * Build a real Date object from flat API fields:
 *   { year: 2026, month: 9, date: 19 }
 */
const buildDateFromFlat = (item) => {
  if (!item) return null;

  const { year, month, date } = item;

  if (!year || !month || !date) return null;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(date)
  );
};

/**
 * Compute the "amount" to display for a flat lottery entry.
 * The API returns `prizes: { first, second, third }` and no `amount`.
 * We use `prizes.first` as a representative amount so the UI keeps working.
 */
const getEntryAmount = (item) => {
  if (!item) return 0;

  if (typeof item.amount === "number") return item.amount;

  if (item.prizes && typeof item.prizes.first === "number") {
    return item.prizes.first;
  }

  return 0;
};

/**
 * Compute the "numbers" to display for a flat lottery entry.
 * The API does not return numbers — return [] so the UI shows nothing
 * instead of crashing.
 */
const getEntryNumbers = (item) => {
  if (item && Array.isArray(item.numbers)) return item.numbers;
  return [];
};

/**
 * Compute the "status" to display for a flat lottery entry.
 */
const getEntryStatus = (item) => {
  if (item && typeof item.status === "string") return item.status;
  return "pending";
};

/**
 * Group a flat array of lottery entries (one per day) into
 * monthly "config" objects shaped the way this component expects.
 */
const groupLotteryConfigs = (flatData) => {
  if (!Array.isArray(flatData)) return [];

  const map = new Map();

  flatData.forEach((item) => {
    if (!item) return;

    const key = `${item.year}-${item.month}-${item.marketName || "default"}`;

    if (!map.has(key)) {
      map.set(key, {
        _id: key, // synthetic config id
        marketName: item.marketName || "default",
        month: item.month,
        year: item.year,
        isActive: Boolean(item.isActive),
        dates: [],
      });
    }

    const config = map.get(key);

    config.dates.push({
      _id: item._id,
      raw: item,
      date: buildDateFromFlat(item),
      day: item.date,
      numbers: getEntryNumbers(item),
      amount: getEntryAmount(item),
      status: getEntryStatus(item),
      prizes: item.prizes || {},
      isActive: Boolean(item.isActive),
    });

    // If any day is active, mark the config active.
    if (item.isActive) {
      config.isActive = true;
    }
  });

  // Sort dates inside each config ascending by day
  map.forEach((config) => {
    config.dates.sort((a, b) => Number(a.day) - Number(b.day));
  });

  return Array.from(map.values());
};

// =====================================================
// DEFAULT FORM
// =====================================================

const getDefaultForm = () => {
  const currentDate = new Date();

  return {
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    numbers: ["", "", "", "", "", ""],
    amount: "",
  };
};

// =====================================================
// COMPONENT
// =====================================================

const LotteryConfig = () => {
  const dispatch = useDispatch();

  // ===================================================
  // REDUX
  // ===================================================

  const lotteryState = useSelector(
    (state) => state.lotteryConfig || {}
  );

  const {
    configs: rawConfigs = [],
    loading = false,
    createLoading = false,
    activateLoading = false,
    deactivateLoading = false,
    updateDateLoading = false,
    deleteLoading = false,
    error = null,
    successMessage = null,
  } = lotteryState;

  // Group flat API data into monthly configs
  const configs = useMemo(
    () => groupLotteryConfigs(rawConfigs),
    [rawConfigs]
  );

  // ===================================================
  // CREATE FORM
  // ===================================================

  const [formData, setFormData] = useState(getDefaultForm());
  const [validationError, setValidationError] = useState("");

  // ===================================================
  // EDIT MODAL
  // ===================================================

  const [editModal, setEditModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [editingDate, setEditingDate] = useState(null);

  const [editData, setEditData] = useState({
    numbers: ["", "", "", "", "", ""],
    amount: "",
    status: "pending",
  });

  const [editValidationError, setEditValidationError] = useState("");

  // ===================================================
  // DELETE MODAL
  // ===================================================

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // ===================================================
  // LOAD CONFIGS
  // ===================================================

  useEffect(() => {
    dispatch(getAllLotteryConfigs());
  }, [dispatch]);

  // ===================================================
  // AUTO CLEAR SUCCESS
  // ===================================================

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      dispatch(clearLotteryConfigSuccess());
    }, 3000);

    return () => clearTimeout(timer);
  }, [successMessage, dispatch]);

  // ===================================================
  // CREATE FORM CHANGE
  // ===================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setValidationError("");

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===================================================
  // CREATE NUMBER CHANGE
  // ===================================================

  const handleNumberChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 2);

    setValidationError("");

    setFormData((prev) => {
      const numbers = [...prev.numbers];
      numbers[index] = cleanValue;

      return {
        ...prev,
        numbers,
      };
    });
  };

  // ===================================================
  // VALIDATE CREATE
  // ===================================================

  const validateCreateForm = () => {
    if (!formData.month) return "Month is required.";
    if (!formData.year) return "Year is required.";

    const year = Number(formData.year);

    if (!Number.isInteger(year) || year < 2000) {
      return "Please enter a valid year.";
    }

    if (!Array.isArray(formData.numbers)) {
      return "Lottery numbers are required.";
    }

    if (formData.numbers.length !== 6) {
      return "Exactly 6 lottery numbers are required.";
    }

    if (formData.numbers.some((num) => num === "")) {
      return "Please enter all 6 lottery numbers.";
    }

    const numbers = formData.numbers.map(Number);

    if (
      numbers.some(
        (num) => !Number.isInteger(num) || num < 1 || num > 99
      )
    ) {
      return "Each lottery number must be between 1 and 99.";
    }

    if (new Set(numbers).size !== 6) {
      return "Lottery numbers must be unique.";
    }

    if (
      formData.amount === "" ||
      formData.amount === null ||
      formData.amount === undefined
    ) {
      return "Amount is required.";
    }

    const amount = Number(formData.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      return "Please enter a valid amount.";
    }

    return "";
  };

  // ===================================================
  // CREATE CONFIG
  // ===================================================

  const handleCreate = async (e) => {
    e.preventDefault();

    setValidationError("");
    dispatch(clearLotteryConfigError());

    const validationMessage = validateCreateForm();

    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    const payload = {
      month: Number(formData.month),
      year: Number(formData.year),
      numbers: formData.numbers.map(Number),
      amount: Number(formData.amount),
    };

    console.log("CREATE LOTTERY PAYLOAD:", payload);

    try {
      const result = await dispatch(createLotteryConfig(payload));

      console.log("CREATE LOTTERY RESPONSE:", result);

      if (createLotteryConfig.fulfilled.match(result)) {
        setFormData(getDefaultForm());
        setValidationError("");
        dispatch(getAllLotteryConfigs());
      } else {
        const message =
          result?.payload?.message ||
          result?.payload ||
          result?.error?.message ||
          "Unable to create lottery configuration.";

        setValidationError(
          typeof message === "string"
            ? message
            : "Unable to create lottery configuration."
        );
      }
    } catch (err) {
      console.error("CREATE LOTTERY ERROR:", err);
      setValidationError(
        err?.message ||
          "Something went wrong while creating lottery configuration."
      );
    }
  };

  // ===================================================
  // ACTIVATE
  // ===================================================

  const handleActivate = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to activate this lottery configuration?"
    );

    if (!confirmed) return;

    dispatch(clearLotteryConfigError());

    try {
      const result = await dispatch(activateLotteryConfig(id));

      if (activateLotteryConfig.fulfilled.match(result)) {
        dispatch(getAllLotteryConfigs());
      }
    } catch (err) {
      console.error("ACTIVATE ERROR:", err);
    }
  };

  // ===================================================
  // DEACTIVATE
  // ===================================================

  const handleDeactivate = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to deactivate this lottery configuration?"
    );

    if (!confirmed) return;

    dispatch(clearLotteryConfigError());

    try {
      const result = await dispatch(deactivateLotteryConfig(id));

      if (deactivateLotteryConfig.fulfilled.match(result)) {
        dispatch(getAllLotteryConfigs());
      }
    } catch (err) {
      console.error("DEACTIVATE ERROR:", err);
    }
  };

  // ===================================================
  // OPEN EDIT
  // ===================================================

  const handleOpenEdit = (config, date) => {
    setEditingConfig(config);
    setEditingDate(date);
    setEditValidationError("");

    setEditData({
      numbers:
        Array.isArray(date?.numbers) && date.numbers.length === 6
          ? date.numbers.map(String)
          : ["", "", "", "", "", ""],

      amount:
        date?.amount !== undefined && date?.amount !== null
          ? String(date.amount)
          : "",

      status: date?.status || "pending",
    });

    setEditModal(true);
  };

  // ===================================================
  // CLOSE EDIT
  // ===================================================

  const handleCloseEdit = () => {
    setEditModal(false);
    setEditingConfig(null);
    setEditingDate(null);
    setEditValidationError("");

    setEditData({
      numbers: ["", "", "", "", "", ""],
      amount: "",
      status: "pending",
    });
  };

  // ===================================================
  // EDIT NUMBER
  // ===================================================

  const handleEditNumberChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 2);

    setEditValidationError("");

    setEditData((prev) => {
      const numbers = [...prev.numbers];
      numbers[index] = cleanValue;

      return {
        ...prev,
        numbers,
      };
    });
  };

  // ===================================================
  // EDIT CHANGE
  // ===================================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditValidationError("");

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===================================================
  // VALIDATE EDIT
  // ===================================================

  const validateEditForm = () => {
    if (
      !Array.isArray(editData.numbers) ||
      editData.numbers.length !== 6
    ) {
      return "Exactly 6 lottery numbers are required.";
    }

    if (editData.numbers.some((num) => num === "")) {
      return "Please enter all 6 lottery numbers.";
    }

    const numbers = editData.numbers.map(Number);

    if (
      numbers.some(
        (num) => !Number.isInteger(num) || num < 1 || num > 99
      )
    ) {
      return "Each lottery number must be between 1 and 99.";
    }

    if (new Set(numbers).size !== 6) {
      return "Lottery numbers must be unique.";
    }

    if (
      editData.amount === "" ||
      editData.amount === null ||
      editData.amount === undefined
    ) {
      return "Amount is required.";
    }

    const amount = Number(editData.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      return "Please enter a valid amount.";
    }

    if (!["pending", "win", "lost"].includes(editData.status)) {
      return "Invalid status selected.";
    }

    return "";
  };

  // ===================================================
  // UPDATE DATE
  // ===================================================

  const handleUpdateDate = async (e) => {
    e.preventDefault();

    setEditValidationError("");

    if (!editingDate?._id) {
      setEditValidationError("Lottery date ID is missing.");
      return;
    }

    const validationMessage = validateEditForm();

    if (validationMessage) {
      setEditValidationError(validationMessage);
      return;
    }

    const payload = {
      // Flat API entry id
      id: editingDate._id,

      // Kept for compatibility with your existing slice thunk
      dateId: editingDate._id,

      numbers: editData.numbers.map(Number),
      amount: Number(editData.amount),
      status: editData.status,
    };

    console.log("UPDATE LOTTERY DATE PAYLOAD:", payload);

    try {
      const result = await dispatch(updateLotteryDate(payload));

      if (updateLotteryDate.fulfilled.match(result)) {
        handleCloseEdit();
        dispatch(getAllLotteryConfigs());
      } else {
        const message =
          result?.payload?.message ||
          result?.payload ||
          result?.error?.message ||
          "Unable to update lottery date.";

        setEditValidationError(
          typeof message === "string"
            ? message
            : "Unable to update lottery date."
        );
      }
    } catch (err) {
      console.error("UPDATE DATE ERROR:", err);
      setEditValidationError(
        err?.message || "Something went wrong while updating."
      );
    }
  };

  // ===================================================
  // DELETE OPEN / CLOSE / EXECUTE
  // ===================================================

  const handleOpenDelete = (id) => {
    if (!id) return;
    setDeleteId(id);
    setDeleteModal(true);
  };

  const handleCloseDelete = () => {
    setDeleteModal(false);
    setDeleteId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const result = await dispatch(deleteLotteryConfig(deleteId));

      if (deleteLotteryConfig.fulfilled.match(result)) {
        handleCloseDelete();
        dispatch(getAllLotteryConfigs());
      }
    } catch (err) {
      console.error("DELETE ERROR:", err);
    }
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = () => {
    dispatch(clearLotteryConfigError());
    dispatch(getAllLotteryConfigs());
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lottery Configuration
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage monthly lottery configurations, dates, numbers and amounts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* SUCCESS */}
      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* REDUX ERROR */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>
            {typeof error === "string"
              ? error
              : error?.message || "Something went wrong."}
          </span>
          <button
            type="button"
            onClick={() => dispatch(clearLotteryConfigError())}
            className="ml-4 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* CREATE VALIDATION ERROR */}
      {validationError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {validationError}
        </div>
      )}

      {/* CREATE FORM */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Monthly Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            This will create lottery dates for the complete selected month.
          </p>
        </div>

        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* MONTH */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Month
              </label>
              <select
                name="month"
                value={formData.month}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* YEAR */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleFormChange}
                min="2000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            {/* AMOUNT */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                placeholder="Enter amount"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* NUMBERS */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Lottery Numbers
            </label>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {formData.numbers.map((number, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={number}
                  onChange={(e) =>
                    handleNumberChange(index, e.target.value)
                  }
                  placeholder={`${index + 1}`}
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-center font-semibold outline-none focus:border-blue-500"
                />
              ))}
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Enter exactly 6 unique numbers between 1 and 99.
            </p>
          </div>

          {/* CREATE BUTTON */}
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "Create Configuration"}
            </button>
          </div>
        </form>
      </div>

      {/* CONFIGURATIONS */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                All Configurations
              </h2>
              <p className="text-sm text-gray-500">
                Total: {Array.isArray(configs) ? configs.length : 0}
              </p>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="p-10 text-center text-gray-500">
            Loading lottery configurations...
          </div>
        )}

        {/* EMPTY */}
        {!loading && Array.isArray(configs) && configs.length === 0 && (
          <div className="p-10 text-center">
            <div className="text-lg font-semibold text-gray-700">
              No lottery configurations found
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Create your first monthly configuration above.
            </p>
          </div>
        )}

        {/* CONFIG CARDS */}
        {!loading && Array.isArray(configs) && configs.length > 0 && (
          <div className="space-y-5 p-5">
            {configs.map((config) => (
              <div
                key={config._id}
                className="overflow-hidden rounded-xl border border-gray-200"
              >
                {/* CONFIG HEADER */}
                <div className="flex flex-col gap-4 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {getMonthName(config.month)} {config.year}
                        {config.marketName
                          ? ` • ${config.marketName}`
                          : ""}
                      </h3>

                      {config.isActive ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      Configuration ID: {config._id}
                    </p>
                  </div>

                  {/* ACTIONS — operate per-day so we use the first date's _id */}
                  <div className="flex flex-wrap gap-2">
                    {config.isActive ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeactivate(config.dates[0]?._id)
                        }
                        disabled={
                          deactivateLoading || !config.dates[0]?._id
                        }
                        className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                      >
                        {deactivateLoading ? "..." : "Deactivate"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleActivate(config.dates[0]?._id)
                        }
                        disabled={
                          activateLoading || !config.dates[0]?._id
                        }
                        className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {activateLoading ? "..." : "Activate"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenDelete(config.dates[0]?._id)
                      }
                      disabled={deleteLoading || !config.dates[0]?._id}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* DATES TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-white">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          Numbers
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {Array.isArray(config.dates) &&
                        config.dates.map((date, index) => (
                          <tr
                            key={date._id || index}
                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                          >
                            {/* INDEX */}
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {index + 1}
                            </td>

                            {/* DATE */}
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formatDate(date.date)}
                            </td>

                            {/* NUMBERS */}
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {Array.isArray(date.numbers) &&
                                date.numbers.length > 0 ? (
                                  date.numbers.map(
                                    (number, numberIndex) => (
                                      <span
                                        key={numberIndex}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700"
                                      >
                                        {number}
                                      </span>
                                    )
                                  )
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    —
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* AMOUNT */}
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              ₹
                              {Number(
                                date.amount || 0
                              ).toLocaleString("en-IN")}
                            </td>

                            {/* STATUS */}
                            <td className="px-4 py-3">
                              {date.status === "win" ? (
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                  Win
                                </span>
                              ) : date.status === "lost" ? (
                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                  Lost
                                </span>
                              ) : (
                                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                  Pending
                                </span>
                              )}
                            </td>

                            {/* ACTION */}
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEdit(config, date)
                                }
                                className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Lottery Date
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {formatDate(editingDate?.date)}
                  {editingConfig
                    ? ` • ${getMonthName(editingConfig.month)} ${
                        editingConfig.year
                      }`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* VALIDATION */}
            {editValidationError && (
              <div className="mx-5 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {editValidationError}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleUpdateDate} className="p-5">
              {/* NUMBERS */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Lottery Numbers
                </label>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {editData.numbers.map((number, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={number}
                      onChange={(e) =>
                        handleEditNumberChange(index, e.target.value)
                      }
                      placeholder={`${index + 1}`}
                      className="w-full rounded-lg border border-gray-300 px-2 py-3 text-center font-semibold outline-none focus:border-blue-500"
                    />
                  ))}
                </div>
              </div>

              {/* AMOUNT */}
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  value={editData.amount}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              {/* STATUS */}
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  value={editData.status}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="win">Win</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* BUTTONS */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateDateLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateDateLoading ? "Updating..." : "Update Date"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Delete Configuration
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this lottery configuration? This
              action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDelete}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotteryConfig;