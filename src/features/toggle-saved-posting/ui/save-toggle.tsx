"use client";

import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/shared/ui/button";
import { css } from "../../../../styled-system/css";

import { toggleSavedPosting } from "../lib/actions.server";

type SaveToggleProps = {
  jobPostingId: string;
  initialSaved: boolean;
  className?: string;
};

export function SaveToggle({
  className,
  initialSaved,
  jobPostingId
}: SaveToggleProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = !isSaved;
    setError(null);
    setIsSaved(next);

    startTransition(async () => {
      const result = await toggleSavedPosting(jobPostingId, next);
      if (!result.success) {
        setIsSaved(!next);
        setError(result.error ?? "북마크 상태를 바꾸지 못했습니다.");
      }
    });
  }

  return (
    <div className={className}>
      <Button
        aria-pressed={isSaved}
        disabled={isPending}
        onClick={handleClick}
        type="button"
        variant="secondary"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : isSaved ? (
          <BookmarkCheck aria-hidden="true" className="size-4" />
        ) : (
          <Bookmark aria-hidden="true" className="size-4" />
        )}
        {isSaved ? "북마크됨" : "북마크"}
      </Button>
      {error ? (
        <p
          className={css({ color: "dangerText", mt: 2, textStyle: "sm" })}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
