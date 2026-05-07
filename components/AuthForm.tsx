"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "signup" | "login";

type AuthFormProps = {
  mode: AuthMode;
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const title = useMemo(() => (mode === "signup" ? "Sign up" : "Login"), [mode]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase is not configured.");

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage("確認メールを送信しました。メールのリンクを開くとログインされます。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("ログインしました。Create で下書き保存できます。");
        router.push("/create");
        router.refresh();
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      setMessage(`認証に失敗しました: ${detail}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        <p className="mt-2 text-sm text-zinc-800">Supabase Auth でメールアドレス認証を行います。</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-zinc-950">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-zinc-950">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-500"
        >
          {isLoading ? "Processing..." : mode === "signup" ? "Create account" : "Login"}
        </button>

        {message ? <p className="mt-4 text-sm text-zinc-900">{message}</p> : null}

        <p className="mt-4 text-sm text-zinc-800">
          {mode === "signup" ? (
            <>
              すでにアカウントがある場合は <Link href="/login" className="font-medium underline underline-offset-2">Login</Link>
            </>
          ) : (
            <>
              初めての場合は <Link href="/signup" className="font-medium underline underline-offset-2">Sign up</Link>
            </>
          )}
        </p>
      </form>
    </section>
  );
}
