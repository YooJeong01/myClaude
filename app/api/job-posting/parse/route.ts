import { NextResponse } from "next/server";

import { requireUser, UnauthorizedError } from "@/entities/session";
import { parseJobPostingUrl } from "@server/job-postings/parse-url";
import { ScrapeError } from "@server/scraping/common/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireUser();

    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url !== "string") {
      return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
    }

    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        { error: "URL 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const parsed = await parseJobPostingUrl(body.url);
    return NextResponse.json({ parsed });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ScrapeError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    console.error("[job-posting/parse]", error);
    return NextResponse.json(
      { error: "공고 URL 파싱 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
