import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Headphones,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  getActiveLotteryConfig,
  selectActiveLotteryConfig,
  selectLotteryActiveLoading,
  selectLotteryError,
  selectLotterySuccessMessage,
} from "../reducer/slice/createLotteryConfigSlice";

// =====================================================
// HELPERS
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

const formatHindiDate = (date, month, year) => {
  if (!date || !month || !year) return null;

  return `${date} ${HINDI_MONTHS[month - 1]} ${year}`;
};

const formatCrore = (amount) => {
  if (amount === undefined || amount === null) return "₹0";

  const num = Number(amount);

  if (!Number.isFinite(num) || num <= 0) {
    return "₹0";
  }

  const crore = num / 10000000;

  if (crore >= 1) {
    const formatted =
      crore % 1 === 0
        ? crore.toFixed(0)
        : crore.toFixed(2);

    return `₹${formatted} करोड़`;
  }

  const lakh = num / 100000;

  if (lakh >= 1) {
    const formatted =
      lakh % 1 === 0
        ? lakh.toFixed(0)
        : lakh.toFixed(2);

    return `₹${formatted} लाख`;
  }

  return `₹${num.toLocaleString("en-IN")}`;
};

const getDaysRemaining = (date, month, year) => {
  if (!date || !month || !year) return null;

  const target = new Date(
    year,
    month - 1,
    date
  );

  const now = new Date();

  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffMs =
    target.getTime() - now.getTime();

  return Math.round(
    diffMs / (1000 * 60 * 60 * 24)
  );
};

// =====================================================
// COUNTDOWN HELPERS
// =====================================================

