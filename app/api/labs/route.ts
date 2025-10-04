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
      .from("labs")
      .select("*")
      .order("date", { ascending: false });

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const { data, error } = await query;

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ labs: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      patient_id,
      admission_id,
      date,
      lab_category,
      lab_type,
      unit,
      value,
    } = body;

    if (
      !patient_id ||
      !admission_id ||
      !date ||
      !lab_category ||
      !lab_type ||
      !unit ||
      !value
    ) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("labs")
      .insert([
        { patient_id, admission_id, date, lab_category, lab_type, unit, value },
      ])
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ lab: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
