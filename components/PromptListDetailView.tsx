"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PromptInspector from "@/components/PromptInspector";
import VAMap from "@/components/VAMap";
import { PromptList } from "@/lib/types";

type PromptListDetailViewProps = {
  list: PromptList;
};

export default function PromptListDetailView({ list }: PromptListDetailViewProps) {
  const [selectedPointId, setSelectedPointId] = useState(list.points[0]?.id);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedPoint = useMemo(
    () => list.points.find((point) => point.id === selectedPointId),
    [list.points, selectedPointId],
  );

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(`/api/prompt-lists/${list.id}/download`);
      if (!res.ok) {
        throw new Error("Download failed");
      }
      const payload = await res.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${list.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{list.title}</h1>
        <p className="mt-2 text-sm font-medium text-zinc-800">by {list.authorName}</p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-800">{list.description}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white"
          >
            {isDownloading ? "Downloading..." : "Download JSON"}
          </button>
          <Link href={`/create?remixFrom=${list.id}`} className="rounded-full bg-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-950">
            Remix
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <VAMap points={list.points} selectedPointId={selectedPointId} onSelectPoint={setSelectedPointId} />
        <PromptInspector point={selectedPoint} />
      </div>
    </section>
  );
}
