"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CreateWizard from "@/components/CreateWizard";

function CreatePageContent() {
  const searchParams = useSearchParams();
  const remixFrom = searchParams.get("remixFrom") ?? undefined;

  return <CreateWizard remixFrom={remixFrom} />;
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-zinc-900">読み込み中…</p>
          </div>
        </div>
      }
    >
      <CreatePageContent />
    </Suspense>
  );
}
