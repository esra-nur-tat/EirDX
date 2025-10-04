"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
    })();
  }, [router]);

  return <p className="p-6">Logging out...</p>;
}
