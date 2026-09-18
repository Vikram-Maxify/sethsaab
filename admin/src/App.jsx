import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import './App.css'


import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import PrivateRoute from "./components/PrivateRoute";
import AdminLayout from "./components/AdminLayout";

const App = () => {
  return (
    <BrowserRouter>

      <Routes>

        {/* =====================
            PUBLIC
        ===================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =====================
            PRIVATE
        ===================== */}

        <Route element={<PrivateRoute />}>

          <Route element={<AdminLayout />}>

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

          </Route>

        </Route>

        {/* =====================
            DEFAULT
        ===================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
};

export default App;