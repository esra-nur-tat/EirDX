import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// ✅ GET /api/history/[patient_id]
export async function GET(req: Request, context: any) {
  const { params } = await context; // 👈 Next 15: context artık Promise<RouteContext>
  const patientId = params.patient_id;

  try {
    // 1️⃣ Admissions
    const { data: admissions, error: admissionError } = await supabaseAdmin
      .from("admissions")
      .select("*")
      .eq("patient_id", patientId)
      .order("date", { ascending: false });

    if (admissionError) throw admissionError;

    // 2️⃣ Labs
    const { data: labs, error: labError } = await supabaseAdmin
      .from("labs")
      .select("*")
      .eq("patient_id", patientId);
    if (labError) throw labError;

    // 3️⃣ Treatments
    const { data: treatments, error: treatmentError } = await supabaseAdmin
      .from("treatments")
      .select("*")
      .eq("patient_id", patientId);
    if (treatmentError) throw treatmentError;

    // 4️⃣ Merge into timeline
    const history = (admissions || []).map((adm) => {
      let type: "visit" | "admission" | "discharge" = "admission";
      if (adm.status === "Admitted") type = "visit";
      if (adm.status === "Discharged") type = "discharge";

      return {
        id: adm.id,
        type,
        date: adm.date,
        description:
          adm.status === "Admitted"
            ? "Hastaneye kabul"
            : adm.status === "Inpatient"
            ? "Serviste yatış"
            : "Taburcu edildi",
        labs: (labs || [])
          .filter((lab) => lab.admission_id === adm.admission_id)
          .map((lab) => ({
            name: `${lab.lab_category} - ${lab.lab_type}`,
            result: lab.value,
            unit: lab.unit,
          })),
        treatments: (treatments || [])
          .filter((tr) => tr.admission_id === adm.admission_id)
          .map((tr) => ({
            name: tr.medication_name,
            dose: tr.dose,
            unit: tr.unit,
          })),
        summary:
          adm.status === "Discharged"
            ? adm.discharge_summary || "Taburcu özeti eklenmemiş"
            : null,
      };
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Hasta geçmişi getirilemedi: " + error.message },
      { status: 500 }
    );
  }
}
