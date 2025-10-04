"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
import {
  Plus,
  Trash2,
  Pencil,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";

type LabRecord = {
  id: string;
  patient_id: string;
  date: string;
  admission_id: string;
  lab_category: string;
  lab_type: string;
  unit: string;
  value: number;
};

const labTypes: Record<string, string[]> = {
  "Hemoglobin A1c": ["-"],
  LDL: ["Calculated", "Measured"],
  Cholesterol: ["Serum", "HDL"],
  Chloride: ["Blood Gas", "Serum"],
  Glucose: ["Blood Gas", "Serum"],
  Potassium: ["Blood Gas", "Serum"],
  Sodium: ["Blood Gas", "Serum"],
  Triglycerides: ["Serum"],
};

const units = ["mEq/L", "mg/dL", "%"];

type SortConfig = {
  key: keyof LabRecord;
  direction: "asc" | "desc";
} | null;

export function LabRecordsTable() {
  const { id: patientId } = useParams<{ id: string }>();

  const [records, setRecords] = useState<LabRecord[]>([]);
  const [pendingDelete, setPendingDelete] = useState<LabRecord | null>(null);

  // filter
  const [filterAdmission, setFilterAdmission] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // list
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // form
  const [editingRecord, setEditingRecord] = useState<LabRecord | null>(null);
  const [date, setDate] = useState("");
  const [admissionId, setAdmissionId] = useState("");
  const [labCategory, setLabCategory] = useState("");
  const [labType, setLabType] = useState("");
  const [unit, setUnit] = useState("");
  const [value, setValue] = useState("");

  // ✅ fetch lab records
  useEffect(() => {
    if (!patientId) return;
    (async () => {
      const res = await fetch(`/api/labs?patient_id=${patientId}`);
      const data = await res.json();
      setRecords(data.labs || []);
    })();
  }, [patientId]);

  const resetForm = () => {
    setDate("");
    setAdmissionId("");
    setLabCategory("");
    setLabType("");
    setUnit("");
    setValue("");
    setEditingRecord(null);
  };

  const handleSave = async () => {
    if (
      !patientId ||
      !date ||
      !admissionId ||
      !labCategory ||
      !labType ||
      !unit ||
      !value
    ) {
      toast.error("Please fill in all fields.");
      return;
    }

    const payload = {
      patient_id: patientId,
      admission_id: admissionId,
      date,
      lab_category: labCategory,
      lab_type: labType,
      unit,
      value: parseFloat(value),
    };

    if (editingRecord) {
      const res = await fetch(`/api/labs/${editingRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setRecords((prev) =>
          prev.map((r) => (r.id === editingRecord.id ? data.lab : r))
        );
        toast.success("Record updated.");
      } else toast.error(data.error);
    } else {
      const res = await fetch("/api/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setRecords((prev) => [data.lab, ...prev]);
        toast.success("New record added.");
      } else toast.error(data.error);
    }

    resetForm();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const res = await fetch(`/api/labs/${pendingDelete.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRecords((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      toast.success("Record deleted.");
    }
    setPendingDelete(null);
  };

  const startEdit = (record: LabRecord) => {
    setEditingRecord(record);
    setDate(format(new Date(record.date), "yyyy-MM-dd'T'HH:mm"));
    setAdmissionId(record.admission_id);
    setLabCategory(record.lab_category);
    setLabType(record.lab_type);
    setUnit(record.unit);
    setValue(record.value.toString());
  };

  const requestSort = (key: keyof LabRecord) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof LabRecord) => {
    if (!sortConfig || sortConfig.key !== key)
      return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  // filtering
  let filteredRecords = records.filter((rec) => {
    const matchAdmission = rec.admission_id
      .toLowerCase()
      .includes(filterAdmission.toLowerCase());
    const matchCategory =
      filterCategory === "all" ? true : rec.lab_category === filterCategory;
    return matchAdmission && matchCategory;
  });

  // list
  // list
  if (sortConfig) {
    filteredRecords = [...filteredRecords].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (sortConfig.key === "date") {
        const aTime = new Date(aVal as string).getTime();
        const bTime = new Date(bVal as string).getTime();
        return sortConfig.direction === "asc" ? aTime - bTime : bTime - aTime;
      }

      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }

  // pagination
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const currentRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <Card className="bg-background/40 backdrop-blur-md border border-white/10 shadow-lg">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>🧪 Laboratory Records</CardTitle>
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
                {editingRecord ? "Edit Lab Results" : "New Lab Results"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Input
                placeholder="Admission ID"
                value={admissionId}
                onChange={(e) => setAdmissionId(e.target.value)}
              />
              <Select
                value={labCategory}
                onValueChange={(val) => {
                  setLabCategory(val);
                  setLabType("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose Lab Category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(labTypes).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={labType}
                onValueChange={setLabType}
                disabled={!labCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose Lab Type" />
                </SelectTrigger>
                <SelectContent>
                  {labCategory &&
                    labTypes[labCategory].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Result value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
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
        {/* Filtre alanları */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input
            placeholder="Filter by Admission ID"
            value={filterAdmission}
            onChange={(e) => setFilterAdmission(e.target.value)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {filterCategory === "all"
                  ? "Category: All"
                  : `Category: ${filterCategory}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterCategory("all")}>
                Tümü
              </DropdownMenuItem>
              {Object.keys(labTypes).map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tablo */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => requestSort("date")}
                  className="flex items-center gap-1"
                >
                  Date {getSortIcon("date")}
                </Button>
              </TableHead>
              <TableHead>Admission ID</TableHead>
              <TableHead>Lab Category</TableHead>
              <TableHead>Lab Type</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-6"
                >
                  No record found.
                </TableCell>
              </TableRow>
            ) : (
              currentRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.date), "dd.MM.yyyy HH:mm")}
                  </TableCell>
                  <TableCell>{record.admission_id}</TableCell>
                  <TableCell>{record.lab_category}</TableCell>
                  <TableCell>{record.lab_type}</TableCell>
                  <TableCell>{record.value}</TableCell>
                  <TableCell>{record.unit}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(record)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setPendingDelete(record)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are your sure?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={confirmDelete}>
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
