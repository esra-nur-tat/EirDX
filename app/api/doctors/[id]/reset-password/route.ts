import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const tempPassword = Math.random().toString(36).slice(-8);

  // 1) Auth şifresini güncelle
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    params.id,
    {
      password: tempPassword,
    }
  );
  if (authError)
    return NextResponse.json({ error: authError.message }, { status: 400 });

  return NextResponse.json({ success: true, tempPassword });
}
