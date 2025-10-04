import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// GET /api/dashboard
export async function GET(req: Request) {
  try {
    const doctorId = req.headers.get("x-doctor-id");
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doktor ID bulunamadı" },
        { status: 401 }
      );
    }

    // 1. Bu doktora bağlı assignment’lardan hasta id’lerini bul
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from("assignments")
      .select("patient_id")
      .contains("doctor_ids", [doctorId]);

    if (assignError) throw assignError;

    const patientIds = assignments?.map((a) => a.patient_id) || [];
    if (patientIds.length === 0) {
      return NextResponse.json({
        stats: {
          patientCount: 0,
          todayTests: 0,
          ongoingTreatments: 0,
          inpatientCount: 0,
        },
      });
    }

    // 2. Hasta sayısı
    const patientCount = patientIds.length;

    // 3. Bugünkü testler (labs tablosu)
    const today = new Date().toISOString().split("T")[0];
    const { count: todayTests } = await supabaseAdmin
      .from("labs")
      .select("*", { count: "exact", head: true })
      .in("patient_id", patientIds)
      .gte("date", `${today}T00:00:00.000Z`)
      .lte("date", `${today}T23:59:59.999Z`);

    // 4. Devam eden tedaviler (treatments tablosu)
    const { count: ongoingTreatments } = await supabaseAdmin
      .from("treatments")
      .select("*", { count: "exact", head: true })
      .in("patient_id", patientIds)
      .gt("end_date", new Date().toISOString());

    // 5. Yatan hastalar (admissions tablosu)
    const { data: admissions, error } = await supabaseAdmin
      .from("admissions")
      .select("patient_id, status, date")
      .in("patient_id", patientIds)
      .order("date", { ascending: false });

    if (error) throw error;

    // Son admission’ı seç
    const latestAdmissions = new Map<string, string>();
    admissions?.forEach((a) => {
      if (!latestAdmissions.has(a.patient_id)) {
        latestAdmissions.set(a.patient_id, a.status);
      }
    });

    // Son admission'ı halen "Inpatient" olan hasta sayısı
    const inpatientCount = [...latestAdmissions.values()].filter(
      (s) => s === "Inpatient"
    ).length;

    return NextResponse.json({
      stats: {
        patientCount,
        todayTests: todayTests || 0,
        ongoingTreatments: ongoingTreatments || 0,
        inpatientCount: inpatientCount || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
