"use client";

import { useEffect, useRef, useState } from "react";
import RiLink from "@/components/ui/RiLink";

type SaveTitleSheetProps = {
  open: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  isSaving: boolean;
  statusMessage?: string;
};

export default function SaveTitleSheet({ open, onClose, onSave, isSaving, statusMessage }: SaveTitleSheetProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 px-5 pb-8 pt-16">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-[var(--ri-max-width)] border border-[var(--ri-line)] bg-[var(--ri-bg)] px-6 py-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--ri-muted)]">Save</p>
        <label className="mt-4 block text-sm text-[var(--ri-text)]">Title</label>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Inscape"
          className="mt-2 w-full border-b border-[var(--ri-line)] bg-transparent py-2 text-base text-[var(--ri-text)] outline-none placeholder:text-[var(--ri-muted)] focus:border-[var(--ri-accent)]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isSaving) onSave(title);
          }}
        />
        {statusMessage === "sign_in_required" ? (
          <p className="mt-4 text-sm text-[var(--ri-muted)]">
            Sign in to save. <RiLink href="/login">Login</RiLink>
          </p>
        ) : statusMessage ? (
          <p className="mt-4 text-sm text-[var(--ri-accent)]">{statusMessage}</p>
        ) : null}
        <div className="mt-8 flex gap-6">
          <button type="button" onClick={onClose} className="text-sm text-[var(--ri-muted)]">
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onSave(title)}
            className="text-sm text-[var(--ri-accent)] disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
