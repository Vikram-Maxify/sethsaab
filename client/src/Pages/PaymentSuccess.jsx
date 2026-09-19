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

  const purchaseLoading = useSelector(selectLotteryPurchaseLoading);
  const lotteryError = useSelector(selectLotteryError);

  // Prevent duplicate API call in React StrictMode
  const entryCalledRef = useRef(false);

  const orderId = searchParams.get("order_id");
  const amount = searchParams.get("amount");
  const number = searchParams.get("number");
  const status = searchParams.get("status");

  useEffect(() => {
    // Sirf successful payment par entry create karo
    if (status !== "success") return;

    // Required data check
    if (!number || !amount) {
      console.error("Lottery entry data missing:", {
        number,
        amount,
      });
      return;
    }

    // Duplicate call prevent
    if (entryCalledRef.current) return;

    entryCalledRef.current = true;

    console.log("Adding lottery entry:", {
      number,
      amount,
    });

    dispatch(
      addUserLotteryEntry({
        number: String(number),
        amount: Number(amount),
      })
    )
      .unwrap()
      .then((response) => {
        console.log("Lottery entry added successfully:", response);
      })
      .catch((error) => {
        console.error("Failed to add lottery entry:", error);

        // Agar API fail ho jaye to dobara attempt allow kar sakte hain
        entryCalledRef.current = false;
      });
  }, [status, number, amount, dispatch]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-center">

        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-5xl text-green-600">✓</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">
          Payment Successful
        </h1>

        <p className="text-gray-500 mt-2">
          Your payment has been successfully verified.
        </p>

        {/* Lottery Entry Status */}
        {purchaseLoading && (
          <div className="mt-4 bg-blue-50 text-blue-600 rounded-xl p-3">
            Adding your lottery entry...
          </div>
        )}

        {!purchaseLoading && lotteryError && (
          <div className="mt-4 bg-red-50 text-red-600 rounded-xl p-3">
            {lotteryError}
          </div>
        )}

        {!purchaseLoading && !lotteryError && status === "success" && (
          <div className="mt-4 bg-green-50 text-green-600 rounded-xl p-3">
            Lottery entry added successfully.
          </div>
        )}

        <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left space-y-3">

          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>

            <span className="font-bold text-gray-800">
              ₹{amount || "0"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Number</span>

            <span className="font-bold text-gray-800">
              {number || "-"}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Order ID</span>

            <span className="font-semibold text-gray-800 text-sm break-all">
              {orderId || "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>

            <span
              className={`font-bold ${
                status === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {status === "success" ? "SUCCESS" : status || "-"}
            </span>
          </div>

        </div>

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