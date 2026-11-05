import { Prisma } from "@prisma/client";
import { prisma } from "./db";

/**
 * 회사(테넌트) 소속 데이터를 담는 모델 목록.
 * 이 모델들은 tenantDb() 를 통해서만 조회/수정한다.
 */
export const TENANT_MODELS = new Set<string>([
  "Department",
  "PositionLevel",
  "Membership",
  "HireInvite",
  "Document",
  "DocumentAccessRule",
  "AiArtifact",
  "Quiz",
  "QuizQuestion",
  "QuizAttempt",
  "LearningProgress",
  "JobPosting",
  "JobApplication",
  "AuditLog",
]);

const WHERE_OPS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(`[tenant-isolation] ${message}`);
    this.name = "TenantIsolationError";
  }
}

type Rec = Record<string, unknown>;

function scopeWhere(where: unknown, companyId: string): Rec {
  const w = (where ?? {}) as Rec;
  if ("companyId" in w && w.companyId !== companyId) {
    throw new TenantIsolationError("다른 회사의 companyId 로 조회를 시도했습니다.");
  }
  return { ...w, companyId };
}

function scopeData(data: unknown, companyId: string): Rec {
  const d = (data ?? {}) as Rec;
  if ("company" in d) {
    throw new TenantIsolationError("company 관계 연결은 허용되지 않습니다. companyId 는 자동으로 설정됩니다.");
  }
  if ("companyId" in d && d.companyId !== companyId) {
    throw new TenantIsolationError("다른 회사의 companyId 로 데이터를 생성할 수 없습니다.");
  }
  return { ...d, companyId };
}

function guardUpdateData(data: unknown) {
  const d = (data ?? {}) as Rec;
  if ("companyId" in d || "company" in d) {
    throw new TenantIsolationError("companyId 는 변경할 수 없습니다.");
  }
}

/**
 * 특정 회사로 범위가 고정된 Prisma 클라이언트를 반환한다.
 * - 모든 조회/수정/삭제의 where 에 companyId 가 강제로 추가된다.
 * - 생성 시 companyId 가 자동 설정되며, 다른 값이면 예외가 발생한다.
 * - 중첩 쓰기(nested create)는 자동 처리되지 않으므로 서비스에서 companyId 를 명시해야 한다.
 */
export function tenantDb(companyId: string) {
  if (!companyId) throw new TenantIsolationError("companyId 가 비어 있습니다.");

  return prisma.$extends({
    name: `tenant:${companyId}`,
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) return query(args);
          const a = (args ?? {}) as Rec;

          if (WHERE_OPS.has(operation)) {
            a.where = scopeWhere(a.where, companyId);
            if (operation === "update" || operation === "updateMany") guardUpdateData(a.data);
          } else if (operation === "create") {
            a.data = scopeData(a.data, companyId);
          } else if (operation === "createMany" || operation === "createManyAndReturn") {
            const list = Array.isArray(a.data) ? a.data : [a.data];
            a.data = list.map((d) => scopeData(d, companyId));
          } else if (operation === "upsert") {
            a.where = scopeWhere(a.where, companyId);
            a.create = scopeData(a.create, companyId);
            guardUpdateData(a.update);
          } else {
            throw new TenantIsolationError(`지원하지 않는 연산입니다: ${operation}`);
          }
          return query(a as typeof args);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantDb>;

/** 서비스 계층 트랜잭션 등에서 사용하기 위한 타입 재노출 */
export type { Prisma };
