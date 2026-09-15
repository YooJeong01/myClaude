"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type ThemePreference } from "@/shared/lib/use-theme";
import { Button } from "@/shared/ui/button";
import { css } from "../../../../styled-system/css";

const themeOptions = [
  { value: "light", label: "라이트 모드", icon: Sun },
  { value: "dark", label: "다크 모드", icon: Moon },
  { value: "system", label: "시스템 설정", icon: Monitor }
] satisfies Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}>;

const nextPreference: Record<ThemePreference, ThemePreference> = {
  light: "dark",
  dark: "system",
  system: "light"
};

type ThemeToggleProps = {
  collapsed: boolean;
};

export function ThemeToggle({ collapsed }: ThemeToggleProps) {
  const { preference, setPreference } = useTheme();
  const CurrentIcon =
    themeOptions.find((option) => option.value === preference)?.icon ?? Monitor;

  if (collapsed) {
    return (
      <Button
        aria-label="테마 변경"
        onClick={() => setPreference(nextPreference[preference])}
        size="icon"
        title="테마 변경"
        type="button"
        variant="ghost"
      >
        <CurrentIcon aria-hidden="true" className={css({ h: 4, w: 4 })} />
      </Button>
    );
  }

  return (
    <div
      aria-label="테마"
      className={css({
        alignItems: "center",
        bg: "surface",
        borderColor: "border",
        borderRadius: "button",
        borderWidth: "1px",
        display: "inline-flex",
        gap: 1,
        p: 1
      })}
      role="group"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const active = option.value === preference;

        return (
          <Button
            aria-label={option.label}
            aria-pressed={active}
            key={option.value}
            onClick={() => setPreference(option.value)}
            size="icon"
            title={option.label}
            type="button"
            variant={active ? "default" : "ghost"}
          >
            <Icon aria-hidden="true" className={css({ h: 4, w: 4 })} />
          </Button>
        );
      })}
    </div>
  );
}
