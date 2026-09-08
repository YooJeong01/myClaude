export type Experience = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type NewExperienceInput = {
  title: string;
  body: string;
};

export const EXPERIENCE_TITLE_MAX_LENGTH = 120;
export const EXPERIENCE_BODY_MAX_LENGTH = 4000;

export function validateExperienceInput(
  input: NewExperienceInput
): string | null {
  if (!input.title.trim()) {
    return "경험 제목을 입력하세요.";
  }
  if (input.title.trim().length > EXPERIENCE_TITLE_MAX_LENGTH) {
    return `경험 제목은 ${EXPERIENCE_TITLE_MAX_LENGTH}자 이하로 입력하세요.`;
  }
  if (!input.body.trim()) {
    return "경험 내용을 입력하세요.";
  }
  if (input.body.trim().length > EXPERIENCE_BODY_MAX_LENGTH) {
    return `경험 내용은 ${EXPERIENCE_BODY_MAX_LENGTH}자 이하로 입력하세요.`;
  }
  return null;
}
