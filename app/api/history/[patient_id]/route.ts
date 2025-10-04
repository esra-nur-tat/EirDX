import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// GET /api/history/[patient_id]
export async function GET(
  req: Request,
  { params }: { params: { patient_id: string } }
) {
  const patientId = params.patient_id;

  try {
    // Admissions
    const { data: admissions, error: admissionError } = await supabaseAdmin
      .from("admissions")
      .select("*")
      .eq("patient_id", patientId);

    if (admissionError) throw admissionError;

    // Labs
    const { data: labs, error: labError } = await supabaseAdmin
      .from("labs")
      .select("*")
      .eq("patient_id", patientId);

    if (labError) throw labError;

    // Treatments
    const { data: treatments, error: treatmentError } = await supabaseAdmin
      .from("treatments")
      .select("*")
      .eq("patient_id", patientId);

    if (treatmentError) throw treatmentError;

    // Timeline
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
    console.error("History fetch error:", error.message);
    return NextResponse.json(
      { error: "Hasta geçmişi getirilemedi" },
      { status: 500 }
    );
  }
}
