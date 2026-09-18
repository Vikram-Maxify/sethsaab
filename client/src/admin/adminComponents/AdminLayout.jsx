import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import { adminLogout } from "../../reducer/slice/adminAuthReducer";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { admin, loading } = useSelector((state) => state.adminAuth);

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    const result = await dispatch(adminLogout());

    if (adminLogout.fulfilled.match(result)) {
      navigate("/admin/login", {
        replace: true,
      });
    }
  };

  // =========================
  // NAV LINK CLASS
  // =========================
  const navClass = ({ isActive }) =>
    `
      flex items-center gap-3 rounded-lg px-4 py-3
      text-sm font-medium transition
      ${isActive
      ? "bg-white/10 text-white"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
    }
    `;

  // =========================
  // PAGE TITLE
  // =========================
  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/dashboard") {
      return "Dashboard";
    }

    if (path === "/users") {
      return "Users";
    }

    if (path === "/results") {
      return "Results";
    }

    if (path === "/amount") {
      return "Amount";
    }

    if (path === "/settings") {
      return "Settings";
    }

    if (path === '/lottery-config') {
      return "Config"
    }

    if (path ==='/admin/lottery'){
      return "Admin_config"
    }

    return "Admin Panel";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* =========================
          SIDEBAR
      ========================= */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-950">
        {/* LOGO */}
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
              <span className="font-bold text-slate-950">A</span>
            </div>

            <span className="text-lg font-bold text-white">Admin Panel</span>
          </div>
        </div>

        {/* =========================
            NAVIGATION
        ========================= */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          <NavLink to="/dashboard" className={navClass}>
            <span>📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/users" className={navClass}>
            <span>👥</span>
            <span>Users</span>
          </NavLink>

          <NavLink to="/results" className={navClass}>
            <span>📋</span>
            <span>Results</span>
          </NavLink>
          <NavLink
            to="/admin/lottery"
            className={navClass}
          >
            <span>⚙️</span>
            <span>Config</span>
          </NavLink>

          <NavLink to="/amount" className={navClass}>
            <span>💰</span>
            <span>Amount</span>
          </NavLink>

          <NavLink to="/settings" className={navClass}>
            <span>⚙️</span>
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* =========================
            ADMIN PROFILE
        ========================= */}
        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
              {admin?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {admin?.name || "Admin"}
              </p>

              <p className="truncate text-xs text-slate-500">
                {admin?.mobile || ""}
              </p>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>↪</span>

            <span>{loading ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* =========================
          MAIN
      ========================= */}
      <div className="ml-64">
        {/* =========================
            HEADER
        ========================= */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {getPageTitle()}
            </h2>
          </div>

          {/* ADMIN */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {admin?.name || "Admin"}
              </p>

              <p className="text-xs text-slate-500">{admin?.mobile || ""}</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              {admin?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* =========================
            PAGE CONTENT
        ========================= */}
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
