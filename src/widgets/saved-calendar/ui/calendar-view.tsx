"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";

import { ko } from "date-fns/locale/ko";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";

import type { SavedPostingWithDetail } from "@/entities/saved-posting";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { css } from "../../../../styled-system/css";

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
    <div className={css({ display: "grid", gap: 6 })}>
      <Card className={css({ h: "680px", p: 3 })}>
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
      </Card>

      {selected ? <SelectedPostingPanel event={selected} /> : null}
    </div>
  );
}

function SelectedPostingPanel({ event }: { event: SavedCalendarEvent }) {
  const posting = event.resource.posting;
  const excerpt = posting.rawText?.slice(0, 300) ?? "저장된 본문이 없습니다.";

  return (
    <Card className={css({ p: 5 })}>
      <div
        className={css({
          alignItems: { md: "flex-start" },
          display: "flex",
          flexDirection: { base: "column", md: "row" },
          gap: 3,
          justifyContent: "space-between"
        })}
      >
        <div className={css({ minW: 0 })}>
          <p className={css({ color: "textMuted", textStyle: "sm" })}>
            {posting.companyNameRaw ?? "회사명 미입력"}
          </p>
          <h2 className={css({ mt: 1, textStyle: "lg" })}>
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
      <p
        className={css({
          color: "textMuted",
          mt: 4,
          textStyle: "sm",
          whiteSpace: "pre-wrap"
        })}
      >
        {excerpt}
      </p>
    </Card>
  );
}
