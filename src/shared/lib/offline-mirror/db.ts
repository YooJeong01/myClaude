"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type MirroredAnalysis = {
  id: string;
  companyId: string;
  companyName: string;
  role: string;
  jobPostingId: string | null;
  result: unknown;
  sources: unknown;
  model: string | null;
  createdAt: string;
};

export type MirroredDraft = {
  id: string;
  companyAnalysisId: string;
  jobPostingId: string | null;
  experienceIds: string[];
  result: unknown;
  model: string | null;
  createdAt: string;
};

interface OfflineMirrorDb extends DBSchema {
  company_analyses: {
    key: string;
    value: MirroredAnalysis;
  };
  motivation_drafts: {
    key: string;
    value: MirroredDraft;
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineMirrorDb>> | null = null;

export function getOfflineMirrorDb() {
  dbPromise ??= openDB<OfflineMirrorDb>("myclaude-offline-mirror", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("company_analyses")) {
        db.createObjectStore("company_analyses", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("motivation_drafts")) {
        db.createObjectStore("motivation_drafts", { keyPath: "id" });
      }
    }
  });

  return dbPromise;
}
