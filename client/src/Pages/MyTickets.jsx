import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Crown,
  Ticket,
} from "lucide-react";
import { useState } from "react";

const MyTickets = () => {
  const [activeTab, setActiveTab] = useState("all");

  const tickets = [
    {
      id: "KT251005248197",
      number: ["2", "4", "8", "1", "9", "7"],
      status: "pending",
      statusText: "पेंडिंग",
      drawDate: "11 अक्टूबर 2026",
      price: "₹111",
      purchaseDate: "05 अक्टूबर 2026",
      purchaseTime: "रात 10:24",
      message: "भाग्य का नया अवसर",
    },
    {
      id: "KT251004750361",
      number: ["7", "5", "0", "3", "6", "1"],
      status: "active",
      statusText: "सक्रिय",
      drawDate: "11 अक्टूबर 2026",
      price: "₹111",
      purchaseDate: "04 अक्टूबर 2026",
      purchaseTime: "शाम 06:17",
      message: "किस्मत जगाओ जीत पाओ",
    },
  ];

  const tabs = [
    { key: "all", label: "सभी", count: 3 },
    { key: "pending", label: "पेंडिंग", count: 2 },
    { key: "active", label: "विजेता", count: 0 },
    { key: "lost", label: "हार गए", count: 1 },
  ];

  const filteredTickets =
    activeTab === "all"
      ? tickets
      : tickets.filter((item) => item.status === activeTab);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {}
  };

  return (
    <div className="min-h-screen w-full bg-[#030404] text-white">
      <main className="w-full max-w-[680px] mx-auto px-[18px] pt-[28px] pb-[35px]">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}
        <div className="relative flex items-center justify-between">
          {/* Left title */}
          <div className="flex items-center gap-[15px] min-w-0">
            <div className="relative shrink-0">
              <Ticket
                size={58}
                strokeWidth={1.8}
                className="
                  text-[#f5c542]
                  rotate-[-18deg]
                  drop-shadow-[0_0_12px_rgba(245,197,66,0.38)]
                "
              />

              <div className="absolute inset-0 blur-[9px] bg-[#f5c542]/10 -z-10" />
            </div>

            <div className="min-w-0">
              <h1
                className="
                  text-[39px]
                  leading-[0.95]
                  font-extrabold
                  tracking-tight
                  text-white
                "
              >
                मेरे टिकट
              </h1>

              <p
                className="
                  mt-[9px]
                  text-[13px]
                  leading-[1.15]
                  text-[#d1d1d1]
                  max-w-[360px]
                "
              >
                आपके द्वारा खरीदे गए सभी टिकट यहाँ दिखेंगे
              </p>
            </div>
          </div>

          {/* Dropdown */}
          <button
            type="button"
            className="
              shrink-0
              w-[145px]
              h-[58px]
              rounded-[13px]
              border
              border-[#a38b35]
              bg-[#080a09]
              px-[15px]
              flex
              items-center
              justify-between
              text-white
              shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
            "
          >
            <span className="text-[17px] font-medium">सभी टिकट</span>

            <ChevronDown size={23} strokeWidth={2.3} className="text-white" />
          </button>
        </div>

        {/* =====================================================
            FILTER TABS
        ===================================================== */}
        <div className="grid grid-cols-4 gap-[10px] mt-[30px]">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`
                  h-[60px]
                  rounded-[13px]
                  border
                  flex
                  items-center
                  justify-center
                  whitespace-nowrap
                  transition-all
                  ${
                    active
                      ? `
                        border-[#ffe27a]
                        text-black
                        font-extrabold
                        bg-gradient-to-b
                        from-[#ffe77b]
                        via-[#f5c542]
                        to-[#e9b528]
                        shadow-[0_4px_16px_rgba(245,197,66,0.25)]
                      `
                      : `
                        border-[#353938]
                        bg-[#101212]
                        text-[#eeeeee]
                        font-semibold
                      `
                  }
                `}
              >
                <span className="text-[16px]">{tab.label}</span>

                <span className="text-[16px] ml-[3px]">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* =====================================================
            TICKET LIST
        ===================================================== */}
        <div className="mt-[34px] space-y-[30px]">
          {filteredTickets.map((ticket) => (
            <LotteryTicket key={ticket.id} ticket={ticket} copyId={copyId} />
          ))}
        </div>
      </main>
    </div>
  );
};

/* =============================================================
   LOTTERY TICKET
============================================================= */

const LotteryTicket = ({ ticket, copyId }) => {
  const pending = ticket.status === "pending";

  return (
    <div
      className="
        relative
        w-full
        h-[418px]
        rounded-[20px]
        overflow-hidden
        bg-[#f4dda0]
        border-[1.5px]
        border-[#d2a83b]
        shadow-[0_7px_30px_rgba(0,0,0,0.45)]
      "
    >
      {/* =======================================================
          GOLD INNER BORDER
      ======================================================= */}
      <div
        className="
          absolute
          inset-[5px]
          rounded-[16px]
          border
          border-[#f1d276]/70
          pointer-events-none
          z-[30]
        "
      />

      {/* =======================================================
          LEFT RED PANEL
      ======================================================= */}
      <div
        className="
          absolute
          left-0
          top-0
          bottom-0
          w-[24%]
          flex
          flex-col
          items-center
          text-center
          px-[12px]
          py-[30px]
          overflow-hidden
          bg-gradient-to-b
          from-[#d82b2d]
          via-[#b8171b]
          to-[#820b10]
          border-r
          border-[#e4b844]
        "
      >
        {/* Crown */}
        <Crown
          size={66}
          strokeWidth={1.5}
          fill="#f7d24d"
          className="
            text-[#f7d24d]
            drop-shadow-[0_2px_7px_rgba(0,0,0,0.4)]
          "
        />

        {/* Kuber Ticket */}
        <h2 className="mt-[10px] text-[27px] leading-[0.95] font-extrabold text-white">
          Kuber
        </h2>

        <h2 className="mt-[5px] text-[27px] leading-[0.95] font-extrabold text-white">
          Ticket
        </h2>

        {/* Separator */}
        <div className="w-[65%] h-px bg-[#f5c542]/60 mt-[25px]" />

        {/* Main message */}
        <p className="mt-[27px] text-[17px] leading-[1.45] font-semibold text-white">
          {ticket.message}
        </p>

        {/* Lotus */}
        <div className="mt-auto">
          <svg
            width="52"
            height="45"
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

        <p className="mt-[8px] text-[15px] font-semibold text-white">
          खेलो विश्वास
        </p>

        <p className="text-[15px] font-semibold text-white">के साथ</p>
      </div>

      {/* =======================================================
          CENTER PANEL
      ======================================================= */}
      <div
        className="
          absolute
          left-[24%]
          right-[24%]
          top-0
          bottom-0
          px-[14px]
          py-[25px]
          text-[#19140c]
          bg-gradient-to-b
          from-[#fff1c4]
          via-[#f8e4ad]
          to-[#efd394]
        "
      >
        {/* Decorative top */}
        <div className="flex items-center justify-center gap-[7px]">
          <span className="text-[#c49a3d] text-[15px]">❧</span>

          <div
            className="
              px-[15px]
              py-[7px]
              rounded-full
              border
              border-[#d1ad55]
              bg-[#f9e9b9]
              shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]
            "
          >
            <p className="text-[17px] font-extrabold whitespace-nowrap">
              भारत की भरोसेमंद लॉटरी
            </p>
          </div>

          <span className="text-[#c49a3d] text-[15px]">❧</span>
        </div>

        {/* Selected number title */}
        <p className="text-center text-[18px] font-semibold mt-[23px]">
          आपका चुना हुआ नंबर
        </p>

        {/* =====================================================
            NUMBER BOXES
        ===================================================== */}
        <div className="grid grid-cols-6 gap-[6px] mt-[15px]">
          {ticket.number.map((digit, index) => (
            <div
              key={index}
              className="
                h-[58px]
                rounded-[10px]
                border
                border-[#bd8b2d]
                bg-[#fff0c3]
                flex
                items-center
                justify-center
                shadow-[inset_0_1px_3px_rgba(120,80,10,0.08)]
              "
            >
              <span className="text-[29px] font-extrabold">{digit}</span>
            </div>
          ))}
        </div>

        {/* =====================================================
            PRIZES
        ===================================================== */}
        <div className="grid grid-cols-3 gap-[7px] mt-[24px]">
          <MiniPrize
            title="प्रथम पुरस्कार"
            amount="₹5 करोड़"
            subtitle="(6 अंक मिलने पर)"
          />

          <MiniPrize
            title="द्वितीय पुरस्कार"
            amount="₹3 करोड़"
            subtitle="(5 अंक मिलने पर)"
          />

          <MiniPrize
            title="तृतीय पुरस्कार"
            amount="₹2 करोड़"
            subtitle="(4 अंक मिलने पर)"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-[#c9a85c] mt-[22px]" />

        {/* Bottom slogan */}
        <div className="flex items-center justify-center gap-[6px] mt-[17px]">
          <span className="text-[#c09232] text-[17px]">✧</span>

          <p className="text-[15px] font-semibold text-center leading-[1.3]">
            छोटी सी राशि, बड़ी खुशियों की शुरुआत
          </p>

          <span className="text-[#c09232] text-[17px]">✧</span>
        </div>
      </div>

      {/* =======================================================
          RIGHT PANEL
      ======================================================= */}
      <div
        className="
          absolute
          right-0
          top-0
          bottom-0
          w-[24%]
          px-[10px]
          py-[18px]
          text-[#21180d]
          bg-gradient-to-b
          from-[#fff1c7]
          via-[#f7e2a8]
          to-[#edd28f]
          border-l
          border-[#c39b43]
        "
      >
        {/* Status */}
        <div
          className={`
            w-full
            h-[43px]
            rounded-[13px]
            flex
            items-center
            justify-center
            gap-[5px]
            text-white
            font-bold
            ${
              pending
                ? "bg-gradient-to-b from-[#ed4d4a] to-[#c82729]"
                : "bg-gradient-to-b from-[#42c45b] to-[#209d3c]"
            }
          `}
        >
          {pending ? (
            <Clock3 size={20} strokeWidth={2} />
          ) : (
            <CheckCircle2 size={20} strokeWidth={2} />
          )}

          <span className="text-[14px]">{ticket.statusText}</span>
        </div>

        {/* Draw Date */}
        <SideInfo
          label="ड्रॉ दिनांक"
          value={
            <>
              <span>11</span>
              <span>अक्टूबर</span>
              <br />
              <span>2026</span>
            </>
          }
        />

        {/* Price */}
        <SideInfo
          label="टिकट मूल्य"
          value={ticket.price}
          valueClass="text-[#9d2020] text-[20px] font-extrabold"
        />

        {/* Purchase */}
        <div className="mt-[24px]">
          <p className="text-[12px] text-[#6a5533]">खरीद की तारीख</p>

          <p className="text-[13px] font-bold leading-[1.35] mt-[6px]">
            {ticket.purchaseDate}
          </p>

          <p className="text-[12px] mt-[3px]">{ticket.purchaseTime}</p>
        </div>

        {/* Ticket ID */}
        <div className="mt-[25px]">
          <p className="text-[12px] text-[#6a5533]">टिकट आईडी</p>

          <div className="flex items-start gap-[5px] mt-[6px]">
            <span className="text-[12px] font-bold break-all leading-[1.2]">
              {ticket.id}
            </span>

            <button
              type="button"
              onClick={() => copyId(ticket.id)}
              className="shrink-0 mt-[1px]"
            >
              <Copy size={17} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* =======================================================
          TICKET DECORATIVE NOTCHES
      ======================================================= */}
      <TicketNotches />
    </div>
  );
};

/* =============================================================
   SIDE INFO
============================================================= */

const SideInfo = ({ label, value, valueClass = "" }) => (
  <div className="mt-[21px]">
    <p className="text-[12px] text-[#6a5533]">{label}</p>

    <div
      className={`
        text-[14px]
        font-semibold
        leading-[1.3]
        mt-[6px]
        ${valueClass}
      `}
    >
      {value}
    </div>
  </div>
);

/* =============================================================
   MINI PRIZE
============================================================= */

const MiniPrize = ({ title, amount, subtitle }) => (
  <div
    className="
      min-w-0
      rounded-[11px]
      border
      border-[#c79b3d]
      bg-[#f8e8b4]
      py-[11px]
      px-[3px]
      text-center
      shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]
    "
  >
    <p className="text-[11px] font-bold leading-[1.25]">{title}</p>

    <p className="mt-[7px] text-[13px] leading-none font-extrabold text-[#9e2922] whitespace-nowrap">
      {amount}
    </p>

    <p className="mt-[6px] text-[9px] leading-[1.2]">{subtitle}</p>
  </div>
);

/* =============================================================
   TICKET NOTCHES
============================================================= */

const TicketNotches = () => (
  <>
    <div className="absolute left-[-7px] top-[54px] w-[14px] h-[14px] rounded-full bg-[#030404] z-40" />
    <div className="absolute left-[-7px] top-[calc(50%-7px)] w-[14px] h-[14px] rounded-full bg-[#030404] z-40" />
    <div className="absolute left-[-7px] bottom-[54px] w-[14px] h-[14px] rounded-full bg-[#030404] z-40" />

    <div className="absolute right-[-7px] top-[54px] w-[14px] h-[14px] rounded-full bg-[#030404] z-40" />
    <div className="absolute right-[-7px] top-[calc(50%-7px)] w-[14px] h-[14px] rounded-full bg-[#030404] z-40" />
    <div className="absolute right-[-7px] bottom-[54px] w-[14px] h-[14px] rounded-full bg-[#030404] z-40" />
  </>
);

export default MyTickets;
