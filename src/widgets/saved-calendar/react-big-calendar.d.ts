declare module "react-big-calendar" {
  import type { ReactElement } from "react";

  export const Views: {
    MONTH: "month";
  };

  export type DateFnsLocalizerOptions = {
    format: unknown;
    parse: unknown;
    startOfWeek: unknown;
    getDay: unknown;
    locales: Record<string, unknown>;
  };

  export function dateFnsLocalizer(
    options: DateFnsLocalizerOptions
  ): unknown;

  export type CalendarProps<TEvent extends object = object> = {
    culture?: string;
    defaultView?: string;
    endAccessor: keyof TEvent | string;
    events: TEvent[];
    localizer: unknown;
    onSelectEvent?: (event: TEvent) => void;
    startAccessor: keyof TEvent | string;
    views?: string[];
  };

  export function Calendar<TEvent extends object = object>(
    props: CalendarProps<TEvent>
  ): ReactElement | null;
}
