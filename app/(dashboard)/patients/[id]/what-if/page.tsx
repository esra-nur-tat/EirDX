"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const medications = [
  "Tacrolimus", "Insulin", "Olanzapine", "Glucagon", "Dexamethasone",
  "Sirolimus", "Prednisone", "Tacrolimus XR", "Triamterene-HCTZ (37.5/25)",
  "GlipiZIDE XL", "Furosemide", "Hydrocortisone", "Hydrocortisone Na",
  "Hydrochlorothiazide", "Spironolactone", "Empagliflozin", "CycloSPORINE (Sandimmune)",
  "Eplerenone", "Chlorthalidone", "Phenytoin", "CycloSPORINE (Neoral) MODIFIED",
  "Octreotide Acetate", "Fosphenytoin", "Phenytoin Sodium (IV)", "Valproate Sodium",
  "Dextrose Water", "Ritonavir", "MetFORMIN XR (Glucophage XR)", "Dextrose 50%",
  "MetFORMIN (Glucophage)"
];

const units = ["Units", "mg", "mL", "g"];
const routes = ["IV", "IM", "SC", "ORAL"];

type Treatment = {
  id: string;
  medication: string;
  dose: number;
  unit: string;
  route: string;
  color: string;
  data?: { hour: number; value: number }[];
};

export default function WhatIfPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [glucoseValues] = useState([
    { hour: 0, value: 122 },
    { hour: 1, value: 130 },
    { hour: 2, value: 143 },
  ]); // observed data

  const [open, setOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("mg");
  const [selectedRoute, setSelectedRoute] = useState("IV");
  const [dose, setDose] = useState(10);

  const maxTreatments = 3;
  const colorPalette = ["#EF4444", "#F59E0B", "#3B82F6"];

  // Find last observed hour to offset predictions
  const lastObservedHour = glucoseValues[glucoseValues.length - 1].hour;

  const handleAddTreatment = async () => {
    if (treatments.length >= maxTreatments) return;

    const newTreatment: Treatment = {
      id: crypto.randomUUID(),
      medication: selectedMedication || "Insulin",
      dose: dose,
      unit: selectedUnit,
      route: selectedRoute,
      color: colorPalette[treatments.length],
    };

    // 🔧 MOCK API CALL
    const mockApiResponse = {
      predictions: {
        q50: Array.from({ length: 24 }, (_, i) => 120 + Math.sin(i / 2) * 10 - i / 3),
      },
    };

    // Start after the last observed hour
    const formattedData = mockApiResponse.predictions.q50.map((v, i) => ({
      hour: lastObservedHour + 1 + i, // offset
      value: v,
    }));

    setTreatments((prev) => [...prev, { ...newTreatment, data: formattedData }]);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setTreatments((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Glucose Prediction — What-If Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Chart */}
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, 24]} // ✅ Fixed domain (0–24 hours)
                  dataKey="hour"
                  label={{ value: "Hour", position: "insideBottomRight", offset: -5 }}
                />
                <YAxis
                  label={{
                    value: "Glucose (mg/dL)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />

                {/* Real glucose values */}
                <Line
                  data={glucoseValues}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#fff" }}
                  name="Patient Glucose"
                />

                {/* Predictions */}
                {treatments.map((t) => (
                  <Line
                    key={t.id}
                    data={t.data}
                    dataKey="value"
                    stroke={t.color}
                    strokeWidth={3}
                    dot={false}
                    name={`${t.medication} ${t.dose}${t.unit}`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Active treatments */}
          <div className="mt-6 space-y-4">
            {treatments.map((t) => (
              <Card key={t.id} className="p-4 border-2">
                <div className="flex justify-between items-center">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: t.color }} // ✅ line-matching color
                  >
                    {t.medication} — {t.dose}
                    {t.unit} ({t.route})
                  </p>
                  <Button variant="destructive" onClick={() => handleDelete(t.id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}


            {/* Popup for new treatment */}
            {treatments.length < maxTreatments && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">Add Treatment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Treatment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div>
                      <Label>Medication</Label>
                      <Select onValueChange={setSelectedMedication}>
                        <SelectTrigger>
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
                    <div>
                      <Label>Dose</Label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-md bg-background"
                        value={dose}
                        onChange={(e) => setDose(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <Label>Unit</Label>
                        <Select onValueChange={setSelectedUnit}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-1/2">
                        <Label>Route</Label>
                        <Select onValueChange={setSelectedRoute}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select route" />
                          </SelectTrigger>
                          <SelectContent>
                            {routes.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddTreatment}>Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {treatments.length >= maxTreatments && (
              <p className="text-sm text-muted-foreground text-center">
                Max treatment limit reached (3)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
