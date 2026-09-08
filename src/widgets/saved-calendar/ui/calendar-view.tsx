"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";

import { ko } from "date-fns/locale/ko";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";

import type { SavedPostingWithDetail } from "@/entities/saved-posting";
import { Button } from "@/shared/ui/button";

import {
  toSavedCalendarEvents,
  type SavedCalendarEvent
} from "../lib/to-events";

const locales = { ko };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ko }),
  getDay,
  locales
});

type CalendarViewProps = {
  savedPostings: SavedPostingWithDetail[];
};

export function CalendarView({ savedPostings }: CalendarViewProps) {
  const [selected, setSelected] = useState<SavedCalendarEvent | null>(null);
  const events = useMemo(
    () => toSavedCalendarEvents(savedPostings),
    [savedPostings]
  );

  return (
    <div className="space-y-6">
      <div className="h-[680px] rounded-md border bg-card p-3 text-card-foreground">
        <Calendar
          culture="ko"
          defaultView={Views.MONTH}
          endAccessor="end"
          events={events}
          localizer={localizer}
          onSelectEvent={(event: SavedCalendarEvent) => setSelected(event)}
          startAccessor="start"
          views={[Views.MONTH]}
        />
      </div>

      {selected ? <SelectedPostingPanel event={selected} /> : null}
    </div>
  );
}

function SelectedPostingPanel({ event }: { event: SavedCalendarEvent }) {
  const posting = event.resource.posting;
  const excerpt = posting.rawText?.slice(0, 300) ?? "저장된 본문이 없습니다.";

  return (
    <aside className="rounded-md border bg-card p-5 text-card-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {posting.companyNameRaw ?? "회사명 미입력"}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-normal">
            {posting.role}
          </h2>
        </div>
        {posting.url ? (
          <Button asChild variant="secondary">
            <a href={posting.url} rel="noreferrer" target="_blank">
              <ExternalLink aria-hidden="true" className="size-4" />
              원문 보기
            </a>
          </Button>
        ) : null}
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {excerpt}
      </p>
    </aside>
  );
}
