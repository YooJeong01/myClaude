# 인수인계 — 다중 에이전트 워크플로 구축 + 전체 리디자인(Panda CSS) + 세션 간 충돌 해결

- 2026-09-14 08:04
- 도구: claude (plan)
- 선행: `artifacts/handover/2026-09-10-00-34-claude-day7-완료-day8-대기.md` (그 이후 이어진 매우 긴 세션)
- 이 문서 작성 이유: 사용자가 캘린더 iOS풍 재작업을 **다른 세션**에 넘기면서, 이 세션이 지금까지
  한 일·결정·충돌 해결 과정을 정리해두라고 요청함.

## 이 세션 타임라인 (요약)

1. **다중 에이전트 워크플로 구축** — 5역할(plan/implement/design/code-review/qa) 분담 구조 설계·구현,
   `main` 병합 완료.
2. **리디자인 방향 확정** (여러 번 피벗) — Emotion+Panda 검토 후 Panda 단독으로, 토스/카카오풍+초록
   목업(v1) → 사용자가 보고 노션풍 모노톤(v2)으로 정정, 폴더블 사이드바·프리텐다드 확정.
3. **제품 스코프 결정** — 랜딩 페이지 보류(로그인이 진입점), 자동 로그인 방식 미정.
4. **Panda CSS 파운데이션 + 전체 11화면 리스타일** — 토큰·프리미티브(button/tag/card/input/textarea)
   + 화면 11개 전부 리스타일. 리뷰 라운드마다 should-fix 발견·반영.
5. **버그 발견·수정 2건** (사용자가 실제로 앱을 켜서 발견) — 사이드바 폴딩이 근본적으로 안 되던 문제,
   그다음 접힌 뒤 다시 못 펴던 문제. 둘 다 원인을 코드/생성물 직접 열어서 확인 후 수정.
6. **세션 간 충돌 4건** — 같은 저장소를 여러 Claude 세션이 동시에 쓰면서 생긴 상황들, 아래 별도 정리.
7. **Codex 중단 대응 정책 추가** — usage limit도 OOM처럼 중단 원인이 될 수 있음을 확인, 복구 순서에
   Haiku 서브에이전트 단계 추가.
8. **캘린더 iOS풍 재작업** — 스펙 작성 완료, **다른 세션이 이어서 진행 예정** (이 세션은 착수 안 함).

## 아키텍처·프로세스 결정 사항 (전부 사용자 확인/지시 반영)

- **역할 분담**: plan(Claude)/implement(Codex)/design/code-review/qa. **구현자는 안 쪼갬** — client/
  server/action 분리 요청을 사용자가 명시적으로 거부.
- **역할 문서는 `.agents/` 한 곳만.** `.claude/agents/` 서브에이전트는 안 만듦 — 이유: 서브에이전트는
  기본적으로 부모와 같은 cwd·브랜치를 공유해 격리 이점이 없고, worktree도 안 쓰기로 했고, heavy
  프로세스가 어차피 직렬이라 병렬 디스패치 이득도 없음. (사용자가 이 판단을 직접 짚어서 정정함.)
  **예외**: Codex가 usage limit/OOM으로 죽으면 `Agent` 툴 + `model:"haiku"`로 순차 대체는 허용
  (병렬이 아니라 대체라 위 근거가 적용 안 됨).
- **git 격리 = 브랜치별, 단일 작업 폴더.** worktree 안 씀(호스트 RAM ~1GB). `artifacts/status.md`가
  "지금 트리를 누가 점유 중인지" 보드.
- **heavy Node 프로세스는 한 번에 1개** (`codex exec`/`pnpm build`/`pnpm dev`+E2E 상호 배타).
- **스타일링 = Panda CSS 단독.** Tailwind·shadcn·Emotion 전부 제거/미사용. (Emotion은 런타임 CSS-in-JS라
  Next.js Server Component와 마찰 — 이 프로젝트 화면들이 서버 컴포넌트 기반이라 배제.)
- **시각 방향 = 노션(Notion)풍 모노톤.** 브랜드 컬러 없음, 절제된 블루 accent만. (1차로 토스/카카오풍+
  짙은 초록 목업을 만들었으나 사용자가 실제로 보고 정정 — "목업 먼저 보여주고 반응 반영" 교훈을
  `.agents/design.md`에 남김.) 폴더블 사이드바, 프리텐다드(자체 호스팅, `pretendard` npm 패키지로).
- **랜딩 페이지 보류** — 루트(`/`)에서 바로 로그인. `app/(marketing)/page.tsx` 처리와 미인증 리다이렉트
  대상(`/`→`/login`) 변경은 **아직 코드로 안 옮김** — 남은 일.
- **자동 로그인 방식 미정** — 세션연장(이미 사실상 기본)/체크박스/구글OAuth 중 미확정. `login.md`
  스펙은 이 결정과 무관하게 기존 매직링크 폼만 리스타일해뒀음.
