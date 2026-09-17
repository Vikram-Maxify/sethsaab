import { useEffect, useState } from "react";

// 👉 Unsplash se banners (direct URLs)
const banners = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&q=80",
    title: "बड़ा बोनस",
    subtitle: "पहली जमा पर ₹500 तक",
    tag: "नया ऑफर",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800&q=80",
    title: "तेज़ विड्रॉल",
    subtitle: "5 मिनट में पैसा आपके अकाउंट में",
    tag: "इंस्टेंट",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&q=80",
    title: "रेफर और कमाओ",
    subtitle: "हर दोस्त पर ₹100 कमाओ",
    tag: "रेफरल",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80",
    title: "डेली रिवॉर्ड",
    subtitle: "रोज़ाना लॉगिन पर स्पेशल गिफ्ट",
    tag: "डेली",
  },
];

const Hero = () => {
  const [current, setCurrent] = useState(0);

  // Auto slide every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="px-5 pt-2 pb-6">
      {/* ================= BANNER CAROUSEL ================= */}
      <div className="relative w-full h-[150px] rounded-2xl overflow-hidden border border-[#2a2a2a] bg-[#111111] mb-5">
        {/* Sliding track */}
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="min-w-full h-full relative flex-shrink-0"
            >
              {/* Background image */}
              <img
                src={banner.image}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => (e.target.style.display = "none")}
              />

              {/* Dark + golden gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#f5c542]/10 via-transparent to-transparent" />

              {/* Golden glow line top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f5c542] to-transparent" />

              {/* Content */}
              <div className="relative h-full flex flex-col justify-center px-5">
                {/* Tag */}
                <span className="inline-block w-fit bg-[#f5c542]/20 border border-[#f5c542] text-[#f5c542] text-[9px] font-bold px-2 py-[3px] rounded-full mb-2">
                  {banner.tag}
                </span>

                {/* Title */}
                <h3 className="text-[20px] font-extrabold text-white leading-tight">
                  {banner.title}
                </h3>

                {/* Subtitle */}
                <p className="text-[12px] text-[#9ca3af] mt-1 leading-snug">
                  {banner.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-[5px] rounded-full transition-all duration-300 ${
                current === i ? "w-5 bg-[#f5c542]" : "w-[5px] bg-[#f5c542]/40"
              }`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ================= HERO TEXT + GANESH ================= */}
      <div className="flex items-start justify-between gap-3">
        {/* Left Text */}
        <div className="flex-1 pt-2">
          <h2 className="text-[26px] font-extrabold leading-tight text-white">
            आज ही जुड़ें
          </h2>
          <h2 className="text-[26px] font-extrabold leading-tight text-[#f5c542] mt-1">
            और अपनी
          </h2>
          <h2 className="text-[26px] font-extrabold leading-tight text-[#f5c542]">
            किस्मत आज़माएं
          </h2>
          <p className="text-[13px] text-[#9ca3af] mt-3 leading-snug">
            छोटा कदम, बड़ी जीत की शुरुआत
          </p>
        </div>

        {/* Right Image */}
        <div className="relative w-[180px] h-[180px] flex-shrink-0">
          <img
            src="/ganesh.png"
            alt="गणेश जी"
            className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(245,197,66,0.35)]"
          />
          {/* शुभ लाभ हमेशा आपके साथ */}
          <div className="absolute top-2 right-0 text-right leading-tight rotate-[-8deg]">
            <p className="text-[11px] text-[#f5c542] font-bold">शुभ</p>
            <p className="text-[11px] text-[#f5c542] font-bold">लाभ</p>
            <p className="text-[11px] text-[#f5c542] font-bold">हमेशा</p>
            <p className="text-[11px] text-[#f5c542] font-bold">आपके साथ</p>
          </div>
        </div>
      </div>

      {/* 3 Features Row */}
      <div className="flex items-center justify-between mt-4 px-2">
        <Feature icon={<ShieldIcon />} label="100%" sub="सुरक्षित" />
        <Divider />
        <Feature icon={<UsersIcon />} label="हजारों" sub="खिलाड़ी" />
        <Divider />
        <Feature icon={<ZapIcon />} label="तेज़" sub="रजिस्ट्रेशन" />
      </div>
    </div>
  );
};

const Feature = ({ icon, label, sub }) => (
  <div className="flex flex-col items-center gap-1.5 flex-1">
    <div className="w-11 h-11 rounded-full border-2 border-[#f5c542] flex items-center justify-center bg-black/40">
      {icon}
    </div>
    <p className="text-[11px] text-[#f5c542] font-bold leading-none">{label}</p>
    <p className="text-[11px] text-[#f5c542] font-bold leading-none">{sub}</p>
  </div>
);

const Divider = () => <div className="w-px h-10 bg-[#2a2a2a]" />;

const ShieldIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f5c542"
    strokeWidth="2.5"
  >
    <path d="M12 2L3 6v6c0 5 3.5 9 9 10 5.5-1 9-5 9-10V6l-9-4z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5c542">
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5v1H3v-1z" />
    <path d="M16 15c2.5 0 5 1.5 5 4v1h-4" opacity="0.85" />
  </svg>
);

const ZapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5c542">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);

export default Hero;
