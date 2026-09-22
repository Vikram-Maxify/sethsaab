import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  Home,
} from "lucide-react";

import {
  fetchDepositStatus,
  clearCurrentDeposit,
} from "../reducer/slice/depositSlice";

/* =====================================================
   STATUS MAP (backend ke saath match)
   0 = PENDING
   1 = SUCCESS
   2 = FAILED
   3 = CANCELLED
===================================================== */
const STATUS = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
  CANCELLED: 3,
};

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentDeposit, statusLoading } = useSelector(
    (state) => state.deposit || {}
  );

  const [localStatus, setLocalStatus] = useState("loading");
  const [amount, setAmount] = useState(null);
  const [orderId, setOrderId] = useState("");

  const pollCountRef = useRef(0);
  const pollTimerRef = useRef(null);

  /* =====================================================
     GET ORDER ID FROM URL
     QwackPay bhejta hai: order_id / merchant_order_id / orderId
  ===================================================== */
  useEffect(() => {
    const id =
      searchParams.get("order_id") ||
      searchParams.get("orderId") ||
      searchParams.get("merchant_order_id") ||
      "";

    if (!id) {
      // No order id — fallback to success
      setLocalStatus("success");
      return;
    }

    setOrderId(id);

    // ✅ Session clear — auto-cancel prevent
    sessionStorage.removeItem("deposit_pending_id");
    sessionStorage.removeItem("deposit_pending_amount");

    // ✅ Fetch status
    dispatch(fetchDepositStatus(id));
  }, [searchParams, dispatch]);

  /* =====================================================
     POLLING — pending hai toh 3 sec baad retry
     Max 10 retries (~30 sec)
  ===================================================== */
  useEffect(() => {
    if (!orderId) return;

    const runPoll = () => {
      pollTimerRef.current = setTimeout(() => {
        pollCountRef.current += 1;

        if (pollCountRef.current >= 10) return;

        dispatch(fetchDepositStatus(orderId));
        runPoll();
      }, 3000);
    };

    runPoll();

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [orderId, dispatch]);

  /* =====================================================
     UPDATE LOCAL STATUS WHEN REDUX UPDATES
  ===================================================== */
  useEffect(() => {
    if (!currentDeposit) return;

    const s = Number(currentDeposit.status);
    setAmount(currentDeposit.amount || null);

    if (s === STATUS.SUCCESS) setLocalStatus("success");
    else if (s === STATUS.FAILED) setLocalStatus("failed");
    else if (s === STATUS.CANCELLED) setLocalStatus("cancelled");
    else setLocalStatus("pending");
  }, [currentDeposit]);

  /* =====================================================
     CLEANUP ON UNMOUNT
  ===================================================== */
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      dispatch(clearCurrentDeposit());
    };
  }, [dispatch]);

  /* =====================================================
     UI
  ===================================================== */
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050606] px-4 text-white">
      <div className="w-full max-w-md rounded-[20px] border border-[#292929] bg-[#0b0d0d] p-6 text-center shadow-[0_0_30px_rgba(245,206,84,0.05)]">

        {/* ============ LOADING ============ */}
        {localStatus === "loading" && (
          <>
            <Loader2
              size={56}
              className="mx-auto animate-spin text-[#f5ce54]"
            />
            <h1 className="mt-5 text-xl font-bold">Checking Payment...</h1>
            <p className="mt-2 text-sm text-white/50">
              कृपया प्रतीक्षा करें
            </p>
          </>
        )}

        {/* ============ SUCCESS ============ */}
        {localStatus === "success" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 size={52} className="text-green-500" />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-green-500">
              Recharge Successful
            </h1>

            {amount ? (
              <p className="mt-3 flex items-center justify-center gap-2 text-base text-white/70">
                <Wallet size={18} className="text-[#f5ce54]" />
                <span className="font-bold text-[#f5ce54]">
                  ₹{Number(amount).toFixed(2)}
                </span>
                <span>added to wallet</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-white/60">
                आपका wallet balance update हो गया है
              </p>
            )}

            {orderId && (
              <p className="mt-3 break-all text-[11px] text-white/35">
                Order ID: {orderId}
              </p>
            )}
          </>
        )}

        {/* ============ PENDING ============ */}
        {localStatus === "pending" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
              <Clock size={48} className="text-yellow-400" />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-yellow-400">
              Payment Processing
            </h1>

            <p className="mt-2 text-sm text-white/60">
              आपका payment verify किया जा रहा है। कुछ सेकंड में wallet
              में balance add हो जाएगा।
            </p>

            {amount && (
              <p className="mt-3 text-lg font-bold text-[#f5ce54]">
                ₹{Number(amount).toFixed(2)}
              </p>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
              <Loader2 size={14} className="animate-spin" />
              Auto-checking status...
            </div>
          </>
        )}

        {/* ============ FAILED ============ */}
        {localStatus === "failed" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <XCircle size={52} className="text-red-500" />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-red-500">
              Payment Failed
            </h1>

            <p className="mt-2 text-sm text-white/60">
              आपका payment पूरा नहीं हो सका। कृपया दोबारा प्रयास करें।
            </p>

            {amount && (
              <p className="mt-3 text-lg font-bold text-white/70">
                ₹{Number(amount).toFixed(2)}
              </p>
            )}
          </>
        )}

        {/* ============ CANCELLED ============ */}
        {localStatus === "cancelled" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
              <XCircle size={52} className="text-yellow-400" />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-yellow-400">
              Payment Cancelled
            </h1>

            <p className="mt-2 text-sm text-white/60">
              आपने payment cancel कर दिया। कोई राशि नहीं कटी।
            </p>

            {amount && (
              <p className="mt-3 text-lg font-bold text-white/70">
                ₹{Number(amount).toFixed(2)}
              </p>
            )}
          </>
        )}

        {/* ============ ACTIONS ============ */}
        <div className="mt-6 flex flex-col gap-3">
          {(localStatus === "failed" ||
            localStatus === "cancelled") && (
            <button
              type="button"
              onClick={() => navigate("/recharge")}
              className="w-full rounded-[12px] bg-gradient-to-b from-[#fff59a] via-[#ffd84a] to-[#f4c21f] px-5 py-3 text-sm font-extrabold text-black active:scale-95"
            >
              Try Again
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#353535] bg-[#121515] px-5 py-3 text-sm font-bold text-white active:scale-95"
          >
            <Home size={16} />
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;