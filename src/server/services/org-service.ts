import { Prisma } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { authorize } from "../authz/policy";
import type { TenantContext } from "../authz/context";
import { conflict, invalid, notFound } from "@/lib/errors";
import { parseInput } from "@/lib/validation/parse";
import { departmentSchema, positionLevelSchema } from "@/lib/validation/org";
import { writeAudit } from "./audit-service";

function uniqueGuard(e: unknown, msg: string): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw conflict(msg);
  throw e;
}

export async function listDepartments(ctx: TenantContext) {
  return tenantDb(ctx.companyId).department.findMany({ orderBy: { name: "asc" } });
}

export async function listPositionLevels(ctx: TenantContext) {
  return tenantDb(ctx.companyId).positionLevel.findMany({ orderBy: { rank: "asc" } });
}

export async function createDepartment(ctx: TenantContext, raw: unknown) {
  authorize(ctx, "org:manage");
  const { name } = parseInput(departmentSchema, raw);
  try {
    const d = await tenantDb(ctx.companyId).department.create({ data: { companyId: ctx.companyId, name } });
    await writeAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "department.create", targetType: "Department", targetId: d.id });
    return d;
  } catch (e) {
    uniqueGuard(e, "이미 있는 부서명입니다.");
  }
}

export async function deleteDepartment(ctx: TenantContext, id: string) {
  authorize(ctx, "org:manage");
  const db = tenantDb(ctx.companyId);
  const d = await db.department.findUnique({ where: { id } });
  if (!d) throw notFound();
  await db.department.delete({ where: { id } });
  await writeAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "department.delete", targetType: "Department", targetId: id, metadata: { name: d.name } });
}

export async function createPositionLevel(ctx: TenantContext, raw: unknown) {
  authorize(ctx, "org:manage");
  const input = parseInput(positionLevelSchema, raw);
  try {
    const l = await tenantDb(ctx.companyId).positionLevel.create({ data: { companyId: ctx.companyId, ...input } });
    await writeAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "level.create", targetType: "PositionLevel", targetId: l.id });
    return l;
  } catch (e) {
    uniqueGuard(e, "이미 있는 직급명입니다.");
  }
}

export async function deletePositionLevel(ctx: TenantContext, id: string) {
  authorize(ctx, "org:manage");
  const db = tenantDb(ctx.companyId);
  const l = await db.positionLevel.findUnique({ where: { id } });
  if (!l) throw notFound();
  await db.positionLevel.delete({ where: { id } });
  await writeAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "level.delete", targetType: "PositionLevel", targetId: id, metadata: { name: l.name } });
}

/**
 * 입력으로 받은 부서·직급 ID 가 이 회사 소속인지 확인한다.
 * 다른 회사 ID 를 끼워 넣는 공격을 막기 위해 모든 서비스에서 사용한다.
 */
export async function assertOrgRefs(ctx: TenantContext, refs: { departmentId?: string | null; positionLevelId?: string | null }) {
  const db = tenantDb(ctx.companyId);
  if (refs.departmentId && !(await db.department.findUnique({ where: { id: refs.departmentId } }))) {
    throw invalid("존재하지 않는 부서입니다.");
  }
  if (refs.positionLevelId && !(await db.positionLevel.findUnique({ where: { id: refs.positionLevelId } }))) {
    throw invalid("존재하지 않는 직급입니다.");
  }
}
