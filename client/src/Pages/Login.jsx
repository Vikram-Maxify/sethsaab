import { ArrowRight, Eye, EyeOff, Lock, Smartphone } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import Footer from "../components/Footer";
import Header from "../Components/Header";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ number: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.number || !form.password)
      return setError("कृपया सभी फ़ील्ड भरें");
    if (form.number.length !== 10)
      return setError("मोबाइल नंबर 10 अंकों का होना चाहिए");

    console.log("Login:", form);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-seth-bg">
      <Header />

      {/* Hero */}
      <div className="px-5 pt-2 pb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 pt-2">
            <h2 className="text-[26px] font-extrabold leading-tight text-white">
              वापसी पर
            </h2>
            <h2 className="text-[26px] font-extrabold leading-tight text-seth-gold mt-1">
              स्वागत है
            </h2>
            <p className="text-[13px] text-seth-muted mt-3 leading-snug">
              अपनी जीत की यात्रा जारी रखें
            </p>
          </div>
          <div className="relative w-[180px] h-[180px] flex-shrink-0">
            <img
              src="/ganesh.png"
              alt="गणेश जी"
              className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(245,197,66,0.35)]"
            />
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="px-5 pb-6">
        <div className="bg-seth-card border border-seth-border rounded-2xl p-5 shadow-[0_0_40px_rgba(245,197,66,0.08)]">
          <div className="text-center mb-5">
            <h3 className="text-[22px] font-extrabold text-white">
              अपने अकाउंट में <span className="text-seth-gold">लॉगिन करें</span>
            </h3>
            <p className="text-[12px] text-seth-muted mt-1.5">
              नंबर और पासवर्ड दर्ज करें
            </p>
          </div>

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
                placeholder="पासवर्ड दर्ज करें"
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

            {error && (
              <p className="text-red-400 text-[12px] text-center">{error}</p>
            )}

            <button
              type="submit"
              className="btn-gold mt-2 w-full rounded-xl py-3.5 flex items-center justify-center gap-2 text-black font-extrabold text-[16px] active:scale-[0.98] transition"
            >
              लॉगिन करें
              <ArrowRight size={20} strokeWidth={3} />
            </button>
          </form>

          <p className="text-center text-[12px] text-seth-muted mt-5">
            नया खाता बनाना है?{" "}
            <Link to="/register" className="text-seth-gold font-bold">
              रजिस्टर करें
            </Link>
          </p>
        </div>
      </div>

      {/* <Footer /> */}
    </div>
  );
};

export default Login;
