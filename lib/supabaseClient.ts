// lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Yeni client (cookie + session desteği var)
export const supabase: SupabaseClient = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);
