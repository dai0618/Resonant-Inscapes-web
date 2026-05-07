"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthState = {
  email: string | null;
  loading: boolean;
};

export default function AuthNav() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ email: null, loading: true });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuth({ email: null, loading: false });
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setAuth({ email: data.user?.email ?? null, loading: false });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth({ email: session?.user?.email ?? null, loading: false });
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
  };

  if (auth.loading) {
    return <span className="px-3 py-2 text-xs text-zinc-700">Auth...</span>;
  }

  if (auth.email) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-zinc-700 md:inline">{auth.email}</span>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 hover:text-zinc-950"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <>
      <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 hover:text-zinc-950">
        Login
      </Link>
      <Link href="/signup" className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700">
        Sign Up
      </Link>
    </>
  );
}
