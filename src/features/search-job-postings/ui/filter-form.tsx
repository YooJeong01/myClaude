"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import {
  CAREER_LEVELS,
  EMPLOYMENT_TYPES,
  type CareerLevel,
  type EmploymentType
} from "@/entities/job-posting";
import { Button } from "@/shared/ui/button";

const JOB_POSTING_SOURCES = [
  { value: "", label: "전체 출처" },
  { value: "manual", label: "수동" },
  { value: "scrape_saramin", label: "사람인" },
  { value: "scrape_jobkorea", label: "잡코리아" },
  { value: "scrape_catch", label: "캐치" },
  { value: "email", label: "이메일" }
];

type FilterFormProps = {
  defaultValues: {
    q: string;
    employmentType: EmploymentType | "";
    careerLevel: CareerLevel | "";
    source: string;
    showClosed: boolean;
    onlyClosed: boolean;
  };
};

const fieldClassName =
  "h-10 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

export function JobPostingFilterForm({ defaultValues }: FilterFormProps) {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    setParam(params, "q", String(formData.get("q") ?? ""));
    setParam(params, "employmentType", String(formData.get("employmentType") ?? ""));
    setParam(params, "careerLevel", String(formData.get("careerLevel") ?? ""));
    setParam(params, "source", String(formData.get("source") ?? ""));
    setParam(params, "onlyClosed", String(formData.get("onlyClosed") ?? ""));
    if (formData.get("showClosed") === "on") {
      params.set("showClosed", "1");
    }
    router.push(params.size ? `/dashboard?${params.toString()}` : "/dashboard");
  }

  return (
    <form
      className="grid gap-3 rounded-md border bg-card p-4 md:grid-cols-[minmax(0,1fr)_10rem_10rem_10rem] lg:grid-cols-[minmax(0,1fr)_10rem_10rem_10rem_10rem_auto_auto]"
      onSubmit={handleSubmit}
    >
      <input
        className={fieldClassName}
        defaultValue={defaultValues.q}
        name="q"
        placeholder="회사명 또는 직무 검색"
      />
      <select
        className={fieldClassName}
        defaultValue={defaultValues.employmentType}
        name="employmentType"
      >
        <option value="">전체 고용형태</option>
        {EMPLOYMENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <select
        className={fieldClassName}
        defaultValue={defaultValues.careerLevel}
        name="careerLevel"
      >
        <option value="">전체 경력</option>
        {CAREER_LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
      <select
        className={fieldClassName}
        defaultValue={defaultValues.source}
        name="source"
      >
        {JOB_POSTING_SOURCES.map((source) => (
          <option key={source.value} value={source.value}>
            {source.label}
          </option>
        ))}
      </select>
      <select
        className={fieldClassName}
        defaultValue={defaultValues.onlyClosed ? "1" : ""}
        name="onlyClosed"
      >
        <option value="">전체 마감상태</option>
        <option value="1">마감된 공고만</option>
      </select>
      <label className="flex h-10 items-center gap-2 text-sm font-medium">
        <input
          className="size-4"
          defaultChecked={defaultValues.showClosed}
          name="showClosed"
          type="checkbox"
        />
        마감된 공고도 표시
      </label>
      <Button type="submit">
        <Search aria-hidden="true" className="size-4" />
        검색
      </Button>
    </form>
  );
}

function setParam(params: URLSearchParams, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) {
    params.set(key, trimmed);
  }
}
