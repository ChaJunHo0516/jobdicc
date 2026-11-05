import { beforeEach, describe, expect, it } from "vitest";
import { tenantDb, TenantIsolationError } from "@/server/tenant-db";
import { resolveTenantContext } from "@/server/authz/context";
import { prisma } from "@/server/db";
import { addMember, createDepartment, createUser, twoCompanies } from "../helpers/factories";
import { resetDb } from "../helpers/test-db";

describe("tenantDb — 회사 간 데이터 격리", () => {
  beforeEach(resetDb);

  it("조회 결과에는 자기 회사 데이터만 포함된다", async () => {
    const { a, b } = await twoCompanies();
    await createDepartment(a.company.id, "A-개발팀");
    await createDepartment(b.company.id, "B-물류팀");
    const rows = await tenantDb(a.company.id).department.findMany();
    expect(rows.map((r) => r.name)).toEqual(["A-개발팀"]);
  });

  it("다른 회사 리소스 ID 로 findUnique/update/delete 해도 영향이 없다", async () => {
    const { a, b } = await twoCompanies();
    const bDept = await createDepartment(b.company.id, "B-물류팀");
    const db = tenantDb(a.company.id);
    expect(await db.department.findUnique({ where: { id: bDept.id } })).toBeNull();
    await expect(db.department.update({ where: { id: bDept.id }, data: { name: "탈취" } })).rejects.toThrow();
    await expect(db.department.delete({ where: { id: bDept.id } })).rejects.toThrow();
    expect((await db.department.updateMany({ data: { name: "x" }, where: { id: bDept.id } })).count).toBe(0);
    expect((await prisma.department.findUniqueOrThrow({ where: { id: bDept.id } })).name).toBe("B-물류팀");
  });

  it("where 에 다른 회사 companyId 를 넣으면 예외가 발생한다", async () => {
    const { a, b } = await twoCompanies();
    await expect(tenantDb(a.company.id).department.findMany({ where: { companyId: b.company.id } })).rejects.toThrow(
      TenantIsolationError,
    );
  });

  it("생성 시 companyId 를 자동 설정하고, 다른 회사 ID 는 거부한다", async () => {
    const { a, b } = await twoCompanies();
    const db = tenantDb(a.company.id);
    const d = await db.department.create({ data: { name: "자동설정" } as never });
    expect(d.companyId).toBe(a.company.id);
    await expect(db.department.create({ data: { name: "위조", companyId: b.company.id } })).rejects.toThrow(
      TenantIsolationError,
    );
  });

  it("companyId 변경 시도를 거부한다", async () => {
    const { a, b } = await twoCompanies();
    const d = await createDepartment(a.company.id);
    await expect(
      tenantDb(a.company.id).department.update({ where: { id: d.id }, data: { companyId: b.company.id } }),
    ).rejects.toThrow(TenantIsolationError);
  });

  it("트랜잭션 안에서도 격리가 유지된다", async () => {
    const { a, b } = await twoCompanies();
    await createDepartment(b.company.id, "B-물류팀");
    const names = await tenantDb(a.company.id).$transaction(async (tx) =>
      (await tx.department.findMany()).map((d) => d.name),
    );
    expect(names).not.toContain("B-물류팀");
  });

  it("빈 companyId 로는 클라이언트를 만들 수 없다", () => {
    expect(() => tenantDb("")).toThrow(TenantIsolationError);
  });
});

describe("resolveTenantContext — 회사 공간 접근", () => {
  beforeEach(resetDb);

  it("소속 구성원은 컨텍스트를 얻는다", async () => {
    const { a } = await twoCompanies();
    expect(a.adminCtx.companyId).toBe(a.company.id);
    expect(a.adminCtx.role).toBe("COMPANY_ADMIN");
  });

  it("다른 회사 구성원은 404 를 받는다", async () => {
    const { a, b } = await twoCompanies();
    await expect(resolveTenantContext(b.admin.id, a.company.slug)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("존재하지 않는 회사도 같은 404 를 받는다(존재 여부 비노출)", async () => {
    const u = await createUser();
    await expect(resolveTenantContext(u.id, "no-such-company")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("정지된 구성원은 접근할 수 없다", async () => {
    const { a } = await twoCompanies();
    const { user } = await addMember(a.company, "EMPLOYEE");
    await prisma.membership.updateMany({ where: { userId: user.id }, data: { status: "SUSPENDED" } });
    await expect(resolveTenantContext(user.id, a.company.slug)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("정지된 회사는 관리자도 접근할 수 없다", async () => {
    const { a } = await twoCompanies();
    await prisma.company.update({ where: { id: a.company.id }, data: { status: "SUSPENDED" } });
    await expect(resolveTenantContext(a.admin.id, a.company.slug)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("플랫폼 관리자도 소속이 없으면 회사 공간에 접근할 수 없다", async () => {
    const { a } = await twoCompanies();
    const sa = await createUser({ superAdmin: true });
    await expect(resolveTenantContext(sa.id, a.company.slug)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
