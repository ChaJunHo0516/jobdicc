import type { MemberRole } from "@prisma/client";
import { forbidden } from "@/lib/errors";

/** 회사 내부에서 수행할 수 있는 행위 목록 */
export const ACTIONS = [
  "org:manage", // 부서·직급 관리
  "member:manage", // 구성원 역할·상태 변경
  "invite:manage", // 합격자/직원 초대 발급·취소
  "document:upload",
  "document:review", // 문서 승인·반려, 접근 규칙 설정
  "document:viewAll", // 승인 전 문서 포함 모든 문서 열람(검토용)
  "ai:generate",
  "ai:review", // AI 결과 승인·반려
  "learning:access", // 승인된 학습자료 열람·퀴즈 응시
  "progress:viewAll", // 회사 전체 학습 진도 조회
  "job:manage",
  "application:manage",
  "audit:view",
] as const;

export type Action = (typeof ACTIONS)[number];

const TRAINER_ACTIONS: Action[] = [
  "document:upload",
  "document:review",
  "document:viewAll",
  "ai:generate",
  "ai:review",
  "learning:access",
  "progress:viewAll",
];

export const ROLE_PERMISSIONS: Record<MemberRole, ReadonlySet<Action>> = {
  COMPANY_ADMIN: new Set(ACTIONS),
  TRAINER: new Set(TRAINER_ACTIONS),
  EMPLOYEE: new Set<Action>(["learning:access"]),
  PRE_HIRE: new Set<Action>(["learning:access"]),
};

export function can(ctx: { role: MemberRole }, action: Action): boolean {
  return ROLE_PERMISSIONS[ctx.role]?.has(action) ?? false;
}

export function authorize(ctx: { role: MemberRole }, action: Action): void {
  if (!can(ctx, action)) throw forbidden();
}

export const ROLE_LABEL: Record<MemberRole, string> = {
  COMPANY_ADMIN: "회사 관리자",
  TRAINER: "교육담당자",
  EMPLOYEE: "직원",
  PRE_HIRE: "합격자(입사 예정)",
};
