
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { register } from "../reducer/slice/authSlice";
import registerBanner from "../assets/1ban.png";

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

  const { registerLoading, registerError } = useSelector(
    (state) => state.auth
  );

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

    if (
      !form.number ||
      !form.name ||
      !form.password ||
      !form.confirmPassword
    ) {
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

    const result = await dispatch(
      register({
        name: form.name.trim(),
        mobile: form.number,
        password: form.password,
      })
    );

    if (register.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div className="w-full bg-[#050707] text-white">
      <div className="w-full max-w-[768px] mx-auto">

        {/* ================= BANNER ================= */}

        <div className="w-full overflow-hidden">
          <img
            src={registerBanner}
            alt="Kuber Register"
            className="block w-full h-auto object-cover"
          />
        </div>

        {/* ================= REGISTER SECTION ================= */}

        <section className="relative px-[18px] pt-[18px] pb-[20px]">

          {/* Golden background glow */}
          <div
            className="
              absolute
              left-1/2
              top-0
              -translate-x-1/2
              w-[80%]
              h-[330px]
              bg-[#f5c542]/[0.04]
              blur-[65px]
              pointer-events-none
            "
          />

          {/* ================= CARD ================= */}

          <div
            className="
              relative
              w-full
              rounded-[20px]
              border
              border-[#80651b]
              bg-gradient-to-b
              from-[#0d1111]
              via-[#080b0b]
              to-[#080909]
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
                  text-[24px]
                  leading-[1.2]
                "
              >
                अपना अकाउंट{" "}
                <span className="text-[#f5c542]">
                  बनाएं
                </span>
              </h1>

              <p className="mt-[5px] text-[#999] text-[12px]">
                अभी जुड़ें और जीत की अपनी यात्रा शुरू करें
              </p>

            </div>

            {/* ================= FORM ================= */}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-[9px]"
            >

              {/* ================= MOBILE ================= */}

              <div
                className="
                  h-[52px]
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

                <div className="w-[45px] flex justify-center text-[#f5c542] shrink-0">
                  <Smartphone
                    size={20}
                    strokeWidth={2.3}
                  />
                </div>

                <div className="h-[30px] w-px bg-[#353a3a] shrink-0" />

                <div
                  className="
                    h-full
                    flex
                    items-center
                    px-[8px]
                    text-gray-400
                    text-[14px]
                    font-medium
                    border-[#353a3a]
                    shrink-0
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
                  autoComplete="tel"
                  disabled={registerLoading}
                  className="
                    flex-1
                    min-w-0
                    h-full
                    bg-transparent
                    text-white
                    text-[13px]
                    placeholder:text-[#777]
                    outline-none
                    focus:outline-none
                    focus-visible:outline-none
                    focus:ring-0
                    border-none
                    appearance-none
                    [color-scheme:dark]
                    autofill:bg-transparent
                    autofill:text-white
                  "
                  style={{
                    WebkitBoxShadow: "0 0 0 1000px #090d0d inset",
                    WebkitTextFillColor: "#ffffff",
                  }}
                />

              </div>

              {/* ================= NAME ================= */}

              <div
                className="
                  h-[52px]
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

                <div className="w-[45px] flex justify-center text-[#f5c542] shrink-0">
                  <User
                    size={20}
                    strokeWidth={2.3}
                  />
                </div>

                <div className="h-[30px] w-px bg-[#353a3a] shrink-0" />

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="अपना पूरा नाम दर्ज करें"
                  autoComplete="name"
                  disabled={registerLoading}
                  className="
                    flex-1
                    min-w-0
                    h-full
                    bg-transparent
                    px-[12px]
                    text-white
                    text-[13px]
                    placeholder:text-[#777]
                    outline-none
                    focus:outline-none
                    focus-visible:outline-none
                    focus:ring-0
                    border-none
                    appearance-none
                    [color-scheme:dark]
                    autofill:bg-transparent
                    autofill:text-white
                  "
                  style={{
                    WebkitBoxShadow: "0 0 0 1000px #090d0d inset",
                    WebkitTextFillColor: "#ffffff",
                  }}
                />

              </div>

              {/* ================= PASSWORD ================= */}

              <div
                className="
                  h-[52px]
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

                <div className="w-[45px] flex justify-center text-[#f5c542] shrink-0">
                  <Lock
                    size={20}
                    strokeWidth={2.3}
                  />
                </div>

                <div className="h-[30px] w-px bg-[#353a3a] shrink-0" />

                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="पासवर्ड बनाएं"
                  autoComplete="new-password"
                  disabled={registerLoading}
                  className="
                    flex-1
                    min-w-0
                    h-full
                    bg-transparent
                    px-[12px]
                    text-white
                    text-[13px]
                    placeholder:text-[#777]
                    outline-none
                    focus:outline-none
                    focus-visible:outline-none
                    focus:ring-0
                    border-none
                    appearance-none
                    [color-scheme:dark]
                    autofill:bg-transparent
                    autofill:text-white
                  "
                  style={{
                    WebkitBoxShadow: "0 0 0 1000px #090d0d inset",
                    WebkitTextFillColor: "#ffffff",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPass((prev) => !prev)}
                  disabled={registerLoading}
                  className="
                    w-[45px]
                    h-full
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  {showPass ? (
                    <EyeOff
                      size={19}
                      strokeWidth={2.3}
                      className="text-[#f5c542]"
                    />
                  ) : (
                    <Eye
                      size={19}
                      strokeWidth={2.3}
                      className="text-[#f5c542]"
                    />
                  )}
                </button>

              </div>

              {/* ================= CONFIRM PASSWORD ================= */}

              <div
                className="
                  h-[52px]
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

                <div className="w-[45px] flex justify-center text-[#f5c542] shrink-0">
                  <Lock
                    size={20}
                    strokeWidth={2.3}
                  />
                </div>

                <div className="h-[30px] w-px bg-[#353a3a] shrink-0" />

                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="पासवर्ड दोबारा दर्ज करें"
                  autoComplete="new-password"
                  disabled={registerLoading}
                  className="
                    flex-1
                    min-w-0
                    h-full
                    bg-transparent
                    px-[12px]
                    text-white
                    text-[13px]
                    placeholder:text-[#777]
                    outline-none
                    focus:outline-none
                    focus-visible:outline-none
                    focus:ring-0
                    border-none
                    appearance-none
                    [color-scheme:dark]
                    autofill:bg-transparent
                    autofill:text-white
                  "
                  style={{
                    WebkitBoxShadow: "0 0 0 1000px #090d0d inset",
                    WebkitTextFillColor: "#ffffff",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  disabled={registerLoading}
                  className="
                    w-[45px]
                    h-full
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  {showConfirm ? (
                    <EyeOff
                      size={19}
                      strokeWidth={2.3}
                      className="text-[#f5c542]"
                    />
                  ) : (
                    <Eye
                      size={19}
                      strokeWidth={2.3}
                      className="text-[#f5c542]"
                    />
                  )}
                </button>

              </div>

              {/* ================= ERROR ================= */}

              {(error || registerError) && (
                <div
                  className="
                    rounded-[9px]
                    border
                    border-red-500/20
                    bg-red-500/[0.06]
                    px-3
                    py-[6px]
                    text-center
                    text-red-400
                    text-[11px]
                  "
                >
                  {error || registerError}
                </div>
              )}

              {/* ================= REGISTER BUTTON ================= */}

              <button
                type="submit"
                disabled={registerLoading}
                className="
                  mt-[3px]
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
                  disabled:cursor-not-allowed
                "
                style={{
                  background:
                    "linear-gradient(180deg, #ffe27a 0%, #f5c542 52%, #dfa925 100%)",
                  boxShadow:
                    "0 4px 16px rgba(245,197,66,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
              >

                {registerLoading ? (
                  <>
                    <Loader2
                      size={19}
                      strokeWidth={3}
                      className="animate-spin text-black"
                    />
                    रजिस्टर हो रहा है...
                  </>
                ) : (
                  <>
                    अभी रजिस्टर करें

                    <ArrowRight
                      size={21}
                      strokeWidth={2.8}
                      className="text-black"
                    />
                  </>
                )}

              </button>

            </form>

            {/* ================= LOTUS DIVIDER ================= */}

            <div className="flex items-center gap-[10px] my-[16px]">

              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#80651b]" />

              <svg
                width="24"
                height="14"
                viewBox="0 0 24 14"
                fill="#f5c542"
              >
                <path d="M12 2c-1.5 0-2.5 1-2.5 2s1 2 2.5 2 2.5-1 2.5-2-1-2-2.5-2z" />
                <path d="M12 6c-3 0-6 1.5-8 4 2 1.5 5 2.5 8 2.5s6-1 8-2.5c-2-2.5-5-4-8-4z" />
                <path d="M6 4c-1 .5-2 1.5-3 2.5L5 8c.5-1.5 1-2.5 1-4zM18 4c1 .5 2 1.5 3 2.5L19 8c-.5-1.5-1-2.5-1-4-1-1z" />
              </svg>

              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#80651b]" />

            </div>

            {/* ================= FEATURES ================= */}

            <div className="grid grid-cols-3">

              {/* FAST */}
              <div className="flex flex-col items-center text-center">

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
                  <Zap
                    size={21}
                    fill="currentColor"
                    strokeWidth={2.2}
                  />
                </div>

                <p className="text-white text-[10px] leading-[1.25]">
                  तेज़
                  <br />
                  रजिस्ट्रेशन
                </p>

              </div>

              {/* SECURITY */}
              <div
                className="
                  flex
                  flex-col
                  items-center
                  text-center
                  border-x
                  border-[#292d2d]
                "
              >

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
                  <ShieldCheck
                    size={21}
                    strokeWidth={2.2}
                  />
                </div>

                <p className="text-white text-[10px] leading-[1.25]">
                  100%
                  <br />
                  सुरक्षित
                </p>

              </div>

              {/* USERS */}
              <div className="flex flex-col items-center text-center">

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
                  <Users
                    size={21}
                    strokeWidth={2.2}
                  />
                </div>

                <p className="text-white text-[10px] leading-[1.25]">
                  हजारों
                  <br />
                  खिलाड़ी
                </p>

              </div>

            </div>

            {/* ================= LOGIN REDIRECT ================= */}

            <div className="mt-[18px] pt-[14px] border-t border-[#292d2d] text-center">

              <p className="text-[#999] text-[12px]">
                पहले से अकाउंट है?
              </p>

              <button
                type="button"
                onClick={() => navigate("/login")}
                disabled={registerLoading}
                className="
                  mt-[7px]
                  h-[42px]
                  px-[24px]
                  rounded-[10px]
                  border
                  border-[#f5c542]
                  bg-[#f5c542]/[0.06]
                  text-[#f5c542]
                  text-[13px]
                  font-bold
                  inline-flex
                  items-center
                  justify-center
                  gap-[7px]
                  transition-all
                  hover:bg-[#f5c542]/[0.12]
                  hover:border-[#ffe27a]
                  active:scale-[0.97]
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >
                लॉगिन करें
                <ArrowRight
                  size={17}
                  strokeWidth={2.5}
                />
              </button>

            </div>

          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;

