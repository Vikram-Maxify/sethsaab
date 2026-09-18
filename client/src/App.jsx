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
import Dashboard from "./admin/adminPages/Dashboard";

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

        {/* Client Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/buy-ticket" element={<BuyTicket />} />
          <Route path="/my-tickets" element={<MyTickets />} />
        </Route>
      </Route>

      {/* =====================================================
          ADMIN ROUTES
      ===================================================== */}

      <Route element={<AdminPrivateRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
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
