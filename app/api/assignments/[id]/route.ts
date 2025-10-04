import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// ✅ PUT - Update assignment
export async function PUT(req: Request, context: any) {
  const { params } = await context; // 👈 artık Promise olduğu için await gerekiyor
  try {
    const { patient_id, doctor_ids } = await req.json();

    const { data, error } = await supabaseAdmin
      .from("assignments")
      .update({ patient_id, doctor_ids })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, assignment: data });
  } catch (err: any) {
    console.error("PUT /api/assignments/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ DELETE - Delete assignment
export async function DELETE(_: Request, context: any) {
  const { params } = await context;
  try {
    const { error } = await supabaseAdmin
      .from("assignments")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/assignments/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
