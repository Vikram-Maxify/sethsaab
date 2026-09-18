import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createLotteryConfig,
  getAllLotteryConfigs,
  getLotteryConfigById,
  getActiveLotteryConfig,
  activateLotteryConfig,
  deactivateLotteryConfig,
  updateUserLotteryEntry,
  deleteUserLotteryEntry,
  deleteLotteryConfig,
  clearLotteryError,
  clearLotteryMessage,
} from "../../reducer/slice/adminLotteryReducer";

const AdminLottery = () => {
  const dispatch = useDispatch();

  const {
    lotteries,
    lottery,
    activeLottery,
    loading,
    createLoading,
    updateLoading,
    deleteLoading,
    actionLoading,
    error,
    message,
  } = useSelector((state) => state.adminLottery);

  // =====================================================
  // FORM STATE
  // =====================================================

  const [formData, setFormData] = useState({
    marketName: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [formError, setFormError] = useState("");

  // =====================================================
  // UPDATE ENTRY MODAL
  // =====================================================

  const [editingEntry, setEditingEntry] = useState(null);

  const [editData, setEditData] = useState({
    number: "",
    amount: "",
    status: "pending",
    entryDate: "",
  });

  // =====================================================
  // GET ALL MARKETS
  // =====================================================

  useEffect(() => {
    dispatch(getAllLotteryConfigs());

    return () => {
      dispatch(clearLotteryError());
      dispatch(clearLotteryMessage());
    };
  }, [dispatch]);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormError("");
  };

  // =====================================================
  // CREATE MARKET
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!formData.marketName.trim()) {
      setFormError("Market name is required");
      return;
    }

    if (!formData.month) {
      setFormError("Month is required");
      return;
    }

    if (!formData.year) {
      setFormError("Year is required");
      return;
    }

    const result = await dispatch(
      createLotteryConfig({
        marketName: formData.marketName.trim(),
        month: Number(formData.month),
        year: Number(formData.year),
      })
    );

    if (createLotteryConfig.fulfilled.match(result)) {
      setFormData({
        marketName: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });

      dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // GET MARKET BY ID
  // =====================================================

  const handleViewMarket = async (id) => {
    await dispatch(getLotteryConfigById(id));
  };

  // =====================================================
  // GET ACTIVE MARKET
  // =====================================================

  const handleGetActiveMarket = async () => {
    await dispatch(getActiveLotteryConfig());
  };

  // =====================================================
  // ACTIVATE MARKET
  // =====================================================

  const handleActivate = async (id) => {
    if (!window.confirm("Are you sure you want to activate this market?")) {
      return;
    }

    const result = await dispatch(
      activateLotteryConfig(id)
    );

    if (activateLotteryConfig.fulfilled.match(result)) {
      dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // DEACTIVATE MARKET
  // =====================================================

  const handleDeactivate = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to deactivate this market?"
      )
    ) {
      return;
    }

    const result = await dispatch(
      deactivateLotteryConfig(id)
    );

    if (deactivateLotteryConfig.fulfilled.match(result)) {
      dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // DELETE MARKET
  // =====================================================

  const handleDeleteMarket = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this market?"
      )
    ) {
      return;
    }

    const result = await dispatch(
      deleteLotteryConfig(id)
    );

    if (deleteLotteryConfig.fulfilled.match(result)) {
      dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // OPEN EDIT ENTRY
  // =====================================================

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);

    setEditData({
      number: entry.number || "",
      amount: entry.amount ?? "",
      status: entry.status || "pending",
      entryDate: entry.entryDate || "",
    });
  };

  // =====================================================
  // EDIT INPUT CHANGE
  // =====================================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // UPDATE USER ENTRY
  // =====================================================

  const handleUpdateEntry = async (e) => {
    e.preventDefault();

    if (!lottery?._id) {
      return;
    }

    if (!editingEntry?._id) {
      return;
    }

    const result = await dispatch(
      updateUserLotteryEntry({
        id: lottery._id,
        userEntryId: editingEntry._id,
        data: {
          number: editData.number,
          amount: Number(editData.amount),
          status: editData.status,
          entryDate: editData.entryDate,
        },
      })
    );

    if (updateUserLotteryEntry.fulfilled.match(result)) {
      setEditingEntry(null);

      setEditData({
        number: "",
        amount: "",
        status: "pending",
        entryDate: "",
      });

      dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // DELETE USER ENTRY
  // =====================================================

  const handleDeleteEntry = async (configId, entryId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user entry?"
      )
    ) {
      return;
    }

    const result = await dispatch(
      deleteUserLotteryEntry({
        id: configId,
        userEntryId: entryId,
      })
    );

    if (deleteUserLotteryEntry.fulfilled.match(result)) {
      await dispatch(
        getLotteryConfigById(configId)
      );

      dispatch(getAllLotteryConfigs());
    }
  };

  // =====================================================
  // MONTH NAME
  // =====================================================

  const getMonthName = (month) => {
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

    return months[Number(month) - 1] || "-";
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // CLOSE ENTRY MODAL
  // =====================================================

  const closeEditModal = () => {
    setEditingEntry(null);

    setEditData({
      number: "",
      amount: "",
      status: "pending",
      entryDate: "",
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Lottery Markets
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Create and manage monthly lottery markets.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGetActiveMarket}
            disabled={loading}
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Loading..."
              : "Get Active Market"}
          </button>
        </div>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {(error || formError) && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError || error}
          </div>
        )}

        {/* =================================================
            ACTIVE MARKET
        ================================================= */}

        {activeLottery && (
          <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  Active Market
                </p>

                <h2 className="mt-1 text-lg font-bold text-gray-900">
                  {activeLottery.marketName}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {getMonthName(activeLottery.month)}{" "}
                  {activeLottery.year}
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white">
                Active
              </span>
            </div>
          </div>
        )}

        {/* =================================================
            CREATE MARKET
        ================================================= */}

        <div className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Create Market
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create a lottery market for a specific month and year.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-5"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

              {/* Market Name */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Market Name
                </label>

                <input
                  type="text"
                  name="marketName"
                  value={formData.marketName}
                  onChange={handleChange}
                  placeholder="Enter market name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Month */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Month
                </label>

                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {[
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
                  ].map((month, index) => (
                    <option
                      key={month}
                      value={index + 1}
                    >
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Year
                </label>

                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="2000"
                  placeholder="Enter year"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Submit */}

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={createLoading}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createLoading
                  ? "Creating..."
                  : "Create Market"}
              </button>
            </div>
          </form>
        </div>

        {/* =================================================
            SELECTED MARKET
        ================================================= */}

        {lottery && (
          <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-blue-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {lottery.marketName}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {getMonthName(lottery.month)}{" "}
                  {lottery.year} •{" "}
                  {lottery.users?.length || 0} Users
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  dispatch(getLotteryConfigById(lottery._id))
                }
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Refresh Details
              </button>
            </div>

            {/* User Entries */}

            <div className="overflow-x-auto">
              {lottery.users?.length > 0 ? (
                <table className="min-w-full">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        #
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        User ID
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Number
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Date
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {lottery.users.map(
                      (entry, index) => (
                        <tr
                          key={entry._id}
                          className="bg-white hover:bg-gray-50"
                        >
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-700">
                            <span className="max-w-[180px] truncate block">
                              {entry.userId}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                            {entry.number}
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-700">
                            ₹{entry.amount}
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-500">
                            {entry.entryDate}
                          </td>

                          <td className="px-5 py-4">
                            {entry.status === "win" ? (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                Win
                              </span>
                            ) : entry.status === "lost" ? (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                                Lost
                              </span>
                            ) : (
                              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEditEntry(entry)
                                }
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteEntry(
                                    lottery._id,
                                    entry._id
                                  )
                                }
                                disabled={deleteLoading}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Delete
                              </button>

                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-sm text-gray-500">
                  No user entries found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            ALL MARKETS
        ================================================= */}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

          {/* Header */}

          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                All Markets
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Total markets:{" "}
                {lotteries?.length || 0}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                dispatch(getAllLotteryConfigs())
              }
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>

          {/* Loading */}

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-sm text-gray-500">
                Loading markets...
              </div>
            </div>
          ) : lotteries?.length === 0 ? (
            <div className="flex min-h-[250px] items-center justify-center px-5">
              <div className="text-center">
                <h3 className="text-base font-semibold text-gray-700">
                  No markets found
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Create your first lottery market above.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">

                <thead className="bg-gray-50">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      #
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Market
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Month
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Year
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Users
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Created
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {lotteries.map(
                    (lotteryItem, index) => (
                      <tr
                        key={lotteryItem._id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* Number */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                          {index + 1}
                        </td>

                        {/* Market */}

                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="font-medium text-gray-900">
                            {lotteryItem.marketName}
                          </div>

                          <div className="mt-1 text-xs text-gray-400">
                            ID: {lotteryItem._id}
                          </div>
                        </td>

                        {/* Month */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                          {getMonthName(
                            lotteryItem.month
                          )}
                        </td>

                        {/* Year */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                          {lotteryItem.year}
                        </td>

                        {/* Users */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                          {lotteryItem.users?.length || 0}
                        </td>

                        {/* Status */}

                        <td className="whitespace-nowrap px-5 py-4">
                          {lotteryItem.isActive ? (
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Created */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                          {formatDate(
                            lotteryItem.createdAt
                          )}
                        </td>

                        {/* Actions */}

                        <td className="px-5 py-4">
                          <div className="flex min-w-[250px] flex-wrap gap-2">

                            {/* View */}

                            <button
                              type="button"
                              onClick={() =>
                                handleViewMarket(
                                  lotteryItem._id
                                )
                              }
                              disabled={loading}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              View
                            </button>

                            {/* Activate */}

                            {!lotteryItem.isActive && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleActivate(
                                    lotteryItem._id
                                  )
                                }
                                disabled={actionLoading}
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {actionLoading
                                  ? "..."
                                  : "Activate"}
                              </button>
                            )}

                            {/* Deactivate */}

                            {lotteryItem.isActive && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeactivate(
                                    lotteryItem._id
                                  )
                                }
                                disabled={actionLoading}
                                className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                              >
                                {actionLoading
                                  ? "..."
                                  : "Deactivate"}
                              </button>
                            )}

                            {/* Delete */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteMarket(
                                  lotteryItem._id
                                )
                              }
                              disabled={deleteLoading}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleteLoading
                                ? "..."
                                : "Delete"}
                            </button>

                          </div>
                        </td>
                      </tr>
                    )
                  )}

                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          EDIT USER ENTRY MODAL
      ===================================================== */}

      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit User Entry
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Update lottery entry details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="text-xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* Form */}

            <form
              onSubmit={handleUpdateEntry}
              className="p-5"
            >

              {/* Number */}

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Lottery Number
                </label>

                <input
                  type="text"
                  name="number"
                  value={editData.number}
                  onChange={handleEditChange}
                  maxLength={6}
                  placeholder="123456"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Amount */}

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  value={editData.amount}
                  onChange={handleEditChange}
                  min="0"
                  placeholder="100"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Status */}

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  name="status"
                  value={editData.status}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="pending">
                    Pending
                  </option>

                  <option value="win">
                    Win
                  </option>

                  <option value="lost">
                    Lost
                  </option>
                </select>
              </div>

              {/* Entry Date */}

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Entry Date
                </label>

                <input
                  type="date"
                  name="entryDate"
                  value={editData.entryDate}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updateLoading
                    ? "Updating..."
                    : "Update Entry"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLottery;
