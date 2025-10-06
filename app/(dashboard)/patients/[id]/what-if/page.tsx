"use client";

import React, { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const medications = [
  "Insulin",
  "Olanzapine",
  "Glucagon",
  "Dexamethasone",
  "Ritonavir",
  "MetFORMIN (Glucophage)",
];

const colors = [
  "#E57373", "#64B5F6", "#81C784", "#FFD54F", "#BA68C8",
  "#4DB6AC", "#FF8A65", "#A1887F", "#90A4AE", "#F06292",
];

interface Treatment {
  medication_name: string;
  dose: number;
  unit: string;
  route: string;
  color: string;
  predictions: number[];
}

export default function WhatIfPage({ params }: { params: { id: string } }) {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<string | null>(null);
  const [labs, setLabs] = useState<{ date: string; glucose: number }[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState("Insulin");
  const [dose, setDose] = useState<number>(10);
  const [unit, setUnit] = useState<string>("mg");
  const [route, setRoute] = useState<string>("IV");
  const [loading, setLoading] = useState(false);

  const getNextColor = () => colors[treatments.length % colors.length];

  // --------------------------
  // 🏥 Fetch Admissions for Patient
  // --------------------------
  useEffect(() => {
    const fetchAdmissions = async () => {
      const { data, error } = await supabase
        .from("admissions")
        .select("admission_id, date, status")
        .eq("patient_id", params.id)
        .order("date", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setAdmissions(data);
      if (data.length > 0) setSelectedAdmission(data[0].admission_id);
    };
    fetchAdmissions();
  }, [params.id]);

  // --------------------------
  // 🧪 Fetch Labs for Selected Admission
  // --------------------------
  useEffect(() => {
    if (!selectedAdmission) return;

    const fetchLabs = async () => {
      const { data, error } = await supabase
        .from("labs")
        .select("value, date")
        .eq("patient_id", params.id)
        .eq("admission_id", selectedAdmission)
        .eq("lab_category", "Glucose")
        .order("date", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      if (data && data.length > 0) {
        const transformed = data.map((d) => ({
          date: d.date,
          glucose: d.value,
        }));
        setLabs(transformed);
      } else {
        setLabs([]);
      }
    };

    fetchLabs();
  }, [params.id, selectedAdmission]);

  // --------------------------
  // 💉 Add What-If Treatment (Predict API)
  // --------------------------
  const handleAddTreatment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: params.id,
          treatment: {
            medication_name: selectedMedication,
            dose,
            unit,
            route,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");

      const newTreatment: Treatment = {
        medication_name: selectedMedication,
        dose,
        unit,
        route,
        color: getNextColor(),
        predictions: data.predictions || [],
      };

      setTreatments((prev) => [...prev, newTreatment]);
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert("Prediction API failed — check console");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // 📊 Merge Past Labs + Predictions with Dates
  // --------------------------
  const chartData = () => {
    const past = labs.map((l) => ({
      date: new Date(l.date).toISOString(),
      Glucose: l.glucose,
    }));

    const lastDate = past.length > 0 ? new Date(past[past.length - 1].date) : new Date();

    const future = Array.from({ length: 24 }, (_, i) => {
      const futureDate = new Date(lastDate);
      futureDate.setHours(futureDate.getHours() + i + 1);
      const entry: Record<string, any> = { date: futureDate.toISOString() };
      treatments.forEach((t) => {
        entry[t.medication_name] = t.predictions[i] ?? null;
      });
      return entry;
    });

    return [...past, ...future];
  };

  // --------------------------
  // 🎨 Render
  // --------------------------
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>What-If Glucose Prediction</CardTitle>
            {/* Admission Selector */}
            <div>
              <Label>Select Admission</Label>
              <select
                className="ml-3 border rounded-md p-2 bg-black text-white"
                value={selectedAdmission ?? ""}
                onChange={(e) => setSelectedAdmission(e.target.value)}
              >
                {admissions.map((a) => (
                  <option key={a.admission_id} value={a.admission_id}>
                    {a.admission_id} — {new Date(a.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => new Date(v).toLocaleString("en-US", { hour: "2-digit", hour12: false })}
                label={{ value: "Date/Time", position: "insideBottom", offset: -5 }}
              />
              <YAxis label={{ value: "Glucose (mg/dL)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                labelFormatter={(v) => new Date(v).toLocaleString()}
                formatter={(val, name) => [`${val} mg/dL`, name]}
              />
              <Legend />

              {/* Past Glucose Line */}
              <Line
                type="monotone"
                dataKey="Glucose"
                stroke="#FFFFFF"
                strokeWidth={2}
                dot={<Dot r={3} fill="#FFF" />}
                name="Past Glucose"
              />

              {/* Future Predictions */}
              {treatments.map((t, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={t.medication_name}
                  stroke={t.color}
                  strokeWidth={3}
                  dot={<Dot r={3} fill={t.color} />}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Add Treatment */}
          {treatments.length < 3 && (
            <div className="mt-6">
              <Button onClick={() => setOpen(true)} disabled={loading}>
                + Add Treatment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 💊 Add Treatment Popup */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Treatment Option</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Medication</Label>
              <select
                className="w-full border rounded-md p-2"
                value={selectedMedication}
                onChange={(e) => setSelectedMedication(e.target.value)}
              >
                {medications.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dose</Label>
                <Input type="number" value={dose} onChange={(e) => setDose(parseFloat(e.target.value))} />
              </div>
              <div>
                <Label>Unit</Label>
                <select className="w-full border rounded-md p-2" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="mg">mg</option>
                  <option value="mL">mL</option>
                  <option value="Units">Units</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Route</Label>
              <select className="w-full border rounded-md p-2" value={route} onChange={(e) => setRoute(e.target.value)}>
                <option value="IV">IV</option>
                <option value="IM">IM</option>
                <option value="SC">SC</option>
                <option value="ORAL">ORAL</option>
              </select>
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
