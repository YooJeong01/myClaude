"use server";

import { revalidatePath } from "next/cache";

import {
  EMPLOYMENT_TYPES,
  insertJobPosting,
  validateNewJobPosting,
  type NewJobPostingInput
} from "@/entities/job-posting";
import { requireUser, UnauthorizedError } from "@/entities/session";
import { createClient as createSupabaseServerClient } from "@/shared/api/supabase/server";

export async function submitJobPosting(
  input: NewJobPostingInput
): Promise<{ success: boolean; error?: string }> {
  const validationError = validateNewJobPosting(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const user = await requireUser();

    if (!EMPLOYMENT_TYPES.includes(input.employmentType)) {
      return { success: false, error: "유효하지 않은 고용형태입니다." };
    }

    const supabase = await createSupabaseServerClient();
    await insertJobPosting(supabase, user.id, input);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }

    console.error("[submitJobPosting]", error);
    return { success: false, error: "공고 저장 중 오류가 발생했습니다." };
  }
}
