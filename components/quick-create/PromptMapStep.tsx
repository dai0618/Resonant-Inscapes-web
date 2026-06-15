"use client";

import { useMemo, useState } from "react";
import MobilePromptPanel from "@/components/inscape/MobilePromptPanel";
import SaveTitleSheet from "@/components/inscape/SaveTitleSheet";
import VAMap from "@/components/VAMap";
import { VA_EXPECTED_POINT_COUNT, VA_GRID_SIZE } from "@/lib/constants";
import { rememberCreatedPromptListId } from "@/lib/createdListStorage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PromptPoint, ResonantProfile } from "@/lib/types";

type PromptMapStepProps = {
  points: PromptPoint[];
  profile: ResonantProfile;
  remixFrom?: string;
};

export default function PromptMapStep({ points, profile, remixFrom }: PromptMapStepProps) {
  const [selectedPointId, setSelectedPointId] = useState(points[0]?.id);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveSheetKey, setSaveSheetKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const selectedPoint = useMemo(
    () => points.find((p) => p.id === selectedPointId),
    [points, selectedPointId],
  );

  const saveDraft = async (rawTitle: string) => {
    if (points.length !== VA_EXPECTED_POINT_COUNT) return;
    setIsSaving(true);
    setStatusMessage("");
    const title = rawTitle.trim() || "Untitled Inscape";

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase is not configured.");

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const currentUserId = sessionData.session?.user?.id;
      if (!currentUserId) {
        setStatusMessage("sign_in_required");
        return;
      }

      const payload = {
        title,
        description: "",
        authorId: currentUserId,
        targetModel: "",
        template: "",
        visibility: "draft" as const,
        forkedFromId: remixFrom || null,
        fullJson: {
          title,
          creationMode: "quick_create",
          gridSize: VA_GRID_SIZE,
          profile,
          points,
        },
        points: points.map((point) => ({
          valence: point.valence,
          arousal: point.arousal,
          moodLabel: point.moodLabel,
          tags: point.tags,
          negativeTags: point.negativeTags,
          prompt: point.prompt,
        })),
      };

      const response = await fetch("/api/prompt-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("save failed");
      const data = (await response.json()) as { id?: string };
      if (data?.id) rememberCreatedPromptListId(data.id);
      setStatusMessage("Saved.");
    } catch (error) {
      console.error("Save draft failed:", error);
      setStatusMessage("Could not save.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-baseline justify-between py-4">
        <h2 className="text-sm font-light tracking-[0.12em] text-[var(--ri-text)]">Resonant Inscapes Map</h2>
        <button
          type="button"
          onClick={() => {
            setSaveSheetKey((k) => k + 1);
            setStatusMessage("");
            setSaveOpen(true);
          }}
          className="text-xs tracking-[0.15em] text-[var(--ri-accent)]"
        >
          Save
        </button>
      </div>

      <VAMap
        variant="touch"
        points={points}
        selectedPointId={selectedPointId}
        onSelectPoint={setSelectedPointId}
      />

      <MobilePromptPanel point={selectedPoint} />

      <SaveTitleSheet
        key={saveSheetKey}
        open={saveOpen}
        onClose={() => {
          if (!isSaving) setSaveOpen(false);
        }}
        onSave={(t) => void saveDraft(t)}
        isSaving={isSaving}
        statusMessage={statusMessage}
      />
    </div>
  );
}
