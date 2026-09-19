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

// ================= ADMIN =================
import AdminLayout from "./admin/adminComponents/AdminLayout";
import AdminPrivateRoute from "./admin/adminComponents/PrivateRoute";

import AdminLogin from "./admin/adminPages/AdminLogin";
import Amount from "./admin/adminPages/Amount";
import Dashboard from "./admin/adminPages/Dashboard";
import Results from "./admin/adminPages/Results";
import Users from "./admin/adminPages/Users";
import LotteryConfig from "./admin/adminPages/LotteryConfig";
import AdminLottery from "./admin/adminPages/AdminLottery";
import PaymentSuccess from "./Pages/PaymentSuccess";

function App() {
  return (
    <Routes>
      {/* =====================================================
          CLIENT ROUTES
      ===================================================== */}

      <Route element={<PhoneLayout />}>
        {/* Client Public Routes */}
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/" element={<HomePage />} />

        {/* Client Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/buy-ticket" element={<BuyTicket />} />

          <Route path="/my-tickets" element={<MyTickets />} />
          <Route
            path="/payment-success"
            element={<PaymentSuccess />}
          />
        </Route>
      </Route>

      {/* =====================================================
          ADMIN PUBLIC ROUTES
      ===================================================== */}

      <Route path="/admin/login" element={<AdminLogin />} />

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

          <Route
            path="/amount"
            element={<Amount />}
          />
          <Route
            path="/results"
            element={<Results />}
          />
          <Route
            path="/lottery-config"
            element={<LotteryConfig />}
          />
          <Route
            path="/admin/lottery"
            element={<AdminLottery />}
          />

        </Route>

      </Route>
      {/* =====================================================
          DEFAULT
      ===================================================== */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
