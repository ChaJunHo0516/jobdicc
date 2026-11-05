import type { MemberRole } from "@prisma/client";
import { prisma } from "../db";
import { notFound } from "@/lib/errors";

/** 회사 내부 요청에 필요한 서버 검증 완료 컨텍스트. 클라이언트 입력으로 만들지 않는다. */
export type TenantContext = {
  userId: string;
  companyId: string;
  companySlug: string;
  companyName: string;
  membershipId: string;
  role: MemberRole;
  departmentId: string | null;
  rank: number | null;
};

/**
 * 사용자와 회사 slug 로 컨텍스트를 만든다.
 * 회사가 비활성이거나 소속이 아니면 존재 여부를 숨기기 위해 NOT_FOUND 를 던진다.
 */
export async function resolveTenantContext(userId: string, companySlug: string): Promise<TenantContext> {
  const company = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!company || company.status !== "ACTIVE") throw notFound();
  const m = await prisma.membership.findUnique({
    where: { companyId_userId: { companyId: company.id, userId } },
    include: { positionLevel: { select: { rank: true } } },
  });
  if (!m || m.status !== "ACTIVE") throw notFound();
  return {
    userId,
    companyId: company.id,
    companySlug: company.slug,
    companyName: company.name,
    membershipId: m.id,
    role: m.role,
    departmentId: m.departmentId,
    rank: m.positionLevel?.rank ?? null,
  };
}
