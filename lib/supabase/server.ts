import { createClient, SupabaseClient } from "@supabase/supabase-js";

function baseOptions() {
  return {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  } as const;
}

export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, baseOptions());
}

/** Server-only writes: bypasses RLS when policies are not set for anon. Prefer RLS policies in Supabase for production. */
export function getSupabaseServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, baseOptions());
}

export function getSupabaseForMutation(): SupabaseClient | null {
  return getSupabaseServiceRoleClient() ?? getSupabaseServerClient();
}
