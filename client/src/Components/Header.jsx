import { Menu } from "lucide-react";

const Header = () => {
  return (
    <>
      {/* Fixed Navbar */}
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
        <div className="flex items-center justify-between px-5 pt-5 pb-4">

          {/* ================= LEFT: LOGO ================= */}
          <div className="flex items-center gap-2.5">

            {/* Crown */}
            <div className="relative">
              <svg
                width="40"
                height="32"
                viewBox="0 0 38 30"
                fill="none"
                className="drop-shadow-[0_0_8px_rgba(245,197,66,0.5)]"
              >
                <defs>
                  <linearGradient
                    id="crownGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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

                <circle
                  cx="2"
                  cy="8"
                  r="2.5"
                  fill="url(#crownGrad)"
                />

                <circle
                  cx="19"
                  cy="3"
                  r="2.5"
                  fill="url(#crownGrad)"
                />

                <circle
                  cx="36"
                  cy="8"
                  r="2.5"
                  fill="url(#crownGrad)"
                />

                <rect
                  x="5"
                  y="26"
                  width="28"
                  height="3"
                  fill="url(#crownGrad)"
                  rx="1"
                />
              </svg>
            </div>

            {/* Brand */}
            <div className="flex flex-col">
              <h1
                className="text-[18px] leading-none font-black tracking-tight"
                style={{
                  background:
                    "linear-gradient(180deg, #FFE47A 0%, #f5c542 50%, #d4a017 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  WebkitTextStroke:
                    "0.3px rgba(212,160,23,0.3)",
                }}
              >
                SET THE LIFE
              </h1>

              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 rounded-full bg-[#f5c542]" />

                <p className="text-[8px] tracking-[0.25em] text-[#f5c542] font-semibold leading-none">
                  PLAY
                </p>

                <span className="text-[8px] text-[#f5c542]/40 leading-none">
                  •
                </span>

                <p className="text-[8px] tracking-[0.25em] text-[#f5c542] font-semibold leading-none">
                  TRUST
                </p>

                <span className="text-[8px] text-[#f5c542]/40 leading-none">
                  •
                </span>

                <p className="text-[8px] tracking-[0.25em] text-[#f5c542] font-semibold leading-none">
                  WIN
                </p>

                <span className="w-1 h-1 rounded-full bg-[#f5c542]" />
              </div>
            </div>
          </div>

          {/* ================= RIGHT: MENU ================= */}
          {/* <button
            type="button"
            className="relative w-10 h-10 rounded-xl border border-[#2a2a2a] bg-[#111111] flex items-center justify-center text-[#f5c542] active:scale-95 transition-transform duration-150"
            aria-label="Menu"
          >
            <Menu size={20} strokeWidth={2.5} />

            <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#f5c542]/60 rounded-tr-xl" />

            <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#f5c542]/60 rounded-bl-xl" />
          </button> */}
        </div>

        {/* Golden Divider */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#f5c542]/40 to-transparent" />
      </header>

      {/* Navbar ki exact height jitni space */}
      <div className="h-[71px]" />
    </>
  );
};

export default Header;