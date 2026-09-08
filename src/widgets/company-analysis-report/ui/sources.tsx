import type { AnalysisSources } from "@server/analysis/types";

type SourcesProps = {
  sources: AnalysisSources;
};

export function AnalysisSourcesView({ sources }: SourcesProps) {
  return (
    <details className="rounded-md border bg-card p-4 text-card-foreground">
      <summary className="cursor-pointer text-sm font-medium">근거 보기</summary>
      <div className="mt-4 space-y-5 text-sm leading-6 text-muted-foreground">
        <section>
          <h3 className="font-medium text-foreground">DART</h3>
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
      <h3 className="font-medium text-foreground">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={`${item.href}-${item.label}`}>
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={item.href}
                rel="noreferrer"
                target="_blank"
              >
                {item.label}
              </a>
              <p className="text-xs text-muted-foreground">{item.meta}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2">{emptyText}</p>
      )}
    </section>
  );
}
