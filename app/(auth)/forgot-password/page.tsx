"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Sending E-mail...");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage("An error occured: " + error.message);
    } else {
      setMessage("A password reset link has been sent to your email.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleReset} className="p-6 border rounded-md w-80">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Reset Password
        </h2>
        <Input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" className="mt-4 w-full">
          Submit
        </Button>
        {message && <p className="text-sm mt-2 text-center">{message}</p>}
      </form>
    </div>
  );
}
