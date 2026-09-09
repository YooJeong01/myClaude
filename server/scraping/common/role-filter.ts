/**
 * 채용공고 직무 관련성 필터 (프론트엔드 / 웹 개발 / 퍼블리싱 / 풀스택 범위).
 *
 * 3단계 분류:
 *  - "relevant"   — 강한 신호(프론트엔드·React·퍼블리셔 등). 저장.
 *  - "review"     — 약한 신호(개발자·엔지니어·웹 단독 등). 관련 가능성이 있어 저장하되 사용자 확인 대상.
 *  - "irrelevant" — 블랙리스트(영업·생산·간호 등) 또는 아무 신호 없음. 버림.
 *
 * 판정 순서: 블랙리스트 → 강한 신호 → 약한 신호 → 없음.
 * 블랙리스트는 "명백히 다른 직군"만 담는다. 백엔드·앱·데이터처럼 인접한 개발 직무는
 * 블랙리스트에 넣지 않는다 — 강한 신호가 없으면 "review" 로 남겨 사용자가 판단한다.
 */

export type RoleRelevance = "relevant" | "review" | "irrelevant";

/** 강한 신호 — 부분 문자열 매칭. 전부 소문자. */
const STRONG = [
  "프론트엔드",
  "프론트 엔드",
  "프론트엔트",
  "프론트 개발",
  "프론트개발",
  "front-end",
  "front end",
  "frontend",
  "fe 개발",
  "fe개발",
  "웹 개발",
  "웹개발",
  "웹 프로그래",
  "웹프로그래",
  "web developer",
  "web development",
  "웹 퍼블리",
  "웹퍼블리",
  "퍼블리셔",
  "퍼블리싱",
  "퍼블리케이션",
  "마크업",
  "markup",
  "html/css",
  "html css",
  "ui 개발",
  "ui개발",
  "ui/ux 개발",
  "클라이언트 개발",
  "client-side",
  "client side",
  "리액트",
  "react",
  "reactjs",
  "react.js",
  "next.js",
  "nextjs",
  "vue",
  "vuejs",
  "vue.js",
  "nuxt",
  "svelte",
  "sveltekit",
  "angular",
  "앵귤러",
  "타입스크립트",
  "typescript",
  "자바스크립트",
  "javascript",
  "웹표준",
  "웹 표준",
  "반응형 웹",
  "웹앱",
  "web app",
  "웹 서비스 개발",
  "웹서비스 개발",
  "풀스택",
  "풀 스택",
  "fullstack",
  "full-stack",
  "full stack"
];

/** 강한 신호 중 짧은 영어 약어 — 단어 경계로만 매칭(오탐 방지). 전부 소문자. */
const STRONG_TOKENS = ["fe", "fed", "f/e"];

/** 약한 신호 — 부분 문자열. 강한 신호가 없을 때만 본다. 전부 소문자. */
const WEAK = [
  "개발자",
  "developer",
  "development",
  "engineer",
  "엔지니어",
  "프로그래머",
  "programmer",
  "웹",
  " web ",
  "software",
  "소프트웨어",
  "sw 개발",
  "sw개발",
  "app 개발",
  "앱 개발",
  "앱개발",
  "application",
  "서비스 개발",
  "플랫폼 개발",
  "시스템 개발",
  "it개발",
  "개발 인턴",
  "개발인턴",
  "신입 개발",
  "주니어 개발"
];

/** 블랙리스트 — 명백히 다른 직군만. 부분 문자열. 전부 소문자. */
const BLACKLIST = [
  "영업",
  "세일즈",
  "마케팅",
  "광고",
  "홍보",
  "브랜딩",
  "회계",
  "세무",
  "재무",
  "경리",
  "인사",
  "노무",
  "총무",
  "경영지원",
  "비서",
  "생산",
  "제조",
  "공정",
  "설비",
  "장비",
  "기계",
  "금형",
  "사출",
  "용접",
  "배관",
  "전기",
  "전자제어",
  "회로",
  "펌웨어",
  "하드웨어",
  "화학",
  "바이오",
  "제약",
  "식품",
  "건축",
  "토목",
  "시공",
  "인테리어",
  "조경",
  "간호",
  "약사",
  "의사",
  "물리치료",
  "요양",
  "사회복지",
  "보육",
  "물류",
  "운송",
  "배송",
  "택배",
  "운전",
  "지게차",
  "상담",
  "고객센터",
  "콜센터",
  "텔레마케",
  "고객관리",
  "안내데스크",
  "리셉션",
  "구매",
  "자재",
  "무역",
  "유통",
  "매장",
  "판매",
  "서빙",
  "주방",
  "조리",
  "바리스타",
  "안전관리",
  "환경관리",
  "시설관리",
  "경비",
  "미화",
  "품질관리",
  "품질보증",
  "qc",
  "생산관리",
  "연구원",
  "실험",
  "임상",
  "특허",
  "번역",
  "통역",
  "편집자",
  "에디터",
  "작가",
  "촬영",
  "그래픽 디자이너",
  "영상편집",
  "캐드",
  "설계사",
  "보험",
  "펀드",
  "대출",
  "부동산",
  "분양",
  "교사",
  "강사",
  "학원",
  "튜터",
  "감정평가",
  "변호사",
  "법무사",
  "노무사",
  "회계사",
  "데이터 분석",
  "데이터분석",
  "데이터 라벨링",
  "머신러닝",
  "인공지능 학습"
];

function hasToken(text: string, token: string): boolean {
  // 영문/숫자 경계로 둘러싸이지 않은 토큰만 매치 (예: "fe" 는 매치, "cafe" 안의 fe 는 불매치)
  const escaped = token.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

export function classifyRole(role: string, text?: string): RoleRelevance {
  const combined = `${role} ${text ?? ""}`.toLowerCase();

  if (BLACKLIST.some((kw) => combined.includes(kw))) {
    return "irrelevant";
  }
  if (
    STRONG.some((kw) => combined.includes(kw)) ||
    STRONG_TOKENS.some((tok) => hasToken(combined, tok))
  ) {
    return "relevant";
  }
  if (WEAK.some((kw) => combined.includes(kw))) {
    return "review";
  }
  return "irrelevant";
}

/** 이전 이분법 호환. "review" 는 관련으로 취급(저장 대상). */
export function isRelevantRole(role: string, text?: string): boolean {
  return classifyRole(role, text) !== "irrelevant";
}

export function filterRelevantPostings<
  T extends { role: string; rawText?: string }
>(postings: T[], source: string): T[] {
  const filtered = postings.filter(
    (posting) => classifyRole(posting.role, posting.rawText) !== "irrelevant"
  );
  const removed = postings.length - filtered.length;
  if (removed > 0) {
    console.log(`  ℹ ${source}: 직무 필터로 ${removed}건 제외`);
  }
  return filtered;
}
