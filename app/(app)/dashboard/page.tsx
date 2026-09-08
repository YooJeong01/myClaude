import { DashboardView } from "@/views/dashboard";

type DashboardPageProps = {
  searchParams?: Promise<{
    q?: string;
    employmentType?: string;
    source?: string;
    onlyOpen?: string;
    cursor?: string;
  }>;
};

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  return <DashboardView searchParams={await searchParams} />;
}
