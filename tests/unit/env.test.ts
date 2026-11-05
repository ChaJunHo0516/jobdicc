import { afterEach, describe, expect, it } from "vitest";
import { env, resetEnvCache } from "@/lib/env";

describe("환경변수 검증", () => {
  const original = process.env.SESSION_SECRET;
  afterEach(() => {
    process.env.SESSION_SECRET = original;
    resetEnvCache();
  });

  it("SESSION_SECRET 이 짧으면 시작을 거부한다", () => {
    process.env.SESSION_SECRET = "short";
    resetEnvCache();
    expect(() => env()).toThrow(/SESSION_SECRET/);
  });

  it("AI_PROVIDER 기본값은 mock 이다", () => {
    resetEnvCache();
    expect(env().AI_PROVIDER).toBe("mock");
  });
});
