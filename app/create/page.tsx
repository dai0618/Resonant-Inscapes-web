"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import QuickCreateFlow from "@/components/quick-create/QuickCreateFlow";

function CreatePageContent() {
  const searchParams = useSearchParams();
  const remixFrom = searchParams.get("remixFrom") ?? undefined;

  return <QuickCreateFlow remixFrom={remixFrom} />;
}

export default function CreatePage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-sm text-[var(--ri-muted)]">Loading…</p>}>
      <CreatePageContent />
    </Suspense>
  );
}
