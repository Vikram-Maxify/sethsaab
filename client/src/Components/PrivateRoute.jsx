import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { fetchProfile } from "../reducer/slice/authSlice";

const PrivateRoute = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const { user, isAuthenticated, profileLoading, profileError } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    // Agar user Redux mein nahi hai,
    // to backend se profile check karo
    if (!user && !profileLoading) {
      dispatch(fetchProfile());
    }
  }, [dispatch, user, profileLoading]);

  // Profile check chal raha hai
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-seth-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-seth-gold border-t-transparent rounded-full animate-spin" />

          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // User authenticated nahi hai
  if (!isAuthenticated || !user || profileError) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authenticated user
  return <Outlet />;
};

export default PrivateRoute;
