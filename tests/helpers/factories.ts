import type { MemberRole } from "@prisma/client";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { resolveTenantContext, type TenantContext } from "@/server/authz/context";

let seq = 0;
const next = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;

export const TEST_PASSWORD = "Passw0rd!123";

export async function createUser(opts: { email?: string; name?: string; superAdmin?: boolean } = {}) {
  return prisma.user.create({
    data: {
      email: opts.email ?? `user-${next()}@example.test`,
      name: opts.name ?? "테스트 사용자",
      passwordHash: await hashPassword(TEST_PASSWORD),
      platformRole: opts.superAdmin ? "SUPER_ADMIN" : "USER",
    },
  });
}

/** ACTIVE 상태의 회사와 관리자 계정을 만든다. */
export async function createCompany(name = "테스트회사") {
  const admin = await createUser({ name: `${name} 관리자` });
  const company = await prisma.company.create({
    data: { name, slug: `co-${next()}`, status: "ACTIVE", createdById: admin.id },
  });
  await prisma.membership.create({ data: { companyId: company.id, userId: admin.id, role: "COMPANY_ADMIN" } });
  const adminCtx = await resolveTenantContext(admin.id, company.slug);
  return { company, admin, adminCtx };
}

export async function createDepartment(companyId: string, name = `부서-${next()}`) {
  return prisma.department.create({ data: { companyId, name } });
}

export async function createLevel(companyId: string, rank: number, name = `직급-${next()}`) {
  return prisma.positionLevel.create({ data: { companyId, name, rank } });
}

export async function addMember(
  company: { id: string; slug: string },
  role: MemberRole,
  opts: { departmentId?: string; positionLevelId?: string } = {},
): Promise<{ user: Awaited<ReturnType<typeof createUser>>; ctx: TenantContext }> {
  const user = await createUser({ name: `${role} 사용자` });
  await prisma.membership.create({
    data: { companyId: company.id, userId: user.id, role, departmentId: opts.departmentId, positionLevelId: opts.positionLevelId },
  });
  return { user, ctx: await resolveTenantContext(user.id, company.slug) };
}

/** 서로 독립된 두 회사(A, B)를 만든다. 격리 테스트용. */
export async function twoCompanies() {
  const a = await createCompany("알파테크");
  const b = await createCompany("베타로지스");
  return { a, b };
}
