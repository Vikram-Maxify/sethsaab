
import { BarChart3, Home, ReceiptText, Ticket, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "होम", path: "/", icon: Home },
  { label: "रिजल्ट", path: "/results", icon: BarChart3 },
  {
    label: "टिकट खरीदें",
    path: "/buy-ticket",
    icon: Ticket,
    featured: true,
  },
  { label: "मेरे टिकट", path: "/my-tickets", icon: ReceiptText },
  { label: "प्रोफाइल", path: "/profile", icon: UserRound },
];

const BottomNavbar = () => {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[490px] z-50">
      <div className="relative bg-[#0b0b0b] backdrop-blur-xl border-t border-[#2a2a2a] shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        {/* Top golden line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-[#f5c542] shadow-[0_0_10px_rgba(245,197,66,0.55)]" />

        <div className="h-[82px] px-2 flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;

            /* ================= FEATURED TICKET ================= */
            if (item.featured) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative flex-1 h-full flex flex-col items-center justify-end pb-[7px]"
                >
                  {() => (
                    <>
                      {/* Outer floating ring */}
                      <div
                        className="
                          absolute left-1/2 -translate-x-1/2 -top-[28px]
                          w-[78px] h-[78px]
                          rounded-full
                          flex items-center justify-center
                          border-[2px]
                          border-[#f5c542]
                          bg-[#0c0c0a]
                          transition-all duration-200
                          shadow-[0_5px_0_#8f7018,0_8px_18px_rgba(0,0,0,0.8),0_0_18px_rgba(245,197,66,0.55)]
                        "
                      >
                        {/* Outer decorative ring */}
                        <div
                          className="
                            absolute
                            inset-[4px]
                            rounded-full
                            border border-[#f5c542]/35
                          "
                        />

                        {/* Top highlight */}
                        <div
                          className="
                            absolute
                            top-[5px]
                            left-1/2
                            -translate-x-1/2
                            w-[42px]
                            h-[8px]
                            rounded-full
                            bg-[#ffe99a]/40
                            blur-[4px]
                          "
                        />

                        {/* Inner 3D button */}
                        <div
                          className="
                            relative
                            w-[56px] h-[56px]
                            rounded-full
                            flex items-center justify-center
                            border-[2px]
                            border-[#fff1ad]
                            bg-[#f8d65e]
                            text-[#080808]
                            shadow-[inset_0_3px_4px_rgba(255,255,255,0.55),inset_0_-5px_8px_rgba(126,91,0,0.28)]
                          "
                        >
                          {/* Inner top shine */}
                          <div
                            className="
                              absolute
                              top-[5px]
                              left-[11px]
                              w-[25px]
                              h-[8px]
                              rounded-full
                              bg-white/25
                              blur-[3px]
                              pointer-events-none
                            "
                          />

                          <Icon
                            size={28}
                            strokeWidth={2.8}
                            className="relative z-10"
                          />
                        </div>
                      </div>

                      {/* Ticket label — always gold */}
                      <span
                        className="
                          text-[11px]
                          leading-none
                          whitespace-nowrap
                          text-[#f5c542]
                          font-semibold
                        "
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            }

            /* ================= NORMAL NAV ITEMS ================= */
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `relative flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                    isActive ? "text-[#f5c542]" : "text-[#b8b8b8]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active top indicator */}
                    {isActive && (
                      <div
                        className="
                          absolute
                          top-0
                          left-1/2
                          -translate-x-1/2
                          w-[34px]
                          h-[2px]
                          bg-[#f5c542]
                          shadow-[0_0_10px_rgba(245,197,66,0.8)]
                        "
                      />
                    )}

                    <Icon
                      size={29}
                      strokeWidth={isActive ? 2.4 : 2}
                      className="transition-all duration-200"
                    />

                    <span
                      className={`
                        text-[12px]
                        leading-none
                        whitespace-nowrap
                        ${isActive ? "font-semibold" : "font-normal"}
                      `}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavbar;
