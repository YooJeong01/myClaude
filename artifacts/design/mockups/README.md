# 목업

design 역할이 `design` 스킬로 만든 아트보드 Artifact 링크 + 승인 버전 기록.

| 대상 | Artifact URL | 버전 | 승인 |
|---|---|---|---|
| 대시보드·기업분석·지원동기·캘린더·랜딩·로그인 (6아트보드, 라이트/다크 토글) | https://claude.ai/code/artifact/5050b9ff-3403-4ca5-b667-5aa733b75f9b | v2 (2026-09-13) | 승인 대기 |

- **v1 → v2 변경**: 토스/카카오풍+짙은 초록 → **노션풍 모노톤**으로 정정(사용자가 v1 보고 판단).
  브랜드 컬러 폐기, primary 버튼 거의 흑백 + 절제된 블루 accent. 왼쪽 사이드바 **폴더블**(실제 클릭
  인터랙션 — Main/CompanyAnalysis/Motivation/Calendar 4개 아트보드는 `is_interactive`). 폰트는
  프리텐다드 확정이나 목업 캔버스는 Google Fonts 제약으로 Noto Sans KR 대체 표시.
- 가정: 브랜드명 "커리어숲"은 방향 설명용 placeholder(미확정). 회사명·수치는 샘플 데이터.
- 각 아트보드 우측 상단 Tweaks의 `dark`를 켜서 다크 모드 확인 가능. 사이드바 좌상단 화살표 클릭하면
  접기/펼치기 동작.
- 다음: 이 방향 승인되면 컴포넌트별 세부 조정 라운드 → `design-system.md` 정식화 → Panda 파운데이션.

승인된 방향이 `design-system.md`의 토큰·프리미티브 값의 근거가 된다.
