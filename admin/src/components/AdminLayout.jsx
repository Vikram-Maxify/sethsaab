import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  adminLogout,
} from "../redux/reducers/adminAuthReducer";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    admin,
    loading,
  } = useSelector(
    (state) => state.adminAuth
  );

  const handleLogout = async () => {
    const result = await dispatch(
      adminLogout()
    );

    if (
      adminLogout.fulfilled.match(result)
    ) {
      navigate("/login", {
        replace: true,
      });
    }
  };

  const navClass = ({ isActive }) =>
    `
      flex items-center gap-3 rounded-lg px-4 py-3
      text-sm font-medium transition
      ${
        isActive
          ? "bg-white/10 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }
    `;

  return (
    <div className="min-h-screen bg-slate-100">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-950">

        {/* Logo */}

        <div className="flex h-16 items-center border-b border-slate-800 px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
              <span className="font-bold text-slate-950">
                A
              </span>
            </div>

            <span className="text-lg font-bold text-white">
              Admin Panel
            </span>

          </div>

        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1 px-3 py-6">

          <NavLink
            to="/dashboard"
            className={navClass}
          >
            <span>📊</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/users"
            className={navClass}
          >
            <span>👥</span>
            Users
          </NavLink>

          <NavLink
            to="/results"
            className={navClass}
          >
            <span>📋</span>
            Results
          </NavLink>

          <NavLink
            to="/settings"
            className={navClass}
          >
            <span>⚙️</span>
            Settings
          </NavLink>

        </nav>

        {/* Logout */}

        <div className="border-t border-slate-800 p-4">

          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
          >
            <span>↪</span>

            {loading
              ? "Logging out..."
              : "Logout"}
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <div className="ml-64">

        {/* Header */}

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Dashboard
            </h2>
          </div>

          {/* Admin */}

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold text-slate-900">
                {admin?.name || "Admin"}
              </p>

              <p className="text-xs text-slate-500">
                {admin?.mobile || ""}
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              {admin?.name
                ?.charAt(0)
                ?.toUpperCase() || "A"}
            </div>

          </div>

        </header>

        {/* Page Content */}

        <main className="p-6 lg:p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;