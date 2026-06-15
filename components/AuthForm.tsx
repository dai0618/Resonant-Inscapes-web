"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import RiButton from "@/components/ui/RiButton";
import RiInput from "@/components/ui/RiInput";
import RiLink from "@/components/ui/RiLink";
import RiPageTitle from "@/components/ui/RiPageTitle";
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
        setMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/create");
        router.refresh();
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      setMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <RiPageTitle subtitle="Email sign-in to save your inscapes.">{title}</RiPageTitle>

      <form onSubmit={onSubmit} className="mt-4 space-y-8">
        <RiInput
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <RiInput
          label="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />

        <RiButton type="submit" variant="primary" disabled={isLoading} className="mt-4">
          {isLoading ? "…" : mode === "signup" ? "Create account" : "Login"}
        </RiButton>

        {message ? <p className="text-sm text-[var(--ri-muted)]">{message}</p> : null}

        <p className="text-sm text-[var(--ri-muted)]">
          {mode === "signup" ? (
            <>
              Already have an account? <RiLink href="/login">Login</RiLink>
            </>
          ) : (
            <>
              New here? <RiLink href="/signup">Sign up</RiLink>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
