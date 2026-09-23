import { useLocation } from "react-router-dom";

// ==========================================================
// WHATSAPP CONFIG
// ==========================================================

const WHATSAPP_NUMBER = "917234806209"; // 👈 apna number

const ADMIN_ROUTES = [
  "/admin",
  "/admin/dashboard",
  "/admin/users",
  "/admin/deposits",
  "/admin/withdrawals",
  "/admin/transactions",
  "/admin/reports",
  "/admin/notifications",
  "/admin/settings",
];

// ==========================================================
// WHATSAPP BUTTON (FIXED TOP-RIGHT)
// ==========================================================

const WhatsappButton = () => {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hello, mujhe support chahiye.");
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleWhatsAppClick}
      aria-label="WhatsApp Support"
      className="
        relative
        flex
        h-[42px]
        w-[42px]
        items-center
        justify-center
        rounded-full
        border-2
        border-white/20
        bg-[#25D366]
        text-white
        shadow-[0_4px_18px_rgba(37,211,102,0.45)]
        transition-transform
        duration-200
        hover:scale-110
        active:scale-95
      "
    >
      {/* WhatsApp Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="h-[24px] w-[24px]"
        fill="currentColor"
      >
        <path d="M19.11 17.24c-.27-.14-1.58-.78-1.82-.87-.24-.09-.42-.14-.6.14-.18.27-.69.87-.85 1.05-.16.18-.31.2-.58.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.56.12-.12.27-.31.4-.47.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.47-.07-.14-.6-1.45-.82-1.99-.22-.52-.43-.45-.6-.46h-.51c-.18 0-.47.07-.71.34-.24.27-.94.92-.94 2.24s.96 2.6 1.09 2.78c.14.18 1.89 2.89 4.58 4.05.64.28 1.14.45 1.53.58.64.2 1.22.17 1.68.1.51-.08 1.58-.65 1.8-1.28.22-.63.22-1.17.16-1.28-.05-.11-.24-.18-.51-.31z" />
        <path d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.67-1.71A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-2.01 0-3.98-.54-5.71-1.57l-.41-.24-3.96 1.01 1.06-3.86-.27-.42A10.78 10.78 0 0 1 5.22 16C5.22 10.05 10.05 5.22 16 5.22S26.78 10.05 26.78 16 21.95 26.8 16 26.8z" />
      </svg>

      {/* Red dot */}
      <span
        className="
          pointer-events-none
          absolute
          -right-1
          -top-1
          h-3
          w-3
          rounded-full
          border-2
          border-[#0a0a0a]
          bg-red-500
        "
      />
    </button>
  );
};

// ==========================================================
// WHATSAPP VISIBILITY (Admin routes pe hide)
// ==========================================================

const WhatsappForUser = () => {
  const location = useLocation();

  const isAdminRoute = ADMIN_ROUTES.some(
    (route) =>
      location.pathname === route ||
      location.pathname.startsWith(`${route}/`)
  );

  if (isAdminRoute) return null;

  return <WhatsappButton />;
};

// ==========================================================
// HEADER
// ==========================================================

const Header = () => {
  return (
    <>
      <header
        className="
          fixed
          top-0
          left-1/2
          -translate-x-1/2
          z-[9999]
          w-[490px]
          max-w-full
          bg-[#0a0a0a]/95
          backdrop-blur-md
          border-b
          border-[#2a2a2a]
        "
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          {/* ================= LEFT: LOGO ================= */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <svg
                width="40"
                height="32"
                viewBox="0 0 38 30"
                fill="none"
                className="drop-shadow-[0_0_8px_rgba(245,197,66,0.5)]"
              >
                <defs>
                  <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFE47A" />
                    <stop offset="50%" stopColor="#f5c542" />
                    <stop offset="100%" stopColor="#d4a017" />
                  </linearGradient>
                </defs>
                <path
                  d="M2 8L9 16L19 3L29 16L36 8L33 26H5L2 8Z"
                  fill="url(#crownGrad)"
                  stroke="#d4a017"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <circle cx="2" cy="8" r="2.5" fill="url(#crownGrad)" />
                <circle cx="19" cy="3" r="2.5" fill="url(#crownGrad)" />
                <circle cx="36" cy="8" r="2.5" fill="url(#crownGrad)" />
                <rect x="5" y="26" width="28" height="3" fill="url(#crownGrad)" rx="1" />
              </svg>
            </div>

            <div className="flex flex-col">
              <h1
                className="text-[18px] leading-none font-black tracking-tight"
                style={{
                  background:
                    "linear-gradient(180deg, #FFE47A 0%, #f5c542 50%, #d4a017 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  WebkitTextStroke: "0.3px rgba(212,160,23,0.3)",
                }}
              >
                SET THE LIFE
              </h1>

              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 rounded-full bg-[#f5c542]" />
                <p className="text-[8px] tracking-[0.25em] text-[#f5c542] font-semibold leading-none">PLAY</p>
                <span className="text-[8px] text-[#f5c542]/40 leading-none">•</span>
                <p className="text-[8px] tracking-[0.25em] text-[#f5c542] font-semibold leading-none">TRUST</p>
                <span className="text-[8px] text-[#f5c542]/40 leading-none">•</span>
                <p className="text-[8px] tracking-[0.25em] text-[#f5c542] font-semibold leading-none">WIN</p>
                <span className="w-1 h-1 rounded-full bg-[#f5c542]" />
              </div>
            </div>
          </div>

          {/* ================= RIGHT: WHATSAPP ================= */}
          <WhatsappForUser />
        </div>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#f5c542]/40 to-transparent" />
      </header>

      <div className="h-[71px]" />
    </>
  );
};

export default Header;