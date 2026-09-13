import type { AnalysisSources } from "@server/analysis/types";
import { Card } from "@/shared/ui/card";
import { css } from "../../../../styled-system/css";

type SourcesProps = {
  sources: AnalysisSources;
};

export function AnalysisSourcesView({ sources }: SourcesProps) {
  return (
    <Card className={css({ p: 4 })}>
      <details>
      <summary className={css({ cursor: "pointer", fontWeight: 500, textStyle: "sm" })}>근거 보기</summary>
      <div className={css({ color: "textMuted", display: "grid", gap: 5, mt: 4, textStyle: "sm" })}>
        <section>
          <h3 className={css({ color: "text", fontWeight: 500 })}>DART</h3>
          <p>
            {sources.dart
              ? `${sources.dart.bsnsYear} / ${sources.dart.fsDiv}`
              : "사용 가능한 DART 재무 요약이 없습니다."}
          </p>
        </section>

        <SourceLinks
          emptyText="사용된 뉴스 링크가 없습니다."
          items={sources.news.map((item) => ({
            href: item.link,
            label: item.title,
            meta: item.pubDate
          }))}
          title="뉴스"
        />
        <SourceLinks
          emptyText="사용된 컨센서스 링크가 없습니다."
          items={sources.consensus.map((item) => ({
            href: item.url,
            label: item.title,
            meta: `${item.firm} · ${item.publishedDate}`
          }))}
          title="컨센서스"
        />
      </div>
      </details>
    </Card>
  );
}

function SourceLinks({
  emptyText,
  items,
  title
}: {
  emptyText: string;
  items: { href: string; label: string; meta: string }[];
  title: string;
}) {
  return (
    <section>
      <h3 className={css({ color: "text", fontWeight: 500 })}>{title}</h3>
      {items.length > 0 ? (
        <ul className={css({ display: "grid", gap: 2, mt: 2 })}>
          {items.map((item) => (
            <li key={`${item.href}-${item.label}`}>
              <a
                className={css({
                  color: "link",
                  textDecoration: "none",
                  textUnderlineOffset: "4px",
                  _hover: { textDecoration: "underline" }
                })}
                href={item.href}
                rel="noreferrer"
                target="_blank"
              >
                {item.label}
              </a>
              <p className={css({ color: "textMuted", textStyle: "xs" })}>{item.meta}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={css({ mt: 2 })}>{emptyText}</p>
      )}
    </section>
  );
}
