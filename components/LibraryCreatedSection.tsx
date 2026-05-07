"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PromptListCard from "@/components/PromptListCard";
import { getRememberedCreatedPromptListIds } from "@/lib/createdListStorage";
import type { PromptList } from "@/lib/types";

export default function LibraryCreatedSection() {
  const [lists, setLists] = useState<PromptList[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const ids = getRememberedCreatedPromptListIds();
    if (ids.length === 0) {
      setLists([]);
      return;
    }

    let cancelled = false;
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
          setLoadError("保存済みリストの取得に失敗しました。Supabase の設定とネットワークを確認してください。");
          setLists([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (lists === null) {
    return <p className="text-sm text-zinc-800">読み込み中…</p>;
  }

  if (lists.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-8 text-center">
        <p className="text-sm text-zinc-800">
          このブラウザで <strong className="font-semibold text-zinc-950">Save Draft</strong> したリストがここに表示されます。
        </p>
        <p className="mt-2 text-sm text-zinc-800">
          まだない場合は <Link href="/create" className="font-medium text-zinc-950 underline underline-offset-2">Create</Link>{" "}
          から保存してください。
        </p>
        <p className="mt-3 text-xs text-zinc-700">
          Discover 上部の <strong className="font-semibold text-zinc-900">My Drafts</strong> にも同じリストが表示されます。
        </p>
        {loadError ? <p className="mt-4 text-sm font-medium text-red-800">{loadError}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loadError ? <p className="text-sm font-medium text-red-800">{loadError}</p> : null}
      <p className="text-sm text-zinc-800">
        この端末で保存したリスト（最大 50 件）です。別のブラウザでは表示されません。
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lists.map((list) => (
          <PromptListCard key={list.id} list={list} sectionLabel="Created" />
        ))}
      </div>
    </div>
  );
}
