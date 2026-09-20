import {
  CheckCircle2,
  Copy,
  Crown,
  Ticket,
  Trophy,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  clearLotteryConfigError,
  getMyLotteryEntries,
} from "../reducer/slice/createLotteryConfigSlice";

// ==========================================================
// GLOW STYLE
// ==========================================================
const GLOW_STYLE = {
  filter:
    "drop-shadow(0 0 7px rgba(245,197,66,0.95)) drop-shadow(0 0 18px rgba(245,197,66,0.7)) drop-shadow(0 0 30px rgba(245,197,66,0.4))",
};

const MONTH_NAMES_HI = [
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

const ResultPage = () => {
  const dispatch = useDispatch();

  const {
    myEntries = [],
    myEntriesLoading = false,
    error = null,
    activeConfig = null,
  } = useSelector((state) => state.createLotteryConfig || {});

  useEffect(() => {
    dispatch(getMyLotteryEntries());

    return () => {
      dispatch(clearLotteryConfigError());
    };
  }, [dispatch]);

  // ==========================================================
  // MARKET NAME
  // ==========================================================
  const marketName = useMemo(() => {
    const configMarketName =
      activeConfig?.marketName ||
      myEntries?.[0]?.marketName ||
      myEntries?.[0]?.entry?.marketName ||
      "Market";

    return String(configMarketName)
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, [activeConfig, myEntries]);

  // ==========================================================
  // FORMATTERS
  // ==========================================================
  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("hi-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString("hi-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatAmount = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "₹0";

    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const normalizeStatus = (status) => {
    const value = String(status || "")
      .toLowerCase()
      .trim();

    if (value === "win" || value === "winner" || value === "won") {
      return "win";
    }

    if (value === "lost" || value === "loss") {
      return "lost";
    }

    return "pending";
  };

  const formatDrawDate = (item) => {
    const drawDate = item?.drawDate;

    if (drawDate) {
      const date = new Date(drawDate);

      if (!Number.isNaN(date.getTime())) {
        return {
          day: date.toLocaleDateString("hi-IN", {
            day: "2-digit",
          }),
          month: date.toLocaleDateString("hi-IN", {
            month: "long",
          }),
          year: date.toLocaleDateString("hi-IN", {
            year: "numeric",
          }),
        };
      }
    }

    const d = item?.date;
    const m = item?.month;
    const y = item?.year;

    if (d && m && y) {
      return {
        day: String(d),
        month: MONTH_NAMES_HI[Number(m) - 1] || "",
        year: String(y),
      };
    }

    return {
      day: "—",
      month: "",
      year: "",
    };
  };

  // ==========================================================
  // ONLY WIN + LOST
  // PENDING IS REMOVED FROM RESULT PAGE
  // ==========================================================
  const resultTickets = useMemo(() => {
    const entries = Array.isArray(myEntries) ? myEntries : [];

    return entries
      .map((item, index) => {
        const entry = item?.entry || item;

        const status = normalizeStatus(entry?.status);

        // Pending result page par nahi aayega
        if (status === "pending") {
          return null;
        }

        const number = String(entry?.number ?? "").padStart(6, "0");

        const id =
          item?.entryId ||
          entry?._id ||
          entry?.id ||
          `result-ticket-${index}`;

        const drawDate = formatDrawDate(item);

        const prizes = item?.prizes || entry?.prize || {};

        return {
          id,
          number: number.slice(0, 6).split(""),
          status,

          statusText:
            status === "win"
              ? "विजेता"
              : "हार गए",

          drawDate,

          drawTime: item?.drawTime || "—",

          price: formatAmount(entry?.amount),

          purchaseDate: formatDate(
            entry?.entryDate || entry?.createdAt
          ),

          purchaseTime: formatTime(
            entry?.createdAt || entry?.entryDate
          ),

          message:
            status === "win"
              ? "बधाई हो! आपका टिकट विजेता है"
              : "अगली बार किस्मत आजमाएं",

          prizes: {
            first: Number(prizes?.first) || 0,
            second: Number(prizes?.second) || 0,
            third: Number(prizes?.third) || 0,
          },

          prizeType: entry?.prizeType || null,

          prizeWon: {
            first: Number(entry?.prize?.first) || 0,
            second: Number(entry?.prize?.second) || 0,
            third: Number(entry?.prize?.third) || 0,
          },
        };
      })
      .filter(Boolean);
  }, [myEntries]);

  // ==========================================================
  // COUNTS
  // ==========================================================
  const totalResults = resultTickets.length;

  const totalWins = resultTickets.filter(
    (ticket) => ticket.status === "win"
  ).length;

  const totalLost = resultTickets.filter(
    (ticket) => ticket.status === "lost"
  ).length;

  // ==========================================================
  // COPY ID
  // ==========================================================
  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {}
  };

  return (
    <div className="w-full bg-[#030404] text-white min-h-screen">
      <main className="w-full max-w-[680px] mx-auto px-[12px] sm:px-[18px] pt-[22px] pb-[35px]">

        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="relative flex items-center justify-between gap-[10px]">
          <div className="flex items-center gap-[10px] min-w-0">
            <Trophy
              size={42}
              strokeWidth={1.8}
              className="text-[#f5c542] shrink-0"
              style={GLOW_STYLE}
            />

            <div className="min-w-0">
              <h1 className="text-[25px] sm:text-[30px] leading-none font-extrabold tracking-tight">
                मेरे रिजल्ट
              </h1>

              <p className="mt-[5px] text-[13px] leading-[1.15] text-[#d1d1d1]">
                आपके जीते और हारे हुए टिकट यहाँ दिखेंगे
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            RESULT SUMMARY
        ================================================== */}
        <div className="grid grid-cols-3 gap-[6px] mt-[22px]">
          <ResultStat
            label="कुल रिजल्ट"
            value={totalResults}
            icon={Trophy}
          />

          <ResultStat
            label="विजेता"
            value={totalWins}
            icon={CheckCircle2}
            success
          />

          <ResultStat
            label="हार गए"
            value={totalLost}
            icon={XCircle}
            lost
          />
        </div>

        {/* ==================================================
            LOADING
        ================================================== */}
        {myEntriesLoading ? (
          <div className="h-[160px] mt-[25px] rounded-[16px] border border-[#282b29] bg-[#090b0b] flex flex-col items-center justify-center">
            <Trophy
              size={40}
              className="text-[#f5c542] animate-pulse"
              style={GLOW_STYLE}
            />

            <p className="mt-3 text-[13px] text-white/60">
              आपके रिजल्ट लोड हो रहे हैं...
            </p>
          </div>
        ) : null}

        {/* ==================================================
            ERROR
        ================================================== */}
        {!myEntriesLoading && error && !resultTickets.length ? (
          <div className="h-[160px] mt-[25px] rounded-[16px] border border-red-500/30 bg-[#090b0b] flex flex-col items-center justify-center px-4 text-center">
            <p className="text-[13px] text-red-300">
              {error}
            </p>
          </div>
        ) : null}

        {/* ==================================================
            RESULT CARDS
        ================================================== */}
        {!myEntriesLoading && (
          <div className="mt-[25px] space-y-[22px]">
            {resultTickets.length ? (
              resultTickets.map((ticket) => (
                <LotteryResultTicket
                  key={ticket.id}
                  ticket={ticket}
                  copyId={copyId}
                  marketName={marketName}
                />
              ))
            ) : (
              <div className="h-[190px] rounded-[16px] border border-[#282b29] bg-[#090b0b] flex flex-col items-center justify-center text-center px-5">
                <Trophy
                  size={44}
                  className="text-[#f5c542]"
                  style={GLOW_STYLE}
                />

                <p className="mt-4 text-[14px] font-semibold text-white">
                  अभी कोई रिजल्ट उपलब्ध नहीं है
                </p>

                <p className="mt-2 text-[12px] leading-[1.4] text-white/50 max-w-[310px]">
                  आपका टिकट ड्रॉ होने के बाद ही यहाँ जीत या हार का रिजल्ट दिखाई देगा।
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// ==========================================================
// RESULT STAT
// ==========================================================
const ResultStat = ({
  label,
  value,
  icon: Icon,
  success = false,
  lost = false,
}) => {
  return (
    <div
      className={`h-[72px] rounded-[12px] border bg-[#101212] flex flex-col items-center justify-center ${
        success
          ? "border-[#3ba94c]/40"
          : lost
            ? "border-[#d33b3b]/40"
            : "border-[#353938]"
      }`}
    >
      <div className="flex items-center gap-[5px]">
        <Icon
          size={17}
          strokeWidth={2}
          className={
            success
              ? "text-[#45cf5a]"
              : lost
                ? "text-[#ef5555]"
                : "text-[#f5c542]"
          }
          style={success || lost ? undefined : GLOW_STYLE}
        />

        <span className="text-[18px] font-extrabold">
          {value}
        </span>
      </div>

      <span className="text-[10px] mt-[2px] text-white/55">
        {label}
      </span>
    </div>
  );
};

// ==========================================================
// RESULT TICKET
// ==========================================================
const LotteryResultTicket = ({
  ticket,
  copyId,
  marketName,
}) => {
  const won = ticket.status === "win";

  return (
    <div className="relative w-full h-[236px] rounded-[15px] overflow-hidden bg-[#f4dda0] shadow-[0_5px_22px_rgba(0,0,0,0.4)]">

      {/* OUTER BORDER */}
      <div className="absolute inset-[4px] rounded-[12px] border border-[#f1d276]/70 pointer-events-none z-[30]" />

      {/* ==================================================
          LEFT RED SECTION
      ================================================== */}
      <div className="absolute left-0 top-0 bottom-0 w-[24%] flex flex-col items-center text-center px-[6px] py-[17px] overflow-hidden bg-gradient-to-b from-[#d82b2d] via-[#b8171b] to-[#820b10] border-r border-[#e4b844]">

        <Crown
          size={43}
          strokeWidth={1.5}
          fill="#f7d24d"
          className="text-[#f7d24d]"
          style={{
            filter:
              "drop-shadow(0 0 8px rgba(247,210,77,0.9)) drop-shadow(0 0 16px rgba(247,210,77,0.55))",
          }}
        />

        <h2 className="mt-[6px] text-[17px] leading-none font-extrabold text-white">
          {marketName}
        </h2>

        <h2 className="mt-[3px] text-[17px] leading-none font-extrabold text-white">
          Ticket
        </h2>

        <div className="w-[65%] h-px bg-[#f5c542]/60 mt-[15px]" />

        <p className="mt-[16px] text-[11px] leading-[1.35] font-semibold text-white">
          {ticket.message}
        </p>

        <div className="mt-auto">
          <svg
            width="38"
            height="34"
            viewBox="0 0 52 45"
            fill="none"
            stroke="#f7d24d"
            strokeWidth="2"
          >
            <path d="M26 42C17 36 16 29 26 21C36 29 35 36 26 42Z" />
            <path d="M26 41C17 38 8 31 10 23C18 25 24 31 26 41Z" />
            <path d="M26 41C35 38 44 31 42 23C34 25 28 31 26 41Z" />
            <path d="M26 37C22 28 23 19 26 11C29 19 30 28 26 37Z" />
          </svg>
        </div>

        <p className="mt-[3px] text-[10px] font-semibold text-white">
          खेलो विश्वास
        </p>

        <p className="text-[10px] font-semibold text-white">
          के साथ
        </p>
      </div>

      {/* ==================================================
          CENTER
      ================================================== */}
      <div className="absolute left-[24%] right-[24%] top-0 bottom-0 px-[8px] py-[13px] text-[#19140c] bg-gradient-to-b from-[#fff1c4] via-[#f8e4ad] to-[#efd394]">

        <div className="flex items-center justify-center gap-[4px]">
          <span className="text-[#c49a3d] text-[10px]">
            ❧
          </span>

          <div className="px-[8px] py-[4px] rounded-full border border-[#d1ad55] bg-[#f9e9b9]">
            <p className="text-[11px] font-extrabold whitespace-nowrap">
              भारत की भरोसेमंद लॉटरी
            </p>
          </div>

          <span className="text-[#c49a3d] text-[10px]">
            ❧
          </span>
        </div>

        <p className="text-center text-[12px] font-semibold mt-[11px]">
          आपका चुना हुआ नंबर
        </p>

        <div className="grid grid-cols-6 gap-[3px] mt-[7px]">
          {ticket.number.map((digit, index) => (
            <div
              key={index}
              className={`h-[37px] rounded-[6px] border flex items-center justify-center ${
                won
                  ? "border-[#48aa58] bg-[#e7f6df]"
                  : "border-[#bd8b2d] bg-[#fff0c3]"
              }`}
            >
              <span className="text-[19px] font-extrabold">
                {digit}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-[4px] mt-[11px]">
          <MiniPrize
            title="प्रथम पुरस्कार"
            amount={formatPrize(ticket.prizes.first)}
            subtitle="(6 अंक मिलने पर)"
          />

          <MiniPrize
            title="द्वितीय पुरस्कार"
            amount={formatPrize(ticket.prizes.second)}
            subtitle="(5 अंक मिलने पर)"
          />

          <MiniPrize
            title="तृतीय पुरस्कार"
            amount={formatPrize(ticket.prizes.third)}
            subtitle="(4 अंक मिलने पर)"
          />
        </div>

        <div className="h-px bg-[#c9a85c] mt-[10px]" />

        <div className="flex items-center justify-center gap-[3px] mt-[6px]">
          <span className="text-[#c09232] text-[9px]">
            ✧
          </span>

          <p className="text-[9px] font-semibold text-center leading-[1.15]">
            छोटी सी राशि, बड़ी खुशियों की शुरुआत
          </p>

          <span className="text-[#c09232] text-[9px]">
            ✧
          </span>
        </div>
      </div>

      {/* ==================================================
          RIGHT SECTION
      ================================================== */}
      <div className="absolute right-0 top-0 bottom-0 w-[24%] px-[7px] py-[11px] text-[#21180d] bg-gradient-to-b from-[#fff1c7] via-[#f7e2a8] to-[#edd28f] border-l border-[#c39b43]">

        {/* STATUS */}
        <div
          className={`w-full h-[30px] rounded-[8px] flex items-center justify-center gap-[3px] text-white font-bold ${
            won
              ? "bg-gradient-to-b from-[#42c45b] to-[#209d3c]"
              : "bg-gradient-to-b from-[#ed4d4a] to-[#c82729]"
          }`}
        >
          {won ? (
            <CheckCircle2
              size={14}
              strokeWidth={2}
              style={{
                filter:
                  "drop-shadow(0 0 6px rgba(255,255,255,0.85))",
              }}
            />
          ) : (
            <XCircle
              size={14}
              strokeWidth={2}
              style={{
                filter:
                  "drop-shadow(0 0 6px rgba(255,255,255,0.85))",
              }}
            />
          )}

          <span className="text-[10px]">
            {ticket.statusText}
          </span>
        </div>

        <SideInfo
          label="ड्रॉ दिनांक"
          value={
            <>
              <span>{ticket.drawDate.day}</span>{" "}
              <span>{ticket.drawDate.month}</span>{" "}
              <span>{ticket.drawDate.year}</span>
            </>
          }
        />

        <SideInfo
          label="टिकट मूल्य"
          value={ticket.price}
          valueClass="text-[#9d2020] text-[15px] font-extrabold"
        />

        {/* WINNING PRIZE */}
        {won && ticket.prizeType ? (
          <div className="mt-[10px]">
            <p className="text-[9px] text-[#6a5533]">
              जीता हुआ पुरस्कार
            </p>

            <p className="text-[11px] font-extrabold text-[#16852e] mt-[3px]">
              {getPrizeLabel(ticket.prizeType)}
            </p>
          </div>
        ) : null}

        <div className="mt-[10px]">
          <p className="text-[9px] text-[#6a5533]">
            खरीद की तारीख
          </p>

          <p className="text-[10px] font-bold leading-[1.2] mt-[3px]">
            {ticket.purchaseDate}
          </p>

          <p className="text-[9px] mt-[2px]">
            {ticket.purchaseTime}
          </p>
        </div>

        <div className="mt-[10px]">
          <p className="text-[9px] text-[#6a5533]">
            टिकट आईडी
          </p>

          <div className="flex items-start gap-[3px] mt-[3px]">
            <span className="text-[9px] font-bold break-all leading-[1.1]">
              {ticket.id}
            </span>

            <button
              type="button"
              onClick={() => copyId(ticket.id)}
              className="shrink-0"
            >
              <Copy
                size={12}
                strokeWidth={1.8}
                style={{
                  filter:
                    "drop-shadow(0 0 5px rgba(245,197,66,0.85))",
                }}
              />
            </button>
          </div>
        </div>
      </div>

      <TicketNotches />
    </div>
  );
};

// ==========================================================
// PRIZE LABEL
// ==========================================================
const getPrizeLabel = (prizeType) => {
  const value = String(prizeType || "").toLowerCase();

  if (value.includes("1st") || value.includes("first")) {
    return "प्रथम पुरस्कार";
  }

  if (value.includes("2nd") || value.includes("second")) {
    return "द्वितीय पुरस्कार";
  }

  if (value.includes("3rd") || value.includes("third")) {
    return "तृतीय पुरस्कार";
  }

  return "पुरस्कार जीता";
};

// ==========================================================
// PRIZE FORMAT
// ==========================================================
const formatPrize = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "₹0";
  }

  if (amount >= 10000000) {
    return `₹${(amount / 10000000)
      .toFixed(2)
      .replace(/\.00$/, "")} करोड़`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000)
      .toFixed(2)
      .replace(/\.00$/, "")} लाख`;
  }

  return `₹${amount.toLocaleString("en-IN")}`;
};

// ==========================================================
// SIDE INFO
// ==========================================================
const SideInfo = ({
  label,
  value,
  valueClass = "",
}) => (
  <div className="mt-[10px]">
    <p className="text-[9px] text-[#6a5533]">
      {label}
    </p>

    <div
      className={`text-[11px] font-semibold leading-[1.2] mt-[3px] ${valueClass}`}
    >
      {value}
    </div>
  </div>
);

// ==========================================================
// MINI PRIZE
// ==========================================================
const MiniPrize = ({
  title,
  amount,
  subtitle,
}) => (
  <div className="min-w-0 rounded-[7px] border border-[#c79b3d] bg-[#f8e8b4] py-[5px] px-[1px] text-center">
    <p className="text-[7px] font-bold leading-[1.1]">
      {title}
    </p>

    <p className="mt-[4px] text-[12px] leading-none font-extrabold text-[#9e2922] whitespace-nowrap">
      {amount}
    </p>

    <p className="mt-[3px] text-[6px] leading-[1.1]">
      {subtitle}
    </p>
  </div>
);

// ==========================================================
// TICKET NOTCHES
// ==========================================================
const TicketNotches = () => {
  const positions = [
    "top-[8px]",
    "top-[29px]",
    "top-[50px]",
    "top-[71px]",
    "top-[92px]",
    "top-[113px]",
    "top-[134px]",
    "top-[155px]",
    "top-[176px]",
    "top-[197px]",
    "top-[218px]",
  ];

  return (
    <>
      {positions.map((position, index) => (
        <span
          key={`left-notch-${index}`}
          className={`absolute left-[-7px] ${position} w-[14px] h-[14px] rounded-full bg-[#030404] z-[50] pointer-events-none`}
        />
      ))}

      {positions.map((position, index) => (
        <span
          key={`right-notch-${index}`}
          className={`absolute right-[-7px] ${position} w-[14px] h-[14px] rounded-full bg-[#030404] z-[50] pointer-events-none`}
        />
      ))}
    </>
  );
};

export default ResultPage;