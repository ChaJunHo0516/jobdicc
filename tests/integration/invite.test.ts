import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { createInvite, listInvites, redeemInvite, revokeInvite } from "@/server/services/invite-service";
import { resolveTenantContext } from "@/server/authz/context";
import { addMember, createDepartment, createLevel, createUser, twoCompanies } from "../helpers/factories";
import { resetDb } from "../helpers/test-db";

describe("합격자 초대 코드", () => {
  beforeEach(resetDb);

  it("발급 → 등록하면 지정한 역할·부서·직급의 구성원이 된다", async () => {
    const { a } = await twoCompanies();
    const dept = await createDepartment(a.company.id, "개발팀");
    const lvl = await createLevel(a.company.id, 1, "사원");
    const hire = await createUser({ email: "newbie@example.test" });
    const { code } = await createInvite(a.adminCtx, {
      email: "NEWBIE@example.test",
      role: "PRE_HIRE",
      departmentId: dept.id,
      positionLevelId: lvl.id,
    });
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);

    await redeemInvite(hire, code.toLowerCase());
    const ctx = await resolveTenantContext(hire.id, a.company.slug);
    expect(ctx).toMatchObject({ role: "PRE_HIRE", departmentId: dept.id, rank: 1 });
  });

  it("코드 원문은 DB 에 저장하지 않는다", async () => {
    const { a } = await twoCompanies();
    const { code } = await createInvite(a.adminCtx, { email: "x@example.test", role: "PRE_HIRE" });
    const row = await prisma.hireInvite.findFirstOrThrow();
    expect(JSON.stringify(row)).not.toContain(code);
  });

  it("한 번 사용한 코드는 다시 쓸 수 없다", async () => {
    const { a } = await twoCompanies();
    const hire = await createUser({ email: "h@example.test" });
    const { code } = await createInvite(a.adminCtx, { email: "h@example.test", role: "PRE_HIRE" });
    await redeemInvite(hire, code);
    await prisma.membership.updateMany({ where: { userId: hire.id }, data: { status: "REVOKED" } });
    await expect(redeemInvite(hire, code)).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("다른 이메일 계정으로는 등록할 수 없다", async () => {
    const { a } = await twoCompanies();
    const thief = await createUser({ email: "thief@example.test" });
    const { code } = await createInvite(a.adminCtx, { email: "victim@example.test", role: "EMPLOYEE" });
    await expect(redeemInvite(thief, code)).rejects.toMatchObject({ code: "VALIDATION" });
    expect(await prisma.membership.count({ where: { userId: thief.id } })).toBe(0);
  });

  it("만료·취소된 코드와 존재하지 않는 코드는 같은 오류로 거부한다", async () => {
    const { a } = await twoCompanies();
    const hire = await createUser({ email: "h@example.test" });
    const expired = await createInvite(a.adminCtx, { email: "h@example.test", role: "PRE_HIRE" });
    await prisma.hireInvite.update({ where: { id: expired.invite.id }, data: { expiresAt: new Date(Date.now() - 1) } });
    const revoked = await createInvite(a.adminCtx, { email: "h@example.test", role: "PRE_HIRE" });
    await revokeInvite(a.adminCtx, revoked.invite.id);

    const msgs = await Promise.all(
      [expired.code, revoked.code, "AAAA-BBBB-CCCC"].map((c) => redeemInvite(hire, c).catch((e) => e.message)),
    );
    expect(new Set(msgs).size).toBe(1);
  });

  it("관리자만 초대를 발급할 수 있고, 관리자 역할로는 초대할 수 없다", async () => {
    const { a } = await twoCompanies();
    const trainer = await addMember(a.company, "TRAINER");
    await expect(createInvite(trainer.ctx, { email: "x@example.test", role: "PRE_HIRE" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(createInvite(a.adminCtx, { email: "x@example.test", role: "COMPANY_ADMIN" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("다른 회사의 부서로 초대하거나 다른 회사 초대를 취소·조회할 수 없다", async () => {
    const { a, b } = await twoCompanies();
    const bDept = await createDepartment(b.company.id);
    await expect(
      createInvite(a.adminCtx, { email: "x@example.test", role: "PRE_HIRE", departmentId: bDept.id }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    const bInvite = await createInvite(b.adminCtx, { email: "y@example.test", role: "PRE_HIRE" });
    await expect(revokeInvite(a.adminCtx, bInvite.invite.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await listInvites(a.adminCtx)).toHaveLength(0);
  });

  it("정지된 회사의 코드는 등록할 수 없다", async () => {
    const { a } = await twoCompanies();
    const hire = await createUser({ email: "h@example.test" });
    const { code } = await createInvite(a.adminCtx, { email: "h@example.test", role: "PRE_HIRE" });
    await prisma.company.update({ where: { id: a.company.id }, data: { status: "SUSPENDED" } });
    await expect(redeemInvite(hire, code)).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("코드 대입 공격은 사용자당 15분 10회로 제한한다", async () => {
    const hire = await createUser({ email: "h@example.test" });
    for (let i = 0; i < 10; i++) await redeemInvite(hire, `AAAA-BBBB-CC${i}C`).catch(() => {});
    await expect(redeemInvite(hire, "AAAA-BBBB-CCCC")).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});
