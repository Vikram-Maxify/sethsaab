import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createLotteryConfig,
  getAllLotteryConfigs,
} from "../../reducer/slice/adminLotteryReducer";

const AdminLottery = () => {
  const dispatch = useDispatch();

  const {
    lotteries,
    loading,
    createLoading,
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
  // GET ALL MARKETS
  // =====================================================

  useEffect(() => {
    dispatch(getAllLotteryConfigs());
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

      // Refresh list
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
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Lottery Markets
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage monthly lottery markets.
          </p>
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
                Total markets: {lotteries?.length || 0}
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
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-sm text-gray-500">
                Loading markets...
              </div>
            </div>
          ) : lotteries?.length === 0 ? (
            /* =================================================
                EMPTY
            ================================================= */

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
            /* =================================================
                TABLE
            ================================================= */

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
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {lotteries.map((lottery, index) => (
                    <tr
                      key={lottery._id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* Number */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      {/* Market */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {lottery.marketName}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          ID: {lottery._id}
                        </div>
                      </td>

                      {/* Month */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {getMonthName(lottery.month)}
                      </td>

                      {/* Year */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {lottery.year}
                      </td>

                      {/* Users */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {lottery.users?.length || 0}
                      </td>

                      {/* Status */}

                      <td className="whitespace-nowrap px-5 py-4">
                        {lottery.isActive ? (
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
                        {formatDate(lottery.createdAt)}
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLottery;