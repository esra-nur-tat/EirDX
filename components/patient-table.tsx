"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ✅ use createBrowserClient 
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Doctor = { id: string; name: string };

type Patient = {
  id: string;
  name: string;
  identity_number: string;
  assignments?: { doctors: Doctor[] }[];
};

export function PatientTable() {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filterIdentity, setFilterIdentity] = useState("");
  const [filterName, setFilterName] = useState("");
  const [newName, setNewName] = useState("");
  const [newIdentity, setNewIdentity] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 🔹 Fetch patients
  const loadPatients = async (doctorId: string) => {
    try {
      const res = await fetch("/api/patients?doctorId=" + doctorId);
      const data = await res.json();
      if (data.patients) setPatients(data.patients);
    } catch {
      toast.error("Patients could not be loaded.");
    }
  };

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setDoctorId(user.id);
      await loadPatients(user.id);
    })();
  }, []);

  const filteredPatients = patients.filter((p) => {
    const matchIdentity = p.identity_number
      .toLowerCase()
      .includes(filterIdentity.toLowerCase());
    const matchName = p.name.toLowerCase().includes(filterName.toLowerCase());
    return matchIdentity && matchName;
  });

  // 🔹 Add patient
  const handleAdd = async () => {
    if (!newIdentity || !newName) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_ids: [doctorId],
          name: newName,
          identity_number: newIdentity,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setPatients((prev) => [data.patient, ...prev]); // ✅ update state    
        toast.success("New patient 🎉");
        setNewName("");
        setNewIdentity("");
        setOpenAdd(false);
      } else {
        toast.error(data.error || "Patient could not be added.");
      }
    } catch {
      toast.error("Server error");
    }
  };

  // 🔹 Delete patient
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        setPatients((prev) => prev.filter((p) => p.id !== id)); // ✅ update state
        toast.success("Patient deleted successfully.");
      } else {
        toast.error(data.error || "Delete failed.");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Card className="shadow-md bg-background/50 backdrop-blur-md">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>📋 Patient List</CardTitle>
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button size="sm">➕ New Patient</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Identity Number"
                value={newIdentity}
                onChange={(e) => setNewIdentity(e.target.value)}
              />
              <Input
                placeholder="Name Surname"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Button onClick={handleAdd}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Filter by Identity Number."
            value={filterIdentity}
            onChange={(e) => setFilterIdentity(e.target.value)}
          />
          <Input
            placeholder="Filter by Name Surname."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identitiy Number</TableHead>
              <TableHead>Name-Surname</TableHead>
              <TableHead>Doctors</TableHead>
              <TableHead className="text-right">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient, index) => (
                <motion.tr
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="border-b"
                >
                  <TableCell>{patient.identity_number}</TableCell>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>
                    {patient.assignments?.[0]?.doctors
                      ?.map((d) => d.name)
                      .join(", ") || "-"}
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        router.push(`/patients/${patient.id}/overview`)
                      }
                    >
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteId(patient.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-muted-foreground"
                >
                  No patients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this patient?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
