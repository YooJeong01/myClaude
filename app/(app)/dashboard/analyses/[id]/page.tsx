import { notFound, redirect } from "next/navigation";

import { getAnalysis } from "@/entities/company-analysis";
import { getUser } from "@/entities/session";
import { RunAnalysisButton } from "@/features/run-analysis";
import { createSupabaseServerClient } from "@/shared/api-server";
import { CompanyAnalysisReport } from "@/widgets/company-analysis-report";

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
  const analysis = await getAnalysis(supabase, id);
  if (!analysis) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <CompanyAnalysisReport
          action={
            analysis.jobPostingId ? undefined : (
              <RunAnalysisButton
                disabledWhenOffline
                posting={{
                  id: analysis.id,
                  companyNameRaw: analysis.companyName,
                  role: analysis.role,
                  employmentType: "기타",
                  postedAt: null,
                  deadline: null,
                  url: null,
                  rawText: null,
                  createdAt: analysis.createdAt
                }}
              />
            )
          }
          analysis={analysis}
        />
      </div>
    </main>
  );
}
