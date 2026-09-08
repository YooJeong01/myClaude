import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/api";

import type { Experience, NewExperienceInput } from "./model";

type ExperienceRow = Database["public"]["Tables"]["user_experiences"]["Row"];

function mapRow(row: ExperienceRow): Experience {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/** RLS가 `user_id = auth.uid()`로 필터링하므로 별도 where 절이 필요 없다. */
export async function listExperiences(
  supabase: SupabaseClient<Database>
): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("user_experiences")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data.map(mapRow);
}

export async function insertExperience(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: NewExperienceInput
): Promise<Experience> {
  const { data, error } = await supabase
    .from("user_experiences")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      body: input.body.trim()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapRow(data);
}

export async function updateExperience(
  supabase: SupabaseClient<Database>,
  id: string,
  input: NewExperienceInput
): Promise<Experience> {
  const { data, error } = await supabase
    .from("user_experiences")
    .update({
      title: input.title.trim(),
      body: input.body.trim()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapRow(data);
}

export async function deleteExperience(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("user_experiences")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}
