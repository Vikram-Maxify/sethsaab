import banner from "../assets/3ban.jpeg";

const Hero = () => {
  return (
    <div className="w-full">
      {/* ================= STATIC HERO BANNER ================= */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111111]">
        <img
          src={banner}
          alt="Kuber Ticket"
          className="block w-full h-auto aspect-[16/9] object-cover"
        />
      </div>

      {/* ================= FEATURES ================= */}
      {/* <div className="flex items-center justify-between mt-5 px-2">
        <Feature icon={<ShieldIcon />} label="100%" sub="सुरक्षित" />

        <Divider />

        <Feature icon={<UsersIcon />} label="हमारी" sub="विश्वसनीयता" />

        <Divider />

        <Feature icon={<ZapIcon />} label="तेज़" sub="रजिस्ट्रेशन" />
      </div> */}
    </div>
  );
};

export default Hero;
