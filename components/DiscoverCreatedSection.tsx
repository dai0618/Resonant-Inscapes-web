"use client";

import { useEffect, useState } from "react";
import RiLink from "@/components/ui/RiLink";
import RiListItem from "@/components/ui/RiListItem";
import { getRememberedCreatedPromptListIds } from "@/lib/createdListStorage";
import type { PromptList } from "@/lib/types";

export default function DiscoverCreatedSection() {
  const [lists, setLists] = useState<PromptList[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const ids = getRememberedCreatedPromptListIds();
    let cancelled = false;

    if (ids.length === 0) {
      void Promise.resolve().then(() => {
        if (!cancelled) setLists([]);
      });
      return () => {
        cancelled = true;
      };
    }

    fetch("/api/prompt-lists/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("batch failed");
        return response.json() as Promise<{ lists?: PromptList[] }>;
      })
      .then((data) => {
        if (!cancelled) setLists(data.lists ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Could not load drafts.");
          setLists([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (lists === null) {
    return <p className="text-sm text-[var(--ri-muted)]">Loading…</p>;
  }

  if (lists.length === 0) {
    return (
      <p className="text-sm text-[var(--ri-muted)]">
        No drafts yet. <RiLink href="/create">Start</RiLink> to create one.
        {loadError ? <span className="mt-2 block text-xs">{loadError}</span> : null}
      </p>
    );
  }

  return (
    <div>
      {loadError ? <p className="mb-4 text-xs text-[var(--ri-muted)]">{loadError}</p> : null}
      {lists.map((list) => (
        <RiListItem key={list.id} list={list} meta="Draft" />
      ))}
    </div>
  );
}
