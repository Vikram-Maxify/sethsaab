import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { fetchProfile } from "../reducer/slice/authSlice";

const PrivateRoute = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const profileRequested = useRef(false);

  const { user, isAuthenticated, profileLoading, profileError } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (user || isAuthenticated) return;
    if (profileRequested.current) return;
    if (profileLoading) return;

    profileRequested.current = true;
    dispatch(fetchProfile());
  }, [dispatch, user, isAuthenticated, profileLoading]);

  if (profileLoading || (!user && !profileError)) {
    return (
      <div className="min-h-screen bg-seth-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-seth-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated || profileError) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default PrivateRoute;
