import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// GET -> tüm atamaları listele
export async function GET() {
  try {
    const { data: assignments, error } = await supabaseAdmin
      .from("assignments")
      .select("id, patient_id, doctor_ids, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Hastaları çek
    const { data: patients } = await supabaseAdmin
      .from("patients")
      .select("id, name, identity_number");

    // Doktorları çek
    const { data: doctors } = await supabaseAdmin
      .from("doctors")
      .select("id, name");

    // İlişkilendirme
    const result = assignments.map((a) => {
      const patient = patients?.find((p) => p.id === a.patient_id);
      const doctorList =
        doctors?.filter((d) => a.doctor_ids.includes(d.id)) || [];

      return {
        ...a,
        patient,
        doctors: doctorList,
      };
    });

    return NextResponse.json({ assignments: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST -> yeni atama ekle
export async function POST(req: Request) {
  try {
    const { patient_id, doctor_ids } = await req.json();

    if (!patient_id || !doctor_ids || !Array.isArray(doctor_ids)) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("assignments")
      .insert([{ patient_id, doctor_ids }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, assignment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
