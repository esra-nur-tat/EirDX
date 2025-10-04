"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, KeyRound, Plus } from "lucide-react";
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

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  email: string;
  temp_password?: string;
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [email, setEmail] = useState("");

  // fetch doctors
  useEffect(() => {
    fetch("/api/doctors")
      .then((res) => res.json())
      .then((data) => setDoctors(data.doctors || []));
  }, []);

  const resetForm = () => {
    setName("");
    setSpecialty("");
    setEmail("");
    setEditingDoctor(null);
  };

  const handleSave = async () => {
    if (!name || !specialty || !email) {
      toast.error("All fields must be filled in!");
      return;
    }

    if (editingDoctor) {
      const res = await fetch(`/api/doctors/${editingDoctor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialty, email }),
      });
      const data = await res.json();
      if (data.error) return toast.error(data.error);

      setDoctors((prev) =>
        prev.map((d) =>
          d.id === editingDoctor.id ? { ...d, name, specialty, email } : d
        )
      );
      toast.success("Doctor information has been updated successfully.");
    } else {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialty, email }),
      });
      const data = await res.json();
      if (data.error) return toast.error(data.error);
      setDoctors((prev) => [
        ...prev,
        {
          id: data.doctor.id,
          name,
          specialty,
          email,
          temp_password: data.doctor.temp_password,
        },
      ]);
      toast.success("Doctor added successfully.");
    }

    resetForm();
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/doctors/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.error) return toast.error(data.error);

    setDoctors((prev) => prev.filter((d) => d.id !== id));
    toast.success("Doctor deleted.");
  };

  const handleResetPassword = async (id: string) => {
    const res = await fetch(`/api/doctors/${id}/reset-password`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.error) return toast.error(data.error);

    setDoctors((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, temp_password: data.tempPassword } : d
      )
    );
    toast.info(`Temporary password assigned: ${data.tempPassword}`);
  };

  const startEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setName(doctor.name);
    setSpecialty(doctor.specialty);
    setEmail(doctor.email);
    setDialogOpen(true);
  };

  return (
    <Card className="bg-card/70 backdrop-blur-md">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>👨‍⚕️ Doktorlar</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Doctor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Name-Surname"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Field of Specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
              <Input
                placeholder="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleSave} className="w-full">
                {editingDoctor ? "Update" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {doctors.length === 0 ? (
          <p className="text-muted-foreground">No doctor has been added yet.</p>
        ) : (
          <ul className="space-y-2">
            {doctors.map((d) => (
              <li
                key={d.id}
                className="p-3 border rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {d.name} - {d.specialty}
                  </p>
                  <p className="text-sm text-muted-foreground">{d.email}</p>
                  {d.temp_password && (
                    <p className="text-xs text-primary">
                      Temporary Password: {d.temp_password}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(d)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleResetPassword(d.id)}
                  >
                    <KeyRound className="h-4 w-4 text-blue-500" />
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
                          Are you sure you want to delete this doctor?
                        </AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(d.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
