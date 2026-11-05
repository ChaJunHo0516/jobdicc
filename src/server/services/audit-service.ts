import type { Prisma } from "@prisma/client";
import { prisma } from "../db";

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
