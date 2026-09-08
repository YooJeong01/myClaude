"use server";

import { revalidatePath } from "next/cache";

import { addSaved, removeSaved } from "@/entities/saved-posting";
import { requireUser, UnauthorizedError } from "@/entities/session";
import { createSupabaseServerClient } from "@/shared/api-server";

export async function toggleSavedPosting(
  jobPostingId: string,
  next: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();

    if (next) {
      await addSaved(supabase, user.id, jobPostingId);
    } else {
      await removeSaved(supabase, jobPostingId);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }

    console.error("[toggleSavedPosting]", error);
    return { success: false, error: "북마크 상태를 바꾸지 못했습니다." };
  }
}
