# 한경컨센서스 수집 모듈 완료

- 2026-09-07 18:03
- 브랜치: `feat/hankyung-consensus`
- main 병합: 하지 않음
- push: 하지 않음

## 생성한 파일

- `server/hankyung/config.ts`
- `server/hankyung/types.ts`
- `server/hankyung/http.ts`
- `server/hankyung/client.ts`
- `server/jobs/verify-hankyung.ts`

## consensus.hankyung.com 실제 구조

- 목록 URL: `https://consensus.hankyung.com/analysis/list`
- 기업 리포트 탭: `?skinType=business`
- 검색 파라미터:
  - `sdate=YYYY-MM-DD`
  - `edate=YYYY-MM-DD`
  - `search_value=REPORT_TITLE`
  - `search_text=검색어`
  - `pagenum=20|50|80`
  - `now_page=1`
- 구조: 서버에서 렌더된 정적 HTML 테이블
- PDF 링크: `/analysis/downpdf?report_idx=...`
- 원문 PDF 본문/바이너리 다운로드 없음. 메타데이터의 원문 URL만 저장.
- 페이지 메타: `<meta name="robots" content="noindex, nofollow">`

## verify-hankyung.ts 실행 결과

- 명령: `cmd /c pnpm exec tsx server/jobs/verify-hankyung.ts`
- 결과: 3건 조회
- 샘플:
  - `2026-07-31 | 삼성전자(005930) | 삼성전자(005930) 무시할 실적이 아니다 | IBK투자증권 | https://consensus.hankyung.com/analysis/downpdf?report_idx=651325`
  - `2026-07-08 | 삼성전자(005930) | 삼성전자(005930) 실적 전망치 상향 조정 지속 | iM증권 | https://consensus.hankyung.com/analysis/downpdf?report_idx=650561`
  - `2026-07-08 | 삼성전자(005930) | 삼성전자(005930) 외풍을 극복하고도 남을 실적 | IBK투자증권 | https://consensus.hankyung.com/analysis/downpdf?report_idx=650554`

## 검증

- `cmd /c pnpm exec tsc --noEmit`: 통과
- `cmd /c pnpm lint`: 통과
- `cmd /c pnpm build`: 통과
  - Next 빌드 중 "Next.js plugin was not detected" 경고가 있었으나 빌드는 성공.

## 커밋

- `25feade` - `[feat] 한경컨센서스 목록 수집 모듈 추가`
- `baae887` - `[chore] 한경컨센서스 검증 스크립트 추가`

## 미해결/주의 사항

- `stockName` 옵션은 사이트 제목 검색 후 클라이언트에서 파싱한 종목명을 정확히 필터한다.
- `keyword` 옵션은 넓은 제목 키워드 검색이라 다른 종목이 포함될 수 있다.
- 현재 구현은 첫 페이지 최대 80건만 조회한다. 더 깊은 과거 범위가 필요하면 페이지네이션 정책 결정을 별도로 해야 한다.
- 작업 전부터 있던 `.claude/settings.json`, `.claude/settings.local.json`, 위임 원본 문서는 건드리지 않음.
