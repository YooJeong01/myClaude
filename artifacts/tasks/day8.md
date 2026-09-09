# Day 8 태스크 — Capacitor(모바일) + Tauri(데스크톱) 앱 셸 (T49~T55)

- 작성: 2026-09-10
- **선행: 전체 리디자인 완료.** 이 작업은 웹앱을 감싸는 것이라, 리디자인으로 레이아웃·반응형·
  safe-area 가 바뀐 뒤에 해야 한다 (아니면 감싸고 → 재디자인 → 래퍼 통합점 전부 재검증).
- 관련: `day7.md`(수집), 배포는 `my-claude-ruby.vercel.app` 라이브.
- 원래 goal.md Day 8~9 "배포·인증"은 T56~ (day9.md) 로 분리 예정.

## 작업 방식

- 계획·설계·검증은 Claude, 웹측 통합 코드는 Codex 위임 가능. 네이티브 빌드/서명/스토어는 사용자.
- 브랜치 `feat/app-shells`, 태스크별 커밋, `main` `--no-ff` 병합.

## 목표

**Next.js 웹앱 하나를 iOS·Android·데스크톱 3개 타깃으로 감싼다. 웹 코드베이스는 계속 1개.**
- Capacitor → iOS/Android (네이티브 셸 + WKWebView/Android WebView + 브릿지)
- Tauri 2 → Win/Mac/Linux (네이티브 셸 + OS 웹뷰)
- 둘 다 **배포된 웹앱(`my-claude-ruby.vercel.app`)을 로드**한다 (아래 D1).

## 확정된 설계 결정

- **D1 — 웹 콘텐츠 로딩 방식: 원격 URL 로드.**
  이 앱은 SSR(서버 컴포넌트) + 미들웨어 인증 + API 라우트가 있어 `output: 'export'` 정적화가
  큰 재구성이다. Capacitor `server.url` / Tauri `app.windows[].url` 로 배포 URL 을 직접 로드한다.
  - 트레이드오프: 앱 시작에 네트워크 필요, "완전 네이티브" 느낌 약함, iOS 심사에서 순수 웹뷰 앱
    반려 가능성 → 네이티브 기능(푸시·생체인증·공유·오프라인 스플래시)을 실제로 붙여 "앱다움" 확보.
  - 오프라인: 이미 IndexedDB 미러(day5 T33)가 있어 조회는 오프라인에서도 됨.
- **D2 — 저장소 구조: 단일 저장소 루트에 공존.**
  루트에 `capacitor.config.ts` + `ios/` + `android/`, `src-tauri/`. 별도 패키지로 안 쪼갬.
- **D3 — 인증(매직링크) 딥링크: 커스텀 스킴 + Universal/App Links.**
  이메일 링크(`https://my-claude-ruby.vercel.app/auth/confirm?...`)가 앱에서 열리도록.
  Capacitor `@capacitor/app` `appUrlOpen`, Tauri deep-link 플러그인. 웹측은 `/auth/confirm` 이
  이미 처리하므로 라우팅만 앱 안으로.
- **D4 — 네이티브 빌드 CI**: Tauri 는 GHA 3-OS 매트릭스. Capacitor Android 는 GHA.
  Capacitor iOS 는 macOS + Xcode + Apple Developer($99/년) 필요 → 로컬 빌드, 문서화만.
- **D5 — 코드 서명**: 포트폴리오 단계에선 데스크톱 미서명 배포(경고 뜸) 허용. 스토어 등재 시 서명.

## T49. Capacitor 초기화 + 설정

- `pnpm add @capacitor/core @capacitor/app @capacitor/status-bar @capacitor/splash-screen @capacitor/preferences`
  `pnpm add -D @capacitor/cli`
- `npx cap init "myClaude" "com.uzzang.myclaude" --web-dir=public`
  (web-dir 는 `server.url` 쓰면 실질적으로 안 쓰이지만 필수 인자)
- `capacitor.config.ts`:
  ```ts
  server: { url: "https://my-claude-ruby.vercel.app", cleartext: false },
  ios: { contentInset: "always" },
  android: { ... }
  ```
- `npx cap add ios` / `npx cap add android` → `ios/`, `android/` 생성 (커밋).
- `.gitignore` 에 `ios/App/Pods`, `android/.gradle`, 빌드 산출물 추가.

## T50. 네이티브 통합 — 앱다움

- **스플래시/상태바** — `@capacitor/splash-screen` + `@capacitor/status-bar` 초기화 (앱 진입 시).
  웹측 진입점에서 `SplashScreen.hide()` 호출 (첫 페인트 후).
- **뒤로가기(Android)** — `@capacitor/app` `backButton` → 웹 history 있으면 `window.history.back()`,
  루트면 앱 종료 확인.
- **safe-area** — 리디자인 디자인 시스템에 `env(safe-area-inset-*)` 토큰 반영 (노치/홈 인디케이터).
  이 태스크에선 앱 셸에서 `viewport-fit=cover` 만 확인.
