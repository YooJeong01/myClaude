/**
 * 채용공고 직무 관련성 필터 (프론트엔드 / 웹 개발 / 퍼블리싱 / 풀스택 범위).
 *
 * 3단계 분류:
 *  - "relevant"   — 강한 신호(프론트엔드·React·퍼블리셔 등). 저장.
 *  - "review"     — 약한 신호(개발자·엔지니어·웹 단독 등). 관련 가능성이 있어 저장하되 사용자 확인 대상.
 *  - "irrelevant" — 블랙리스트(영업·생산·간호 등) 또는 아무 신호 없음. 버림.
 *
 * 판정 순서: 확정 프론트엔드 신호 → 블랙리스트 → 강한 신호 → 약한 신호 → 없음.
 * "확정 프론트엔드"(프론트엔드·퍼블리셔·React·풀스택 등)는 블랙리스트보다 먼저 봐서
 * "풀스택(프론트+백엔드)" 같은 공고가 '백엔드' 때문에 탈락하지 않게 한다.
 * 백엔드·모바일·인프라·게임 등 다른 개발 직군은 블랙리스트에 넣는다(사용자 범위: 프론트엔드/웹/퍼블리싱).
 * AI·데이터 계열은 블랙리스트에 넣지 않아 "review" 로 남는다(사용자가 관심 있음).
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
  "주니어 개발",
  // AI·데이터 계열 (사용자가 관심 → review 로 남김)
  "ai 엔지니어",
  "ai엔지니어",
  "ai 개발",
  "ml 엔지니어",
  "머신러닝",
  "딥러닝",
  "데이터 엔지니어",
  "데이터엔지니어",
  "data engineer",
  "데이터 분석",
  "data analyst",
  "분석가",
  "생성형 ai",
  "generative ai",
  "llm",
  "ax 엔지니어",
  "추천 모델",
  "추천모델"
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
  "데이터 라벨링",
  "인공지능 학습 데이터"
  // 데이터 분석/머신러닝/AI 엔지니어는 블랙리스트에서 뺌 — 사용자가 AI·데이터 계열은 "review" 로 보고 싶어함.
];

/** 확정 프론트엔드 신호 — 블랙리스트보다 먼저 검사. 전부 소문자. */
const STRONG_FRONTEND = [
  "프론트엔드",
  "프론트 엔드",
  "프론트엔트",
  "프론트 개발",
  "프론트개발",
  "front-end",
  "front end",
  "frontend",
  "웹 퍼블리",
  "웹퍼블리",
  "퍼블리셔",
  "퍼블리싱",
  "마크업",
  "markup",
  "리액트",
  "react",
  "reactjs",
  "react.js",
  "vue",
  "vuejs",
  "vue.js",
  "nuxt",
  "svelte",
  "풀스택",
  "풀 스택",
  "fullstack",
  "full-stack",
  "full stack",
  "웹 개발",
  "웹개발",
  "웹 프로그래",
  "웹프로그래"
];

/** 사용자 범위(프론트엔드/웹/퍼블리싱) 밖의 다른 개발 직군 — 블랙리스트. */
const OTHER_DEV_BLACKLIST = [
  "백엔드",
  "back-end",
  "back end",
  "backend",
  "서버 개발",
  "서버개발",
  "서버 엔지니어",
  "devops",
  "데브옵스",
  "인프라 엔지니어",
  "인프라 운영",
  "infra engineer",
  "sre",
  "site reliability",
  "kubernetes",
  "k8s",
  "cloud 운영",
  "클라우드 운영",
  "시스템 운영",
  "시스템 개발·운영",
  "시스템 개발/운영",
  "네트워크 엔지니어",
  "보안 엔지니어",
  "안드로이드",
  "android",
  "ios 개발",
  "ios 엔지니어",
  "flutter",
  "react native",
  "모바일 앱",
  "모바일앱",
  "앱 개발자",
  "임베디드",
  "펌웨어",
  "게임 클라이언트",
  "게임 서버",
  "게임 개발",
  "unity",
  "unreal",
  "언리얼",
  "erp",
  "sap ",
  "그룹웨어"
];

function hasToken(text: string, token: string): boolean {
  // 영문/숫자 경계로 둘러싸이지 않은 토큰만 매치 (예: "fe" 는 매치, "cafe" 안의 fe 는 불매치)
  const escaped = token.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

export function classifyRole(role: string, text?: string): RoleRelevance {
  const combined = `${role} ${text ?? ""}`.toLowerCase();

  // 1. 명백히 다른 직군(영업·생산·상담·간호…) — 무엇보다 우선
  if (BLACKLIST.some((kw) => combined.includes(kw))) {
    return "irrelevant";
  }
  // 2. 확정 프론트엔드 신호 — 다른 개발 직군(3번)보다 우선
  //    ("풀스택(프론트+백엔드)" 같은 공고가 '백엔드' 때문에 탈락하지 않도록)
  if (STRONG_FRONTEND.some((kw) => combined.includes(kw))) {
    return "relevant";
  }
  // 3. 프론트엔드가 아닌 다른 개발 직군(백엔드·모바일·인프라·게임·ERP) — 사용자 범위 밖
  if (OTHER_DEV_BLACKLIST.some((kw) => combined.includes(kw))) {
    return "irrelevant";
  }
  // 4. 나머지 강한 신호 (TypeScript·JavaScript·웹 서비스 개발 등)
  if (
    STRONG.some((kw) => combined.includes(kw)) ||
    STRONG_TOKENS.some((tok) => hasToken(combined, tok))
  ) {
    return "relevant";
  }
  // 5. 약한 신호 → 확인 필요
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
