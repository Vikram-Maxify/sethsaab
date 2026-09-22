
import { Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import firstPrize from "../assets/1trophy.png";
import secondPrize from "../assets/2trophy.png";
import kuberBanner from "../assets/4ban.jpeg";
import thirdPrize from "../assets/3trophy.png";

import {
  clearLotteryConfigError,
  clearLotteryConfigSuccess,
  getActiveLotteryConfig,
  addUserLotteryEntry,
} from "../reducer/slice/createLotteryConfigSlice";

import { getAmount } from "../reducer/slice/amountReducer";

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
// CREATE EMPTY TICKET
// =====================================================

const createEmptyTicket = () => ({
  id: `${Date.now()}-${Math.random()}`,
  numbers: ["", "", "", "", "", ""],
});

// =====================================================
// GET DRAW TIMESTAMP
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
  return Date.UTC(
    year,
    month,
    day,
    hours - 5,
    minutes - 30,
    0,
    0
  );
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

  const difference = drawTimestamp - Date.now();

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

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
    available: true,
  };
};

// =====================================================
// BUY TICKET
// =====================================================

const BuyTicket = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ===================================================
  // AUTH
  // ===================================================

  const { user } = useSelector(
    (state) => state.auth || {}
  );

  // ===================================================
  // LOTTERY REDUX STATE
  // ===================================================

  const {
    config,
    activeConfig,
    activeLoading,
    purchaseLoading,
    error,
  } = useSelector(
    (state) =>
      state.createLotteryConfig || {
        config: null,
        activeConfig: null,
        activeLoading: false,
        purchaseLoading: false,
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
  // WALLET BALANCE
  // ===================================================

  const walletBalance = Number(
    user?.balance ??
      user?.walletBalance ??
      user?.wallet ??
      user?.walletAmount ??
      0
  );

  // ===================================================
  // TICKET PRICE
  // ===================================================

  const TICKET_PRICE =
    Number(ticketPriceFromApi) || 0;

  // ===================================================
  // LOTTERY CONFIG
  // ===================================================

  const lotteryConfig =
    config || activeConfig;

  // ===================================================
  // MULTIPLE TICKETS
  // ===================================================

  const [tickets, setTickets] = useState([
    createEmptyTicket(),
  ]);

  // ===================================================
  // LOCAL MESSAGES
  // ===================================================

  const [localError, setLocalError] =
    useState("");

  const [localSuccess, setLocalSuccess] =
    useState("");

  // ===================================================
  // COUNTDOWN
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
  // LIVE COUNTDOWN
  // ===================================================

  useEffect(() => {
    if (
      !lotteryConfig?.drawDate ||
      !lotteryConfig?.drawTime
    ) {
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

    const drawTimestamp =
      getDrawTimestamp(lotteryConfig);

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

    return () =>
      clearInterval(interval);
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

    if (lotteryConfig.drawDate) {
      const date = new Date(
        lotteryConfig.drawDate
      );

      if (!Number.isNaN(date.getTime())) {
        const day =
          date.getUTCDate();

        const month =
          date.getUTCMonth();

        const year =
          date.getUTCFullYear();

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

    return new Intl.DateTimeFormat(
      "hi-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(date);
  }, [lotteryConfig]);

  // ===================================================
  // TOTAL PRICE
  // ===================================================

  const totalTicketPrice =
    TICKET_PRICE * tickets.length;

  // ===================================================
  // TOTAL TICKETS
  // ===================================================

  const totalTickets = tickets.length;

  // ===================================================
  // CLEAR MESSAGES
  // ===================================================

  const clearMessages = () => {
    setLocalError("");
    setLocalSuccess("");

    dispatch(
      clearLotteryConfigError()
    );

    dispatch(
      clearLotteryConfigSuccess()
    );
  };

  // ===================================================
  // NUMBER CHANGE
  // ===================================================

  const handleNumberChange = (
    ticketId,
    index,
    value
  ) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    setTickets((previousTickets) =>
      previousTickets.map((ticket) => {
        if (ticket.id !== ticketId) {
          return ticket;
        }

        const nextNumbers = [
          ...ticket.numbers,
        ];

        nextNumbers[index] = value;

        return {
          ...ticket,
          numbers: nextNumbers,
        };
      })
    );

    setLocalError("");
    setLocalSuccess("");

    if (value && index < 5) {
      setTimeout(() => {
        const nextInput =
          document.querySelector(
            `[data-lottery-id="${ticketId}"][data-lottery-index="${index + 1}"]`
          );

        nextInput?.focus();
      }, 0);
    }
  };

  // ===================================================
  // BACKSPACE
  // ===================================================

  const handleNumberKeyDown = (
    ticketId,
    index,
    event
  ) => {
    if (
      event.key === "Backspace" &&
      !tickets.find(
        (ticket) =>
          ticket.id === ticketId
      )?.numbers[index] &&
      index > 0
    ) {
      const previousInput =
        document.querySelector(
          `[data-lottery-id="${ticketId}"][data-lottery-index="${index - 1}"]`
        );

      previousInput?.focus();
    }
  };

  // ===================================================
  // RANDOM NUMBER FOR ONE TICKET
  // ===================================================

  const generateRandom = (
    ticketId
  ) => {
    if (purchaseLoading) {
      return;
    }

    const result = [];

    while (result.length < 6) {
      result.push(
        String(
          Math.floor(
            Math.random() * 10
          )
        )
      );
    }

    setTickets((previousTickets) =>
      previousTickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              numbers: result,
            }
          : ticket
      )
    );

    clearMessages();
  };

  // ===================================================
  // CLEAR ONE TICKET
  // ===================================================

  const clearTicketNumbers = (
    ticketId
  ) => {
    if (purchaseLoading) {
      return;
    }

    setTickets((previousTickets) =>
      previousTickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              numbers: [
                "",
                "",
                "",
                "",
                "",
                "",
              ],
            }
          : ticket
      )
    );

    clearMessages();
  };

  // ===================================================
  // ADD NEW TICKET
  // ===================================================

  const handleAddTicket = () => {
    if (purchaseLoading) {
      return;
    }

    const newTicket =
      createEmptyTicket();

    setTickets((previousTickets) => [
      ...previousTickets,
      newTicket,
    ]);

    setLocalError("");
    setLocalSuccess("");

    setTimeout(() => {
      document
        .querySelector(
          `[data-lottery-id="${newTicket.id}"][data-lottery-index="0"]`
        )
        ?.focus();
    }, 100);
  };

  // ===================================================
  // REMOVE TICKET
  // ===================================================

  const handleRemoveTicket = (
    ticketId
  ) => {
    if (purchaseLoading) {
      return;
    }

    if (tickets.length === 1) {
      setLocalError(
        "कम से कम एक टिकट रखना जरूरी है"
      );
      return;
    }

    setTickets((previousTickets) =>
      previousTickets.filter(
        (ticket) =>
          ticket.id !== ticketId
      )
    );

    clearMessages();
  };

  // ===================================================
  // HANDLE PURCHASE
  // ===================================================

  const handlePurchase = async () => {
    if (purchaseLoading) {
      return;
    }

    try {
      setLocalError("");
      setLocalSuccess("");

      dispatch(
        clearLotteryConfigError()
      );

      dispatch(
        clearLotteryConfigSuccess()
      );

      // =================================================
      // 1. LOGIN CHECK
      // =================================================

      if (!user) {
        setLocalError(
          "कृपया पहले लॉगिन करें"
        );
        return;
      }

      // =================================================
      // 2. LOTTERY CONFIG CHECK
      // =================================================

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

      // =================================================
      // 3. TICKET PRICE CHECK
      // =================================================

      const ticketAmount =
        Number(ticketPriceFromApi);

      if (
        !Number.isFinite(
          ticketAmount
        ) ||
        ticketAmount <= 0
      ) {
        setLocalError(
          "टिकट की कीमत उपलब्ध नहीं है"
        );
        return;
      }

      // =================================================
      // 4. CHECK ALL TICKETS
      // =================================================

      const invalidTicket =
        tickets.findIndex(
          (ticket) =>
            ticket.numbers.some(
              (number) =>
                number === ""
            )
        );

      if (invalidTicket !== -1) {
        setLocalError(
          `टिकट ${invalidTicket + 1} के सभी 6 नंबर दर्ज करें`
        );
        return;
      }

      // =================================================
      // 5. CONVERT NUMBERS
      // =================================================

      const lotteryNumbers =
        tickets.map((ticket) =>
          ticket.numbers.join("")
        );

      // =================================================
      // 6. VALIDATE NUMBERS
      // =================================================

      const invalidNumberIndex =
        lotteryNumbers.findIndex(
          (number) =>
            !/^\d{6}$/.test(
              number
            )
        );

      if (
        invalidNumberIndex !== -1
      ) {
        setLocalError(
          `टिकट ${invalidNumberIndex + 1} का नंबर ठीक 6 अंकों का होना चाहिए`
        );
        return;
      }

      // =================================================
      // 7. DUPLICATE NUMBER CHECK
      // =================================================

      const duplicateNumbers =
        lotteryNumbers.filter(
          (number, index) =>
            lotteryNumbers.indexOf(
              number
            ) !== index
        );

      if (
        duplicateNumbers.length > 0
      ) {
        setLocalError(
          "दो टिकटों में एक ही नंबर नहीं हो सकता। अलग-अलग नंबर चुनें।"
        );
        return;
      }

      // =================================================
      // 8. TOTAL AMOUNT
      // =================================================

      const totalAmount =
        ticketAmount *
        tickets.length;

      // =================================================
      // 9. WALLET BALANCE
      // =================================================

      const currentWalletBalance =
        Number(
          user?.balance ??
            user?.walletBalance ??
            user?.wallet ??
            user?.walletAmount ??
            0
        );

      console.log(
        "========== MULTIPLE LOTTERY PURCHASE =========="
      );

      console.log(
        "Wallet Balance:",
        currentWalletBalance
      );

      console.log(
        "Single Ticket Price:",
        ticketAmount
      );

      console.log(
        "Total Tickets:",
        tickets.length
      );

      console.log(
        "Total Amount:",
        totalAmount
      );

      console.log(
        "Lottery Numbers:",
        lotteryNumbers
      );

      console.log(
        "Lottery Config ID:",
        lotteryConfig._id
      );

      console.log(
        "=============================================="
      );

      // =================================================
      // 10. INSUFFICIENT BALANCE
      // =================================================

      if (
        currentWalletBalance <
        totalAmount
      ) {
        const rechargeAmount =
          Math.max(
            0,
            totalAmount -
              currentWalletBalance
          );

        setLocalSuccess("");

        setLocalError(
          `Wallet balance कम है। ₹${rechargeAmount.toFixed(
            2
          )} recharge करें।`
        );

        setTimeout(() => {
          navigate(
            `/recharge?amount=${encodeURIComponent(
              rechargeAmount.toFixed(2)
            )}`
          );
        }, 700);

        return;
      }

      // =================================================
      // 11. PURCHASE START
      // =================================================

      setLocalError("");

      setLocalSuccess(
        `${tickets.length} टिकट खरीदे जा रहे हैं...`
      );

      // =================================================
      // 12. PURCHASE EACH TICKET
      // =================================================

      for (
        let index = 0;
        index < lotteryNumbers.length;
        index++
      ) {
        await dispatch(
          addUserLotteryEntry({
            configId:
              lotteryConfig._id,

            number:
              lotteryNumbers[index],

            amount:
              ticketAmount,
          })
        ).unwrap();
      }

      // =================================================
      // 13. SUCCESS
      // =================================================

      setLocalError("");

      setLocalSuccess(
        `${tickets.length} टिकट सफलतापूर्वक खरीद लिए गए हैं`
      );

      // =================================================
      // 14. RESET TO ONE EMPTY TICKET
      // =================================================

      setTickets([
        createEmptyTicket(),
      ]);

    } catch (purchaseError) {
      console.error(
        "MULTIPLE LOTTERY PURCHASE ERROR:",
        purchaseError
      );

      setLocalSuccess("");

      setLocalError(
        typeof purchaseError ===
          "string"
          ? purchaseError
          : purchaseError?.message ||
              purchaseError?.payload
                ?.message ||
              "टिकट खरीदने में समस्या हुई"
      );
    }
  };

  // ===================================================
  // DISPLAY ERROR
  // ===================================================

  const displayError =
    localError || error;

  // ===================================================
  // DISABLE PURCHASE
  // ===================================================

  const isPurchaseDisabled =
    activeLoading ||
    amountLoading ||
    purchaseLoading ||
    !lotteryConfig?._id ||
    !lotteryConfig?.isActive ||
    !ticketPriceFromApi ||
    Number(ticketPriceFromApi) <=
      0 ||
    tickets.some((ticket) =>
      ticket.numbers.some(
        (number) => number === ""
      )
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

          <div
            className="
              absolute inset-0
              pointer-events-none
              bg-[radial-gradient(circle_at_18%_50%,rgba(245,206,84,0.10),transparent_35%),radial-gradient(circle_at_82%_50%,rgba(245,206,84,0.08),transparent_35%)]
            "
          />

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

            {/* NEXT DRAW */}

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

              <div className="shrink-0 flex items-center justify-center">
                <CalendarIcon />
              </div>

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
                    min-[450px]:text-[18px]
                  "
                >
                  {activeLoading
                    ? "लोड हो रहा है..."
                    : drawDateText}
                </p>

              </div>

            </div>

            {/* COUNTDOWN */}

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
                  <ClockIcon />
                </div>

                <span
                  className="
                    text-[13px]
                    leading-[1.2]
                    font-medium
                    text-white/95
                    whitespace-nowrap
                    min-[400px]:text-[17px]
                    min-[450px]:text-[20px]
                  "
                >
                  {countdown.expired
                    ? "लकी ड्रॉ"
                    : "ड्रा शुरू होने में"}
                </span>

              </div>

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
                      min-[450px]:gap-0
                    "
                  >

                    <CountdownItem
                      value={countdown.days}
                      label="दिन"
                    />

                    <Colon />

                    <CountdownItem
                      value={countdown.hours}
                      label="घंटे"
                    />

                    <Colon />

                    <CountdownItem
                      value={countdown.minutes}
                      label="मिनट"
                    />

                    <Colon />

                    <CountdownItem
                      value={countdown.seconds}
                      label="सेकंड"
                    />

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
            MULTIPLE TICKET HEADER
        ================================================= */}

        <section className="mt-4">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <div
                className="
                  w-[34px]
                  h-[34px]
                  rounded-[10px]
                  border
                  border-[#f5ce54]/30
                  bg-[#11130f]
                  flex
                  items-center
                  justify-center
                "
              >

                <Ticket
                  size={19}
                  strokeWidth={2}
                  className="text-[#f5ce54]"
                />

              </div>

              <div>

                <h2 className="text-[18px] font-extrabold leading-none">
                  अपने टिकट चुनें
                </h2>

                <p className="text-[10px] text-white/45 mt-[4px]">
                  एक या एक से अधिक टिकट खरीदें
                </p>

              </div>

            </div>

            <div
              className="
                px-[10px]
                py-[6px]
                rounded-full
                border border-[#f5ce54]/25
                bg-[#11120e]
              "
            >

              <span className="text-[10px] text-[#f5ce54] font-bold">
                {totalTickets}{" "}
                {totalTickets === 1
                  ? "टिकट"
                  : "टिकट"}
              </span>

            </div>

          </div>

        </section>

        {/* =================================================
            TICKET CARDS
        ================================================= */}

        <section className="mt-3 space-y-3">

          {tickets.map(
            (ticket, ticketIndex) => (
              <TicketNumberCard
                key={ticket.id}
                ticket={ticket}
                ticketIndex={
                  ticketIndex
                }
                totalTickets={
                  tickets.length
                }
                purchaseLoading={
                  purchaseLoading
                }
                onNumberChange={
                  handleNumberChange
                }
                onKeyDown={
                  handleNumberKeyDown
                }
                onRandom={
                  generateRandom
                }
                onClear={
                  clearTicketNumbers
                }
                onRemove={
                  handleRemoveTicket
                }
              />
            )
          )}

        </section>

        {/* =================================================
            ADD MORE TICKET
        ================================================= */}

        <button
          type="button"
          onClick={handleAddTicket}
          disabled={
            purchaseLoading ||
            !lotteryConfig?.isActive
          }
          className="
            mt-3
            w-full
            h-[50px]
            rounded-[13px]
            border
            border-dashed
            border-[#f5ce54]/50
            bg-[#0c0e0d]
            text-[#f5ce54]
            flex
            items-center
            justify-center
            gap-2
            transition-all
            duration-200
            hover:bg-[#12140f]
            hover:border-[#f5ce54]
            active:scale-[0.98]
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >

          <span
            className="
              w-[25px]
              h-[25px]
              rounded-full
              border
              border-[#f5ce54]
              flex
              items-center
              justify-center
              text-[19px]
              leading-none
              font-medium
            "
          >
            +
          </span>

          <span className="text-[14px] font-bold">
            और टिकट जोड़ें
          </span>

        </button>

        {/* =================================================
            TOTAL SUMMARY
        ================================================= */}

        <section
          className="
            mt-3
            rounded-[17px]
            border
            border-[#3b3624]
            bg-[#0b0d0c]
            overflow-hidden
          "
        >

          <div
            className="
              px-4
              py-3
              border-b
              border-[#282a28]
              flex
              items-center
              justify-between
            "
          >

            <div>

              <p className="text-[11px] text-white/45">
                कुल टिकट
              </p>

              <p className="text-[17px] font-bold mt-[2px]">
                {totalTickets} टिकट
              </p>

            </div>

            <div className="text-right">

              <p className="text-[11px] text-white/45">
                प्रति टिकट
              </p>

              <p className="text-[14px] font-bold text-white mt-[2px]">
                {amountLoading
                  ? "..."
                  : `₹${TICKET_PRICE}`}
              </p>

            </div>

          </div>

          <div className="px-4 py-3 flex items-center justify-between">

            <div>

              <p className="text-[12px] text-white/55">
                कुल भुगतान
              </p>

              <p
                className="
                  text-[29px]
                  leading-none
                  font-extrabold
                  text-[#f5ce54]
                  mt-1
                  drop-shadow-[0_0_7px_rgba(245,197,66,0.28)]
                "
              >
                {amountLoading
                  ? "..."
                  : `₹${totalTicketPrice}`}
              </p>

            </div>

            <div
              className="
                w-[48px]
                h-[48px]
                rounded-full
                border
                border-[#f5ce54]/25
                bg-[#15140e]
                flex
                items-center
                justify-center
              "
            >

              <Ticket
                size={24}
                strokeWidth={2}
                className="text-[#f5ce54]"
              />

            </div>

          </div>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {displayError && (
          <div
            className="
              mt-3
              rounded-[10px]
              border
              border-red-500/30
              bg-red-500/10
              px-3
              py-2
              text-center
              text-[12px]
              text-red-300
            "
          >
            {typeof displayError ===
            "string"
              ? displayError
              : displayError?.message ||
                "टिकट खरीदने में समस्या हुई"}
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {localSuccess &&
          !displayError && (
            <div
              className="
                mt-3
                rounded-[10px]
                border
                border-emerald-500/30
                bg-emerald-500/10
                px-3
                py-2
                text-center
                text-[12px]
                text-emerald-300
              "
            >
              {localSuccess}
            </div>
          )}

        {/* =================================================
            BUY ALL TICKETS
        ================================================= */}

        <button
          type="button"
          onClick={handlePurchase}
          disabled={isPurchaseDisabled}
          className="
            relative
            w-full
            h-[64px]
            mt-4
            rounded-[14px]
            overflow-hidden
            bg-gradient-to-b
            from-[#fff59a]
            via-[#ffd84a]
            to-[#f4c21f]
            text-black
            text-[20px]
            font-extrabold
            flex
            items-center
            justify-center
            gap-3
            border
            border-[#fff8c7]
            shadow-[0_0_12px_rgba(255,221,55,0.95),0_0_28px_rgba(255,210,35,0.75),0_0_55px_rgba(255,200,20,0.5),0_8px_30px_rgba(255,205,30,0.35),inset_0_2px_0_rgba(255,255,255,0.98),inset_0_-4px_8px_rgba(180,120,0,0.18)]
            active:scale-[0.98]
            transition-all
            duration-200
            hover:brightness-110
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >

          <span
            className="
              absolute
              top-0
              left-[8%]
              right-[8%]
              h-[2px]
              bg-white/95
              blur-[0.5px]
            "
          />

          <span
            className="
              absolute
              inset-0
              bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,220,0.5),transparent_55%)]
              pointer-events-none
            "
          />

          <Ticket
            size={35}
            strokeWidth={2.5}
            className={`
              relative
              z-10
              text-[#090909]
              rotate-[-17deg]
              shrink-0
              ${iconGlow}
            `}
          />

          <span className="relative z-10 text-center">

            {purchaseLoading
              ? `${totalTickets} टिकट खरीदे जा रहे हैं...`
              : `अभी खरीदें - ₹${totalTicketPrice}`}

          </span>

          <span
            className="
              relative
              z-10
              text-[30px]
              leading-none
              font-bold
            "
          >
            →
          </span>

        </button>

        {/* =================================================
            WALLET INFO
        ================================================= */}

        <div
          className="
            mt-3
            rounded-[13px]
            border
            border-[#292b29]
            bg-[#0b0d0c]
            px-3
            py-3
            flex
            items-center
            justify-between
          "
        >

          <div>

            <p className="text-[10px] text-white/45">
              आपका Wallet Balance
            </p>

            <p className="text-[17px] text-white font-bold mt-[3px]">
              ₹
              {walletBalance.toLocaleString(
                "en-IN"
              )}
            </p>

          </div>

          <div className="text-right">

            <p className="text-[10px] text-white/45">
              इस खरीदारी के बाद
            </p>

            <p
              className={`text-[17px] font-bold mt-[3px] ${
                walletBalance >=
                totalTicketPrice
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              ₹
              {Math.max(
                0,
                walletBalance -
                  totalTicketPrice
              ).toLocaleString(
                "en-IN"
              )}
            </p>

          </div>

        </div>

        {/* =================================================
            PAYMENT INFO
        ================================================= */}

        <div className="flex items-center justify-center gap-2 mt-3">

          <LockIcon />

          <span className="text-[12px] text-white/50">
            सुरक्षित Wallet | Instant Ticket
          </span>

        </div>

        {/* =================================================
            FEATURES
        ================================================= */}

        <section
          className="
            mt-4
            rounded-[18px]
            border border-[#282828]
            bg-[#080a0a]
            py-4
          "
        >

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
// TICKET NUMBER CARD
// =====================================================

const TicketNumberCard = ({
  ticket,
  ticketIndex,
  totalTickets,
  purchaseLoading,
  onNumberChange,
  onKeyDown,
  onRandom,
  onClear,
  onRemove,
}) => {
  const isComplete =
    ticket.numbers.every(
      (number) => number !== ""
    );

  return (
    <section
      className="
        relative
        rounded-[17px]
        border
        border-[#303330]
        bg-[#080a0a]
        overflow-hidden
      "
    >

      {/* TOP GOLD LINE */}

      <div
        className="
          absolute
          top-0
          left-[12px]
          right-[12px]
          h-[1px]
          bg-[#f5ce54]/35
        "
      />

      {/* HEADER */}

      <div className="px-3 pt-3">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-[9px]">

            <div
              className="
                w-[34px]
                h-[34px]
                rounded-[10px]
                border
                border-[#f5ce54]/30
                bg-[#15140e]
                flex
                items-center
                justify-center
              "
            >

              <Ticket
                size={18}
                strokeWidth={2}
                className="text-[#f5ce54]"
              />

            </div>

            <div>

              <p className="text-[#f5ce54] text-[15px] font-extrabold leading-none">
                टिकट {ticketIndex + 1}
              </p>

              <p className="text-white/40 text-[9px] mt-[4px]">
                अपना 6 अंकों का नंबर चुनें
              </p>

            </div>

          </div>

          {totalTickets > 1 && (
            <button
              type="button"
              onClick={() =>
                onRemove(ticket.id)
              }
              disabled={
                purchaseLoading
              }
              className="
                text-[10px]
                text-red-400/75
                border
                border-red-400/20
                rounded-[7px]
                px-[8px]
                py-[5px]
                hover:bg-red-400/10
                disabled:opacity-40
              "
            >
              हटाएं
            </button>
          )}

        </div>

      </div>

      {/* NUMBER INPUTS */}

      <div className="px-3 mt-3">

        <div className="grid grid-cols-6 gap-[6px]">

          {ticket.numbers.map(
            (number, index) => (
              <input
                key={index}
                data-lottery-id={
                  ticket.id
                }
                data-lottery-index={
                  index
                }
                value={number}
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                onChange={(event) =>
                  onNumberChange(
                    ticket.id,
                    index,
                    event.target.value
                  )
                }
                onKeyDown={(event) =>
                  onKeyDown(
                    ticket.id,
                    index,
                    event
                  )
                }
                disabled={
                  purchaseLoading
                }
                className="
                  w-full
                  h-[56px]
                  rounded-[9px]
                  border
                  border-[#e2c540]
                  bg-[#101416]
                  text-center
                  text-[24px]
                  font-bold
                  text-[#d7dadd]
                  outline-none
                  placeholder:text-white/15
                  focus:border-[#ffd94f]
                  focus:bg-[#151716]
                  focus:shadow-[0_0_12px_rgba(245,197,66,0.18)]
                  disabled:opacity-60
                "
              />
            )
          )}

        </div>

      </div>

      {/* STATUS + ACTIONS */}

      <div className="px-3 py-3 flex items-center justify-between">

        <div className="flex items-center gap-[6px]">

          <span
            className={`w-[6px] h-[6px] rounded-full ${
              isComplete
                ? "bg-emerald-400"
                : "bg-[#f5ce54]"
            }`}
          />

          <span className="text-[10px] text-white/45">
            {isComplete
              ? "नंबर तैयार है"
              : "6 अंक दर्ज करें"}
          </span>

        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() =>
              onClear(ticket.id)
            }
            disabled={
              purchaseLoading
            }
            className="
              text-[10px]
              text-white/40
              underline
              underline-offset-2
              disabled:opacity-40
            "
          >
            साफ करें
          </button>

          <button
            type="button"
            onClick={() =>
              onRandom(ticket.id)
            }
            disabled={
              purchaseLoading
            }
            className="
              flex
              items-center
              gap-1
              rounded-[7px]
              border
              border-[#f5ce54]/20
              bg-[#11130f]
              px-[8px]
              py-[5px]
              text-[10px]
              text-[#f5ce54]
              disabled:opacity-40
            "
          >

            <span className="text-[12px]">
              ✦
            </span>

            रैंडम

          </button>

        </div>

      </div>

    </section>
  );
};

// =====================================================
// COUNTDOWN ITEM
// =====================================================

const CountdownItem = ({
  value,
  label,
}) => (
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
      {String(value).padStart(
        2,
        "0"
      )}
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
      {label}
    </div>

  </div>
);

// =====================================================
// COLON
// =====================================================

const Colon = () => (
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
);

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
    className="
      relative
      w-full
      h-[150px]
      rounded-[13px]
      overflow-hidden
      border
      border-[#d7b544]
      flex
      flex-col
      items-center
      text-center
      px-1
    "
    style={{
      backgroundImage: `url(${image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
  >

    <div className="absolute inset-0 bg-black/[0.06] pointer-events-none" />

    <div className="relative z-10 w-full flex flex-col items-center">

      <p
        className="
          mt-[15px]
          text-[12px]
          text-white
          font-semibold
          leading-none
          drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]
        "
      >
        {title}
      </p>

      <p
        className="
          mt-[13px]
          text-[25px]
          font-extrabold
          text-[#fff0a3]
          leading-none
          whitespace-nowrap
          drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]
        "
      >
        {amount}
      </p>

      <p
        className="
          mt-[9px]
          text-[10px]
          text-white
          font-medium
          leading-none
          drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]
        "
      >
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
  >

    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z" />

    <path d="M7 6H3v2a4 4 0 004 4M17 6h4v2a4 4 0 01-4 4" />

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
  >

    <path d="M4 13a8 8 0 0116 0" />

    <path d="M4 13v4a2 2 0 002 2h2v-6H4zM20 13v4a2 2 0 01-2 2h-2v-6h4z" />

    <path d="M8 19c1 2 3 3 5 3h2" />

  </svg>
);

export default BuyTicket;
