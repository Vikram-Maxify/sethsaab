import { BarChart3, Home, ReceiptText, Ticket, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "होम",
    path: "/",
    icon: Home,
  },
  {
    label: "रिजल्ट",
    path: "/results",
    icon: BarChart3,
  },
  {
    label: "टिकट खरीदें",
    path: "/buy-ticket",
    icon: Ticket,
  },
  {
    label: "मेरे टिकट",
    path: "/my-tickets",
    icon: ReceiptText,
  },
  {
    label: "प्रोफाइल",
    path: "/profile",
    icon: UserRound,
  },
];

const BottomNavbar = () => {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="relative bg-[#0b0b0b]/98 backdrop-blur-xl border-t border-[#2a2a2a] shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        {/* Top golden glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.8)]" />

        <div className="h-[82px] px-2 flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;

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
                    {/* Active glow */}
                    {isActive && (
                      <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-14 h-[2px] bg-[#f5c542] shadow-[0_0_14px_rgba(245,197,66,0.9)]" />
                    )}

                    <Icon
                      size={29}
                      strokeWidth={isActive ? 2.4 : 2}
                      className={`transition-all duration-200 ${
                        isActive
                          ? "drop-shadow-[0_0_8px_rgba(245,197,66,0.45)]"
                          : ""
                      }`}
                    />

                    <span
                      className={`text-[12px] leading-none whitespace-nowrap ${
                        isActive ? "font-semibold" : "font-normal"
                      }`}
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
