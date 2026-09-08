const WHITELIST = [
  "프론트엔드",
  "프론트 엔드",
  "front-end",
  "frontend",
  "웹 개발",
  "웹개발",
  "web developer",
  "퍼블리셔",
  "퍼블리싱",
  "ui 개발",
  "리액트",
  "react",
  "next.js",
  "vue",
  "풀스택",
  "fullstack",
  "full-stack"
];

const BLACKLIST = [
  "영업",
  "마케팅",
  "회계",
  "세무",
  "인사",
  "총무",
  "생산",
  "제조",
  "설비",
  "기계",
  "전기",
  "전자제어",
  "화학",
  "건축",
  "토목",
  "간호",
  "약사",
  "물류",
  "운송",
  "배송",
  "상담",
  "고객센터",
  "cs",
  "md",
  "구매",
  "안전관리",
  "품질관리",
  "연구원"
];

export function isRelevantRole(role: string, title?: string): boolean {
  const text = `${role} ${title ?? ""}`.toLowerCase();
  if (BLACKLIST.some((keyword) => text.includes(keyword.toLowerCase()))) {
    return false;
  }
  return WHITELIST.some((keyword) => text.includes(keyword.toLowerCase()));
}

export function filterRelevantPostings<T extends { role: string; rawText?: string }>(
  postings: T[],
  source: string
): T[] {
  const filtered = postings.filter((posting) =>
    isRelevantRole(posting.role, posting.rawText)
  );
  const removed = postings.length - filtered.length;
  if (removed > 0) {
    console.log(`  ℹ ${source}: 직무 필터로 ${removed}건 제외`);
  }
  return filtered;
}
