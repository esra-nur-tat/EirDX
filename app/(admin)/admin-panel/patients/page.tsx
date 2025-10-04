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
import { Input } from "@/components/ui/input";
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
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Patient = {
  id: string; // It will be automatically assigned by Supabase.
  name: string;
  identity_number: string;
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");

  // filtre state
  const [filterName, setFilterName] = useState("");
  const [filterIdentity, setFilterIdentity] = useState("");

  // load patients
  useEffect(() => {
    const fetchPatients = async () => {
      const res = await fetch("/api/patients");
      const data = await res.json();
      if (data.patients) {
        setPatients(data.patients);
      }
    };
    fetchPatients();
  }, []);

  const resetForm = () => {
    setName("");
    setIdentityNumber("");
    setEditingPatient(null);
  };

  const handleSave = async () => {
    if (!name || !identityNumber) {
      toast.error("All fields must be filled in!");
      return;
    }

    if (editingPatient) {
      // update
      const res = await fetch(`/api/patients/${editingPatient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, identity_number: identityNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setPatients((prev) =>
          prev.map((p) => (p.id === editingPatient.id ? data.patient : p))
        );
        toast.success("Patient information has been updated successfully.");
      } else {
        toast.error(data.error || "An error occurred");
      }
    } else {
      // add
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, identity_number: identityNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setPatients((prev) => [...prev, data.patient]);
        toast.success("Patient has been added successfully.");
      } else {
        toast.error(data.error || "An error occurred!");
      }
    }

    resetForm();
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPatients((prev) => prev.filter((p) => p.id !== id));
      toast.success("Patient has been deleted successfully.");
    } else {
      const data = await res.json();
      toast.error(data.error || "An error occurred while deleting.");
    }
  };

  const startEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setName(patient.name);
    setIdentityNumber(patient.identity_number);
    setDialogOpen(true);
  };

  // filtered list
  const filteredPatients = patients.filter((p) => {
    const matchName = p.name.toLowerCase().includes(filterName.toLowerCase());
    const matchIdentity = p.identity_number
      .toLowerCase()
      .includes(filterIdentity.toLowerCase());
    return matchName && matchIdentity;
  });

  return (
    <Card className="bg-card/70 backdrop-blur-md">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>👩‍🦽 Patients</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPatient ? "Edit Patient" : "Add New Patient"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Name-Surname"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Identity Number"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
              />
              <Button onClick={handleSave} className="w-full">
                {editingPatient ? "Update" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {/* filter */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input
            placeholder="Filter by Name-Surname"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          <Input
            placeholder="Filter by Identity Number"
            value={filterIdentity}
            onChange={(e) => setFilterIdentity(e.target.value)}
          />
        </div>

        {/* tabel */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name-Surname</TableHead>
              <TableHead>Identity Number</TableHead>
              <TableHead className="text-right">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-6 text-muted-foreground"
                >
                  No patients found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.identity_number}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(p)}
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
                            Are you sure you want to delete this patient?
                          </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(p.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
