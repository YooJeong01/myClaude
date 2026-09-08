"use client";

import { Loader2, Plus, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";

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

type ParsedJobPostingResponse = {
  parsed?: Partial<{
    companyNameRaw: string;
    role: string;
    employmentType: EmploymentType;
    postedAt: string;
    deadline: string;
    url: string;
    rawText: string;
  }>;
  error?: string;
};

type AddJobPostingFormProps = {
  submitAction: (
    input: NewJobPostingInput
  ) => Promise<{ success: boolean; error?: string }>;
};

export function AddJobPostingForm({ submitAction }: AddJobPostingFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [parseUrl, setParseUrl] = useState("");
  const [state, setState] = useState<SubmitState>({
    error: null,
    success: null
  });

  async function handleParseUrl() {
    const form = formRef.current;
    if (!form || !parseUrl.trim()) {
      setState({ error: "채울 공고 URL을 입력하세요.", success: null });
      return;
    }

    setIsParsingUrl(true);
    setState({ error: null, success: null });

    try {
      const response = await fetch("/api/job-posting/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parseUrl.trim() })
      });
      const payload = (await response.json()) as ParsedJobPostingResponse;

      if (!response.ok || !payload.parsed) {
        setState({
          error: payload.error ?? "URL에서 공고를 읽지 못했습니다.",
          success: null
        });
        return;
      }

      fillIfEmpty(form, "companyNameRaw", payload.parsed.companyNameRaw);
      fillIfEmpty(form, "role", payload.parsed.role);
      fillIfEmpty(form, "employmentType", payload.parsed.employmentType);
      fillIfEmpty(form, "deadline", toDateInputValue(payload.parsed.deadline));
      fillIfEmpty(form, "url", payload.parsed.url ?? parseUrl.trim());
      fillIfEmpty(form, "rawText", payload.parsed.rawText);

      setState({
        error: null,
        success: "URL로 채웠습니다. 확인 후 저장하세요."
      });
    } catch {
      setState({
        error: "URL 파싱 요청 중 오류가 발생했습니다.",
        success: null
      });
    } finally {
      setIsParsingUrl(false);
    }
  }

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
    <form ref={formRef} className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-md border bg-muted/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1 space-y-2 text-sm font-medium">
            <span>URL로 채우기</span>
            <input
              className={inputClassName}
              disabled={isPending || isParsingUrl}
              onChange={(event) => setParseUrl(event.target.value)}
              placeholder="https://..."
              type="url"
              value={parseUrl}
            />
          </label>
          <Button
            className="sm:mt-7"
            disabled={isPending || isParsingUrl}
            onClick={handleParseUrl}
            type="button"
            variant="secondary"
          >
            {isParsingUrl ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Wand2 aria-hidden="true" className="size-4" />
            )}
            URL로 채우기
          </Button>
        </div>
      </div>

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

function fillIfEmpty(
  form: HTMLFormElement,
  name: string,
  value: string | undefined
) {
  if (!value) return;
  const field = form.elements.namedItem(name);
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement ||
    field instanceof HTMLSelectElement
  ) {
    if (!field.value) {
      field.value = value;
    }
  }
}

function toDateInputValue(value: string | undefined): string | undefined {
  return value?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
}
