"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

type Doctor = {
  id: string;
  name: string;
  email: string;
};

export default function SettingsPage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const res = await fetch("/api/profile?userId=" + user.id);
        const data = await res.json();

        if (data.doctor) {
          setDoctor(data.doctor);
        } else {
          console.log("Profile Data:", data);
        }
      } catch (err) {
        toast.error("Profile information could not be loaded.");
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!doctor) return;

    // 1. Update profile (name + email)
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doctor),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Profile update failed.");
      return;
    }

    // 2. If the password has been changed, send a separate request.
    if (password) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Pasword could not be updated: " + error.message);
        return;
      }
    }

    toast.success("Profile updated successfully.");
    setPassword("");
  };

  if (!doctor) return <p className="p-6">Loading...</p>;

  return (
    <Card className="max-w-lg mx-auto mt-6 bg-background/50 backdrop-blur-md">
      <CardHeader>
        <CardTitle>⚙️ Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input
            value={doctor.name}
            onChange={(e) => setDoctor({ ...doctor, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">E-mail</label>
          <Input
            type="email"
            value={doctor.email}
            onChange={(e) => setDoctor({ ...doctor, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">New password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button onClick={handleSave}>Save</Button>
      </CardContent>
    </Card>
  );
}
