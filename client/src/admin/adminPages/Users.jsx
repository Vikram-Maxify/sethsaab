import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getAllUsers,
  updateUserProfile,
  clearAdminError,
  clearAdminMessage,
} from "../../reducer/slice/adminAuthReducer";

const Users = () => {
  const dispatch = useDispatch();

  // =====================================
  // REDUX STATE
  // =====================================

  const {
    users = [],
    usersLoading,
    usersError,
    updateLoading,
    error,
    message,
  } = useSelector((state) => state.adminAuth);

  // =====================================
  // LOCAL STATE
  // =====================================

  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
  });

  // =====================================
  // GET ALL USERS
  // =====================================

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  // =====================================
  // INPUT CHANGE
  // =====================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================
  // OPEN EDIT MODAL
  // =====================================

  const handleEdit = (user) => {
    setSelectedUser(user);

    setFormData({
      name: user.name || "",
      mobile: user.mobile || "",
      password: "",
    });

    dispatch(clearAdminError());
    dispatch(clearAdminMessage());
  };

  // =====================================
  // CLOSE EDIT MODAL
  // =====================================

  const handleCloseEdit = () => {
    setSelectedUser(null);

    setFormData({
      name: "",
      mobile: "",
      password: "",
    });

    dispatch(clearAdminError());
    dispatch(clearAdminMessage());
  };

  // =====================================
  // UPDATE USER
  // =====================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedUser) return;

    const updateData = {
      uuid: selectedUser.uuid,
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
    };

    // Password only send if entered
    if (formData.password.trim()) {
      updateData.password = formData.password;
    }

    const result = await dispatch(
      updateUserProfile(updateData)
    );

    if (updateUserProfile.fulfilled.match(result)) {
      setSelectedUser(null);

      setFormData({
        name: "",
        mobile: "",
        password: "",
      });
    }
  };

  // =====================================
  // REFRESH USERS
  // =====================================

  const handleRefresh = () => {
    dispatch(clearAdminError());
    dispatch(getAllUsers());
  };

  // =====================================
  // FORMAT DATE
  // =====================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Users
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage all registered users
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* Total Users */}

          <div className="rounded-xl bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">
              Total Users
            </p>

            <p className="text-xl font-bold text-gray-900">
              {users.length}
            </p>
          </div>

          {/* Refresh */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={usersLoading}
            className="rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {usersLoading ? "Loading..." : "Refresh"}
          </button>

        </div>
      </div>

      {/* =====================================
          SUCCESS MESSAGE
      ===================================== */}

      {message && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

          <span>{message}</span>

          <button
            type="button"
            onClick={() =>
              dispatch(clearAdminMessage())
            }
            className="ml-4 text-lg font-bold"
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================
          ERROR MESSAGE
      ===================================== */}

      {(usersError || error) && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <span>{usersError || error}</span>

          <button
            type="button"
            onClick={() =>
              dispatch(clearAdminError())
            }
            className="ml-4 text-lg font-bold"
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================
          USERS TABLE
      ===================================== */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[950px]">

            {/* =================================
                TABLE HEADER
            ================================= */}

            <thead className="border-b bg-gray-50">

              <tr>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  #
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  User
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Mobile
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Wallet
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  UUID
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </th>

              </tr>

            </thead>

            {/* =================================
                TABLE BODY
            ================================= */}

            <tbody className="divide-y divide-gray-100">

              {usersLoading ? (

                // Loading
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">

                      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

                      <p className="text-sm text-gray-500">
                        Loading users...
                      </p>

                    </div>
                  </td>
                </tr>

              ) : users.length > 0 ? (

                // Users
                users.map((user, index) => (

                  <tr
                    key={user.uuid || user._id}
                    className="transition hover:bg-gray-50"
                  >

                    {/* =====================
                        #
                    ===================== */}

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {index + 1}
                    </td>

                    {/* =====================
                        USER
                    ===================== */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">

                          {user.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}

                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-medium text-gray-900">
                            {user.name || "-"}
                          </p>

                          <p className="text-xs text-gray-500">
                            User
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* =====================
                        MOBILE
                    ===================== */}

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.mobile || "-"}
                    </td>

                    {/* =====================
                        ROLE
                    ===================== */}

                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role || "user"}
                      </span>

                    </td>

                    {/* =====================
                        WALLET
                    ===================== */}

                    <td className="px-6 py-4">

                      <span className="font-semibold text-gray-900">
                        ₹
                        {Number(
                          user.wallet || 0
                        ).toFixed(2)}
                      </span>

                    </td>

                    {/* =====================
                        UUID
                    ===================== */}

                    <td className="px-6 py-4">

                      <span className="inline-block max-w-[180px] truncate rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
                        {user.uuid || "-"}
                      </span>

                    </td>

                    {/* =====================
                        CREATED
                    ===================== */}

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* =====================
                        ACTION
                    ===================== */}

                    <td className="px-6 py-4 text-right">

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(user)
                        }
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                      >
                        Edit
                      </button>

                    </td>

                  </tr>

                ))

              ) : (

                // Empty
                <tr>

                  <td
                    colSpan="8"
                    className="px-6 py-16 text-center"
                  >

                    <div className="flex flex-col items-center">

                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                        👤
                      </div>

                      <p className="font-medium text-gray-900">
                        No users found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        There are no registered users.
                      </p>

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================
          EDIT USER MODAL
      ===================================== */}

      {selectedUser && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseEdit}
        >

          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* =================================
                MODAL HEADER
            ================================= */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  Edit User
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Update user profile information
                </p>

              </div>

              <button
                type="button"
                onClick={handleCloseEdit}
                className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            {/* =================================
                FORM
            ================================= */}

            <form
              onSubmit={handleUpdate}
              className="space-y-5 p-6"
            >

              {/* Name */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  placeholder="Enter user name"
                />

              </div>

              {/* Mobile */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mobile
                </label>

                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  placeholder="Enter mobile number"
                />

              </div>

              {/* Password */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  New Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  placeholder="Leave empty to keep current"
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  Leave empty if you don't want to change
                  the password.
                </p>

              </div>

              {/* UUID */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  UUID
                </label>

                <div className="rounded-lg bg-gray-100 px-4 py-3 font-mono text-xs break-all text-gray-600">
                  {selectedUser.uuid}
                </div>

              </div>

              {/* =================================
                  BUTTONS
              ================================= */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={updateLoading}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateLoading
                    ? "Updating..."
                    : "Update User"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default Users;
