"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MobilePromptPanel from "@/components/inscape/MobilePromptPanel";
import VAMap from "@/components/VAMap";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PromptList } from "@/lib/types";

type PromptListDetailViewProps = {
  list: PromptList;
};

export default function PromptListDetailView({ list }: PromptListDetailViewProps) {
  const [selectedPointId, setSelectedPointId] = useState(list.points[0]?.id);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentVisibility, setCurrentVisibility] = useState(list.visibility);
  const [publishMessage, setPublishMessage] = useState("");

  const selectedPoint = useMemo(
    () => list.points.find((point) => point.id === selectedPointId),
    [list.points, selectedPointId],
  );

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(`/api/prompt-lists/${list.id}/download`);
      if (!res.ok) throw new Error("Download failed");
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

  const handlePublish = async () => {
    setPublishMessage("");
    setIsPublishing(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setPublishMessage("Sign in to publish.");
        return;
      }

      const response = await fetch(`/api/prompt-lists/${list.id}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Publish failed");
      }

      setCurrentVisibility("public");
      setPublishMessage("Published.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      setPublishMessage(detail);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="py-6">
        <h1 className="text-xl font-light tracking-tight text-[var(--ri-text)]">{list.title}</h1>
        {list.authorName ? <p className="mt-2 text-xs text-[var(--ri-muted)]">{list.authorName}</p> : null}
      </div>

      <p className="mb-4 text-sm font-light tracking-[0.12em] text-[var(--ri-text)]">Resonant Inscapes Map</p>
      <VAMap
        variant="touch"
        points={list.points}
        selectedPointId={selectedPointId}
        onSelectPoint={setSelectedPointId}
      />

      <MobilePromptPanel point={selectedPoint} />

      <div className="mt-auto flex flex-wrap gap-x-6 gap-y-3 border-t border-[var(--ri-line)] pt-8 text-xs tracking-[0.1em] text-[var(--ri-muted)]">
        <button type="button" onClick={() => void handleDownload()} disabled={isDownloading}>
          {isDownloading ? "…" : "JSON"}
        </button>
        <Link href={`/create?remixFrom=${list.id}`} className="hover:text-[var(--ri-accent)]">
          Remix
        </Link>
        {currentVisibility === "draft" ? (
          <button type="button" onClick={() => void handlePublish()} disabled={isPublishing}>
            {isPublishing ? "…" : "Publish"}
          </button>
        ) : null}
        {publishMessage ? <span className="w-full text-[var(--ri-accent)]">{publishMessage}</span> : null}
      </div>
    </div>
  );
}
