import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { conflict, forbidden, invalid, notFound } from "@/lib/errors";
import { companyRequestSchema, RESERVED_SLUGS } from "@/lib/validation/company";
import { parseInput } from "@/lib/validation/parse";
import { writeAudit } from "./audit-service";
import type { SessionUser } from "../auth/session";

/** 회사 개설 신청: PENDING 회사 + 신청자 COMPANY_ADMIN 소속을 만든다. 승인 전에는 회사 공간이 열리지 않는다. */
export async function requestCompany(userId: string, raw: unknown) {
  const input = parseInput(companyRequestSchema, raw);
  if (RESERVED_SLUGS.has(input.slug)) throw invalid("사용할 수 없는 주소입니다.");
  const pending = await prisma.company.count({ where: { createdById: userId, status: "PENDING" } });
  if (pending >= 3) throw invalid("승인 대기 중인 신청이 너무 많습니다.");
  try {
    return await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: input.name, slug: input.slug, description: input.description, createdById: userId },
      });
      await tx.membership.create({ data: { companyId: company.id, userId, role: "COMPANY_ADMIN" } });
      await writeAudit({ companyId: company.id, actorId: userId, action: "company.request", targetType: "Company", targetId: company.id }, tx);
      return company;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw conflict("이미 사용 중인 주소입니다.");
    throw e;
  }
}

function requireSuperAdmin(user: Pick<SessionUser, "platformRole">) {
  if (user.platformRole !== "SUPER_ADMIN") throw forbidden();
}

/** 플랫폼 관리자용: 회사 목록. 회사 내부 데이터는 포함하지 않는다. */
export async function listCompaniesForPlatform(user: SessionUser) {
  requireSuperAdmin(user);
  return prisma.company.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true, name: true, slug: true, description: true, status: true, createdAt: true,
      createdBy: { select: { name: true, email: true } },
    },
  });
}

export async function setCompanyStatus(user: SessionUser, companyId: string, status: "ACTIVE" | "REJECTED" | "SUSPENDED") {
  requireSuperAdmin(user);
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw notFound();
  const allowed: Record<string, string[]> = {
    PENDING: ["ACTIVE", "REJECTED"],
    ACTIVE: ["SUSPENDED"],
    SUSPENDED: ["ACTIVE"],
    REJECTED: [],
  };
  if (!allowed[company.status].includes(status)) throw invalid("허용되지 않는 상태 변경입니다.");
  await prisma.company.update({ where: { id: companyId }, data: { status } });
  await writeAudit({ companyId, actorId: user.id, action: `company.${status.toLowerCase()}`, targetType: "Company", targetId: companyId });
}

/** 사용자가 속한 회사 목록(대기 중 신청 포함). */
export async function listMyCompanies(userId: string) {
  const ms = await prisma.membership.findMany({
    where: { userId, status: "ACTIVE" },
    include: { company: { select: { id: true, name: true, slug: true, status: true } }, department: true, positionLevel: true },
    orderBy: { createdAt: "asc" },
  });
  return ms.map((m) => ({
    company: m.company,
    role: m.role,
    department: m.department?.name ?? null,
    positionLevel: m.positionLevel?.name ?? null,
  }));
}