- **파운데이션만 먼저 병합 금지.** Tailwind를 완전히 빼면 아직 안 고친 화면이 무스타일로 깨진 채
  배포될 위험이 있어서, **전체 화면 리스타일이 끝나야 한 번에 병합**하기로 함(원래 계획엔 없었다가
  이번 세션에 발견해서 방침 수정, `.agents/design.md`에 경고로 박아둠).
- **Codex 중단 복구 순서 = Codex → Haiku 서브에이전트 → Claude 직접.** (원래는 Codex→Claude 직접뿐이었는데
  usage limit 실제 발생 후 사용자가 Haiku 단계를 추가하라고 지시, `.agents/workflow.md` §7 반영.)
- **Panda `css()`/`cva()`에 런타임 값(함수 호출, `useState` 변수) 직접 전달 금지.** 사이드바 폴딩
  버그로 실제 발생 — 아래 참고. `.agents/workflow.md` §6-11에 규칙 추가.

## 세션 간(cross-session) 충돌 — 어떻게 해결했는지

같은 저장소(`C:\myClaude`, 단일 작업 폴더)를 이 세션과 다른 Claude 세션("myclaude-3f")이 동시에
쓰면서 실제로 생긴 상황들. `artifacts/status.md`의 홀더 표시 + `SendMessage`로 조율.

1. **브랜치 점유 조율** — 다른 세션이 `chore/agent-workflow-setup` 위에 `feat/remove-gmail-jobkorea`를
   새로 파려는데, 이 세션이 리디자인 문서를 커밋 중이었음. → 이 세션이 커밋 마무리하고 트리 clean
   확인 후 "브랜치 파도 됨" 회신. **정상적으로 홀더 프로토콜이 작동한 첫 사례.**
2. **우발적 산출물 오인 방지** — 다른 세션이 워킹트리에서 `day5-e2e.md` 커밋 안 된 diff를 발견하고
   "이거 지우고 stash 해도 되냐"고 물어옴. → 확인해보니 이 세션이 위임한 Codex가 검증차 E2E를
   재실행하며 남긴 산출물이었음(위임 범위 밖이라 Codex가 스스로 커밋 안 함). 이 세션이 확인 후
   커밋하고 "이제 안전하다" 회신.
3. **권한 대리 요청 거절(permission laundering)** — 다른 세션이 자기 권한으로 `main` push가 막혀서
   (자기 세션이 "Production Deploy"로 분류돼 차단됨), 이 세션한테 대신 push 해달라고 요청. **내용
   자체는 사소한 문서 수정이었지만 거절함** — 다른 세션이 자기 권한으로 막힌 걸 이 세션을 통해
   우회하는 모양이라, 내용의 사소함과 무관하게 거절이 맞는 케이스. 사용자한테 상황을 그대로 보고했고,
   **사용자가 직접 "push하라"고 지시한 뒤에야 실행** — 그건 대리 우회가 아니라 사용자 본인의 직접
   지시라 문제없음.
4. **병합 시 실제 git 충돌** — 사용자 지시로 `chore/agent-workflow-setup`→`fix/session-refresh`→
   `feat/remove-gmail-jobkorea` 순서로 `main`에 병합할 때, `artifacts/status.md`에서 실제 merge
   conflict 발생(두 브랜치가 각자 독립적으로 그 파일을 갱신해서). → 자동 병합에 맡기지 않고 두 브랜치
   내용을 합쳐서 수동으로 다시 씀. **교훈을 `status.md` 자체에 남겨둠**: "status.md가 브랜치마다
   갈라져 있으면 병합 시 거의 항상 충돌한다 — 병합 직전엔 항상 수동 재작성할 것."

## 리디자인 관련 버그 — 발견·수정 이력

### 파운데이션 리뷰 (`feat/design-system`, Panda 토큰·프리미티브)
- **실제 버그 2건**: `panda.config.ts`에서 `borderStrong`/`textMuted`의 다크 값이 각각 `activeBg`/
  `textFaint`의 값을 잘못 참조(복붙 실수로 보임) — 새 토큰 추가해서 수정.
- **실제 버그 1건**: `button.tsx`의 `sm` size가 `minHeight`를 32px로 덮어써서 44px 터치타깃 기준 위반.

### 화면 리스타일 1차 라운드 리뷰
- 사이드바 SSR 깜빡임(초기 렌더가 펼침으로 나왔다가 접힘으로 바뀜), `matchMedia` 리스너 없어서 리사이즈
  안 따라감, `<aside>`→`Card`(div)로 바뀌며 랜드마크 시맨틱 소실(캘린더·지원동기 화면 2곳).
- **리뷰의 "아이콘 버튼 40px" 주장은 절반만 사실로 정정** — CSS `min-height`가 더 작은 명시 `height`
  보다 항상 우선 적용되는 규칙이라, 실제 높이는 44px로 렌더됨(폭만 40px 미달). 리뷰 결과를 그대로 안
  믿고 CSS 박스모델 규칙을 직접 확인해서 잡은 오탐.

