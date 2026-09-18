import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import { login } from "../reducer/slice/authSlice";

// 👇 Apne actual banner filename ke according change kar dena
import loginBanner from "../assets/2ban.png";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    number: "",
    password: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const { loginLoading, loginError } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;

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
    <div className="w-full bg-[#050707] text-white">
      <div className="w-full max-w-[768px] mx-auto">
        {/* =====================================================
            BANNER
        ===================================================== */}

        <div className="w-full overflow-hidden">
          <img
            src={loginBanner}
            alt="Kuber Login"
            className="block w-full h-auto object-cover"
          />
        </div>

        {/* =====================================================
    COMPACT LOGIN SECTION
===================================================== */}

        <section className="relative px-[18px] pt-[18px] pb-[20px]">
          <div
            className="
      absolute
      left-1/2
      top-0
      -translate-x-1/2
      w-[80%]
      h-[280px]
      bg-[#f5c542]/[0.04]
      blur-[65px]
      pointer-events-none
    "
          />

          <div
            className="
      relative
      w-full
      rounded-[20px]
      border
      border-[#80651b]
      bg-gradient-to-b from-[#0d1111] via-[#080b0b] to-[#080909]
      px-[18px]
      pt-[20px]
      pb-[18px]
      shadow-[0_0_30px_rgba(245,197,66,0.08)]
    "
          >
            {/* ================= HEADING ================= */}

            <div className="text-center mb-[15px]">
              <h1
                className="
          text-white
          font-extrabold
          text-[23px]
          leading-[1.2]
        "
              >
                अपने अकाउंट में{" "}
                <span className="text-[#f5c542]">लॉगिन करें</span>
              </h1>

              <p className="mt-[5px] text-[#999] text-[12px]">
                अपनी किस्मत की यात्रा फिर से शुरू करें
              </p>
            </div>

            {/* ================= FORM ================= */}

            <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
              {/* MOBILE */}

              <div
                className="
          h-[54px]
          w-full
          flex
          items-center
          rounded-[12px]
          border
          border-[#414646]
          bg-[#090d0d]
          overflow-hidden
          focus-within:border-[#d9ad31]
          transition-all
        "
              >
                <div className="w-[45px] flex justify-center text-white">
                  <Smartphone size={20} strokeWidth={2} />
                </div>

                <div className="h-[30px] w-[1px] bg-[#353a3a]" />

                <div
                  className="
            h-full
            flex
            items-center
            px-[11px]
            text-white
            text-[14px]
            font-medium
            border-r
            border-[#353a3a]
          "
                >
                  +91
                </div>

                <input
                  type="tel"
                  name="number"
                  maxLength={10}
                  value={form.number}
                  onChange={handleChange}
                  placeholder="अपना मोबाइल नंबर दर्ज करें"
                  className="
            flex-1
            min-w-0
            h-full
            bg-transparent
            px-[12px]
            text-white
            text-[13px]
            placeholder:text-[#777]
            focus:outline-none
          "
                  disabled={loginLoading}
                />
              </div>

              {/* PASSWORD */}

              <div
                className="
          h-[54px]
          w-full
          flex
          items-center
          rounded-[12px]
          border
          border-[#414646]
          bg-[#090d0d]
          overflow-hidden
          focus-within:border-[#d9ad31]
          transition-all
        "
              >
                <div className="w-[45px] flex justify-center text-white">
                  <Lock size={20} strokeWidth={2} />
                </div>

                <div className="h-[30px] w-[1px] bg-[#353a3a]" />

                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="अपना पासवर्ड दर्ज करें"
                  className="
            flex-1
            min-w-0
            h-full
            bg-transparent
            px-[12px]
            text-white
            text-[13px]
            placeholder:text-[#777]
            focus:outline-none
          "
                  disabled={loginLoading}
                />

                <button
                  type="button"
                  onClick={() => setShowPass((prev) => !prev)}
                  className="
            w-[45px]
            h-full
            flex
            items-center
            justify-center
            text-[#aaa]
          "
                  disabled={loginLoading}
                >
                  {showPass ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              {/* ERROR */}

              {(error || loginError) && (
                <p className="text-red-400 text-[11px] text-center">
                  {error || loginError}
                </p>
              )}

              {/* REMEMBER / FORGOT */}

              <div className="flex items-center justify-between mt-[1px]">
                <button
                  type="button"
                  onClick={() => setRemember((prev) => !prev)}
                  className="flex items-center gap-[7px]"
                >
                  <span
                    className={`
              w-[23px]
              h-[23px]
              rounded-[5px]
              flex
              items-center
              justify-center
              border
              ${
                remember
                  ? "bg-[#f5c542] border-[#f5c542] text-black"
                  : "border-[#666] bg-transparent"
              }
            `}
                  >
                    {remember && <Check size={15} strokeWidth={3} />}
                  </span>

                  <span className="text-[12px] text-white">मुझे याद रखें</span>
                </button>

                <button type="button" className="text-[#f5c542] text-[12px]">
                  पासवर्ड भूल गए?
                </button>
              </div>

              {/* LOGIN */}

              <button
                type="submit"
                disabled={loginLoading}
                className="
          mt-[2px]
          h-[54px]
          w-full
          rounded-[12px]
          flex
          items-center
          justify-center
          gap-[9px]
          text-black
          text-[17px]
          font-extrabold
          active:scale-[0.985]
          transition-all
          disabled:opacity-60
        "
                style={{
                  background:
                    "linear-gradient(180deg, #ffe27a 0%, #f5c542 52%, #dfa925 100%)",
                  boxShadow:
                    "0 4px 16px rgba(245,197,66,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
              >
                {loginLoading ? (
                  <>
                    <Loader2
                      size={19}
                      strokeWidth={3}
                      className="animate-spin"
                    />
                    लॉगिन हो रहा है...
                  </>
                ) : (
                  <>
                    लॉगिन करें
                    <ArrowRight size={21} strokeWidth={2.8} />
                  </>
                )}
              </button>
            </form>

            {/* ================= REGISTER DIVIDER ================= */}

            <div className="flex items-center gap-[10px] mt-[18px]">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#80651b]" />

              <span className="text-[#aaa] text-[11px] whitespace-nowrap">
                नया हैं? अभी अकाउंट बनाएं
              </span>

              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#80651b]" />
            </div>

            {/* REGISTER */}

            <Link
              to="/register"
              className="
        mt-[11px]
        h-[47px]
        w-full
        rounded-[12px]
        border
        border-[#d9b52e]
        flex
        items-center
        justify-center
        text-[#f5c542]
        text-[15px]
        font-bold
        bg-[#090b0b]
        active:scale-[0.99]
        transition-all
      "
            >
              नया अकाउंट बनाएं
            </Link>

            {/* ================= FEATURES ================= */}

            <div
              className="
        grid
        grid-cols-3
        mt-[18px]
        pt-[17px]
        border-t
        border-[#292d2d]
      "
            >
              {/* SPEED */}

              <div className="flex flex-col items-center text-center px-1">
                <div
                  className="
            w-[42px]
            h-[42px]
            rounded-full
            border
            border-[#f5c542]
            flex
            items-center
            justify-center
            text-[#f5c542]
            mb-[5px]
          "
                >
                  <Zap size={21} fill="currentColor" />
                </div>

                <p className="text-white text-[10px] leading-[1.3]">
                  तेज
                  <br />
                  और आसान
                </p>
              </div>

              {/* SECURITY */}

              <div className="flex flex-col items-center text-center px-1">
                <div
                  className="
            w-[42px]
            h-[42px]
            rounded-full
            border
            border-[#f5c542]
            flex
            items-center
            justify-center
            text-[#f5c542]
            mb-[5px]
          "
                >
                  <ShieldCheck size={21} />
                </div>

                <p className="text-white text-[10px] leading-[1.3]">
                  100%
                  <br />
                  सुरक्षित
                </p>
              </div>

              {/* USERS */}

              <div className="flex flex-col items-center text-center px-1">
                <div
                  className="
            w-[42px]
            h-[42px]
            rounded-full
            border
            border-[#f5c542]
            flex
            items-center
            justify-center
            text-[#f5c542]
            mb-[5px]
          "
                >
                  <Users size={21} />
                </div>

                <p className="text-white text-[10px] leading-[1.3]">
                  हजारों खिलाड़ियों
                  <br />
                  का भरोसा
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
