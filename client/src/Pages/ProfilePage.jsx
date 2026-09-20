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
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate } from "react-router-dom";

import {
  logout,
  updateProfile,
  clearUpdateProfileState,
} from "../reducer/slice/authSlice";

import {
  getMyLotteryEntries,
  selectMyLotteryEntriesLoading,
  selectMyLotteryTotalEntries,
} from "../reducer/slice/createLotteryConfigSlice";

// ==========================================================
// WHATSAPP SUPPORT NUMBER
// IMPORTANT: Country code ke saath number likhein.
// Example India: 919876543210
// ==========================================================

const WHATSAPP_NUMBER = "91XXXXXXXXXX";

// ==========================================================
// GLOW STYLE (yellow highlight for icons)
// ==========================================================

const GLOW_STYLE = {
  filter:
    "drop-shadow(0 0 7px rgba(245,197,66,0.95)) drop-shadow(0 0 18px rgba(245,197,66,0.7)) drop-shadow(0 0 30px rgba(245,197,66,0.4))",
};

// ==========================================================
// PROFILE PAGE
// ==========================================================

const ProfilePage = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  // ========================================================
  // AUTH STATE
  // ========================================================

  const {
    user,
    logoutLoading,
    updateProfileLoading,
    updateProfileError,
  } = useSelector((state) => state.auth);

  // ========================================================
  // LOTTERY DATA
  // ========================================================

  const totalTickets = useSelector(
    selectMyLotteryTotalEntries
  );

  const myEntriesLoading = useSelector(
    selectMyLotteryEntriesLoading
  );

  // ========================================================
  // EDIT PROFILE MODAL
  // ========================================================

  const [showEditModal, setShowEditModal] =
    useState(false);

  // ========================================================
  // FORM DATA
  // ========================================================

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
  });

  // ========================================================
  // FETCH USER LOTTERY ENTRIES
  // ========================================================

  useEffect(() => {
    if (user) {
      dispatch(getMyLotteryEntries());
    }
  }, [dispatch, user]);

  // ========================================================
  // OPEN EDIT PROFILE
  // ========================================================

  const handleOpenEditProfile = () => {
    dispatch(clearUpdateProfileState());

    setFormData({
      name: user?.name || "",
      mobile: user?.mobile || "",
      password: "",
    });

    setShowEditModal(true);
  };

  // ========================================================
  // CLOSE EDIT PROFILE
  // ========================================================

  const handleCloseEditProfile = () => {
    if (updateProfileLoading) {
      return;
    }

    setShowEditModal(false);

    setFormData({
      name: "",
      mobile: "",
      password: "",
    });

    dispatch(clearUpdateProfileState());
  };

  // ========================================================
  // FORM INPUT CHANGE
  // ========================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================================
  // UPDATE PROFILE
  // ========================================================

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();

    const mobile = formData.mobile.trim();

    const password = formData.password;

    // ======================================================
    // NAME VALIDATION
    // ======================================================

    if (!name) {
      return;
    }

    // ======================================================
    // MOBILE VALIDATION
    // ======================================================

    if (!mobile) {
      return;
    }

    // ======================================================
    // UPDATE DATA
    // Password blank hai to password request me nahi jayega
    // ======================================================

    const updateData = {
      name,
      mobile,
    };

    if (password.trim()) {
      updateData.password = password;
    }

    // ======================================================
    // API CALL
    // ======================================================

    const result = await dispatch(
      updateProfile(updateData)
    );

    // ======================================================
    // SUCCESS
    // ======================================================

    if (updateProfile.fulfilled.match(result)) {
      setShowEditModal(false);

      setFormData({
        name: "",
        mobile: "",
        password: "",
      });

      dispatch(clearUpdateProfileState());
    }
  };

  // ========================================================
  // LOGOUT
  // ========================================================

  const handleLogout = async () => {
    const result = await dispatch(logout());

    if (logout.fulfilled.match(result)) {
      navigate("/login", {
        replace: true,
      });
    }
  };

  // ========================================================
  // WHATSAPP SUPPORT
  // ========================================================

  const WHATSAPP_NUMBER = "917234806209";

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent(
      "Hello, mujhe support chahiye."
    );

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ========================================================
  // WALLET
  // ========================================================

  const walletBalance = Number(
    user?.wallet || 0
  );

  const formattedWalletBalance =
    walletBalance.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  // ========================================================
  // RETURN
  // ========================================================

  return (
    <div className="min-h-screen bg-[#050505] text-white px-5 pt-3 pb-6">

      {/* ==================================================
          PROFILE CARD
      ================================================== */}

      <div
        className="relative overflow-hidden rounded-[20px] p-4 border border-[#8d6b20]"
        style={{
          background:
            "radial-gradient(circle at 70% 0%, rgba(150,105,20,0.28) 0%, rgba(30,24,10,0.7) 35%, #080808 75%)",

          boxShadow:
            "0 0 35px rgba(245,197,66,0.08)",
        }}
      >

        {/* LOTUS DECORATION */}

        <div className="absolute right-[-15px] top-[-15px] opacity-[0.10] pointer-events-none">
          <LotusDecoration />
        </div>

        <div className="relative flex items-center gap-3 min-[450px]:gap-4">

          {/* PROFILE ICON */}
          <div className="w-[82px] h-[82px] min-[400px]:w-[92px] min-[400px]:h-[92px] min-[450px]:w-[112px] min-[450px]:h-[112px] rounded-full border-[3px] border-[#f5c542] flex-shrink-0 flex items-center justify-center">

            <div className="w-[70px] h-[70px] min-[400px]:w-[80px] min-[400px]:h-[80px] min-[450px]:w-[98px] min-[450px]:h-[98px] rounded-full bg-black/50 flex items-center justify-center overflow-hidden">

              <UserRound
                size={48}
                className="min-[400px]:w-[55px] min-[400px]:h-[55px] min-[450px]:w-[65px] min-[450px]:h-[65px] text-[#f5c542]"
                strokeWidth={1.4}
                style={GLOW_STYLE}
              />

            </div>
          </div>

          {/* USER INFO */}
          <div className="min-w-0 flex-1 pr-[75px] min-[400px]:pr-[85px] min-[450px]:pr-0">

            <p className="text-[#bcbcbc] text-[13px] min-[400px]:text-[14px] min-[450px]:text-[16px]">
              नमस्ते,
            </p>

            <h1 className="text-white text-[21px] min-[400px]:text-[24px] min-[450px]:text-[27px] font-extrabold leading-[1.3] truncate">
              {user?.name || "उपयोगकर्ता"}
            </h1>

            <p className="text-[#c9c9c9] text-[13px] min-[400px]:text-[14px] min-[450px]:text-[16px] mt-1">
              +91 {user?.mobile || "----------"}
            </p>

          </div>

          {/* EDIT BUTTON */}
          <button
            type="button"
            onClick={handleOpenEditProfile}
            className="
      absolute
      right-0
      top-[48px]
      min-[400px]:top-[54px]
      min-[450px]:top-[68px]
      border
      border-[#f5c542]
      text-[#f5c542]
      rounded-lg
      min-[450px]:rounded-xl
      px-2
      py-1.5
      min-[400px]:px-2.5
      min-[400px]:py-1.5
      min-[450px]:px-3
      min-[450px]:py-2
      flex
      items-center
      gap-1
      min-[400px]:gap-1.5
      min-[450px]:gap-2
      text-[10px]
      min-[400px]:text-[11px]
      min-[450px]:text-[13px]
      font-semibold
      whitespace-nowrap
      active:scale-95
      transition
    "
          >
            <Edit3
              size={13}
              className="min-[400px]:w-[14px] min-[400px]:h-[14px] min-[450px]:w-[16px] min-[450px]:h-[16px]"
              style={GLOW_STYLE}
            />
            संपादित करें
          </button>

        </div>

        {/* ==================================================
            TICKET / WINNER STATS
        ================================================== */}

        <div className="mt-5 h-[88px] rounded-2xl border border-[#373737] bg-black/40 flex items-center overflow-hidden">

          {/* TOTAL TICKETS */}

          <div className="flex-1 flex items-center gap-3 px-5">

            <div className="w-12 h-12 rounded-full bg-[#211b0b] flex items-center justify-center flex-shrink-0">

              <Ticket
                size={28}
                fill="#f5c542"
                className="text-[#f5c542]"
                style={GLOW_STYLE}
              />

            </div>

            <div>

              <p className="text-[#c6c6c6] text-[15px]">
                कुल टिकट
              </p>

              <p className="text-white text-[27px] font-extrabold leading-none mt-1">

                {myEntriesLoading ? (
                  <Loader2
                    size={24}
                    className="text-[#f5c542] animate-spin"
                    style={GLOW_STYLE}
                  />
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

              <Trophy
                size={29}
                fill="#f5c542"
                className="text-[#f5c542]"
                style={GLOW_STYLE}
              />

            </div>

            <div>

              <p className="text-[#c6c6c6] text-[15px]">
                कुल विजेता
              </p>

              <p className="text-white text-[27px] font-extrabold leading-none mt-1">
                0
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ==================================================
          WALLET
      ================================================== */}

      <div
        className="mt-5 rounded-[20px] border border-[#80631f] px-5 py-4 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(110deg, #17130a 0%, #0b0b0b 60%)",
        }}
      >

        <div className="flex items-center gap-4">

          <div className="w-[60px] h-[60px] rounded-full border border-[#80631f] bg-black/50 flex items-center justify-center">

            <Wallet
              size={31}
              fill="#f5c542"
              className="text-[#f5c542]"
              style={GLOW_STYLE}
            />

          </div>

          <div>

            <p className="text-[#d2d2d2] text-[16px]">
              वॉलेट बैलेंस
            </p>

            <p className="text-[#f5c542] text-[27px] font-extrabold mt-0.5">
              ₹{formattedWalletBalance}
            </p>

          </div>

        </div>

        {/* WITHDRAW BUTTON */}

        <button
          type="button"
          onClick={() => navigate("/user/withdraw")}
          className="rounded-xl px-5 py-4 text-black text-[17px] font-extrabold whitespace-nowrap flex items-center gap-2"
          style={{
            background:
              "linear-gradient(180deg, #FFD966 0%, #f5c542 50%, #d4a017 100%)",

            boxShadow:
              "0 4px 18px rgba(245,197,66,0.25), inset 0 1px 0 rgba(255,255,255,0.45)",
          }}
        >

          <HandCoins
            size={22}
            strokeWidth={2.5}
          />

          पैसे निकालें

        </button>

      </div>

      {/* ==================================================
          MENU
      ================================================== */}

      <div className="mt-4 flex flex-col gap-3">

        {/* MY TICKETS */}

        <ProfileMenu
          icon={<Ticket />}
          title="मेरे टिकट"
          description="अपने सभी टिकट देखें"
          onClick={() => navigate("/my-tickets")}
        />

        {/* RESULT */}

        <ProfileMenu
          icon={<Trophy />}
          title="रिजल्ट"
          description="सभी ड्रॉ के परिणाम देखें"
          onClick={() => navigate("/results")}
        />

        {/* WHATSAPP SUPPORT */}

        <ProfileMenu
          icon={<Headphones />}
          title="सहायता"
          description="किसी भी समस्या के लिए हमसे संपर्क करें"
          onClick={handleWhatsAppSupport}
        />

        {/* LOGOUT */}

        <button
          type="button"
          disabled={logoutLoading}
          onClick={handleLogout}
          className="w-full rounded-[18px] border border-[#303030] bg-[#0b0c0c] px-7 py-4 flex items-center gap-5 text-left transition active:scale-[0.99] disabled:opacity-60"
        >

          <div className="w-[60px] h-[60px] rounded-full border border-[#80631f] bg-black/50 flex items-center justify-center flex-shrink-0">

            {logoutLoading ? (
              <Loader2
                size={29}
                className="text-[#f5c542] animate-spin"
                style={GLOW_STYLE}
              />
            ) : (
              <LogOut
                size={31}
                className="text-[#f5c542]"
                style={GLOW_STYLE}
              />
            )}

          </div>

          <div className="flex-1">

            <p className="text-white text-[21px] font-extrabold">

              {logoutLoading
                ? "लॉग आउट हो रहा है..."
                : "लॉग आउट"}

            </p>

            <p className="text-[#bcbcbc] text-[14px] mt-1">
              अपने खाते से बाहर निकलें
            </p>

          </div>

          {!logoutLoading && (
            <ChevronRight
              size={31}
              className="text-white flex-shrink-0"
            />
          )}

        </button>

      </div>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <div className="mt-7 flex flex-col items-center">

        <div className="w-full flex items-center gap-4">

          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#f5c542] to-[#f5c542]" />

          <div className="text-[#f5c542]">
            <LotusSmall />
          </div>

          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#f5c542] to-[#f5c542]" />

        </div>

        <p className="text-[#f5c542] text-[17px] mt-1">
          खेलो विश्वास के साथ
        </p>

      </div>

      {/* ==================================================
          EDIT PROFILE MODAL
      ================================================== */}

      {showEditModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">

          <div
            className="w-full max-w-md rounded-[24px] border border-[#80631f] p-5 relative max-h-[90vh] overflow-y-auto"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(150,105,20,0.22) 0%, #0b0b0b 55%)",

              boxShadow:
                "0 0 40px rgba(245,197,66,0.12)",
            }}
          >

            {/* CLOSE BUTTON */}

            <button
              type="button"
              onClick={handleCloseEditProfile}
              disabled={updateProfileLoading}
              className="absolute right-4 top-4 w-9 h-9 rounded-full border border-[#3a3a3a] flex items-center justify-center text-[#bcbcbc] hover:text-white disabled:opacity-40"
            >
              <X size={20} />
            </button>

            {/* HEADER */}

            <div className="pr-12 mb-6">

              <p className="text-[#bcbcbc] text-sm">
                प्रोफाइल
              </p>

              <h2 className="text-white text-2xl font-extrabold mt-1">
                प्रोफाइल संपादित करें
              </h2>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleUpdateProfile}
              className="flex flex-col gap-4"
            >

              {/* NAME */}

              <div>

                <label className="block text-[#d2d2d2] text-sm mb-2">
                  नाम
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="अपना नाम दर्ज करें"
                  disabled={updateProfileLoading}
                  className="w-full rounded-xl border border-[#3b3b3b] bg-[#111111] px-4 py-3.5 text-white outline-none focus:border-[#f5c542] disabled:opacity-60"
                />

              </div>

              {/* MOBILE */}

              <div>

                <label className="block text-[#d2d2d2] text-sm mb-2">
                  मोबाइल नंबर
                </label>

                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setFormData((prev) => ({
                      ...prev,
                      mobile: value,
                    }));
                  }}
                  placeholder="मोबाइल नंबर"
                  disabled={updateProfileLoading}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-[#3b3b3b] bg-[#111111] px-4 py-3.5 text-white outline-none focus:border-[#f5c542] disabled:opacity-60"
                />

              </div>

              {/* PASSWORD */}

              <div>

                <label className="block text-[#d2d2d2] text-sm mb-2">

                  नया पासवर्ड

                  <span className="text-[#777] ml-2">
                    (optional)
                  </span>

                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="नया पासवर्ड"
                  disabled={updateProfileLoading}
                  className="w-full rounded-xl border border-[#3b3b3b] bg-[#111111] px-4 py-3.5 text-white outline-none focus:border-[#f5c542] disabled:opacity-60"
                />

                <p className="text-[#777] text-xs mt-2">
                  Password change nahi karna hai to blank chhod dein.
                </p>

              </div>

              {/* ERROR */}

              {updateProfileError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">

                  <p className="text-red-400 text-sm">
                    {updateProfileError}
                  </p>

                </div>
              )}

              {/* BUTTONS */}

              <div className="flex gap-3 mt-2">

                {/* CANCEL */}

                <button
                  type="button"
                  onClick={handleCloseEditProfile}
                  disabled={updateProfileLoading}
                  className="flex-1 rounded-xl border border-[#3a3a3a] bg-[#111111] py-3.5 text-white font-bold disabled:opacity-50"
                >
                  रद्द करें
                </button>

                {/* SAVE */}

                <button
                  type="submit"
                  disabled={updateProfileLoading}
                  className="flex-1 rounded-xl py-3.5 text-black font-extrabold flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{
                    background:
                      "linear-gradient(180deg, #FFD966 0%, #f5c542 50%, #d4a017 100%)",

                    boxShadow:
                      "0 4px 18px rgba(245,197,66,0.20)",
                  }}
                >

                  {updateProfileLoading ? (
                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />

                      अपडेट हो रहा है...
                    </>
                  ) : (
                    "सेव करें"
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

// ==========================================================
// PROFILE MENU
// ==========================================================

const ProfileMenu = ({
  icon,
  title,
  description,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[18px] border border-[#303030] bg-[#0b0c0c] px-7 py-4 flex items-center gap-5 text-left transition active:scale-[0.99]"
    >
      <div className="w-[60px] h-[60px] rounded-full border border-[#80631f] bg-black/50 flex items-center justify-center flex-shrink-0">
        <span
          className="text-[#f5c542] inline-flex"
          style={GLOW_STYLE}
        >
          {icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-[21px] font-extrabold">
          {title}
        </p>

        <p className="text-[#bcbcbc] text-[14px] mt-1 truncate">
          {description}
        </p>
      </div>

      <ChevronRight
        size={31}
        className="text-white flex-shrink-0"
      />
    </button>
  );
};

// ==========================================================
// LOTUS DECORATION
// ==========================================================

const LotusDecoration = () => (
  <svg
    width="330"
    height="330"
    viewBox="0 0 330 330"
    fill="none"
  >

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

// ==========================================================
// SMALL LOTUS
// ==========================================================

const LotusSmall = () => (
  <svg
    width="46"
    height="30"
    viewBox="0 0 46 30"
    fill="none"
  >

    <path
      d="M23 2C19 7 19 12 23 16C27 12 27 7 23 2Z"
      fill="#f5c542"
    />

    <path
      d="M23 13C15 13 9 17 6 23C13 24 19 21 23 13Z"
      fill="#f5c542"
    />

    <path
      d="M23 13C31 13 37 17 40 23C33 24 27 21 23 13Z"
      fill="#f5c542"
    />

    <path
      d="M23 13C20 19 20 24 23 28C26 24 26 19 23 13Z"
      fill="#f5c542"
    />

  </svg>
);

export default ProfilePage;