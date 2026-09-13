import type { MotivationDraft } from "@/entities/motivation-draft";
import { Card } from "@/shared/ui/card";
import { css } from "../../../../styled-system/css";

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
    <article className={css({ display: "grid", gap: 6 })}>
      <header className={css({ borderBottomWidth: "1px", borderColor: "border", pb: 5 })}>
        <p className={css({ color: "textMuted", fontWeight: 500, textStyle: "sm" })}>
          {dateFormatter.format(new Date(draft.createdAt))}
        </p>
        <h1 className={css({ mt: 2, textStyle: "3xl" })}>
          지원동기 소재 초안
        </h1>
        <p className={css({ color: "textMuted", mt: 3, textStyle: "sm" })}>
          제출용 완성문이 아니라, 기업분석과 경험이 실제로 맞닿는 지점을
          정리한 예시 흐름입니다.
        </p>
      </header>

      {result.angles.length > 0 ? (
        <section className={css({ display: "grid", gap: 4 })}>
          {result.angles.map((angle) => (
            <Card className={css({ p: 5 })} key={angle.point}>
              <p className={css({ color: "link", fontWeight: 500, textStyle: "sm" })}>{angle.point}</p>
              <h2 className={css({ mt: 2, textStyle: "lg" })}>
                {angle.matched_experience}
              </h2>
              <p className={css({ color: "textMuted", mt: 3, textStyle: "sm" })}>
                {angle.connection}
              </p>
              <ul
                className={css({
                  color: "textMuted",
                  display: "grid",
                  gap: 2,
                  listStyleType: "disc",
                  mt: 4,
                  pl: 5,
                  textStyle: "sm"
                })}
              >
                {angle.draft_sentences.map((sentence) => (
                  <li key={sentence}>{sentence}</li>
                ))}
              </ul>
            </Card>
          ))}
        </section>
      ) : (
        <Card className={css({ color: "textMuted", p: 5, textStyle: "sm" })}>
          맞닿는 각도를 찾지 못했습니다. 더 구체적인 경험을 추가한 뒤 다시
          시도하세요.
        </Card>
      )}

      <Card className={css({ p: 5 })}>
        <h2 className={css({ textStyle: "lg" })}>예시 흐름</h2>
        <p className={css({ color: "textMuted", mt: 3, textStyle: "sm" })}>
          {result.summary_paragraph}
        </p>
      </Card>
    </article>
  );
}
