import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const { data: doctor } = await supabaseAdmin
      .from("doctors")
      .select("*")
      .eq("id", userId)
      .single();
    return NextResponse.json({ doctor: doctor || "Doktor verisi dönmedi" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  let bodyEdited = body;
  //Şifre değişkeni kaldırılıyor ki hata vermesin.
  delete bodyEdited.password;
  //Tabloda güncelle
  const { data, error } = await supabaseAdmin
    .from("doctors")
    .update(bodyEdited)
    .eq("id", body.id)
    .select()
    .single();

  //Auth'ta güncelle

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    body.id,
    {
      email: body.email,
      password: body.password,
    }
  );

  if (authError)
    return NextResponse.json({ error: authError.message }, { status: 400 });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ doctor: data });
}
