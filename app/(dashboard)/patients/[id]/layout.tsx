"use client";

import { Sidebar } from "@/components/sidebar";
import { CenterGlow } from "@/components/center-glow";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen">
      {/* Glow */}
      <CenterGlow />

      {/* Sidebar */}
      <Sidebar />

      {/* İçerik */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
