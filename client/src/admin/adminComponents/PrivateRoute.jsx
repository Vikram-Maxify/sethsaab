import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useSelector } from "react-redux";

const PrivateRoute = () => {
  const location = useLocation();

  const { isAuthenticated } =
    useSelector(
      (state) => state.adminAuth
    );

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return <Outlet />;
};

export default PrivateRoute;
