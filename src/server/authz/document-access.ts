import type { DocumentStatus } from "@prisma/client";
import type { TenantContext } from "./context";
import { can } from "./policy";

export type AccessRuleLike = {
  departmentId: string | null;
  minRank: number | null;
  maxRank: number | null;
  roles: string;
};

export function parseRoles(roles: string): string[] {
  return roles
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

/** 규칙의 모든 조건(부서·직급 범위·역할)을 만족해야 매칭된다. 비어 있는 조건은 제한 없음. */
export function ruleMatches(ctx: Pick<TenantContext, "role" | "departmentId" | "rank">, rule: AccessRuleLike): boolean {
  if (rule.departmentId && rule.departmentId !== ctx.departmentId) return false;
  if (rule.minRank != null && (ctx.rank == null || ctx.rank < rule.minRank)) return false;
  if (rule.maxRank != null && (ctx.rank == null || ctx.rank > rule.maxRank)) return false;
  const roles = parseRoles(rule.roles);
  if (roles.length > 0 && !roles.includes(ctx.role)) return false;
  return true;
}

/**
 * 학습자 관점의 열람 가능 여부: 승인된 문서이면서 접근 규칙 중 하나 이상에 매칭되어야 한다.
 * 규칙이 하나도 없으면 학습자는 볼 수 없다(기본 거부).
 */
export function canLearnerSee(
  ctx: Pick<TenantContext, "role" | "departmentId" | "rank">,
  doc: { status: DocumentStatus },
  rules: AccessRuleLike[],
): boolean {
  return doc.status === "APPROVED" && rules.some((r) => ruleMatches(ctx, r));
}

/** 학습 화면에서 문서를 볼 수 있는지: 관리 권한자는 승인된 모든 문서, 학습자는 규칙 매칭 문서 */
export function canLearn(ctx: TenantContext, doc: { status: DocumentStatus }, rules: AccessRuleLike[]): boolean {
  if (doc.status !== "APPROVED" || !can(ctx, "learning:access")) return false;
  return can(ctx, "document:viewAll") || canLearnerSee(ctx, doc, rules);
}
