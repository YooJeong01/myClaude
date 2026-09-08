import { generateJson } from "../llm/client";
import { GEMINI_MODEL } from "../llm/config";
import { buildMotivationPrompt, MOTIVATION_SYSTEM_INSTRUCTION } from "./prompt";
import {
  MOTIVATION_SCHEMA_VERSION,
  motivationResultSchema,
  type GeneratedMotivation,
  type MotivationInput,
  type MotivationOutput,
  type MotivationResult
} from "./types";

export async function generateMotivation(
  input: MotivationInput
): Promise<MotivationOutput> {
  const generated = await generateJson<GeneratedMotivation>({
    prompt: buildMotivationPrompt(input),
    schema: motivationResultSchema,
    systemInstruction: MOTIVATION_SYSTEM_INSTRUCTION
  });

  const result: MotivationResult = {
    schema_version: MOTIVATION_SCHEMA_VERSION,
    ...generated
  };

  return {
    result,
    model: GEMINI_MODEL
  };
}
