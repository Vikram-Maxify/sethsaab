import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";

// ================= CLIENT =================
import PrivateRoute from "./Components/PrivateRoute";
import PhoneLayout from "./Layout/PhoneLayout";

import BuyTicket from "./Pages/BuyTicket";
import HomePage from "./Pages/HomePage";
import Login from "./Pages/Login";
import MyTickets from "./Pages/MyTickets";
import ProfilePage from "./Pages/ProfilePage";
import Register from "./Pages/Register";
import ResultPage from "./Pages/ResultPage";
import PaymentSuccess from "./Pages/PaymentSuccess";
import WithdrawalRequest from "./Pages/WithdrawalRequest";

// ================= ADMIN =================
import AdminLayout from "./admin/adminComponents/AdminLayout";
import AdminPrivateRoute from "./admin/adminComponents/PrivateRoute";

import AdminLogin from "./admin/adminPages/AdminLogin";
import Amount from "./admin/adminPages/Amount";
import Dashboard from "./admin/adminPages/Dashboard";
import AdminResults from "./admin/adminPages/Results";
import Users from "./admin/adminPages/Users";
import LotteryConfig from "./admin/adminPages/LotteryConfig";
import AdminLottery from "./admin/adminPages/AdminLottery";
import AdminDeposits from "./admin/adminPages/AdminDeposits";
import WithdrawalManagement from "./admin/adminPages/WithdrawalManagement";

// ==========================================================
// WHATSAPP SUPPORT NUMBER
// ==========================================================
const WHATSAPP_NUMBER = "91XXXXXXXXXX";

// ==========================================================
// WHATSAPP FLOATING BUTTON
// ==========================================================
const WhatsappFloatingButton = () => {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      "Hello, mujhe support chahiye."
    );

    const whatsappUrl =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <button
      type="button"
      onClick={handleWhatsAppClick}
      aria-label="WhatsApp Support"
      className="
        fixed
        left-4
        bottom-5
        z-[9999]
        flex
        h-[58px]
        w-[58px]
        items-center
        justify-center
        rounded-full
        border-2
        border-white/20
        bg-[#25D366]
        text-white
        shadow-[0_5px_25px_rgba(37,211,102,0.45)]
        transition-all
        duration-200
        hover:scale-110
        active:scale-95
      "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="h-[34px] w-[34px]"
        fill="currentColor"
      >
        <path d="M19.11 17.24c-.27-.14-1.58-.78-1.82-.87-.24-.09-.42-.14-.6.14-.18.27-.69.87-.85 1.05-.16.18-.31.2-.58.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.56.12-.12.27-.31.4-.47.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.47-.07-.14-.6-1.45-.82-1.99-.22-.52-.43-.45-.6-.46h-.51c-.18 0-.47.07-.71.34-.24.27-.94.92-.94 2.24s.96 2.6 1.09 2.78c.14.18 1.89 2.89 4.58 4.05.64.28 1.14.45 1.53.58.64.2 1.22.17 1.68.1.51-.08 1.58-.65 1.8-1.28.22-.63.22-1.17.16-1.28-.05-.11-.24-.18-.51-.31z" />

        <path d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.67-1.71A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-2.01 0-3.98-.54-5.71-1.57l-.41-.24-3.96 1.01 1.06-3.86-.27-.42A10.78 10.78 0 0 1 5.22 16C5.22 10.05 10.05 5.22 16 5.22S26.78 10.05 26.78 16 21.95 26.8 16 26.8z" />
      </svg>

      <span
        className="
          absolute
          -right-1
          -top-1
          h-4
          w-4
          rounded-full
          border-2
          border-[#050505]
          bg-red-500
        "
      />
    </button>
  );
};

// ==========================================================
// WHATSAPP VISIBILITY
// ==========================================================
const WhatsappForUser = () => {
  const location = useLocation();

  // Admin ke saare routes par WhatsApp hide rahega
  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname === "/dashboard" ||
    location.pathname === "/users" ||
    location.pathname === "/amount" ||
    location.pathname === "/lottery-config";

  if (isAdminRoute) {
    return null;
  }

  return <WhatsappFloatingButton />;
};

function App() {
  return (
    <>
      <Routes>
        {/* =====================================================
            CLIENT ROUTES
        ===================================================== */}
        <Route element={<PhoneLayout />}>

          {/* ================= CLIENT PUBLIC ================= */}

          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* CLIENT RESULTS */}
          <Route
            path="/results"
            element={<ResultPage />}
          />

          {/* ================= CLIENT PRIVATE ================= */}

          <Route element={<PrivateRoute />}>

            <Route
              path="/profile"
              element={<ProfilePage />}
            />

            <Route
              path="/buy-ticket"
              element={<BuyTicket />}
            />

            <Route
              path="/my-tickets"
              element={<MyTickets />}
            />

            <Route
              path="/user/withdraw"
              element={<WithdrawalRequest />}
            />

            <Route
              path="/payment-success"
              element={<PaymentSuccess />}
            />

          </Route>
        </Route>

        {/* =====================================================
            ADMIN PUBLIC ROUTES
        ===================================================== */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* =====================================================
            ADMIN PRIVATE ROUTES
        ===================================================== */}

        <Route element={<AdminPrivateRoute />}>
          <Route element={<AdminLayout />}>

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* Users */}
            <Route
              path="/users"
              element={<Users />}
            />

            {/* Amount */}
            <Route
              path="/amount"
              element={<Amount />}
            />

            {/* ADMIN RESULTS */}
            <Route
              path="/admin/results"
              element={<AdminResults />}
            />

            {/* Lottery Config */}
            <Route
              path="/lottery-config"
              element={<LotteryConfig />}
            />

            {/* Admin Lottery */}
            <Route
              path="/admin/lottery"
              element={<AdminLottery />}
            />

            {/* Admin Deposits */}
            <Route
              path="/admin/deposits"
              element={<AdminDeposits />}
            />

            {/* Admin Withdrawals */}
            <Route
              path="/admin/withdrawals"
              element={<WithdrawalManagement />}
            />

          </Route>
        </Route>

        {/* =====================================================
            DEFAULT
        ===================================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

      {/* =====================================================
          WHATSAPP - USER SIDE ONLY
      ===================================================== */}
      <WhatsappForUser />
    </>
  );
}

export default App;