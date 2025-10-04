"use client";

import { motion } from "framer-motion";

export function CenterGlow() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: 1.2,
        ease: "easeOut",
      }}
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="w-[400px] h-[400px] rounded-full bg-cyan-500/20 blur-[120px]" />
    </motion.div>
  );
}
