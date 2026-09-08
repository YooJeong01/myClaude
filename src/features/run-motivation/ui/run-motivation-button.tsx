"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/shared/ui/button";

type MotivationResponse = {
  error?: string;
  code?: string;
  draft?: { id: string };
};

type RunMotivationButtonProps = {
  analysisId: string;
  experienceIds: string[];
  role?: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function RunMotivationButton({
  analysisId,
  disabled = false,
  disabledReason,
  experienceIds,
  role
}: RunMotivationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function runMotivation() {
    if (experienceIds.length === 0) {
      setMessage("경험을 1개 이상 선택하세요.");
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_analysis_id: analysisId,
          experience_ids: experienceIds,
          role
        })
      });
      const payload = (await response.json().catch(() => ({}))) as MotivationResponse;

      if (!response.ok || !payload.draft?.id) {
        setMessage(formatMotivationError(response.status, payload));
        return;
      }

      router.push(`/dashboard/drafts/${payload.draft.id}`);
      router.refresh();
    });
  }

  return (
    <div>
      <Button disabled={disabled || isPending} onClick={runMotivation} type="button">
        {isPending ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Sparkles aria-hidden="true" className="size-4" />
        )}
        {isPending ? "매칭 중..." : "지원동기 만들기"}
      </Button>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-muted-foreground">
        {disabled && disabledReason
          ? disabledReason
          : isPending
            ? "기업분석과 선택한 경험을 매칭하는 중입니다."
            : message}
      </p>
    </div>
  );
}

function formatMotivationError(status: number, payload: MotivationResponse): string {
  if (status === 400) {
    return payload.error ?? "선택한 경험을 확인하세요.";
  }
  if (status === 429 || payload.code === "RATE_LIMITED") {
    return "요청이 많아 잠시 후 다시 시도하세요.";
  }
  if (status === 404) {
    return payload.error ?? "분석 결과를 찾지 못했습니다.";
  }
  return payload.error ?? "지원동기 매칭 중 오류가 발생했습니다.";
}
