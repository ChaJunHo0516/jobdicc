type Tone = "gray" | "green" | "yellow" | "red" | "blue";

export const COMPANY_STATUS: Record<string, [string, Tone]> = {
  PENDING: ["승인 대기", "yellow"],
  ACTIVE: ["운영 중", "green"],
  SUSPENDED: ["정지", "red"],
  REJECTED: ["반려", "red"],
};

export const MEMBER_ROLE: Record<string, string> = {
  COMPANY_ADMIN: "회사 관리자",
  TRAINER: "교육담당자",
  EMPLOYEE: "직원",
  PRE_HIRE: "합격자(입사 예정)",
};

export const MEMBER_STATUS: Record<string, [string, Tone]> = {
  ACTIVE: ["활성", "green"],
  SUSPENDED: ["정지", "red"],
  REVOKED: ["해지", "gray"],
};

export const DOCUMENT_STATUS: Record<string, [string, Tone]> = {
  PENDING_APPROVAL: ["승인 대기", "yellow"],
  APPROVED: ["승인됨", "green"],
  REJECTED: ["반려", "red"],
  ARCHIVED: ["보관", "gray"],
};

export const REVIEW_STATUS: Record<string, [string, Tone]> = {
  PENDING_REVIEW: ["AI 생성 · 검토 대기", "yellow"],
  APPROVED: ["AI 생성 · 검토 승인", "green"],
  REJECTED: ["AI 생성 · 반려", "red"],
};

export const JOB_STATUS: Record<string, [string, Tone]> = {
  DRAFT: ["작성 중", "gray"],
  OPEN: ["모집 중", "green"],
  CLOSED: ["마감", "red"],
};

export const APPLICATION_STATUS: Record<string, [string, Tone]> = {
  SUBMITTED: ["지원 완료", "blue"],
  REVIEWING: ["서류 검토", "yellow"],
  INTERVIEW: ["면접", "yellow"],
  OFFERED: ["합격", "green"],
  REJECTED: ["불합격", "red"],
  WITHDRAWN: ["지원 철회", "gray"],
};
