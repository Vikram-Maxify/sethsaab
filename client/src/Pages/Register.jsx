import { ArrowRight, Eye, EyeOff, Lock, Smartphone, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    number: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!form.number || !form.name || !form.password || !form.confirmPassword)
      return setError("कृपया सभी फ़ील्ड भरें");
    if (form.number.length !== 10)
      return setError("मोबाइल नंबर 10 अंकों का होना चाहिए");
    if (form.password.length < 6)
      return setError("पासवर्ड कम से कम 6 अक्षरों का हो");
    if (form.password !== form.confirmPassword)
      return setError("पासवर्ड मेल नहीं खा रहे");

    console.log("Register:", form);
    navigate("/login");
  };

  return (
    <div className="px-5 pb-6">
      <div className="bg-seth-card border border-seth-border rounded-2xl p-5 shadow-[0_0_40px_rgba(245,197,66,0.08)]">
        {/* Heading */}
        <div className="text-center mb-5">
          <h3 className="text-[22px] font-extrabold text-white">
            अपना अकाउंट <span className="text-seth-gold">बनाएं</span>
          </h3>
          <p className="text-[12px] text-seth-muted mt-1.5">
            अभी जुड़ें और जीत की अपनी यात्रा शुरू करें
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Mobile */}
          <div className="flex items-center bg-black/40 border border-seth-border rounded-xl overflow-hidden focus-within:border-seth-gold transition">
            <div className="pl-3 pr-2 text-seth-muted">
              <Smartphone size={18} />
            </div>
            <span className="text-white text-[14px] font-semibold pr-2 border-r border-seth-border py-3.5">
              +91
            </span>
            <input
              type="tel"
              name="number"
              maxLength={10}
              value={form.number}
              onChange={handleChange}
              placeholder="अपना मोबाइल नंबर दर्ज करें"
              className="flex-1 bg-transparent text-[13px] text-white placeholder-seth-muted px-3 py-3.5 focus:outline-none"
            />
          </div>

          {/* Name */}
          <div className="flex items-center bg-black/40 border border-seth-border rounded-xl focus-within:border-seth-gold transition">
            <div className="pl-3 pr-2 text-seth-muted">
              <User size={18} />
            </div>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="अपना पूरा नाम दर्ज करें"
              className="flex-1 bg-transparent text-[13px] text-white placeholder-seth-muted px-2 py-3.5 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div className="flex items-center bg-black/40 border border-seth-border rounded-xl focus-within:border-seth-gold transition">
            <div className="pl-3 pr-2 text-seth-muted">
              <Lock size={18} />
            </div>
            <input
              type={showPass ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="पासवर्ड बनाएं"
              className="flex-1 bg-transparent text-[13px] text-white placeholder-seth-muted px-2 py-3.5 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="pr-3 text-seth-muted"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="flex items-center bg-black/40 border border-seth-border rounded-xl focus-within:border-seth-gold transition">
            <div className="pl-3 pr-2 text-seth-muted">
              <Lock size={18} />
            </div>
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="पासवर्ड दोबारा दर्ज करें"
              className="flex-1 bg-transparent text-[13px] text-white placeholder-seth-muted px-2 py-3.5 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="pr-3 text-seth-muted"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-[12px] text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-gold mt-2 w-full rounded-xl py-3.5 flex items-center justify-center gap-2 text-black font-extrabold text-[16px] active:scale-[0.98] transition"
          >
            अभी रजिस्टर करें
            <ArrowRight size={20} strokeWidth={3} />
          </button>
        </form>

        {/* Lotus Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-seth-border" />
          <svg width="24" height="14" viewBox="0 0 24 14" fill="#f5c542">
            <path d="M12 2c-1.5 0-2.5 1-2.5 2s1 2 2.5 2 2.5-1 2.5-2-1-2-2.5-2z" />
            <path d="M12 6c-3 0-6 1.5-8 4 2 1.5 5 2.5 8 2.5s6-1 8-2.5c-2-2.5-5-4-8-4z" />
            <path d="M6 4c-1 .5-2 1.5-3 2.5L5 8c.5-1.5 1-2.5 1-4zM18 4c1 .5 2 1.5 3 2.5L19 8c-.5-1.5-1-2.5-1-4z" />
          </svg>
          <div className="flex-1 h-px bg-seth-border" />
        </div>

        {/* 3 features bottom */}
        <div className="flex items-center justify-between">
          <BottomFeature icon={<ZapGold />} line1="तेज़" line2="रजिस्ट्रेशन" />
          <div className="w-px h-10 bg-seth-border" />
          <BottomFeature icon={<ShieldGold />} line1="100%" line2="सुरक्षित" />
          <div className="w-px h-10 bg-seth-border" />
          <BottomFeature icon={<UsersGold />} line1="हजारों" line2="खिलाड़ी" />
        </div>
      </div>
    </div>
  );
};

const BottomFeature = ({ icon, line1, line2 }) => (
  <div className="flex items-center gap-2 flex-1 justify-center">
    <div className="w-9 h-9 rounded-full border-2 border-seth-gold flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="leading-tight">
      <p className="text-[10px] text-white font-bold">{line1}</p>
      <p className="text-[10px] text-white font-bold">{line2}</p>
    </div>
  </div>
);

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
