"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function GlowBackground({ children }: { children: React.ReactNode }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const glowX = useTransform(smoothX, [0, windowSize.width], [-100, 100]);
  const glowY = useTransform(smoothY, [0, windowSize.height], [-100, 100]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Cyan Glow */}
      <motion.div
        style={{ x: glowX, y: glowY }}
        className="pointer-events-none absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-cyan-500/20 blur-[120px]"
      />
      {/* Pink Glow */}
      <motion.div
        style={{ x: glowX, y: glowY }}
        className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-pink-500/20 blur-[120px]"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
