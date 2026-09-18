import { useState } from "react";
import kuberBanner from "../assets/3ban.png";

const BuyTicket = () => {
  const [numbers, setNumbers] = useState(["0", "0", "0", "0", "0", "0"]);

  const handleNumberChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...numbers];
    updated[index] = value || "0";
    setNumbers(updated);
  };

  const generateRandom = () => {
    const randomNumbers = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 10).toString(),
    );

    setNumbers(randomNumbers);
  };

  return (
    <div className="min-h-screen bg-[#050606] text-white pb-28">
      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="w-full">
        <img
          src={kuberBanner}
          alt="Kuber Ticket"
          className="block w-full aspect-[16/9] object-cover"
        />
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <main className="px-[21px] pt-3">
        {/* ===================================================
            DRAW INFORMATION
        =================================================== */}
        <section className="rounded-[18px] border border-[#d7b838] bg-[#070909] overflow-hidden">
          <div className="grid grid-cols-2 min-h-[124px]">
            {/* Next Draw */}
            <div className="flex items-center gap-4 px-4 border-r border-[#292929]">
              <div className="shrink-0">
                <CalendarIcon />
              </div>

              <div>
                <p className="text-[14px] text-white font-medium">
                  अगला ड्रॉ (लकी ड्रॉ)
                </p>

                <p className="text-[18px] font-extrabold text-[#f5ce54] mt-2 whitespace-nowrap">
                  11 अक्टूबर 2026
                </p>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex flex-col justify-center px-4">
              <div className="flex items-center gap-2">
                <ClockIcon />

                <span className="text-[13px] text-white">
                  ड्रॉ शुरू होने में
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <TimeBox value="12" label="दिन" />
                <TimeBox value="14" label="घंटे" />
                <TimeBox value="32" label="मिनट" />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            PRIZE DETAILS
        =================================================== */}
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
              type="gold"
            />

            <PrizeCard
              title="द्वितीय पुरस्कार"
              amount="₹3 करोड़"
              condition="(5 अंक मिलने पर)"
              type="silver"
            />

            <PrizeCard
              title="तृतीय पुरस्कार"
              amount="₹2 करोड़"
              condition="(4 अंक मिलने पर)"
              type="bronze"
            />
          </div>
        </section>

        {/* ===================================================
            NUMBER SELECTION
        =================================================== */}
        <section className="mt-3 rounded-[18px] border border-[#353535] bg-[#080a0a] p-3">
          {/* Heading */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TargetIcon />

              <h2 className="text-[18px] font-bold">अपना लकी नंबर चुनें</h2>
            </div>

            <button
              onClick={generateRandom}
              className="flex items-center gap-2 bg-[#171a1b] border border-[#252828] rounded-lg px-3 py-2"
            >
              <ShuffleIcon />

              <span className="text-[11px] text-white/70">रैंडम नंबर</span>
            </button>
          </div>

          {/* Number Boxes */}
          <div className="grid grid-cols-6 gap-[7px] mt-4">
            {numbers.map((number, index) => (
              <input
                key={index}
                value={number}
                maxLength={1}
                inputMode="numeric"
                onChange={(e) => handleNumberChange(index, e.target.value)}
                className="
                  w-full
                  h-[62px]
                  rounded-[10px]
                  border
                  border-[#e2c540]
                  bg-[#101416]
                  text-center
                  text-[31px]
                  font-bold
                  text-[#d7dadd]
                  outline-none
                  focus:border-[#ffd94f]
                  focus:shadow-[0_0_12px_rgba(245,197,66,0.18)]
                "
              />
            ))}
          </div>

          {/* Hint */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <InfoIcon />

            <p className="text-[12px] text-white/55">
              कृपया 6 अंकों का नंबर दर्ज करें (000000 – 999999)
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#393939] my-4" />

          {/* Price */}
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

          {/* Buy Button */}
          <button
            className="
              w-full
              h-[60px]
              mt-4
              rounded-[14px]
              bg-gradient-to-b from-[#ffe16b] via-[#f8ca42] to-[#eab52c]
              text-black
              text-[20px]
              font-extrabold
              flex
              items-center
              justify-center
              gap-3
              shadow-[0_4px_16px_rgba(245,197,66,0.18)]
              active:scale-[0.99]
              transition-transform
            "
          >
            <CardIcon />

            <span>अभी खरीदें - ₹111</span>

            <span className="text-[28px] leading-none">→</span>
          </button>

          {/* Secure */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <LockIcon />

            <span className="text-[12px] text-white/50">
              सुरक्षित भुगतान | 100% सुरक्षित
            </span>
          </div>
        </section>

        {/* ===================================================
            FEATURES
        =================================================== */}
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

/* ============================================================
   TIME BOX
============================================================ */

const TimeBox = ({ value, label }) => (
  <div className="text-center">
    <div className="h-[42px] min-w-[53px] rounded-[8px] bg-[#181c1e] border border-[#24282a] flex items-center justify-center">
      <span className="text-[20px] font-bold text-white">{value}</span>
    </div>

    <span className="text-[9px] text-white/60 mt-1 block">{label}</span>
  </div>
);

/* ============================================================
   PRIZE CARD
============================================================ */

const PrizeCard = ({ title, amount, condition, type }) => {
  const styles = {
    gold: {
      border: "border-[#e4c13c]",
      text: "text-[#f5d45c]",
      icon: "text-[#f5d45c]",
    },
    silver: {
      border: "border-[#858585]",
      text: "text-[#dddddd]",
      icon: "text-[#dddddd]",
    },
    bronze: {
      border: "border-[#b55e27]",
      text: "text-[#eaa66b]",
      icon: "text-[#eaa66b]",
    },
  };

  const style = styles[type];

  return (
    <div
      className={`
        min-h-[194px]
        rounded-[13px]
        border
        ${style.border}
        bg-[#111314]
        flex
        flex-col
        items-center
        justify-center
        text-center
        px-1
      `}
    >
      <p className="text-[12px] text-white/90">{title}</p>

      <p
        className={`
          text-[25px]
          font-extrabold
          ${style.text}
          mt-3
          whitespace-nowrap
        `}
      >
        {amount}
      </p>

      <p className="text-[10px] text-white/75 mt-1">{condition}</p>

      <div className={`mt-3 ${style.icon}`}>
        <TrophyLargeIcon />
      </div>
    </div>
  );
};

/* ============================================================
   SMALL FEATURE
============================================================ */

const SmallFeature = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center px-1 text-center">
    <div className="mb-2">{icon}</div>

    <span className="text-[10px] leading-tight text-white/80">{text}</span>
  </div>
);

/* ============================================================
   ICONS
============================================================ */

const CrownIcon = () => (
  <svg width="48" height="32" viewBox="0 0 48 32" fill="none">
    <path
      d="M4 8L12 15L20 4L24 15L31 4L37 15L45 8L41 27H8L4 8Z"
      fill="currentColor"
    />
    <path d="M9 29H40" stroke="currentColor" strokeWidth="2" />
  </svg>
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

const TrophyLargeIcon = () => (
  <svg
    width="48"
    height="42"
    viewBox="0 0 48 42"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M14 5h20v11a10 10 0 01-20 0V5z" />
    <path d="M14 9H7v4a7 7 0 007 7M34 9h7v4a7 7 0 01-7 7" />
    <path d="M24 26v9M17 40h14" />
    <path d="M19 10h10" />
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
    className="text-white/50"
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

const CardIcon = () => (
  <svg
    width="27"
    height="27"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
    <path d="M7 15h3" />
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

/* ================= BOTTOM NAV ICONS ================= */

const HomeIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
    <path d="M9 20v-6h6v6" />
  </svg>
);

const ReceiptIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
);

const ResultIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

const ProfileIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21c0-4 3-7 8-7s8 3 8 7" />
  </svg>
);

export default BuyTicket;
