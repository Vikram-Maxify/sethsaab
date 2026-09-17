import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Smartphone,
  User,
} from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { register } from "../reducer/slice/authSlice";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    number: "",
    name: "",
    password: "",
    confirmPassword: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  // =======================
  // REDUX STATE
  // =======================

  const { registerLoading, registerError } = useSelector((state) => state.auth);

  // =======================
  // HANDLE CHANGE
  // =======================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Mobile number - only numbers
    if (name === "number") {
      const numericValue = value.replace(/\D/g, "");

      setForm((prev) => ({
        ...prev,
        [name]: numericValue,
      }));

      if (error) {
        setError("");
      }

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // =======================
  // HANDLE SUBMIT
  // =======================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // =======================
    // FRONTEND VALIDATION
    // =======================

    if (!form.number || !form.name || !form.password || !form.confirmPassword) {
      setError("कृपया सभी फ़ील्ड भरें");
      return;
    }

    if (form.number.length !== 10) {
      setError("मोबाइल नंबर 10 अंकों का होना चाहिए");
      return;
    }

    if (form.password.length < 6) {
      setError("पासवर्ड कम से कम 6 अक्षरों का हो");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("पासवर्ड मेल नहीं खा रहे");
      return;
    }

    // =======================
    // REGISTER API
    // =======================

    const result = await dispatch(
      register({
        name: form.name.trim(),
        mobile: form.number,
        password: form.password,
      }),
    );

    // =======================
    // SUCCESS
    // =======================

    if (register.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div className="px-5 pb-6">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-5 shadow-[0_0_40px_rgba(245,197,66,0.08)]">
        {/* Heading */}
        <div className="text-center mb-5">
          <h3 className="text-[22px] font-extrabold text-white">
            अपना अकाउंट <span className="text-[#f5c542]">बनाएं</span>
          </h3>

          <p className="text-[12px] text-[#9ca3af] mt-1.5">
            अभी जुड़ें और जीत की अपनी यात्रा शुरू करें
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Mobile */}
          <div className="flex items-center bg-black/40 border border-[#2a2a2a] rounded-xl overflow-hidden focus-within:border-[#f5c542] transition">
            <div className="pl-3 pr-2 text-[#9ca3af]">
              <Smartphone size={18} />
            </div>

            <span className="text-white text-[14px] font-semibold pr-2 border-r border-[#2a2a2a] py-3.5">
              +91
            </span>

            <input
              type="tel"
              name="number"
              maxLength={10}
              value={form.number}
              onChange={handleChange}
              placeholder="अपना मोबाइल नंबर दर्ज करें"
              disabled={registerLoading}
              className="flex-1 bg-transparent text-[13px] text-white placeholder-[#9ca3af] px-3 py-3.5 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Name */}
          <div className="flex items-center bg-black/40 border border-[#2a2a2a] rounded-xl focus-within:border-[#f5c542] transition">
            <div className="pl-3 pr-2 text-[#9ca3af]">
              <User size={18} />
            </div>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="अपना पूरा नाम दर्ज करें"
              disabled={registerLoading}
              className="flex-1 bg-transparent text-[13px] text-white placeholder-[#9ca3af] px-2 py-3.5 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Password */}
          <div className="flex items-center bg-black/40 border border-[#2a2a2a] rounded-xl focus-within:border-[#f5c542] transition">
            <div className="pl-3 pr-2 text-[#9ca3af]">
              <Lock size={18} />
            </div>

            <input
              type={showPass ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="पासवर्ड बनाएं"
              disabled={registerLoading}
              className="flex-1 bg-transparent text-[13px] text-white placeholder-[#9ca3af] px-2 py-3.5 focus:outline-none disabled:opacity-60"
            />

            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              disabled={registerLoading}
              className="pr-3 text-[#9ca3af]"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="flex items-center bg-black/40 border border-[#2a2a2a] rounded-xl focus-within:border-[#f5c542] transition">
            <div className="pl-3 pr-2 text-[#9ca3af]">
              <Lock size={18} />
            </div>

            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="पासवर्ड दोबारा दर्ज करें"
              disabled={registerLoading}
              className="flex-1 bg-transparent text-[13px] text-white placeholder-[#9ca3af] px-2 py-3.5 focus:outline-none disabled:opacity-60"
            />

            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              disabled={registerLoading}
              className="pr-3 text-[#9ca3af]"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Error */}
          {(error || registerError) && (
            <p className="text-red-400 text-[12px] text-center">
              {error || registerError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={registerLoading}
            className="mt-2 w-full rounded-xl py-3.5 flex items-center justify-center gap-2 text-black font-extrabold text-[16px] active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(180deg, #FFD966 0%, #f5c542 50%, #d4a017 100%)",
              boxShadow:
                "0 4px 20px rgba(245, 197, 66, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            {registerLoading ? (
              <>
                <Loader2 size={20} strokeWidth={3} className="animate-spin" />
                रजिस्टर हो रहा है...
              </>
            ) : (
              <>
                अभी रजिस्टर करें
                <ArrowRight size={20} strokeWidth={3} />
              </>
            )}
          </button>
        </form>

        {/* Lotus Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#2a2a2a]" />

          <svg width="24" height="14" viewBox="0 0 24 14" fill="#f5c542">
            <path d="M12 2c-1.5 0-2.5 1-2.5 2s1 2 2.5 2 2.5-1 2.5-2-1-2-2.5-2z" />
            <path d="M12 6c-3 0-6 1.5-8 4 2 1.5 5 2.5 8 2.5s6-1 8-2.5c-2-2.5-5-4-8-4z" />
            <path d="M6 4c-1 .5-2 1.5-3 2.5L5 8c.5-1.5 1-2.5 1-4zM18 4c1 .5 2 1.5 3 2.5L19 8c-.5-1.5-1-2.5-1-4z" />
          </svg>

          <div className="flex-1 h-px bg-[#2a2a2a]" />
        </div>

        {/* 3 Features */}
        <div className="flex items-center justify-between">
          <BottomFeature icon={<ZapGold />} line1="तेज़" line2="रजिस्ट्रेशन" />

          <div className="w-px h-10 bg-[#2a2a2a]" />

          <BottomFeature icon={<ShieldGold />} line1="100%" line2="सुरक्षित" />

          <div className="w-px h-10 bg-[#2a2a2a]" />

          <BottomFeature icon={<UsersGold />} line1="हजारों" line2="खिलाड़ी" />
        </div>
      </div>
    </div>
  );
};

// =======================
// BOTTOM FEATURE
// =======================

const BottomFeature = ({ icon, line1, line2 }) => (
  <div className="flex items-center gap-2 flex-1 justify-center">
    <div className="w-9 h-9 rounded-full border-2 border-[#f5c542] flex items-center justify-center flex-shrink-0">
      {icon}
    </div>

    <div className="leading-tight">
      <p className="text-[10px] text-white font-bold">{line1}</p>

      <p className="text-[10px] text-white font-bold">{line2}</p>
    </div>
  </div>
);

// =======================
// ICONS
// =======================

const ZapGold = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f5c542">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);

const ShieldGold = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5c542"
    strokeWidth="2.5"
  >
    <path d="M12 2L3 6v6c0 5 3.5 9 9 10 5.5-1 9-5 9-10V6l-9-4z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const UsersGold = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f5c542">
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5v1H3v-1z" />
  </svg>
);

export default Register;
