import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// PUT -> tedavi kaydı güncelle
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabaseAdmin
      .from("treatments")
      .update({
        patient_id,
        admission_id,
        start_date,
        end_date,
        medication_name,
        dose,
        unit,
        route,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, treatment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE -> tedavi kaydı sil
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from("treatments")
      .delete()
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
