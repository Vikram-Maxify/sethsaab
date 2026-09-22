import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../Components/Header";
import BottomNavbar from "./BottomNavbar";

// ==========================================================
// WHATSAPP CONFIG
// ==========================================================

const WHATSAPP_NUMBER = "917234806209";

// ==========================================================
// ADMIN ROUTES
// ==========================================================

const ADMIN_ROUTES = [
  "/admin",
  "/admin/dashboard",
  "/admin/users",
  "/admin/deposits",
  "/admin/withdrawals",
  "/admin/transactions",
  "/admin/reports",
  "/admin/notifications",
  "/admin/settings",
];

// ==========================================================
// WHATSAPP FLOATING BUTTON
// ==========================================================

const WhatsappFloatingButton = () => {
  // ========================================================
  // WHATSAPP CLICK
  // ========================================================

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      "Hello, mujhe support chahiye."
    );

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <button
      type="button"
      onClick={handleWhatsAppClick}
      aria-label="WhatsApp Support"
      className="
        fixed
        top-[8px]
        z-[99999]
        flex
        h-[54px]
        w-[54px]
        items-center
        justify-center
        rounded-full
        text-white
        shadow-[0_6px_25px_rgba(37,211,102,0.40)]
        transition-all
        duration-300
        hover:scale-110
        hover:shadow-[0_8px_32px_rgba(37,211,102,0.58)]
        active:scale-95
        overflow-visible

        right-[calc((100vw-490px)/2+8px)]
      "
    >
      {/* ==================================================
          OUTER GLOW RING
      ================================================== */}

      <span
        className="
          pointer-events-none
          absolute
          inset-[-4px]
          rounded-full
        "
      />

      {/* ==================================================
          TOP GLASS HIGHLIGHT
      ================================================== */}

      <span
        className="
          pointer-events-none
          absolute
          top-[4px]
          left-1/2
          -translate-x-1/2
          h-[9px]
          w-[28px]
          rounded-full
          bg-white/25
          blur-[4px]
        "
      />

      {/* ==================================================
          PREMIUM WHATSAPP ICON
      ================================================== */}

      <div
        className="
          relative
          flex
          h-[37px]
          w-[37px]
          items-center
          justify-center
          rounded-full
          bg-white
          text-[#25D366]
          shadow-[0_3px_8px_rgba(0,0,0,0.20)]
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-[28px] w-[28px]"
          fill="currentColor"
        >
          <path d="M12.04 2.02a9.96 9.96 0 0 0-8.56 15.05L2 22l5.08-1.45a9.96 9.96 0 1 0 4.96-18.53Zm0 18.13a8.12 8.12 0 0 1-4.14-1.13l-.3-.18-3.02.86.88-2.94-.2-.3a8.12 8.12 0 1 1 6.78 3.69Zm4.45-6.08c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.01.4 1.36.51.57.18 1.09.15 1.5.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
        </svg>

        {/* ==================================================
            TINY SHINE
        ================================================== */}

        <span
          className="
            pointer-events-none
            absolute
            left-[7px]
            top-[5px]
            h-[5px]
            w-[11px]
            rounded-full
            bg-white/70
            blur-[2px]
          "
        />
      </div>

      {/* ==================================================
          RED NOTIFICATION DOT
      ================================================== */}

      <span
        className="
          pointer-events-none
          absolute
          -right-[2px]
          top-[2px]
          h-[13px]
          w-[13px]
          rounded-full
          border-2
          border-neutral-950
          bg-red-500
          shadow-[0_0_8px_rgba(239,68,68,0.65)]
        "
      />
    </button>
  );
};

// ==========================================================
// WHATSAPP USER VISIBILITY
// ==========================================================

const WhatsappForUser = () => {
  const location = useLocation();

  // ========================================================
  // AUTHENTICATION
  // ========================================================

  const { isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // ========================================================
  // CHECK ADMIN ROUTE
  // ========================================================

  const isAdminRoute = ADMIN_ROUTES.some(
    (route) =>
      location.pathname === route ||
      location.pathname.startsWith(`${route}/`)
  );

  // ========================================================
  // HIDE IF NOT LOGGED IN
  // ========================================================

  if (!isAuthenticated) {
    return null;
  }

  // ========================================================
  // HIDE ON ADMIN ROUTES
  // ========================================================

  if (isAdminRoute) {
    return null;
  }

  // ========================================================
  // SHOW FOR LOGGED-IN USER
  // ========================================================

  return <WhatsappFloatingButton />;
};

// ==========================================================
// PHONE LAYOUT
// ==========================================================

const PhoneLayout = () => {
  return (
    <div className="min-h-screen w-full bg-gray-300 flex justify-center">
      {/* ====================================================
          PHONE FRAME
      ==================================================== */}

      <div
        className="
          relative
          min-h-screen
          w-full
          max-w-[490px]
          overflow-y-auto
          bg-neutral-950
          shadow-2xl
          shadow-black/60
          phone-scroll
        "
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <Header />

        {/* ==================================================
            PAGE CONTENT
        ================================================== */}

        <main className="pb-[100px]">
          <Outlet />
        </main>

        {/* ==================================================
            WHATSAPP
        ================================================== */}

        <WhatsappForUser />

        {/* ==================================================
            BOTTOM NAVBAR
        ================================================== */}

        <BottomNavbar />
      </div>
    </div>
  );
};

export default PhoneLayout;