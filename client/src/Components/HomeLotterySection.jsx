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

import { createLotteryConfig } from "../reducer/slice/createLotteryConfigSlice";

const HomeLotterySection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // =====================================================
  // CREATE LOTTERY CONFIG REDUX
  // =====================================================

  const {
    config,
    loading: lotteryLoading,
    error: lotteryError,
    successMessage,
  } = useSelector((state) => state.createLotteryConfig);

  // =====================================================
  // CREATE LOTTERY CONFIG
  // =====================================================

  const handleCreateLottery = () => {
    const now = new Date();

    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    dispatch(
      createLotteryConfig({
        month,
        year,
      }),
    );
  };

  console.log("Created Lottery Config:", config);

  return (
    <section className="w-full px-[10px] pt-2 pb-3 bg-[#050505]">
      {/* =====================================================
          NEXT DRAW CARD
      ===================================================== */}

      <div
        className="relative w-full h-[100px] rounded-[19px] border border-[#55513e] overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #151613 0%, #080908 100%)",
          boxShadow:
            "0 0 18px rgba(245,197,66,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="absolute inset-[5px] rounded-[15px] border border-[#252722] pointer-events-none" />

        <div className="relative h-full flex items-center">
          <div className="w-[76px] flex justify-center flex-shrink-0">
            <CalendarDays
              size={42}
              strokeWidth={2.2}
              className="text-[#f5c542] drop-shadow-[0_0_7px_rgba(245,197,66,0.45)]"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[#d1d1d1] text-[13px] font-medium leading-none">
              {lotteryLoading
                ? "लॉटरी जानकारी लोड हो रही है..."
                : lotteryError
                  ? "लॉटरी जानकारी उपलब्ध नहीं है"
                  : "अगला ड्रा (लक्की ड्रा)"}
            </p>

            <p className="text-[#f5c542] text-[25px] font-extrabold leading-none mt-[9px] tracking-tight">
              {config?.year && config?.month
                ? `${config.month}/${config.year}`
                : "11 अक्टूबर 2026"}
            </p>
          </div>

          <div
            className="w-[139px] h-[90px] mr-[4px] rounded-[16px] border border-[#a51d25] flex flex-col items-center justify-center"
            style={{
              background: "linear-gradient(180deg, #b82a30 0%, #711116 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.16), 0 0 12px rgba(170,20,25,0.3)",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-[20px] h-[20px] rounded-full border-2 border-white" />

                <div className="absolute left-[9px] top-[3px] w-[1.5px] h-[7px] bg-white" />

                <div className="absolute left-[9px] top-[9px] w-[6px] h-[1.5px] bg-white rotate-45 origin-left" />
              </div>

              <span className="text-white text-[13px] font-bold">
                जल्द शुरू होगा
              </span>
            </div>

            <p className="text-white text-[25px] font-extrabold leading-none mt-[7px]">
              12 <span className="text-[15px] font-bold">दिन बाकी</span>
            </p>
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
          amount="₹5 करोड़"
          subtitle="(6 अंक मिलने पर)"
          image="https://i.ibb.co/ZRPdFtMk/1trophy.png"
        />

        <PrizeCard
          type="second"
          title="द्वितीय पुरस्कार"
          amount="₹3 करोड़"
          subtitle="(5 अंक मिलने पर)"
          image="https://i.ibb.co/Hf8YPcmc/2trophy.png"
        />

        <PrizeCard
          type="third"
          title="तृतीय पुरस्कार"
          amount="₹2 करोड़"
          subtitle="(4 अंक मिलने पर)"
          image="https://i.ibb.co/mV8nXr0h/3trophy.png"
        />
      </div>

      {/* =====================================================
          BUY TICKET
      ===================================================== */}

      <button
        type="button"
        onClick={() => navigate("/buy-ticket")}
        className="relative mt-[16px] w-full h-[70px] rounded-[13px] flex items-center justify-center gap-[12px] text-black overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
        style={{
          background:
            "linear-gradient(180deg, #ffe477 0%, #f5c542 52%, #e4ae16 100%)",
          border: "1px solid #ffe88a",
          boxShadow:
            "0 4px 15px rgba(245,197,66,0.28), inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -3px 6px rgba(155,105,0,0.22)",
        }}
      >
        <div className="absolute top-0 left-[12%] right-[12%] h-[1px] bg-white/80" />

        <Ticket
          size={35}
          strokeWidth={2.5}
          className="text-[#090909] rotate-[-17deg] shrink-0"
        />

        <span className="text-[24px] font-extrabold tracking-tight">
          अभी टिकट खरीदें
        </span>

        <ArrowRight size={30} strokeWidth={3} className="shrink-0" />
      </button>

      {/* =====================================================
          TRUST STRIP
      ===================================================== */}

      <div
        className="mt-[16px] h-[68px] w-full rounded-[17px] border border-[#292b29] flex items-center"
        style={{
          background: "linear-gradient(180deg, #0d0f0e 0%, #070808 100%)",
        }}
      >
        <TrustItem
          icon={<Users size={27} strokeWidth={2.3} />}
          text="लाखों विजेता"
        />

        <div className="h-[27px] w-px bg-[#343634]" />

        <TrustItem
          icon={<ShieldCheck size={27} strokeWidth={2.3} />}
          text="100% भुगतान"
        />

        <div className="h-[27px] w-px bg-[#343634]" />

        <TrustItem
          icon={<Headphones size={27} strokeWidth={2.3} />}
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
              size={52}
              strokeWidth={2.1}
              className="text-[#f5c542] drop-shadow-[0_0_8px_rgba(245,197,66,0.3)]"
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
          OPTIONAL CREATE BUTTON
          Agar Home par config create nahi karna hai to
          is button ko remove kar dena.
      ===================================================== */}

      {/* 
      <button
        onClick={handleCreateLottery}
        disabled={lotteryLoading}
        className="mt-4 w-full h-[50px] rounded-xl bg-[#f5c542] text-black font-bold"
      >
        {lotteryLoading ? "Creating..." : "Create Lottery"}
      </button>
      */}

      {successMessage && (
        <p className="mt-2 text-center text-green-400 text-xs">
          {successMessage}
        </p>
      )}

      {lotteryError && (
        <p className="mt-2 text-center text-red-400 text-xs">
          {typeof lotteryError === "string"
            ? lotteryError
            : "Something went wrong"}
        </p>
      )}
    </section>
  );
};

const PrizeCard = ({ type, title, amount, subtitle, image }) => {
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
          className="mt-[13px] text-[27px] font-extrabold leading-none whitespace-nowrap"
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

const TrustItem = ({ icon, text }) => (
  <div className="flex-1 flex items-center justify-center gap-[7px] min-w-0">
    <span className="text-[#f5c542] flex-shrink-0">{icon}</span>

    <span className="text-[#d4d4d4] text-[12px] whitespace-nowrap">{text}</span>
  </div>
);

export default HomeLotterySection;
