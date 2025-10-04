import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// PUT - doktor bilgilerini güncelle
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { name, specialty, email } = await req.json();
  const { error } = await supabaseAdmin
    .from("doctors")
    .update({ name, specialty, email })
    .eq("id", params.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

// DELETE - doktoru hem DB hem Auth'tan sil
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  // 1) DB’den sil
  await supabaseAdmin.from("doctors").delete().eq("id", params.id);

  // 2) Auth’tan sil
  const { error } = await supabaseAdmin.auth.admin.deleteUser(params.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
