import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { tenantDb } from "../tenant-db";
import { authorize } from "../authz/policy";
import type { TenantContext } from "../authz/context";

/** 회사 감사 로그(최근 200건). 행위자 이름을 함께 반환한다. */
export async function listAuditLogs(ctx: TenantContext) {
  authorize(ctx, "audit:view");
  const logs = await tenantDb(ctx.companyId).auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const actors = await prisma.user.findMany({
    where: { id: { in: [...new Set(logs.map((l) => l.actorId))] } },
    select: { id: true, name: true },
  });
  const names = new Map(actors.map((a) => [a.id, a.name]));
  return logs.map((l) => ({ ...l, actorName: names.get(l.actorId) ?? "알 수 없음" }));
}

type AuditInput = {
  companyId: string | null;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
};

/** 감사 로그를 남긴다. 트랜잭션 안에서 호출하려면 tx 를 넘긴다. */
export async function writeAudit(input: AuditInput, tx: Prisma.TransactionClient = prisma) {
  await tx.auditLog.create({
    data: {
      companyId: input.companyId,
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}
