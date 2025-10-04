"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  FlaskConical,
  History,
  Settings,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";

const links = [
  { href: "overview", label: "Overview", icon: Home },
  { href: "diary", label: "Diary", icon: BookOpen },
  { href: "what-if", label: "What-If", icon: FlaskConical },
  { href: "history", label: "History", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const basePath = pathname.split("/").slice(0, 3).join("/");
  const settingsPath = `${basePath}/settings`;
  const dashboardPath = `${basePath.replace(/\/patients\/.*/, "")}/dashboard`; // dinamik yönlendirme

  return (
    <aside className="w-64 h-screen border-r bg-card/70 backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <h2 className="text-lg font-bold">👨 Patient Panel</h2>

        {/* Back to Dashboard button */}
        <motion.div
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2 }}
        >
          <Link
            href={dashboardPath}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Doctor Panel
          </Link>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const fullHref = `${basePath}/${link.href}`;
          const isActive =
            pathname === fullHref || pathname.startsWith(fullHref + "/");

          const isSpecial = link.href === "what-if";

          if (isSpecial && !isActive) {
            return (
              <motion.div
                key={link.href}
                animate={{
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 0 0px rgba(236,72,153,0.5)",
                    "0 0 20px rgba(236,72,153,0.8)",
                    "0 0 0px rgba(236,72,153,0.5)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                whileHover={{
                  x: [0, -6, 6, -4, 4, 0],
                  transition: { duration: 0.6, ease: "easeInOut" },
                }}
              >
                <Link
                  href={fullHref}
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-semibold bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-md"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </span>
                  <motion.span
                    className="flex items-center text-xs font-bold text-white"
                    animate={{
                      opacity: [0.6, 1, 0.6],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                  </motion.span>
                </Link>
              </motion.div>
            );
          }

          return (
            <Link
              key={link.href}
              href={fullHref}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        <Link
          href={settingsPath}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
