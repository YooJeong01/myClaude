"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { EMPLOYMENT_TYPES, type EmploymentType } from "@/entities/job-posting";
import type { NewJobPostingInput } from "@/entities/job-posting";
import { Button } from "@/shared/ui/button";

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "min-h-36 w-full rounded-md border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

type SubmitState = {
  error: string | null;
  success: string | null;
};

type AddJobPostingFormProps = {
  submitAction: (
    input: NewJobPostingInput
  ) => Promise<{ success: boolean; error?: string }>;
};

export function AddJobPostingForm({ submitAction }: AddJobPostingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<SubmitState>({
    error: null,
    success: null
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const role = String(formData.get("role") ?? "");
    const employmentType = String(
      formData.get("employmentType") ?? "기타"
    ) as EmploymentType;

    startTransition(async () => {
      setState({ error: null, success: null });

      const result = await submitAction({
        companyNameRaw: String(formData.get("companyNameRaw") ?? ""),
        role,
        employmentType,
        deadline: String(formData.get("deadline") ?? ""),
        url: String(formData.get("url") ?? ""),
        rawText: String(formData.get("rawText") ?? "")
      });

      if (!result.success) {
        setState({
          error: result.error ?? "공고를 저장하지 못했습니다.",
          success: null
        });
        return;
      }

      form.reset();
      setState({ error: null, success: "공고를 저장했습니다." });
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span>회사명</span>
          <input
            className={inputClassName}
            disabled={isPending}
            name="companyNameRaw"
            placeholder="예: ESTsoft"
          />
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span>직무</span>
          <input
            className={inputClassName}
            disabled={isPending}
            name="role"
            placeholder="예: 프론트엔드 개발자"
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span>고용형태</span>
          <select
            className={inputClassName}
            defaultValue="기타"
            disabled={isPending}
            name="employmentType"
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span>마감일</span>
          <input
            className={inputClassName}
            disabled={isPending}
            name="deadline"
            type="date"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium">
        <span>공고 URL</span>
        <input
          className={inputClassName}
          disabled={isPending}
          name="url"
          placeholder="https://..."
          type="url"
        />
      </label>

      <label className="block space-y-2 text-sm font-medium">
        <span>공고 본문</span>
        <textarea
          className={textareaClassName}
          disabled={isPending}
          name="rawText"
          placeholder="URL이 없다면 공고 본문을 붙여넣으세요."
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className="min-h-5 text-sm text-muted-foreground"
        >
          {state.error ? (
            <span className="text-destructive">{state.error}</span>
          ) : (
            state.success
          )}
        </p>
        <Button className="w-full sm:w-auto" disabled={isPending} type="submit">
          {isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Plus aria-hidden="true" className="size-4" />
          )}
          공고 저장
        </Button>
      </div>
    </form>
  );
}
