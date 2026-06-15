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
      void Promise.resolve().then(() => setAuth({ email: null, loading: false }));
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
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
    return <span className="text-[10px] tracking-[0.12em] text-[var(--ri-muted)]">…</span>;
  }

  if (auth.email) {
    return (
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-[10px] uppercase tracking-[0.14em] text-[var(--ri-muted)] transition hover:text-[var(--ri-accent)]"
      >
        Logout
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="text-[10px] uppercase tracking-[0.14em] text-[var(--ri-muted)] transition hover:text-[var(--ri-accent)]"
    >
      Login
    </Link>
  );
}