const getDrawTimestamp = (activeConfig) => {
  if (!activeConfig) return null;

  const drawTime = String(
    activeConfig.drawTime || ""
  ).trim();

  if (!drawTime) return null;

  const [hours, minutes] = drawTime
    .split(":")
    .map(Number);

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

  /*
   * API:
   * drawDate = "2026-09-20T18:30:00.000Z"
   *
   * drawTime = "18:50"
   *
   * drawTime ko IST maana ja raha hai.
   *
   * India timezone = UTC + 05:30
   *
   * Example:
   * 18:50 IST
   * =
   * 13:20 UTC
   */

  const date =
    activeConfig.drawDate
      ? new Date(activeConfig.drawDate)
      : new Date(
          Number(activeConfig.year),
          Number(activeConfig.month) - 1,
          Number(activeConfig.date || 1)
        );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

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

  const difference =
    drawTimestamp - Date.now();

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

  const totalSeconds = Math.floor(
    difference / 1000
  );

  const days = Math.floor(
    totalSeconds / 86400
  );

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

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
// COMPONENT
// =====================================================

const HomeLotterySection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // =====================================================
  // REDUX STATE
  // =====================================================

  const activeConfig = useSelector(
    selectActiveLotteryConfig
  );

  const loading = useSelector(
    selectLotteryActiveLoading
  );

  const error = useSelector(
    selectLotteryError
  );

  const successMessage = useSelector(
    selectLotterySuccessMessage
  );

  // =====================================================
  // COUNTDOWN STATE
  // =====================================================

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
    available: false,
  });

  // =====================================================
  // FETCH ACTIVE CONFIG ON MOUNT
  // =====================================================

  useEffect(() => {
    dispatch(getActiveLotteryConfig());
  }, [dispatch]);

  // =====================================================
  // DERIVED VALUES
  // =====================================================

  const drawDateText = useMemo(() => {
    if (!activeConfig) {
      return "जल्द घोषित होगा";
    }

    return (
      formatHindiDate(
        activeConfig.date,
        activeConfig.month,
        activeConfig.year
      ) || "जल्द घोषित होगा"
    );
  }, [activeConfig]);

  const daysRemaining = useMemo(() => {
    if (!activeConfig) return null;

    return getDaysRemaining(
      activeConfig.date,
      activeConfig.month,
      activeConfig.year
    );
  }, [activeConfig]);

  const isActive = Boolean(
    activeConfig?.isActive
  );

  const firstPrize = formatCrore(
    activeConfig?.prizes?.first
  );

  const secondPrize = formatCrore(
    activeConfig?.prizes?.second
  );

  const thirdPrize = formatCrore(
    activeConfig?.prizes?.third
  );

  // =====================================================
  // LIVE COUNTDOWN
  // =====================================================

  useEffect(() => {
    if (!activeConfig) {
      return;
    }

    const drawTimestamp =
      getDrawTimestamp(activeConfig);

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
      setCountdown(
        getCountdown(drawTimestamp)
      );
    };

    // First calculation immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(
      updateCountdown,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [
    activeConfig?.drawDate,
    activeConfig?.drawTime,
  ]);

  // =====================================================
  // FORMAT COUNTDOWN
  // =====================================================

  const formattedHours = String(
    countdown.hours
  ).padStart(2, "0");

  const formattedMinutes = String(
    countdown.minutes
  ).padStart(2, "0");

  const formattedSeconds = String(
    countdown.seconds
  ).padStart(2, "0");

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleBuyTicket = () => {
    if (!isActive) {
      alert(
        "कोई सक्रिय लॉटरी उपलब्ध नहीं है"
      );

      return;
    }

    navigate("/buy-ticket");
  };

  return (
    <section className="w-full px-[10px] pt-2 pb-3 bg-[#050505]">

      {/* =====================================================
          NEXT DRAW CARD
      ===================================================== */}

      <div
        className=""
        style={{
          background:
            "linear-gradient(180deg, #151613 0%, #080908 100%)",
          boxShadow:
            "0 0 18px rgba(245,197,66,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="absolute inset-[5px] rounded-[15px] border border-[#252722] pointer-events-none" />

        <div className="relative h-full flex items-center">

          {/* =====================================================
              CALENDAR
          ===================================================== */}

          <div className="w-[76px] flex justify-center flex-shrink-0">

            <CalendarDays
              size={48}
              strokeWidth={2.5}
              className="text-[#f5c542] drop-shadow-[0_0_8px_rgba(245,197,66,0.9)] drop-shadow-[0_0_20px_rgba(245,197,66,0.65)]"
            />

          </div>

          {/* =====================================================
              DRAW DATE
          ===================================================== */}

          <div className="flex-1 min-w-0">

            <p className="text-[#d1d1d1] text-[13px] font-medium leading-none">

              {loading
                ? "लॉटरी जानकारी लोड हो रही है..."
                : error
                  ? "लॉटरी जानकारी उपलब्ध नहीं है"
                  : "अगला ड्रा (लक्की ड्रा)"}

            </p>

            <p className="text-[#f5c542] text-[25px] font-extrabold leading-none mt-[9px] tracking-tight">

              {drawDateText}

            </p>

          </div>

          {/* =====================================================
              COUNTDOWN
          ===================================================== */}

          <div
            className="w-[160px] h-[98px] mr-[4px] rounded-[14px] border border-[#a51d25] flex flex-col items-center justify-center mt-2"
            style={{
              background:
                "linear-gradient(180deg, #b82a30 0%, #711116 100%)",

              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.16), 0 0 12px rgba(170,20,25,0.3)",
            }}
          >

            {/* =================================================
                COUNTDOWN HEADER
            ================================================= */}

            <div className="flex items-center gap-2">

              <div className="relative">

                <div className="w-[20px] h-[20px] rounded-full border-2 border-white" />

                <div className="absolute left-[9px] top-[3px] w-[1.5px] h-[7px] bg-white" />

                <div className="absolute left-[9px] top-[9px] w-[6px] h-[1.5px] bg-white rotate-45 origin-left" />

              </div>

              <span className="text-white text-[15px] font-bold">

                {countdown.expired
                  ? "ड्रा शुरू हो गया"
                  : countdown.available
                    ? "ड्रा शुरू होने में"
                    : "जल्द शुरू होगा"}

              </span>

            </div>

            {/* =================================================
                LIVE COUNTDOWN
            ================================================= */}

            <div className="flex items-center justify-center mt-[7px]">

              {countdown.expired ? (

                <span className="text-white text-[17px] font-extrabold">
                  अभी
                </span>

              ) : countdown.available ? (

                <div className="flex items-center gap-[3px]">

                  {countdown.days > 0 && (
                    <>
                      <div className="flex flex-col items-center min-w-[27px]">

                        <span className="text-white text-[18px] font-extrabold leading-none">
                          {String(
                            countdown.days
                          ).padStart(2, "0")}
                        </span>

                        <span className="text-white/65 text-[7px] font-semibold mt-[2px]">
                          दिन
                        </span>

                      </div>

                      <span className="text-white text-[17px] font-bold">
                        :
                      </span>
                    </>
                  )}

                  <div className="flex flex-col items-center min-w-[27px]">

                    <span className="text-white text-[18px] font-extrabold leading-none">
                      {formattedHours}
                    </span>

                    <span className="text-white/65 text-[7px] font-semibold mt-[2px]">
                      घंटे
                    </span>

                  </div>

                  <span className="text-white text-[17px] font-bold">
                    :
                  </span>

                  <div className="flex flex-col items-center min-w-[27px]">

                    <span className="text-white text-[18px] font-extrabold leading-none">
                      {formattedMinutes}
                    </span>

                    <span className="text-white/65 text-[7px] font-semibold mt-[2px]">
                      मिनट
                    </span>

                  </div>

                  <span className="text-white text-[17px] font-bold">
                    :
                  </span>

                  <div className="flex flex-col items-center min-w-[27px]">

                    <span className="text-white text-[18px] font-extrabold leading-none">
                      {formattedSeconds}
                    </span>

                    <span className="text-white/65 text-[7px] font-semibold mt-[2px]">
                      सेकंड
                    </span>

                  </div>

                </div>

              ) : (

                <span className="text-white text-[17px] font-extrabold">
                  जल्द
                </span>

              )}

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          PRIZE CARDS
      ===================================================== */}

      <div className="grid grid-cols-3 gap-[7px] mt-[11px]">

        <PrizeCard
          type="first"
          title="प्रथम पुरस्कार"
          amount={firstPrize}
          subtitle="(6 अंक मिलने पर)"
          image="https://i.ibb.co/ZRPdFtMk/1trophy.png"
        />

        <PrizeCard
          type="second"
          title="द्वितीय पुरस्कार"
          amount={secondPrize}
          subtitle="(5 अंक मिलने पर)"
          image="https://i.ibb.co/Hf8YPcmc/2trophy.png"
        />

        <PrizeCard
          type="third"
          title="तृतीय पुरस्कार"
          amount={thirdPrize}
          subtitle="(4 अंक मिलने पर)"
          image="https://i.ibb.co/mV8nXr0h/3trophy.png"
        />

      </div>

      {/* =====================================================
          BUY TICKET
      ===================================================== */}

      <button
        type="button"
        onClick={handleBuyTicket}
        disabled={!isActive}
        className={`relative mt-[16px] w-full h-[70px] rounded-[13px] flex items-center justify-center gap-[12px] text-black overflow-hidden transition-all duration-200 ${
          isActive
            ? "active:scale-[0.99] cursor-pointer hover:brightness-105"
            : "opacity-60 cursor-not-allowed"
        }`}
        style={{
          background:
            "linear-gradient(180deg, #fff08a 0%, #f5c542 52%, #e4ae16 100%)",
          border: "1px solid #fff0a8",
          boxShadow:
            "0 0 18px rgba(245,197,66,0.45), 0 6px 22px rgba(245,197,66,0.32), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -3px 6px rgba(155,105,0,0.22)",
        }}
      >

        <div className="absolute top-0 left-[10%] right-[10%] h-[2px] bg-white/90 blur-[1px]" />

        <Ticket
          size={38}
          strokeWidth={2.7}
          className="text-[#090909] rotate-[-17deg] shrink-0 drop-shadow-[0_2px_2px_rgba(0,0,0,0.18)]"
        />

        <span className="text-[24px] font-extrabold tracking-tight">
          अभी टिकट खरीदें
        </span>

        <ArrowRight
          size={32}
          strokeWidth={3}
          className="shrink-0 drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)]"
        />

      </button>

      {/* =====================================================
          TRUST STRIP
      ===================================================== */}

      <div
        className="mt-[16px] h-[68px] w-full rounded-[17px] border border-[#292b29] flex items-center"
        style={{
          background:
            "linear-gradient(180deg, #0d0f0e 0%, #070808 100%)",
        }}
      >

        <TrustItem
          icon={
            <Users
              size={27}
              strokeWidth={2.3}
              className="text-[#f5c542] drop-shadow-[0_0_6px_rgba(245,197,66,0.8)] drop-shadow-[0_0_14px_rgba(245,197,66,0.45)]"
            />
          }
          text="लाखों विजेता"
        />

        <div className="h-[27px] w-px bg-[#343634]" />

        <TrustItem
          icon={
            <ShieldCheck
              size={27}
              strokeWidth={2.3}
              className="text-[#f5c542] drop-shadow-[0_0_6px_rgba(245,197,66,0.8)] drop-shadow-[0_0_14px_rgba(245,197,66,0.45)]"
            />
          }
          text="100% भुगतान"
        />

        <div className="h-[27px] w-px bg-[#343634]" />

        <TrustItem
          icon={
            <Headphones
              size={27}
              strokeWidth={2.3}
              className="text-[#f5c542] drop-shadow-[0_0_6px_rgba(245,197,66,0.8)] drop-shadow-[0_0_14px_rgba(245,197,66,0.45)]"
            />
          }
          text="24/7 सहायता"
        />

      </div>

      {/* =====================================================
          MOTIVATION
      ===================================================== */}

      <div
        className="relative mt-[15px] h-[96px] rounded-[19px] border border-[#a17a13] overflow-hidden"
        style={{
          background:
            "linear-gradient(110deg, #120f05 0%, #090909 62%, #0d0b06 100%)",

          boxShadow:
            "0 0 18px rgba(245,197,66,0.07), inset 0 1px 0 rgba(245,197,66,0.08)",
        }}
      >

        <div className="absolute left-[20px] right-[20px] top-0 h-px bg-[#f5c542]/30" />

        <div className="h-full flex items-center px-[18px]">

          <div className="w-[76px] flex-shrink-0 flex justify-center">

            <BarChart3
              size={56}
              strokeWidth={2.4}
              className="text-[#f5c542] drop-shadow-[0_0_7px_rgba(245,197,66,0.95)] drop-shadow-[0_0_18px_rgba(245,197,66,0.7)] drop-shadow-[0_0_30px_rgba(245,197,66,0.4)]"
            />

          </div>

          <div className="min-w-0">

            <h3 className="text-[#f5c542] text-[20px] font-extrabold leading-tight">
              आज ही अपनी किस्मत आज़माएं
            </h3>

            <p className="text-[#c5c5c5] text-[14px] mt-[4px] leading-tight">
              क्योंकि किस्मत मौका सबको नहीं देती
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          FEEDBACK
      ===================================================== */}

      {successMessage && (
        <p className="mt-2 text-center text-green-400 text-xs">
          {successMessage}
        </p>
      )}

      {error && (
        <p className="mt-2 text-center text-red-400 text-xs">
          {typeof error === "string"
            ? error
            : "Something went wrong"}
        </p>
      )}

    </section>
  );
};

