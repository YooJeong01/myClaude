"use client";

import { Loader2, Plus, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";

import { EMPLOYMENT_TYPES, type EmploymentType } from "@/entities/job-posting";
import type { NewJobPostingInput } from "@/entities/job-posting";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input, inputStyle } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { css } from "../../../../styled-system/css";

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
    <form
      ref={formRef}
      className={css({ display: "grid", gap: 5 })}
      onSubmit={handleSubmit}
    >
      <Card className={css({ p: 4 })} variant="surface">
        <div
          className={css({
            display: "flex",
            flexDirection: { base: "column", md: "row" },
            gap: 3
          })}
        >
          <label
            className={css({
              display: "grid",
              flex: 1,
              gap: 2,
              fontWeight: 500,
              textStyle: "sm"
            })}
          >
            <span>URL로 채우기</span>
            <Input
              disabled={isPending || isParsingUrl}
              onChange={(event) => setParseUrl(event.target.value)}
              placeholder="https://..."
              type="url"
              value={parseUrl}
            />
          </label>
          <Button
            className={css({ mt: { md: 7 } })}
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
      </Card>

      <div
        className={css({
          display: "grid",
          gap: 4,
          gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" }
        })}
      >
        <label className={css({ display: "grid", gap: 2, fontWeight: 500, textStyle: "sm" })}>
          <span>회사명</span>
          <Input
            disabled={isPending}
            name="companyNameRaw"
            placeholder="예: ESTsoft"
          />
        </label>
        <label className={css({ display: "grid", gap: 2, fontWeight: 500, textStyle: "sm" })}>
          <span>직무</span>
          <Input
            disabled={isPending}
            name="role"
            placeholder="예: 프론트엔드 개발자"
            required
          />
        </label>
        <label className={css({ display: "grid", gap: 2, fontWeight: 500, textStyle: "sm" })}>
          <span>고용형태</span>
          <select
            className={cn(inputStyle, css({ w: "full" }))}
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
        <label className={css({ display: "grid", gap: 2, fontWeight: 500, textStyle: "sm" })}>
          <span>마감일</span>
          <Input
            disabled={isPending}
            name="deadline"
            type="date"
          />
        </label>
      </div>

      <label className={css({ display: "grid", gap: 2, fontWeight: 500, textStyle: "sm" })}>
        <span>공고 URL</span>
        <Input
          disabled={isPending}
          name="url"
          placeholder="https://..."
          type="url"
        />
      </label>

      <label className={css({ display: "grid", gap: 2, fontWeight: 500, textStyle: "sm" })}>
        <span>공고 본문</span>
        <Textarea
          className={css({ minH: "144px" })}
          disabled={isPending}
          name="rawText"
          placeholder="URL이 없다면 공고 본문을 붙여넣으세요."
        />
      </label>

      <div
        className={css({
          alignItems: { md: "center" },
          display: "flex",
          flexDirection: { base: "column", md: "row" },
          gap: 3,
          justifyContent: { md: "space-between" }
        })}
      >
        <p
          aria-live="polite"
          className={css({ color: "textMuted", minH: 5, textStyle: "sm" })}
        >
          {state.error ? (
            <span className={css({ color: "dangerText" })}>{state.error}</span>
          ) : (
            state.success
          )}
        </p>
        <Button
          className={css({ w: { base: "full", md: "auto" } })}
          disabled={isPending}
          type="submit"
        >
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
