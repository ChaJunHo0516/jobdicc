import { prisma } from "../db";
import { tenantDb } from "../tenant-db";
import { authorize } from "../authz/policy";
import type { TenantContext } from "../authz/context";
import type { SessionUser } from "../auth/session";
import { checkRateLimit } from "../auth/rate-limit";
import { hashToken, normalizeInviteCode, randomInviteCode } from "../auth/tokens";
import { conflict, invalid, notFound, rateLimited } from "@/lib/errors";
import { parseInput } from "@/lib/validation/parse";
import { inviteSchema } from "@/lib/validation/org";
import { assertOrgRefs } from "./org-service";
import { writeAudit } from "./audit-service";

const DAY = 24 * 60 * 60 * 1000;

/**
 * 합격자·직원 초대 코드를 발급한다. 코드 원문은 반환값으로 한 번만 전달되고 DB 에는 해시만 저장된다.
 */
export async function createInvite(ctx: TenantContext, raw: unknown) {
  authorize(ctx, "invite:manage");
  const input = parseInput(inviteSchema, raw);
  await assertOrgRefs(ctx, input);
  const db = tenantDb(ctx.companyId);

  if (input.applicationId) {
    const app = await db.jobApplication.findUnique({
      where: { id: input.applicationId },
      include: { applicant: { select: { email: true } } },
    });
    if (!app) throw invalid("존재하지 않는 지원서입니다.");
    if (app.status !== "OFFERED") throw invalid("합격 처리된 지원서에만 초대 코드를 발급할 수 있습니다.");
    if (app.applicant.email !== input.email) throw invalid("지원자 이메일과 초대 이메일이 다릅니다.");
  }

  const code = randomInviteCode();
  const invite = await db.hireInvite.create({
    data: {
      companyId: ctx.companyId,
      email: input.email,
      codeHash: hashToken(normalizeInviteCode(code)),
      role: input.role,
      departmentId: input.departmentId,
      positionLevelId: input.positionLevelId,
      applicationId: input.applicationId,
      expiresAt: new Date(Date.now() + input.expiresInDays * DAY),
      createdById: ctx.userId,
    },
  });
  await writeAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "invite.create", targetType: "HireInvite", targetId: invite.id, metadata: { email: input.email, role: input.role } });
  return { invite, code };
}

export async function listInvites(ctx: TenantContext) {
  authorize(ctx, "invite:manage");
  return tenantDb(ctx.companyId).hireInvite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, email: true, role: true, expiresAt: true, usedAt: true, revokedAt: true, createdAt: true, applicationId: true,
      department: { select: { name: true } },
      positionLevel: { select: { name: true } },
    },
  });
}

export async function revokeInvite(ctx: TenantContext, inviteId: string) {
  authorize(ctx, "invite:manage");
  const db = tenantDb(ctx.companyId);
  const r = await db.hireInvite.updateMany({ where: { id: inviteId, usedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
  if (r.count === 0) throw notFound("취소할 수 있는 초대가 없습니다.");
  await writeAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "invite.revoke", targetType: "HireInvite", targetId: inviteId });
}

const REDEEM_FAIL = "유효하지 않거나 만료된 초대 코드입니다.";

/**
 * 초대 코드를 등록해 회사 구성원이 된다.
 * 코드 자체가 자격 증명이므로 회사 컨텍스트 없이 조회하되, 이메일 일치·1회용·만료·취소 여부를 모두 확인한다.
 */
export async function redeemInvite(user: SessionUser, rawCode: unknown) {
  if (typeof rawCode !== "string" || rawCode.length > 40) throw invalid(REDEEM_FAIL);
  if (!checkRateLimit(`invite:${user.id}`, 10, 15 * 60 * 1000)) throw rateLimited();

  const invite = await prisma.hireInvite.findUnique({
    where: { codeHash: hashToken(normalizeInviteCode(rawCode)) },
    include: { company: { select: { status: true, name: true, slug: true } } },
  });
  // 실패 사유를 구분하지 않아 코드 존재 여부를 노출하지 않는다(이메일 불일치만 별도 안내).
  if (!invite || invite.usedAt || invite.revokedAt || invite.expiresAt.getTime() <= Date.now() || invite.company.status !== "ACTIVE") {
    throw invalid(REDEEM_FAIL);
  }
  if (invite.email !== user.email.toLowerCase()) {
    throw invalid("초대받은 이메일 계정으로 로그인해야 등록할 수 있습니다.");
  }

  return prisma.$transaction(async (tx) => {
    // 동시 등록 경쟁 상태를 막기 위해 조건부 업데이트로 1회용을 보장한다.
    const claimed = await tx.hireInvite.updateMany({
      where: { id: invite.id, usedAt: null, revokedAt: null },
      data: { usedAt: new Date(), usedById: user.id },
    });
    if (claimed.count !== 1) throw invalid(REDEEM_FAIL);

    const existing = await tx.membership.findUnique({ where: { companyId_userId: { companyId: invite.companyId, userId: user.id } } });
    if (existing?.status === "ACTIVE") throw conflict("이미 이 회사의 구성원입니다.");

    const data = {
      role: invite.role,
      status: "ACTIVE" as const,
      departmentId: invite.departmentId,
      positionLevelId: invite.positionLevelId,
    };
    const membership = existing
      ? await tx.membership.update({ where: { id: existing.id }, data })
      : await tx.membership.create({ data: { ...data, companyId: invite.companyId, userId: user.id } });

    await writeAudit({ companyId: invite.companyId, actorId: user.id, action: "invite.redeem", targetType: "HireInvite", targetId: invite.id }, tx);
    return { membership, company: invite.company };
  });
}
