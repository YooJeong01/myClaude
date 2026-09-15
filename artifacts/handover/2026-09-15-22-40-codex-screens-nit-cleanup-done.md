# screens nit 6건 정리 완료 (Codex)

- 완료 시각: 2026-09-15 22:40 KST
- 브랜치: `feat/screens-nit-cleanup`
- 코드 커밋: `0cfd093` (`[chore] screens nit 스타일 중복 정리`)
- main 병합·push: 하지 않음

## 변경 파일

- `src/shared/ui/input.tsx`
- `src/shared/ui/textarea.tsx`
- `src/shared/ui/form-status-row.tsx` (신규)
- `src/shared/ui/separated-list.ts` (신규)
- `src/features/search-job-postings/ui/filter-form.tsx`
- `src/features/add-job-posting/ui/form.tsx`
- `src/features/auth/ui/login-form.tsx`
- `src/features/manage-experience/ui/experience-form.tsx`
- `src/features/manage-experience/ui/experience-list.tsx`
- `src/widgets/analysis-history/ui/history-list.tsx`

## 새 패키지·env

- 새 패키지 없음
- env 변경 없음
- 마이그레이션 없음

## 검증 결과

- `pnpm exec tsc --noEmit`: 통과
- `pnpm lint`: 통과 (`eslint . && steiger ./src`, FSD 문제 0)
- `pnpm build`: 통과
- 브라우저 육안 확인: 미실행. 코드 근거로 필터폼·로그인·경험·공고 폼의 스타일/구조 정리만 수행.

## nit 6건 적용 여부

1. 체크박스-인풋 행 높이 불일치: 적용. 필터폼 그리드에 `alignItems: "center"`를 추가해 같은 행의 40px 인풋/select와 44px 터치 타겟 라벨이 시각적으로 중앙 정렬되게 함.
2. `Input`/`Textarea` 공용 스타일 width 누락: 적용. 두 프리미티브 기본 스타일에 `w: "full"` 추가.
3. `cn(inputStyle, css({ w: "full" }))` 중복 패턴: 적용. `selectStyle`을 공용 export로 추가하고 필터폼/공고폼 select에 재사용.
4. 폼 하단 상태 줄 중복: 적용. `FormStatusRow` 공용 컴포넌트를 추가하고 login/experience/job-posting 폼 3곳에서 재사용.
5. `& > article + article` 구분선 중복: 적용. `separatedArticleListStyle` 공용 스타일을 추가하고 experience/history 리스트 2곳에서 재사용.
6. Input/Textarea 포커스 전환 트랜지션 없음: 적용. 두 프리미티브에 `transitionProperty: "colors"`, `transitionDuration: "fast"`, `transitionTimingFunction: "standard"` 추가.

## 스펙 이탈·주의

- 스펙 이탈 없음.
- `artifacts/status.md`, `.claude/settings.local.json`은 작업 전/외부 변경으로 보이는 상태라 코드 커밋에서 제외함.
