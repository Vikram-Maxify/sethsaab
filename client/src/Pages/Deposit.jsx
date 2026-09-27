import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createDeposit,
  selectDepositError,
  selectDepositLoading,
  selectDepositOrderId,
  selectDepositPaymentUrl,
} from "../reducer/slice/depositSlice";

export default function QwackPayDeposit() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectDepositLoading);
  const error = useSelector(selectDepositError);
  const paymentUrl = useSelector(selectDepositPaymentUrl);
  const orderId = useSelector(selectDepositOrderId);

  const [amount, setAmount] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setLocalError("Enter a valid amount.");
      return;
    }

    try {
      const result = await dispatch(
        createDeposit({
          amount: numericAmount,
          paymentMethod: "INR",
          channel: "qwackpay",
        })
      ).unwrap();

      const createdOrderId = String(
        result?.orderId || result?.deposit?.orderId || ""
      ).trim();

      const url = String(
        result?.paymentUrl || result?.payment_url || ""
      ).trim();

      if (createdOrderId) {
        try {
          localStorage.setItem("qwackpay_order_id", createdOrderId);
        } catch {}
      }

      if (!url) {
        setLocalError("Payment URL was not returned by the gateway.");
        return;
      }

      window.location.assign(url);
    } catch (err) {
      setLocalError(String(err || "Payment order creation failed."));
    }
  };

  const handleStatus = () => {
    const id = String(orderId || "").trim();
    if (id) navigate(`/payment-success?order_id=${encodeURIComponent(id)}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h1 className="text-2xl font-bold text-slate-900">Add Money</h1>
        <p className="mt-1 text-sm text-slate-500">
          Secure payment through QwackPay
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Amount (INR)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          {(localError || error) && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {localError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating payment..." : "Pay with QwackPay"}
          </button>
        </form>

        {paymentUrl && orderId && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Order ID</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold">
              {orderId}
            </p>

            <button
              type="button"
              onClick={() => window.location.assign(paymentUrl)}
              className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-900"
            >
              Open Payment Page
            </button>

            <button
              type="button"
              onClick={handleStatus}
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-600"
            >
              Check Payment Status
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
