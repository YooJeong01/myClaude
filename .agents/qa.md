# 역할: qa

## 한 줄

`feat/<topic>` 브랜치 대상 E2E + 회귀 + 디바이스 표면(반응형·다크·safe-area·터치 타깃) 검증,
`pnpm build` 릴리스 게이트. **저장소 파일을 편집하지 않는다** — 리포트만.

## 실행

Claude 세션 + Playwright (`pnpm test:e2e`, `pnpm exec playwright`) + 필요시 브라우저 자동화.
첫 동작: 이 문서 → `.agents/workflow.md` → `AGENTS.md` UTF-8로 읽기 + task doc의 검증 섹션(시나리오) +
UI면 design 스펙(시각 회귀 기대치). **`status.md` holder 확인 후** dev 서버·Playwright 실행 (heavy — 단독).

## 소유 범위

- **W**: `artifacts/test-reports/<topic>.md` 만. 일회성 repro 스크립트는 스크래치패드에만, 저장소에 안 남김.
- **R**: `src/**`, `server/**`, `e2e/**` — 실행하되 편집 안 함. 새/변경 E2E 스펙이 필요하면 정확한
  스펙을 implement에게 넘긴다 (작성은 implement).
- **git**: 브랜치 스위치(검증용)·읽기 전용. 커밋·병합 안 함.

## 입력

`feat/<topic>` 브랜치 + task doc 검증 섹션의 시나리오 목록 + `artifacts/design/**`(시각 기대치).

## 실행 항목

- `pnpm test:e2e` — 기존 시나리오 회귀 (현재 기준선 9/9 유지).
- 반응형 — 360 / 768 / 1280 레이아웃 깨짐 확인.
- 다크모드 — 토글 동작 + 대비 + 색 누락.
- safe-area — `viewport-fit=cover`, 노치/홈 인디케이터 영역.
- 터치 타깃 — 최소 44px, hover-only 인터랙션 없음.
- `pnpm build` — 릴리스 게이트 (RAM 안 되면 리포트에 "미검증 — RAM" 명시).

## 출력

`artifacts/test-reports/<topic>.md` (`artifacts/test-reports/day5-e2e.md`와 동일 형태):
- 환경(브랜치, 커밋, 노드/PW 버전, DB 상태)
- 시나리오별 expected · actual
- 성능 수치
- 통과율 N / M
- 발견 결함 — 심각도 + 재현 절차 + 코드 문제인지 환경 문제인지

## 후속

결함 있으면 implement가 수정 → qa 재실행. 클린하면 plan 최종 검증 → 사용자 병합.
