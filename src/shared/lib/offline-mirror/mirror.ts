"use client";

import {
  getOfflineMirrorDb,
  type MirroredAnalysis,
  type MirroredDraft
} from "./db";

export async function putAnalysis(row: MirroredAnalysis): Promise<void> {
  const db = await getOfflineMirrorDb();
  await db.put("company_analyses", row);
}

export async function getAnalysis(id: string): Promise<MirroredAnalysis | null> {
  const db = await getOfflineMirrorDb();
  return (await db.get("company_analyses", id)) ?? null;
}

export async function listMirroredAnalyses(): Promise<MirroredAnalysis[]> {
  const db = await getOfflineMirrorDb();
  const rows = await db.getAll("company_analyses");
  return rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function putDraft(row: MirroredDraft): Promise<void> {
  const db = await getOfflineMirrorDb();
  await db.put("motivation_drafts", row);
}

export async function getDraft(id: string): Promise<MirroredDraft | null> {
  const db = await getOfflineMirrorDb();
  return (await db.get("motivation_drafts", id)) ?? null;
}
