import { Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import firstPrize from "../assets/1trophy.png";
import secondPrize from "../assets/2trophy.png";
import kuberBanner from "../assets/4ban.jpeg";
import thirdPrize from "../assets/3trophy.png";

import {
  clearLotteryConfigError,
  clearLotteryConfigSuccess,
  getActiveLotteryConfig,
} from "../reducer/slice/createLotteryConfigSlice";

import { getAmount } from "../reducer/slice/amountReducer";

import {
  createDeposit,
  clearDepositState,
} from "../reducer/slice/depositSlice";

// =====================================================
// ICON GLOW
// =====================================================

const iconGlow =
  "drop-shadow-[0_0_6px_rgba(245,197,66,0.95)] drop-shadow-[0_0_15px_rgba(245,197,66,0.65)] drop-shadow-[0_0_26px_rgba(245,197,66,0.35)]";

// =====================================================
// HINDI MONTHS
// =====================================================

const HINDI_MONTHS = [
  "जनवरी",
  "फरवरी",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुलाई",
  "अगस्त",
  "सितंबर",
  "अक्टूबर",
  "नवंबर",
  "दिसंबर",
];

// =====================================================
// GET DRAW TIMESTAMP
// =====================================================
// API:
// drawDate = "2026-09-20T18:30:00.000Z"
// drawTime = "18:50"
// drawTime is treated as IST.
//
// 18:50 IST = 13:20 UTC
// =====================================================

const getDrawTimestamp = (lotteryConfig) => {
  if (!lotteryConfig?.drawDate || !lotteryConfig?.drawTime) {
    return null;
  }

  const drawDate = new Date(lotteryConfig.drawDate);

  if (Number.isNaN(drawDate.getTime())) {
    return null;
  }

  const [hoursString, minutesString] = String(
    lotteryConfig.drawTime
  ).split(":");

  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const year = drawDate.getUTCFullYear();
  const month = drawDate.getUTCMonth();
  const day = drawDate.getUTCDate();

  // IST -> UTC
  const utcTimestamp = Date.UTC(
    year,
    month,
    day,
    hours - 5,
    minutes - 30,
    0,
    0
  );

  return utcTimestamp;
};

// =====================================================
// COUNTDOWN
// =====================================================

const getCountdown = (drawTimestamp) => {
  if (!drawTimestamp) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false,
      available: false,
    };
  }

  const now = Date.now();
  const difference = drawTimestamp - now;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
      available: true,
    };
  }

  const totalSeconds = Math.floor(difference / 1000);

  const days = Math.floor(totalSeconds / 86400);

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: false,
    available: true,
  };
};

// =====================================================
// BUY TICKET
// =====================================================

