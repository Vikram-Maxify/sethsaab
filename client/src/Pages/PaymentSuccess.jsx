import React, { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  addUserLotteryEntry,
  selectLotteryPurchaseLoading,
  selectLotteryError,
} from "../reducer/slice/createLotteryConfigSlice";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // =====================================================
  // REDUX STATE
  // =====================================================

  const purchaseLoading = useSelector(selectLotteryPurchaseLoading);
  const lotteryError = useSelector(selectLotteryError);

  // =====================================================
  // PREVENT DUPLICATE API CALL
  // =====================================================

  const entryCalledRef = useRef(false);

  // =====================================================
  // GET DATA FROM URL
  // =====================================================

  const orderId = searchParams.get("order_id");
  const amount = searchParams.get("amount");
  const number = searchParams.get("number");
  const status = searchParams.get("status");

  // IMPORTANT:
  // Backend redirect me config_id bhej raha hai
  const configId = searchParams.get("config_id");

  // =====================================================
  // ADD LOTTERY ENTRY
  // =====================================================

  useEffect(() => {
    // Sirf successful payment par entry create karo
    if (status !== "success") {
      return;
    }

    // ===================================================
    // REQUIRED DATA CHECK
    // ===================================================

    if (!configId || !number || !amount) {
      console.error("Lottery entry data missing:", {
        configId,
        number,
        amount,
        orderId,
        status,
      });

      return;
    }

    // ===================================================
    // PREVENT DUPLICATE API CALL
    // ===================================================

    if (entryCalledRef.current) {
      return;
    }

    entryCalledRef.current = true;

    // ===================================================
    // PREPARE DATA
    // ===================================================

    const entryData = {
      configId: String(configId),
      number: String(number),
      amount: Number(amount),
    };

    console.log("=================================");
    console.log("ADDING LOTTERY ENTRY");
    console.log("Config ID :", entryData.configId);
    console.log("Number    :", entryData.number);
    console.log("Amount    :", entryData.amount);
    console.log("Order ID  :", orderId);
    console.log("=================================");

    // ===================================================
    // API CALL
    // ===================================================

    dispatch(addUserLotteryEntry(entryData))
      .unwrap()
      .then((response) => {
        console.log(
          "Lottery entry added successfully:",
          response
        );
      })
      .catch((error) => {
        console.error(
          "Failed to add lottery entry:",
          error
        );

        // API fail hone par retry allow
        entryCalledRef.current = false;
      });
  }, [
    status,
    configId,
    number,
    amount,
    orderId,
    dispatch,
  ]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-center">

        {/* ==============================================
            SUCCESS ICON
        ============================================== */}

        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-5xl text-green-600">
            ✓
          </span>
        </div>

        {/* ==============================================
            TITLE
        ============================================== */}

        <h1 className="text-2xl font-bold text-gray-800">
          Payment Successful
        </h1>

        <p className="text-gray-500 mt-2">
          Your payment has been successfully verified.
        </p>

        {/* ==============================================
            MISSING DATA
        ============================================== */}

        {status === "success" &&
          (!configId || !number || !amount) && (
            <div className="mt-4 bg-red-50 text-red-600 rounded-xl p-3 text-sm">
              Lottery entry information is missing.
            </div>
          )}

        {/* ==============================================
            LOADING
        ============================================== */}

        {purchaseLoading && (
          <div className="mt-4 bg-blue-50 text-blue-600 rounded-xl p-3">
            Adding your lottery entry...
          </div>
        )}

        {/* ==============================================
            ERROR
        ============================================== */}

        {!purchaseLoading && lotteryError && (
          <div className="mt-4 bg-red-50 text-red-600 rounded-xl p-3">
            {typeof lotteryError === "string"
              ? lotteryError
              : lotteryError?.message ||
                "Failed to add lottery entry."}
          </div>
        )}

        {/* ==============================================
            SUCCESS
        ============================================== */}

        {!purchaseLoading &&
          !lotteryError &&
          status === "success" &&
          configId &&
          number &&
          amount && (
            <div className="mt-4 bg-green-50 text-green-600 rounded-xl p-3">
              Lottery entry added successfully.
            </div>
          )}

        {/* ==============================================
            PAYMENT DETAILS
        ============================================== */}

        <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left space-y-3">

          {/* AMOUNT */}

          <div className="flex justify-between gap-4">
            <span className="text-gray-500">
              Amount
            </span>

            <span className="font-bold text-gray-800">
              ₹{amount || "0"}
            </span>
          </div>

          {/* NUMBER */}

          <div className="flex justify-between gap-4">
            <span className="text-gray-500">
              Number
            </span>

            <span className="font-bold text-gray-800">
              {number || "-"}
            </span>
          </div>

          {/* CONFIG ID */}

          <div className="flex justify-between gap-4">
            <span className="text-gray-500">
              Config ID
            </span>

            <span className="font-semibold text-gray-800 text-xs break-all text-right max-w-[220px]">
              {configId || "-"}
            </span>
          </div>

          {/* ORDER ID */}

          <div className="flex justify-between gap-4">
            <span className="text-gray-500">
              Order ID
            </span>

            <span className="font-semibold text-gray-800 text-sm break-all text-right max-w-[220px]">
              {orderId || "-"}
            </span>
          </div>

          {/* STATUS */}

          <div className="flex justify-between gap-4">
            <span className="text-gray-500">
              Status
            </span>

            <span
              className={`font-bold ${
                status === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {status === "success"
                ? "SUCCESS"
                : status || "-"}
            </span>
          </div>
        </div>

        {/* ==============================================
            HOME BUTTON
        ============================================== */}

        <button
          onClick={() => navigate("/")}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
