"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RiPageTitle from "@/components/ui/RiPageTitle";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming sign-in…");

  useEffect(() => {
    let isMounted = true;
    const resolve = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (isMounted) setMessage("Supabase is not configured.");
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        if (isMounted) setMessage(error.message);
        return;
      }

      if (data.session?.user) {
        router.replace("/create");
        router.refresh();
      } else if (isMounted) {
        setMessage("No session created. Try signing in again.");
      }
    };

    void resolve();
    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="flex flex-1 flex-col">
      <RiPageTitle>Signing in</RiPageTitle>
      <p className="text-sm text-[var(--ri-muted)]">{message}</p>
    </div>
  );
}
