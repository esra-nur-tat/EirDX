"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Patient = {
  id: string;
  identity_number: string;
  name: string;
  birth_date: string | null;
  weight: number | null;
  height: number | null;
  blood_type: string | null;
  room: string | null;
};

export default function PatientSettingsPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/patients/${id}`);
      const data = await res.json();
      if (res.ok) {
        setPatient(data.patient);
      } else {
        toast.error(data.error || "Patient information could not be retrieved.");
      }
      setLoading(false);
    })();
  }, [id]);

  const handleChange = (field: keyof Patient, value: string) => {
    if (!patient) return;

    let parsed: any = value;
    if (field === "weight" || field === "height") {
      parsed = value === "" ? null : parseFloat(value);
    }
    setPatient({ ...patient, [field]: parsed });
  };

  const handleSave = async () => {
    if (!patient) return;
    const res = await fetch(`/api/patients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Patient information has been updated successfully.");
    } else {
      toast.error(data.error || "Record could not be updated.");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  if (!patient) return <p className="p-6">Patient not found.</p>;

  return (
    <Card className="max-w-2xl mx-auto mt-6 bg-background/50 backdrop-blur-md">
      <CardHeader>
        <CardTitle>⚙️ Patient Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Identity Number</label>
          <Input
            value={patient.identity_number}
            onChange={(e) => handleChange("identity_number", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Name-Surname</label>
          <Input
            value={patient.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date of Birth</label>
          <Input
            type="date"
            value={patient.birth_date ?? ""}
            onChange={(e) => handleChange("birth_date", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Weight (kg)</label>
            <Input
              type="number"
              value={patient.weight ?? ""}
              onChange={(e) => handleChange("weight", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Height (cm)</label>
            <Input
              type="number"
              value={patient.height ?? ""}
              onChange={(e) => handleChange("height", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Blood Type</label>
          <Input
            value={patient.blood_type ?? ""}
            onChange={(e) => handleChange("blood_type", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Room</label>
          <Input
            value={patient.room ?? ""}
            onChange={(e) => handleChange("room", e.target.value)}
          />
        </div>

        <Button onClick={handleSave}>Save</Button>
      </CardContent>
    </Card>
  );
}
