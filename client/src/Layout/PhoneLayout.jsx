import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Header from "../Components/Header";
import BottomNavbar from "./BottomNavbar";

// ==========================================================
// WHATSAPP CONFIG
// ==========================================================

// Number country code ke saath, "+" ke bina
// Example: 919876543210
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
  const btnRef = useRef(null);

  // Button size
  const BTN_SIZE = 58;

  // ========================================================
  // POSITION
  // ========================================================

  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem("wa_btn_pos");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          parsed &&
          typeof parsed.x === "number" &&
          typeof parsed.y === "number"
        ) {
          return {
            x: parsed.x,
            y: parsed.y,
          };
        }
      }
    } catch (error) {
      console.error("Failed to load WhatsApp button position:", error);
    }

    // Default position = bottom-left
    return {
      x: 16,
      y:
        typeof window !== "undefined"
          ? Math.max(0, window.innerHeight - BTN_SIZE - 20)
          : 500,
    };
  });

  // ========================================================
  // DRAG STATES
  // ========================================================

  const dragging = useRef(false);
  const moved = useRef(false);

  const offset = useRef({
    x: 0,
    y: 0,
  });

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
  // POINTER DOWN
  // ========================================================

  const onPointerDown = (e) => {
    if (!btnRef.current) return;

    dragging.current = true;
    moved.current = false;

    const rect = btnRef.current.getBoundingClientRect();

    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    try {
      btnRef.current.setPointerCapture(e.pointerId);
    } catch (error) {
      // Ignore
    };
  };

  // ========================================================
  // POINTER MOVE
  // ========================================================

  const onPointerMove = (e) => {
    if (!dragging.current || !btnRef.current) {
      return;
    }

    const btnW = btnRef.current.offsetWidth || BTN_SIZE;
    const btnH = btnRef.current.offsetHeight || BTN_SIZE;

    let newX = e.clientX - offset.current.x;
    let newY = e.clientY - offset.current.y;

    // ======================================================
    // KEEP BUTTON INSIDE SCREEN
    // ======================================================

    newX = Math.max(
      0,
      Math.min(window.innerWidth - btnW, newX)
    );

    newY = Math.max(
      0,
      Math.min(window.innerHeight - btnH, newY)
    );

    // ======================================================
    // DETECT DRAG
    // ======================================================

    setPos((previous) => {
      if (
        Math.abs(newX - previous.x) > 3 ||
        Math.abs(newY - previous.y) > 3
      ) {
        moved.current = true;
      }

      return {
        x: newX,
        y: newY,
      };
    });
  };

  // ========================================================
  // POINTER UP
  // ========================================================

  const onPointerUp = (e) => {
    if (!dragging.current) {
      return;
    }

    dragging.current = false;

    try {
      if (btnRef.current?.hasPointerCapture(e.pointerId)) {
        btnRef.current.releasePointerCapture(e.pointerId);
      }
    } catch (error) {
      // Ignore
    }

    // ======================================================
    // SAVE POSITION
    // ======================================================

    setPos((currentPosition) => {
      try {
        localStorage.setItem(
          "wa_btn_pos",
          JSON.stringify(currentPosition)
        );
      } catch (error) {
        console.error(
          "Failed to save WhatsApp button position:",
          error
        );
      }

      return currentPosition;
    });

    // ======================================================
    // CLICK ONLY IF NOT DRAGGED
    // ======================================================

    if (!moved.current) {
      handleWhatsAppClick();
    }
  };

  // ========================================================
  // WINDOW RESIZE
  // ========================================================

  useEffect(() => {
    const onResize = () => {
      setPos((previous) => {
        const btnW = BTN_SIZE;
        const btnH = BTN_SIZE;

        const maxX = Math.max(
          0,
          window.innerWidth - btnW
        );

        const maxY = Math.max(
          0,
          window.innerHeight - btnH
        );

        const newPosition = {
          x: Math.max(
            0,
            Math.min(maxX, previous.x)
          ),
          y: Math.max(
            0,
            Math.min(maxY, previous.y)
          ),
        };

        // Save corrected position
        try {
          localStorage.setItem(
            "wa_btn_pos",
            JSON.stringify(newPosition)
          );
        } catch (error) {
          // Ignore
        }

        return newPosition;
      });
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener(
        "resize",
        onResize
      );
    };
  }, []);

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <button
      ref={btnRef}
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label="WhatsApp Support"
      style={{
        position: "fixed",
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        touchAction: "none",
        cursor: dragging.current
          ? "grabbing"
          : "grab",
        userSelect: "none",
      }}
      className="
        z-[9999]
        flex
        h-[58px]
        w-[58px]
        items-center
        justify-center
        rounded-full
        border-2
        border-white/20
        bg-[#25D366]
        text-white
        shadow-[0_5px_25px_rgba(37,211,102,0.45)]
        transition-transform
        duration-200
        hover:scale-110
        active:scale-95
      "
    >
      {/* ==================================================
          WHATSAPP ICON
      ================================================== */}

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="h-[34px] w-[34px]"
        fill="currentColor"
      >
        <path d="M19.11 17.24c-.27-.14-1.58-.78-1.82-.87-.24-.09-.42-.14-.6.14-.18.27-.69.87-.85 1.05-.16.18-.31.2-.58.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.56.12-.12.27-.31.4-.47.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.47-.07-.14-.6-1.45-.82-1.99-.22-.52-.43-.45-.6-.46h-.51c-.18 0-.47.07-.71.34-.24.27-.94.92-.94 2.24s.96 2.6 1.09 2.78c.14.18 1.89 2.89 4.58 4.05.64.28 1.14.45 1.53.58.64.2 1.22.17 1.68.1.51-.08 1.58-.65 1.8-1.28.22-.63.22-1.17.16-1.28-.05-.11-.24-.18-.51-.31z" />

        <path d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.67-1.71A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-2.01 0-3.98-.54-5.71-1.57l-.41-.24-3.96 1.01 1.06-3.86-.27-.42A10.78 10.78 0 0 1 5.22 16C5.22 10.05 10.05 5.22 16 5.22S26.78 10.05 26.78 16 21.95 26.8 16 26.8z" />
      </svg>

      {/* ==================================================
          RED NOTIFICATION DOT
      ================================================== */}

      <span
        className="
          pointer-events-none
          absolute
          -right-1
          -top-1
          h-4
          w-4
          rounded-full
          border-2
          border-[#050505]
          bg-red-500
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
  // CHECK ADMIN ROUTE
  // ========================================================

  const isAdminRoute = ADMIN_ROUTES.some(
    (route) =>
      location.pathname === route ||
      location.pathname.startsWith(`${route}/`)
  );

  // Admin pages par WhatsApp button hide
  if (isAdminRoute) {
    return null;
  }

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
          w-full
          max-w-[490px]
          min-h-screen
          bg-neutral-950
          relative
          shadow-2xl
          shadow-black/60
          phone-scroll
          overflow-y-auto
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