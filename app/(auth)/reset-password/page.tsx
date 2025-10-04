"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Updating...");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage(
        "Password changed succesfully. You are being redirected to the login page…"
      );
      setTimeout(() => router.push("/login"), 2500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleUpdate} className="p-6 border rounded-md w-80">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Decide New Password
        </h2>
        <Input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="mt-4 w-full">
          Set Password
        </Button>
        {message && <p className="text-sm mt-2 text-center">{message}</p>}
      </form>
    </div>
  );
}
