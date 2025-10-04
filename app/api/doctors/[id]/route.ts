import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ✅ PUT - doktor bilgilerini güncelle
export async function PUT(req: Request, context: any) {
  const { params } = await context; // 👈 Next 15: context artık Promise<RouteContext>
  try {
    const { name, specialty, email } = await req.json();

    const { error } = await supabaseAdmin
      .from("doctors")
      .update({ name, specialty, email })
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT /api/doctors/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// ✅ DELETE - doktoru hem DB hem Auth’tan sil
export async function DELETE(_: Request, context: any) {
  const { params } = await context; // 👈 build-safe destructuring
  try {
    // 1️⃣ Veritabanından sil
    const { error: dbError } = await supabaseAdmin
      .from("doctors")
      .delete()
      .eq("id", params.id);

    if (dbError) throw dbError;

    // 2️⃣ Supabase Auth’tan kullanıcıyı sil
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      params.id
    );

    if (authError) throw authError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/doctors/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
