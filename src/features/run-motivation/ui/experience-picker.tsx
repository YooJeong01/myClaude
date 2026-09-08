"use client";

import type { Experience } from "@/entities/experience";

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
      <div className="rounded-md border bg-card p-5 text-sm leading-6 text-muted-foreground">
        저장된 경험이 없습니다. 먼저 내 경험을 추가하세요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {experiences.map((experience) => (
        <label
          className="flex cursor-pointer gap-3 rounded-md border bg-card p-4 text-card-foreground transition-colors hover:bg-accent"
          key={experience.id}
        >
          <input
            checked={selectedIds.includes(experience.id)}
            className="mt-1 size-4"
            disabled={disabled}
            onChange={() => toggle(experience.id)}
            type="checkbox"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium">{experience.title}</span>
            <span className="mt-1 line-clamp-3 block text-sm leading-6 text-muted-foreground">
              {experience.body}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}
