import { redirect } from "next/navigation";

import { getDraft } from "@/entities/motivation-draft";
import { getUser } from "@/entities/session";
import { createSupabaseServerClient } from "@/shared/api-server";
import { MirroredMotivationResult } from "@/widgets/motivation-result";

type DraftPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DraftPage({ params }: DraftPageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const draft = await getDraft(supabase, id).catch((error) => {
    console.error("[DraftPage]", error);
    return null;
  });

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <MirroredMotivationResult draft={draft} draftId={id} />
      </div>
    </main>
  );
}
