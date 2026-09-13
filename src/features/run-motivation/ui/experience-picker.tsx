"use client";

import type { Experience } from "@/entities/experience";
import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";
import { css } from "../../../../styled-system/css";

type ExperiencePickerProps = {
  experiences: Experience[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
};

export function ExperiencePicker({
  disabled = false,
  experiences,
  onChange,
  selectedIds
}: ExperiencePickerProps) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
      return;
    }
    onChange([...selectedIds, id]);
  }

  if (experiences.length === 0) {
    return (
      <Card className={css({ color: "textMuted", p: 5, textStyle: "sm" })}>
        저장된 경험이 없습니다. 먼저 내 경험을 추가하세요.
      </Card>
    );
  }

  return (
    <div className={css({ display: "grid", gap: 3 })}>
      {experiences.map((experience) => {
        const selected = selectedIds.includes(experience.id);

        return (
        <label
          className={cn(
            css({
              borderColor: "border",
              borderRadius: "card",
              borderWidth: "1px",
              color: "text",
              cursor: "pointer",
              display: "flex",
              gap: 3,
              minH: "touchTarget",
              p: 4,
              transitionDuration: "fast",
              transitionProperty: "background, border-color, color",
              transitionTimingFunction: "standard",
              _hover: { bg: "surface" }
            }),
            selected
              ? css({
                  bg: "tagBlue.bg",
                  borderColor: "link",
                  color: "tagBlue.text"
                })
              : css({ bg: "bgElevated" })
          )}
          key={experience.id}
        >
          <input
            checked={selected}
            className={css({
              accentColor: "link",
              flexShrink: 0,
              h: 4,
              mt: 1,
              w: 4
            })}
            disabled={disabled}
            onChange={() => toggle(experience.id)}
            type="checkbox"
          />
          <span className={css({ minW: 0 })}>
            <span className={css({ display: "block", fontWeight: 500, textStyle: "sm" })}>
              {experience.title}
            </span>
            <span
              className={css({
                color: selected ? "tagBlue.text" : "textMuted",
                display: "-webkit-box",
                lineClamp: 3,
                mt: 1,
                overflow: "hidden",
                textStyle: "sm"
              })}
            >
              {experience.body}
            </span>
          </span>
        </label>
        );
      })}
    </div>
  );
}
