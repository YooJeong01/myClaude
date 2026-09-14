import { type CareerLevel } from "./types";

export function extractCareerLevel(text: string): CareerLevel | null {
  const t = text.replace(/\s+/g, "");
  if (/경력무관/.test(t)) return "경력무관";
  if (/신입[·,/및]?경력|경력[·,/및]?신입/.test(t)) return "신입·경력";
  if (/신입/.test(t)) return "신입";
  if (/경력\d+[년~-]|경력직|\d+년이상/.test(t)) return "경력";
  return null;
}
