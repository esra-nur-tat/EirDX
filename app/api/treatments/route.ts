import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// GET -> tüm tedavi kayıtları veya patient_id ile filtreli
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patient_id");

    let query = supabaseAdmin
      .from("treatments")
      .select("*, patients(name, identity_number)")
      .order("start_date", { ascending: false });

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ treatments: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST -> yeni tedavi ekle
export async function POST(req: Request) {
  try {
    const {
      patient_id,
      admission_id,
      start_date,
      end_date,
      medication_name,
      dose,
      unit,
      route,
    } = await req.json();

    if (
      !patient_id ||
      !admission_id ||
      !start_date ||
      !end_date ||
      !medication_name
    ) {
      return NextResponse.json(
        { error: "Zorunlu alanlar eksik" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("treatments")
      .insert([
        {
          patient_id,
          admission_id,
          start_date,
          end_date,
          medication_name,
          dose,
          unit,
          route,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ treatment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
