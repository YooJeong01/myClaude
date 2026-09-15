"use client";

import { BarChart3, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { JobPosting } from "@/entities/job-posting";
import { useOnline } from "@/shared/lib/use-online";
import { Button } from "@/shared/ui/button";
import { css } from "../../../../styled-system/css";

type AnalyzeResponse = {
  error?: string;
  code?: string;
  candidates?: { corpName?: string; corp_code?: string; corpCode?: string }[];
  analysis?: { id: string };
};

type RunAnalysisButtonProps = {
  posting: JobPosting;
  className?: string;
  disabledWhenOffline?: boolean;
  jobPostingIdOverride?: string | null;
};

export function RunAnalysisButton({
  posting,
  className,
  disabledWhenOffline = false,
  jobPostingIdOverride
}: RunAnalysisButtonProps) {
  const router = useRouter();
  const isOnline = useOnline();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const isOfflineDisabled = disabledWhenOffline && !isOnline;

  function runAnalysis() {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/company/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corp: posting.companyNameRaw,
          role: posting.role,
          job_posting_id:
            jobPostingIdOverride === undefined
              ? posting.id
              : jobPostingIdOverride
        })
      });
      const payload = (await response.json().catch(() => ({}))) as AnalyzeResponse;

      if (!response.ok || !payload.analysis?.id) {
        setMessage(formatAnalyzeError(response.status, payload));
        return;
      }

      router.push(`/dashboard/analyses/${payload.analysis.id}`);
      router.refresh();
    });
  }

  return (
    <div className={className}>
      <Button
        disabled={isPending || isOfflineDisabled}
        onClick={runAnalysis}
        type="button"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <BarChart3 aria-hidden="true" className="size-4" />
        )}
        {isPending ? "분석 중..." : "기업분석"}
      </Button>
      <p
        aria-live="polite"
        className={css({ color: "textMuted", minH: 5, mt: 2, textStyle: "sm" })}
      >
        {isOfflineDisabled
          ? "오프라인에서는 새로 분석할 수 없습니다."
          : isPending
            ? "분석 중입니다. 최대 1분 정도 걸릴 수 있습니다."
            : message}
      </p>
    </div>
  );
}

function formatAnalyzeError(status: number, payload: AnalyzeResponse): string {
  if (status === 429 || payload.code === "RATE_LIMITED") {
    return "요청이 많아 잠시 후 다시 시도하세요.";
  }
  if (payload.candidates && payload.candidates.length > 1) {
    return "여러 기업 후보가 검색됐습니다. 회사명을 더 구체적으로 입력하세요.";
  }
  if (status === 404) {
    return payload.error ?? "기업을 찾지 못했습니다.";
  }
  return payload.error ?? "기업분석 중 오류가 발생했습니다.";
}
