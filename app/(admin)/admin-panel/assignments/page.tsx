"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Doctor = { id: string; name: string; specialty: string };
type Patient = { id: string; name: string; identity_number: string };
type Assignment = { id: string; patient_id: string; doctor_ids: string[] };

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );

  // form state
  const [patientId, setPatientId] = useState("");
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, dRes, pRes] = await Promise.all([
          fetch("/api/assignments").then((res) => res.json()),
          fetch("/api/doctors").then((res) => res.json()),
          fetch("/api/patients").then((res) => res.json()),
        ]);

        setAssignments(Array.isArray(aRes) ? aRes : aRes.assignments ?? []);
        setDoctors(Array.isArray(dRes) ? dRes : dRes.doctors ?? []);
        setPatients(Array.isArray(pRes) ? pRes : pRes.patients ?? []);
      } catch (err) {
        console.error("Error while retrieving data:", err);
        toast.error("Data could not be loaded!");
      }
    };

    fetchData();
  }, []);

  const resetForm = () => {
    setPatientId("");
    setSelectedDoctors([]);
    setEditingAssignment(null);
  };

  const toggleDoctor = (id: string) => {
    setSelectedDoctors((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!patientId || selectedDoctors.length === 0) {
      toast.error("A patient and at least one doctor must be selected!");
      return;
    }

    try {
      if (editingAssignment) {
        // UPDATE
        const res = await fetch(`/api/assignments/${editingAssignment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: patientId,
            doctor_ids: selectedDoctors,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setAssignments((prev) =>
            prev.map((a) =>
              a.id === editingAssignment.id ? data.assignment : a
            )
          );
          toast.success("Assignment has been updated successfully.");
        } else {
          toast.error(data.error || "Uodate failed!");
        }
      } else {
        // CREATE
        const res = await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: patientId,
            doctor_ids: selectedDoctors,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setAssignments((prev) => [...prev, data.assignment]);
          toast.success("Assignment has been created successfully.");
        } else {
          toast.error(data.error || "Creation failed!");
        }
      }
    } catch (err) {
      console.error("Saving error:", err);
      toast.error("An error occurred!");
    }

    resetForm();
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== id));
        toast.success("Assignment has been deleted.");
      } else {
        toast.error("Deleting failed!");
      }
    } catch (err) {
      console.error("Deleting error:", err);
      toast.error("An error occured!");
    }
  };

  const startEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setPatientId(assignment.patient_id);
    setSelectedDoctors(assignment.doctor_ids);
    setDialogOpen(true);
  };

  return (
    <Card className="bg-card/70 backdrop-blur-md">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>🔗 Patient - Doctor Assignments</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAssignment ? "Update Assignment " : "Create New Assignment"}
              </DialogTitle>
            </DialogHeader>

            {/* Select patient */}
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (TC: {p.identity_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Select Dcotor */}
            <div className="mt-4 space-y-2">
              {doctors.map((d) => (
                <label
                  key={d.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={selectedDoctors.includes(d.id)}
                    onCheckedChange={() => toggleDoctor(d.id)}
                  />
                  {d.name} -{" "}
                  <span className="text-muted-foreground">{d.specialty}</span>
                </label>
              ))}
            </div>

            <Button onClick={handleSave} className="w-full mt-4">
              {editingAssignment ? "Update" : "Save"}
            </Button>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-muted-foreground">No assignment has been made yet.</p>
        ) : (
          <ul className="space-y-2">
            {assignments.map((a) => {
              const patient = patients.find((p) => p.id === a.patient_id);
              const assignedDoctors = a.doctor_ids
                .map((id) => doctors.find((d) => d.id === id)?.name)
                .filter(Boolean)
                .join(", ");

              return (
                <li
                  key={a.id}
                  className="p-3 border rounded-md flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{patient?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Doktorlar: {assignedDoctors}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(a)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you sure you want to delete this assignment?”
                          </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(a.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
