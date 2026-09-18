import {
  ChevronRight,
  Edit3,
  HandCoins,
  Headphones,
  Loader2,
  LogOut,
  Ticket,
  Trophy,
  UserRound,
  Wallet,
} from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { logout } from "../reducer/slice/authSlice";
import {
  getMyLotteryEntries,
  selectMyLotteryEntriesLoading,
  selectMyLotteryTotalEntries,
} from "../reducer/slice/createLotteryConfigSlice";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, logoutLoading } = useSelector((state) => state.auth);

  // ==========================================
  // LOTTERY DATA
  // ==========================================
  const totalTickets = useSelector(selectMyLotteryTotalEntries);
  const myEntriesLoading = useSelector(selectMyLotteryEntriesLoading);

  // ==========================================
  // FETCH USER'S LOTTERY ENTRIES
  // ==========================================
  useEffect(() => {
    if (user) {
      dispatch(getMyLotteryEntries());
    }
  }, [dispatch, user]);

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = async () => {
    const result = await dispatch(logout());

    if (logout.fulfilled.match(result)) {
      navigate("/login", { replace: true });
    }
  };

  // ==========================================
  // WALLET
  // ==========================================
  const walletBalance = Number(user?.wallet || 0);

  const formattedWalletBalance = walletBalance.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white px-5 pt-3 pb-6">
      {/* Profile Card */}
      <div
        className="relative overflow-hidden rounded-[20px] p-4 border border-[#8d6b20]"
        style={{
          background:
            "radial-gradient(circle at 70% 0%, rgba(150,105,20,0.28) 0%, rgba(30,24,10,0.7) 35%, #080808 75%)",
          boxShadow: "0 0 35px rgba(245,197,66,0.08)",
        }}
      >
        <div className="absolute right-[-15px] top-[-15px] opacity-[0.10] pointer-events-none">
          <LotusDecoration />
        </div>

        <div className="relative flex items-center gap-4">
          <div className="w-[112px] h-[112px] rounded-full border-[3px] border-[#f5c542] flex-shrink-0 flex items-center justify-center">
            <div className="w-[98px] h-[98px] rounded-full bg-black/50 flex items-center justify-center overflow-hidden">
              <UserRound
                size={65}
                strokeWidth={1.4}
                className="text-[#f5c542]"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[#bcbcbc] text-[16px]">नमस्ते,</p>

            <h1 className="text-white text-[27px] font-extrabold leading-tight truncate">
              {user?.name || "उपयोगकर्ता"}
            </h1>

            <p className="text-[#c9c9c9] text-[16px] mt-1">
              +91 {user?.mobile || "----------"}
            </p>
          </div>

          <button
            type="button"
            className="absolute right-0 top-[68px] border border-[#f5c542] text-[#f5c542] rounded-xl px-3 py-2 flex items-center gap-2 text-[13px] font-semibold"
          >
            <Edit3 size={16} />
            संपादित करें
          </button>
        </div>

        {/* ============================
            TICKET / WINNER STATS
        ============================ */}
        <div className="mt-5 h-[88px] rounded-2xl border border-[#373737] bg-black/40 flex items-center overflow-hidden">
          {/* TOTAL TICKETS */}
          <div className="flex-1 flex items-center gap-3 px-5">
            <div className="w-12 h-12 rounded-full bg-[#211b0b] flex items-center justify-center flex-shrink-0">
              <Ticket size={28} fill="#f5c542" className="text-[#f5c542]" />
            </div>

            <div>
              <p className="text-[#c6c6c6] text-[15px]">कुल टिकट</p>

              <p className="text-white text-[27px] font-extrabold leading-none mt-1">
                {myEntriesLoading ? (
                  <Loader2 size={24} className="text-[#f5c542] animate-spin" />
                ) : (
                  totalTickets
                )}
              </p>
            </div>
          </div>

          <div className="h-[60px] w-px bg-[#363636]" />

          {/* TOTAL WINNERS */}
          <div className="flex-1 flex items-center gap-3 px-5">
            <div className="w-12 h-12 rounded-full bg-[#211b0b] flex items-center justify-center flex-shrink-0">
              <Trophy size={29} fill="#f5c542" className="text-[#f5c542]" />
            </div>

            <div>
              <p className="text-[#c6c6c6] text-[15px]">कुल विजेता</p>

              <p className="text-white text-[27px] font-extrabold leading-none mt-1">
                0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet */}
      <div
        className="mt-5 rounded-[20px] border border-[#80631f] px-5 py-4 flex items-center justify-between"
        style={{
          background: "linear-gradient(110deg, #17130a 0%, #0b0b0b 60%)",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-[60px] h-[60px] rounded-full border border-[#80631f] bg-black/50 flex items-center justify-center">
            <Wallet size={31} fill="#f5c542" className="text-[#f5c542]" />
          </div>

          <div>
            <p className="text-[#d2d2d2] text-[16px]">वॉलेट बैलेंस</p>

            <p className="text-[#f5c542] text-[27px] font-extrabold mt-0.5">
              ₹{formattedWalletBalance}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="rounded-xl px-5 py-4 text-black text-[17px] font-extrabold whitespace-nowrap flex items-center gap-2"
          style={{
            background:
              "linear-gradient(180deg, #FFD966 0%, #f5c542 50%, #d4a017 100%)",
            boxShadow:
              "0 4px 18px rgba(245,197,66,0.25), inset 0 1px 0 rgba(255,255,255,0.45)",
          }}
        >
          <HandCoins size={22} strokeWidth={2.5} />
          पैसे निकालें
        </button>
      </div>

      {/* Menu */}
      <div className="mt-4 flex flex-col gap-3">
        <ProfileMenu
          icon={<Ticket />}
          title="मेरे टिकट"
          description="अपने सभी टिकट देखें"
          onClick={() => navigate("/my-tickets")}
        />

        <ProfileMenu
          icon={<Trophy />}
          title="रिजल्ट"
          description="सभी ड्रॉ के परिणाम देखें"
          onClick={() => navigate("/result")}
        />

        <ProfileMenu
          icon={<Headphones />}
          title="सहायता"
          description="किसी भी समस्या के लिए हमसे संपर्क करें"
        />

        <button
          type="button"
          disabled={logoutLoading}
          onClick={handleLogout}
          className="w-full rounded-[18px] border border-[#303030] bg-[#0b0c0c] px-7 py-4 flex items-center gap-5 text-left transition active:scale-[0.99] disabled:opacity-60"
        >
          <div className="w-[60px] h-[60px] rounded-full border border-[#80631f] bg-black/50 flex items-center justify-center flex-shrink-0">
            {logoutLoading ? (
              <Loader2 size={29} className="text-[#f5c542] animate-spin" />
            ) : (
              <LogOut size={31} className="text-[#f5c542]" />
            )}
          </div>

          <div className="flex-1">
            <p className="text-white text-[21px] font-extrabold">
              {logoutLoading ? "लॉग आउट हो रहा है..." : "लॉग आउट"}
            </p>

            <p className="text-[#bcbcbc] text-[14px] mt-1">
              अपने खाते से बाहर निकलें
            </p>
          </div>

          {!logoutLoading && (
            <ChevronRight size={31} className="text-white flex-shrink-0" />
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="mt-7 flex flex-col items-center">
        <div className="w-full flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#f5c542] to-[#f5c542]" />

          <div className="text-[#f5c542]">
            <LotusSmall />
          </div>

          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#f5c542] to-[#f5c542]" />
        </div>

        <p className="text-[#f5c542] text-[17px] mt-1">खेलो विश्वास के साथ</p>
      </div>
    </div>
  );
};

const ProfileMenu = ({ icon, title, description, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[18px] border border-[#303030] bg-[#0b0c0c] px-7 py-4 flex items-center gap-5 text-left transition active:scale-[0.99]"
    >
      <div className="w-[60px] h-[60px] rounded-full border border-[#80631f] bg-black/50 flex items-center justify-center flex-shrink-0">
        <span className="text-[#f5c542]">{icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-[21px] font-extrabold">{title}</p>

        <p className="text-[#bcbcbc] text-[14px] mt-1 truncate">
          {description}
        </p>
      </div>

      <ChevronRight size={31} className="text-white flex-shrink-0" />
    </button>
  );
};

const LotusDecoration = () => (
  <svg width="330" height="330" viewBox="0 0 330 330" fill="none">
    <path
      d="M165 30C142 74 143 106 165 138C187 106 188 74 165 30Z"
      stroke="#f5c542"
      strokeWidth="2"
    />

    <path
      d="M165 70C117 77 90 101 81 142C116 142 144 125 165 70Z"
      stroke="#f5c542"
      strokeWidth="2"
    />

    <path
      d="M165 70C213 77 240 101 249 142C214 142 186 125 165 70Z"
      stroke="#f5c542"
      strokeWidth="2"
    />

    <path
      d="M82 142C65 171 68 201 92 225C117 206 123 177 82 142Z"
      stroke="#f5c542"
      strokeWidth="2"
    />

    <path
      d="M248 142C265 171 262 201 238 225C213 206 207 177 248 142Z"
      stroke="#f5c542"
      strokeWidth="2"
    />

    <path
      d="M165 138C125 145 104 169 104 204C132 200 155 181 165 138Z"
      stroke="#f5c542"
      strokeWidth="2"
    />

    <path
      d="M165 138C205 145 226 169 226 204C198 200 175 181 165 138Z"
      stroke="#f5c542"
      strokeWidth="2"
    />
  </svg>
);

const LotusSmall = () => (
  <svg width="46" height="30" viewBox="0 0 46 30" fill="none">
    <path d="M23 2C19 7 19 12 23 16C27 12 27 7 23 2Z" fill="#f5c542" />

    <path d="M23 13C15 13 9 17 6 23C13 24 19 21 23 13Z" fill="#f5c542" />

    <path d="M23 13C31 13 37 17 40 23C33 24 27 21 23 13Z" fill="#f5c542" />

    <path d="M23 13C20 19 20 24 23 28C26 24 26 19 23 13Z" fill="#f5c542" />
  </svg>
);

export default ProfilePage;
