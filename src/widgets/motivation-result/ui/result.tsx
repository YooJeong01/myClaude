import type { MotivationDraft } from "@/entities/motivation-draft";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short"
});

type MotivationResultViewProps = {
  draft: MotivationDraft;
};

export function MotivationResultView({ draft }: MotivationResultViewProps) {
  const result = draft.result;

  return (
    <article className="space-y-6">
      <header className="border-b pb-5">
        <p className="text-sm font-medium text-muted-foreground">
          {dateFormatter.format(new Date(draft.createdAt))}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          지원동기 소재 초안
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          제출용 완성문이 아니라, 기업분석과 경험이 실제로 맞닿는 지점을
          정리한 예시 흐름입니다.
        </p>
      </header>

      {result.angles.length > 0 ? (
        <section className="grid gap-4">
          {result.angles.map((angle) => (
            <div className="rounded-md border bg-card p-5 text-card-foreground" key={angle.point}>
              <p className="text-sm font-medium text-primary">{angle.point}</p>
              <h2 className="mt-2 text-lg font-semibold tracking-normal">
                {angle.matched_experience}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {angle.connection}
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                {angle.draft_sentences.map((sentence) => (
                  <li key={sentence}>{sentence}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : (
        <div className="rounded-md border bg-card p-5 text-sm leading-6 text-muted-foreground">
          맞닿는 각도를 찾지 못했습니다. 더 구체적인 경험을 추가한 뒤 다시
          시도하세요.
        </div>
      )}

      <section className="rounded-md border bg-card p-5 text-card-foreground">
        <h2 className="text-lg font-semibold tracking-normal">예시 흐름</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {result.summary_paragraph}
        </p>
      </section>
    </article>
  );
}
