"use client";

import React, { useState, useEffect, use } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from "recharts";
import { createClient } from "@supabase/supabase-js";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const medications = [
  "Tacrolimus",
  "Insulin",
  "Olanzapine",
  "Dexamethasone",
  "Sirolimus",
  "Prednisone",
  "Tacrolimus XR",
  "Triamterene-HCTZ (37.5/25)",
  "GlipiZIDE XL",
  "Furosemide",
  "Hydrocortisone",
  "Hydrochlorothiazide",
  "Spironolactone",
  "Empagliflozin",
  "CycloSPORINE (Sandimmune)",
  "Eplerenone",
  "Chlorthalidone",
  "Phenytoin",
  "CycloSPORINE (Neoral) MODIFIED",
  "Octreotide Acetate",
  "Fosphenytoin",
  "Phenytoin Sodium (IV)",
  "Valproate Sodium",
  "Dextrose Water",
  "Ritonavir",
  "MetFORMIN XR (Glucophage XR)",
  "Dextrose 50%",
  "MetFORMIN (Glucophage)",
];

const colors = [
  "#E57373",
  "#64B5F6",
  "#81C784",
  "#FFD54F",
  "#BA68C8",
  "#4DB6AC",
  "#FF8A65",
  "#A1887F",
  "#90A4AE",
  "#F06292",
];

interface Treatment {
  medication_name: string;
  dose: number;
  unit: string;
  route: string;
  color: string;
  predictions: number[];
}

export default function WhatIfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<string | null>(
    null
  );
  const [labs, setLabs] = useState<{ date: string; glucose: number }[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState("Insulin");
  const [dose, setDose] = useState<number>(10);
  const [unit, setUnit] = useState<string>("Units");
  const [route, setRoute] = useState<string>("SC");
  const [loading, setLoading] = useState(false);

  const getNextColor = () => colors[treatments.length % colors.length];

  // 🏥 Admissions
  useEffect(() => {
    const fetchAdmissions = async () => {
      const { data } = await supabase
        .from("admissions")
        .select("admission_id, date, status")
        .eq("patient_id", id)
        .order("date", { ascending: false });
      setAdmissions(data || []);
      if (data && data.length > 0) {
        setSelectedAdmission(data[0].admission_id);
      }

    };
    fetchAdmissions();
  }, [id]);

  // 🧪 Labs
  useEffect(() => {
    if (!selectedAdmission) return;
    const fetchLabs = async () => {
      const { data } = await supabase
        .from("labs")
        .select("value, date")
        .eq("patient_id", id)
        .eq("admission_id", selectedAdmission)
        .eq("lab_category", "Glucose")
        .order("date", { ascending: true });
      setLabs((data || []).map((d) => ({ date: d.date, glucose: d.value })));
    };
    fetchLabs();
  }, [id, selectedAdmission]);

  // 💉 Add Treatment
  const handleAddTreatment = async () => {
    setLoading(true);
    try {
      const cleanName = selectedMedication
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[()\/\-.%]/g, "_")
        .replace(/_+/g, "_")
        .trim();

      const payload = {
        patient_id: id,
        treatment: {
          medication_name: cleanName,
          dose: Number(dose),
          unit,
          route,
        },
      };

      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("✅ Prediction API response:", data);

      const newTreatment: Treatment = {
        medication_name: `${selectedMedication} (${dose}${unit})`,
        dose,
        unit,
        route,
        color: getNextColor(),
        predictions: data.predictions_real || data.predictions?.q50 || [],
      };

      console.log("✅ Prediction API response:", data);
      console.log("🩸 Using predictions:", data.predictions_real?.slice(0,5) || data.predictions?.q50?.slice(0,5));


      setTreatments((prev) => [...prev, newTreatment]);
      setOpen(false);
    } catch (err) {
      console.error("❌ handleAddTreatment error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 📊 Chart Data
  const chartData = () => {
    const past = labs.map((l) => ({
      date: new Date(l.date).toISOString(),
      Glucose: l.glucose,
    }));
    const lastDate = past.length
      ? new Date(past[past.length - 1].date)
      : new Date();

    const future = Array.from({ length: 12 }, (_, i) => {
      const fDate = new Date(lastDate);
      fDate.setHours(fDate.getHours() + i + 1);
      const entry: Record<string, any> = { date: fDate.toISOString() };
      treatments.forEach(
        (t) => (entry[t.medication_name] = t.predictions[i] ?? null)
      );
      return entry;
    });

    return [...past, ...future];
  };

  // 🎨 UI
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>What-If Glucose Prediction</CardTitle>
          <div className="flex flex-col">
            <Label className="text-sm">Select Admission</Label>
            <Select
              value={selectedAdmission ?? ""}
              onValueChange={setSelectedAdmission}
            >
              <SelectTrigger className="w-[220px] mt-2">
                <SelectValue placeholder="Select admission..." />
              </SelectTrigger>
              <SelectContent>
                {admissions.map((a) => (
                  <SelectItem key={a.admission_id} value={a.admission_id}>
                    {a.admission_id} —{" "}
                    {new Date(a.date).toLocaleDateString("en-US")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) =>
                  new Date(v).toLocaleString("en-US", {
                    hour: "2-digit",
                    hour12: false,
                  })
                }
                 interval={0}
              />
              <YAxis
                label={{
                  value: "Glucose (mg/dL)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                labelFormatter={(v) => new Date(v).toLocaleString()}
                formatter={(val, name) => [`${val} mg/dL`, name]}
              />
              <Legend />

              <Line
                type="monotone"
                dataKey="Glucose"
                stroke="#FFFFFF"
                strokeWidth={2}
                dot={<Dot r={3} fill="#FFF" />}
                name="Past Glucose"
              />

              {treatments.map((t, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={t.medication_name}
                  stroke={t.color}
                  strokeWidth={3}
                  dot={<Dot r={3} fill={t.color} />}
                  name={`${t.medication_name} (${t.dose}${t.unit})`}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-6">
            <Button onClick={() => setOpen(true)} disabled={loading}>
              + Add Treatment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 💊 Add Treatment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Treatment Option</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Medication</Label>
              <Select
                value={selectedMedication}
                onValueChange={setSelectedMedication}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select medication" />
                </SelectTrigger>
                <SelectContent>
                  {medications.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dose</Label>
                <Input
                  type="number"
                  step="any"
                  value={dose}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDose(val === "" ? 0 : parseFloat(val));
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="Units">Units</SelectItem>
                    <SelectItem value="mL">mL</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Route</Label>
              <Select value={route} onValueChange={setRoute}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IV">IV</SelectItem>
                  <SelectItem value="IM">IM</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="ORAL">ORAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleAddTreatment} disabled={loading}>
                {loading ? "Predicting..." : "Add Treatment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
