export type SavedPosting = {
  id: string;
  userId: string;
  jobPostingId: string;
  createdAt: string;
};

export type SavedPostingJobPosting = {
  id: string;
  companyNameRaw: string | null;
  role: string;
  employmentType: "정규직" | "계약직" | "인턴" | "파견" | "프리랜서" | "기타";
  postedAt: string | null;
  deadline: string | null;
  source: string;
  url: string | null;
  rawText: string | null;
  createdAt: string;
};

export type SavedPostingWithDetail = SavedPosting & {
  posting: SavedPostingJobPosting;
};