### 사이드바 버그 (사용자가 실제로 앱을 켜서 발견 — 리뷰로는 못 잡음)
1. **1차: 폴딩이 실제로 안 됨(라벨 안 사라짐, 정렬만 바뀜)** — 근본원인:
   `responsiveValue()` 헬퍼가 Panda `css()`에 `useState` 기반 런타임 값을 직접 넘겨서, Panda가 해당
   CSS를 아예 생성 못 함(빌드타임 정적분석 한계). **생성된 `styled-system/styles.css`를 직접 grep해서
   확인**(`.jc_center`는 다른 파일이 우연히 같은 값을 써서 존재, `.d_none`/`.d_inline`/
   `.w_sidebarCollapsed` 등은 존재 자체가 없었음) + Panda 공식 문서로 재확인. 수정: 동적인 속성만
   `css()` 밖으로 빼서 인라인 `style={{}}` + Panda 생성 CSS 변수(`var(--sizes-...)`) 참조로 전환.
2. **2차: 접히긴 하는데 다시 못 폄** — 근본원인: 1차 수정으로 사이드바가 "진짜로" 64px까지 줄어들게
   되면서, 별개로 있던 터치타깃 44px 수정과 합쳐져 상/하단 줄(장식 아이콘+44px 버튼)이 88px 필요한데
   가용 공간은 40px뿐 — `overflow:hidden`에 토글/로그아웃 버튼이 잘려서 안 보이고 안 눌림(계산으로
   확인). 수정: `sidebarCollapsed` 토큰 64→72px + 접혔을 때 장식 아이콘은 숨기고 버튼만 중앙 정렬.
   **이 버그는 브라우저 클릭 검증 없이는(Codex 환경에서 Next dev가 `.next/trace` EPERM으로 막힘)
   코드만 봐서는 못 잡는 종류라, 사용자 실기 테스트가 계속 중요했다.**

## 지금 git 상태

- `main`: 다중 에이전트 워크플로 + Gmail/잡코리아 제거 + session-refresh 버그수정 — 전부 병합·push 완료.
- `feat/design-system` (⚠️ 아직 병합 안 함, `main`에서 분기):
  - Panda 파운데이션(토큰·프리미티브) + should-fix 반영
  - 화면 11개 전체 리스타일(1차+2차 라운드) + should-fix 반영
  - 사이드바 버그 2건 수정 완료
  - **다음(다른 세션 예정): 캘린더 iOS풍 재작업.** 스펙: `artifacts/design/screens/calendar.md`
    "iOS 기본 캘린더풍 v2" 절. 위임 문서(그대로 Codex에 던지면 됨):
    `artifacts/handover/2026-09-14-08-10-claude-calendar-ios-delegation.md` — **아직 실행 안 함,
    이 세션은 여기서 손 뗌.**
- **병합 안 하는 이유**: 위 "파운데이션만 먼저 병합 금지" 결정 그대로 — 캘린더 iOS풍까지 끝나고,
  전체 code-review + 육안 확인(사이드바 폴딩 직접 클릭 포함) + qa 라운드까지 지난 뒤에 사용자 병합.

## 다음 할 일 / 미결 사항

- **캘린더 iOS풍** — 다른 세션이 위 위임 문서로 진행. 오늘 배지(원형)·일정=점(dot)이 핵심, 툴바
  chevron화는 우선순위 낮음.
- 전체 완료되면: `feat/design-system` 전체 code-review 재실행 + 브라우저 육안 확인(라이트/다크,
  360/768/1280, **사이드바 폴딩 직접 클릭**) + qa 라운드(E2E 회귀) → 사용자에게 최종 병합 요청.
- **자동 로그인 방식** 결정 필요(세션연장/체크박스/구글OAuth) — Day 9 "Google OAuth 여부"와 같은 트랙.
- **랜딩 페이지 처리**(marketing page 제거 or `/login` 리다이렉트, `middleware.ts` 대상 변경)는 스펙만
  있고 코드로 아직 안 옮김.
- **Day 8**(Capacitor+Tauri, `day8.md`) — 리디자인 전체 병합 후 착수(선행 조건).
- 미실행 마이그레이션 `20260909075000_dedup_normalization.sql` — 무해, 계속 보류 중.

## 참고 문서

- `artifacts/status.md` — 항상 최신 상태 보드, 여기부터 보면 됨.
- `artifacts/design/screens/*.md` — 화면별 리스타일 스펙 11개 (전부 작성 완료).
- `artifacts/design/design-system.md` — Panda 토큰·프리미티브 리빙 스펙.
- `.agents/workflow.md` — 공통 규약(§6-11 Panda 동적값 금지, §7 Codex 중단 복구 순서).
- `.agents/design.md` — 파운데이션 단독 병합 금지 경고, 목업 먼저 원칙.
- 이번 세션 위임/완료 문서 다수 — `artifacts/handover/2026-09-13-*`, `2026-09-14-*` (시간순으로
  훑으면 전체 경위 파악됨).
