"use client";

import { useCallback, useState } from "react";
import PromptMapStep from "@/components/quick-create/PromptMapStep";
import StartStep from "@/components/quick-create/StartStep";
import TrackSwipeSession from "@/components/quick-create/TrackSwipeSession";
import { profileToPromptList } from "@/lib/quickCreate/profileToPromptList";
import { buildResonantProfile } from "@/lib/quickCreate/swipeScoring";
import { PromptPoint, ResonantProfile, SwipeResponse } from "@/lib/types";

type QuickCreateFlowProps = {
  remixFrom?: string;
};

type Step = "start" | "swipe" | "map";

export default function QuickCreateFlow({ remixFrom }: QuickCreateFlowProps) {
  const [step, setStep] = useState<Step>("start");
  const [profile, setProfile] = useState<ResonantProfile | null>(null);
  const [generatedPoints, setGeneratedPoints] = useState<PromptPoint[]>([]);

  const handleSwipeComplete = useCallback((allResponses: SwipeResponse[]) => {
    const nextProfile = buildResonantProfile(allResponses);
    setProfile(nextProfile);
    setGeneratedPoints(
      profileToPromptList({
        profile: nextProfile,
        promptListId: "",
        visualStyle: "",
      }),
    );
    setStep("map");
  }, []);

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-1 flex-col">
      {step === "start" && <StartStep onStart={() => setStep("swipe")} />}
      {step === "swipe" && <TrackSwipeSession onComplete={handleSwipeComplete} />}
      {step === "map" && profile && generatedPoints.length > 0 && (
        <PromptMapStep points={generatedPoints} profile={profile} remixFrom={remixFrom} />
      )}
    </div>
  );
}