const BuyTicket = () => {
  const dispatch = useDispatch();

  // ===================================================
  // LOTTERY REDUX STATE
  // ===================================================

  const {
    config,
    activeConfig,
    activeLoading,
    error,
  } = useSelector(
    (state) =>
      state.createLotteryConfig || {
        config: null,
        activeConfig: null,
        activeLoading: false,
        error: null,
      }
  );

  // ===================================================
  // AMOUNT REDUX STATE
  // ===================================================

  const {
    amount: ticketPriceFromApi,
    loading: amountLoading,
  } = useSelector(
    (state) =>
      state.amount || {
        amount: null,
        loading: false,
      }
  );

  // ===================================================
  // DEPOSIT REDUX STATE
  // ===================================================

  const {
    loading: depositLoading,
    error: depositError,
  } = useSelector(
    (state) =>
      state.deposit || {
        loading: false,
        error: null,
      }
  );

  // ===================================================
  // TICKET PRICE
  // ===================================================

  const TICKET_PRICE = Number(ticketPriceFromApi) || 0;

  // ===================================================
  // LOTTERY CONFIG
  // ===================================================

  const lotteryConfig = config || activeConfig;

  // ===================================================
  // LOCAL STATE
  // ===================================================

  const [numbers, setNumbers] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");

  // ===================================================
  // COUNTDOWN STATE
  // ===================================================

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
    available: false,
  });

  // ===================================================
  // INITIAL API CALLS
  // ===================================================

  useEffect(() => {
    dispatch(getActiveLotteryConfig());
    dispatch(getAmount());
  }, [dispatch]);

  // ===================================================
  // LIVE DRAW COUNTDOWN
  // ===================================================

  useEffect(() => {
    if (!lotteryConfig?.drawDate || !lotteryConfig?.drawTime) {
      setCountdown({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: false,
        available: false,
      });

      return;
    }

    const drawTimestamp = getDrawTimestamp(lotteryConfig);

    if (!drawTimestamp) {
      setCountdown({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: false,
        available: false,
      });

      return;
    }

    const updateCountdown = () => {
      setCountdown(getCountdown(drawTimestamp));
    };

    // Immediately calculate on page load
    updateCountdown();

    // Update every second
    const interval = setInterval(
      updateCountdown,
      1000
    );

    return () => clearInterval(interval);
  }, [
    lotteryConfig?.drawDate,
    lotteryConfig?.drawTime,
  ]);

  // ===================================================
  // DRAW DATE
  // ===================================================

  const drawDateText = useMemo(() => {
    if (!lotteryConfig) {
      return "ड्रॉ जल्द घोषित होगा";
    }

    // Prefer actual drawDate from API
    if (lotteryConfig.drawDate) {
      const date = new Date(
        lotteryConfig.drawDate
      );

      if (!Number.isNaN(date.getTime())) {
        const day = date.getUTCDate();
        const month = date.getUTCMonth();
        const year = date.getUTCFullYear();

        return `${day} ${HINDI_MONTHS[month]} ${year}`;
      }
    }

    if (
      !lotteryConfig?.month ||
      !lotteryConfig?.year
    ) {
      return "ड्रॉ जल्द घोषित होगा";
    }

    const date = new Date(
      Number(lotteryConfig.year),
      Number(lotteryConfig.month) - 1,
      Number(lotteryConfig.date || 1)
    );

    return new Intl.DateTimeFormat("hi-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }, [lotteryConfig]);

  // ===================================================
  // CLEAR MESSAGES
  // ===================================================

  const clearMessages = () => {
    setLocalError("");
    setLocalSuccess("");

    dispatch(clearLotteryConfigError());
    dispatch(clearLotteryConfigSuccess());
    dispatch(clearDepositState());
  };

  // ===================================================
  // NUMBER CHANGE
  // ===================================================

  const handleNumberChange = (index, value) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    const next = [...numbers];

    next[index] = value;

    setNumbers(next);

    setLocalError("");
    setLocalSuccess("");

    if (
      value &&
      index < numbers.length - 1
    ) {
      const nextInput = document.querySelector(
        `[data-lottery-index="${index + 1}"]`
      );

      nextInput?.focus();
    }
  };

  // ===================================================
  // HANDLE BACKSPACE
  // ===================================================

  const handleNumberKeyDown = (
    index,
    event
  ) => {
    if (
      event.key === "Backspace" &&
      !numbers[index] &&
      index > 0
    ) {
      const previousInput =
        document.querySelector(
          `[data-lottery-index="${index - 1}"]`
        );

      previousInput?.focus();
    }
  };

  // ===================================================
  // RANDOM NUMBER
  // ===================================================

  const generateRandom = () => {
    const result = [];

    while (result.length < 6) {
      const n = String(
        Math.floor(Math.random() * 10)
      );

      result.push(n);
    }

    setNumbers(result);
    clearMessages();
  };

  // ===================================================
  // CLEAR NUMBERS
  // ===================================================

  const clearNumbers = () => {
    setNumbers([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    clearMessages();

    setTimeout(() => {
      const firstInput =
        document.querySelector(
          '[data-lottery-index="0"]'
        );

      firstInput?.focus();
    }, 50);
  };

  // ===================================================
  // HANDLE PURCHASE
  // ===================================================

  const handlePurchase = async () => {
    try {
      setLocalError("");
      setLocalSuccess("");

      dispatch(clearLotteryConfigError());
      dispatch(clearLotteryConfigSuccess());
      dispatch(clearDepositState());

      // ===============================================
      // CHECK SIX DIGITS
      // ===============================================

      if (
        numbers.some(
          (number) => number === ""
        )
      ) {
        setLocalError(
          "कृपया सभी 6 नंबर दर्ज करें"
        );
        return;
      }

      // ===============================================
      // CREATE LOTTERY NUMBER
      // ===============================================

      const lotteryNumber =
        numbers.join("");

      if (
        !/^\d{6}$/.test(
          lotteryNumber
        )
      ) {
        setLocalError(
          "लॉटरी नंबर ठीक 6 अंकों का होना चाहिए"
        );
        return;
      }

      // ===============================================
      // CHECK LOTTERY CONFIG
      // ===============================================

      if (!lotteryConfig?._id) {
        setLocalError(
          "Active lottery configuration नहीं मिली"
        );
        return;
      }

      if (!lotteryConfig?.isActive) {
        setLocalError(
          "Lottery अभी active नहीं है"
        );
        return;
      }

      // ===============================================
      // CHECK AMOUNT
      // ===============================================

      const amount =
        Number(ticketPriceFromApi);

      if (!amount || amount <= 0) {
        setLocalError(
          "टिकट की कीमत उपलब्ध नहीं है"
        );
        return;
      }

      // ===============================================
      // CREATE QWACKPAY PAYMENT
      // ===============================================

      // New QwackPay flow does not use the old
      // getGatewaysUser / VoterX gateway slice.
      // Backend resolves the active QwackPay gateway
      // from channel: "qwackpay".

      const response = await dispatch(
        createDeposit({
          paymentMethod: "INR",
          channel: "qwackpay",
          amount,
          utr: "",
          configId: lotteryConfig._id,
          number: lotteryNumber,
        })
      ).unwrap();

      // ===============================================
      // PAYMENT URL
      // ===============================================

      const paymentUrl =
        response?.paymentUrl ||
        response?.data?.paymentUrl ||
        response?.data?.payment_url;

      if (!paymentUrl) {
        setLocalError(
          "QwackPay payment URL प्राप्त नहीं हुई"
        );
        return;
      }

      // ===============================================
      // PAYMENT CREATED SUCCESSFULLY
      // ===============================================

      setLocalSuccess(
        "Payment order तैयार हो गया है..."
      );

      // ===============================================
      // OPEN VOTERX
      // ===============================================

      window.location.href =
        paymentUrl;
    } catch (error) {
      console.error(
        "QWACKPAY PAYMENT ERROR:",
        error
      );

      setLocalError(
        typeof error === "string"
          ? error
          : error?.message ||
          error?.payload?.message ||
          "QwackPay payment शुरू नहीं हो सका"
      );
    }
  };

  // ===================================================
  // DISPLAY ERROR
  // ===================================================

  const displayError =
    localError ||
    error ||
    depositError;

  // ===================================================
  // DISABLE PURCHASE
  // ===================================================

  const isPurchaseDisabled =
    depositLoading ||
    activeLoading ||
    amountLoading ||
    !lotteryConfig?._id ||
    !lotteryConfig?.isActive ||
    !ticketPriceFromApi ||
    Number(ticketPriceFromApi) <= 0 ||
    numbers.some(
      (number) => number === ""
    );

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-[#050606] text-white pb-28">

      {/* =================================================
          BANNER
      ================================================= */}

      <section className="w-full">
        <img
          src={kuberBanner}
          alt="Kuber Ticket"
          className="block w-full aspect-[16/9] object-cover"
        />
      </section>

      <main className="px-[14px] pt-3">

        {/* =================================================
            LOTTERY INFO
        ================================================= */}
        <section
          id="nvc164"
          className="
    relative
    w-full
    rounded-[18px]
    border border-[#d7b838]/80
    bg-[#040505]
    overflow-hidden
    shadow-[0_0_20px_rgba(215,184,56,0.10),inset_0_0_35px_rgba(215,184,56,0.04)]
  "
        >
          {/* Background Glow */}
          <div
            className="
      absolute inset-0
      pointer-events-none
      bg-[radial-gradient(circle_at_18%_50%,rgba(245,206,84,0.10),transparent_35%),radial-gradient(circle_at_82%_50%,rgba(245,206,84,0.08),transparent_35%)]
    "
          />

          {/* Top Gold Line */}
          <div
            className="
      absolute
      top-0
      left-0
      right-0
      h-[1px]
      bg-gradient-to-r
      from-transparent
      via-[#f5ce54]
      to-transparent
      opacity-80
    "
          />

          <div
            className="
      relative
      grid
      grid-cols-2
      min-h-[104px]
      min-[400px]:min-h-[112px]
      min-[450px]:min-h-[124px]
    "
          >
            {/* =====================================================
        LEFT — NEXT DRAW
    ===================================================== */}
            <div
              className="
        min-w-0
        flex
        items-center
        gap-[6px]
        px-[6px]
        border-r
        border-[#d7b838]/25

        min-[400px]:gap-[9px]
        min-[400px]:px-[9px]

        min-[450px]:gap-3
        min-[450px]:px-3
      "
            >
              {/* Calendar */}
              <div className="shrink-0 flex items-center justify-center">
                <CalendarIcon
                  size={21}
                  strokeWidth={2.5}
                  className="
            text-[#f5ce54]
            w-[21px]
            h-[21px]

            min-[400px]:w-[25px]
            min-[400px]:h-[25px]

            min-[450px]:w-[32px]
            min-[450px]:h-[32px]

            drop-shadow-[0_0_4px_rgba(245,206,84,1)]
            drop-shadow-[0_0_9px_rgba(245,206,84,0.95)]
            drop-shadow-[0_0_17px_rgba(245,206,84,0.65)]
          "
                />
              </div>

              {/* Draw Text */}
              <div className="min-w-0 flex-1">
                <p
                  className="
            text-[14px]
            leading-[1.2]
            font-medium
            text-white/95
            whitespace-nowrap

            min-[400px]:text-[16px]

            min-[450px]:text-[19px]
          "
                >
                  अगला ड्रॉ (लकी ड्रॉ)
                </p>

                <p
                  className="
            mt-[4px]
            text-[14px]
            leading-[1.2]
            font-extrabold
            text-[#f5ce54]
            whitespace-nowrap
            truncate
            drop-shadow-[0_0_6px_rgba(245,206,84,0.45)]

            min-[400px]:text-[17px]
            min-[400px]:mt-[4px]

            min-[450px]:text-[18px]
            min-[450px]:mt-[6px]
          "
                >
                  {activeLoading ? "लोड हो रहा है..." : drawDateText}
                </p>
              </div>
            </div>

            {/* =====================================================
        RIGHT — COUNTDOWN
    ===================================================== */}
            <div
              className="
        min-w-0
        flex
        flex-col
        justify-center
        px-[6px]

        min-[400px]:px-[9px]

        min-[450px]:px-4
      "
            >
              {/* Countdown Heading */}
              <div
                className="
          flex
          items-center
          gap-[4px]
          min-w-0

          min-[400px]:gap-[6px]

          min-[450px]:gap-2
        "
              >
                <div className="shrink-0 flex items-center justify-center">
                  <ClockIcon
                    size={20}
                    strokeWidth={2.5}
                    className="
              text-[#f5ce54]
              w-[20px]
              h-[20px]

              min-[400px]:w-[23px]
              min-[400px]:h-[23px]

              min-[450px]:w-[30px]
              min-[450px]:h-[30px]

              drop-shadow-[0_0_4px_rgba(245,206,84,1)]
              drop-shadow-[0_0_9px_rgba(245,206,84,0.95)]
              drop-shadow-[0_0_17px_rgba(245,206,84,0.65)]
            "
                  />
                </div>

                <span
                  className="
           
            text-[14px]
            leading-[1.2]
            font-medium
            text-white/95
            whitespace-nowrap

            min-[400px]:text-[17px]

            min-[450px]:text-[20px]
          "
                >
                  {countdown.expired ? "लकी ड्रॉ" : "ड्रा शुरू होने में"}
                </span>
              </div>

              {/* Countdown */}
              <div
                className="
          mt-[6px]
          w-full
          min-w-0

          min-[400px]:mt-[10px]

          min-[450px]:mt-[12px]
        "
              >
                {!countdown.available ? (
                  <p
                    className="
              text-[10px]
              font-bold
              text-[#f5ce54]
              whitespace-nowrap

              min-[400px]:text-[12px]

              min-[450px]:text-[17px]
            "
                  >
                    टाइमर उपलब्ध नहीं
                  </p>
                ) : countdown.expired ? (
                  <p
                    className="
              text-[10px]
              font-extrabold
              text-[#f5ce54]
              whitespace-nowrap

              min-[400px]:text-[12px]

              min-[450px]:text-[17px]
            "
                  >
                    ड्रा शुरू हो गया
                  </p>
                ) : (
                  <div
                    className="
              flex
              items-center
              justify-center
              w-full
              min-w-0
              gap-[2px]

              min-[400px]:gap-[3px]

              min-[450px]:gap-0
            "
                  >
                    {/* ================= DAYS ================= */}
                    <div
                      className="
                shrink-0
                w-[27px]
                text-center

                min-[400px]:w-[34px]

                min-[450px]:flex-1
                min-[450px]:w-auto
              "
                    >
                      <div
                        className="
                  text-[15px]
                  leading-none
                  font-extrabold
                  text-[#f5ce54]
                  drop-shadow-[0_0_6px_rgba(245,206,84,0.45)]

                  min-[400px]:text-[18px]

                  min-[450px]:text-[25px]
                "
                      >
                        {String(countdown.days).padStart(2, "0")}
                      </div>

                      <div
                        className="
                  mt-[3px]
                  text-[5px]
                  leading-none
                  font-medium
                  text-white/65

                  min-[400px]:text-[6px]

                  min-[450px]:text-[9px]
                "
                      >
                        दिन
                      </div>
                    </div>

                    {/* ================= COLON ================= */}
                    <span
                      className="
                shrink-0
                flex
                items-center
                justify-center
                w-[8px]
                h-[22px]
                text-[11px]
                leading-none
                font-bold
                text-[#f5ce54]

                min-[400px]:w-[10px]
                min-[400px]:h-[25px]
                min-[400px]:text-[14px]

                min-[450px]:w-auto
                min-[450px]:h-auto
                min-[450px]:px-[1px]
                min-[450px]:text-[20px]
              "
                    >
                      :
                    </span>

                    {/* ================= HOURS ================= */}
                    <div
                      className="
                shrink-0
                w-[27px]
                text-center

                min-[400px]:w-[34px]

                min-[450px]:flex-1
                min-[450px]:w-auto
              "
                    >
                      <div
                        className="
                  text-[15px]
                  leading-none
                  font-extrabold
                  text-[#f5ce54]
                  drop-shadow-[0_0_6px_rgba(245,206,84,0.45)]

                  min-[400px]:text-[18px]

                  min-[450px]:text-[25px]
                "
                      >
                        {String(countdown.hours).padStart(2, "0")}
                      </div>

                      <div
                        className="
                  mt-[3px]
                  text-[5px]
                  leading-none
                  font-medium
                  text-white/65

                  min-[400px]:text-[6px]

                  min-[450px]:text-[9px]
                "
                      >
                        घंटे
                      </div>
                    </div>

                    {/* ================= COLON ================= */}
                    <span
                      className="
                shrink-0
                flex
                items-center
                justify-center
                w-[8px]
                h-[22px]
                text-[11px]
                leading-none
                font-bold
                text-[#f5ce54]

                min-[400px]:w-[10px]
                min-[400px]:h-[25px]
                min-[400px]:text-[14px]

                min-[450px]:w-auto
                min-[450px]:h-auto
                min-[450px]:px-[1px]
                min-[450px]:text-[20px]
              "
                    >
                      :
                    </span>

                    {/* ================= MINUTES ================= */}
                    <div
                      className="
                shrink-0
                w-[27px]
                text-center

                min-[400px]:w-[34px]

                min-[450px]:flex-1
                min-[450px]:w-auto
              "
                    >
                      <div
                        className="
                  text-[15px]
                  leading-none
                  font-extrabold
                  text-[#f5ce54]
                  drop-shadow-[0_0_6px_rgba(245,206,84,0.45)]

                  min-[400px]:text-[18px]

                  min-[450px]:text-[25px]
                "
                      >
                        {String(countdown.minutes).padStart(2, "0")}
                      </div>

                      <div
                        className="
                  mt-[3px]
                  text-[5px]
                  leading-none
                  font-medium
                  text-white/65

                  min-[400px]:text-[6px]

                  min-[450px]:text-[9px]
                "
                      >
                        मिनट
                      </div>
                    </div>

                    {/* ================= COLON ================= */}
                    <span
                      className="
                shrink-0
                flex
                items-center
                justify-center
                w-[8px]
                h-[22px]
                text-[11px]
                leading-none
                font-bold
                text-[#f5ce54]

                min-[400px]:w-[10px]
                min-[400px]:h-[25px]
                min-[400px]:text-[14px]

                min-[450px]:w-auto
                min-[450px]:h-auto
                min-[450px]:px-[1px]
                min-[450px]:text-[20px]
              "
                    >
                      :
                    </span>

                    {/* ================= SECONDS ================= */}
                    <div
                      className="
                shrink-0
                w-[27px]
                text-center

                min-[400px]:w-[34px]

                min-[450px]:flex-1
                min-[450px]:w-auto
              "
                    >
                      <div
                        className="
                  text-[15px]
                  leading-none
                  font-extrabold
                  text-[#f5ce54]
                  drop-shadow-[0_0_6px_rgba(245,206,84,0.45)]

                  min-[400px]:text-[18px]

                  min-[450px]:text-[25px]
                "
                      >
                        {String(countdown.seconds).padStart(2, "0")}
                      </div>

                      <div
                        className="
                  mt-[3px]
                  text-[5px]
                  leading-none
                  font-medium
                  text-white/65

                  min-[400px]:text-[6px]

                  min-[450px]:text-[9px]
                "
                      >
                        सेकंड
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        {/* =================================================
            PRIZES
        ================================================= */}

        <section className="mt-3">

          <div className="flex items-center justify-center gap-2 mb-2">

            <TrophyIcon />

            <h2 className="text-[23px] font-extrabold text-[#f5ce54]">
              इनाम विवरण
            </h2>

          </div>

          <div className="grid grid-cols-3 gap-[8px]">

            <PrizeCard
              title="प्रथम पुरस्कार"
              amount="₹5 करोड़"
              condition="(6 अंक मिलने पर)"
              image={firstPrize}
            />

            <PrizeCard
              title="द्वितीय पुरस्कार"
              amount="₹3 करोड़"
              condition="(5 अंक मिलने पर)"
              image={secondPrize}
            />

            <PrizeCard
              title="तृतीय पुरस्कार"
              amount="₹2 करोड़"
              condition="(4 अंक मिलने पर)"
              image={thirdPrize}
            />

          </div>

        </section>

        {/* =================================================
            NUMBER SELECTION
        ================================================= */}

        <section className="mt-3 rounded-[18px] border border-[#353535] bg-[#080a0a] p-3">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <TargetIcon />

              <h2 className="text-[18px] font-bold">
                अपना लकी नंबर चुनें
              </h2>

            </div>

            <button
              type="button"
              onClick={generateRandom}
              disabled={
                depositLoading ||
                activeLoading ||
                !lotteryConfig?.isActive
              }
              className="flex items-center gap-2 bg-[#171a1b] border border-[#252828] rounded-lg px-3 py-2 disabled:opacity-50"
            >

              <ShuffleIcon />

              <span className="text-[11px] text-white/70">
                रैंडम नंबर
              </span>

            </button>

          </div>

          {/* =================================================
              SIX DIGIT INPUTS
          ================================================= */}

          <div className="grid grid-cols-6 gap-[7px] mt-4">

            {numbers.map(
              (number, index) => (
                <input
                  key={index}
                  data-lottery-index={index}
                  value={number}
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="--"
                  onChange={(e) =>
                    handleNumberChange(
                      index,
                      e.target.value
                    )
                  }
                  onKeyDown={(e) =>
                    handleNumberKeyDown(
                      index,
                      e
                    )
                  }
                  disabled={
                    depositLoading ||
                    activeLoading
                  }
                  className="w-full h-[62px] rounded-[10px] border border-[#e2c540] bg-[#101416] text-center text-[25px] font-bold text-[#d7dadd] outline-none placeholder:text-white/20 focus:border-[#ffd94f] focus:shadow-[0_0_12px_rgba(245,197,66,0.18)] disabled:opacity-60"
                />
              )
            )}

          </div>

          {/* =================================================
              INFO
          ================================================= */}

          <div className="flex items-center justify-center gap-2 mt-4">

            <InfoIcon />

            <p className="text-[12px] text-white/55 text-center">
              6 अंकों का लकी नंबर चुनें
              (000000 – 999999)
            </p>

          </div>

          {/* =================================================
              CLEAR
          ================================================= */}

          <div className="flex justify-center mt-2">

            <button
              type="button"
              onClick={clearNumbers}
              disabled={depositLoading}
              className="text-[11px] text-white/45 underline underline-offset-2 disabled:opacity-40"
            >
              नंबर साफ करें
            </button>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {displayError && (
            <div className="mt-3 rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-[12px] text-red-300">
              {typeof displayError === "string"
                ? displayError
                : displayError?.message ||
                "Payment gateway में समस्या हुई"}
            </div>
          )}

          {/* =================================================
              SUCCESS
          ================================================= */}

          {localSuccess && !displayError && (
            <div className="mt-3 rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-[12px] text-emerald-300">
              {localSuccess}
            </div>
          )}

          {/* =================================================
              DIVIDER
          ================================================= */}

          <div className="h-px bg-[#393939] my-4" />

          {/* =================================================
              PRICE
          ================================================= */}

          <div className="grid grid-cols-2 items-center">

            <div className="flex items-center gap-3 px-2">

              <TicketIcon />

              <div>

                <p className="text-[13px] text-white/80">
                  टिकट की कीमत
                </p>

                <p className="text-[31px] leading-none font-extrabold text-[#f5ce54] mt-1">
                  {amountLoading
                    ? "..."
                    : TICKET_PRICE > 0
                      ? `₹${TICKET_PRICE}`
                      : "₹0"}
                </p>

              </div>

            </div>

            <div className="border-l border-[#3a3a3a] pl-5">

              <p className="text-[14px] text-[#f5ce54] font-semibold">
                ✨ एक टिकट, लाखों सपने
              </p>

            </div>

          </div>

          {/* =================================================
              BUY BUTTON
          ================================================= */}

          <button
            type="button"
            onClick={handlePurchase}
            disabled={isPurchaseDisabled}
            className="relative w-full h-[60px] mt-4 rounded-[14px] overflow-hidden bg-gradient-to-b from-[#fff59a] via-[#ffd84a] to-[#f4c21f] text-black text-[20px] font-extrabold flex items-center justify-center gap-3 border border-[#fff8c7] shadow-[0_0_12px_rgba(255,221,55,0.95),0_0_28px_rgba(255,210,35,0.75),0_0_55px_rgba(255,200,20,0.5),0_8px_30px_rgba(255,205,30,0.35),inset_0_2px_0_rgba(255,255,255,0.98),inset_0_-4px_8px_rgba(180,120,0,0.18)] active:scale-[0.98] transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_16px_rgba(255,230,70,1),0_0_35px_rgba(255,215,40,0.9),0_0_70px_rgba(255,200,20,0.6),0_10px_35px_rgba(255,205,30,0.45)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
          >
            {/* TOP SHINE */}
            <span className="absolute top-0 left-[8%] right-[8%] h-[2px] bg-white/95 blur-[0.5px]" />

            {/* SOFT CENTER GLOW */}
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,220,0.5),transparent_55%)] pointer-events-none" />

            <Ticket
              size={35}
              strokeWidth={2.5}
              className={`relative z-10 text-[#090909] rotate-[-17deg] shrink-0 ${iconGlow}`}
            />

            <span className="relative z-10">
              {depositLoading
                ? "QwackPay खोला जा रहा है..."
                : `अभी खरीदें - ₹${TICKET_PRICE}`}
            </span>

            {!depositLoading && (
              <span className="relative z-10 text-[30px] leading-none font-bold">
                →
              </span>
            )}
          </button>


          {/* =================================================
              PAYMENT INFO
          ================================================= */}

          <div className="flex items-center justify-center gap-2 mt-3">

            <LockIcon />

            <span className="text-[12px] text-white/50">
              सुरक्षित भुगतान | QwackPay
            </span>

          </div>

        </section>

        {/* =================================================
            FEATURES
        ================================================= */}

        <section className="mt-3 rounded-[18px] border border-[#282828] bg-[#080a0a] py-4">

          <div className="grid grid-cols-4">

            <SmallFeature
              icon={<ShieldIcon />}
              text="100% सुरक्षित"
            />

            <SmallFeature
              icon={<ZapIcon />}
              text="तुरंत और आसान"
            />

            <SmallFeature
              icon={<UsersIcon />}
              text="लाखों लोग पहले से जुड़े"
            />

            <SmallFeature
              icon={<SupportIcon />}
              text="24/7 सहायता"
            />

          </div>

        </section>

      </main>

    </div>
  );
};

// =====================================================
// PRIZE CARD
// =====================================================

const PrizeCard = ({
  title,
  amount,
  condition,
  image,
}) => (
  <div
    className="relative w-full h-[194px] rounded-[13px] overflow-hidden border border-[#d7b544] flex flex-col items-center text-center px-1"
    style={{
      backgroundImage: `url(${image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
  >
    <div className="absolute inset-0 bg-black/[0.06] pointer-events-none" />

    <div className="relative z-10 w-full flex flex-col items-center">

      <p className="mt-[15px] text-[12px] text-white font-semibold leading-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
        {title}
      </p>

      <p className="mt-[13px] text-[25px] font-extrabold text-[#fff0a3] leading-none whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
        {amount}
      </p>

      <p className="mt-[9px] text-[10px] text-white font-medium leading-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
        {condition}
      </p>

    </div>
  </div>
);

// =====================================================
// SMALL FEATURE
// =====================================================

const SmallFeature = ({
  icon,
  text,
}) => (
  <div className="flex flex-col items-center justify-center px-1 text-center">

    <div className="mb-2">
      {icon}
    </div>

    <span className="text-[10px] leading-tight text-white/80">
      {text}
    </span>

  </div>
);

// =====================================================
// CALENDAR ICON
// =====================================================

const CalendarIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={iconGlow}
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="17"
      rx="2"
    />

    <path d="M16 2v4M8 2v4M3 10h18" />

    <path d="M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2M15 18h2" />
  </svg>
);

// =====================================================
// CLOCK ICON
// =====================================================

const ClockIcon = () => (
  <svg
    width="25"
    height="25"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="1.8"
    className={iconGlow}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <path d="M12 7v5l3 2" />
  </svg>
);

// =====================================================
// TROPHY ICON
// =====================================================

const TrophyIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="1.8"
    className={iconGlow}
  >
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z" />

    <path d="M7 6H3v2a4 4 0 004 4M17 6h4v2a4 4 0 01-4 4" />
  </svg>
);

// =====================================================
// TARGET ICON
// =====================================================

const TargetIcon = () => (
  <svg
    width="29"
    height="29"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="1.8"
    className={iconGlow}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <circle
      cx="12"
      cy="12"
      r="5"
    />

    <circle
      cx="12"
      cy="12"
      r="1.5"
      fill="#f5ce54"
    />

    <path d="M16 8l5-5M18 3h3v3" />
  </svg>
);

// =====================================================
// SHUFFLE ICON
// =====================================================

const ShuffleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="2"
    className={iconGlow}
  >
    <path d="M3 7h3c4 0 6 10 10 10h5" />

    <path d="M18 14l3 3-3 3" />

    <path d="M3 17h3c1.5 0 2.5-1 3.5-2.5" />

    <path d="M18 4l3 3-3 3" />

    <path d="M13 7c1 0 2 0 3 0h5" />
  </svg>
);

// =====================================================
// INFO ICON
// =====================================================

const InfoIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="2"
    className={`${iconGlow} shrink-0`}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <path d="M12 11v5M12 8h.01" />
  </svg>
);

// =====================================================
// TICKET ICON
// =====================================================

const TicketIcon = () => (
  <svg
    width="42"
    height="42"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="1.7"
    className={iconGlow}
  >
    <path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V8z" />

    <path d="M13 6v2M13 10v2M13 14v2M13 18v1" />
  </svg>
);

// =====================================================
// LOCK ICON
// =====================================================

const LockIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="#f5ce54"
    className={iconGlow}
  >
    <path d="M17 9V7a5 5 0 00-10 0v2H5v12h14V9h-2zm-8 0V7a3 3 0 016 0v2H9z" />
  </svg>
);

// =====================================================
// SHIELD ICON
// =====================================================

const ShieldIcon = () => (
  <svg
    width="29"
    height="29"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="1.8"
    className={iconGlow}
  >
    <path d="M12 2l8 4v6c0 5-3.2 8.7-8 10-4.8-1.3-8-5-8-10V6l8-4z" />

    <path d="M8.5 12l2.2 2.2L16 9" />
  </svg>
);

// =====================================================
// ZAP ICON
// =====================================================

const ZapIcon = () => (
  <svg
    width="29"
    height="29"
    viewBox="0 0 24 24"
    fill="#f5ce54"
    className={iconGlow}
  >
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);

// =====================================================
// USERS ICON
// =====================================================

const UsersIcon = () => (
  <svg
    width="29"
    height="29"
    viewBox="0 0 24 24"
    fill="#f5ce54"
    className={iconGlow}
  >
    <circle
      cx="9"
      cy="8"
      r="3"
    />

    <circle
      cx="17"
      cy="9"
      r="2.5"
    />

    <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5v1H3v-1z" />

    <path
      d="M16 15c2.5 0 5 1.5 5 4v1h-4"
      opacity=".8"
    />
  </svg>
);

// =====================================================
// SUPPORT ICON
// =====================================================

const SupportIcon = () => (
  <svg
    width="29"
    height="29"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="1.8"
    className={iconGlow}
  >
    <path d="M4 13a8 8 0 0116 0" />

    <path d="M4 13v4a2 2 0 002 2h2v-6H4zM20 13v4a2 2 0 01-2 2h-2v-6h4z" />

    <path d="M8 19c1 2 3 3 5 3h2" />
  </svg>
);

export default BuyTicket;