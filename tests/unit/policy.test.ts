import { describe, expect, it } from "vitest";
import { ACTIONS, can, type Action } from "@/server/authz/policy";
import type { MemberRole } from "@prisma/client";

/** 기대 권한 매트릭스 — docs/ARCHITECTURE.md 의 표와 동일해야 한다. */
const EXPECTED: Record<MemberRole, Action[]> = {
  COMPANY_ADMIN: [...ACTIONS],
  TRAINER: ["document:upload", "document:review", "document:viewAll", "ai:generate", "ai:review", "learning:access", "progress:viewAll"],
  EMPLOYEE: ["learning:access"],
  PRE_HIRE: ["learning:access"],
};

describe("역할별 권한 매트릭스", () => {
  for (const role of Object.keys(EXPECTED) as MemberRole[]) {
    for (const action of ACTIONS) {
      const allowed = EXPECTED[role].includes(action);
      it(`${role} → ${action}: ${allowed ? "허용" : "거부"}`, () => {
        expect(can({ role }, action)).toBe(allowed);
      });
    }
  }

  it("알 수 없는 역할은 모두 거부한다", () => {
    expect(can({ role: "HACKER" as MemberRole }, "learning:access")).toBe(false);
  });
});
