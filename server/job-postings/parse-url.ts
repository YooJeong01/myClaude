import { Type, type Schema } from "@google/genai";

import { generateJson } from "../llm/client";
import { LlmError } from "../llm/errors";
import { fetchWithRetry } from "../scraping/common/http";
import { ScrapeError } from "../scraping/common/types";
import { SCRAPER_USER_AGENT } from "../scraping/common/user-agent";
import type { CollectedJobPosting, EmploymentType } from "./types";

export type ParsedJobPosting = Partial<CollectedJobPosting>;

type LlmParsedJobPosting = {
  companyName: string | null;
  role: string | null;
  employmentType: EmploymentType | null;
  postedAt: string | null;
  deadline: string | null;
  bodySummary: string | null;
};

const KNOWN_SOURCE_HOSTS = ["saramin", "jobkorea", "catch"];
const EMPLOYMENT_TYPES: EmploymentType[] = [
  "정규직",
  "계약직",
  "인턴",
  "파견",
  "프리랜서",
  "기타"
];

const llmSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    companyName: { type: Type.STRING, nullable: true },
    role: { type: Type.STRING, nullable: true },
    employmentType: {
      type: Type.STRING,
      enum: EMPLOYMENT_TYPES,
      nullable: true
    },
    postedAt: { type: Type.STRING, nullable: true },
    deadline: { type: Type.STRING, nullable: true },
    bodySummary: { type: Type.STRING, nullable: true }
  },
  required: [
    "companyName",
    "role",
    "employmentType",
    "postedAt",
    "deadline",
    "bodySummary"
  ]
};

export async function parseJobPostingUrl(url: string): Promise<ParsedJobPosting> {
  const parsedUrl = toUrl(url);
  const host = parsedUrl.hostname.toLowerCase();

  // Known sources do not have detail parsers yet. Keep this hook explicit so a
  // future detail parser can be inserted before the generic metadata fallback.
  const isKnownSource = KNOWN_SOURCE_HOSTS.some((source) => host.includes(source));
  if (isKnownSource) {
    console.log(`[parseJobPostingUrl] known source fallback: ${host}`);
  }

  const html = await fetchHtml(parsedUrl.toString());
  const metadata = parseStructuredMetadata(html, parsedUrl.toString());
  const missingCore =
    !metadata.companyNameRaw || !metadata.role || !metadata.rawText;

  if (!missingCore) {
    return metadata;
  }

  const text = htmlToText(html).slice(0, 8000);
  if (!text) {
    return metadata;
  }

  try {
    const extracted = await generateJson<LlmParsedJobPosting>({
      schema: llmSchema,
      systemInstruction:
        "채용공고 텍스트에서 지정된 필드만 추출한다. 불확실하면 null을 반환한다.",
      prompt: [
        "채용공고 텍스트에서 아래 필드만 추출. 불확실하면 null. 날짜는 YYYY-MM-DD.",
        "",
        text
      ].join("\n")
    });

    return mergeLlmResult(metadata, extracted);
  } catch (error) {
    if (error instanceof LlmError) {
      console.warn(`[parseJobPostingUrl] LLM fallback ignored: ${error.message}`);
      return metadata;
    }
    throw error;
  }
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetchWithRetry(
      url,
      {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": SCRAPER_USER_AGENT
        },
        redirect: "follow",
        signal: controller.signal
      },
      { retries: 1, baseDelayMs: 500 }
    );
    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw ScrapeError.timeout(url);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseStructuredMetadata(html: string, url: string): ParsedJobPosting {
  const fromJsonLd = parseJsonLdJobPosting(html);
  if (fromJsonLd) {
    return { ...fromJsonLd, url };
  }

  const title = getMetaContent(html, "og:title") ?? getTitle(html);
  const description = getMetaContent(html, "og:description");

  return compactPosting({
    role: title,
    rawText: description,
    url
  });
}

function parseJsonLdJobPosting(html: string): ParsedJobPosting | null {
  const scriptPattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches = html.matchAll(scriptPattern);

  for (const match of matches) {
    const rawJson = decodeHtml(match[1].trim());
    const candidates = flattenJsonLd(safeJsonParse(rawJson));
    const jobPosting = candidates.find((item) => {
      const type = item["@type"];
      return Array.isArray(type) ? type.includes("JobPosting") : type === "JobPosting";
    });

    if (jobPosting) {
      const organization = jobPosting.hiringOrganization;
      const companyName =
        typeof organization === "object" && organization !== null
          ? readString((organization as Record<string, unknown>).name)
          : undefined;

      return compactPosting({
        companyNameRaw: companyName,
        role: readString(jobPosting.title),
        employmentType: normalizeEmploymentType(jobPosting.employmentType),
        postedAt: normalizeDate(readString(jobPosting.datePosted)),
        deadline: normalizeDate(readString(jobPosting.validThrough)),
        rawText: readString(jobPosting.description)
      });
    }
  }

  return null;
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLd);
  }
  if (typeof value !== "object" || value === null) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const graph = Array.isArray(record["@graph"]) ? flattenJsonLd(record["@graph"]) : [];
  return [record, ...graph];
}

function safeJsonParse(rawJson: string): unknown {
  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
}

function mergeLlmResult(
  metadata: ParsedJobPosting,
  extracted: LlmParsedJobPosting
): ParsedJobPosting {
  return compactPosting({
    ...metadata,
    companyNameRaw: metadata.companyNameRaw ?? extracted.companyName ?? undefined,
    role: metadata.role ?? extracted.role ?? undefined,
    employmentType:
      metadata.employmentType ??
      normalizeEmploymentType(extracted.employmentType ?? undefined),
    postedAt: metadata.postedAt ?? normalizeDate(extracted.postedAt ?? undefined),
    deadline: metadata.deadline ?? normalizeDate(extracted.deadline ?? undefined),
    rawText: metadata.rawText ?? extracted.bodySummary ?? undefined
  });
}

function getMetaContent(html: string, property: string): string | undefined {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*(?:property|name)=["']${escaped}["'])(?=[^>]*content=["']([^"']*)["'])[^>]*>`,
    "i"
  );
  const match = html.match(pattern);
  return match?.[1] ? decodeHtml(match[1]).trim() : undefined;
}

function getTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1]).trim() : undefined;
}

function htmlToText(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0];
}

function normalizeEmploymentType(value: unknown): EmploymentType | undefined {
  const text = Array.isArray(value) ? value.join(" ") : readString(value);
  if (!text) return undefined;
  const lower = text.toLowerCase();

  if (lower.includes("full") || text.includes("정규")) return "정규직";
  if (lower.includes("contract") || text.includes("계약")) return "계약직";
  if (lower.includes("intern") || text.includes("인턴")) return "인턴";
  if (text.includes("파견")) return "파견";
  if (lower.includes("freelance") || text.includes("프리랜서")) return "프리랜서";
  if (EMPLOYMENT_TYPES.includes(text as EmploymentType)) return text as EmploymentType;
  return "기타";
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function compactPosting(posting: ParsedJobPosting): ParsedJobPosting {
  return Object.fromEntries(
    Object.entries(posting).filter(([, value]) => value !== undefined && value !== "")
  ) as ParsedJobPosting;
}

function toUrl(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw ScrapeError.parseError("URL 형식이 올바르지 않습니다.");
  }
}
