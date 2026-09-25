import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Headphones,
  ShieldCheck,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchProfile } from "../reducer/slice/authSlice";

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
  // USER / WALLET
  // =====================================================

  const user = useSelector(
    (state) => state.auth?.user
  );

  const isAuthenticated = useSelector(
    (state) => state.auth?.isAuthenticated
  );

  const walletAmount =
    user?.wallet ??
    user?.balance ??
    0;

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
  // FETCH LATEST PROFILE / WALLET
  // =====================================================

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // =====================================================
  // FETCH ACTIVE LOTTERY CONFIG ON MOUNT
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

    updateCountdown();

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

  const handleWithdraw = () => {
    navigate("/user/withdraw");
  };

  return (
    <section className="w-full px-[10px] pt-1 pb-3 bg-[#050505]">

      {/* =====================================================
          NEXT DRAW CARD
      ===================================================== */}

      <div
        className="
          relative
          mt-[4px]
          w-full
          min-h-[72px]
          rounded-[16px]
          border border-[#292b29]
          overflow-hidden
          flex items-center
          justify-between
          px-[14px]
        "
        style={{
          background:
            "linear-gradient(180deg, #0d0f0e 0%, #070808 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >

        {/* Gold top highlight */}
        <div className="absolute top-0 left-[18px] right-[18px] h-[1px] bg-[#f5c542]/25" />

        {/* WALLET LEFT */}
        <div className="flex items-center gap-[11px] min-w-0">

          <div
            className="
              w-[43px]
              h-[43px]
              rounded-[12px]
              border border-[#f5c542]/25
              bg-[#f5c542]/[0.07]
              flex
              items-center
              justify-center
              flex-shrink-0
            "
          >
            <Wallet
              size={23}
              strokeWidth={2.3}
              className="text-[#f5c542]"
            />
          </div>

          <div className="min-w-0">

            <p className="text-[#bdbdbd] text-[14px] font-medium leading-none">
              वॉलेट बैलेंस
            </p>

            <p className="text-[#f5c542] text-[20px] font-extrabold leading-none mt-[6px] whitespace-nowrap">
              ₹{Number(walletAmount || 0).toLocaleString("en-IN")}
            </p>

          </div>
        </div>

        {/* WITHDRAW RIGHT */}
        <button
          type="button"
          onClick={handleWithdraw}
          className="
            h-[42px]
            px-[14px]
            rounded-[11px]
            border border-[#f5c542]/40
            bg-[#f5c542]
            text-[#090909]
            flex
            items-center
            justify-center
            gap-[7px]
            text-[13px]
            font-extrabold
            flex-shrink-0
            active:scale-[0.97]
            transition-all
            duration-150
          "
        >
          <span>
            Withdraw
          </span>

          <ArrowRight
            size={18}
            strokeWidth={2.8}
          />
        </button>

      </div>

      <div
        className="
          relative
          w-full
          h-[114px]
          rounded-[18px]
          border border-[#292b29]
          overflow-hidden
          bg-[#0b0c0a]
          mt-[7px]
        "
        style={{
          background:
            "linear-gradient(135deg, #171914 0%, #0c0d0b 48%, #090a09 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.25)",
        }}
      >

        {/* Top highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/[0.05]" />

        {/* Gold accent */}
        <div className="absolute left-0 top-[15px] bottom-[15px] w-[3px] rounded-r-full bg-[#f5c542]" />

        <div className="relative h-full flex items-center px-[8px]">

          {/* CALENDAR + DATE */}

          <div className="flex items-center flex-1 min-w-0">

            <div className="w-[70px] flex justify-center flex-shrink-0">

              <div
                className="
                  w-[52px]
                  h-[52px]
                  rounded-[15px]
                  border border-[#f5c542]/20
                  bg-[#f5c542]/[0.06]
                  flex items-center
                  justify-center
                "
              >
                <CalendarDays
                  size={36}
                  strokeWidth={2.2}
                  className="text-[#f5c542]"
                />
              </div>

            </div>

            {/* Draw Date */}

            <div className="flex-1 min-w-0">

              <p
                className="
                  text-[#d1d1d1]
                  text-[11px]
                  font-medium
                  leading-none
                  whitespace-nowrap
                "
              >
                {loading
                  ? "लॉटरी जानकारी लोड हो रही है..."
                  : error
                    ? "लॉटरी जानकारी उपलब्ध नहीं है"
                    : "अगला ड्रा (लक्की ड्रा)"}
              </p>

              <p
                className="
                  text-[#f5c542]
                  text-[clamp(10px,3.7vw,22px)]
                  font-extrabold
                  leading-none
                  mt-[9px]
                  tracking-tight
                  whitespace-nowrap
                "
              >
                {drawDateText}
              </p>

            </div>
          </div>

          {/* DIVIDER */}

          <div className="h-[66px] w-[1px] bg-[#292b29] mx-[7px] flex-shrink-0" />

          {/* COUNTDOWN */}

          <div
            className="
              relative
              w-[160px]
              h-[94px]
              flex-shrink-0
              rounded-[14px]
              border border-[#8f2026]
              overflow-hidden
              flex flex-col
              items-center
              justify-center
            "
            style={{
              background:
                "linear-gradient(180deg, #b82a30 0%, #711116 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >

            {/* Small glow */}
            <div className="absolute -right-[20px] -top-[25px] w-[70px] h-[70px] rounded-full bg-white/[0.05] blur-[15px]" />

            {/* COUNTDOWN HEADER */}

            <div className="relative flex items-center gap-2 whitespace-nowrap">

              <div className="relative flex-shrink-0">

                <div className="w-[20px] h-[20px] rounded-full border-2 border-white" />

                <div className="absolute left-[9px] top-[3px] w-[1.5px] h-[7px] bg-white" />

                <div className="absolute left-[9px] top-[9px] w-[6px] h-[1.5px] bg-white rotate-45 origin-left" />

              </div>

              <span className="text-white text-[12px] font-bold whitespace-nowrap">
                {countdown.expired
                  ? "ड्रा शुरू हो गया"
                  : countdown.available
                    ? "ड्रा शुरू होने में"
                    : "जल्द शुरू होगा"}
              </span>

            </div>

            {/* LIVE COUNTDOWN */}

            <div className="relative flex items-center justify-center mt-[7px]">

              {countdown.expired ? (

                <span className="text-white text-[17px] font-extrabold whitespace-nowrap">
                  अभी
                </span>

              ) : countdown.available ? (

                <div className="flex items-center gap-[3px] whitespace-nowrap">

                  {/* DAYS */}

                  {countdown.days > 0 && (
                    <>
                      <div className="flex flex-col items-center min-w-[27px]">

                        <div className="flex items-center justify-center min-w-[27px] h-[25px] rounded-[5px] bg-black/15 border border-white/[0.08]">

                          <span className="text-white text-[18px] font-extrabold leading-none">
                            {String(countdown.days).padStart(2, "0")}
                          </span>

                        </div>

                        <span className="text-white/65 text-[7px] font-semibold mt-[2px]">
                          दिन
                        </span>

                      </div>

                      <span className="text-white text-[17px] font-bold mb-[8px]">
                        :
                      </span>
                    </>
                  )}

                  {/* HOURS */}

                  <div className="flex flex-col items-center min-w-[27px]">

                    <div className="flex items-center justify-center min-w-[27px] h-[25px] rounded-[5px] bg-black/15 border border-white/[0.08]">

                      <span className="text-white text-[18px] font-extrabold leading-none">
                        {formattedHours}
                      </span>

                    </div>

                    <span className="text-white/65 text-[7px] font-semibold mt-[2px]">
                      घंटे
                    </span>

                  </div>

                  <span className="text-white text-[17px] font-bold mb-[8px]">
                    :
                  </span>

                  {/* MINUTES */}

                  <div className="flex flex-col items-center min-w-[27px]">

                    <div className="flex items-center justify-center min-w-[27px] h-[25px] rounded-[5px] bg-black/15 border border-white/[0.08]">

                      <span className="text-white text-[18px] font-extrabold leading-none">
                        {formattedMinutes}
                      </span>

                    </div>

                    <span className="text-white/65 text-[7px] font-semibold mt-[2px]">
                      मिनट
                    </span>

                  </div>

                  <span className="text-white text-[17px] font-bold mb-[8px]">
                    :
                  </span>

                  {/* SECONDS */}

                  <div className="flex flex-col items-center min-w-[27px]">

                    <div className="flex items-center justify-center min-w-[27px] h-[25px] rounded-[5px] bg-black/15 border border-white/[0.08]">

                      <span className="text-white text-[18px] font-extrabold leading-none">
                        {formattedSeconds}
                      </span>

                    </div>

                    <span className="text-white/65 text-[7px] font-semibold mt-[2px]">
                      सेकंड
                    </span>

                  </div>

                </div>

              ) : (

                <span className="text-white text-[17px] font-extrabold whitespace-nowrap">
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
          image="https://i.ibb.co/CpRrr0KV/1trophy.png"
        />

        <PrizeCard
          type="second"
          title="द्वितीय पुरस्कार"
          amount={secondPrize}
          subtitle="(5 अंक मिलने पर)"
          image="https://i.ibb.co/nqK8qLS9/2trophy.png"
        />

        <PrizeCard
          type="third"
          title="तृतीय पुरस्कार"
          amount={thirdPrize}
          subtitle="(4 अंक मिलने पर)"
          image="https://i.ibb.co/WTT15RW/3trophy.png"
        />

      </div>

      {/* =====================================================
          BUY TICKET
      ===================================================== */}

      <button
        type="button"
        onClick={handleBuyTicket}
        disabled={!isActive}
        className={`relative mt-[16px] w-full h-[70px] rounded-[13px] flex items-center justify-center gap-[12px] text-black overflow-hidden transition-all duration-200 ${isActive
            ? "active:scale-[0.99] cursor-pointer hover:brightness-105"
            : "opacity-60 cursor-not-allowed"
          }`}
        style={{
          background:
            "linear-gradient(180deg, #fff08a 0%, #f5c542 52%, #e4ae16 100%)",
          border: "1px solid #fff0a8",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -3px 6px rgba(155,105,0,0.18)",
        }}
      >

        <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-white/60" />

        <Ticket
          size={38}
          strokeWidth={2.7}
          className="text-[#090909] rotate-[-17deg] shrink-0"
        />

        <span className="text-[24px] font-extrabold tracking-tight">
          अभी टिकट खरीदें
        </span>

        <ArrowRight
          size={32}
          strokeWidth={3}
          className="shrink-0"
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
              className="text-[#f5c542]"
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
              className="text-[#f5c542]"
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
              className="text-[#f5c542]"
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
            "inset 0 1px 0 rgba(245,197,66,0.08)",
        }}
      >

        <div className="absolute left-[20px] right-[20px] top-0 h-px bg-[#f5c542]/30" />

        <div className="h-full flex items-center px-[18px]">

          <div className="w-[76px] flex-shrink-0 flex justify-center">

            <BarChart3
              size={56}
              strokeWidth={2.4}
              className="text-[#f5c542]"
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
      className="relative w-full h-[150px] max-h-[150px] rounded-[12px] overflow-hidden flex flex-col items-center border-l border-t border-r border-b"
      style={{
        backgroundImage: `url("${image}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        borderTopColor: borderColor[type],
        borderLeftColor: borderColor[type],
        borderRightColor: borderColor[type],
        boxShadow: "none",
      }}
    >

      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center text-center">

        <p className="mt-[13px] text-white text-[13px] font-semibold leading-none">
          {title}
        </p>

        <p
          className="mt-[11px] text-[21px] font-extrabold leading-none whitespace-nowrap px-1"
          style={{
            color: amountColor[type],
            textShadow:
              type === "first"
                ? "0 0 5px rgba(245,197,66,0.25)"
                : "0 2px 4px rgba(0,0,0,0.7)",
          }}
        >
          {amount}
        </p>

        <p className="mt-[8px] text-white text-[11px] font-medium leading-none">
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