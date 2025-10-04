import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// GET -> doktorları listele
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("doctors")
    .select("id, name, specialty, email");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ doctors: data });
}

// POST -> doktor ekle
export async function POST(req: Request) {
  try {
    const { name, specialty, email } = await req.json();

    if (!name || !specialty || !email) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }

    const tempPassword = Math.random().toString(36).slice(-8);

    // Auth'ta user oluştur
    const { data: user, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // doctors tablosuna yaz
    const { error: dbError } = await supabaseAdmin
      .from("doctors")
      .insert([{ id: user.user?.id, name, specialty, email }]);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tempPassword,
      doctor: {
        id: user.user?.id,
        name,
        specialty,
        email,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