// =====================================================
// PRIZE CARD
// =====================================================

const PrizeCard = ({
  type,
  title,
  amount,
  subtitle,
  image,
}) => {
  const amountColor = {
    first: "#fff0a3",
    second: "#ffffff",
    third: "#ffd09c",
  };

  const borderColor = {
    first: "#f5c542",
    second: "#8d8d8d",
    third: "#c0844a",
  };

  return (
    <div
      className="relative w-full h-[188px] rounded-[14px] overflow-hidden flex flex-col items-center"
      style={{
        backgroundImage: `url("${image}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        border: `1px solid ${borderColor[type]}`,
        boxShadow:
          type === "first"
            ? "0 0 14px rgba(245,197,66,0.35)"
            : "0 0 10px rgba(0,0,0,0.4)",
      }}
    >

      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center text-center">

        <p className="mt-[15px] text-white text-[13px] font-semibold leading-none">
          {title}
        </p>

        <p
          className="mt-[13px] text-[22px] font-extrabold leading-none whitespace-nowrap px-1"
          style={{
            color: amountColor[type],
            textShadow:
              type === "first"
                ? "0 0 8px rgba(245,197,66,0.5)"
                : "0 2px 4px rgba(0,0,0,0.7)",
          }}
        >
          {amount}
        </p>

        <p className="mt-[9px] text-white text-[11px] font-medium leading-none">
          {subtitle}
        </p>

      </div>

    </div>
  );
};

// =====================================================
// TRUST ITEM
// =====================================================

const TrustItem = ({
  icon,
  text,
}) => (
  <div className="flex-1 flex items-center justify-center gap-[7px] min-w-0">

    <span className="text-[#f5c542] flex-shrink-0">
      {icon}
    </span>

    <span className="text-[#d4d4d4] text-[12px] whitespace-nowrap">
      {text}
    </span>

  </div>
);

export default HomeLotterySection;