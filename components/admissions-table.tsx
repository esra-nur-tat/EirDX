"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdmissionStatus = "Admitted" | "Inpatient" | "Discharged";

type Admission = {
  id: string;
  admission_id: string;
  date: string;
  status: AdmissionStatus;
  patient_id: string;
};

export function AdmissionsTable() {
  const { id: patientId } = useParams<{ id: string }>();
  const [records, setRecords] = useState<Admission[]>([]);

  // filter state
  const [filterAdmission, setFilterAdmission] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // form state
  const [editingRecord, setEditingRecord] = useState<Admission | null>(null);
  const [admissionId, setAdmissionId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<AdmissionStatus | "">("");

  // fetch admissions only related to patients 
  useEffect(() => {
    if (!patientId) return;
    (async () => {
      const res = await fetch(`/api/admissions?patient_id=${patientId}`);
      const data = await res.json();
      setRecords(data.admissions || []);
    })();
  }, [patientId]);

  const resetForm = () => {
    setAdmissionId("");
    setDate("");
    setStatus("");
    setEditingRecord(null);
  };

  const handleSave = async () => {
    if (!admissionId || !date || !status) {
      toast.error("All fields are required.");
      return;
    }

    const payload = {
      admission_id: admissionId,
      date,
      status,
      patient_id: patientId, // 🔑 URL’den gelen hasta ID
    };

    if (editingRecord) {
      const res = await fetch(`/api/admissions/${editingRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setRecords((prev) =>
          prev.map((r) => (r.id === editingRecord.id ? data.admission : r))
        );
        toast.success("Record updated.");
      } else {
        toast.error(data.error);
      }
    } else {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setRecords((prev) => [data.admission, ...prev]);
        toast.success("New record added.");
      } else {
        toast.error(data.error);
      }
    }

    resetForm();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admissions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      toast.info("Record deleted.");
    }
  };

  const startEdit = (record: Admission) => {
    setEditingRecord(record);
    setAdmissionId(record.admission_id);
    setDate(format(new Date(record.date), "yyyy-MM-dd'T'HH:mm"));
    setStatus(record.status);
  };

  // filtreleme
  let filteredRecords = records.filter((rec) => {
    const matchAdmission = rec.admission_id
      .toLowerCase()
      .includes(filterAdmission.toLowerCase());
    const matchStatus = filterStatus ? rec.status === filterStatus : true;
    return matchAdmission && matchStatus;
  });

  // pagination
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirst, indexOfLast);

  return (
    <Card className="bg-background/40 backdrop-blur-md border border-white/10 shadow-lg">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>🏥 Admissions</CardTitle>
        <Dialog
          open={!!editingRecord || undefined}
          onOpenChange={(open) => !open && resetForm()}
        >
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? "Edit Record" : "New Record"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                placeholder="Admission ID"
                value={admissionId}
                onChange={(e) => setAdmissionId(e.target.value)}
              />
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as AdmissionStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Statue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admitted">Admitted </SelectItem>
                  <SelectItem value="Inpatient">Inpatient </SelectItem>
                  <SelectItem value="Discharged">
                    Discharged 
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSave}>
                {editingRecord ? "Update" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {/* Filtreler */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input
            placeholder="Admission ID filtrele"
            value={filterAdmission}
            onChange={(e) => setFilterAdmission(e.target.value)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {filterStatus === "" ? "Status: All" : `Status: ${filterStatus}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus("")}>
                Tümü
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Admitted")}>
                Admitted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Inpatient")}>
                Inpatient
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Discharged")}>
                Discharged
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tablo */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Admission ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-6"
                >
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              currentRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.date), "dd.MM.yyyy HH:mm")}
                  </TableCell>
                  <TableCell>{record.admission_id}</TableCell>
                  <TableCell>{record.status}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(record)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
