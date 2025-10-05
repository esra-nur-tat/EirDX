import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patient_id");

    let query = supabaseAdmin
      .from("admissions")
      .select("*")
      .order("date", { ascending: false });

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ admissions: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { admission_id, date, status, patient_id } = await req.json();

    if (!admission_id || !date || !status || !patient_id) {
      return NextResponse.json(
        { error: "All fields necessary." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("admissions")
      .insert([{ admission_id, date, status, patient_id }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ admission: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
