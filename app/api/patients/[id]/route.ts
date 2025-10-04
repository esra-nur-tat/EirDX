import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// 📌 GET -> Tek hasta getir (+ admissions verisi ile birlikte)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Önce hasta bilgilerini al
    const { data: patient, error } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) throw error;

    // Hasta admissions kayıtlarını çek
    const { data: admissions, error: admissionsError } = await supabaseAdmin
      .from("admissions")
      .select("date, status")
      .eq("patient_id", params.id)
      .order("date", { ascending: false });

    if (admissionsError) throw admissionsError;

    let admission_date: string | null = null;
    let hospitalization_date: string | null = null;

    if (admissions && admissions.length > 0) {
      // Son geliş tarihi (status=Admitted veya genel olarak ilk kayıt)
      const lastAdmission = admissions.find((a) => a.status === "Admitted");
      admission_date = lastAdmission ? lastAdmission.date : admissions[0].date;

      // Son yatış tarihi (status=Inpatient olan en güncel kayıt)
      const lastHosp = admissions.find((a) => a.status === "Inpatient");
      hospitalization_date = lastHosp ? lastHosp.date : null;
    }

    return NextResponse.json({
      patient: {
        ...patient,
        admission_date,
        hospitalization_date,
      },
    });
  } catch (err: any) {
    console.error("GET /api/patients/[id] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 📌 PUT -> Hasta güncelle
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from("patients")
      .update({
        identity_number: body.identity_number,
        name: body.name,
        birth_date: body.birth_date || null,
        weight: body.weight ?? null,
        height: body.height ?? null,
        blood_type: body.blood_type || null,
        room: body.room || null,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, patient: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Hasta güncellenemedi" },
      { status: 500 }
    );
  }
}

// 📌 DELETE -> Hasta sil
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Önce assignments sil
    const { error: assignError } = await supabaseAdmin
      .from("assignments")
      .delete()
      .eq("patient_id", params.id);

    if (assignError) throw assignError;

    // 2. Sonra patient sil
    const { error: patientError } = await supabaseAdmin
      .from("patients")
      .delete()
      .eq("id", params.id);

    if (patientError) throw patientError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Hasta silinemedi" },
      { status: 500 }
    );
  }
}
