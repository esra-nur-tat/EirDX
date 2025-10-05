"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Treatment = {
  id: string;
  patient_id: string;
  admission_id: string;
  start_date: string;
  end_date: string;
  medication_name: string;
  dose: number;
  unit: string;
  route: string;
};

type SortConfig = {
  key: keyof Treatment;
  direction: "asc" | "desc";
} | null;

const medications = [
  "Tacrolimus",
  "Insulin",
  "Olanzapine",
  "Glucagon",
  "Dexamethasone",
  "Sirolimus",
  "Prednisone",
  "Tacrolimus XR",
  "Triamterene-HCTZ (37.5/25)",
  "GlipiZIDE XL",
  "Furosemide",
  "Hydrocortisone",
  "Hydrocortisone Na",
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
  "MetFORMIN (Glucophage)"
];
const units = ["Units", "mg", "mL", "g"];
const routes = ["IV", "IM", "SC", "ORAL"];

export function TreatmentsTable() {
  const params = useParams();
  const patientId = params.id as string;

  const [records, setRecords] = useState<Treatment[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Treatment | null>(null);

  // filtre state
  const [filterAdmission, setFilterAdmission] = useState("");
  const [filterMedication, setFilterMedication] = useState<string>("all");
  const [statusTab, setStatusTab] = useState("all");

  // sıralama state
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // form state
  const [editingRecord, setEditingRecord] = useState<Treatment | null>(null);
  const [admissionId, setAdmissionId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("");
  const [route, setRoute] = useState("");

  // fetch data
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/treatments?patient_id=${patientId}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.treatments || []);
      }
    })();
  }, [patientId]);

  const resetForm = () => {
    setAdmissionId("");
    setStartDate("");
    setEndDate("");
    setMedicationName("");
    setDose("");
    setUnit("");
    setRoute("");
    setEditingRecord(null);
  };

  const handleSave = async () => {
    if (
      !admissionId ||
      !startDate ||
      !endDate ||
      !medicationName ||
      !dose ||
      !unit ||
      !route
    ) {
      toast.error("Please fill in all fields.");
      return;
    }

    const payload = {
      patient_id: patientId,
      admission_id: admissionId,
      start_date: startDate,
      end_date: endDate,
      medication_name: medicationName,
      dose: parseFloat(dose),
      unit,
      route,
    };

    if (editingRecord) {
      const res = await fetch(`/api/treatments/${editingRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setRecords((prev) =>
          prev.map((r) => (r.id === editingRecord.id ? data.treatment : r))
        );
        toast.success("Treatment record updated successfully.");
      } else {
        toast.error(data.error);
      }
    } else {
      const res = await fetch("/api/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setRecords((prev) => [data.treatment, ...prev]);
        toast.success("New treatment record added successfully.");
      } else {
        toast.error(data.error);
      }
    }

    resetForm();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const res = await fetch(`/api/treatments/${pendingDelete.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRecords((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      toast.info("Treatment record deleted.");
      setPendingDelete(null);
    }
  };

  const startEdit = (record: Treatment) => {
    setEditingRecord(record);
    setAdmissionId(record.admission_id);
    setStartDate(format(new Date(record.start_date), "yyyy-MM-dd'T'HH:mm"));
    setEndDate(format(new Date(record.end_date), "yyyy-MM-dd'T'HH:mm"));
    setMedicationName(record.medication_name);
    setDose(record.dose.toString());
    setUnit(record.unit);
    setRoute(record.route);
  };

  const requestSort = (key: keyof Treatment) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Treatment) => {
    if (!sortConfig || sortConfig.key !== key)
      return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  // filtre + tab
  let filteredRecords = records.filter((rec) => {
    const matchAdmission = rec.admission_id
      .toLowerCase()
      .includes(filterAdmission.toLowerCase());
    const matchMedication =
      filterMedication === "all"
        ? true
        : rec.medication_name === filterMedication;

    const now = new Date();
    let matchStatus = true;
    if (statusTab === "ongoing") matchStatus = new Date(rec.end_date) > now;
    if (statusTab === "finished") matchStatus = new Date(rec.end_date) <= now;

    return matchAdmission && matchMedication && matchStatus;
  });

  // listing
  if (sortConfig) {
    filteredRecords = [...filteredRecords].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Date Comparison
      if (sortConfig.key === "start_date" || sortConfig.key === "end_date") {
        const aDate = new Date(aVal as string);
        const bDate = new Date(bVal as string);
        return sortConfig.direction === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      // Number Comparison
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      // String Comparison
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
        <CardTitle>💊 Treatment Records</CardTitle>
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
                {editingRecord ? "Edit Treatment Record" : "New Treatment Record"}
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Select value={medicationName} onValueChange={setMedicationName}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Medication" />
                </SelectTrigger>
                <SelectContent>
                  {medications.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Dose Value"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
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
              <Select value={route} onValueChange={setRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Select administriation root." />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
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
        {/* Tabs */}
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="finished">Finished</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mt-4 mb-4 items-center">
          <Input
            placeholder="Filter by Admission ID"
            value={filterAdmission}
            onChange={(e) => setFilterAdmission(e.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {filterMedication === "all"
                  ? "Medications: All"
                  : `Medication: ${filterMedication}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterMedication("all")}>
                Tümü
              </DropdownMenuItem>
              {medications.map((m) => (
                <DropdownMenuItem
                  key={m}
                  onClick={() => setFilterMedication(m)}
                >
                  {m}
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
                  onClick={() => requestSort("start_date")}
                  className="flex items-center gap-1"
                >
                  Start {getSortIcon("start_date")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => requestSort("end_date")}
                  className="flex items-center gap-1"
                >
                  End  {getSortIcon("end_date")}
                </Button>
              </TableHead>
              <TableHead>Admission ID</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => requestSort("medication_name")}
                  className="flex items-center gap-1"
                >
                  Medication {getSortIcon("medication_name")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => requestSort("dose")}
                  className="flex items-center gap-1"
                >
                  Dose {getSortIcon("dose")}
                </Button>
              </TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Administiration Root</TableHead>
              <TableHead className="text-right">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-6"
                >
                  Hiç kayıt bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              currentRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.start_date), "dd.MM.yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.end_date), "dd.MM.yyyy HH:mm")}
                  </TableCell>
                  <TableCell>{record.admission_id}</TableCell>
                  <TableCell>{record.medication_name}</TableCell>
                  <TableCell>{record.dose}</TableCell>
                  <TableCell>{record.unit}</TableCell>
                  <TableCell>{record.route}</TableCell>
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
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action is irreversible. The treatment record will be permanently deleted.
                          </AlertDialogDescription>
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
