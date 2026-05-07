"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("認証状態を確認しています...");

  useEffect(() => {
    let isMounted = true;
    const resolve = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (isMounted) setMessage("Supabase 設定が見つかりません。");
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        if (isMounted) setMessage(`認証に失敗しました: ${error.message}`);
        return;
      }

      if (data.session?.user) {
        router.replace("/create");
        router.refresh();
      } else if (isMounted) {
        setMessage("セッションが作成されませんでした。ログイン画面から再試行してください。");
      }
    };

    resolve();
    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900">Auth Callback</h1>
      <p className="mt-2 text-sm text-zinc-800">{message}</p>
    </section>
  );
}
