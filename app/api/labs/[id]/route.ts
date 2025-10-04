import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// ✅ PUT – Lab kaydını güncelle
export async function PUT(req: Request, context: any) {
  const { params } = await context; // 👈 Next 15: context artık Promise<RouteContext>
  try {
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from("labs")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, lab: data });
  } catch (err: any) {
    console.error("PUT /api/labs/[id] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ DELETE – Lab kaydını sil
export async function DELETE(_: Request, context: any) {
  const { params } = await context;
  try {
    const { error } = await supabaseAdmin
      .from("labs")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/labs/[id] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