- **외부 링크** — `target="_blank"` / 외부 도메인은 시스템 브라우저로 (`@capacitor/browser` 또는
  `appUrlOpen` 필터). 원문 공고 링크(사람인 등)가 앱 안에서 안 열리게.
- **토큰 저장(선택)** — 생체인증 후 세션 복원용으로 `@capacitor/preferences`. 우선순위 낮음.

## T51. 매직링크 딥링크 (Capacitor)

- iOS Universal Links: `apple-app-site-association` 파일을 `my-claude-ruby.vercel.app/.well-known/` 에
  (Next.js `app/.well-known/apple-app-site-association/route.ts` 로 서빙). Apple Team ID 필요.
- Android App Links: `assetlinks.json` 마찬가지. SHA256 지문 필요.
- `@capacitor/app` `appUrlOpen` 리스너 → `/auth/confirm?...` 경로면 웹뷰를 그 URL 로 이동.
- 폴백: 커스텀 스킴 `myclaude://auth/confirm` 도 등록.
- **테스트**: 실기기에서 이메일 링크 클릭 → 앱 열림 → 로그인 완료.

## T52. Tauri 2 초기화 + 설정

- Rust 툴체인 필요 (`rustup`). `pnpm add -D @tauri-apps/cli` + `pnpm tauri init`.
- `src-tauri/tauri.conf.json`:
  - `app.windows[0]`: `{ url: "https://my-claude-ruby.vercel.app", title: "myClaude", width: 1200, height: 800, minWidth: 380 }`
  - `bundle.identifier: "com.uzzang.myclaude"`, 아이콘
  - `build.frontendDist` 는 원격 URL 이라 최소 설정
- `src-tauri/` 커밋. `.gitignore` 에 `src-tauri/target`.

## T53. Tauri 네이티브 통합

- **딥링크** — `tauri-plugin-deep-link` (`myclaude://` + `https` 연결). `/auth/confirm` 처리.
- **메뉴/트레이(선택)** — 최소 메뉴(새로고침, 종료). 트레이는 우선순위 낮음.
- **외부 링크** — `tauri-plugin-shell` `open` 으로 시스템 브라우저.
- **자동 업데이트(선택)** — `tauri-plugin-updater`. 원격 URL 로드라 웹 내용은 자동 최신,
  셸 업데이트만 해당 → 우선순위 낮음, 문서화만.

## T54. 빌드 파이프라인

- `.github/workflows/build-apps.yml`:
  - `tauri` job — matrix `[windows-latest, macos-latest, ubuntu-latest]`, `pnpm tauri build`,
    산출물 아티팩트 업로드 (`.msi` / `.dmg` / `.AppImage`).
  - `android` job — `ubuntu-latest`, JDK + Android SDK, `npx cap sync android` + `./gradlew assembleRelease`,
    `.apk` 아티팩트.
  - `workflow_dispatch` + 태그 푸시 트리거.
- iOS 는 CI 제외 (macOS + Xcode + 서명 필요) — README 에 로컬 빌드 절차만.

## T55. 검증

- **Tauri**: `pnpm tauri dev` → 데스크톱 창에서 로그인·분석·캘린더 동작 확인. `pnpm tauri build` 산출물 실행.
- **Capacitor Android**: 에뮬레이터 `npx cap run android` → 로그인·딥링크·뒤로가기·외부링크·safe-area 확인.
- **Capacitor iOS**: 시뮬레이터 `npx cap run ios` (macOS 필요) — 사용자 로컬.
- `tsc --noEmit` / `pnpm lint` / `pnpm build`(웹) 그린 유지.
- `artifacts/test-reports/day8-app-shells.md` — 타깃별 스모크 결과 표 (플랫폼/빌드/실행/딥링크/문제).
- E2E(`e2e/*.spec.ts`)는 웹 대상이라 영향 없음, 회귀 1회.

## 예상 이슈 (포트폴리오 소재)

- SSR 앱을 원격 URL 로드로 감쌌을 때: 초기 로딩 스피너, 쿠키/세션 도메인, 딥링크로 들어온 인증.
- iOS 순수 웹뷰 앱 심사 리스크 → 네이티브 기능 추가로 대응.
- Capacitor 브릿지 ↔ 웹 `postMessage` 통신 설계 (있다면).
- Tauri Rust 툴체인·서명 미설정 시 경고.

## 규율 (day7.md 계승)

1. 웹 코드베이스는 1개 유지 — 두 래퍼는 얇게, 배포 URL 로드.
2. 브랜치 `feat/app-shells` → 태스크별 커밋 → `main` `--no-ff` 병합. main 직접 커밋·push 는 사용자 지시 시.
3. 커밋 전 `tsc --noEmit` / `pnpm lint` / `pnpm build`(웹).
4. `ios/`, `android/`, `src-tauri/` 의 빌드 산출물·의존성은 `.gitignore`.
5. 네이티브 서명키·프로비저닝은 커밋 금지. GitHub Secrets.
