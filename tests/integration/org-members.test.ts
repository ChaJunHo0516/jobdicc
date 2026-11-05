import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { createDepartment, createPositionLevel, deleteDepartment, listDepartments } from "@/server/services/org-service";
import { listMembers, updateMember } from "@/server/services/member-service";
import { listAuditLogs } from "@/server/services/audit-service";
import { addMember, createDepartment as makeDept, twoCompanies } from "../helpers/factories";
import { resetDb } from "../helpers/test-db";

describe("부서·직급 관리", () => {
  beforeEach(resetDb);

  it("관리자는 부서·직급을 만들고, 중복 이름은 거부된다", async () => {
    const { a } = await twoCompanies();
    await createDepartment(a.adminCtx, { name: "개발팀" });
    await expect(createDepartment(a.adminCtx, { name: "개발팀" })).rejects.toMatchObject({ code: "CONFLICT" });
    const lvl = await createPositionLevel(a.adminCtx, { name: "사원", rank: "1" });
    expect(lvl?.rank).toBe(1);
  });

  it("같은 이름의 부서도 회사가 다르면 각자 만들 수 있다", async () => {
    const { a, b } = await twoCompanies();
    await createDepartment(a.adminCtx, { name: "인사팀" });
    await createDepartment(b.adminCtx, { name: "인사팀" });
    expect(await listDepartments(a.adminCtx)).toHaveLength(1);
  });

  it("교육담당자·직원은 조직을 관리할 수 없다", async () => {
    const { a } = await twoCompanies();
    const trainer = await addMember(a.company, "TRAINER");
    const emp = await addMember(a.company, "EMPLOYEE");
    await expect(createDepartment(trainer.ctx, { name: "x" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(createDepartment(emp.ctx, { name: "x" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("다른 회사 부서는 삭제할 수 없다(404)", async () => {
    const { a, b } = await twoCompanies();
    const bDept = await makeDept(b.company.id);
    await expect(deleteDepartment(a.adminCtx, bDept.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await prisma.department.findUnique({ where: { id: bDept.id } })).not.toBeNull();
  });
});

describe("구성원 관리", () => {
  beforeEach(resetDb);

  it("합격자를 직원으로 전환하고 부서를 배정한다", async () => {
    const { a } = await twoCompanies();
    const dept = await makeDept(a.company.id, "개발팀");
    const { ctx } = await addMember(a.company, "PRE_HIRE");
    const m = await updateMember(a.adminCtx, { membershipId: ctx.membershipId, role: "EMPLOYEE", status: "ACTIVE", departmentId: dept.id });
    expect(m.role).toBe("EMPLOYEE");
    expect(m.departmentId).toBe(dept.id);
    expect(await prisma.auditLog.count({ where: { action: "member.update" } })).toBe(1);
  });

  it("다른 회사의 부서 ID 를 배정할 수 없다", async () => {
    const { a, b } = await twoCompanies();
    const bDept = await makeDept(b.company.id);
    const { ctx } = await addMember(a.company, "EMPLOYEE");
    await expect(
      updateMember(a.adminCtx, { membershipId: ctx.membershipId, role: "EMPLOYEE", status: "ACTIVE", departmentId: bDept.id }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("다른 회사 구성원은 수정할 수 없다(404)", async () => {
    const { a, b } = await twoCompanies();
    const bEmp = await addMember(b.company, "EMPLOYEE");
    await expect(
      updateMember(a.adminCtx, { membershipId: bEmp.ctx.membershipId, role: "COMPANY_ADMIN", status: "ACTIVE" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("마지막 관리자는 강등·정지할 수 없지만, 관리자가 둘이면 가능하다", async () => {
    const { a } = await twoCompanies();
    const self = { membershipId: a.adminCtx.membershipId, status: "ACTIVE" };
    await expect(updateMember(a.adminCtx, { ...self, role: "EMPLOYEE" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(updateMember(a.adminCtx, { ...self, role: "COMPANY_ADMIN", status: "SUSPENDED" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await addMember(a.company, "COMPANY_ADMIN");
    await expect(updateMember(a.adminCtx, { ...self, role: "EMPLOYEE" })).resolves.toMatchObject({ role: "EMPLOYEE" });
  });

  it("감사 로그는 자기 회사 기록만 보이고, 관리자만 볼 수 있다", async () => {
    const { a, b } = await twoCompanies();
    await createDepartment(a.adminCtx, { name: "A팀" });
    await createDepartment(b.adminCtx, { name: "B팀" });
    const logs = await listAuditLogs(a.adminCtx);
    expect(logs.map((l) => l.companyId)).toEqual([a.company.id]);
    const trainer = await addMember(a.company, "TRAINER");
    await expect(listAuditLogs(trainer.ctx)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("직원은 구성원 목록을 보거나 자신을 관리자로 올릴 수 없다", async () => {
    const { a } = await twoCompanies();
    const emp = await addMember(a.company, "EMPLOYEE");
    await expect(listMembers(emp.ctx)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      updateMember(emp.ctx, { membershipId: emp.ctx.membershipId, role: "COMPANY_ADMIN", status: "ACTIVE" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
