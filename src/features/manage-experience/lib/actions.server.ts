"use server";

import { revalidatePath } from "next/cache";

import {
  deleteExperience,
  insertExperience,
  updateExperience,
  validateExperienceInput,
  type NewExperienceInput
} from "@/entities/experience";
import { requireUser, UnauthorizedError } from "@/entities/session";
import { createSupabaseServerClient } from "@/shared/api-server";

type ActionResult = { success: boolean; error?: string };

export async function createExperience(
  input: NewExperienceInput
): Promise<ActionResult> {
  const validationError = validateExperienceInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    await insertExperience(supabase, user.id, input);
    revalidateExperiencePaths();
    return { success: true };
  } catch (error) {
    return handleExperienceActionError(error, "경험 저장 중 오류가 발생했습니다.");
  }
}

export async function editExperience(
  id: string,
  input: NewExperienceInput
): Promise<ActionResult> {
  if (!id.trim()) {
    return { success: false, error: "수정할 경험을 찾지 못했습니다." };
  }

  const validationError = validateExperienceInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    await requireUser();
    const supabase = await createSupabaseServerClient();
    await updateExperience(supabase, id, input);
    revalidateExperiencePaths();
    return { success: true };
  } catch (error) {
    return handleExperienceActionError(error, "경험 수정 중 오류가 발생했습니다.");
  }
}

export async function removeExperience(id: string): Promise<ActionResult> {
  if (!id.trim()) {
    return { success: false, error: "삭제할 경험을 찾지 못했습니다." };
  }

  try {
    await requireUser();
    const supabase = await createSupabaseServerClient();
    await deleteExperience(supabase, id);
    revalidateExperiencePaths();
    return { success: true };
  } catch (error) {
    return handleExperienceActionError(error, "경험 삭제 중 오류가 발생했습니다.");
  }
}

function revalidateExperiencePaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/experiences");
}

function handleExperienceActionError(
  error: unknown,
  fallbackMessage: string
): ActionResult {
  if (error instanceof UnauthorizedError) {
    return { success: false, error: error.message };
  }

  console.error("[manageExperience]", error);
  return { success: false, error: fallbackMessage };
}
