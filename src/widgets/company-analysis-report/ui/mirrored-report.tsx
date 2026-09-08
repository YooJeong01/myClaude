"use client";

import type React from "react";
import { useEffect, useState } from "react";

import type { CompanyAnalysis } from "@/entities/company-analysis";
import {
  getAnalysis,
  putAnalysis,
  type MirroredAnalysis
} from "@/shared/lib/offline-mirror";
import { useOnline } from "@/shared/lib/use-online";

import { CompanyAnalysisReport } from "./report";

type MirroredCompanyAnalysisReportProps = {
  action?: React.ReactNode;
  analysis: CompanyAnalysis | null;
  analysisId: string;
};

export function MirroredCompanyAnalysisReport({
  action,
  analysis,
  analysisId
}: MirroredCompanyAnalysisReportProps) {
  const isOnline = useOnline();
  const [mirroredAnalysis, setMirroredAnalysis] =
    useState<CompanyAnalysis | null>(analysis);
  const usingMirror = !analysis || !isOnline;
  const visibleAnalysis = usingMirror ? mirroredAnalysis : analysis;

  useEffect(() => {
    if (!analysis) {
      return;
    }

    setMirroredAnalysis(analysis);
    void putAnalysis(toMirroredAnalysis(analysis));
  }, [analysis]);

  useEffect(() => {
    if (analysis && isOnline) {
      return;
    }

    void getAnalysis(analysisId).then((row) => {
      if (row) {
        setMirroredAnalysis(fromMirroredAnalysis(row));
      }
    });
  }, [analysis, analysisId, isOnline]);

  if (!visibleAnalysis) {
    return (
      <div className="rounded-md border bg-card p-5 text-sm leading-6 text-muted-foreground">
        저장된 오프라인 분석 데이터를 찾지 못했습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {usingMirror ? (
        <div className="rounded-md border bg-secondary p-4 text-sm font-medium text-secondary-foreground">
          오프라인 · 마지막으로 본 데이터
        </div>
      ) : null}
      <CompanyAnalysisReport
        action={usingMirror ? null : action}
        analysis={visibleAnalysis}
      />
    </div>
  );
}

function toMirroredAnalysis(analysis: CompanyAnalysis): MirroredAnalysis {
  return {
    id: analysis.id,
    companyId: analysis.companyId,
    companyName: analysis.companyName,
    role: analysis.role,
    jobPostingId: analysis.jobPostingId,
    result: analysis.result,
    sources: analysis.sources,
    model: analysis.model,
    createdAt: analysis.createdAt
  };
}

function fromMirroredAnalysis(row: MirroredAnalysis): CompanyAnalysis {
  return row as CompanyAnalysis;
}
