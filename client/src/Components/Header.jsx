import { Menu } from "lucide-react";

const Header = () => {
  return (
    <div className="flex items-center justify-between px-5 pt-6 pb-4">
      <div className="flex items-center gap-2">
        {/* Crown SVG */}
        <svg width="38" height="30" viewBox="0 0 38 30" fill="none">
          <path
            d="M2 8L9 16L19 3L29 16L36 8L33 26H5L2 8Z"
            fill="#f5c542"
            stroke="#d4a017"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="2" cy="8" r="2.5" fill="#f5c542" />
          <circle cx="19" cy="3" r="2.5" fill="#f5c542" />
          <circle cx="36" cy="8" r="2.5" fill="#f5c542" />
          <rect x="5" y="26" width="28" height="3" fill="#f5c542" />
        </svg>
        <div>
          <h1
            className="text-[18px] leading-tight font-black tracking-tight"
            style={{
              background:
                "linear-gradient(180deg, #FFE47A 0%, #f5c542 50%, #d4a017 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SET THE LIFE
          </h1>
          <p className="text-[9px] tracking-[0.2em] text-seth-gold font-semibold -mt-0.5">
            PLAY • TRUST • WIN
          </p>
        </div>
      </div>
      <button className="text-seth-gold">
        <Menu size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default Header;
