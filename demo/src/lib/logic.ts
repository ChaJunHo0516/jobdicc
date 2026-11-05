import type { Job, Persona, QuizQuestion, Role, TrainingDoc } from "../data/types";

/** 백엔드 src/server/authz/policy.ts 와 같은 역할별 권한(데모용 사본) */
export type Permission =
  | "learning"
  | "document:manage"
  | "ai:review"
  | "progress:all"
  | "member:manage"
  | "invite:manage"
  | "job:manage";

const PERMS: Record<Role, Permission[]> = {
  APPLICANT: [],
  PRE_HIRE: ["learning"],
  EMPLOYEE: ["learning"],
  TRAINER: ["learning", "document:manage", "ai:review", "progress:all"],
  COMPANY_ADMIN: ["learning", "document:manage", "ai:review", "progress:all", "member:manage", "invite:manage", "job:manage"],
};

export function can(p: Persona | null, perm: Permission): boolean {
  return !!p && PERMS[p.role].includes(perm);
}

export const ROLE_LABEL: Record<Role, string> = {
  APPLICANT: "지원자(개인회원)",
  PRE_HIRE: "합격자(입사 예정)",
  EMPLOYEE: "직원",
  TRAINER: "교육담당자",
  COMPANY_ADMIN: "회사 관리자",
};

/** 회사 공간 접근: 같은 회사 소속만 가능(회사 간 격리) */
export function isMemberOf(p: Persona | null, companyId: string): boolean {
  return !!p && p.role !== "APPLICANT" && p.companyId === companyId;
}

/**
 * 학습자가 문서를 볼 수 있는지: 같은 회사 + 승인됨 + 접근 규칙(부서·최소 직급·역할) 충족.
 * 교육담당자·관리자는 회사의 승인된 문서를 모두 볼 수 있다.
 */
export function canSeeDoc(p: Persona | null, doc: TrainingDoc): boolean {
  if (!p || !isMemberOf(p, doc.companyId) || doc.status !== "APPROVED") return false;
  if (can(p, "document:manage")) return true;
  const { departmentIds, minRank, roles } = doc.access;
  if (departmentIds.length > 0 && (!p.departmentId || !departmentIds.includes(p.departmentId))) return false;
  if (minRank != null && (p.rank == null || p.rank < minRank)) return false;
  if (roles.length > 0 && !roles.includes(p.role)) return false;
  return true;
}

/** 승인 전 AI 결과는 학습자에게 보이지 않는다 */
export function visibleSummary(doc: TrainingDoc) {
  return doc.ai && doc.ai.summaryStatus === "APPROVED" ? doc.ai : null;
}

export function visibleQuiz(doc: TrainingDoc): QuizQuestion[] {
  return doc.ai && doc.ai.quizStatus === "APPROVED" ? doc.ai.quiz : [];
}

export function scoreQuiz(questions: QuizQuestion[], answers: (number | null)[]) {
  const correct = questions.filter((q, i) => answers[i] === q.answerIndex).length;
  const score = questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100);
  return { correct, total: questions.length, score, passed: score >= 70 };
}

/** 마감일이 지났거나 수동 마감된 공고는 지원할 수 없다 */
export function isJobOpen(job: Job, today = new Date()): boolean {
  if (job.status !== "OPEN") return false;
  return new Date(`${job.closeAt}T23:59:59+09:00`).getTime() >= today.getTime();
}
