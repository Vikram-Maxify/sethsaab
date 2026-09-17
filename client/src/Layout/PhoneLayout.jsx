import { Outlet } from "react-router-dom";

const PhoneLayout = () => {
  return (
    <div className="min-h-screen w-full flex justify-center bg-white">
      {/* Phone Frame */}
      <div className="w-full max-w-[430px] min-h-screen bg-neutral-950 relative shadow-2xl shadow-black/60 phone-scroll overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default PhoneLayout;
