"use client";

import { useState } from "react";
import PromptInspector from "@/components/PromptInspector";
import VAMap from "@/components/VAMap";
import SampleMusicCard from "@/components/SampleMusicCard";
import { rememberCreatedPromptListId } from "@/lib/createdListStorage";
import { VA_EXPECTED_POINT_COUNT, VA_GRID_SIZE } from "@/lib/constants";
import { generateMockGridPoints } from "@/lib/generation";
import { sampleAudios } from "@/lib/sampleAudios";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PromptGenerationRequest, PromptPoint } from "@/lib/types";

type CreateWizardProps = {
  remixFrom?: string;
};

const defaultQuadrants = {
  highValenceHighArousal: {
    label: "Joyful / Energetic",
    userInput: "",
    color: "",
    lighting: "",
    place: "",
    texture: "",
    avoid: "",
  },
  highValenceLowArousal: {
    label: "Peaceful / Warm",
    userInput: "",
    color: "",
    lighting: "",
    place: "",
    texture: "",
    avoid: "",
  },
  lowValenceHighArousal: {
    label: "Tense / Intense",
    userInput: "",
    color: "",
    lighting: "",
    place: "",
    texture: "",
    avoid: "",
  },
  lowValenceLowArousal: {
    label: "Lonely / Quiet",
    userInput: "",
    color: "",
    lighting: "",
    place: "",
    texture: "",
    avoid: "",
  },
};

const quadrantEntries = [
  { key: "highValenceHighArousal", title: "Joyful / Energetic" },
  { key: "highValenceLowArousal", title: "Peaceful / Warm" },
  { key: "lowValenceHighArousal", title: "Tense / Intense" },
  { key: "lowValenceLowArousal", title: "Lonely / Quiet" },
] as const;

const fieldInputClass =
  "w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-zinc-900";

const quadrantInputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-zinc-900";

