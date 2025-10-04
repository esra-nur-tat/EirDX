import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// 📌 GET -> Bu doktora atanmış hastaları getir
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId"); // query param üzerinden doktor ID'si
    // Eğer doktorId gönderilmemişse, tüm hastaları getir
    if (!doctorId) {
      const { data, error } = await supabaseAdmin
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ patients: data });
    }

    // 1. Bu doktora ait assignments'ları bul
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from("assignments")
      .select("*")
      .contains("doctor_ids", [doctorId]);

    if (assignError) throw assignError;

    const patientIds = assignments.map((a) => a.patient_id);

    if (patientIds.length === 0) {
      return NextResponse.json({ patients: [] });
    }

    // 2. O hastaları getir
    const { data: patients, error: patError } = await supabaseAdmin
      .from("patients")
      .select("*")
      .in("id", patientIds)
      .order("created_at", { ascending: false });

    if (patError) throw patError;

    // 3. Assignment bilgilerini hastalara ekle + doktor isimleri
    const doctorIds = [
      ...new Set(assignments.flatMap((a) => a.doctor_ids)), // benzersiz ID’ler
    ];

    const { data: doctors, error: docError } = await supabaseAdmin
      .from("doctors")
      .select("id, name")
      .in("id", doctorIds);

    if (docError) throw docError;

    const patientsWithAssignments = patients.map((p) => {
      const patientAssignments = assignments.filter(
        (a) => a.patient_id === p.id
      );

      // her assignment için doktor isimlerini eşle
      const assignmentsWithDoctors = patientAssignments.map((a) => ({
        ...a,
        doctors: a.doctor_ids
          .map((id: string) => doctors.find((d) => d.id === id))
          .filter(Boolean), // eşleşmeyenleri at
      }));

      return {
        ...p,
        assignments: assignmentsWithDoctors,
      };
    });
    return NextResponse.json({ patients: patientsWithAssignments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 📌 POST -> yeni hasta ekle (doktor ilişkisi olmadan aynı kalıyor)
export async function POST(req: Request) {
  try {
    const { identity_number, name, doctor_ids } = await req.json();

    if (!identity_number || !name) {
      return NextResponse.json(
        { error: "Kimlik numarası ve ad soyad gerekli" },
        { status: 400 }
      );
    }
    // 1. Önce hasta ekle
    const { data: patient, error: patientError } = await supabaseAdmin
      .from("patients")
      .insert([{ identity_number, name }])
      .select()
      .single();

    if (patientError) throw patientError;
    console.log(patient);

    // 2. Eğer doctor_ids varsa assignments tablosuna ekle
    if (doctor_ids && doctor_ids.length > 0) {
      const { error: assignError } = await supabaseAdmin
        .from("assignments")
        .insert([
          {
            patient_id: patient.id,
            doctor_ids: doctor_ids, // array of uuid/string
          },
        ]);

      if (assignError) throw assignError;
    }

    return NextResponse.json({ success: true, patient });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
