
import React, { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
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

const WhatsappFloatingButton = ({ isAuthenticated }) => {
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

    return {
      x:
        typeof window !== "undefined"
          ? Math.max(12, window.innerWidth - BTN_SIZE - 18)
          : 400,
      y: 82,
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
    // Not logged in => no action
    if (!isAuthenticated) {
      return;
    }

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
    if (!btnRef.current || !isAuthenticated) {
      return;
    }

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
    }
  };

  // ========================================================
  // POINTER MOVE
  // ========================================================

  const onPointerMove = (e) => {
    if (
      !dragging.current ||
      !btnRef.current ||
      !isAuthenticated
    ) {
      return;
    }

    const btnW = btnRef.current.offsetWidth || BTN_SIZE;
    const btnH = btnRef.current.offsetHeight || BTN_SIZE;

    let newX = e.clientX - offset.current.x;
    let newY = e.clientY - offset.current.y;

    newX = Math.max(
      0,
      Math.min(window.innerWidth - btnW, newX)
    );

    newY = Math.max(
      0,
      Math.min(window.innerHeight - btnH, newY)
    );

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

    if (!moved.current && isAuthenticated) {
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
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ========================================================
  // NOT LOGGED IN
  // ========================================================

  if (!isAuthenticated) {
    return null;
  }

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
        cursor: dragging.current ? "grabbing" : "grab",
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
        shadow-[0_6px_22px_rgba(37,211,102,0.45)]
        transition-all
        duration-200
        hover:scale-110
        hover:shadow-[0_8px_28px_rgba(37,211,102,0.6)]
        active:scale-95
      "
    >
      {/* ==================================================
          INNER DARK CIRCLE
      ================================================== */}

      <span
        className="
          absolute
          inset-[4px]
          rounded-full
          border
          border-white/20
          bg-[#25D366]
          flex
          items-center
          justify-center
        "
      >
        <MessageCircle
          size={32}
          strokeWidth={2.5}
          fill="white"
          className="text-white"
        />
      </span>

      {/* ==================================================
          SMALL ONLINE DOT
      ================================================== */}

      <span
        className="
          pointer-events-none
          absolute
          right-0
          top-0
          h-[15px]
          w-[15px]
          rounded-full
          border-2
          border-[#050505]
          bg-[#22c55e]
          shadow-[0_0_7px_rgba(34,197,94,0.8)]
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

  const { user, token, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // Redux + token dono verify
  const loggedIn =
    Boolean(isAuthenticated) &&
    Boolean(token) &&
    Boolean(user);

  // ========================================================
  // CHECK ADMIN ROUTE
  // ========================================================

  const isAdminRoute = ADMIN_ROUTES.some(
    (route) =>
      location.pathname === route ||
      location.pathname.startsWith(`${route}/`)
  );

  // Admin pages par WhatsApp hide
  if (isAdminRoute) {
    return null;
  }

  return (
    <WhatsappFloatingButton
      isAuthenticated={loggedIn}
    />
  );
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

