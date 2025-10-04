"use client";

import { useEffect, useState } from "react";
import { PatientTable } from "@/components/patient-table";
import { motion } from "framer-motion";
import { GlowBackground } from "@/components/glow-background";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";

type Stats = {
  patientCount: number;
  todayTests: number;
  ongoingTreatments: number;
  inpatientCount: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [doctorName, setDoctorName] = useState<string>("D");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Take user ids
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        // while calling `/api/dashboard` send doctor ID to the header 
        const res = await fetch("/api/dashboard", {
          headers: {
            "x-doctor-id": user.id,
          },
        });
        const data = await res.json();

        if (data?.stats) {
          setStats(data.stats);
        }

        // Separate call to get doctor's name
        const profileRes = await fetch("/api/profile?userId=" + user.id);
        const profile = await profileRes.json();
        if (profile?.doctor?.name) {
          setDoctorName(profile.doctor.name);
        }
      } catch (err) {
        console.error("Dashboard stats fetch error:", err);
      }
    })();
  }, []);

  return (
    <GlowBackground>
      <main className="p-6 min-h-screen bg-background/60 backdrop-blur-sm rounded-xl relative z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold tracking-tight"
            >
              👨‍⚕️ Doctor Panel
            </motion.h1>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="cursor-pointer">
                  <AvatarFallback>
                    {doctorName?.charAt(0) ?? "D"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  ⚙️ Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => router.push("/logout")}
                >
                  🚪 Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Statistic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats ? (
              [
                { label: "Total Patient", value: stats.patientCount },
                { label: "Today's Tests", value: stats.todayTests },
                { label: "Ongoing Treatments", value: stats.ongoingTreatments },
                { label: "Inpatient", value: stats.inpatientCount },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                >
                  <Card className="bg-card/70 backdrop-blur-md shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <p>Loading...</p>
            )}
          </div>

          {/* Patient Table */}
          <PatientTable />
        </div>
      </main>
    </GlowBackground>
  );
}
