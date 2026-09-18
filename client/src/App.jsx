import { Route, Routes } from "react-router-dom";
import "./App.css";

import PrivateRoute from "./Components/PrivateRoute";
import PhoneLayout from "./Layout/PhoneLayout";
import BuyTicket from "./Pages/BuyTicket";
import HomePage from "./Pages/HomePage";
import Login from "./Pages/Login";
import MyTickets from "./Pages/MyTickets";
import ProfilePage from "./Pages/ProfilePage";
import Register from "./Pages/Register";

function App() {
  return (
    <Routes>
      <Route element={<PhoneLayout />}>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/buy-ticket" element={<BuyTicket />} />
          <Route path="/my-tickets" element={<MyTickets />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
