import { DashboardView } from "@/views/dashboard";

type DashboardPageProps = {
  searchParams?: Promise<{
    q?: string;
    employmentType?: string;
    careerLevel?: string;
    source?: string;
    showClosed?: string;
    onlyClosed?: string;
    page?: string;
  }>;
};

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  return <DashboardView searchParams={await searchParams} />;
}
