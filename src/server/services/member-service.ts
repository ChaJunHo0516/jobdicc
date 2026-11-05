import { tenantDb } from "../tenant-db";
import { authorize } from "../authz/policy";
import type { TenantContext } from "../authz/context";
import { invalid, notFound } from "@/lib/errors";
import { parseInput } from "@/lib/validation/parse";
import { memberUpdateSchema } from "@/lib/validation/org";
import { assertOrgRefs } from "./org-service";
import { writeAudit } from "./audit-service";

export async function listMembers(ctx: TenantContext) {
  authorize(ctx, "member:manage");
  return tenantDb(ctx.companyId).membership.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true } },
      positionLevel: { select: { id: true, name: true, rank: true } },
    },
    orderBy: [{ status: "asc" }, { role: "asc" }, { createdAt: "asc" }],
  });
}

/** 구성원의 역할·상태·부서·직급을 바꾼다. 마지막 활성 관리자는 강등하거나 정지할 수 없다. */
export async function updateMember(ctx: TenantContext, raw: unknown) {
  authorize(ctx, "member:manage");
  const input = parseInput(memberUpdateSchema, raw);
  const db = tenantDb(ctx.companyId);
  const m = await db.membership.findUnique({ where: { id: input.membershipId } });
  if (!m) throw notFound();
  await assertOrgRefs(ctx, input);

  const losesAdmin = m.role === "COMPANY_ADMIN" && m.status === "ACTIVE" && (input.role !== "COMPANY_ADMIN" || input.status !== "ACTIVE");
  if (losesAdmin) {
    const admins = await db.membership.count({ where: { role: "COMPANY_ADMIN", status: "ACTIVE" } });
    if (admins <= 1) throw invalid("마지막 회사 관리자는 강등하거나 정지할 수 없습니다.");
  }

  const updated = await db.membership.update({
    where: { id: m.id },
    data: { role: input.role, status: input.status, departmentId: input.departmentId, positionLevelId: input.positionLevelId },
  });
  await writeAudit({
    companyId: ctx.companyId,
    actorId: ctx.userId,
    action: "member.update",
    targetType: "Membership",
    targetId: m.id,
    metadata: { from: { role: m.role, status: m.status }, to: { role: input.role, status: input.status } },
  });
  return updated;
}
