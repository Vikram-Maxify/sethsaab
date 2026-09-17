import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import { login } from "../reducer/slice/authSlice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    number: "",
    password: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  // Redux state
  const { loginLoading, loginError } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Mobile number mein sirf numbers allow
    if (name === "number") {
      const numericValue = value.replace(/\D/g, "");

      setForm((prev) => ({
        ...prev,
        [name]: numericValue,
      }));

      if (error) setError("");
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.number || !form.password) {
      setError("कृपया सभी फ़ील्ड भरें");
      return;
    }

    if (form.number.length !== 10) {
      setError("मोबाइल नंबर 10 अंकों का होना चाहिए");
      return;
    }

    const result = await dispatch(
      login({
        mobile: form.number,
        password: form.password,
      }),
    );

    if (login.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="px-5 pt-4 pb-6">
        {/* ================= TOP IMAGE ================= */}
        <div className="relative w-full h-[180px] rounded-2xl overflow-hidden border border-[#2a2a2a] bg-[#111111] mb-5">
          <img
            src="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800&q=80"
            alt="लॉगिन"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => (e.target.style.display = "none")}
          />

          {/* Dark + golden overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f5c542]/10 via-transparent to-transparent" />

          {/* Golden top line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f5c542] to-transparent" />

          {/* Text content on image */}
          <div className="relative h-full flex flex-col justify-end px-5 pb-4">
            <span className="inline-block w-fit bg-[#f5c542]/20 border border-[#f5c542] text-[#f5c542] text-[10px] font-bold px-2.5 py-1 rounded-full mb-2">
              वापसी पर स्वागत
            </span>
            <h2 className="text-[22px] font-extrabold text-white leading-tight">
              अपनी जीत की यात्रा
            </h2>
            <h2 className="text-[22px] font-extrabold text-[#f5c542] leading-tight">
              जारी रखें
            </h2>
          </div>
        </div>

        {/* ================= LOGIN FORM ================= */}
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-5 shadow-[0_0_40px_rgba(245,197,66,0.08)]">
          <div className="text-center mb-5">
            <h3 className="text-[22px] font-extrabold text-white">
              अपने अकाउंट में <span className="text-[#f5c542]">लॉगिन करें</span>
            </h3>
            <p className="text-[12px] text-[#9ca3af] mt-1.5">
              नंबर और पासवर्ड दर्ज करें
            </p>
          </div>

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
                className="flex-1 bg-transparent text-[13px] text-white placeholder-[#9ca3af] px-3 py-3.5 focus:outline-none"
                disabled={loginLoading}
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
                placeholder="पासवर्ड दर्ज करें"
                className="flex-1 bg-transparent text-[13px] text-white placeholder-[#9ca3af] px-2 py-3.5 focus:outline-none"
                disabled={loginLoading}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="pr-3 text-[#9ca3af]"
                disabled={loginLoading}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Error */}
            {(error || loginError) && (
              <p className="text-red-400 text-[12px] text-center">
                {error || loginError}
              </p>
            )}

            {/* Login Button - Golden Gradient */}
            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 w-full rounded-xl py-3.5 flex items-center justify-center gap-2 text-black font-extrabold text-[16px] active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(180deg, #FFD966 0%, #f5c542 50%, #d4a017 100%)",
                boxShadow:
                  "0 4px 20px rgba(245, 197, 66, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
              }}
            >
              {loginLoading ? (
                <>
                  <Loader2 size={20} strokeWidth={3} className="animate-spin" />
                  लॉगिन हो रहा है...
                </>
              ) : (
                <>
                  लॉगिन करें
                  <ArrowRight size={20} strokeWidth={3} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[12px] text-[#9ca3af] mt-5">
            नया खाता बनाना है?{" "}
            <Link to="/register" className="text-[#f5c542] font-bold">
              रजिस्टर करें
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
