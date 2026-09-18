import { Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import firstPrize from "../assets/1trophy.png";
import secondPrize from "../assets/2trophy.png";
import kuberBanner from "../assets/3ban.png";
import thirdPrize from "../assets/3trophy.png";
import {
  addUserLotteryEntry,
  getActiveLotteryConfig,
} from "../reducer/slice/createLotteryConfigSlice";

const TICKET_PRICE = 111;

const BuyTicket = () => {
  const dispatch = useDispatch();
  const {
    config,
    activeConfig,
    activeLoading,
    purchaseLoading,
    error,
    successMessage,
  } = useSelector((state) => state.createLotteryConfig || {});

  const lotteryConfig = config || activeConfig;
  const [numbers, setNumbers] = useState(["", "", "", "", "", ""]);
  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");

  useEffect(() => {
    dispatch(getActiveLotteryConfig());
  }, [dispatch]);

  const drawDateText = useMemo(() => {
    if (!lotteryConfig?.month || !lotteryConfig?.year) {
      return "ड्रॉ जल्द घोषित होगा";
    }

    const date = new Date(lotteryConfig.year, lotteryConfig.month - 1, 1);

    return new Intl.DateTimeFormat("hi-IN", {
      month: "long",
      year: "numeric",
    }).format(date);
  }, [lotteryConfig]);

  const handleNumberChange = (index, value) => {
    if (!/^\d{0,2}$/.test(value)) return;
    const next = [...numbers];
    next[index] = value;
    setNumbers(next);
    setLocalError("");
    setLocalSuccess("");
  };

  const generateRandom = () => {
    const result = [];
    while (result.length < 6) {
      const n = String(Math.floor(Math.random() * 99) + 1);
      if (!result.includes(n)) result.push(n);
    }
    setNumbers(result);
    setLocalError("");
    setLocalSuccess("");
  };

  const clearNumbers = () => {
    setNumbers(["", "", "", "", "", ""]);
    setLocalError("");
    setLocalSuccess("");
  };

  const handlePurchase = async () => {
    setLocalError("");
    setLocalSuccess("");

    if (numbers.some((n) => n === "")) {
      setLocalError("कृपया सभी 6 नंबर दर्ज करें");
      return;
    }

    // Backend expects ONE 6-digit number.
    const lotteryNumber = numbers.join("");

    if (!/^\\d{6}$/.test(lotteryNumber)) {
      setLocalError("लॉटरी नंबर ठीक 6 अंकों का होना चाहिए");
      return;
    }

    if (!lotteryConfig?._id) {
      setLocalError("Active lottery configuration नहीं मिली");
      return;
    }

    try {
      const result = await dispatch(
        addUserLotteryEntry({
          number: lotteryNumber,
          amount: TICKET_PRICE,
        }),
      ).unwrap();

      setLocalSuccess(result?.message || "आपका टिकट सफलतापूर्वक बुक हो गया");

      // Clear selected number after successful purchase.
      setNumbers(["", "", "", "", "", ""]);
    } catch (e) {
      setLocalError(
        typeof e === "string" ? e : e?.message || "टिकट खरीदने में समस्या हुई",
      );
    }
  };

  const displayError = localError || error;
  const displaySuccess = localSuccess || successMessage;

  return (
    <div className="min-h-screen bg-[#050606] text-white pb-28">
      <section className="w-full">
        <img
          src={kuberBanner}
          alt="Kuber Ticket"
          className="block w-full aspect-[16/9] object-cover"
        />
      </section>

      <main className="px-[21px] pt-3">
        <section className="rounded-[18px] border border-[#d7b838] bg-[#070909] overflow-hidden">
          <div className="grid grid-cols-2 min-h-[124px]">
            <div className="flex items-center gap-4 px-4 border-r border-[#292929]">
              <CalendarIcon />
              <div>
                <p className="text-[14px] font-medium">अगला ड्रॉ (लकी ड्रॉ)</p>
                <p className="text-[18px] font-extrabold text-[#f5ce54] mt-2 whitespace-nowrap">
                  {activeLoading ? "लोड हो रहा है..." : drawDateText}
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-center px-4">
              <div className="flex items-center gap-2">
                <ClockIcon />
                <span className="text-[13px]">लकी ड्रॉ</span>
              </div>
              <div className="mt-3">
                <p className="text-[20px] font-bold text-[#f5ce54]">
                  {lotteryConfig?.isActive ? "ACTIVE" : "INACTIVE"}
                </p>
              </div>
            </div>
          </div>
        </section>

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

        <section className="mt-3 rounded-[18px] border border-[#353535] bg-[#080a0a] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TargetIcon />
              <h2 className="text-[18px] font-bold">अपना लकी नंबर चुनें</h2>
            </div>
            <button
              type="button"
              onClick={generateRandom}
              disabled={purchaseLoading}
              className="flex items-center gap-2 bg-[#171a1b] border border-[#252828] rounded-lg px-3 py-2 disabled:opacity-50"
            >
              <ShuffleIcon />
              <span className="text-[11px] text-white/70">रैंडम नंबर</span>
            </button>
          </div>

          <div className="grid grid-cols-6 gap-[7px] mt-4">
            {numbers.map((number, index) => (
              <input
                key={index}
                value={number}
                maxLength={1}
                inputMode="numeric"
                placeholder="--"
                onChange={(e) => handleNumberChange(index, e.target.value)}
                disabled={purchaseLoading}
                className="w-full h-[62px] rounded-[10px] border border-[#e2c540] bg-[#101416] text-center text-[25px] font-bold text-[#d7dadd] outline-none placeholder:text-white/20 focus:border-[#ffd94f] focus:shadow-[0_0_12px_rgba(245,197,66,0.18)] disabled:opacity-60"
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            <InfoIcon />
            <p className="text-[12px] text-white/55 text-center">
              6 अंकों का लकी नंबर चुनें (000000 – 999999)
            </p>
          </div>
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={clearNumbers}
              disabled={purchaseLoading}
              className="text-[11px] text-white/45 underline underline-offset-2"
            >
              नंबर साफ करें
            </button>
          </div>

          {displayError && (
            <div className="mt-3 rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-[12px] text-red-300">
              {displayError}
            </div>
          )}
          {displaySuccess && !displayError && (
            <div className="mt-3 rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-[12px] text-emerald-300">
              {displaySuccess}
            </div>
          )}

          <div className="h-px bg-[#393939] my-4" />
          <div className="grid grid-cols-2 items-center">
            <div className="flex items-center gap-3 px-2">
              <TicketIcon />
              <div>
                <p className="text-[13px] text-white/80">टिकट की कीमत</p>
                <p className="text-[31px] leading-none font-extrabold text-[#f5ce54] mt-1">
                  ₹111
                </p>
              </div>
            </div>
            <div className="border-l border-[#3a3a3a] pl-5">
              <p className="text-[14px] text-[#f5ce54] font-semibold">
                ✨ एक टिकट, लाखों सपने
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePurchase}
            disabled={
              purchaseLoading ||
              activeLoading ||
              !lotteryConfig?._id ||
              numbers.some((n) => n === "")
            }
            className="w-full h-[60px] mt-4 rounded-[14px] bg-gradient-to-b from-[#ffe16b] via-[#f8ca42] to-[#eab52c] text-black text-[20px] font-extrabold flex items-center justify-center gap-3 shadow-[0_4px_16px_rgba(245,197,66,0.18)] active:scale-[0.99] transition-transform disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Ticket
              size={35}
              strokeWidth={2.5}
              className="text-[#090909] rotate-[-17deg] shrink-0"
            />
            <span>
              {purchaseLoading ? "खरीदा जा रहा है..." : "अभी खरीदें - ₹111"}
            </span>
            {!purchaseLoading && (
              <span className="text-[28px] leading-none">→</span>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 mt-3">
            <LockIcon />
            <span className="text-[12px] text-white/50">
              सुरक्षित भुगतान | 100% सुरक्षित
            </span>
          </div>
        </section>

        <section className="mt-3 rounded-[18px] border border-[#282828] bg-[#080a0a] py-4">
          <div className="grid grid-cols-4">
            <SmallFeature icon={<ShieldIcon />} text="100% सुरक्षित" />
            <SmallFeature icon={<ZapIcon />} text="तुरंत और आसान" />
            <SmallFeature icon={<UsersIcon />} text="लाखों लोग पहले से जुड़े" />
            <SmallFeature icon={<SupportIcon />} text="24/7 सहायता" />
          </div>
        </section>
      </main>
    </div>
  );
};

const TimeBox = ({ value, label }) => (
  <div className="text-center">
    <div className="h-[42px] min-w-[53px] rounded-[8px] bg-[#181c1e] border border-[#24282a] flex items-center justify-center">
      <span className="text-[20px] font-bold">{value}</span>
    </div>
    <span className="text-[9px] text-white/60 mt-1 block">{label}</span>
  </div>
);

const PrizeCard = ({ title, amount, condition, image }) => (
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

const SmallFeature = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center px-1 text-center">
    <div className="mb-2">{icon}</div>
    <span className="text-[10px] leading-tight text-white/80">{text}</span>
  </div>
);

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
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2M15 18h2" />
  </svg>
);
const ClockIcon = () => (
  <svg
    width="25"
    height="25"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
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
const TargetIcon = () => (
  <svg
    width="29"
    height="29"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="#f5ce54" />
    <path d="M16 8l5-5M18 3h3v3" />
  </svg>
);
const ShuffleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="2"
  >
    <path d="M3 7h3c4 0 6 10 10 10h5" />
    <path d="M18 14l3 3-3 3" />
    <path d="M3 17h3c1.5 0 2.5-1 3.5-2.5" />
    <path d="M18 4l3 3-3 3" />
    <path d="M13 7c1 0 2 0 3 0h5" />
  </svg>
);
const InfoIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="text-white/50 shrink-0"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
const TicketIcon = () => (
  <svg
    width="42"
    height="42"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5ce54"
    strokeWidth="1.7"
  >
    <path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v3a2 2 0 000 4v3a2 2 0 00-2 2H5a2 2 0 00-2-2v-3a2 2 0 000-4V8z" />
    <path d="M13 6v2M13 10v2M13 14v2M13 18v1" />
  </svg>
);
const LockIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-white/45"
  >
    <path d="M17 9V7a5 5 0 00-10 0v2H5v12h14V9h-2zm-8 0V7a3 3 0 016 0v2H9z" />
  </svg>
);
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
const ZapIcon = () => (
  <svg width="29" height="29" viewBox="0 0 24 24" fill="#f5ce54">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);
const UsersIcon = () => (
  <svg width="29" height="29" viewBox="0 0 24 24" fill="#f5ce54">
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5v1H3v-1z" />
    <path d="M16 15c2.5 0 5 1.5 5 4v1h-4" opacity=".8" />
  </svg>
);
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
