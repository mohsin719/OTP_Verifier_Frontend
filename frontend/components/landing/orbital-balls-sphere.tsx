"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import {
  FaWhatsapp,
  FaTelegram,
  FaGoogle,
  FaTiktok,
  FaInstagram,
  FaDiscord,
  FaFacebook,
  FaXTwitter,
  FaApple,
  FaSnapchat,
  FaAmazon,
  FaSpotify,
  FaSteam,
  FaPaypal,
  FaGithub,
  FaLinkedin,
  FaReddit,
  FaUber,
  FaViber,
  FaMicrosoft,
  FaEbay,
  FaYahoo,
} from "react-icons/fa6";
import { RiOpenaiFill } from "react-icons/ri";
import {
  SiBinance,
  SiNetflix,
  SiCoinbase,
  SiTinder,
  SiAliexpress,
  SiRevolut,
  SiWise,
  SiVk,
} from "react-icons/si";
import { TbBrandWalmart } from "react-icons/tb";

interface BallDef {
  code: string;
  name: string;
  baseColor: string;
  darkColor: string;
  glow: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  fg: string;
  ring: number; // 0 = inner (8), 1 = mid (12), 2 = outer (12)
  angleOffset: number;
  speed: number;
  size: number;
}

export const HERO_BALLS_DATA: BallDef[] = [
  // ─── Ring 0: Inner Core Orbit (8 iconic apps) ───
  {
    code: "wa",
    name: "WhatsApp",
    baseColor: "#25D366",
    darkColor: "#128C7E",
    glow: "rgba(37, 211, 102, 0.75)",
    icon: FaWhatsapp,
    fg: "#FFFFFF",
    ring: 0,
    angleOffset: (0 / 8) * Math.PI * 2,
    speed: 0.0035,
    size: 48,
  },
  {
    code: "tg",
    name: "Telegram",
    baseColor: "#24A1DE",
    darkColor: "#1E87BE",
    glow: "rgba(36, 161, 222, 0.75)",
    icon: FaTelegram,
    fg: "#FFFFFF",
    ring: 0,
    angleOffset: (1 / 8) * Math.PI * 2,
    speed: 0.0035,
    size: 46,
  },
  {
    code: "dr",
    name: "ChatGPT",
    baseColor: "#10A37F",
    darkColor: "#0D8265",
    glow: "rgba(16, 163, 127, 0.75)",
    icon: RiOpenaiFill,
    fg: "#FFFFFF",
    ring: 0,
    angleOffset: (2 / 8) * Math.PI * 2,
    speed: 0.0035,
    size: 48,
  },
  {
    code: "go",
    name: "Google",
    baseColor: "#4285F4",
    darkColor: "#1A5BD9",
    glow: "rgba(66, 133, 244, 0.75)",
    icon: FaGoogle,
    fg: "#FFFFFF",
    ring: 0,
    angleOffset: (3 / 8) * Math.PI * 2,
    speed: 0.0035,
    size: 46,
  },
  {
    code: "tt",
    name: "TikTok",
    baseColor: "#000000",
    darkColor: "#1E1E1E",
    glow: "rgba(37, 244, 238, 0.7)",
    icon: FaTiktok,
    fg: "#25F4EE",
    ring: 0,
    angleOffset: (4 / 8) * Math.PI * 2,
    speed: 0.0035,
    size: 46,
  },
  {
    code: "ig",
    name: "Instagram",
    baseColor: "#E1306C",
    darkColor: "#C13584",
    glow: "rgba(225, 48, 108, 0.75)",
    icon: FaInstagram,
    fg: "#FFFFFF",
    ring: 0,
    angleOffset: (5 / 8) * Math.PI * 2,
    speed: 0.0035,
    size: 48,
  },
  {
    code: "ds",
    name: "Discord",
    baseColor: "#5865F2",
    darkColor: "#4752C4",
    glow: "rgba(88, 101, 242, 0.75)",
    icon: FaDiscord,
    fg: "#FFFFFF",
    ring: 0,
    angleOffset: (6 / 8) * Math.PI * 2,
    speed: 0.0035,
    size: 46,
  },
  {
    code: "ba",
    name: "Binance",
    baseColor: "#F3BA2F",
    darkColor: "#D49C16",
    glow: "rgba(243, 186, 47, 0.8)",
    icon: SiBinance,
    fg: "#000000",
    ring: 0,
    angleOffset: (7 / 8) * Math.PI * 2,
    speed: 0.0035,
    size: 48,
  },

  // ─── Ring 1: Mid Orbit (12 global platforms) ───
  {
    code: "fb",
    name: "Facebook",
    baseColor: "#1877F2",
    darkColor: "#0E5AC0",
    glow: "rgba(24, 119, 242, 0.7)",
    icon: FaFacebook,
    fg: "#FFFFFF",
    ring: 1,
    angleOffset: (0 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 42,
  },
  {
    code: "tw",
    name: "X / Twitter",
    baseColor: "#000000",
    darkColor: "#1E1E1E",
    glow: "rgba(255, 255, 255, 0.4)",
    icon: FaXTwitter,
    fg: "#FFFFFF",
    ring: 1,
    angleOffset: (1 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 40,
  },
  {
    code: "wx",
    name: "Apple",
    baseColor: "#334155",
    darkColor: "#0F172A",
    glow: "rgba(255, 255, 255, 0.4)",
    icon: FaApple,
    fg: "#FFFFFF",
    ring: 1,
    angleOffset: (2 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 42,
  },
  {
    code: "nf",
    name: "Netflix",
    baseColor: "#E50914",
    darkColor: "#990000",
    glow: "rgba(229, 9, 20, 0.75)",
    icon: SiNetflix,
    fg: "#FFFFFF",
    ring: 1,
    angleOffset: (3 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 40,
  },
  {
    code: "am",
    name: "Amazon",
    baseColor: "#232F3E",
    darkColor: "#131921",
    glow: "rgba(255, 153, 0, 0.7)",
    icon: FaAmazon,
    fg: "#FF9900",
    ring: 1,
    angleOffset: (4 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 42,
  },
  {
    code: "sn",
    name: "Snapchat",
    baseColor: "#FFFC00",
    darkColor: "#D6D300",
    glow: "rgba(255, 252, 0, 0.75)",
    icon: FaSnapchat,
    fg: "#000000",
    ring: 1,
    angleOffset: (5 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 40,
  },
  {
    code: "sp",
    name: "Spotify",
    baseColor: "#1ED760",
    darkColor: "#149C44",
    glow: "rgba(30, 215, 96, 0.7)",
    icon: FaSpotify,
    fg: "#000000",
    ring: 1,
    angleOffset: (6 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 42,
  },
  {
    code: "mt",
    name: "Steam",
    baseColor: "#1B2838",
    darkColor: "#101822",
    glow: "rgba(102, 192, 244, 0.6)",
    icon: FaSteam,
    fg: "#66C0F4",
    ring: 1,
    angleOffset: (7 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 40,
  },
  {
    code: "ts",
    name: "PayPal",
    baseColor: "#003087",
    darkColor: "#001E54",
    glow: "rgba(0, 121, 193, 0.75)",
    icon: FaPaypal,
    fg: "#0079C1",
    ring: 1,
    angleOffset: (8 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 42,
  },
  {
    code: "cb",
    name: "Coinbase",
    baseColor: "#0052FF",
    darkColor: "#0038B8",
    glow: "rgba(0, 82, 255, 0.75)",
    icon: SiCoinbase,
    fg: "#FFFFFF",
    ring: 1,
    angleOffset: (9 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 40,
  },
  {
    code: "oi",
    name: "Tinder",
    baseColor: "#FE3C72",
    darkColor: "#C91C4E",
    glow: "rgba(254, 60, 114, 0.75)",
    icon: SiTinder,
    fg: "#FFFFFF",
    ring: 1,
    angleOffset: (10 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 40,
  },
  {
    code: "ws",
    name: "Wise",
    baseColor: "#163300",
    darkColor: "#0F2400",
    glow: "rgba(159, 232, 112, 0.65)",
    icon: SiWise,
    fg: "#9FE870",
    ring: 1,
    angleOffset: (11 / 12) * Math.PI * 2,
    speed: -0.0024,
    size: 40,
  },

  // ─── Ring 2: Outer Orbit (12 additional services) ───
  {
    code: "gf",
    name: "GitHub",
    baseColor: "#24292E",
    darkColor: "#161B22",
    glow: "rgba(255, 255, 255, 0.4)",
    icon: FaGithub,
    fg: "#FFFFFF",
    ring: 2,
    angleOffset: (0 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
  {
    code: "li",
    name: "LinkedIn",
    baseColor: "#0A66C2",
    darkColor: "#074889",
    glow: "rgba(10, 102, 194, 0.7)",
    icon: FaLinkedin,
    fg: "#FFFFFF",
    ring: 2,
    angleOffset: (1 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
  {
    code: "rd",
    name: "Reddit",
    baseColor: "#FF4500",
    darkColor: "#B83200",
    glow: "rgba(255, 69, 0, 0.75)",
    icon: FaReddit,
    fg: "#FFFFFF",
    ring: 2,
    angleOffset: (2 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
  {
    code: "ub",
    name: "Uber",
    baseColor: "#111827",
    darkColor: "#030712",
    glow: "rgba(255, 255, 255, 0.4)",
    icon: FaUber,
    fg: "#FFFFFF",
    ring: 2,
    angleOffset: (3 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
  {
    code: "vi",
    name: "Viber",
    baseColor: "#7360F2",
    darkColor: "#4E3BBF",
    glow: "rgba(115, 96, 242, 0.75)",
    icon: FaViber,
    fg: "#FFFFFF",
    ring: 2,
    angleOffset: (4 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
  {
    code: "mm",
    name: "Microsoft",
    baseColor: "#00A4EF",
    darkColor: "#0078D7",
    glow: "rgba(0, 164, 239, 0.75)",
    icon: FaMicrosoft,
    fg: "#FFFFFF",
    ring: 2,
    angleOffset: (5 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
  {
    code: "re",
    name: "Revolut",
    baseColor: "#0075EB",
    darkColor: "#0056B3",
    glow: "rgba(0, 117, 235, 0.75)",
    icon: SiRevolut,
    fg: "#FFFFFF",
    ring: 2,
    angleOffset: (6 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
  {
    code: "ali",
    name: "AliExpress",
    baseColor: "#FF4747",
    darkColor: "#CC1818",
    glow: "rgba(255, 71, 71, 0.75)",
    icon: SiAliexpress,
    fg: "#FFFFFF",
    ring: 2,
    angleOffset: (7 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
  {
    code: "dh",
    name: "eBay",
    baseColor: "#0064D2",
    darkColor: "#004799",
    glow: "rgba(0, 100, 210, 0.7)",
    icon: FaEbay,
    fg: "#FFFFFF",
    ring: 2,
    angleOffset: (8 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
  {
    code: "wr",
    name: "Walmart",
    baseColor: "#0071DC",
    darkColor: "#004FA0",
    glow: "rgba(255, 194, 32, 0.75)",
    icon: TbBrandWalmart,
    fg: "#FFC220",
    ring: 2,
    angleOffset: (9 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
  {
    code: "ya",
    name: "Yahoo",
    baseColor: "#6001D2",
    darkColor: "#420094",
    glow: "rgba(96, 1, 210, 0.75)",
    icon: FaYahoo,
    fg: "#FFFFFF",
    ring: 2,
    angleOffset: (10 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
  {
    code: "vk",
    name: "VKontakte",
    baseColor: "#0077FF",
    darkColor: "#0056BA",
    glow: "rgba(0, 119, 255, 0.75)",
    icon: SiVk,
    fg: "#FFFFFF",
    ring: 2,
    angleOffset: (11 / 12) * Math.PI * 2,
    speed: 0.0018,
    size: 38,
  },
];

export function OrbitalBallsSphere({
  compact = false,
}: {
  compact?: boolean;
}): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredBall, setHoveredBall] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scaleFactor, setScaleFactor] = useState<number>(1);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const physicsRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
    }>
  >(
    HERO_BALLS_DATA.map((b) => {
      const r = b.ring === 0 ? 80 : b.ring === 1 ? 142 : 205;
      return {
        x: Math.cos(b.angleOffset) * r,
        y: Math.sin(b.angleOffset) * r,
        vx: 0,
        vy: 0,
      };
    })
  );

  const ballElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const hoveredBallRef = useRef<string | null>(null);

  const angleRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const relX = e.clientX - centerX;
    const relY = e.clientY - centerY;

    mouseRef.current = { x: relX, y: relY, active: true };
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    const maxTilt = 8;
    const tiltY = (relX / (rect.width / 2)) * maxTilt;
    const tiltX = -(relY / (rect.height / 2)) * maxTilt;
    setTilt({ x: tiltX, y: tiltY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: 0, y: 0, active: false };
    setCursorPos(null);
    setTilt({ x: 0, y: 0 });
    hoveredBallRef.current = null;
    setHoveredBall(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const relX = touch.clientX - centerX;
    const relY = touch.clientY - centerY;

    mouseRef.current = { x: relX, y: relY, active: true };
    setCursorPos({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });

    const maxTilt = 8;
    const tiltY = (relX / (rect.width / 2)) * maxTilt;
    const tiltX = -(relY / (rect.height / 2)) * maxTilt;
    setTilt({ x: tiltX, y: tiltY });
  }, []);

  const handleTouchEnd = useCallback(() => {
    mouseRef.current = { x: 0, y: 0, active: false };
    setCursorPos(null);
    setTilt({ x: 0, y: 0 });
    hoveredBallRef.current = null;
    setHoveredBall(null);
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const sf = Math.min(1.05, Math.max(0.58, rect.width / 480));
        setScaleFactor(sf);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    let animId: number;

    const animate = () => {
      angleRef.current += 1;
      const t = angleRef.current;

      const rect = containerRef.current ? containerRef.current.getBoundingClientRect() : null;
      const containerW = rect ? rect.width : 480;
      // Responsive scale factor (480px default design)
      const sf = Math.min(1.05, Math.max(0.58, containerW / 480));

      const r0 = 80 * sf;
      const r1 = 142 * sf;
      const r2 = 205 * sf;

      const physics = physicsRef.current;
      const elements = ballElementsRef.current;
      const currentHovered = hoveredBallRef.current;

      for (let idx = 0; idx < HERO_BALLS_DATA.length; idx++) {
        const ball = HERO_BALLS_DATA[idx];
        const pos = physics[idx];
        if (!pos) continue;

        const baseR = ball.ring === 0 ? r0 : ball.ring === 1 ? r1 : r2;
        const currentAngle = ball.angleOffset + t * ball.speed;
        const targetX = Math.cos(currentAngle) * baseR;
        const targetY = Math.sin(currentAngle) * baseR;

        let fx = (targetX - pos.x) * 0.045;
        let fy = (targetY - pos.y) * 0.045;

        if (mouseRef.current.active) {
          const dx = pos.x - mouseRef.current.x;
          const dy = pos.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const repelRadius = 100 * sf;

          if (dist < repelRadius && dist > 1) {
            const force = (1 - dist / repelRadius) * 24;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        }

        pos.vx = (pos.vx + fx) * 0.85;
        pos.vy = (pos.vy + fy) * 0.85;
        pos.x += pos.vx;
        pos.y += pos.vy;

        const el = elements[idx];
        if (el) {
          const isH = currentHovered === ball.code;
          el.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${
            isH ? 1.32 : 1
          })`;
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[320px] sm:max-w-[440px] lg:max-w-[500px] shrink-0 mx-auto select-none overflow-visible">
      {/* ─── CIRCULAR BLUE FOG & SHADOW NEBULA BASE (ZERO OUTLINES) ─── */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {/* Soft outer atmospheric blue fog shadow */}
        <div className="w-[280px] h-[280px] sm:w-[440px] sm:h-[440px] rounded-full bg-gradient-to-tr from-blue-600/40 via-indigo-600/30 to-sky-400/25 blur-3xl opacity-85" />
        {/* Core diffuse glowing blue fog mist */}
        <div className="absolute w-[220px] h-[220px] sm:w-[330px] sm:h-[330px] rounded-full bg-radial from-blue-500/50 via-blue-600/25 to-transparent blur-2xl opacity-90" />
        {/* Soft deep blue shadow base */}
        <div className="absolute w-[250px] h-[250px] sm:w-[380px] sm:h-[380px] rounded-full bg-blue-900/20 blur-xl" />
      </div>

      {/* ─── PURE CIRCULAR BLUE FOG ARENA (BORDERLESS, NO OUTLINE) ─── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: mouseRef.current.active ? "transform 0.08s ease-out" : "transform 0.5s ease-out",
          background:
            "radial-gradient(circle at center, rgba(30, 64, 175, 0.42) 0%, rgba(29, 78, 216, 0.24) 42%, rgba(37, 99, 235, 0.08) 65%, transparent 76%)",
          boxShadow:
            "0 0 100px 30px rgba(37, 99, 235, 0.28), inset 0 0 70px 15px rgba(59, 130, 246, 0.20)",
        }}
        className="relative flex items-center justify-center w-[290px] h-[290px] sm:w-[420px] sm:h-[420px] lg:w-[480px] lg:h-[480px] rounded-full cursor-crosshair select-none"
      >
        {/* Subtle Ethereal Orbit Tracks (Seamlessly blended into fog) */}
        {/* Outer Ring 2 Track */}
        <div className="pointer-events-none absolute w-[86%] h-[86%] rounded-full border border-dashed border-sky-400/20 animate-[spin_160s_linear_infinite]" />

        {/* Mid Ring 1 Track */}
        <div className="pointer-events-none absolute w-[60%] h-[60%] rounded-full border border-sky-300/15 animate-[spin_100s_linear_infinite_reverse]" />

        {/* Inner Ring 0 Track */}
        <div className="pointer-events-none absolute w-[36%] h-[36%] rounded-full border border-dashed border-sky-300/25 animate-[spin_60s_linear_infinite]" />

        {/* Dynamic Cursor Light Beam */}
        {cursorPos && (
          <div
            className="pointer-events-none absolute rounded-full bg-radial from-sky-400/35 via-blue-400/20 to-transparent blur-xl transition-all duration-75"
            style={{
              width: 170,
              height: 170,
              left: cursorPos.x - 85,
              top: cursorPos.y - 85,
            }}
          />
        )}

        {/* ─── CENTER CORE: OFFICIAL BRAND LOGO HUB ─── */}
        <div className="relative z-25 flex flex-col items-center justify-center rounded-full bg-white p-2 sm:p-3.5 w-[68px] h-[68px] sm:w-[94px] sm:h-[94px] shadow-2xl shadow-blue-950/40 border-2 border-blue-400/80 text-center select-none group">
          {/* Live Online Badge */}
          <div className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-xs" />
          </div>

          <Image
            src="/brand/logo.png"
            alt="US Num Hub"
            width={72}
            height={72}
            priority
            className="h-8 w-8 sm:h-13 sm:w-13 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
          />
          <span className="text-[7.5px] sm:text-[9.5px] font-black text-slate-900 tracking-tight leading-none mt-0.5">
            US Num Hub
          </span>
        </div>

        {/* Instant Smooth Orbital Loader while initializing */}
        {!isMounted && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-30 transition-opacity duration-300">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border-2 border-sky-400/50 border-t-transparent animate-spin" />
              <div className="absolute w-24 h-24 rounded-full border border-dashed border-sky-300/30 animate-[spin_6s_linear_infinite]" />
            </div>
          </div>
        )}

        {/* ─── 32 3D SPHERICAL BALLS ("BOLL TYPES") ─── */}
        {HERO_BALLS_DATA.map((ball, idx) => {
          const isHovered = hoveredBall === ball.code;
          const Icon = ball.icon;
          const size = Math.round(ball.size * scaleFactor);

          // Guaranteed pre-computed static orbital coordinates (zero cluster at center!)
          const sf = scaleFactor || 1;
          const r0 = 80 * sf;
          const r1 = 142 * sf;
          const r2 = 205 * sf;
          const r = ball.ring === 0 ? r0 : ball.ring === 1 ? r1 : r2;
          const initX = Math.cos(ball.angleOffset) * r;
          const initY = Math.sin(ball.angleOffset) * r;

          return (
            <div
              key={ball.code}
              ref={(el) => {
                ballElementsRef.current[idx] = el;
              }}
              style={{
                zIndex: isHovered ? 45 : ball.ring === 0 ? 35 : ball.ring === 1 ? 30 : 20,
                transform: `translate3d(${initX.toFixed(1)}px, ${initY.toFixed(1)}px, 0) translate(-50%, -50%) scale(1)`,
                opacity: isMounted ? 1 : 0,
                transition: isMounted ? "opacity 0.4s ease-out" : "none",
              }}
              className="absolute left-1/2 top-1/2 will-change-transform group select-none"
              onMouseEnter={() => {
                hoveredBallRef.current = ball.code;
                setHoveredBall(ball.code);
              }}
              onMouseLeave={() => {
                hoveredBallRef.current = null;
                setHoveredBall(null);
              }}
            >
              <Link
                href={`/services?service=${ball.code}`}
                aria-label={`Allocate number for ${ball.name}`}
                className="relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none"
                style={{
                  width: size,
                  height: size,
                  background: `radial-gradient(circle at 35% 28%, #FFFFFF 0%, ${ball.baseColor} 50%, ${ball.darkColor} 100%)`,
                  boxShadow: isHovered
                    ? `0 0 24px 6px ${ball.glow}, inset 0 -5px 10px rgba(0,0,0,0.5), inset 0 3px 6px rgba(255,255,255,0.7), 0 12px 20px -3px rgba(0,0,0,0.4)`
                    : `0 0 14px 2px ${ball.glow}, inset 0 -4px 8px rgba(0,0,0,0.4), inset 0 2px 5px rgba(255,255,255,0.6), 0 8px 14px -3px rgba(0,0,0,0.35)`,
                }}
              >
                {/* 3D Glossy Light Arc */}
                <div
                  className="pointer-events-none absolute top-1 left-2 rounded-full bg-gradient-to-b from-white/85 via-white/40 to-transparent blur-[0.4px] -rotate-35"
                  style={{
                    width: size * 0.38,
                    height: size * 0.24,
                  }}
                />

                {/* Vector Brand Icon */}
                <Icon
                  style={{
                    width: size * 0.5,
                    height: size * 0.5,
                    color: ball.fg,
                    filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.45))",
                  }}
                  className="relative z-10 shrink-0 group-hover:scale-110 transition-transform"
                />
              </Link>

              {/* Tooltip Badge on Hover */}
              {isHovered && (
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-slate-950/95 text-white px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap shadow-xl backdrop-blur-md border border-white/20 animate-in fade-in zoom-in-95 duration-150">
                  <span>{ball.name}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-sky-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Subtle Status Pill */}
      <div className="mt-4 flex items-center justify-center gap-3 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>32+ Global Platforms</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500 font-medium">3D Cursor Orbit</span>
        <span className="text-slate-300">•</span>
        <Link
          href="/services"
          className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline"
        >
          <span>All Apps</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
