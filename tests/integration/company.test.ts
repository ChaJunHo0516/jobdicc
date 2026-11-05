import { beforeEach, describe, expect, it } from "vitest";
import {
  listCompaniesForPlatform,
  listMyCompanies,
  requestCompany,
  setCompanyStatus,
} from "@/server/services/company-service";
import { resolveTenantContext } from "@/server/authz/context";
import { createUser } from "../helpers/factories";
import { resetDb } from "../helpers/test-db";

describe("회사 개설 신청과 승인", () => {
  beforeEach(resetDb);

  it("신청한 회사는 승인 전까지 열리지 않고, 승인 후 신청자가 관리자가 된다", async () => {
    const owner = await createUser();
    const sa = await createUser({ superAdmin: true });
    const c = await requestCompany(owner.id, { name: "감마소프트", slug: "gamma-soft" });
    expect(c.status).toBe("PENDING");
    await expect(resolveTenantContext(owner.id, "gamma-soft")).rejects.toMatchObject({ code: "NOT_FOUND" });

    await setCompanyStatus(sa, c.id, "ACTIVE");
    const ctx = await resolveTenantContext(owner.id, "gamma-soft");
    expect(ctx.role).toBe("COMPANY_ADMIN");
    expect((await listMyCompanies(owner.id))[0].company.status).toBe("ACTIVE");
  });

  it("중복·예약어·형식 오류 주소를 거부한다", async () => {
    const u = await createUser();
    await requestCompany(u.id, { name: "감마소프트", slug: "gamma" });
    await expect(requestCompany(u.id, { name: "다른회사", slug: "gamma" })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(requestCompany(u.id, { name: "다른회사", slug: "admin" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(requestCompany(u.id, { name: "다른회사", slug: "Bad Slug!" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("일반 사용자는 회사를 승인하거나 목록을 볼 수 없다", async () => {
    const u = await createUser();
    const c = await requestCompany(u.id, { name: "감마소프트", slug: "gamma" });
    await expect(setCompanyStatus(u, c.id, "ACTIVE")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(listCompaniesForPlatform(u)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("허용되지 않는 상태 전이를 거부한다", async () => {
    const u = await createUser();
    const sa = await createUser({ superAdmin: true });
    const c = await requestCompany(u.id, { name: "감마소프트", slug: "gamma" });
    await setCompanyStatus(sa, c.id, "REJECTED");
    await expect(setCompanyStatus(sa, c.id, "ACTIVE")).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
