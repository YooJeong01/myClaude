import { redirect } from "next/navigation";

import {
  getAnalysis,
  listAnalysesForCompany
} from "@/entities/company-analysis";
import { listSavedPostingIds } from "@/entities/saved-posting";
import { getUser } from "@/entities/session";
import { RunAnalysisButton } from "@/features/run-analysis";
import { SaveToggle } from "@/features/toggle-saved-posting";
import { createSupabaseServerClient } from "@/shared/api-server";
import { AnalysisHistoryList } from "@/widgets/analysis-history";
import { MirroredCompanyAnalysisReport } from "@/widgets/company-analysis-report";
import { css } from "../../../../../styled-system/css";

type AnalysisPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const analysis = await getAnalysis(supabase, id).catch((error) => {
    console.error("[AnalysisPage]", error);
    return null;
  });
  const history = analysis
    ? await listAnalysesForCompany(supabase, analysis.companyId)
    : [];
  const savedPostingIds = analysis?.jobPostingId
    ? await listSavedPostingIds(supabase)
    : new Set<string>();

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: 8 })}>
        <MirroredCompanyAnalysisReport
          action={
            analysis ? (
              <div className={css({ display: "flex", flexWrap: "wrap", gap: 2 })}>
                <RunAnalysisButton
                  disabledWhenOffline
                  jobPostingIdOverride={analysis.jobPostingId}
                  posting={{
                    id: analysis.jobPostingId ?? analysis.id,
                    companyNameRaw: analysis.companyName,
                    role: analysis.role,
                    employmentType: "기타",
                  postedAt: null,
                  deadline: null,
                  source: "analysis",
                  url: null,
                    rawText: null,
                    createdAt: analysis.createdAt
                  }}
                />
                {analysis.jobPostingId ? (
                  <SaveToggle
                    initialSaved={savedPostingIds.has(analysis.jobPostingId)}
                    jobPostingId={analysis.jobPostingId}
                  />
                ) : null}
              </div>
            ) : null
          }
          analysis={analysis}
          analysisId={id}
        />
        {analysis ? (
          <section>
            <h2 className={css({ mb: 4, textStyle: "lg" })}>
              지난 분석
            </h2>
            <AnalysisHistoryList analyses={history} currentId={analysis.id} />
          </section>
        ) : null}
    </div>
  );
}
