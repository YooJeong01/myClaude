import type { SavedPostingWithDetail } from "@/entities/saved-posting";

export type SavedCalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  resource: SavedPostingWithDetail;
};

export function toSavedCalendarEvents(
  savedPostings: SavedPostingWithDetail[]
): SavedCalendarEvent[] {
  return savedPostings.map((savedPosting) => {
    const start = parseDate(
      savedPosting.posting.postedAt ?? savedPosting.createdAt
    );
    const end = parseDate(savedPosting.posting.deadline ?? null) ?? start;

    return {
      title: [
        savedPosting.posting.companyNameRaw ?? "회사명 미입력",
        savedPosting.posting.role
      ].join(" · "),
      start,
      end,
      resource: savedPosting
    };
  });
}

function parseDate(value: string | null): Date {
  if (!value) {
    return startOfDay(new Date());
  }
  return startOfDay(new Date(value));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
