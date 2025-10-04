import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ✅ POST - doktorun şifresini sıfırla (geçici şifre oluşturur)
export async function POST(_: Request, context: any) {
  const { params } = await context; // 👈 Next 15: context artık Promise<RouteContext>

  try {
    // 1️⃣ Rastgele geçici şifre oluştur
    const tempPassword = Math.random().toString(36).slice(-8);

    // 2️⃣ Supabase Auth kullanıcısının şifresini güncelle
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      params.id,
      { password: tempPassword }
    );

    if (authError) throw authError;

    // 3️⃣ Başarıyla döndür
    return NextResponse.json({ success: true, tempPassword });
  } catch (err: any) {
    console.error("POST /api/doctors/[id]/reset error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
