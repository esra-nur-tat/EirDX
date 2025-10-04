import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// ✅ PUT - admission güncelleme
export async function PUT(req: Request, context: any) {
  const { params } = await context; // 👈 artık Promise olduğu için await gerekiyor
  try {
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from("admissions")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, admission: data });
  } catch (err: any) {
    console.error("PUT /api/admissions/[id] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ DELETE - admission silme
export async function DELETE(_: Request, context: any) {
  const { params } = await context;
  try {
    const { error } = await supabaseAdmin
      .from("admissions")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/admissions/[id] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