export default function CreateWizard({ remixFrom }: CreateWizardProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetModel, setTargetModel] = useState("stable-diffusion-xl");
  const [visualStyle, setVisualStyle] = useState("cinematic");
  const [quadrants, setQuadrants] = useState(defaultQuadrants);
  const [generatedPoints, setGeneratedPoints] = useState<PromptPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateQuadrant = (
    key: keyof typeof defaultQuadrants,
    field: keyof (typeof defaultQuadrants)[keyof typeof defaultQuadrants],
    value: string,
  ) => {
    setQuadrants((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const getRequestPayload = (): PromptGenerationRequest => ({
    title,
    description,
    targetModel,
    visualStyle,
    gridSize: VA_GRID_SIZE,
    quadrants,
  });

  const generateMockPoints = () => {
    const points = generateMockGridPoints(getRequestPayload()).map((point) => ({
      ...point,
      id: point.id || crypto.randomUUID(),
    }));
    setGeneratedPoints(points);
    setSelectedPointId(points[0]?.id);
    setStep(3);
  };

  const generateWithChatGPT = async () => {
    setIsGenerating(true);
    setStatusMessage("");
    const payload = getRequestPayload();
    try {
      const response = await fetch("/api/generate-prompt-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("generation failed");
      }
      const result = await response.json();
      const raw = (result?.data?.points ?? []) as PromptPoint[];
      const points = raw.map((point: PromptPoint, index: number) => {
        let v = Number(point.valence);
        let a = Number(point.arousal);
        if (Number.isFinite(v) && Number.isFinite(a) && (v < 0 || a < 0 || v > 1 || a > 1)) {
          if (v >= -0.6 && v <= 0.6 && a >= -0.6 && a <= 0.6) {
            v = v + 0.5;
            a = a + 0.5;
          }
        }
        v = Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
        a = Math.min(1, Math.max(0, Number.isFinite(a) ? a : 0));
        return {
          ...point,
          id: `p-${index}-v${v}-a${a}`,
          promptListId: "",
          valence: v,
          arousal: a,
          tags: Array.isArray(point.tags) ? point.tags.map(String) : [],
          negativeTags: Array.isArray(point.negativeTags) ? point.negativeTags.map(String) : [],
          moodLabel: point.moodLabel ? String(point.moodLabel) : "",
          prompt: point.prompt != null ? String(point.prompt) : "",
        };
      });
      setGeneratedPoints(points);
      setSelectedPointId(points[0]?.id);
      if (result?.fallback) {
        setStatusMessage(result?.message || "OpenAI generation failed. Using mock data.");
      } else if (points.length !== VA_EXPECTED_POINT_COUNT) {
        setStatusMessage(`Generated ${points.length} points (expected ${VA_EXPECTED_POINT_COUNT}).`);
      } else {
        const modelInfo = typeof result?.model === "string" ? `（モデル: ${result.model}）` : "";
        if (result?.generationMode === "interpolate") {
          setStatusMessage(
            `四象限は英語化済みですが、100点それぞれの文章生成に失敗したため、補間のみのプロンプトになっています。${modelInfo}`,
          );
        } else {
          setStatusMessage(
            `ChatGPT が ${VA_EXPECTED_POINT_COUNT} マスそれぞれに英語の tags / prompt を生成しました（4ブロック並列）。${modelInfo}`,
          );
        }
      }
      setStep(3);
    } catch (error) {
      console.error("OpenAI generation error:", error);
      generateMockPoints();
      setStatusMessage("OpenAI generation failed. Using mock data.");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedPoint = generatedPoints.find((point) => point.id === selectedPointId);

  const updateSelectedPoint = (field: "prompt" | "tags" | "negativeTags", value: string) => {
    if (!selectedPointId) return;
    setGeneratedPoints((prev) =>
      prev.map((point) => {
        if (point.id !== selectedPointId) return point;
        if (field === "prompt") return { ...point, prompt: value };
        if (field === "tags") {
          return { ...point, tags: value.split(",").map((v) => v.trim()).filter(Boolean) };
        }
        return { ...point, negativeTags: value.split(",").map((v) => v.trim()).filter(Boolean) };
      }),
    );
  };

  const saveDraft = async () => {
    if (generatedPoints.length === 0) return;
    setIsSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const currentUserId = authData.user?.id;
      if (!currentUserId) {
        setStatusMessage("保存するにはログインが必要です。右上の Login からサインインしてください。");
        return;
      }

      const payload = {
        title: title || "Untitled Prompt List",
        description: description || "",
        authorId: currentUserId,
        targetModel,
        template: visualStyle,
        visibility: "draft",
        forkedFromId: remixFrom || null,
        fullJson: {
          title,
          description,
          targetModel,
          gridSize: VA_GRID_SIZE,
          template: visualStyle,
          points: generatedPoints,
        },
        points: generatedPoints.map((point) => ({
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
      if (!response.ok) {
        throw new Error("save failed");
      }
      const data = (await response.json()) as { id?: string };
      if (data?.id) {
        rememberCreatedPromptListId(data.id);
      }
      setStatusMessage(
        "下書きを保存しました。My Library / Discover の My Drafts で確認できます。",
      );
    } catch (error) {
      console.error("Save draft failed:", error);
      setStatusMessage("Failed to save draft to Supabase. (mock-only mode)");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-zinc-800">Step {step} / 3</p>
        <h2 className="mt-1 text-2xl font-semibold text-zinc-950">Create Prompt List</h2>
        <p className="mt-2 text-sm text-zinc-800">
          このリストは Mood Map 上の <strong className="font-semibold text-zinc-950">{VA_GRID_SIZE}×{VA_GRID_SIZE}</strong>（全{" "}
          {VA_EXPECTED_POINT_COUNT} 点）にプロンプトを割り当てます。
        </p>
        <p className="text-sm text-zinc-800">各マスは Valence / Arousal の組み合わせに対応する tags と prompt を持ちます。</p>
        {remixFrom ? <p className="mt-2 text-sm text-zinc-800">Remix 元 ID: {remixFrom}</p> : null}
        {statusMessage ? <p className="mt-3 text-sm font-medium text-zinc-950">{statusMessage}</p> : null}
      </div>

      {step === 1 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-lg font-semibold text-zinc-950">リストの基本情報</h3>
          <p className="mb-4 text-sm text-zinc-800">
            ここで入れた内容は、生成 API に渡るほか、保存・ダウンロード用 JSON のメタデータになります。「生成用の追加欄」ではなく、
            <strong className="font-semibold text-zinc-950">リストの名前・用途・画風の指定</strong>です。
          </p>
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-950">タイトル</label>
              <p className="mb-2 text-sm text-zinc-800">リストの表示名。後から Library や Discover で見える名前です。</p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例: Night Drive — SDXL prompts"
                className={fieldInputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-950">説明</label>
              <p className="mb-2 text-sm text-zinc-800">どんな曲・ムード向けか、使いどころのメモ（任意）。</p>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="例: シンセポップ〜夜道ドライブ向け。高VAはネオン、低VAは霧気味に。"
                className={`min-h-24 ${fieldInputClass}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-950">ターゲット画像モデル</label>
              <p className="mb-2 text-sm text-zinc-800">
                このリストを想定している画像モデル名（メタデータ用）。生成品質の指定ではなく、
                <strong className="font-semibold text-zinc-950">記録・共有用のラベル</strong>です。
              </p>
              <input
                value={targetModel}
                onChange={(event) => setTargetModel(event.target.value)}
                placeholder="例: stable-diffusion-xl, flux-dev, midjourney-v6"
                className={fieldInputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-950">全体のビジュアルスタイル</label>
              <p className="mb-2 text-sm text-zinc-800">
                100 点まとめての「画風・トーン」のキーワード。ChatGPT / mock 生成時に
                <strong className="font-semibold text-zinc-950">プロンプトの土台</strong>として渡ります（テンプレ名の代わりに使えます）。
              </p>
              <input
                value={visualStyle}
                onChange={(event) => setVisualStyle(event.target.value)}
                placeholder="例: cinematic, film grain, neon noir, soft watercolor"
                className={fieldInputClass}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white"
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-950">4 象限の入力</h3>
          <p className="text-sm text-zinc-800">
            各サンプル音を聴きながら映像イメージを書きます。ここが Mood Map の<strong className="font-semibold text-zinc-950">四隅の「核」</strong>
            になり、生成で周辺の {VA_EXPECTED_POINT_COUNT} 点に補間されます。
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {sampleAudios.map((sample) => (
              <SampleMusicCard key={sample.id} title={sample.label} subtitle={sample.description} src={sample.src} />
            ))}
          </div>

          {quadrantEntries.map(({ key, title }) => {
            const quad = quadrants[key];
            return (
            <div key={key} className="rounded-xl border border-zinc-200 p-4">
              <h4 className="mb-3 text-sm font-semibold text-zinc-950">{title}</h4>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className={quadrantInputClass}
                  placeholder="聴いた印象・映像イメージ（自由記述）"
                  value={quad.userInput}
                  onChange={(event) => updateQuadrant(key, "userInput", event.target.value)}
                />
                <input
                  className={quadrantInputClass}
                  placeholder="色・パレット"
                  value={quad.color}
                  onChange={(event) => updateQuadrant(key, "color", event.target.value)}
                />
                <input
                  className={quadrantInputClass}
                  placeholder="光・ライティング"
                  value={quad.lighting}
                  onChange={(event) => updateQuadrant(key, "lighting", event.target.value)}
                />
                <input
                  className={quadrantInputClass}
                  placeholder="場所・空間"
                  value={quad.place}
                  onChange={(event) => updateQuadrant(key, "place", event.target.value)}
                />
                <input
                  className={`md:col-span-2 ${quadrantInputClass}`}
                  placeholder="質感・マテリアル"
                  value={quad.texture}
                  onChange={(event) => updateQuadrant(key, "texture", event.target.value)}
                />
              </div>
              <input
                className={`mt-2 w-full ${quadrantInputClass}`}
                placeholder="避けたい表現（カンマ区切り）"
                value={quad.avoid}
                onChange={(event) => updateQuadrant(key, "avoid", event.target.value)}
              />
            </div>
          )})}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="rounded-full bg-zinc-200 px-5 py-2 text-sm font-medium text-zinc-800">
              Back
            </button>
            <button type="button" onClick={generateMockPoints} className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white">
              Generate {VA_EXPECTED_POINT_COUNT}-point Mock
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={generateWithChatGPT}
              className="rounded-full bg-zinc-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-70"
            >
              {isGenerating ? "Generating..." : "Generate 100-point Prompt List"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-zinc-950">生成結果</h3>
          <p className="mb-4 text-sm text-zinc-800">
            <span className="font-semibold text-zinc-950">{title || "Untitled List"}</span> — {description || "説明なし"}
          </p>
          <p className="mb-4 text-sm font-medium text-zinc-900">
            {generatedPoints.length} / {VA_EXPECTED_POINT_COUNT} 点（{VA_GRID_SIZE}×{VA_GRID_SIZE} グリッド）
          </p>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <VAMap points={generatedPoints} selectedPointId={selectedPointId} onSelectPoint={setSelectedPointId} />
            <div className="space-y-3">
              <PromptInspector point={selectedPoint} />
              {selectedPoint ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <h4 className="mb-3 text-sm font-semibold text-zinc-950">手動で編集</h4>
                  <label className="mb-1 block text-xs font-semibold text-zinc-900">prompt</label>
                  <textarea
                    value={selectedPoint.prompt}
                    onChange={(event) => updateSelectedPoint("prompt", event.target.value)}
                    className={`mb-3 min-h-20 ${quadrantInputClass} w-full`}
                  />
                  <label className="mb-1 block text-xs font-semibold text-zinc-900">tags（カンマ区切り）</label>
                  <input
                    value={selectedPoint.tags.join(", ")}
                    onChange={(event) => updateSelectedPoint("tags", event.target.value)}
                    className={`mb-3 w-full ${quadrantInputClass}`}
                  />
                  <label className="mb-1 block text-xs font-semibold text-zinc-900">negativeTags（カンマ区切り）</label>
                  <input
                    value={selectedPoint.negativeTags.join(", ")}
                    onChange={(event) => updateSelectedPoint("negativeTags", event.target.value)}
                    className={`w-full ${quadrantInputClass}`}
                  />
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white">
              Edit Inputs
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={saveDraft}
              className="rounded-full bg-zinc-700 px-5 py-2 text-sm font-medium text-white disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
