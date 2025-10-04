"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, UserPlus, Stethoscope, Link2 } from "lucide-react";

const links = [
  { href: "/admin-panel/doctors", label: "Doktorlar", icon: Stethoscope },
  { href: "/admin-panel/patients", label: "Hastalar", icon: Users },
  { href: "/admin-panel/assignments", label: "Atamalar", icon: Link2 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card/70 backdrop-blur-md p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-6">⚙️ Admin Panel</h2>
        <nav className="space-y-2 flex-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
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
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
