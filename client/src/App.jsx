import { Navigate, Route, Routes } from "react-router-dom";
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
import Recharge from "./Pages/Rechagre";

// ==========================================================
// WHATSAPP SUPPORT NUMBER
// ==========================================================
const WHATSAPP_NUMBER = "+917234806209";

// ==========================================================
// ADMIN ROUTES LIST
// ==========================================================
const ADMIN_ROUTES = ["/admin"];

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


          {/* =================================================
              CLIENT PRIVATE ROUTES
              Login required for all routes below
          ================================================= */}

          <Route element={<PrivateRoute />}>

            {/* Profile */}
            <Route
              path="/profile"
              element={<ProfilePage />}
            />

            {/* Buy Ticket */}
            <Route
              path="/buy-ticket"
              element={<BuyTicket />}
            />

            {/* My Tickets */}
            <Route
              path="/my-tickets"
              element={<MyTickets />}
            />

            {/* Results - LOGIN REQUIRED */}
            <Route
              path="/results"
              element={<ResultPage />}
            />

            {/* Withdraw */}
            <Route
              path="/user/withdraw"
              element={<WithdrawalRequest />}
            />

            {/* Recharge */}
            <Route
              path="/recharge"
              element={<Recharge />}
            />

            {/* Payment Success */}
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
            Login required
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

            {/* Admin Results */}
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
          ADMIN SIDE HIDDEN
      ===================================================== */}

    </>
  );
}

export default App;
